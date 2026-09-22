import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  User, 
  Palette, 
  Eye, 
  Shirt, 
  Copy, 
  Download, 
  RefreshCw, 
  Save, 
  Check, 
  ArrowRight,
  Maximize2,
  AlertCircle,
  Activity,
  Workflow,
  Cpu,
  Bookmark,
  ChevronRight,
  Info,
  Upload,
  Trash2,
  Link2,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CharacterCustomizationProps {
  t: (key: string) => string;
  lang: 'en' | 'jp';
  initialInputImage: string | null;
  onSetAsCharacterReference: (url: string) => void;
  onRefresh?: () => void;
}

interface SavedCustomCharacter {
  id: string;
  name: string;
  prompt: string;
  imageUrl: string;
  createdAt: string;
  specs: Record<string, any>;
}

export default function CharacterCustomization({ 
  t, 
  lang, 
  initialInputImage, 
  onSetAsCharacterReference,
  onRefresh 
}: CharacterCustomizationProps) {
  // ----- States -----
  const [characterName, setCharacterName] = useState<string>("Sakura_Vanguard");
  const [activeNode, setActiveNode] = useState<string>("body_geometry");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [promptText, setPromptText] = useState<string>("");
  const [savedCharacters, setSavedCharacters] = useState<SavedCustomCharacter[]>([]);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [activeWireGlow, setActiveWireGlow] = useState<boolean>(true);

  // Tab State for Attributes Editor vs AI Reference Upload panel
  const [paramTab, setParamTab] = useState<'attributes' | 'references'>('attributes');

  // Customizer Node Values: NODE 01: Body Geometry
  const [gender, setGender] = useState<string>("Female");
  const [fantasyRace, setFantasyRace] = useState<string>("Elf"); // Options: Asian, Caucasian, Extraterrestrial, Elf, etc.
  const [height, setHeight] = useState<number>(168);
  const [fatLevel, setFatLevel] = useState<number>(18);
  const [breastSize, setBreastSize] = useState<string>("Balanced Full");

  // NODE 02: Face / Facial Anatomy
  const [faceType, setFaceType] = useState<string>("Chiseled Oval");
  const [noseStyle, setNoseStyle] = useState<string>("Straight Delicate");
  const [lipsStyle, setLipsStyle] = useState<string>("Plush");
  const [earsStyle, setEarsStyle] = useState<string>("Elf Pointed");
  const [eyesShape, setEyesShape] = useState<string>("Almond Anime");
  const [eyesColor, setEyesColor] = useState<string>("Neon Blue");
  const [eyebrowsStyle, setEyebrowsStyle] = useState<string>("Arch Fine");
  const [skinColor, setSkinColor] = useState<string>("Alabaster Pale");
  const [skinTexture, setSkinTexture] = useState<string>("Porcelain Smooth");

  // NODE 03: Apparel & Style
  const [clothingStyle, setClothingStyle] = useState<string>("Cyberwear Suit");
  const [topPiece, setTopPiece] = useState<string>("Cropped Tactical Jacket");
  const [bottomPiece, setBottomPiece] = useState<string>("High-tech Cargo Pants");
  const [shoesStyle, setShoesStyle] = useState<string>("Armored High-tops");
  const [clothingColor, setClothingColor] = useState<string>("Obsidian & Crimson");
  const [hairStyle, setHairStyle] = useState<string>("Messy Ponytail");
  const [hairColor, setHairColor] = useState<string>("Electric Pink");

  // NODE 04: Accessories & Mods
  const [tattoos, setTattoos] = useState<string>("Neon Cyber-Runes");
  const [piercings, setPiercings] = useState<string>("Double Ear Piercings");
  const [accessories, setAccessories] = useState<string>("Holowear Visor Glasses");
  const [hipsSize, setHipsSize] = useState<string>("Athletic Curvy");
  const [legsLength, setLegsLength] = useState<string>("Sleek Long");
  const [muscleLevel, setMuscleLevel] = useState<string>("Toned Fighter");
  const [age, setAge] = useState<number>(23);

  // ----- Reference Upload Panel States -----
  const [faceShapeRef, setFaceShapeRef] = useState<string | null>(null);
  const [lipsRef, setLipsRef] = useState<string | null>(null);
  const [eyesShapeRef, setEyesShapeRef] = useState<string | null>(null);
  const [eyesColorRef, setEyesColorRef] = useState<string | null>(null);
  const [faceColorRef, setFaceColorRef] = useState<string | null>(null);
  const [bodyColorRef, setBodyColorRef] = useState<string | null>(null);
  const [breastSizeRef, setBreastSizeRef] = useState<string | null>(null);
  const [heightRef, setHeightRef] = useState<string | null>(null);
  const [fatLevelRef, setFatLevelRef] = useState<string | null>(null);

  // Sync Diagnostics State
  const [refLogs, setRefLogs] = useState<{ id: string; msg: string; time: string; type: string }[]>([]);
  const [syncStatus, setSyncStatus] = useState<Record<string, { label: string; confidence: number; active: boolean }>>({
    faceShape: { label: "Idle", confidence: 0, active: false },
    lips: { label: "Idle", confidence: 0, active: false },
    eyesShape: { label: "Idle", confidence: 0, active: false },
    eyesColor: { label: "Idle", confidence: 0, active: false },
    faceColor: { label: "Idle", confidence: 0, active: false },
    bodyColor: { label: "Idle", confidence: 0, active: false },
    breastSize: { label: "Idle", confidence: 0, active: false },
    height: { label: "Idle", confidence: 0, active: false },
    fatLevel: { label: "Idle", confidence: 0, active: false }
  });

  // Load saved characters from list
  const loadSavedCharacters = async () => {
    try {
      const res = await fetch("/api/characters/list");
      const data = await res.json();
      if (data.success && data.characters) {
        // filter characters that have customization specs
        const filtered = data.characters.filter((c: any) => c.prompt && c.specs);
        setSavedCharacters(filtered);
      }
    } catch (e) {
      console.error("Failed to fetch custom characters list:", e);
    }
  };

  useEffect(() => {
    loadSavedCharacters();
  }, []);

  // Update compiled prompt whenever any parameter changes
  useEffect(() => {
    const parts: string[] = [];

    // NODE 01: Body Geometry block
    parts.push(`An ultra-high quality character sheet of a ${gender} ${fantasyRace} with ${breastSize} breast size, standing at ${height}cm, with a ${fatLevel}% body fat percentage.`);

    // NODE 02: Face & Facial Anatomy Node block
    parts.push(`Head details: stunning ${faceType} face shape, gorgeous ${eyesShape} eyes with striking ${eyesColor} glowing color, beautifully defined ${eyebrowsStyle} eyebrows, ${noseStyle} nose, ${lipsStyle} lips, elegant ${earsStyle} ears. Skin is flawless ${skinColor} with a ${skinTexture} texture.`);

    // NODE 03: Apparel & Style Node block
    parts.push(`Styled with a ${hairStyle} haircut of vibrant ${hairColor} hair color. Outfit is premium futuristic ${clothingStyle} apparel featuring a ${topPiece} top paired with ${bottomPiece} bottoms, colored in ${clothingColor}, finished with high-performance ${shoesStyle} footwear.`);

    // NODE 04: Accessories & Mods block
    const mods = [];
    if (tattoos !== "None") mods.push(`intricate ${tattoos} tattoos`);
    if (piercings !== "None") mods.push(`cybernetic ${piercings} piercings`);
    if (accessories !== "None") mods.push(`wearing ${accessories} accessory`);
    if (hipsSize !== "None") mods.push(`${hipsSize} hips`);
    if (legsLength !== "None") mods.push(`${legsLength} legs`);
    if (muscleLevel !== "None") mods.push(`${muscleLevel} muscle tier`);
    if (mods.length > 0) {
      parts.push(`Character modifications: ${mods.join(", ")}.`);
    }

    // Reference context instruction
    if (initialInputImage) {
      parts.push(`Maintain visual likeness, color themes, and skeletal configuration details from the seed asset.`);
    }

    const compiled = parts.join(" ");
    setPromptText(compiled);
  }, [
    gender, height, age, fatLevel, fantasyRace, breastSize,
    faceType, noseStyle, lipsStyle, earsStyle, eyesShape, eyesColor, eyebrowsStyle, skinColor, skinTexture,
    hipsSize, legsLength, muscleLevel,
    hairStyle, hairColor,
    clothingStyle, topPiece, bottomPiece, shoesStyle, clothingColor,
    tattoos, piercings, accessories,
    initialInputImage
  ]);

  // Copy Prompt
  const [copied, setCopied] = useState(false);
  const copyPrompt = () => {
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Run Custom Synthesis
  const handleFabricateCharacter = async () => {
    setIsGenerating(true);
    setGenerationProgress(10);
    setGeneratedImageUrl(null);

    const statuses = [
      { p: 15, m: lang === 'jp' ? "ノード配列の初期化中..." : "Initializing node matrices..." },
      { p: 30, m: lang === 'jp' ? "骨格座標とポリゴンメッシュの解決中..." : "Resolving mesh topology & polygon scales..." },
      { p: 45, m: lang === 'jp' ? "マテリアルシェーダーの注入中..." : "Injecting clothing textures and shaders..." },
      { p: 65, m: lang === 'jp' ? "AIイメージシンセサイザーのトリガー..." : "Triggering AI generative synthesis..." },
      { p: 80, m: lang === 'jp' ? "高忠実度ベクトルのブレンド中..." : "Blending high-fidelity neural vertices..." },
      { p: 90, m: lang === 'jp' ? "キャラクターの輪郭の最終検証..." : "Validating character symmetry contours..." }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < statuses.length) {
        setGenerationProgress(statuses[currentStep].p);
        setGenerationStatus(statuses[currentStep].m);
        currentStep++;
      }
    }, 1000);

    try {
      const res = await fetch("/api/synthesis/generate_initial_character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: promptText,
          style: `${fantasyRace} ${clothingStyle} Unreal Engine Concept Art`,
          currentCategory: fantasyRace
        })
      });

      clearInterval(interval);
      const data = await res.json();
      
      if (data.success && data.imageUrl) {
        setGenerationProgress(100);
        setGenerationStatus(lang === 'jp' ? "アセットの生成に成功しました！" : "Character fabricated successfully!");
        setGeneratedImageUrl(data.imageUrl);
      } else {
        throw new Error(data.error || "Generation endpoint returned failure state.");
      }
    } catch (err: any) {
      clearInterval(interval);
      setGenerationStatus(`Fabrication failure: ${err.message || "Unknown error"}`);
      setGenerationProgress(100);
    } finally {
      setIsGenerating(false);
    }
  };

  // Save Character to Archive
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const handleSaveToArchive = async () => {
    if (!generatedImageUrl) return;
    setIsSaving(true);
    try {
      const payload = {
        name: characterName,
        imageUrl: generatedImageUrl,
        prompt: promptText,
        category: fantasyRace,
        gender: gender,
        hairColor: hairColor,
        suitColor: clothingColor,
        skinColor: skinColor,
        isComplete: true,
        specs: {
          gender, height, age, fatLevel, fantasyRace, breastSize,
          faceType, noseStyle, lipsStyle, earsStyle, eyesShape, eyesColor, eyebrowsStyle, skinColor, skinTexture,
          hipsSize, legsLength, muscleLevel,
          hairStyle, hairColor, clothingStyle, topPiece, bottomPiece, shoesStyle, clothingColor,
          tattoos, piercings, accessories
        }
      };

      const res = await fetch("/api/characters/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        loadSavedCharacters();
        if (onRefresh) onRefresh();
        setTimeout(() => {
          setSaveSuccess(false);
          setShowSaveModal(false);
        }, 1500);
      }
    } catch (err) {
      console.error("Failed to archive custom character:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Quick preset loader
  const loadPresetCharacter = (char: SavedCustomCharacter) => {
    if (!char.specs) return;
    const s = char.specs;
    if (s.gender) setGender(s.gender);
    if (s.height) setHeight(s.height);
    if (s.age) setAge(s.age);
    if (s.fatLevel) setFatLevel(s.fatLevel);
    if (s.fantasyRace) setFantasyRace(s.fantasyRace);
    if (s.faceType) setFaceType(s.faceType);
    if (s.noseStyle) setNoseStyle(s.noseStyle);
    if (s.lipsStyle) setLipsStyle(s.lipsStyle);
    if (s.earsStyle) setEarsStyle(s.earsStyle);
    if (s.eyesShape) setEyesShape(s.eyesShape);
    if (s.eyesColor) setEyesColor(s.eyesColor);
    if (s.eyebrowsStyle) setEyebrowsStyle(s.eyebrowsStyle);
    if (s.skinColor) setSkinColor(s.skinColor);
    if (s.skinTexture) setSkinTexture(s.skinTexture);
    if (s.breastSize) setBreastSize(s.breastSize);
    if (s.hipsSize) setHipsSize(s.hipsSize);
    if (s.legsLength) setLegsLength(s.legsLength);
    if (s.muscleLevel) setMuscleLevel(s.muscleLevel);
    if (s.hairStyle) setHairStyle(s.hairStyle);
    if (s.hairColor) setHairColor(s.hairColor);
    if (s.clothingStyle) setClothingStyle(s.clothingStyle);
    if (s.topPiece) setTopPiece(s.topPiece);
    if (s.bottomPiece) setBottomPiece(s.bottomPiece);
    if (s.shoesStyle) setShoesStyle(s.shoesStyle);
    if (s.clothingColor) setClothingColor(s.clothingColor);
    if (s.tattoos) setTattoos(s.tattoos);
    if (s.piercings) setPiercings(s.piercings);
    if (s.accessories) setAccessories(s.accessories);
    setGeneratedImageUrl(char.imageUrl);
    setCharacterName(char.name);

    addLog("archive", `Loaded custom preset: "${char.name}" and fully mapped specs to local node matrix.`, "system");
  };

  // Reset nodes to default Elven Scout preset
  const handleResetNodes = () => {
    setGender("Female");
    setHeight(168);
    setAge(23);
    setFatLevel(18);
    setFantasyRace("Elf");
    setFaceType("Chiseled Oval");
    setNoseStyle("Straight Delicate");
    setLipsStyle("Plush");
    setEarsStyle("Elf Pointed");
    setEyesShape("Almond Anime");
    setEyesColor("Neon Blue");
    setEyebrowsStyle("Arch Fine");
    setSkinColor("Alabaster Pale");
    setSkinTexture("Porcelain Smooth");
    setBreastSize("Balanced Full");
    setHipsSize("Athletic Curvy");
    setLegsLength("Sleek Long");
    setMuscleLevel("Toned Fighter");
    setHairStyle("Messy Ponytail");
    setHairColor("Electric Pink");
    setClothingStyle("Cyberwear Suit");
    setTopPiece("Cropped Tactical Jacket");
    setBottomPiece("High-tech Cargo Pants");
    setShoesStyle("Armored High-tops");
    setClothingColor("Obsidian & Crimson");
    setTattoos("Neon Cyber-Runes");
    setPiercings("Double Ear Piercings");
    setAccessories("Holowear Visor Glasses");
    setGeneratedImageUrl(null);

    // Reset references
    setFaceShapeRef(null);
    setLipsRef(null);
    setEyesShapeRef(null);
    setEyesColorRef(null);
    setFaceColorRef(null);
    setBodyColorRef(null);
    setBreastSizeRef(null);
    setHeightRef(null);
    setFatLevelRef(null);

    setSyncStatus({
      faceShape: { label: "Idle", confidence: 0, active: false },
      lips: { label: "Idle", confidence: 0, active: false },
      eyesShape: { label: "Idle", confidence: 0, active: false },
      eyesColor: { label: "Idle", confidence: 0, active: false },
      faceColor: { label: "Idle", confidence: 0, active: false },
      bodyColor: { label: "Idle", confidence: 0, active: false },
      breastSize: { label: "Idle", confidence: 0, active: false },
      height: { label: "Idle", confidence: 0, active: false },
      fatLevel: { label: "Idle", confidence: 0, active: false }
    });

    setRefLogs([]);
    addLog("system", "Node graph reset to default Elven Scout matrix configurations.", "system");
  };

  // --- Logger Helper ---
  const addLog = (id: string, msg: string, type: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setRefLogs(prev => [{ id, msg, time: timestamp, type }, ...prev].slice(0, 30));
  };

  // --- Reference Sync Mechanics ---
  const applyReferenceValue = (key: string, dataUrl: string) => {
    // Determine custom settings based on which reference slot is loaded
    switch (key) {
      case "faceShape":
        setFaceShapeRef(dataUrl);
        setFaceType("Sleek Diamond");
        setSyncStatus(prev => ({ ...prev, faceShape: { label: "Sleek Diamond", confidence: 98, active: true } }));
        addLog("faceShape", "Face shape reference detected: [Diamond structure solved]. Configured NODE_02.FaceType to 'Sleek Diamond'.", "face");
        break;
      case "lips":
        setLipsRef(dataUrl);
        setLipsStyle("Glossy Tinted");
        setSyncStatus(prev => ({ ...prev, lips: { label: "Glossy Tinted", confidence: 95, active: true } }));
        addLog("lips", "Lips structure reference: [Glossy ratio solved]. Configured NODE_02.LipsStyle to 'Glossy Tinted'.", "face");
        break;
      case "eyesShape":
        setEyesShapeRef(dataUrl);
        setEyesShape("Cat-like Slanted");
        setSyncStatus(prev => ({ ...prev, eyesShape: { label: "Cat-like Slanted", confidence: 97, active: true } }));
        addLog("eyesShape", "Eye outline reference: [Anime Slanted symmetry detected]. Configured NODE_02.EyesShape to 'Cat-like Slanted'.", "face");
        break;
      case "eyesColor":
        setEyesColorRef(dataUrl);
        setEyesColor("Viper Crimson");
        setSyncStatus(prev => ({ ...prev, eyesColor: { label: "Viper Crimson", confidence: 99, active: true } }));
        addLog("eyesColor", "Iris chromatic scan: [Viper Crimson spectra matched]. Configured NODE_02.EyesColor to 'Viper Crimson'.", "face");
        break;
      case "faceColor":
        setFaceColorRef(dataUrl);
        setSkinColor("Alabaster Pale");
        setSyncStatus(prev => ({ ...prev, faceColor: { label: "Alabaster Pale", confidence: 96, active: true } }));
        addLog("faceColor", "Dermis face tone scan: [Alabaster White hue solved]. Configured NODE_02.SkinColor to 'Alabaster Pale'.", "face");
        break;
      case "bodyColor":
        setBodyColorRef(dataUrl);
        setClothingColor("Midnight Black with Neon Pink trim");
        setSyncStatus(prev => ({ ...prev, bodyColor: { label: "Neon Pink Trim", confidence: 94, active: true } }));
        addLog("bodyColor", "Apparel palette analyzer: [Midnight/Pink array resolved]. Configured NODE_03.ClothingColor to 'Midnight Black with Neon Pink trim'.", "apparel");
        break;
      case "breastSize":
        setBreastSizeRef(dataUrl);
        setBreastSize("Compact Athletic");
        setSyncStatus(prev => ({ ...prev, breastSize: { label: "Compact Athletic", confidence: 93, active: true } }));
        addLog("breastSize", "Anatomical chest reference: [Athletic ratio solved]. Configured NODE_01.BreastSize to 'Compact Athletic'.", "body");
        break;
      case "height":
        setHeightRef(dataUrl);
        setHeight(178);
        setSyncStatus(prev => ({ ...prev, height: { label: "178 cm", confidence: 92, active: true } }));
        addLog("height", "Skeletal stature calculation: [178cm height solved]. Configured NODE_01.Height to 178cm.", "body");
        break;
      case "fatLevel":
        setFatLevelRef(dataUrl);
        setFatLevel(16);
        setSyncStatus(prev => ({ ...prev, fatLevel: { label: "16% Lean", confidence: 95, active: true } }));
        addLog("fatLevel", "Body composition solver: [16% lean ratio estimated]. Configured NODE_01.FatLevel to 16%.", "body");
        break;
    }
  };

  // File drag & drop or selection trigger
  const handleReferenceFileChange = (key: string, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      applyReferenceValue(key, result);
    };
    reader.readAsDataURL(file);
  };

  // Pre-loaded stunning simulation demo images
  const triggerDemoSample = (key: string) => {
    // Unsplash premium stylized character detail references
    const demos: Record<string, string> = {
      faceShape: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      lips: "https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?auto=format&fit=crop&q=80&w=200",
      eyesShape: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200",
      eyesColor: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
      faceColor: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=200",
      bodyColor: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
      breastSize: "https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=200",
      height: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200",
      fatLevel: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200"
    };

    applyReferenceValue(key, demos[key]);
  };

  // Clear single reference slot
  const clearReference = (key: string) => {
    switch (key) {
      case "faceShape": setFaceShapeRef(null); break;
      case "lips": setLipsRef(null); break;
      case "eyesShape": setEyesShapeRef(null); break;
      case "eyesColor": setEyesColorRef(null); break;
      case "faceColor": setFaceColorRef(null); break;
      case "bodyColor": setBodyColorRef(null); break;
      case "breastSize": setBreastSizeRef(null); break;
      case "height": setHeightRef(null); break;
      case "fatLevel": setFatLevelRef(null); break;
    }
    setSyncStatus(prev => ({ ...prev, [key]: { label: "Idle", confidence: 0, active: false } }));
    addLog(key, `Cleared reference file and decoupled weight associations for slot: ${key}`, "system");
  };

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Visual Workspace Subheader */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-theme-surface border border-theme-border p-6 rounded-2xl shadow-sm">
        <div className="text-left">
          <h2 className="text-2xl font-black uppercase tracking-tight text-theme-text italic flex items-center gap-3">
            {lang === 'jp' ? "キャラクターカスタマイゼーション" : "Character Customization"} 
            <span className="text-theme-accent-blue text-sm not-italic opacity-50">/ Node_Forge</span>
          </h2>
          <p className="text-[10px] font-bold font-mono text-theme-accent uppercase tracking-[0.3em] mt-2">
            {lang === 'jp' ? "アンリアル風ノードベースで外観属性を組み立てる" : "Unreal-Engine Inspired Visual Node Customizer"}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Node Diagnostics indicator */}
          <div className="bg-theme-bg/80 border border-theme-border rounded-xl px-4 py-2 flex items-center gap-2.5 font-mono text-[9px] text-theme-muted font-bold">
            <Activity className="w-3.5 h-3.5 text-theme-accent animate-pulse" />
            <span>WIRES: <span className="text-theme-accent">ACTIVE</span></span>
            <span className="opacity-30">|</span>
            <span>DIAGNOSTICS: <span className="text-theme-accent-blue">CONNECTED</span></span>
          </div>

          <button 
            onClick={handleResetNodes}
            className="px-4 py-2 border border-theme-border rounded-xl text-[9px] font-black uppercase tracking-widest text-theme-muted hover:text-theme-accent hover:border-theme-accent transition-all bg-theme-bg/30"
          >
            {lang === 'jp' ? "リセット" : "Reset Nodes"}
          </button>
        </div>
      </div>

      {/* Main Node Graph Screen container */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Unreal Blueprint Grid (Cols 1 to 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6 relative">
          
          {/* Blueprint Canvas Grid Panel */}
          <div className="w-full h-[620px] rounded-2xl border border-theme-border bg-[#0a0d16] relative overflow-hidden flex flex-col shadow-inner">
            
            {/* Unreal Engine radial dots grid */}
            <div className="absolute inset-0 bg-[#0c101a] bg-[radial-gradient(#1e263d_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none z-0"></div>
            
            {/* Glowing neon background dusts */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-theme-accent/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-theme-accent-blue/5 rounded-full blur-[120px] pointer-events-none"></div>

            {/* SVG Interactive Blueprint Cable wires */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              <defs>
                <linearGradient id="wire-pink" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF5A79" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#4BA3E3" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="wire-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4BA3E3" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#FF5A79" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* Dynamic wires from different nodes entering the central Core processor */}
              {activeWireGlow && (
                <>
                  {/* Body Geometry Node Wire */}
                  <path 
                    d="M 280 120 C 370 120, 360 300, 470 300" 
                    fill="none" 
                    stroke="url(#wire-pink)" 
                    strokeWidth="2.5" 
                    className="animate-pulse"
                    strokeDasharray="4 4"
                  />
                  {/* Facial Anatomy Wire */}
                  <path 
                    d="M 280 230 C 370 230, 360 315, 470 315" 
                    fill="none" 
                    stroke="url(#wire-blue)" 
                    strokeWidth="2.5" 
                    strokeDasharray="4 4"
                  />
                  {/* Apparel & Style Wire */}
                  <path 
                    d="M 280 340 C 370 340, 360 330, 470 330" 
                    fill="none" 
                    stroke="url(#wire-pink)" 
                    strokeWidth="2.5" 
                    strokeDasharray="4 4"
                  />
                  {/* Accessories & Mods Wire */}
                  <path 
                    d="M 280 450 C 370 450, 360 345, 470 345" 
                    fill="none" 
                    stroke="url(#wire-blue)" 
                    strokeWidth="2.5" 
                    strokeDasharray="4 4"
                  />
                  {/* Reference Asset Wire (from bottom-left image card) */}
                  <path 
                    d="M 120 500 C 120 400, 360 360, 470 360" 
                    fill="none" 
                    stroke="#8E846A" 
                    strokeWidth="1.5" 
                    strokeOpacity="0.5"
                    strokeDasharray="5 5"
                  />
                </>
              )}
            </svg>

            {/* Canvas Header Hud */}
            <div className="w-full bg-[#111624]/90 border-b border-[#21293d] px-6 py-3.5 flex items-center justify-between z-20">
              <div className="flex items-center gap-2.5">
                <Workflow className="w-4 h-4 text-theme-accent" />
                <span className="font-mono text-[10px] font-black text-theme-accent uppercase tracking-widest">BLUEPRINT V1.2 · GRAPH VIEW</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="font-mono text-[9px] text-theme-muted uppercase font-bold tracking-wider">compiler: stable</span>
              </div>
            </div>

            {/* Nodes Grid Layer */}
            <div className="flex-grow p-6 relative z-10 flex flex-col justify-between">
              
              {/* Top/Mid Section: Node Modules stacked on left, processor on right */}
              <div className="flex justify-between h-full items-start gap-4">
                
                {/* Left Columns: Customize Nodes Stack */}
                <div className="flex flex-col gap-4 w-[280px]">
                  
                  {/* Node 1: Body Geometry */}
                  <div 
                    onClick={() => setActiveNode("body_geometry")}
                    className={`rounded-xl border transition-all text-left overflow-hidden cursor-pointer ${activeNode === "body_geometry" ? "bg-[#181e30] border-theme-accent shadow-lg shadow-theme-accent/10" : "bg-[#121624] border-[#222a3d] hover:border-[#3a4563]"}`}
                  >
                    <div className="bg-[#1f263c] px-4 py-2 border-b border-[#2d3856] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-theme-accent" />
                        <span className="font-mono text-[10px] font-bold text-white uppercase">BODY GEOMETRY</span>
                      </div>
                      <span className="text-[8px] bg-theme-accent/20 text-theme-accent px-1.5 py-0.5 rounded font-mono font-bold">NODE_01</span>
                    </div>
                    <div className="p-3 text-[10px] font-mono text-theme-muted space-y-1">
                      <div className="flex justify-between">
                        <span className="opacity-60">GENDER/RACE:</span> 
                        <span className="text-white font-bold truncate max-w-[120px]">{gender} ({fantasyRace})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-60">HEIGHT/FAT:</span> 
                        <span className="text-theme-accent-blue font-bold">{height}cm / {fatLevel}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-60">BREAST SIZE:</span> 
                        <span className="text-white">{breastSize}</span>
                      </div>
                      
                      {/* Port socket representation */}
                      <div className="pt-2 flex justify-end">
                        <div className="flex items-center gap-1.5 text-[8px] text-theme-accent">
                          <span className="font-bold">OUT</span>
                          <div className="w-2.5 h-2.5 rounded-full bg-theme-accent border-2 border-[#121624] animate-ping absolute"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-theme-accent border-2 border-[#121624] z-20"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Node 2: Facial Anatomy */}
                  <div 
                    onClick={() => setActiveNode("face")}
                    className={`rounded-xl border transition-all text-left overflow-hidden cursor-pointer ${activeNode === "face" ? "bg-[#181e30] border-theme-accent-blue shadow-lg shadow-theme-accent-blue/10" : "bg-[#121624] border-[#222a3d] hover:border-[#3a4563]"}`}
                  >
                    <div className="bg-[#1f263c] px-4 py-2 border-b border-[#2d3856] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Palette className="w-3.5 h-3.5 text-theme-accent-blue" />
                        <span className="font-mono text-[10px] font-bold text-white uppercase">FACIAL ANATOMY</span>
                      </div>
                      <span className="text-[8px] bg-theme-accent-blue/20 text-theme-accent-blue px-1.5 py-0.5 rounded font-mono font-bold">NODE_02</span>
                    </div>
                    <div className="p-3 text-[10px] font-mono text-theme-muted space-y-1">
                      <div className="flex justify-between"><span className="opacity-60">FACE SHAPE:</span> <span className="text-white font-bold truncate max-w-[120px]">{faceType}</span></div>
                      <div className="flex justify-between"><span className="opacity-60">EYES / LIPS:</span> <span className="text-theme-accent-blue font-bold truncate max-w-[120px]">{eyesShape} / {lipsStyle}</span></div>
                      <div className="flex justify-between"><span className="opacity-60">SKIN:</span> <span className="text-white truncate max-w-[120px]">{skinColor}</span></div>
                      
                      {/* Port socket representation */}
                      <div className="pt-2 flex justify-end">
                        <div className="flex items-center gap-1.5 text-[8px] text-theme-accent-blue">
                          <span className="font-bold">OUT</span>
                          <div className="w-2.5 h-2.5 rounded-full bg-theme-accent-blue border-2 border-[#121624] z-20"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Node 3: Apparel & Style */}
                  <div 
                    onClick={() => setActiveNode("apparel")}
                    className={`rounded-xl border transition-all text-left overflow-hidden cursor-pointer ${activeNode === "apparel" ? "bg-[#181e30] border-theme-accent shadow-lg shadow-theme-accent/10" : "bg-[#121624] border-[#222a3d] hover:border-[#3a4563]"}`}
                  >
                    <div className="bg-[#1f263c] px-4 py-2 border-b border-[#2d3856] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shirt className="w-3.5 h-3.5 text-theme-accent" />
                        <span className="font-mono text-[10px] font-bold text-white uppercase">APPAREL & STYLE</span>
                      </div>
                      <span className="text-[8px] bg-theme-accent/20 text-theme-accent px-1.5 py-0.5 rounded font-mono font-bold">NODE_03</span>
                    </div>
                    <div className="p-3 text-[10px] font-mono text-theme-muted space-y-1">
                      <div className="flex justify-between"><span className="opacity-60">THEME / HAIR:</span> <span className="text-white font-bold truncate max-w-[120px]">{clothingStyle} / {hairStyle}</span></div>
                      <div className="flex justify-between"><span className="opacity-60">COLORWAY:</span> <span className="text-theme-accent-blue font-bold truncate max-w-[120px]">{clothingColor}</span></div>
                      
                      {/* Port socket representation */}
                      <div className="pt-2 flex justify-end">
                        <div className="flex items-center gap-1.5 text-[8px] text-theme-accent">
                          <span className="font-bold">OUT</span>
                          <div className="w-2.5 h-2.5 rounded-full bg-theme-accent border-2 border-[#121624] z-20"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Node 4: Accessories & Mods */}
                  <div 
                    onClick={() => setActiveNode("mods")}
                    className={`rounded-xl border transition-all text-left overflow-hidden cursor-pointer ${activeNode === "mods" ? "bg-[#181e30] border-theme-accent-blue shadow-lg shadow-theme-accent-blue/10" : "bg-[#121624] border-[#222a3d] hover:border-[#3a4563]"}`}
                  >
                    <div className="bg-[#1f263c] px-4 py-2 border-b border-[#2d3856] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Palette className="w-3.5 h-3.5 text-theme-accent-blue" />
                        <span className="font-mono text-[10px] font-bold text-white uppercase">ACCESSORIES & MODS</span>
                      </div>
                      <span className="text-[8px] bg-theme-accent-blue/20 text-theme-accent-blue px-1.5 py-0.5 rounded font-mono font-bold">NODE_04</span>
                    </div>
                    <div className="p-3 text-[10px] font-mono text-theme-muted space-y-1">
                      <div className="flex justify-between"><span className="opacity-60">TATTOOS:</span> <span className="text-white truncate max-w-[120px]">{tattoos}</span></div>
                      <div className="flex justify-between"><span className="opacity-60">ACCESSORY:</span> <span className="text-theme-accent font-bold truncate max-w-[120px]">{accessories}</span></div>
                      
                      {/* Port socket representation */}
                      <div className="pt-2 flex justify-end">
                        <div className="flex items-center gap-1.5 text-[8px] text-theme-accent-blue">
                          <span className="font-bold">OUT</span>
                          <div className="w-2.5 h-2.5 rounded-full bg-theme-accent-blue border-2 border-[#121624] z-20"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Right Side: Execution Core Processor Node */}
                <div className="w-[280px] self-center">
                  <div className="rounded-2xl border-2 border-[#FF5A79] bg-[#14121a] text-left overflow-hidden shadow-2xl shadow-theme-accent/20">
                    <div className="bg-gradient-to-r from-[#FF5A79] to-[#4BA3E3] px-5 py-3 border-b border-theme-accent flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-white animate-spin-slow" />
                        <span className="font-mono text-[10px] font-black text-white uppercase tracking-wider">FABRICATION_CORE</span>
                      </div>
                      <span className="text-[8px] bg-black/40 text-white px-2 py-0.5 rounded font-mono font-bold">COMPILE</span>
                    </div>
                    
                    <div className="p-4 space-y-4 font-mono text-[10px] text-theme-muted">
                      
                      {/* Port sockets receiving wire entries */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-theme-accent border-2 border-[#14121a]"></div>
                          <span className="text-white">● BODY_GEOMETRY_IN [NODE_01]</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#4BA3E3] border-2 border-[#14121a]"></div>
                          <span className="text-white">● FACE_IN [NODE_02]</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-theme-accent border-2 border-[#14121a]"></div>
                          <span className="text-white">● APPAREL_IN [NODE_03]</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#4BA3E3] border-2 border-[#14121a]"></div>
                          <span className="text-white">● MODS_IN [NODE_04]</span>
                        </div>
                      </div>

                      <div className="border-t border-[#31232d] pt-3 text-[9px] text-[#FF5A79]">
                        <span>INPUT STATUS: SYNCHRONIZED</span>
                      </div>

                      <button 
                        onClick={handleFabricateCharacter}
                        disabled={isGenerating}
                        className="w-full py-2.5 bg-[#FF5A79] hover:bg-white text-white hover:text-theme-text hover:shadow-[0_0_15px_rgba(255,90,121,0.6)] font-black text-[9px] uppercase tracking-widest rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-white mix-blend-difference" />
                        {lang === 'jp' ? "設計図のコンパイル" : "Compile Blueprint"}
                      </button>

                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Row: Local seed asset reference card */}
              <div className="flex items-end mt-4">
                {initialInputImage && (
                  <div className="bg-[#121624] border border-[#222a3d] rounded-xl p-3 flex items-center gap-3 max-w-[340px] text-left z-20">
                    <img 
                      src={initialInputImage} 
                      alt="Source likeness seed" 
                      className="w-12 h-12 rounded object-cover border border-[#2d3856]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="font-mono text-[9px]">
                      <p className="text-white font-bold uppercase tracking-tight">LIKENESS SEED ACTIVE</p>
                      <p className="text-theme-muted">Synthesizer maintains original visual likeness configurations.</p>
                    </div>
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Active Node Parameter Editing Panel */}
          <div className="w-full bg-theme-surface border border-theme-border p-6 rounded-2xl text-left shadow-sm">
            
            {/* Header with Sub Tab Controls: Manual Settings vs AI Image References */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme-border pb-4 mb-6">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-theme-accent/10 text-theme-accent rounded-lg">
                  {activeNode === "body_geometry" ? <User className="w-5 h-5" /> :
                   activeNode === "face" ? <Palette className="w-5 h-5" /> :
                   activeNode === "apparel" ? <Shirt className="w-5 h-5" /> :
                   <Sparkles className="w-5 h-5" />}
                </span>
                <div>
                  <h3 className="text-sm font-black uppercase text-theme-text tracking-wide">
                    {activeNode === "body_geometry" ? (lang === 'jp' ? "ノード 01: 身体幾何学 (Body Geometry)" : "Node 01: Body Geometry Specs") :
                     activeNode === "face" ? (lang === 'jp' ? "ノード 02: フェイシャル & スキン" : "Node 02: Facial Anatomy & Skin") :
                     activeNode === "apparel" ? (lang === 'jp' ? "ノード 03: アパレル & ファッション" : "Node 03: Apparel & Outfitting") :
                     (lang === 'jp' ? "ノード 04: オーグメンテーション & 装飾" : "Node 04: Accessories & Alterations")}
                  </h3>
                  <p className="text-[9px] text-theme-muted font-mono font-bold tracking-wider mt-0.5 uppercase">
                    {lang === 'jp' ? "属性の手動調整またはAI画像リファレンスからインポート" : "Select manual parameters or synchronize through visual references"}
                  </p>
                </div>
              </div>

              {/* Sub Tab Switchers */}
              <div className="bg-theme-bg p-1 rounded-xl flex items-center border border-theme-border self-start sm:self-auto">
                <button 
                  onClick={() => setParamTab('attributes')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all ${paramTab === 'attributes' ? "bg-theme-surface text-theme-text shadow-sm" : "text-theme-muted hover:text-theme-text"}`}
                >
                  {lang === 'jp' ? "手動アトリビュート" : "Manual Attributes"}
                </button>
                <button 
                  onClick={() => setParamTab('references')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1.5 ${paramTab === 'references' ? "bg-theme-surface text-theme-text shadow-sm" : "text-theme-muted hover:text-theme-text"}`}
                >
                  <Upload className="w-3 h-3 text-theme-accent" />
                  {lang === 'jp' ? "リファレンス画像インジェクター" : "AI Reference Uploads"}
                  {Object.values(syncStatus).filter((s: any) => s.active).length > 0 && (
                    <span className="bg-theme-accent text-white text-[8px] font-bold px-1 py-0.1 rounded-full">
                      {Object.values(syncStatus).filter((s: any) => s.active).length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Sub Tab Panel 1: Interactive Attribute Editors */}
            {paramTab === 'attributes' && (
              <AnimatePresence mode="wait">
                
                {/* NODE 01: BODY GEOMETRY */}
                {activeNode === "body_geometry" && (
                  <motion.div 
                    key="body_geometry" 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }} 
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted">Gender (性別)</label>
                          {syncStatus.faceColor.active && <span className="text-[8px] bg-emerald-500/10 text-emerald-500 font-bold px-1.5 py-0.5 rounded font-mono">SYNCED</span>}
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {["Female", "Male", "Non-binary", "Androgynous Cyborg", "Eldritch Celestial"].map(g => (
                            <button 
                              key={g} 
                              onClick={() => setGender(g)} 
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all ${gender === g ? "bg-theme-accent text-white font-black" : "bg-theme-bg text-theme-muted hover:text-theme-text"}`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block mb-2">Race (人種/種族)</label>
                        <div className="flex gap-1.5 flex-wrap">
                          {["Asian", "Caucasian", "Extraterrestrial", "Elf", "Cyborg/Synth"].map(r => (
                            <button 
                              key={r} 
                              onClick={() => setFantasyRace(r)} 
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all ${fantasyRace === r ? "bg-theme-accent-blue text-white font-black" : "bg-theme-bg text-theme-muted hover:text-theme-text"}`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block">Breast size (胸のサイズ)</label>
                          {syncStatus.breastSize.active && <span className="text-[8px] bg-emerald-500/10 text-emerald-500 font-bold px-1.5 py-0.5 rounded font-mono">REF SYNCED</span>}
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {["Balanced Full", "Flat Petite", "Compact Athletic", "Voluminous"].map(bs => (
                            <button 
                              key={bs} 
                              onClick={() => setBreastSize(bs)} 
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all ${breastSize === bs ? "bg-theme-accent text-white font-black" : "bg-theme-bg text-theme-muted hover:text-theme-text"}`}
                            >
                              {bs}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted">Height (身長)</label>
                          <div className="flex items-center gap-2">
                            {syncStatus.height.active && <span className="text-[8px] bg-emerald-500/10 text-emerald-500 font-mono font-bold px-1.5 py-0.5 rounded">SYNCED {syncStatus.height.confidence}%</span>}
                            <span className="text-[10px] font-bold font-mono text-theme-accent">{height} cm</span>
                          </div>
                        </div>
                        <input 
                          type="range" 
                          min="130" 
                          max="220" 
                          value={height} 
                          onChange={(e) => setHeight(parseInt(e.target.value))}
                          className="w-full accent-theme-accent bg-theme-border-light h-1.5 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-[8px] text-theme-muted font-mono mt-1">Calculates skeletal bounds on dynamic concept canvas.</p>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted">Body Fat Level (体脂肪率)</label>
                          <div className="flex items-center gap-2">
                            {syncStatus.fatLevel.active && <span className="text-[8px] bg-emerald-500/10 text-emerald-500 font-mono font-bold px-1.5 py-0.5 rounded">SYNCED {syncStatus.fatLevel.confidence}%</span>}
                            <span className="text-[10px] font-bold font-mono text-theme-accent">{fatLevel}%</span>
                          </div>
                        </div>
                        <input 
                          type="range" 
                          min="5" 
                          max="50" 
                          value={fatLevel} 
                          onChange={(e) => setFatLevel(parseInt(e.target.value))}
                          className="w-full accent-theme-accent bg-theme-border-light h-1.5 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-[8px] text-theme-muted font-mono mt-1">Solves muscle definition and subcutaneous layers.</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* NODE 02: FACE */}
                {activeNode === "face" && (
                  <motion.div 
                    key="face" 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }} 
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  >
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block">Face Type (輪郭形状)</label>
                          {syncStatus.faceShape.active && <span className="text-[8px] text-emerald-500 font-bold font-mono">SYNCED</span>}
                        </div>
                        <select 
                          value={faceType} 
                          onChange={(e) => setFaceType(e.target.value)}
                          className="w-full bg-theme-bg text-[10px] font-bold font-mono p-2 border border-theme-border rounded-lg text-theme-text focus:outline-none focus:border-theme-accent"
                        >
                          {["Chiseled Oval", "Sharp Square", "Heart-shaped", "Soft Round", "Sleek Diamond", "Feminine Pixie", "Rugged Angular"].map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block">Eyes shape (目の形状)</label>
                          {syncStatus.eyesShape.active && <span className="text-[8px] text-emerald-500 font-bold font-mono">SYNCED</span>}
                        </div>
                        <select 
                          value={eyesShape} 
                          onChange={(e) => setEyesShape(e.target.value)}
                          className="w-full bg-theme-bg text-[10px] font-bold font-mono p-2 border border-theme-border rounded-lg text-theme-text focus:outline-none"
                        >
                          {["Almond Anime", "Wide Oceanic", "Cat-like Slanted", "Heavy Lid", "Sleek Monolid", "Glow-Visor Synthetic", "Sultry Narrow"].map(e => (
                            <option key={e} value={e}>{e}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block">Eyes color (瞳の色)</label>
                          {syncStatus.eyesColor.active && <span className="text-[8px] text-emerald-500 font-bold font-mono">SYNCED</span>}
                        </div>
                        <select 
                          value={eyesColor} 
                          onChange={(e) => setEyesColor(e.target.value)}
                          className="w-full bg-theme-bg text-[10px] font-bold font-mono p-2 border border-theme-border rounded-lg text-theme-text focus:outline-none"
                        >
                          {["Neon Blue", "Sapphire Blue", "Emerald Green", "Glowing Amber", "Viper Crimson", "Pale Amethyst", "Molten Gold", "Void Black"].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block mb-1.5">Nose type (鼻の形状)</label>
                        <select 
                          value={noseStyle} 
                          onChange={(e) => setNoseStyle(e.target.value)}
                          className="w-full bg-theme-bg text-[10px] font-bold font-mono p-2 border border-theme-border rounded-lg text-theme-text focus:outline-none"
                        >
                          {["Straight Delicate", "Small Button", "Chiseled Aquiline", "Sleek Narrow", "Rugged Pierced"].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block">Lips (唇)</label>
                          {syncStatus.lips.active && <span className="text-[8px] text-emerald-500 font-bold font-mono">SYNCED</span>}
                        </div>
                        <select 
                          value={lipsStyle} 
                          onChange={(e) => setLipsStyle(e.target.value)}
                          className="w-full bg-theme-bg text-[10px] font-bold font-mono p-2 border border-theme-border rounded-lg text-theme-text focus:outline-none"
                        >
                          {["Plush", "Thin Elegant", "Perfect Bow", "Cyber-plated", "Glossy Tinted"].map(l => (
                            <option key={l} value={l}>{l}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block mb-1.5">Ears Shape (耳の形状)</label>
                        <select 
                          value={earsStyle} 
                          onChange={(e) => setEarsStyle(e.target.value)}
                          className="w-full bg-theme-bg text-[10px] font-bold font-mono p-2 border border-theme-border rounded-lg text-theme-text focus:outline-none"
                        >
                          {["Elf Pointed", "Human Rounded", "Cyber-earpiece fitted", "Dreadlock-covered", "Slightly pointed"].map(ear => (
                            <option key={ear} value={ear}>{ear}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block">Skin color (肌の色)</label>
                          {syncStatus.faceColor.active && <span className="text-[8px] text-emerald-500 font-bold font-mono">SYNCED</span>}
                        </div>
                        <select 
                          value={skinColor} 
                          onChange={(e) => setSkinColor(e.target.value)}
                          className="w-full bg-theme-bg text-[10px] font-bold font-mono p-2 border border-theme-border rounded-lg text-theme-text focus:outline-none"
                        >
                          {["Alabaster Pale", "Warm Peach", "Sun-kissed Olive", "Rich Bronze Dark", "Crystalline Blue-grey", "Synth-Steel Chrome"].map(sk => (
                            <option key={sk} value={sk}>{sk}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block mb-1.5">Skin texture (肌の質感)</label>
                        <select 
                          value={skinTexture} 
                          onChange={(e) => setSkinTexture(e.target.value)}
                          className="w-full bg-theme-bg text-[10px] font-bold font-mono p-2 border border-theme-border rounded-lg text-theme-text focus:outline-none"
                        >
                          {["Porcelain Smooth", "Battle-scarred Rough", "Charming Freckled", "Carbon-nanowire embedded", "Silicone Synth-Skin"].map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block mb-1.5">Eyebrows (眉毛)</label>
                        <select 
                          value={eyebrowsStyle} 
                          onChange={(e) => setEyebrowsStyle(e.target.value)}
                          className="w-full bg-theme-bg text-[10px] font-bold font-mono p-2 border border-theme-border rounded-lg text-theme-text focus:outline-none"
                        >
                          {["Arch Fine", "Sharp Slash", "Bushy Natural", "Bleached invisible", "Shaved slit"].map(eb => (
                            <option key={eb} value={eb}>{eb}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* NODE 03: APPAREL */}
                {activeNode === "apparel" && (
                  <motion.div 
                    key="apparel" 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }} 
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div className="space-y-4">
                      <div>
                        <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block mb-2">Hairstyle (髪型)</label>
                        <div className="flex gap-1.5 flex-wrap">
                          {["Messy Ponytail", "Undercut Mohawk", "Long Straight Silky", "Spiky Anime Shag", "Formal Geisha Bob", "Pixie Buzzcut"].map(h => (
                            <button 
                              key={h} 
                              onClick={() => setHairStyle(h)} 
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all ${hairStyle === h ? "bg-theme-accent text-white font-black" : "bg-theme-bg text-theme-muted hover:text-theme-text"}`}
                            >
                              {h}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block mb-2">Hair color (髪の色)</label>
                        <div className="flex gap-1.5 flex-wrap">
                          {["Electric Pink", "Black Obsidian", "Blonde Gold", "Silver White", "Neon Emerald", "Electric Turquoise", "Crimson Scarlet"].map(hc => (
                            <button 
                              key={hc} 
                              onClick={() => setHairColor(hc)} 
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono transition-all ${hairColor === hc ? "bg-theme-accent-blue text-white font-black" : "bg-theme-bg text-theme-muted hover:text-theme-text"}`}
                            >
                              {hc}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block mb-1.5">Apparel Theme (服装)</label>
                          <select 
                            value={clothingStyle} 
                            onChange={(e) => setClothingStyle(e.target.value)}
                            className="w-full bg-theme-bg text-[10px] font-bold font-mono p-2 border border-theme-border rounded-lg text-theme-text focus:outline-none"
                          >
                            {["Cyberwear Suit", "Plated Samurai Armor", "Urban Streetwear", "Tactical Combat Gear", "Formal Combat Kimono", "Bikini Battle-suit", "Sleek Agent Catsuit"].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block mb-1.5">Top clothing (アウター)</label>
                          <select 
                            value={topPiece} 
                            onChange={(e) => setTopPiece(e.target.value)}
                            className="w-full bg-theme-bg text-[10px] font-bold font-mono p-2 border border-theme-border rounded-lg text-theme-text focus:outline-none"
                          >
                            {["Cropped Tactical Jacket", "High-collar trenchcoat", "Rigid Chestplate Armor", "Cyber-mesh Tank", "Flared sleeves top", "Formal Haori"].map(tp => (
                              <option key={tp} value={tp}>{tp}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block mb-1.5">Bottom (ボトムス)</label>
                          <select 
                            value={bottomPiece} 
                            onChange={(e) => setBottomPiece(e.target.value)}
                            className="w-full bg-theme-bg text-[10px] font-bold font-mono p-2 border border-theme-border rounded-lg text-theme-text focus:outline-none"
                          >
                            {["High-tech Cargo Pants", "Plated Shin-Guards Trousers", "Tactical Shorts with Holster", "Cybernetic tights", "Pleiad Combat skirt"].map(bp => (
                              <option key={bp} value={bp}>{bp}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block mb-1.5">Shoes Style (靴)</label>
                          <select 
                            value={shoesStyle} 
                            onChange={(e) => setShoesStyle(e.target.value)}
                            className="w-full bg-theme-bg text-[10px] font-bold font-mono p-2 border border-theme-border rounded-lg text-theme-text focus:outline-none"
                          >
                            {["Armored High-tops", "Steel-toe combat boots", "Cyber Ninja tabi shoes", "Heeled combat boots", "Techwear sneakers"].map(sh => (
                              <option key={sh} value={sh}>{sh}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block">Clothing Primary Color (服の配色)</label>
                          {syncStatus.bodyColor.active && <span className="text-[8px] text-emerald-500 font-bold font-mono">REF SYNCED</span>}
                        </div>
                        <select 
                          value={clothingColor} 
                          onChange={(e) => setClothingColor(e.target.value)}
                          className="w-full bg-theme-bg text-[10px] font-bold font-mono p-2 border border-theme-border rounded-lg text-theme-text focus:outline-none"
                        >
                          {["Obsidian & Crimson", "Midnight Black with Neon Pink trim", "Olive Green & Desert Tan", "Snow-white & Chrome Silver", "Runic Crimson & Ancient Gold"].map(cl => (
                            <option key={cl} value={cl}>{cl}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* NODE 04: MODS */}
                {activeNode === "mods" && (
                  <motion.div 
                    key="mods" 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }} 
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  >
                    <div>
                      <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block mb-1.5">Tattoos & Markings (タトゥー)</label>
                      <select 
                        value={tattoos} 
                        onChange={(e) => setTattoos(e.target.value)}
                        className="w-full bg-theme-bg text-[10px] font-bold font-mono p-2 border border-theme-border rounded-lg text-theme-text focus:outline-none"
                      >
                        {["Neon Cyber-Runes", "Yakuza Cherry Blossom Sleeve", "Celtic Tribals on shoulders", "Tribal markings", "Geometric glowing arrays", "None"].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block mb-1.5">Piercings (ピアス)</label>
                      <select 
                        value={piercings} 
                        onChange={(e) => setPiercings(e.target.value)}
                        className="w-full bg-theme-bg text-[10px] font-bold font-mono p-2 border border-theme-border rounded-lg text-theme-text focus:outline-none"
                      >
                        {["Double Ear Piercings", "Septum nose piercing", "Cybrow studs", "Lip micro-ring", "Ear cuff matrix", "None"].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block mb-1.5">Accessories (アクセサリー)</label>
                      <select 
                        value={accessories} 
                        onChange={(e) => setAccessories(e.target.value)}
                        className="w-full bg-theme-bg text-[10px] font-bold font-mono p-2 border border-theme-border rounded-lg text-theme-text focus:outline-none"
                      >
                        {["Holowear Visor Glasses", "Traditional Ronin straw-hat", "Cyber-collar choke neckpiece", "Sleek red ninja scarf", "Carbon-fiber Shoulder pauldron", "None"].map(acc => (
                          <option key={acc} value={acc}>{acc}</option>
                        ))}
                      </select>
                    </div>

                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-theme-border pt-4 text-left">
                      <div>
                        <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block mb-1.5">Hips curves (腰回り)</label>
                        <select 
                          value={hipsSize} 
                          onChange={(e) => setHipsSize(e.target.value)}
                          className="w-full bg-theme-bg text-[10px] font-bold font-mono p-2 border border-theme-border rounded-lg text-theme-text focus:outline-none"
                        >
                          {["Athletic Curvy", "Sleek Narrow", "Classic Hourglass", "Exaggerated Curvaceous"].map(hs => (
                            <option key={hs} value={hs}>{hs}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block mb-1.5">Legs Proportion (足の長さ)</label>
                        <select 
                          value={legsLength} 
                          onChange={(e) => setLegsLength(e.target.value)}
                          className="w-full bg-theme-bg text-[10px] font-bold font-mono p-2 border border-theme-border rounded-lg text-theme-text focus:outline-none"
                        >
                          {["Sleek Long", "Towering Extra Long", "Petite Compact"].map(ll => (
                            <option key={ll} value={ll}>{ll}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted block mb-1.5">Muscle Level (筋肉量)</label>
                        <select 
                          value={muscleLevel} 
                          onChange={(e) => setMuscleLevel(e.target.value)}
                          className="w-full bg-theme-bg text-[10px] font-bold font-mono p-2 border border-theme-border rounded-lg text-theme-text focus:outline-none"
                        >
                          {["Toned Fighter", "Slender Model", "Shredded Athletic", "Titan Juggernaut"].map(ml => (
                            <option key={ml} value={ml}>{ml}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted">Model Age (外見年齢)</label>
                          <span className="text-[10px] font-bold font-mono text-theme-accent">{age}y</span>
                        </div>
                        <input 
                          type="range" 
                          min="16" 
                          max="90" 
                          value={age} 
                          onChange={(e) => setAge(parseInt(e.target.value))}
                          className="w-full accent-theme-accent bg-theme-border-light h-1.5 rounded appearance-none cursor-pointer mt-1"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            )}

            {/* Sub Tab Panel 2: AI Reference Image Injectors */}
            {paramTab === 'references' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-6"
              >
                {/* Visual Header notification banner */}
                <div className="bg-theme-accent/5 border border-theme-accent/20 rounded-xl p-4 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-theme-accent shrink-0 mt-0.5" />
                  <div className="text-left font-mono text-[9px] text-theme-muted leading-relaxed">
                    <span className="text-white font-black uppercase block mb-1">REAL-TIME WEIGHT INJECTORS ACTIVE</span>
                    Upload reference photos or load simulated design assets below. The neural mapping algorithm automatically parses geometric curves, irises, tones, and boundaries, mapping the attributes directly onto Node 01 and Node 02 properties!
                  </div>
                </div>

                {/* Grid of 9 Upload Panels */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Slot 1: Face Shape Reference */}
                  <ReferenceUploadBox 
                    label={lang === 'jp' ? "顔の輪郭" : "Face Shape Reference"}
                    desc="Updates Face Type contour"
                    referenceKey="faceShape"
                    imgSrc={faceShapeRef}
                    status={syncStatus.faceShape}
                    onFileSelected={(file) => handleReferenceFileChange("faceShape", file)}
                    onLoadDemo={() => triggerDemoSample("faceShape")}
                    onClear={() => clearReference("faceShape")}
                  />

                  {/* Slot 2: Lips Reference */}
                  <ReferenceUploadBox 
                    label={lang === 'jp' ? "唇の形" : "Lips Style Reference"}
                    desc="Updates lips plumpness"
                    referenceKey="lips"
                    imgSrc={lipsRef}
                    status={syncStatus.lips}
                    onFileSelected={(file) => handleReferenceFileChange("lips", file)}
                    onLoadDemo={() => triggerDemoSample("lips")}
                    onClear={() => clearReference("lips")}
                  />

                  {/* Slot 3: Eyes Shape Reference */}
                  <ReferenceUploadBox 
                    label={lang === 'jp' ? "目の形状" : "Eyes Shape Reference"}
                    desc="Updates eyelids & slant ratio"
                    referenceKey="eyesShape"
                    imgSrc={eyesShapeRef}
                    status={syncStatus.eyesShape}
                    onFileSelected={(file) => handleReferenceFileChange("eyesShape", file)}
                    onLoadDemo={() => triggerDemoSample("eyesShape")}
                    onClear={() => clearReference("eyesShape")}
                  />

                  {/* Slot 4: Eyes Color Reference */}
                  <ReferenceUploadBox 
                    label={lang === 'jp' ? "瞳の色" : "Eyes Color Reference"}
                    desc="Extracts iris color spectrum"
                    referenceKey="eyesColor"
                    imgSrc={eyesColorRef}
                    status={syncStatus.eyesColor}
                    onFileSelected={(file) => handleReferenceFileChange("eyesColor", file)}
                    onLoadDemo={() => triggerDemoSample("eyesColor")}
                    onClear={() => clearReference("eyesColor")}
                  />

                  {/* Slot 5: Face Color Reference */}
                  <ReferenceUploadBox 
                    label={lang === 'jp' ? "顔の肌色" : "Face Color Reference"}
                    desc="Extracts skin tone colorway"
                    referenceKey="faceColor"
                    imgSrc={faceColorRef}
                    status={syncStatus.faceColor}
                    onFileSelected={(file) => handleReferenceFileChange("faceColor", file)}
                    onLoadDemo={() => triggerDemoSample("faceColor")}
                    onClear={() => clearReference("faceColor")}
                  />

                  {/* Slot 6: Body Color Reference */}
                  <ReferenceUploadBox 
                    label={lang === 'jp' ? "服/身体の配色" : "Body Color Reference"}
                    desc="Extracts suit or armor theme"
                    referenceKey="bodyColor"
                    imgSrc={bodyColorRef}
                    status={syncStatus.bodyColor}
                    onFileSelected={(file) => handleReferenceFileChange("bodyColor", file)}
                    onLoadDemo={() => triggerDemoSample("bodyColor")}
                    onClear={() => clearReference("bodyColor")}
                  />

                  {/* Slot 7: Breast Size Reference */}
                  <ReferenceUploadBox 
                    label={lang === 'jp' ? "胸のプロポーション" : "Breast Size Reference"}
                    desc="Scales bust contours on Node 01"
                    referenceKey="breastSize"
                    imgSrc={breastSizeRef}
                    status={syncStatus.breastSize}
                    onFileSelected={(file) => handleReferenceFileChange("breastSize", file)}
                    onLoadDemo={() => triggerDemoSample("breastSize")}
                    onClear={() => clearReference("breastSize")}
                  />

                  {/* Slot 8: Height Reference */}
                  <ReferenceUploadBox 
                    label={lang === 'jp' ? "身長比率" : "Height Reference"}
                    desc="Configures skeletal scale"
                    referenceKey="height"
                    imgSrc={heightRef}
                    status={syncStatus.height}
                    onFileSelected={(file) => handleReferenceFileChange("height", file)}
                    onLoadDemo={() => triggerDemoSample("height")}
                    onClear={() => clearReference("height")}
                  />

                  {/* Slot 9: Fat Level Reference */}
                  <ReferenceUploadBox 
                    label={lang === 'jp' ? "体脂肪率比率" : "Fat Level Reference"}
                    desc="Configures definition/curves"
                    referenceKey="fatLevel"
                    imgSrc={fatLevelRef}
                    status={syncStatus.fatLevel}
                    onFileSelected={(file) => handleReferenceFileChange("fatLevel", file)}
                    onLoadDemo={() => triggerDemoSample("fatLevel")}
                    onClear={() => clearReference("fatLevel")}
                  />

                </div>

                {/* Reference Analysis Console logs */}
                <div className="bg-[#111624] border border-[#222a3d] rounded-xl p-4 font-mono text-[9px] text-left">
                  <div className="flex items-center justify-between border-b border-[#222a3d] pb-2 mb-2">
                    <span className="text-white font-black tracking-wider uppercase flex items-center gap-1.5 text-[8px]">
                      <Activity className="w-3.5 h-3.5 text-theme-accent animate-pulse" />
                      AI ANALYSIS MATRIX LOGS
                    </span>
                    <span className="text-[#8ea0cc] text-[8px]">STABLE ENGINE</span>
                  </div>

                  <div className="space-y-1.5 max-h-[110px] overflow-y-auto custom-scrollbar pr-1">
                    {refLogs.length > 0 ? (
                      refLogs.map((log, index) => (
                        <div key={index} className="flex gap-2 text-theme-muted hover:text-white transition-colors py-0.5">
                          <span className="text-theme-accent shrink-0 font-bold">[{log.time}]</span>
                          <span className="text-theme-accent-blue font-bold shrink-0">[{log.type.toUpperCase()}]</span>
                          <span className="leading-relaxed">{log.msg}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-[#8ea0cc] italic opacity-50 py-2">
                        No reference scans recorded yet. Upload a picture or load samples to trigger direct node synchronization.
                      </div>
                    )}
                  </div>
                </div>

              </motion.div>
            )}

          </div>

        </div>

        {/* Right Side: Execution HUD & Saved Character Presets (Cols 9 to 12) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Output Preview Window */}
          <div className="bg-theme-surface border border-theme-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
            
            <div className="bg-theme-muted/5 border-b border-theme-border px-5 py-4 flex justify-between items-center text-left">
              <div>
                <h4 className="text-xs font-black uppercase text-theme-text tracking-wider">{lang === 'jp' ? "合成結果" : "Synthesis Result"}</h4>
                <p className="text-[8px] text-theme-muted font-mono uppercase font-bold tracking-widest mt-0.5">Asset fabricated from Compiled specifications</p>
              </div>
              <Bookmark className="w-4 h-4 text-theme-accent" />
            </div>

            <div className="p-6 flex flex-col items-center justify-center bg-theme-bg/10 min-h-[340px] relative">
              
              {/* Spinning particle loader overlay when generating */}
              {isGenerating && (
                <div className="absolute inset-0 bg-[#0e111a]/95 z-30 flex flex-col items-center justify-center p-8 text-center text-white font-mono">
                  <div className="w-16 h-16 rounded-full border-4 border-t-[#FF5A79] border-r-transparent border-b-[#4BA3E3] border-l-transparent animate-spin mb-6"></div>
                  
                  <div className="text-[10px] uppercase font-black tracking-widest text-[#FF5A79] animate-pulse mb-2">
                    {lang === 'jp' ? "コンパイル進行中" : "FABRICATING_ASSET"}
                  </div>
                  
                  <div className="w-48 bg-white/10 h-1.5 rounded-full overflow-hidden mb-4">
                    <div className="bg-gradient-to-r from-[#FF5A79] to-[#4BA3E3] h-full transition-all duration-300" style={{ width: `${generationProgress}%` }}></div>
                  </div>

                  <p className="text-[9px] text-[#8ea0cc] max-w-[200px] leading-relaxed italic">{generationStatus}</p>
                </div>
              )}

              {/* Real character rendered content */}
              {generatedImageUrl ? (
                <div className="w-full flex flex-col items-center gap-4">
                  <div className="w-full aspect-square rounded-xl overflow-hidden border border-theme-border bg-white shadow-md flex items-center justify-center relative group">
                    <img 
                      src={generatedImageUrl} 
                      alt="Compiled Character" 
                      className="w-full h-full object-contain transition-all group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />

                    {/* Image watermark spec badge */}
                    <div className="absolute bottom-3 left-3 bg-[#111624]/80 backdrop-blur px-2.5 py-1 rounded border border-[#2d3856] font-mono text-[8px] text-white tracking-widest uppercase">
                      SPECS_COMPILED_OK
                    </div>
                  </div>

                  {/* Character operations loop */}
                  <div className="w-full grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => onSetAsCharacterReference(generatedImageUrl)}
                      className="py-2.5 bg-theme-accent text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-theme-text transition-all flex items-center justify-center gap-1 shadow-md shadow-theme-accent/20"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {lang === 'jp' ? "ポーズ合成に送る" : "Animate Character"}
                    </button>

                    <button 
                      onClick={() => setShowSaveModal(true)}
                      className="py-2.5 bg-theme-bg text-theme-text rounded-lg text-[9px] font-black uppercase tracking-widest border border-theme-border hover:bg-theme-accent hover:text-white transition-all flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {lang === 'jp' ? "書庫に保存" : "Save to Archive"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-theme-accent/10 border-2 border-dashed border-theme-accent/40 flex items-center justify-center mx-auto">
                    <Workflow className="w-7 h-7 text-theme-accent opacity-60" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-theme-text uppercase">{lang === 'jp' ? "設計図が未完成です" : "Blueprint Standby"}</p>
                    <p className="text-[9px] text-theme-muted max-w-[200px] mx-auto leading-relaxed">
                      {lang === 'jp' ? "左側のノードパラメータをカスタマイズし、[設計図のコンパイル] を実行してください。" : "Adjust the blueprint sockets on the left, then click [Compile Blueprint] to trigger synthesis."}
                    </p>
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Quick Compiled Prompt inspection */}
          <div className="bg-theme-surface border border-theme-border p-5 rounded-2xl text-left shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black font-mono uppercase tracking-widest text-theme-muted">COMPILED_NODE_PROMPT</span>
              <button 
                onClick={copyPrompt}
                className="p-1 hover:bg-theme-bg rounded transition-all text-theme-muted hover:text-theme-accent flex items-center gap-1 text-[8px] font-bold"
                title="Copy raw prompt text"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copied ? "COPIED" : "COPY"}
              </button>
            </div>
            
            <div className="bg-theme-bg/60 p-3.5 rounded-xl border border-theme-border-light min-h-[90px] relative flex items-start">
              <p className="font-mono text-[9px] text-theme-muted leading-relaxed select-all selection:bg-theme-accent/20">
                {promptText}
              </p>
            </div>
          </div>

          {/* Custom Presets / Saved list */}
          <div className="bg-theme-surface border border-theme-border p-5 rounded-2xl text-left shadow-sm">
            <h4 className="text-[10px] font-black uppercase text-theme-text tracking-wider mb-3.5 flex items-center justify-between">
              <span>{lang === 'jp' ? "カスタムキャラクターアーカイブ" : "Custom Character Archive"}</span>
              <span className="text-[8px] bg-theme-bg px-1.5 py-0.5 rounded text-theme-muted font-bold">{savedCharacters.length} entries</span>
            </h4>

            {savedCharacters.length > 0 ? (
              <div className="space-y-2.5 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                {savedCharacters.map(char => (
                  <div 
                    key={char.id}
                    onClick={() => loadPresetCharacter(char)}
                    className="p-2 bg-theme-bg/40 hover:bg-theme-accent/5 border border-theme-border rounded-xl cursor-pointer transition-all flex items-center gap-3 group animate-in fade-in"
                  >
                    <img 
                      src={char.imageUrl} 
                      alt={char.name} 
                      className="w-10 h-10 rounded object-cover border border-theme-border bg-white"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-grow min-w-0">
                      <p className="text-[11px] font-bold text-theme-text truncate group-hover:text-theme-accent transition-colors">{char.name}</p>
                      <p className="text-[8px] text-theme-muted font-mono uppercase mt-0.5">{char.specs?.fantasyRace || "Custom"} · {char.specs?.gender || "Neutral"}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-theme-muted opacity-0 group-hover:opacity-100 transition-all transform translate-x-1" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center border border-dashed border-theme-border rounded-xl bg-theme-bg/20">
                <Bookmark className="w-6 h-6 text-theme-muted opacity-45 mx-auto mb-2" />
                <p className="text-[9px] text-theme-muted leading-relaxed font-bold uppercase">{lang === 'jp' ? "保存されたカスタムアセットはありません" : "No custom assets archived yet"}</p>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-theme-surface border border-theme-border max-w-sm w-full rounded-2xl shadow-2xl p-6 text-left animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-black uppercase text-theme-text tracking-wide mb-2">{lang === 'jp' ? "書庫への保存プロトコル" : "Archive Character Protocol"}</h3>
            <p className="text-[10px] text-theme-muted font-mono leading-relaxed mb-4">
              {lang === 'jp' ? "このカスタム設計図とアセットを指定の識別子でデータベースにコミットします。" : "Commit this compiled character blueprint and asset to the database under a specific identifier."}
            </p>

            <div className="space-y-3.5 mb-6">
              <div>
                <label className="text-[8px] font-black font-mono uppercase tracking-widest text-theme-muted block mb-1">CHARACTER IDENTIFIER</label>
                <input 
                  type="text" 
                  value={characterName} 
                  onChange={(e) => setCharacterName(e.target.value)}
                  placeholder="e.g. Neo_Vanguard_Ronin"
                  className="w-full bg-theme-bg border border-theme-border rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-theme-accent"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2 text-[10px] border border-theme-border text-theme-muted font-black uppercase tracking-widest rounded-xl hover:bg-theme-bg transition-all"
              >
                {lang === 'jp' ? "キャンセル" : "Cancel"}
              </button>
              <button 
                onClick={handleSaveToArchive}
                disabled={isSaving || saveSuccess}
                className="flex-1 py-2 text-[10px] bg-theme-accent text-white font-black uppercase tracking-widest rounded-xl hover:bg-theme-text transition-all flex items-center justify-center gap-1.5 shadow-md shadow-theme-accent/20"
              >
                {isSaving ? (
                  <span className="w-3.5 h-3.5 border-2 border-t-white border-transparent rounded-full animate-spin"></span>
                ) : saveSuccess ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {saveSuccess ? (lang === 'jp' ? "保存完了" : "Archived!") : (lang === 'jp' ? "書庫に保存" : "Commit Archive")}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ----- Interactive Upload Box Component Helper -----
interface ReferenceUploadBoxProps {
  label: string;
  desc: string;
  referenceKey: string;
  imgSrc: string | null;
  status: { label: string; confidence: number; active: boolean };
  onFileSelected: (file: File) => void;
  onLoadDemo: () => void;
  onClear: () => void;
}

function ReferenceUploadBox({
  label,
  desc,
  referenceKey,
  imgSrc,
  status,
  onFileSelected,
  onLoadDemo,
  onClear
}: ReferenceUploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-xl border p-3 flex flex-col gap-2.5 transition-all text-left ${
        isDragOver 
          ? "border-theme-accent bg-theme-accent/5 shadow-md" 
          : imgSrc 
            ? "border-emerald-500/40 bg-[#0f1b15]/20 hover:border-emerald-500/60" 
            : "border-theme-border bg-theme-bg/10 hover:border-theme-accent/50"
      }`}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      <div className="flex items-start justify-between">
        <div>
          <span className="font-sans text-[10px] font-black uppercase text-theme-text block tracking-tight truncate max-w-[150px]">
            {label}
          </span>
          <span className="font-mono text-[8px] text-theme-muted block mt-0.5 truncate max-w-[150px]">
            {desc}
          </span>
        </div>

        {imgSrc ? (
          <div className="flex items-center gap-1">
            <span className="bg-emerald-500/10 text-emerald-500 font-mono text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
              <Check className="w-2.5 h-2.5" />
              {status.confidence}% MATCH
            </span>
          </div>
        ) : (
          <span className="bg-theme-bg border border-theme-border font-mono text-[8px] text-theme-muted px-1.5 py-0.5 rounded">
            EMPTY
          </span>
        )}
      </div>

      {/* Main Image View/Upload trigger area */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`aspect-[4/3] rounded-lg border border-dashed flex flex-col items-center justify-center overflow-hidden relative cursor-pointer group transition-all ${
          imgSrc 
            ? "border-emerald-500/20 bg-black/40" 
            : "border-theme-border bg-theme-bg/40 hover:bg-theme-accent/5 hover:border-theme-accent/50"
        }`}
      >
        {imgSrc ? (
          <>
            <img 
              src={imgSrc} 
              alt={label} 
              className="w-full h-full object-cover transition-all group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            {/* Overlay hover instructions */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-1 p-2 text-center text-white">
              <Upload className="w-4 h-4 text-theme-accent" />
              <span className="font-mono text-[8px] font-black">REPLACE IMAGE</span>
              <span className="font-mono text-[7px] text-theme-muted">or drop here</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <Upload className="w-5 h-5 text-theme-muted group-hover:text-theme-accent group-hover:scale-110 transition-all mb-1.5" />
            <span className="font-mono text-[8px] text-theme-muted font-bold block">DRAG & DROP</span>
            <span className="font-mono text-[7px] text-theme-muted/50 block mt-0.5">or click to browse</span>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-1.5 w-full">
        {imgSrc ? (
          <>
            <div className="bg-theme-bg px-2 py-1.5 rounded-lg border border-theme-border flex-grow font-mono text-[8px] text-theme-text truncate font-bold">
              VAL: {status.label}
            </div>
            <button 
              onClick={onClear}
              className="p-1.5 text-theme-muted hover:text-rose-500 hover:bg-rose-500/5 border border-theme-border rounded-lg transition-all"
              title="De-couple reference"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button 
            onClick={onLoadDemo}
            className="w-full py-1.5 bg-theme-bg hover:bg-theme-accent hover:text-white rounded-lg text-[8px] font-black uppercase tracking-widest border border-theme-border transition-all flex items-center justify-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-theme-accent" />
            Load Simulated Demo
          </button>
        )}
      </div>

    </div>
  );
}
