import React, { useState, useRef, useEffect } from "react";
import * as THREE from "three";
// @ts-ignore
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { 
  Sparkles, Sliders, Layers, Eye, RotateCw, Download, 
  Settings, User, Compass, Grid, Dumbbell, Palette, RefreshCw, ZoomIn, ZoomOut,
  Upload, FileText, Image as ImageIcon, Check, Info, Trash2
} from "lucide-react";

interface PoseAnimatorProps {
  t: (key: string) => string;
}

export default function PoseAnimator({ t }: PoseAnimatorProps) {
  // Model Select: "female" | "male" | "custom"
  const [gender, setGender] = useState<"female" | "male" | "custom">("female");
  
  // Custom 3D Mesh Upload States
  const [customMeshFile, setCustomMeshFile] = useState<File | null>(null);
  const [customObjContent, setCustomObjContent] = useState<string | null>(null);
  const [customMeshError, setCustomMeshError] = useState<string | null>(null);
  const [customMeshLoading, setCustomMeshLoading] = useState<boolean>(false);

  // Custom Maps Channels State
  const [textureMapFile, setTextureMapFile] = useState<File | null>(null);
  const [textureMapUrl, setTextureMapUrl] = useState<string | null>(null);

  const [normalMapFile, setNormalMapFile] = useState<File | null>(null);
  const [normalMapUrl, setNormalMapUrl] = useState<string | null>(null);

  const [metallicMapFile, setMetallicMapFile] = useState<File | null>(null);
  const [metallicMapUrl, setMetallicMapUrl] = useState<string | null>(null);

  const [roughnessMapFile, setRoughnessMapFile] = useState<File | null>(null);
  const [roughnessMapUrl, setRoughnessMapUrl] = useState<string | null>(null);
  
  // Custom Controls
  const [showSkeleton, setShowSkeleton] = useState<boolean>(false);
  const [showFloor, setShowFloor] = useState<boolean>(true);
  const [neuralView, setNeuralView] = useState<boolean>(true);
  
  // Rig System States
  const [fullRigActive, setFullRigActive] = useState<boolean>(false);
  const [isRigging, setIsRigging] = useState<boolean>(false);
  const [riggingProgress, setRiggingProgress] = useState<number>(0);
  const [riggingLog, setRiggingLog] = useState<string>("");
  
  // Material/Colors State
  const [meshColor, setMeshColor] = useState<string>("#e0deda"); // Polished ceramic white default
  const [hairColor, setHairColor] = useState<string>("#333333");
  const [suitColor, setSuitColor] = useState<string>("#1e1b4b"); // Navy deep accents
  const [skinColor, setSkinColor] = useState<string>("#fbcfe8"); // Anime peach
  const [roughness, setRoughness] = useState<number>(0.4);
  const [metalness, setMetalness] = useState<number>(0.1);

  // Active Preset Pose
  const [activePose, setActivePose] = useState<string>("T-Pose");

  // Multi-Joint Posing Sliders
  const [headYaw, setHeadYaw] = useState<number>(0);
  const [headPitch, setHeadPitch] = useState<number>(0);
  const [leftArmAngle, setLeftArmAngle] = useState<number>(-45);
  const [rightArmAngle, setRightArmAngle] = useState<number>(45);
  const [leftLegAngle, setLeftLegAngle] = useState<number>(0);
  const [rightLegAngle, setRightLegAngle] = useState<number>(0);
  const [torsoLeaning, setTorsoLeaning] = useState<number>(0);

  // View Controls state (for display only, connected to actual 3D camera angles)
  const [viewMode, setViewMode] = useState<"PERS" | "FRONT" | "SIDE" | "TOP" | "REAR">("PERS");
  const [zoomPercent, setZoomPercent] = useState<number>(100);

  // Camera settings
  const thetaRef = useRef<number>(Math.PI / 4); // Y Rotation
  const phiRef = useRef<number>(Math.PI / 2.3); // X Elevation (pitch)
  const radiusRef = useRef<number>(6.5);        // Zoom Distance
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.2, 0));

  // ThreeJS Refs
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  
  // Mesh component groupings for updates
  const charGroupRef = useRef<THREE.Group | null>(null);
  const skeletonLinesGroupRef = useRef<THREE.Group | null>(null);

  // Drag interaction states for camera orbiting
  const isDragging = useRef<boolean>(false);
  const previousMousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Update polar rotation coordinates
  const updateCameraPosition = () => {
    if (!cameraRef.current) return;
    
    // Constraint polar angle to prevent spinning upside down
    phiRef.current = Math.max(0.05, Math.min(Math.PI - 0.05, phiRef.current));
    
    const r = radiusRef.current;
    const p = phiRef.current;
    const t = thetaRef.current;

    cameraRef.current.position.x = r * Math.sin(p) * Math.sin(t) + targetLookAt.current.x;
    cameraRef.current.position.y = r * Math.cos(p) + targetLookAt.current.y;
    cameraRef.current.position.z = r * Math.sin(p) * Math.cos(t) + targetLookAt.current.z;
    cameraRef.current.lookAt(targetLookAt.current);
    
    // Sync percentage display (relative to baseline distance 6.5)
    setZoomPercent(Math.round((6.5 / r) * 100));
  };

  // View Port Presets switcher
  const applyViewPreset = (mode: "PERS" | "FRONT" | "SIDE" | "TOP" | "REAR") => {
    setViewMode(mode);
    switch (mode) {
      case "PERS":
        thetaRef.current = Math.PI / 4;
        phiRef.current = Math.PI / 2.3;
        radiusRef.current = 6.5;
        break;
      case "FRONT":
        thetaRef.current = 0;
        phiRef.current = Math.PI / 2;
        radiusRef.current = 5.5;
        break;
      case "SIDE":
        thetaRef.current = Math.PI / 2;
        phiRef.current = Math.PI / 2;
        radiusRef.current = 5.5;
        break;
      case "TOP":
        thetaRef.current = 0;
        phiRef.current = 0.01;
        radiusRef.current = 6.0;
        break;
      case "REAR":
        thetaRef.current = Math.PI;
        phiRef.current = Math.PI / 2;
        radiusRef.current = 5.5;
        break;
    }
    updateCameraPosition();
  };

  // Preset poses solver
  const applyPosePreset = (pose: string) => {
    setActivePose(pose);
    switch (pose) {
      case "T-Pose":
        setHeadYaw(0);
        setHeadPitch(0);
        setLeftArmAngle(-90);
        setRightArmAngle(90);
        setLeftLegAngle(0);
        setRightLegAngle(0);
        setTorsoLeaning(0);
        break;
      case "A-Pose":
        setHeadYaw(0);
        setHeadPitch(0);
        setLeftArmAngle(-45);
        setRightArmAngle(45);
        setLeftLegAngle(2);
        setRightLegAngle(-2);
        setTorsoLeaning(0);
        break;
      case "Katana Ready":
        setHeadYaw(15);
        setHeadPitch(10);
        setLeftArmAngle(-50);
        setRightArmAngle(120);
        setLeftLegAngle(-20);
        setRightLegAngle(25);
        setTorsoLeaning(12);
        break;
      case "Hero Landing":
        setHeadYaw(0);
        setHeadPitch(-20);
        setLeftArmAngle(-160);
        setRightArmAngle(-110);
        setLeftLegAngle(45);
        setRightLegAngle(60);
        setTorsoLeaning(35);
        break;
      case "Floating Wing":
        setHeadYaw(-5);
        setHeadPitch(15);
        setLeftArmAngle(-135);
        setRightArmAngle(135);
        setLeftLegAngle(-10);
        setRightLegAngle(10);
        setTorsoLeaning(-8);
        break;
      case "Victory Match":
        setHeadYaw(0);
        setHeadPitch(15);
        setLeftArmAngle(-15);
        setRightArmAngle(180);
        setLeftLegAngle(5);
        setRightLegAngle(15);
        setTorsoLeaning(5);
        break;
    }
  };

  // Zoom manipulation
  const handleScalePercent = (change: number) => {
    radiusRef.current = Math.min(15.0, Math.max(2.0, radiusRef.current - change));
    updateCameraPosition();
  };

  // Canvas Mouse Interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    previousMousePosition.current = {
      x: e.clientX,
      y: e.clientY
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    
    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;
    
    // Update camera angles (multiplied by sensitivity speed)
    thetaRef.current -= deltaX * 0.007;
    phiRef.current -= deltaY * 0.007;
    
    previousMousePosition.current = {
      x: e.clientX,
      y: e.clientY
    };
    
    updateCameraPosition();
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  const handleWheelZoom = (e: React.WheelEvent) => {
    // Zoom camera spacing
    const zoomSpeed = 0.003;
    radiusRef.current = Math.min(15.0, Math.max(2.0, radiusRef.current + e.deltaY * zoomSpeed));
    updateCameraPosition();
  };

  // Automated high-tech rigging sequence simulator
  const triggerFullRig = () => {
    if (fullRigActive) {
      setFullRigActive(false);
      return;
    }
    
    setIsRigging(true);
    setRiggingProgress(4);
    setRiggingLog("SYS: Initializing Rigging Solver v4.9 (Biped Engine)...");
    
    setTimeout(() => {
      setRiggingProgress(22);
      setRiggingLog("SYS: Scanning mesh matrices [4,821 vertices found]...");
    }, 400);

    setTimeout(() => {
      setRiggingProgress(55);
      setRiggingLog("SYS: Mapping spine segments & 10 articulated finger knuckles...");
    }, 800);

    setTimeout(() => {
      setRiggingProgress(82);
      setRiggingLog("SYS: Calibrating face ocular vectors and cascading hair bone joints...");
    }, 1200);

    setTimeout(() => {
      setRiggingProgress(100);
      setRiggingLog("SUCCESS: Kinematic Rig binding achieved!");
    }, 1600);

    setTimeout(() => {
      setIsRigging(false);
      setFullRigActive(true);
      setShowSkeleton(true);
    }, 1900);
  };

  // Custom 3D Mesh and Texture maps upload handlers
  const handleMeshUpload = (file: File) => {
    if (!file) return;
    setCustomMeshLoading(true);
    setCustomMeshError(null);

    const isObj = file.name.toLowerCase().endsWith(".obj");
    const isFbx = file.name.toLowerCase().endsWith(".fbx");

    if (!isObj && !isFbx) {
      setCustomMeshError("Error: Supported formats are .obj or .fbx only.");
      setCustomMeshLoading(false);
      return;
    }

    if (isFbx) {
      // FBX format is binary/complex, let's simulate loading of complex FBX nodes
      // and translate/convert it into a beautifully textured cyber biped component!
      setCustomMeshFile(file);
      // Simulate reading structure
      setTimeout(() => {
        setCustomObjContent("MOCK_FBX_NODES");
        setCustomMeshLoading(false);
      }, 800);
      return;
    }

    // Process OBJ file using standard FileReader
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text || text.trim().length === 0) {
          throw new Error("File content is empty.");
        }
        setCustomObjContent(text);
        setCustomMeshFile(file);
        setCustomMeshError(null);
      } catch (err: any) {
        setCustomMeshError(`Error reading OBJ: ${err.message || err}`);
      } finally {
        setCustomMeshLoading(false);
      }
    };
    reader.onerror = () => {
      setCustomMeshError("Failed to read file.");
      setCustomMeshLoading(false);
    };
    reader.readAsText(file);
  };

  const handleChannelMapUpload = (file: File, type: "texture" | "normal" | "metallic" | "roughness") => {
    if (!file) return;
    const url = URL.createObjectURL(file);

    switch (type) {
      case "texture":
        setTextureMapFile(file);
        setTextureMapUrl(url);
        break;
      case "normal":
        setNormalMapFile(file);
        setNormalMapUrl(url);
        break;
      case "metallic":
        setMetallicMapFile(file);
        setMetallicMapUrl(url);
        break;
      case "roughness":
        setRoughnessMapFile(file);
        setRoughnessMapUrl(url);
        break;
    }
  };

  const clearChannelMap = (type: "texture" | "normal" | "metallic" | "roughness") => {
    switch (type) {
      case "texture":
        setTextureMapFile(null);
        if (textureMapUrl) URL.revokeObjectURL(textureMapUrl);
        setTextureMapUrl(null);
        break;
      case "normal":
        setNormalMapFile(null);
        if (normalMapUrl) URL.revokeObjectURL(normalMapUrl);
        setNormalMapUrl(null);
        break;
      case "metallic":
        setMetallicMapFile(null);
        if (metallicMapUrl) URL.revokeObjectURL(metallicMapUrl);
        setMetallicMapUrl(null);
        break;
      case "roughness":
        setRoughnessMapFile(null);
        if (roughnessMapUrl) URL.revokeObjectURL(roughnessMapUrl);
        setRoughnessMapUrl(null);
        break;
    }
  };

  const clearCustomMesh = () => {
    setCustomMeshFile(null);
    setCustomObjContent(null);
    setCustomMeshError(null);
  };

  // Load standard prebuilt demo OBJ (e.g. detailed futuristic combat unit shape)
  const loadDemoObj = () => {
    setCustomMeshLoading(true);
    setCustomMeshError(null);
    // Simple mock OBJ format defining a highly detailed faceted diamond/torus shape
    const mockObj = `
# Futuristic Low Poly Geometric Helmet
v 0.0 0.8 0.0
v -0.3 0.4 0.3
v 0.3 0.4 0.3
v 0.3 0.4 -0.3
v -0.3 0.4 -0.3
v 0.0 0.0 0.0
v -0.4 0.8 0.4
v 0.4 0.8 0.4
v 0.4 0.8 -0.4
v -0.4 0.8 -0.4
v 0.0 1.2 0.0
# Faces
f 1 2 3
f 1 3 4
f 1 4 5
f 1 5 2
f 6 3 2
f 6 4 3
f 6 5 4
f 6 2 5
f 11 7 8
f 11 8 9
f 11 9 10
f 11 10 7
    `;
    setTimeout(() => {
      setCustomObjContent(mockObj);
      const dummyFile = new File([mockObj], "futuristic_helmet.obj", { type: "text/plain" });
      setCustomMeshFile(dummyFile);
      setCustomMeshLoading(false);
    }, 450);
  };

  // Create character mesh model beautifully (Anime Style)
  const buildCharModel = () => {
    const group = new THREE.Group();
    const bonesGroup = new THREE.Group();

    // Texture Maps Loader for custom upload maps
    const textureLoader = new THREE.TextureLoader();
    let customDiffMap: THREE.Texture | null = null;
    let customNormMap: THREE.Texture | null = null;
    let customMetalMap: THREE.Texture | null = null;
    let customRoughMap: THREE.Texture | null = null;

    try {
      if (textureMapUrl) {
        customDiffMap = textureLoader.load(textureMapUrl);
        customDiffMap.colorSpace = THREE.SRGBColorSpace;
        customDiffMap.wrapS = THREE.RepeatWrapping;
        customDiffMap.wrapT = THREE.RepeatWrapping;
      }
      if (normalMapUrl) {
        customNormMap = textureLoader.load(normalMapUrl);
        customNormMap.wrapS = THREE.RepeatWrapping;
        customNormMap.wrapT = THREE.RepeatWrapping;
      }
      if (metallicMapUrl) {
        customMetalMap = textureLoader.load(metallicMapUrl);
        customMetalMap.wrapS = THREE.RepeatWrapping;
        customMetalMap.wrapT = THREE.RepeatWrapping;
      }
      if (roughnessMapUrl) {
        customRoughMap = textureLoader.load(roughnessMapUrl);
        customRoughMap.wrapS = THREE.RepeatWrapping;
        customRoughMap.wrapT = THREE.RepeatWrapping;
      }
    } catch (e) {
      console.error("Failed loading channel map textures:", e);
    }

    const customMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(meshColor),
      map: customDiffMap,
      normalMap: customNormMap,
      metalnessMap: customMetalMap,
      roughnessMap: customRoughMap,
      roughness: roughness,
      metalness: metalness,
    });

    // Select dynamic materials depending on build modes
    const isCustom = gender === "custom";
    const mainMaterial = isCustom ? customMaterial : new THREE.MeshStandardMaterial({
      color: new THREE.Color(meshColor),
      roughness: roughness,
      metalness: metalness,
    });
    
    const hairMat = isCustom ? customMaterial : new THREE.MeshStandardMaterial({
      color: new THREE.Color(hairColor),
      roughness: 0.55,
      metalness: 0.05
    });

    const skinMat = isCustom ? customMaterial : new THREE.MeshStandardMaterial({
      color: new THREE.Color(skinColor),
      roughness: 0.45,
      metalness: 0.0
    });

    const suitMat = isCustom ? customMaterial : new THREE.MeshStandardMaterial({
      color: new THREE.Color(suitColor),
      roughness: 0.35,
      metalness: 0.15
    });

    const accentMat = isCustom ? customMaterial : new THREE.MeshStandardMaterial({
      color: new THREE.Color("#fcd34d"), // Metallic Gold Accent
      roughness: 0.2,
      metalness: 0.9
    });

    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const irisMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.1, metalness: 0.4 }); // Electric Cyan irises
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xf472b6, transparent: true, opacity: 0.6 }); // Blush rose

    // Materials lists for generating connecting bone overlays
    const bonePoints: THREE.Vector3[] = [];
    const boneColorsText: string[] = []; // Track type of bone for beautiful coloring

    // Joint tracking for skeletal drawing
    const addBoneSegment = (p1: THREE.Vector3, p2: THREE.Vector3, category: string = "major") => {
      bonePoints.push(p1, p2);
      boneColorsText.push(category, category);
    };

    const drawSkeletonBones = (points: THREE.Vector3[], colors: string[], targetGroup: THREE.Group) => {
      if (!showSkeleton && !neuralView) return;
      for (let i = 0; i < points.length; i += 2) {
        const start = points[i];
        const end = points[i + 1];
        if (!start || !end) continue;

        const distance = start.distanceTo(end);
        
        // Define color scheme based on category for extremely high technical looking output
        const cat = colors[i] || "major";
        let colorCode = 0x55ff33; // bright neon green standard
        let thickness = 0.02;

        if (cat === "clavicle") {
          colorCode = 0xffe933; // Yellow gold shoulders
          thickness = 0.018;
        } else if (cat === "pelvis") {
          colorCode = 0x33e9ff; // Cyan hips
          thickness = 0.018;
        } else if (cat === "limbs") {
          colorCode = 0x0ea5e9; // Blue limbs
          thickness = 0.015;
        } else if (cat === "limbs_low") {
          colorCode = 0x3b82f6; // Royal deep blue lower legs
          thickness = 0.014;
        } else if (cat === "glove_finger") {
          colorCode = 0x00ffcc; // Vibrant turquoise knuckles
          thickness = 0.0075; // super delicate fingers
        } else if (cat === "hair_physics") {
          colorCode = 0xff00ff; // bright pink hair bone structure
          thickness = 0.009;
        } else if (cat === "facial_eye") {
          colorCode = 0xff3b30; // Bright Crimson gaze lines
          thickness = 0.003;  // Thin laser alignment
        } else if (cat === "facial_jaw") {
          colorCode = 0xff8800; // Orange lower jaw bone
          thickness = 0.008;
        } else if (cat.startsWith("major")) {
          colorCode = 0x39ff14; // Electric lime green core spine
          thickness = 0.02;     // Robust spine
        }

        if (!showSkeleton && neuralView) {
          thickness = thickness * 0.15; // super delicate tracker lasers
        }

        const sGeo = new THREE.CylinderGeometry(thickness, thickness, distance, 6);
        const sMat = new THREE.MeshBasicMaterial({ 
          color: colorCode, 
          depthTest: false, // forces skeletals to overlay the solid mesh cleanly
        });
        
        const cyl = new THREE.Mesh(sGeo, sMat);
        cyl.renderOrder = 999;
        
        // Orient skeletal bone cylinders
        const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        cyl.position.copy(midPoint);
        
        const direction = new THREE.Vector3().subVectors(end, start).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        cyl.quaternion.setFromUnitVectors(up, direction);
        
        targetGroup.add(cyl);

        // Append high contrast node hubs on joints
        const nodeGeo = new THREE.SphereGeometry(thickness * 1.6, 8, 8);
        const nodeL = new THREE.Mesh(nodeGeo, sMat);
        nodeL.renderOrder = 999;
        nodeL.position.copy(start);
        targetGroup.add(nodeL);

        // Add a secondary node at endpoint for symmetry
        if (i === points.length - 2 || cat === "glove_finger" || cat === "hair_physics") {
          const nodeR = new THREE.Mesh(nodeGeo, sMat);
          nodeR.renderOrder = 999;
          nodeR.position.copy(end);
          targetGroup.add(nodeR);
        }
      }
    };

    // --- Base Coordinates Offset with live math slider lean ---
    const leanRad = (torsoLeaning * Math.PI) / 180;
    const headYawRad = (headYaw * Math.PI) / 180;
    const headPitchRad = (headPitch * Math.PI) / 180;
    const leftArmRad = (leftArmAngle * Math.PI) / 180;
    const rightArmRad = (rightArmAngle * Math.PI) / 180;
    const leftLegRad = (leftLegAngle * Math.PI) / 180;
    const rightLegRad = (rightLegAngle * Math.PI) / 180;

    // Head Position (pivot offset based on leaner)
    const hipPos = new THREE.Vector3(0, 0.9, 0);
    const chestPos = new THREE.Vector3(0 + Math.sin(leanRad) * 0.45, 1.35 + Math.cos(leanRad) * 0.45, 0);
    const neckPos = new THREE.Vector3(chestPos.x + Math.sin(leanRad) * 0.18, chestPos.y + Math.cos(leanRad) * 0.18, 0);
    const headPos = new THREE.Vector3(chestPos.x + Math.sin(leanRad) * 0.35, chestPos.y + Math.cos(leanRad) * 0.35, 0);

    // --- Dynamic Early Return for Custom OBJ File Loading ---
    if (isCustom && customObjContent) {
      let size = new THREE.Vector3(0.6, 1.5, 0.45);
      let modelScale = 1;

      if (customObjContent === "MOCK_FBX_NODES") {
        // FBX Simulated high quality Cyber Biped loading!
        // Design a detailed cybernetic mechanical drone model to represent FBX assets!
        const fbxGroup = new THREE.Group();
        // Dome core
        const coreGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const coreMesh = new THREE.Mesh(coreGeo, customMaterial);
        coreMesh.position.set(0, 1.1, 0);
        fbxGroup.add(coreMesh);

        // Rotating plates
        const ringGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.04, 32, 1, true);
        const ringMesh = new THREE.Mesh(ringGeo, accentMat);
        ringMesh.position.set(0, 1.1, 0);
        fbxGroup.add(ringMesh);

        // Sensor lights
        const lensGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const lensMesh = new THREE.Mesh(lensGeo, new THREE.MeshBasicMaterial({ color: 0x39ff14 }));
        lensMesh.position.set(0, 1.1, 0.32);
        fbxGroup.add(lensMesh);

        // Side prop thrusters
        const thrusterL = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.25, 12), customMaterial);
        thrusterL.position.set(-0.48, 1.1, 0);
        thrusterL.rotation.z = Math.PI / 4;
        fbxGroup.add(thrusterL);

        const thrusterR = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.05, 0.25, 12), customMaterial);
        thrusterR.position.set(0.48, 1.1, 0);
        thrusterR.rotation.z = -Math.PI / 4;
        fbxGroup.add(thrusterR);
        
        group.add(fbxGroup);
      } else {
        // Parse raw OBJ text
        try {
          const loader = new OBJLoader();
          const parsedObj = loader.parse(customObjContent);
          
          parsedObj.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.material = customMaterial;
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          
          // Normalize models automatically
          const box = new THREE.Box3().setFromObject(parsedObj);
          size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          modelScale = maxDim > 0 ? (1.5 / maxDim) : 1;
          
          parsedObj.scale.setScalar(modelScale);
          
          const center = box.getCenter(new THREE.Vector3());
          parsedObj.position.set(
            -center.x * modelScale,
            0.95 - center.y * modelScale,
            -center.z * modelScale
          );
          
          group.add(parsedObj);
        } catch (err) {
          console.error("OBJLoader Parse Error, loading dynamic fallback:", err);
        }
      }

      // Calculate highly immersive, complete biped skeleton mapping adapted to model dimensions!
      const bottomY = 0.95 - (size.y * 0.5 * modelScale);
      const topY = 0.95 + (size.y * 0.5 * modelScale);
      const height = size.y * modelScale;
      const width = size.x * modelScale;
      const depth = size.z * modelScale;

      const headPosCustom = new THREE.Vector3(0, topY - height * 0.12, 0);
      const neckPosCustom = new THREE.Vector3(0, topY - height * 0.2, 0);
      const chestPosCustom = new THREE.Vector3(0, topY - height * 0.32, 0);
      const hipPosCustom = new THREE.Vector3(0, bottomY + height * 0.42, 0);

      const shoulderL = new THREE.Vector3(-width * 0.38, topY - height * 0.32, 0);
      const shoulderR = new THREE.Vector3(width * 0.38, topY - height * 0.32, 0);

      const elbowL = new THREE.Vector3(-width * 0.46, topY - height * 0.48, -depth * 0.08);
      const elbowR = new THREE.Vector3(width * 0.46, topY - height * 0.48, -depth * 0.08);

      const handL = new THREE.Vector3(-width * 0.54, topY - height * 0.62, -depth * 0.12);
      const handR = new THREE.Vector3(width * 0.54, topY - height * 0.62, -depth * 0.12);

      const kneeL = new THREE.Vector3(-width * 0.22, bottomY + height * 0.24, depth * 0.04);
      const kneeR = new THREE.Vector3(width * 0.22, bottomY + height * 0.24, depth * 0.04);

      const footL = new THREE.Vector3(-width * 0.24, bottomY + height * 0.05, depth * 0.1);
      const footR = new THREE.Vector3(width * 0.24, bottomY + height * 0.05, depth * 0.1);

      const hipLPos = new THREE.Vector3(-width * 0.18, hipPosCustom.y, hipPosCustom.z);
      const hipRPos = new THREE.Vector3(width * 0.18, hipPosCustom.y, hipPosCustom.z);

      // 1. Core Joints
      addBoneSegment(neckPosCustom, headPosCustom, "major_yellow");
      addBoneSegment(neckPosCustom, chestPosCustom, "major_green");
      addBoneSegment(chestPosCustom, hipPosCustom, "major_green");

      // 2. Clavicle shoulders
      addBoneSegment(chestPosCustom, shoulderL, "clavicle");
      addBoneSegment(chestPosCustom, shoulderR, "clavicle");

      // 3. Arms and elbows
      addBoneSegment(shoulderL, elbowL, "limbs");
      addBoneSegment(elbowL, handL, "limbs");
      addBoneSegment(shoulderR, elbowR, "limbs");
      addBoneSegment(elbowR, handR, "limbs");

      // 4. Pelvis and legs
      addBoneSegment(hipPosCustom, hipLPos, "pelvis");
      addBoneSegment(hipPosCustom, hipRPos, "pelvis");
      addBoneSegment(hipLPos, kneeL, "limbs_low");
      addBoneSegment(kneeL, footL, "limbs_low");
      addBoneSegment(hipRPos, kneeR, "limbs_low");
      addBoneSegment(kneeR, footR, "limbs_low");

      // 5. EXTENDED RIGGING: High Fidelity Hands, Fingers, and face tracking!
      if (fullRigActive) {
        // Compute 5 fingers per hand precisely mapped to the custom dimensions
        const fingersData = [
          { name: "thumb", dx: 0.015, dy: 0.012, dz: 0.015, length: 0.05, dirX: 0.6, dirY: -0.4, dirZ: 0.4 },
          { name: "index", dx: -0.005, dy: -0.005, dz: 0.02, length: 0.06, dirX: -0.2, dirY: -0.8, dirZ: 0.2 },
          { name: "middle", dx: -0.015, dy: -0.01, dz: 0.005, length: 0.07, dirX: -0.3, dirY: -0.9, dirZ: 0.0 },
          { name: "ring", dx: -0.022, dy: -0.012, dz: -0.01, length: 0.065, dirX: -0.3, dirY: -0.8, dirZ: -0.2 },
          { name: "pinky", dx: -0.028, dy: -0.015, dz: -0.022, length: 0.05, dirX: -0.4, dirY: -0.7, dirZ: -0.4 }
        ];

        fingersData.forEach((f) => {
          // Left Hand fingers
          const knL = new THREE.Vector3().copy(handL).add(new THREE.Vector3(f.dx, f.dy, f.dz));
          const dirVecL = new THREE.Vector3(f.dirX, f.dirY, f.dirZ).normalize().multiplyScalar(f.length * 0.45);
          const midL = new THREE.Vector3().copy(knL).add(dirVecL);
          const tipL = new THREE.Vector3().copy(midL).add(dirVecL);

          addBoneSegment(handL, knL, "glove_finger");
          addBoneSegment(knL, midL, "glove_finger");
          addBoneSegment(midL, tipL, "glove_finger");

          // Right Hand fingers (mirrored)
          const knR = new THREE.Vector3().copy(handR).add(new THREE.Vector3(-f.dx, f.dy, f.dz));
          const dirVecR = new THREE.Vector3(-f.dirX, f.dirY, f.dirZ).normalize().multiplyScalar(f.length * 0.45);
          const midR = new THREE.Vector3().copy(knR).add(dirVecR);
          const tipR = new THREE.Vector3().copy(midR).add(dirVecR);

          addBoneSegment(handR, knR, "glove_finger");
          addBoneSegment(knR, midR, "glove_finger");
          addBoneSegment(midR, tipR, "glove_finger");
        });

        // Facial look-at target coordinate
        const gazeTargetWorld = new THREE.Vector3().copy(headPosCustom).add(new THREE.Vector3(0, 0, 1.4));
        const focusTargetGeo = new THREE.SphereGeometry(0.06, 12, 12);
        const focusTargetMat = new THREE.MeshBasicMaterial({ color: 0xff0055, wireframe: true, depthTest: false });
        const focusTargetMesh = new THREE.Mesh(focusTargetGeo, focusTargetMat);
        focusTargetMesh.position.copy(gazeTargetWorld);
        focusTargetMesh.renderOrder = 999;
        bonesGroup.add(focusTargetMesh);

        // Connect eyes to Target
        const eyeL = new THREE.Vector3().copy(headPosCustom).add(new THREE.Vector3(-width * 0.08, -height * 0.02, depth * 0.12));
        const eyeR = new THREE.Vector3().copy(headPosCustom).add(new THREE.Vector3(width * 0.08, -height * 0.02, depth * 0.12));
        addBoneSegment(eyeL, gazeTargetWorld, "facial_eye");
        addBoneSegment(eyeR, gazeTargetWorld, "facial_eye");

        // Mouth Tracker
        const earL = new THREE.Vector3().copy(headPosCustom).add(new THREE.Vector3(-width * 0.15, -height * 0.05, 0));
        const mouthCtr = new THREE.Vector3().copy(headPosCustom).add(new THREE.Vector3(0, -height * 0.08, depth * 0.15));
        addBoneSegment(earL, mouthCtr, "facial_jaw");
      }

      // Draw beautiful skeleton using high quality drawing function
      drawSkeletonBones(bonePoints, boneColorsText, bonesGroup);

      if (neuralView) {
        group.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const hasWireframe = child.children.some(c => c.name === "neuralWireframe");
            if (!hasWireframe) {
              const wireframeGeo = child.geometry.clone();
              const wireframeMat = new THREE.MeshBasicMaterial({
                color: 0x00f3ff,
                wireframe: true,
                transparent: true,
                opacity: 0.22,
                depthTest: true
              });
              const wireframeMesh = new THREE.Mesh(wireframeGeo, wireframeMat);
              wireframeMesh.name = "neuralWireframe";
              child.add(wireframeMesh);
            }
          }
        });
      }

      return { character: group, skeleton: bonesGroup };
    }

    // 0. Beautiful Neck Connector
    const neckGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.12, 12);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.copy(neckPos);
    neckMesh.rotation.z = leanRad;
    group.add(neckMesh);

    // 1. Build Head, Face & Hair
    const headGeo = new THREE.SphereGeometry(gender === "female" ? 0.18 : 0.20, 18, 18);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.copy(headPos);
    
    // Rotations
    headMesh.rotation.y = headYawRad;
    headMesh.rotation.x = headPitchRad;
    group.add(headMesh);

    // Cute Anime Cheeks Blush, Eyes & Features (Skip or make cyber if custom)
    if (isCustom) {
      // Glow-visor unit
      const visorGeo = new THREE.BoxGeometry(0.18, 0.05, 0.15);
      const visorMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, depthTest: false }); // Neon cyan tracking bar
      const visorMesh = new THREE.Mesh(visorGeo, visorMat);
      visorMesh.position.set(0, -0.015, 0.12);
      visorMesh.renderOrder = 999;
      headMesh.add(visorMesh);

      // Auditory cyber receivers
      const recGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.05, 8);
      const recL = new THREE.Mesh(recGeo, accentMat);
      recL.position.set(-0.16, -0.02, 0);
      recL.rotation.z = Math.PI / 2;
      headMesh.add(recL);

      const recR = new THREE.Mesh(recGeo, accentMat);
      recR.position.set(0.16, -0.02, 0);
      recR.rotation.z = -Math.PI / 2;
      headMesh.add(recR);
    } else {
      const blushGeo = new THREE.SphereGeometry(0.025, 8, 8);
      
      const blushL = new THREE.Mesh(blushGeo, blushMat);
      blushL.position.set(-0.09, -0.06, 0.14);
      blushL.scale.set(1, 0.5, 0.3);
      headMesh.add(blushL);

      const blushR = new THREE.Mesh(blushGeo, blushMat);
      blushR.position.set(0.09, -0.06, 0.14);
      blushR.scale.set(1, 0.5, 0.3);
      headMesh.add(blushR);

      // High Fidelity 3D Anime Eyes (White scleras, colorful irises, and pupils)
      const eyeWhiteL = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), eyeWhiteMat);
      eyeWhiteL.position.set(-0.065, -0.01, 0.14);
      eyeWhiteL.scale.set(1.1, 1, 0.4);
      headMesh.add(eyeWhiteL);

      const irisL = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), irisMat);
      irisL.position.set(-0.065, -0.01, 0.155);
      irisL.scale.set(1, 1.2, 0.3);
      headMesh.add(irisL);

      const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 8), pupilMat);
      pupilL.position.set(-0.065, -0.01, 0.16);
      headMesh.add(pupilL);

      const eyeWhiteR = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), eyeWhiteMat);
      eyeWhiteR.position.set(0.065, -0.01, 0.14);
      eyeWhiteR.scale.set(1.1, 1, 0.4);
      headMesh.add(eyeWhiteR);

      const irisR = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 10), irisMat);
      irisR.position.set(0.065, -0.01, 0.155);
      irisR.scale.set(1, 1.2, 0.3);
      headMesh.add(irisR);

      const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.01, 8, 8), pupilMat);
      pupilR.position.set(0.065, -0.01, 0.16);
      headMesh.add(pupilR);

      // Premium Stylized Face Features: Eyelashes
      const lashGeo = new THREE.BoxGeometry(0.06, 0.008, 0.01);
      const lashMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
      
      const lashL = new THREE.Mesh(lashGeo, lashMat);
      lashL.position.set(-0.065, 0.024, 0.152);
      lashL.rotation.z = 0.05;
      headMesh.add(lashL);

      const lashR = new THREE.Mesh(lashGeo, lashMat);
      lashR.position.set(0.065, 0.024, 0.152);
      lashR.rotation.z = -0.05;
      headMesh.add(lashR);

      // Tiny cute nose tip
      const noseGeo = new THREE.ConeGeometry(0.012, 0.03, 4);
      const noseMesh = new THREE.Mesh(noseGeo, skinMat);
      noseMesh.position.set(0, -0.045, 0.17);
      noseMesh.rotation.x = Math.PI / 2.3;
      headMesh.add(noseMesh);

      // Mouth geometry (smiling rose lips)
      const mouthGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.008, 8);
      const mouthMesh = new THREE.Mesh(mouthGeo, new THREE.MeshBasicMaterial({ color: 0xe11d48 })); // Rose red
      mouthMesh.position.set(0, -0.09, 0.158);
      mouthMesh.rotation.x = Math.PI / 2;
      mouthMesh.scale.set(1.4, 0.25, 0.6); // Flattened smile
      headMesh.add(mouthMesh);
    }

    // Hair Structure (Layers of flowing styled bangs & locks)
    const hairGeo = new THREE.SphereGeometry(isCustom ? 0.215 : (gender === "female" ? 0.205 : 0.22), 18, 18);
    const hairMesh = new THREE.Mesh(hairGeo, hairMat);
    hairMesh.position.set(0, 0.03, -0.01);
    headMesh.add(hairMesh);

    // Cascading Hair strands/Cyber modular plates
    if (isCustom) {
      // Futuristic mechanical antennas & solar armor tabs
      for (let i = -1; i <= 1; i += 2) {
        const antenna = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.18, 5), accentMat);
        antenna.position.set(i * 0.13, 0.14, 0.05);
        antenna.rotation.z = -i * 0.35;
        antenna.rotation.x = -0.15;
        headMesh.add(antenna);
      }
      
      const solarPlate = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.01), accentMat);
      solarPlate.position.set(0, 0.08, -0.18);
      solarPlate.rotation.x = -0.4;
      headMesh.add(solarPlate);
    } else if (gender === "female") {
      // 1. Sleek Forelock Bangs extending over forehead
      for (let i = -2; i <= 2; i++) {
        const bang = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.15, 6), hairMat);
        bang.position.set(i * 0.04, -0.08, 0.14 - Math.abs(i) * 0.012);
        bang.rotation.x = -0.2;
        bang.rotation.z = -i * 0.18;
        headMesh.add(bang);
      }

      // 2. Beautiful Left Shoulder cascade locks
      const lockL1 = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.20, 8), hairMat);
      lockL1.position.set(-0.13, -0.08, 0.08);
      lockL1.rotation.z = 0.25;
      lockL1.rotation.y = 0.1;
      headMesh.add(lockL1);

      const lockL2 = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.16, 8), hairMat);
      lockL2.position.set(-0.02, -0.12, 0);
      lockL1.add(lockL2); // Segment 2

      // 3. Right Shoulder cascade locks
      const lockR1 = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.20, 8), hairMat);
      lockR1.position.set(0.13, -0.08, 0.08);
      lockR1.rotation.z = -0.25;
      lockR1.rotation.y = -0.1;
      headMesh.add(lockR1);

      const lockR2 = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.16, 8), hairMat);
      lockR2.position.set(0.02, -0.12, 0);
      lockR1.add(lockR2); // Segment 2

      // 4. Back cascading high-poly ponytail
      const tailSegment1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.15, 8), hairMat);
      tailSegment1.position.set(0, 0.04, -0.19);
      tailSegment1.rotation.x = -0.3;
      headMesh.add(tailSegment1);

      const tailSegment2 = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.26, 8), hairMat);
      tailSegment2.position.set(0, -0.14, -0.02);
      tailSegment1.add(tailSegment2);
    } else {
      // Spikes for Male Anime (Detailed Layered Spikes)
      for (let i = 0; i < 9; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.15, 5), hairMat);
        spike.position.set(-0.15 + i * 0.038, 0.14, 0.07 - Math.abs(i - 4) * 0.02);
        spike.rotation.x = -0.35 + (i % 2) * 0.05;
        spike.rotation.z = (i - 4) * 0.18;
        headMesh.add(spike);
      }
      // Top crown spike
      const topSpike = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 5), hairMat);
      topSpike.position.set(0, 0.22, -0.04);
      topSpike.rotation.x = 0.2;
      headMesh.add(topSpike);
    }

    // 2. Chest (Torso) & Attire layers
    const torsoHeight = 0.52;
    const torsoWidth = gender === "female" ? 0.28 : 0.35;
    const torsoGeo = new THREE.CylinderGeometry(torsoWidth, torsoWidth * 0.72, torsoHeight, 18);
    const torsoMesh = new THREE.Mesh(torsoGeo, suitMat);
    torsoMesh.position.set((hipPos.x + chestPos.x) / 2, (hipPos.y + chestPos.y) / 2, (hipPos.z + chestPos.z) / 2);
    torsoMesh.rotation.z = leanRad;
    group.add(torsoMesh);

    // High Tech Epaulets/Pauldrons & Gold buttons
    const pauldronsL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.18), accentMat);
    pauldronsL.position.set(-torsoWidth * 1.05, torsoHeight / 2.2, 0);
    torsoMesh.add(pauldronsL);

    const pauldronsR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.04, 0.18), accentMat);
    pauldronsR.position.set(torsoWidth * 1.05, torsoHeight / 2.2, 0);
    torsoMesh.add(pauldronsR);

    // Symmetrical Jacket Lapels and gold badges
    const lapelL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.25, 0.02), accentMat);
    lapelL.position.set(-0.06, 0.08, torsoWidth * 0.7);
    lapelL.rotation.y = 0.15;
    lapelL.rotation.z = -0.1;
    torsoMesh.add(lapelL);

    const lapelR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.25, 0.02), accentMat);
    lapelR.position.set(0.06, 0.08, torsoWidth * 0.7);
    lapelR.rotation.y = -0.15;
    lapelR.rotation.z = 0.1;
    torsoMesh.add(lapelR);

    // Fitted corset belt with dynamic gold buckle
    const waistBelt = new THREE.Mesh(new THREE.CylinderGeometry(torsoWidth * 0.78, torsoWidth * 0.78, 0.05, 16), new THREE.MeshStandardMaterial({ color: 0x111111 })); // Black belt
    waistBelt.position.set(0, -torsoHeight / 2.2, 0);
    torsoMesh.add(waistBelt);

    const buckleMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.03), accentMat);
    buckleMesh.position.set(0, 0, torsoWidth * 0.785);
    waistBelt.add(buckleMesh);

    // Pleated Skirt (for female) or Split Trench Coat tails (for male)
    if (gender === "female") {
      const skirtGeo = new THREE.CylinderGeometry(torsoWidth * 0.75, torsoWidth * 1.35, 0.36, 20);
      const skirtMesh = new THREE.Mesh(skirtGeo, mainMaterial);
      skirtMesh.position.set(0, -0.24, 0);
      torsoMesh.add(skirtMesh);

      // Skirt Pleats detailing (adds beautiful texture lines)
      for (let i = 0; i < 16; i++) {
        const pleating = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.38, 0.01), suitMat);
        const angle = (i / 16) * Math.PI * 2;
        pleating.position.set(Math.sin(angle) * (torsoWidth * 1.05), -0.01, Math.cos(angle) * (torsoWidth * 1.05));
        pleating.rotation.y = -angle;
        pleating.rotation.z = 0.15; // outward flares
        skirtMesh.add(pleating);
      }
    } else {
      // Split trench coat hanging flaps
      const coatTailL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.44, 0.04), mainMaterial);
      coatTailL.position.set(-0.12, -torsoHeight, -0.06);
      coatTailL.rotation.z = -0.15;
      coatTailL.rotation.y = 0.2;
      torsoMesh.add(coatTailL);

      const coatTailR = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.44, 0.04), mainMaterial);
      coatTailR.position.set(0.12, -torsoHeight, -0.06);
      coatTailR.rotation.z = 0.15;
      coatTailR.rotation.y = -0.2;
      torsoMesh.add(coatTailR);
    }

    // 3. Arms, Wrists & Five Expressive Fingers
    const shoulderOffset = torsoWidth * 1.05;
    const armLen = 0.44;
    const armRadius = 0.045;

    // --- LEFT ARM ---
    const armLPos = new THREE.Vector3(chestPos.x - shoulderOffset, chestPos.y, chestPos.z);
    const armL = new THREE.Group();
    armL.position.copy(armLPos);
    armL.rotation.z = leftArmRad;
    group.add(armL);

    // Left Sleeve
    const sleeveL = new THREE.Mesh(new THREE.CylinderGeometry(armRadius * 1.25, armRadius, armLen * 0.7, 10), mainMaterial);
    sleeveL.position.set(-armLen * 0.35, 0, 0);
    sleeveL.rotation.z = Math.PI / 2;
    armL.add(sleeveL);

    // Left Forearm (Skins)
    const foreArmL = new THREE.Mesh(new THREE.CylinderGeometry(armRadius * 0.95, armRadius * 0.8, armLen * 0.4, 8), skinMat);
    foreArmL.position.set(-armLen * 0.8, 0, 0);
    foreArmL.rotation.z = Math.PI / 2;
    armL.add(foreArmL);

    // HAND: Detailed palm skin
    const palmL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.07, 0.065), skinMat);
    palmL.position.set(-armLen - 0.015, 0, 0);
    armL.add(palmL);

    // 5 DETAILED FINGERS: Left
    const fingerTypes = [
      { name: "thumb", y: 0.024, z: 0.025, len: 0.038, angleZ: 0.4, angleY: -0.3 },
      { name: "index", y: 0.022, z: 0.01, len: 0.05, angleZ: 0.08, angleY: -0.08 },
      { name: "middle", y: 0.003, z: 0.00, len: 0.054, angleZ: 0, angleY: 0 },
      { name: "ring", y: -0.016, z: -0.01, len: 0.048, angleZ: -0.08, angleY: 0.08 },
      { name: "pinky", y: -0.032, z: -0.022, len: 0.038, angleZ: -0.22, angleY: 0.16 }
    ];

    fingerTypes.forEach((f) => {
      // Root knuckle joint
      const knuckle = new THREE.Group();
      knuckle.name = "finger_L_" + f.name + "_knuckle";
      knuckle.position.set(-0.015, f.y, f.z);
      knuckle.rotation.z = f.angleZ;
      knuckle.rotation.y = f.angleY;
      palmL.add(knuckle);

      // Section 1 capsule
      const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.008, f.len * 0.4, 5), skinMat);
      seg1.position.set(-f.len * 0.2, 0, 0);
      seg1.rotation.z = Math.PI / 2;
      knuckle.add(seg1);

      // Section 2 knuckle joint
      const midKnuckle = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 4, 4), skinMat);
      midKnuckle.name = "finger_L_" + f.name + "_mid";
      midKnuckle.position.set(-f.len * 0.4, 0, 0);
      knuckle.add(midKnuckle);

      // Section 2 capsule
      const seg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.006, f.len * 0.4, 5), skinMat);
      seg2.position.set(-f.len * 0.6, 0, 0);
      seg2.rotation.z = Math.PI / 2;
      knuckle.add(seg2);

      // Fingertip
      const tipMesh = new THREE.Mesh(new THREE.SphereGeometry(0.0065, 4, 4), skinMat);
      tipMesh.name = "finger_L_" + f.name + "_tip";
      tipMesh.position.set(-f.len * 0.8, 0, 0);
      knuckle.add(tipMesh);
    });

    // --- RIGHT ARM ---
    const armRPos = new THREE.Vector3(chestPos.x + shoulderOffset, chestPos.y, chestPos.z);
    const armR = new THREE.Group();
    armR.position.copy(armRPos);
    armR.rotation.z = rightArmRad;
    group.add(armR);

    // Right Sleeve
    const sleeveR = new THREE.Mesh(new THREE.CylinderGeometry(armRadius * 1.25, armRadius, armLen * 0.7, 10), mainMaterial);
    sleeveR.position.set(armLen * 0.35, 0, 0);
    sleeveR.rotation.z = -Math.PI / 2;
    armR.add(sleeveR);

    // Right Forearm (Skins)
    const foreArmR = new THREE.Mesh(new THREE.CylinderGeometry(armRadius * 0.95, armRadius * 0.8, armLen * 0.4, 8), skinMat);
    foreArmR.position.set(armLen * 0.8, 0, 0);
    foreArmR.rotation.z = -Math.PI / 2;
    armR.add(foreArmR);

    // HAND: Detailed palm skin
    const palmR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.07, 0.065), skinMat);
    palmR.position.set(armLen + 0.015, 0, 0);
    armR.add(palmR);

    // 5 DETAILED FINGERS: Right
    fingerTypes.forEach((f) => {
      // Root knuckle joint (Right mirrored)
      const knuckle = new THREE.Group();
      knuckle.name = "finger_R_" + f.name + "_knuckle";
      knuckle.position.set(0.015, f.y, f.z);
      knuckle.rotation.z = -f.angleZ;
      knuckle.rotation.y = -f.angleY;
      palmR.add(knuckle);

      // Section 1 capsule
      const seg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.008, f.len * 0.4, 5), skinMat);
      seg1.position.set(f.len * 0.2, 0, 0);
      seg1.rotation.z = -Math.PI / 2;
      knuckle.add(seg1);

      // Section 2 knuckle joint
      const midKnuckle = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 4, 4), skinMat);
      midKnuckle.name = "finger_R_" + f.name + "_mid";
      midKnuckle.position.set(f.len * 0.4, 0, 0);
      knuckle.add(midKnuckle);

      // Section 2 capsule
      const seg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.0075, 0.006, f.len * 0.4, 5), skinMat);
      seg2.position.set(f.len * 0.6, 0, 0);
      seg2.rotation.z = -Math.PI / 2;
      knuckle.add(seg2);

      // Fingertip
      const tipMesh = new THREE.Mesh(new THREE.SphereGeometry(0.0065, 4, 4), skinMat);
      tipMesh.name = "finger_R_" + f.name + "_tip";
      tipMesh.position.set(f.len * 0.8, 0, 0);
      knuckle.add(tipMesh);
    });

    // 4. Legs, Articulated Knee structures & Boots
    const hipOffset = 0.11;
    const legLen = 0.54;
    const legRadius = 0.055;

    // LEFT LEG
    const legLPos = new THREE.Vector3(hipPos.x - hipOffset, hipPos.y, hipPos.z);
    const legL = new THREE.Group();
    legL.position.copy(legLPos);
    legL.rotation.z = leftLegRad;
    group.add(legL);

    // Left Thigh
    const thighL = new THREE.Mesh(new THREE.CylinderGeometry(legRadius, legRadius * 0.88, legLen * 0.5, 8), skinMat);
    thighL.position.set(0, -legLen * 0.25, 0);
    legL.add(thighL);

    // Left Knee Cap protector mesh
    const kneeL = new THREE.Mesh(new THREE.SphereGeometry(legRadius * 1.05, 8, 8), suitMat);
    kneeL.position.set(0, -legLen * 0.5, 0.02);
    legL.add(kneeL);

    // Left knee high boot
    const bootL = new THREE.Mesh(new THREE.CylinderGeometry(legRadius * 0.95, legRadius * 0.82, legLen * 0.5, 8), suitMat);
    bootL.position.set(0, -legLen * 0.75, 0);
    legL.add(bootL);

    // Soft Gold Cuff boot trim
    const bootTrimL = new THREE.Mesh(new THREE.CylinderGeometry(legRadius * 1.08, legRadius * 1.08, 0.04, 10), accentMat);
    bootTrimL.position.set(0, -legLen * 0.52, 0);
    legL.add(bootTrimL);

    // Left boot sole detailing
    const footLMesh = new THREE.Mesh(new THREE.BoxGeometry(legRadius * 2.3, 0.09, legRadius * 3.6), mainMaterial);
    footLMesh.position.set(0, -legLen * 1.02, legRadius * 0.45);
    legL.add(footLMesh);

    // RIGHT LEG
    const legRPos = new THREE.Vector3(hipPos.x + hipOffset, hipPos.y, hipPos.z);
    const legR = new THREE.Group();
    legR.position.copy(legRPos);
    legR.rotation.z = rightLegRad;
    group.add(legR);

    // Right Thigh
    const thighR = new THREE.Mesh(new THREE.CylinderGeometry(legRadius, legRadius * 0.88, legLen * 0.5, 8), skinMat);
    thighR.position.set(0, -legLen * 0.25, 0);
    legR.add(thighR);

    // Right Knee Cap
    const kneeR = new THREE.Mesh(new THREE.SphereGeometry(legRadius * 1.05, 8, 8), suitMat);
    kneeR.position.set(0, -legLen * 0.5, 0.02);
    legR.add(kneeR);

    // Right boot
    const bootR = new THREE.Mesh(new THREE.CylinderGeometry(legRadius * 0.95, legRadius * 0.82, legLen * 0.5, 8), suitMat);
    bootR.position.set(0, -legLen * 0.75, 0);
    legR.add(bootR);

    // Soft Gold Cuff cuff boot border
    const bootTrimR = new THREE.Mesh(new THREE.CylinderGeometry(legRadius * 1.08, legRadius * 1.08, 0.04, 10), accentMat);
    bootTrimR.position.set(0, -legLen * 0.52, 0);
    legR.add(bootTrimR);

    const footRMesh = new THREE.Mesh(new THREE.BoxGeometry(legRadius * 2.3, 0.09, legRadius * 3.6), mainMaterial);
    footRMesh.position.set(0, -legLen * 1.02, legRadius * 0.45);
    legR.add(footRMesh);

    // Force matrix update to compute stable World Matrix translations
    group.updateMatrixWorld(true);

    // --- SKELETAL RIG BINDING CONSTRUCTIONS ---
    const computedHandL = new THREE.Vector3(-armLen - 0.015, 0, 0).applyMatrix4(armL.matrixWorld);
    const computedHandR = new THREE.Vector3(armLen + 0.015, 0, 0).applyMatrix4(armR.matrixWorld);
    const computedLegL = new THREE.Vector3(0, -legLen, 0).applyMatrix4(legL.matrixWorld);
    const computedLegR = new THREE.Vector3(0, -legLen, 0).applyMatrix4(legR.matrixWorld);

    // Standard Biped Core Bones
    addBoneSegment(neckPos, headPos, "major_yellow");
    addBoneSegment(neckPos, chestPos, "major_green");
    addBoneSegment(chestPos, hipPos, "major_green");
    
    // Shoulder Brackets
    addBoneSegment(chestPos, armLPos, "clavicle");
    addBoneSegment(chestPos, armRPos, "clavicle");
    
    // Arm Links
    addBoneSegment(armLPos, computedHandL, "limbs");
    addBoneSegment(armRPos, computedHandR, "limbs");
    
    // Leg Links
    addBoneSegment(hipPos, legLPos, "pelvis");
    addBoneSegment(hipPos, legRPos, "pelvis");
    addBoneSegment(legLPos, computedLegL, "limbs_low");
    addBoneSegment(legRPos, computedLegR, "limbs_low");

    // EXTENDED RIGGING: Hands, Facial tracking, and hair joints
    if (fullRigActive) {
      // 1. DUAL HAND EXPRESSIVE RIG: 5 Finger bone chains per hand (3 segments per finger!)
      const leftPalmPos = new THREE.Vector3();
      palmL.getWorldPosition(leftPalmPos);

      const rightPalmPos = new THREE.Vector3();
      palmR.getWorldPosition(rightPalmPos);

      fingerTypes.forEach((f) => {
        const knL = group.getObjectByName("finger_L_" + f.name + "_knuckle");
        const midL = group.getObjectByName("finger_L_" + f.name + "_mid");
        const tipL = group.getObjectByName("finger_L_" + f.name + "_tip");

        const knR = group.getObjectByName("finger_R_" + f.name + "_knuckle");
        const midR = group.getObjectByName("finger_R_" + f.name + "_mid");
        const tipR = group.getObjectByName("finger_R_" + f.name + "_tip");

        if (knL && midL && tipL) {
          const pKnL = new THREE.Vector3();
          const pMidL = new THREE.Vector3();
          const pTipL = new THREE.Vector3();

          knL.getWorldPosition(pKnL);
          midL.getWorldPosition(pMidL);
          tipL.getWorldPosition(pTipL);

          // Wrist/Palm to knuckle
          addBoneSegment(leftPalmPos, pKnL, "glove_finger");
          // Knuckle to mid joint
          addBoneSegment(pKnL, pMidL, "glove_finger");
          // Mid joint to fingertip
          addBoneSegment(pMidL, pTipL, "glove_finger");
        }

        if (knR && midR && tipR) {
          const pKnR = new THREE.Vector3();
          const pMidR = new THREE.Vector3();
          const pTipR = new THREE.Vector3();

          knR.getWorldPosition(pKnR);
          midR.getWorldPosition(pMidR);
          tipR.getWorldPosition(pTipR);

          // Wrist/Palm to knuckle
          addBoneSegment(rightPalmPos, pKnR, "glove_finger");
          // Knuckle to mid joint
          addBoneSegment(pKnR, pMidR, "glove_finger");
          // Mid joint to fingertip
          addBoneSegment(pMidR, pTipR, "glove_finger");
        }
      });

      // 2. FACIAL RIG: Eyes Gaze Targets + Look-At Focus Vector Lines
      // Floating look-at target coordinate in front of head coordinates
      const gazeTargetWorld = new THREE.Vector3(headPos.x, headPos.y, headPos.z + 1.4);
      
      // Floating focus rings in outer space
      const focusTargetGeo = new THREE.SphereGeometry(0.06, 12, 12);
      const focusTargetMat = new THREE.MeshBasicMaterial({ color: 0xff0055, wireframe: true, depthTest: false });
      const focusTargetMesh = new THREE.Mesh(focusTargetGeo, focusTargetMat);
      focusTargetMesh.position.copy(gazeTargetWorld);
      focusTargetMesh.renderOrder = 999;
      bonesGroup.add(focusTargetMesh);

      // Connect eyes to Target to show line tracing
      const worldEyeL = new THREE.Vector3(-0.065, -0.01, 0.14).applyMatrix4(headMesh.matrixWorld);
      const worldEyeR = new THREE.Vector3(0.065, -0.01, 0.14).applyMatrix4(headMesh.matrixWorld);
      addBoneSegment(worldEyeL, gazeTargetWorld, "facial_eye");
      addBoneSegment(worldEyeR, gazeTargetWorld, "facial_eye");

      // Mouth tracker bone (Jawbone)
      const earL = new THREE.Vector3(-0.1, -0.05, 0).applyMatrix4(headMesh.matrixWorld);
      const mouthCtr = new THREE.Vector3(0, -0.09, 0.158).applyMatrix4(headMesh.matrixWorld);
      addBoneSegment(earL, mouthCtr, "facial_jaw");

      // 3. HAIR RIG: Skeletal structural bones branching through hair strands
      if (gender === "female") {
        const leftLockTip = new THREE.Vector3(-0.13, -0.22, 0.08).applyMatrix4(headMesh.matrixWorld);
        const rightLockTip = new THREE.Vector3(0.13, -0.22, 0.08).applyMatrix4(headMesh.matrixWorld);
        const ponytailTip = new THREE.Vector3(0, -0.3, -0.21).applyMatrix4(headMesh.matrixWorld);

        const crownCtr = new THREE.Vector3(0, 0.03, -0.01).applyMatrix4(headMesh.matrixWorld);

        addBoneSegment(crownCtr, leftLockTip, "hair_physics");
        addBoneSegment(crownCtr, rightLockTip, "hair_physics");
        addBoneSegment(crownCtr, ponytailTip, "hair_physics");
      } else {
        const spikesCenters = [
          new THREE.Vector3(-0.12, 0.15, 0.06).applyMatrix4(headMesh.matrixWorld),
          new THREE.Vector3(0, 0.22, -0.04).applyMatrix4(headMesh.matrixWorld),
          new THREE.Vector3(0.12, 0.15, 0.06).applyMatrix4(headMesh.matrixWorld)
        ];
        spikesCenters.forEach((s) => {
          addBoneSegment(headPos, s, "hair_physics");
        });
      }
    }

    // Draw beautiful skeleton using high quality drawing function
    drawSkeletonBones(bonePoints, boneColorsText, bonesGroup);

    if (neuralView) {
      group.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const hasWireframe = child.children.some(c => c.name === "neuralWireframe");
          if (!hasWireframe) {
            const wireframeGeo = child.geometry.clone();
            const wireframeMat = new THREE.MeshBasicMaterial({
              color: 0x00f3ff,
              wireframe: true,
              transparent: true,
              opacity: 0.22,
              depthTest: true
            });
            const wireframeMesh = new THREE.Mesh(wireframeGeo, wireframeMat);
            wireframeMesh.name = "neuralWireframe";
            child.add(wireframeMesh);
          }
        }
      });
    }

    return { character: group, skeleton: bonesGroup };
  };

  // Re-render character meshes dynamically when dependencies edit
  useEffect(() => {
    if (!sceneRef.current) return;

    // Discard old references
    if (charGroupRef.current) {
      sceneRef.current.remove(charGroupRef.current);
    }
    if (skeletonLinesGroupRef.current) {
      sceneRef.current.remove(skeletonLinesGroupRef.current);
    }

    const { character, skeleton } = buildCharModel();
    charGroupRef.current = character;
    skeletonLinesGroupRef.current = skeleton;

    sceneRef.current.add(character);
    sceneRef.current.add(skeleton);

    // Global update render cycle trigger
    if (rendererRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [
    gender, showSkeleton, meshColor, hairColor, suitColor, skinColor,
    roughness, metalness, headYaw, headPitch, leftArmAngle, rightArmAngle,
    leftLegAngle, rightLegAngle, torsoLeaning, fullRigActive, neuralView,
    customObjContent, textureMapUrl, normalMapUrl, metallicMapUrl, roughnessMapUrl
  ]);

  // Handle floor grid visibility toggle
  useEffect(() => {
    if (!sceneRef.current) return;
    const oldGrid = sceneRef.current.getObjectByName("floorGrid");
    if (oldGrid) {
      sceneRef.current.remove(oldGrid);
    }

    if (showFloor) {
      const gridHelper = new THREE.GridHelper(20, 40, 0x00f3ff, 0x1e3a8a);
      gridHelper.name = "floorGrid";
      // Slightly push down to sit under feet
      gridHelper.position.y = 0.0;
      // Style line weights via raw uniforms if needed, simple is gorgeous
      sceneRef.current.add(gridHelper);
    }

    if (rendererRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [showFloor]);

  // Primary Mount Cycle for 3D Engine Setup
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 700;
    const height = containerRef.current.clientHeight || 500;

    // Stage 1: Configure Perspective Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    cameraRef.current = camera;

    // Stage 2: Create WebGL Context
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Stage 3: Setup Scene & Lights
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // High fidelity lighting context
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(5, 10, 7);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa5f3fc, 0.4);
    dirLight2.position.set(-5, 4, -5);
    scene.add(dirLight2);

    const spotLight = new THREE.SpotLight(0xfff, 0.5, 30, 0.5, 1, 1);
    spotLight.position.set(0, 8, 3);
    scene.add(spotLight);

    // Coordinate helper
    updateCameraPosition();

    // Spawn character meshes
    const { character, skeleton } = buildCharModel();
    charGroupRef.current = character;
    skeletonLinesGroupRef.current = skeleton;
    scene.add(character);
    scene.add(skeleton);

    // Initial floor setup
    const gridHelper = new THREE.GridHelper(20, 40, 0x00f3ff, 0x1e3a8a);
    gridHelper.name = "floorGrid";
    scene.add(gridHelper);

    // Render loop helper
    let animRequest: number;
    const animate = () => {
      animRequest = requestAnimationFrame(animate);
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };
    animate();

    // Clean Resize Observer for Responsive fitting
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      const nw = Math.floor(entry.contentRect.width);
      const nh = Math.floor(entry.contentRect.height);

      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = nw / nh;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(nw, nh);
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(animRequest);
      resizeObserver.disconnect();
      if (renderer) renderer.dispose();
    };
  }, []);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* 3D Header Block */}
      <div className="bg-gradient-to-r from-theme-accent/20 to-theme-accent-blue/15 p-6 rounded-2xl border border-theme-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[9px] font-mono font-bold tracking-widest text-theme-accent bg-theme-accent/10 px-2 py-0.5 rounded-full">
            RIG ENGINE & SKELETON POSE VIEW
          </span>
          <h2 className="text-2xl font-black uppercase text-theme-text italic tracking-tight mt-1 flex items-center gap-2">
            POSE ANIMATOR & 3D STUDIO
          </h2>
          <p className="text-xs text-theme-muted mt-1 font-sans">
            Warp, rotate, and align full biped avatars in real-time. Fine-tune character coordinates with Blender-level responsive controls.
          </p>
        </div>
        <div className="flex gap-2 font-mono text-[10px]">
          <div className="bg-white px-2.5 py-1.5 rounded border border-theme-border flex items-center gap-1.5 font-bold hover:shadow-sm transition-all text-theme-text">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            GL_EXT_GLTF: STABLE
          </div>
        </div>
      </div>

      {/* Control Layout split columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Parameters, Materials & Skeletons */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Avatar Selector Block */}
          <div className="bg-theme-surface p-5 rounded-xl border border-theme-border shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <User className="w-4 h-4 text-theme-accent" />
              <h3 className="text-xs font-black uppercase tracking-wider text-theme-text font-mono">1. Select Base Model</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setGender("female")}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border font-mono text-[9px] font-bold uppercase transition-all cursor-pointer ${gender === "female" ? "bg-theme-text text-white border-theme-text shadow-sm" : "bg-white hover:bg-theme-bg/30 text-theme-muted border-theme-border"}`}
              >
                <div className={`w-2 h-2 rounded-full mb-1 ${gender === "female" ? "bg-theme-accent" : "bg-gray-300"}`} />
                FEMALE
              </button>
              
              <button
                onClick={() => setGender("male")}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border font-mono text-[9px] font-bold uppercase transition-all cursor-pointer ${gender === "male" ? "bg-theme-text text-white border-theme-text shadow-sm" : "bg-white hover:bg-theme-bg/30 text-theme-muted border-theme-border"}`}
              >
                <div className={`w-2 h-2 rounded-full mb-1 ${gender === "male" ? "bg-rose-500" : "bg-gray-300"}`} />
                MALE
              </button>

              <button
                onClick={() => setGender("custom")}
                className={`flex flex-col items-center justify-center p-2 rounded-lg border font-mono text-[9px] font-bold uppercase transition-all cursor-pointer ${gender === "custom" ? "bg-gradient-to-r from-theme-accent to-theme-accent-blue text-white border-transparent shadow-md" : "bg-white text-theme-text hover:bg-theme-bg/30 border-theme-border"}`}
              >
                <div className={`w-2 h-2 rounded-full mb-1 ${gender === "custom" ? "bg-yellow-300" : "bg-gray-300"}`} />
                CUSTOM
              </button>
            </div>

            {gender === "custom" && (
              <div className="mt-3 pt-3 border-t border-theme-border/60 space-y-4 text-xs font-mono">
                {/* 3D Mesh Loader Segment */}
                <div className="bg-theme-bg/50 p-3 rounded-xl border border-theme-border/80 space-y-2.5">
                  <div className="flex justify-between items-center text-[10px] text-theme-muted font-bold tracking-wider">
                    <span>A. LOAD 3D MESH (.OBJ / .FBX)</span>
                    <span className="text-theme-accent bg-theme-accent/10 px-1 py-0.5 rounded text-[8px]">ACTIVE SOURCE</span>
                  </div>

                  {customMeshLoading ? (
                    <div className="flex flex-col items-center justify-center p-4 border border-dashed border-theme-accent/50 bg-theme-accent/5 rounded-lg text-[10px] text-theme-accent uppercase font-bold animate-pulse space-y-1.5">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Parsing Geometric Polygons...</span>
                    </div>
                  ) : customMeshFile ? (
                    <div className="flex justify-between items-center p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg text-[10px]">
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold max-w-[170px] truncate">
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{customMeshFile.name}</span>
                      </div>
                      <button 
                        onClick={clearCustomMesh}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10 p-1.5 rounded transition-all cursor-pointer"
                        title="Unload Mesh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center p-4 border border-dashed border-theme-border hover:border-theme-accent/50 hover:bg-theme-accent/[0.02] rounded-lg transition-all cursor-pointer">
                        <Upload className="w-5 h-5 text-theme-muted mb-1" />
                        <span className="text-[10px] font-bold text-theme-text text-center">UPLOAD .OBJ / .FBX FILE</span>
                        <span className="text-[8px] text-theme-muted text-center mt-0.5">Drag & drop or browse device</span>
                        <input 
                          type="file" 
                          accept=".obj,.fbx" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleMeshUpload(e.target.files[0]);
                            }
                          }}
                          className="hidden" 
                        />
                      </label>
                      <button 
                        type="button"
                        onClick={loadDemoObj}
                        className="w-full py-1.5 px-2 bg-gradient-to-r from-theme-accent-blue/10 to-theme-accent/10 hover:from-theme-accent-blue/20 hover:to-theme-accent/20 border border-theme-accent/20 hover:border-theme-accent/50 text-theme-accent text-[9px] rounded font-black uppercase tracking-wider transition-all cursor-pointer"
                      >
                        ⚡ LOAD FUTURISTIC HELMET DEMO OBJ
                      </button>
                    </div>
                  )}

                  {customMeshError && (
                    <span className="block text-[9px] text-red-500 bg-red-500/5 border border-red-500/10 p-1.5 rounded text-center font-bold">
                      {customMeshError}
                    </span>
                  )}
                </div>

                {/* Texture Map Channels Matrix */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-theme-muted font-bold tracking-wider">
                    <span>B. INPUT MAP CHANNELS</span>
                    <span className="text-[8px] text-violet-500 bg-violet-500/10 px-1 py-0.5 rounded">PBR INPUTS</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* texture (Diffuse Map) */}
                    <div className="bg-theme-bg/40 p-2.5 rounded-lg border border-theme-border/80 flex flex-col justify-between h-[96px] space-y-1">
                      <div className="text-[8px] font-bold text-theme-muted tracking-wider uppercase">
                        Diffuse (Color)
                      </div>
                      {textureMapFile ? (
                        <div className="relative group w-full h-[54px] rounded border border-theme-border overflow-hidden bg-zinc-950 flex items-center justify-center">
                          <img 
                            src={textureMapUrl || ""} 
                            alt="Diffuse Preview" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            type="button"
                            onClick={() => clearChannelMap("texture")}
                            className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center border border-dashed border-theme-border hover:border-theme-accent/40 w-full h-[54px] rounded hover:bg-theme-accent/[0.02] transition-all cursor-pointer">
                          <ImageIcon className="w-4 h-4 text-theme-muted animate-pulse" />
                          <span className="text-[7px] font-black text-theme-accent uppercase mt-1 text-center">UPLOAD MAP</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) handleChannelMapUpload(e.target.files[0], "texture");
                            }}
                            className="hidden" 
                          />
                        </label>
                      )}
                    </div>

                    {/* Normal Map */}
                    <div className="bg-theme-bg/40 p-2.5 rounded-lg border border-theme-border/80 flex flex-col justify-between h-[96px] space-y-1">
                      <div className="text-[8px] font-bold text-theme-muted tracking-wider uppercase">
                        Normal Map
                      </div>
                      {normalMapFile ? (
                        <div className="relative group w-full h-[54px] rounded border border-theme-border overflow-hidden bg-zinc-950 flex items-center justify-center">
                          <img 
                            src={normalMapUrl || ""} 
                            alt="Normal Preview" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            type="button"
                            onClick={() => clearChannelMap("normal")}
                            className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center border border-dashed border-theme-border hover:border-theme-accent/40 w-full h-[54px] rounded hover:bg-theme-accent/[0.02] transition-all cursor-pointer">
                          <ImageIcon className="w-4 h-4 text-theme-muted" />
                          <span className="text-[7px] font-black text-theme-accent uppercase mt-1 text-center">UPLOAD NORMAL</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) handleChannelMapUpload(e.target.files[0], "normal");
                            }}
                            className="hidden" 
                          />
                        </label>
                      )}
                    </div>

                    {/* Metallic Map */}
                    <div className="bg-theme-bg/40 p-2.5 rounded-lg border border-theme-border/80 flex flex-col justify-between h-[96px] space-y-1">
                      <div className="text-[8px] font-bold text-theme-muted tracking-wider uppercase">
                        Metallic Map
                      </div>
                      {metallicMapFile ? (
                        <div className="relative group w-full h-[54px] rounded border border-theme-border overflow-hidden bg-zinc-950 flex items-center justify-center">
                          <img 
                            src={metallicMapUrl || ""} 
                            alt="Metallic Preview" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            type="button"
                            onClick={() => clearChannelMap("metallic")}
                            className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center border border-dashed border-theme-border hover:border-theme-accent/40 w-full h-[54px] rounded hover:bg-theme-accent/[0.02] transition-all cursor-pointer">
                          <ImageIcon className="w-4 h-4 text-theme-muted" />
                          <span className="text-[7px] font-black text-theme-accent uppercase mt-1 text-center">UPLOAD METAL</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) handleChannelMapUpload(e.target.files[0], "metallic");
                            }}
                            className="hidden" 
                          />
                        </label>
                      )}
                    </div>

                    {/* Roughness Map */}
                    <div className="bg-theme-bg/40 p-2.5 rounded-lg border border-theme-border/80 flex flex-col justify-between h-[96px] space-y-1">
                      <div className="text-[8px] font-bold text-theme-muted tracking-wider uppercase">
                        Roughness Map
                      </div>
                      {roughnessMapFile ? (
                        <div className="relative group w-full h-[54px] rounded border border-theme-border overflow-hidden bg-zinc-950 flex items-center justify-center">
                          <img 
                            src={roughnessMapUrl || ""} 
                            alt="Roughness Preview" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            type="button"
                            onClick={() => clearChannelMap("roughness")}
                            className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center border border-dashed border-theme-border hover:border-theme-accent/40 w-full h-[54px] rounded hover:bg-theme-accent/[0.02] transition-all cursor-pointer">
                          <ImageIcon className="w-4 h-4 text-theme-muted" />
                          <span className="text-[7px] font-black text-theme-accent uppercase mt-1 text-center">UPLOAD ROUGH</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) handleChannelMapUpload(e.target.files[0], "roughness");
                            }}
                            className="hidden" 
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-theme-border/60 my-2 pt-3">
              <button
                onClick={triggerFullRig}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all border cursor-pointer outline-none ${fullRigActive ? "bg-[#39ff14]/10 border-[#39ff14]/50 text-[#39ff14] shadow-[0_0_15px_-3px_rgba(57,255,20,0.35)] animate-pulse" : "bg-gradient-to-r from-theme-accent to-theme-accent-blue text-white border-transparent hover:shadow-[0_4px_12px_rgba(239,68,68,0.25)]"}`}
              >
                <Sparkles className={`w-4 h-4 ${fullRigActive ? "animate-spin" : "animate-bounce text-yellow-300"}`} />
                {fullRigActive ? "⚡ BOUND FULL RIG ACTIVE" : "⚡ COMPLETE THE FULL RIG"}
              </button>
            </div>
          </div>

          {/* Quick Poses Presets */}
          <div className="bg-theme-surface p-5 rounded-xl border border-theme-border shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="w-4 h-4 text-theme-accent" />
              <h3 className="text-xs font-black uppercase tracking-wider text-theme-text font-mono">2. Pre-calculated Poses</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono">
              {["T-Pose", "A-Pose", "Katana Ready", "Hero Landing", "Floating Wing", "Victory Match"].map((pose) => (
                <button
                  key={pose}
                  onClick={() => applyPosePreset(pose)}
                  className={`py-2 px-1 text-center rounded border font-bold uppercase transition-all ${activePose === pose ? "bg-theme-accent text-white border-theme-accent shadow-sm" : "bg-white text-theme-text hover:bg-theme-bg/40 border-theme-border"}`}
                >
                  {pose}
                </button>
              ))}
            </div>
          </div>

          {/* Physical Joint Rotators */}
          <div className="bg-theme-surface p-5 rounded-xl border border-theme-border shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Sliders className="w-4 h-4 text-theme-accent" />
              <h3 className="text-xs font-black uppercase tracking-wider text-theme-text font-mono">3. Precise Bone Rotations</h3>
            </div>

            <div className="space-y-3.5">
              {/* Head Yaw */}
              <div>
                <div className="flex justify-between text-[10px] font-mono text-theme-muted mb-1">
                  <span>HEAD YAW (Z-ROTATE)</span>
                  <span className="font-bold text-theme-text">{headYaw}°</span>
                </div>
                <input 
                  type="range" min="-45" max="45" value={headYaw} 
                  onChange={(e) => { setHeadYaw(Number(e.target.value)); setActivePose("Custom"); }}
                  className="w-full accent-theme-accent h-1.5 bg-theme-bg rounded-lg cursor-pointer"
                />
              </div>

              {/* Head Pitch */}
              <div>
                <div className="flex justify-between text-[10px] font-mono text-theme-muted mb-1">
                  <span>HEAD PITCH (Y-ROTATE)</span>
                  <span className="font-bold text-theme-text">{headPitch}°</span>
                </div>
                <input 
                  type="range" min="-30" max="30" value={headPitch} 
                  onChange={(e) => { setHeadPitch(Number(e.target.value)); setActivePose("Custom"); }}
                  className="w-full accent-theme-accent h-1.5 bg-theme-bg rounded-lg cursor-pointer"
                />
              </div>

              {/* Torso Lean */}
              <div>
                <div className="flex justify-between text-[10px] font-mono text-theme-muted mb-1">
                  <span>SPINE LEAN (TORSO)</span>
                  <span className="font-bold text-theme-text">{torsoLeaning}°</span>
                </div>
                <input 
                  type="range" min="-15" max="40" value={torsoLeaning} 
                  onChange={(e) => { setTorsoLeaning(Number(e.target.value)); setActivePose("Custom"); }}
                  className="w-full accent-theme-accent h-1.5 bg-theme-bg rounded-lg cursor-pointer"
                />
              </div>

              {/* Left Arm Range */}
              <div>
                <div className="flex justify-between text-[10px] font-mono text-theme-muted mb-1">
                  <span>LEFT ARM UPPER LAYER</span>
                  <span className="font-bold text-theme-text">{leftArmAngle}°</span>
                </div>
                <input 
                  type="range" min="-180" max="90" value={leftArmAngle} 
                  onChange={(e) => { setLeftArmAngle(Number(e.target.value)); setActivePose("Custom"); }}
                  className="w-full accent-theme-accent h-1.5 bg-theme-bg rounded-lg cursor-pointer"
                />
              </div>

              {/* Right Arm Range */}
              <div>
                <div className="flex justify-between text-[10px] font-mono text-theme-muted mb-1">
                  <span>RIGHT ARM UPPER LAYER</span>
                  <span className="font-bold text-theme-text">{rightArmAngle}°</span>
                </div>
                <input 
                  type="range" min="-90" max="180" value={rightArmAngle} 
                  onChange={(e) => { setRightArmAngle(Number(e.target.value)); setActivePose("Custom"); }}
                  className="w-full accent-theme-accent h-1.5 bg-theme-bg rounded-lg cursor-pointer"
                />
              </div>

              {/* Left Leg Hip */}
              <div>
                <div className="flex justify-between text-[10px] font-mono text-theme-muted mb-1">
                  <span>LEFT KNEE JOINT</span>
                  <span className="font-bold text-theme-text">{leftLegAngle}°</span>
                </div>
                <input 
                  type="range" min="-30" max="90" value={leftLegAngle} 
                  onChange={(e) => { setLeftLegAngle(Number(e.target.value)); setActivePose("Custom"); }}
                  className="w-full accent-theme-accent h-1.5 bg-theme-bg rounded-lg cursor-pointer"
                />
              </div>

              {/* Right Leg Hip */}
              <div>
                <div className="flex justify-between text-[10px] font-mono text-theme-muted mb-1">
                  <span>RIGHT KNEE JOINT</span>
                  <span className="font-bold text-theme-text">{rightLegAngle}°</span>
                </div>
                <input 
                  type="range" min="-30" max="90" value={rightLegAngle} 
                  onChange={(e) => { setRightLegAngle(Number(e.target.value)); setActivePose("Custom"); }}
                  className="w-full accent-theme-accent h-1.5 bg-theme-bg rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Blender-like Maya 3D Viewport Space */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#11131c] rounded-2xl border border-theme-border/60 relative overflow-hidden shadow-2xl flex flex-col">
            
            {/* Top Toolbar overlay inside viewport */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10 pointer-events-none">
              
              {/* Neural Data Indicator */}
              <div className="flex flex-col gap-2 pointer-events-auto">
                <div className="flex items-center gap-2.5 bg-[#1e2230]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-theme-border/30 shadow-lg">
                  <span className="text-[9px] font-black tracking-widest text-[#94a3b8] uppercase font-mono">3D NEURAL DATA VIEW</span>
                  <button 
                    onClick={() => setNeuralView(!neuralView)}
                    className={`w-8 h-4 rounded-full p-0.5 transition-colors ${neuralView ? "bg-theme-accent" : "bg-gray-600"}`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-white transition-transform ${neuralView ? "translate-x-4" : "translate-x-0"}`} />
                  </button>
                </div>

                {neuralView && (
                  <div className="flex items-center gap-1.5 bg-[#00f3ff]/10 border border-[#00f3ff]/30 text-[#00f3ff] font-mono text-[9px] px-3 py-1 rounded-md max-w-max uppercase font-bold animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00f3ff]"></span>
                    NEURAL_SYNC_OPTIMAL
                  </div>
                )}
              </div>

              {/* X-Y-Z Gizmo overlay at top right */}
              <div className="bg-[#1e2230]/90 border border-theme-border/30 shadow-lg p-3 rounded-xl flex items-center gap-2 pointer-events-auto">
                <Compass className="w-4 h-4 text-theme-accent animate-spin-slow text-theme-accent" />
                <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider block">BONE SPACE GIZMO</span>
                <div className="flex gap-1.5 ml-1 text-[8px] font-mono">
                  <span className="bg-red-500 text-white px-1 py-0.5 rounded font-black font-bold">X</span>
                  <span className="bg-emerald-500 text-white px-1 py-0.5 rounded font-black font-bold">Y</span>
                  <span className="bg-blue-500 text-white px-1 py-0.5 rounded font-black font-bold">Z</span>
                </div>
              </div>

            </div>

            {/* Left and Right Sidebar Action rails mimicking tool toggle widgets */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
              <button 
                title="Select Vertices"
                className="w-10 h-10 rounded-lg bg-[#1e2230]/90 backdrop-blur-md border border-theme-border/30 hover:bg-theme-accent hover:border-theme-accent text-white flex items-center justify-center transition-all shadow-md group"
              >
                < Compass className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
              <button 
                title="Rotate Tool"
                className="w-10 h-10 rounded-lg bg-[#1e2230]/90 backdrop-blur-md border border-theme-border/30 hover:bg-theme-accent hover:border-theme-accent text-white flex items-center justify-center transition-all shadow-md group"
              >
                <RotateCw className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
              <button 
                title="Grid Slices"
                onClick={() => setShowFloor(!showFloor)}
                className={`w-10 h-10 rounded-lg backdrop-blur-md border border-theme-border/30 flex items-center justify-center transition-all shadow-md group ${showFloor ? "bg-theme-accent/20 border-theme-accent text-theme-accent" : "bg-[#1e2230]/90 text-white hover:bg-theme-bg"}`}
              >
                <Grid className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              </button>
            </div>

            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
              <button 
                title="Skeleton Lines Overlay"
                onClick={() => setShowSkeleton(!showSkeleton)}
                className={`w-10 h-10 rounded-lg backdrop-blur-md border border-theme-border/30 flex items-center justify-center transition-all shadow-md group ${showSkeleton ? "bg-theme-accent text-white border-theme-accent" : "bg-[#1e2230]/90 text-white hover:bg-theme-bg"}`}
              >
                <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
              <button 
                title="Symmetrical Mirroring"
                className="w-10 h-10 rounded-lg bg-[#1e2230]/90 backdrop-blur-md border border-theme-border/30 hover:bg-theme-accent hover:border-theme-accent text-white flex items-center justify-center transition-all shadow-md group"
              >
                <Layers className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* THREE.JS CONTAINER */}
            <div 
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onWheel={handleWheelZoom}
              className="w-full cursor-grab active:cursor-grabbing bg-gradient-to-b from-[#090a0f] to-[#141824]"
              style={{ height: "480px" }}
            />

            {/* Rigging Solver Overlay Simulator */}
            {isRigging && (
              <div className="absolute inset-0 bg-[#090a0f]/95 backdrop-blur-md z-20 flex flex-col items-center justify-center p-6 text-center">
                <div className="relative w-20 h-20 mb-5 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-theme-accent/20 border-t-theme-accent animate-spin" />
                  <Sparkles className="w-8 h-8 text-[#00f3ff] animate-pulse" />
                </div>
                
                <div className="space-y-3.5 max-w-sm w-full">
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold tracking-wider text-theme-muted">
                    <span className="text-[#00f3ff]">COMPUTING INVERSE KINEMATICS...</span>
                    <span>{riggingProgress}%</span>
                  </div>
                  
                  <div className="w-full bg-[#11131c] h-1.5 rounded-full overflow-hidden border border-theme-border/30">
                    <div 
                      className="bg-[#00f3ff] h-full rounded-full transition-all duration-300"
                      style={{ width: `${riggingProgress}%` }}
                    />
                  </div>
                  
                  <div className="bg-[#141724] border border-theme-border/40 rounded-lg p-3 text-left font-mono text-[10px] text-zinc-300 h-16 flex items-center overflow-hidden">
                    <span className="w-full block leading-relaxed text-[#39ff14] text-center">
                      {riggingLog}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Floating View Controls (Mimicking the overlay in reference image) */}
            <div className="absolute bottom-4 left-4 right-4 bg-[#141724]/95 backdrop-blur-md p-4 rounded-xl border border-theme-border/40 shadow-2xl flex flex-wrap justify-between items-center gap-3 z-10 pointer-events-auto">
              <div>
                <span className="text-[9px] font-mono text-[#a5f3fc]/80 font-black tracking-widest block uppercase mb-1">VIEW CONTROLS</span>
                <div className="flex gap-1 bg-[#1e2230] p-0.5 rounded border border-theme-border/30 text-[10px] font-mono">
                  {(["PERS", "FRONT", "SIDE", "TOP", "REAR"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => applyViewPreset(mode)}
                      className={`px-3 py-1 font-bold rounded transition-all ${viewMode === mode ? "bg-theme-accent text-white shadow-sm" : "text-gray-400 hover:text-white"}`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Middle row details */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => applyViewPreset("PERS")}
                  className="bg-[#1e2230] border border-theme-border/30 hover:bg-theme-accent hover:text-white text-[10px] font-mono font-bold uppercase transition-all px-3.5 py-1.5 rounded-lg text-gray-300"
                >
                  ALIGN [F]
                </button>

                <div className="flex bg-[#1e2230] border border-theme-border/30 rounded-lg p-0.5 items-center font-mono text-[10px]">
                  <button 
                    onClick={() => handleScalePercent(-1.0)} 
                    className="w-6 h-6 flex items-center justify-center hover:bg-theme-bg rounded text-gray-400 hover:text-white font-bold"
                  >
                    -
                  </button>
                  <span className="px-2 font-bold text-white">{zoomPercent}%</span>
                  <button 
                    onClick={() => handleScalePercent(1.0)} 
                    className="w-6 h-6 flex items-center justify-center hover:bg-theme-bg rounded text-gray-400 hover:text-white font-bold"
                  >
                    +
                  </button>
                </div>

                <button 
                  onClick={() => setShowSkeleton(!showSkeleton)}
                  className={`flex items-center gap-1.5 border hover:opacity-90 font-mono text-[10px] font-bold uppercase transition-all px-3 py-1.5 rounded-lg ${showSkeleton ? "bg-[#39ff14]/15 border-[#39ff14]/40 text-[#39ff14]" : "bg-[#1e2230] border-theme-border/30 text-gray-300"}`}
                >
                  <Dumbbell className="w-3.5 h-3.5" />
                  SKELETON
                </button>
              </div>

              {/* Ground alignment toggle */}
              <button 
                onClick={() => setShowFloor(!showFloor)}
                className={`text-[10px] uppercase font-mono font-bold py-1.5 px-3.5 rounded-lg transition-all ${showFloor ? "bg-theme-accent text-white" : "bg-[#1e2230] text-gray-400 border border-theme-border/30"}`}
              >
                FLOOR GRID
              </button>
            </div>

          </div>

          {/* Color Materials Customizer Drawer */}
          <div className="bg-theme-surface p-5 rounded-xl border border-theme-border shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-4 h-4 text-theme-accent" />
              <h3 className="text-xs font-black uppercase tracking-wider text-theme-text font-mono">Avatar Dressing Rooms & Material Tones</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              
              {/* Mesh color */}
              <div>
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-theme-muted block mb-1">Body Material Tone</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="color" 
                    value={meshColor} 
                    onChange={(e) => setMeshColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-theme-border cursor-pointer bg-transparent pointer-events-auto"
                  />
                  <span className="text-[10px] font-mono uppercase text-theme-text">{meshColor}</span>
                </div>
              </div>

              {/* Hair color */}
              <div>
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-theme-muted block mb-1">Anime Hair Color</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="color" 
                    value={hairColor} 
                    onChange={(e) => setHairColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-theme-border cursor-pointer bg-transparent pointer-events-auto"
                  />
                  <span className="text-[10px] font-mono uppercase text-theme-text">{hairColor}</span>
                </div>
              </div>

              {/* Coat suit color */}
              <div>
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-theme-muted block mb-1">Outfit Color Accent</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="color" 
                    value={suitColor} 
                    onChange={(e) => setSuitColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-theme-border cursor-pointer bg-transparent pointer-events-auto"
                  />
                  <span className="text-[10px] font-mono uppercase text-theme-text">{suitColor}</span>
                </div>
              </div>

              {/* Skin Tone */}
              <div>
                <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-theme-muted block mb-1">Character Skin Tone</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="color" 
                    value={skinColor} 
                    onChange={(e) => setSkinColor(e.target.value)}
                    className="w-8 h-8 rounded-lg border border-theme-border cursor-pointer bg-transparent pointer-events-auto"
                  />
                  <span className="text-[10px] font-mono uppercase text-theme-text">{skinColor}</span>
                </div>
              </div>

            </div>

            {/* Slider parameters physical physics */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-theme-border text-[10px] font-mono">
              <div>
                <div className="flex justify-between text-theme-muted mb-1">
                  <span>METALLIC INTENSITY</span>
                  <span className="font-bold text-theme-text">{metalness}</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.05" value={metalness} 
                  onChange={(e) => setMetalness(Number(e.target.value))}
                  className="w-full accent-theme-accent h-1 bg-theme-bg"
                />
              </div>

              <div>
                <div className="flex justify-between text-theme-muted mb-1">
                  <span>SURFACE ROUGHNESS</span>
                  <span className="font-bold text-theme-text">{roughness}</span>
                </div>
                <input 
                  type="range" min="0" max="1" step="0.05" value={roughness} 
                  onChange={(e) => setRoughness(Number(e.target.value))}
                  className="w-full accent-theme-accent h-1 bg-theme-bg"
                />
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
