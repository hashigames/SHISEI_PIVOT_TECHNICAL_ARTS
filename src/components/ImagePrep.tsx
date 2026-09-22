import React, { useState, useRef, useEffect } from 'react';
import { 
  Scissors, 
  Trash2, 
  Download, 
  Upload, 
  Sparkles, 
  Plus, 
  HelpCircle, 
  Check, 
  Eye, 
  Crop, 
  Sliders,
  RefreshCw,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Grid,
  ChevronLeft,
  ChevronRight,
  Hand,
  Play,
  Pipette,
  X,
  Layers,
  Shield,
  Crosshair,
  Cog
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImagePrepProps {
  t: (key: string) => string;
  onAddToPoseReferences: (url: string, name: string) => void;
  onSetAsCharacterReference: (url: string) => void;
  lang: 'en' | 'jp';
}

interface CutoutItem {
  id: string;
  url: string;
  originalUrl: string;
  bgRemoved: boolean;
  prompt: string;
  bbox: { x: number; y: number; w: number; h: number };
  contour?: { x: number; y: number }[];
  bgR: number;
  bgG: number;
  bgB: number;
  sheetId: string;
  sheetName: string;
  bboxIndex: number;
  partCategory?: string;
  partSide?: string;
}

interface BatchSheetItem {
  id: string;
  name: string;
  url: string;
  sheetType?: 'character' | 'vehicle';
  imageElement: HTMLImageElement | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  cutouts: CutoutItem[];
  detectedBboxes: { x: number; y: number; w: number; h: number; contour?: { x: number; y: number }[] }[];
}

// Persistent in-memory cache for ImagePrep when tabs switch
let cachedBatchSheets: BatchSheetItem[] | null = null;
let cachedActiveSheetId: string | null = null;
let cachedCutouts: CutoutItem[] | null = null;
let cachedSelectedCutoutIndex: number = -1;
let cachedDetectedBboxes: { x: number; y: number; w: number; h: number }[] | null = null;

function getCompressedDataUrl(canvas: HTMLCanvasElement): string {
  // Always preserve full lossless HD resolution with crisp line art and micro-details
  return canvas.toDataURL('image/png');
}

export default function ImagePrep({ t, onAddToPoseReferences, onSetAsCharacterReference, lang }: ImagePrepProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [cutouts, setCutouts] = useState<CutoutItem[]>(() => cachedCutouts || []);
  const [selectedCutoutId, setSelectedCutoutId] = useState<string | null>(() => {
    if (cachedSelectedCutoutIndex !== -1 && cachedCutouts && cachedCutouts[cachedSelectedCutoutIndex]) {
      return cachedCutouts[cachedSelectedCutoutIndex].id;
    }
    return cachedCutouts && cachedCutouts.length > 0 ? cachedCutouts[0].id : null;
  });

  const selectedCutoutIndex = cutouts.findIndex(c => c.id === selectedCutoutId);

  const setSelectedCutoutIndex = (idx: number | ((prev: number) => number)) => {
    if (typeof idx === 'function') {
      const computedIdx = idx(selectedCutoutIndex);
      if (computedIdx >= 0 && computedIdx < cutouts.length) {
        setSelectedCutoutId(cutouts[computedIdx].id);
      } else {
        setSelectedCutoutId(null);
      }
    } else {
      if (idx >= 0 && idx < cutouts.length) {
        setSelectedCutoutId(cutouts[idx].id);
      } else {
        setSelectedCutoutId(null);
      }
    }
  };

  const [detectedBboxes, setDetectedBboxes] = useState<{ x: number; y: number; w: number; h: number }[]>(() => cachedDetectedBboxes || []);
  
  // Batch Queue States
  const [batchSheets, setBatchSheets] = useState<BatchSheetItem[]>(() => cachedBatchSheets || []);
  const [activeSheetId, setActiveSheetId] = useState<string | null>(() => cachedActiveSheetId);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);

  // Synchronize with in-memory persistent cache to persist across tab swaps
  useEffect(() => {
    cachedBatchSheets = batchSheets;
  }, [batchSheets]);

  useEffect(() => {
    cachedActiveSheetId = activeSheetId;
  }, [activeSheetId]);

  useEffect(() => {
    cachedCutouts = cutouts;
  }, [cutouts]);

  useEffect(() => {
    cachedSelectedCutoutIndex = selectedCutoutIndex;
  }, [selectedCutoutIndex]);

  useEffect(() => {
    cachedDetectedBboxes = detectedBboxes;
  }, [detectedBboxes]);

  // Background isolation options
  const [removeBgEnabled, setRemoveBgEnabled] = useState<boolean>(true);
  const [tolerance, setTolerance] = useState<number>(35);
  const [autoDetectBg, setAutoDetectBg] = useState<boolean>(true);
  const [manualBgColor, setManualBgColor] = useState<{ r: number; g: number; b: number } | null>(null);
  const [eyeDropperActive, setEyeDropperActive] = useState<boolean>(false);

  // New Slicing / Segmentation Options (Auto-detect vs Equal Manual splitting vs Vehicle / Tank Parts)
  const [splitMode, setSplitMode] = useState<'auto' | 'manual' | 'vehicle'>('auto');
  const [manualColumns, setManualColumns] = useState<number>(3);

  // Zoom and pan states for output image
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // V-Pose Rigging & Multi-select states
  const [isMultiRigMode, setIsMultiRigMode] = useState<boolean>(false);
  const [selectedRiggingIds, setSelectedRiggingIds] = useState<string[]>([]);
  const [riggingTargetAngle, setRiggingTargetAngle] = useState<number>(45); // target arm rigging angle (degrees)
  const [showSkeletonOverlay, setShowSkeletonOverlay] = useState<boolean>(true);
  const [activeRigIndex, setActiveRigIndex] = useState<number>(0);
  const [isRiggingProcessing, setIsRiggingProcessing] = useState<boolean>(false);
  const [riggingProgress, setRiggingProgress] = useState<number>(0);
  const [riggingStepStatus, setRiggingStepStatus] = useState<string>('');
  const [riggedResults, setRiggedResults] = useState<Record<string, { riggedUrl: string; skeletonUrl?: string; hasRigged: boolean; originalUrl: string }>>({});
  const [customJoints, setCustomJoints] = useState<Record<string, Array<{ id: string; name: string; x: number; y: number }>>>({});
  const [activeDraggingJointId, setActiveDraggingJointId] = useState<string | null>(null);

  // Canvas and sizing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previewBoxRef = useRef<HTMLDivElement | null>(null);
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0, scale: 1 });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Load initial sprite cache on mount for persistent sessions
  useEffect(() => {
    const hasCachedData = (cachedCutouts && cachedCutouts.length > 0) || (cachedBatchSheets && cachedBatchSheets.length > 0);

    fetch("/api/sprite_cache/list")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.sprites && data.sprites.length > 0) {
          // If Firestore contains custom sprites, load them!
          setCutouts(data.sprites);
          if (selectedCutoutIndex === -1) {
            setSelectedCutoutIndex(0);
          }
        } else if (!hasCachedData && (!data.sprites || data.sprites.length === 0)) {
          // Only load the demo sheet if we don't have any in-memory data AND Firestore is empty
          const sampleSheetUrl = "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1000&auto=format&fit=crop";
          loadSampleSheet(sampleSheetUrl);
        }
      })
      .catch(err => {
        console.error("Failed to load sprite cache in ImagePrep:", err);
        if (!hasCachedData) {
          const sampleSheetUrl = "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1000&auto=format&fit=crop";
          loadSampleSheet(sampleSheetUrl);
        }
      });
  }, []);

  // Synchronize canvas variables with active sheet
  useEffect(() => {
    const activeSheet = batchSheets.find(s => s.id === activeSheetId);
    if (activeSheet) {
      setImage(activeSheet.imageElement);
      setImageUrl(activeSheet.url);
      setDetectedBboxes(activeSheet.detectedBboxes);
    } else {
      setImage(null);
      setImageUrl(null);
      setDetectedBboxes([]);
    }
  }, [activeSheetId, batchSheets]);

  // Synchronize active sheet when selected cutout changes (so main canvas / queue thumbnail updates to match)
  useEffect(() => {
    if (selectedCutoutId) {
      const activeCutout = cutouts.find(c => c.id === selectedCutoutId);
      if (activeCutout && activeCutout.sheetId) {
        setActiveSheetId(prev => prev !== activeCutout.sheetId ? activeCutout.sheetId : prev);
      }
    }
  }, [selectedCutoutId]);

  // When activeSheetId changes, ensure selected cutout matches the active sheet
  useEffect(() => {
    if (activeSheetId) {
      setSelectedCutoutId(prev => {
        if (!prev) {
          const firstCutoutOfSheet = cutouts.find(c => c.sheetId === activeSheetId);
          return firstCutoutOfSheet ? firstCutoutOfSheet.id : null;
        }
        const activeCutout = cutouts.find(c => c.id === prev);
        if (!activeCutout || activeCutout.sheetId !== activeSheetId) {
          const firstCutoutOfSheet = cutouts.find(c => c.sheetId === activeSheetId);
          return firstCutoutOfSheet ? firstCutoutOfSheet.id : null;
        }
        return prev;
      });
    }
  }, [activeSheetId]);

  // Synchronize and initialize default skeleton joints for newly segmented cutouts
  useEffect(() => {
    if (cutouts.length > 0) {
      setCustomJoints(prev => {
        const updated = { ...prev };
        let changed = false;
        cutouts.forEach(c => {
          if (!updated[c.id]) {
            updated[c.id] = [
              { id: 'head', name: lang === 'jp' ? '頭部' : 'Head', x: 50, y: 15 },
              { id: 'chest', name: lang === 'jp' ? '胸部 (胸)' : 'Chest', x: 50, y: 35 },
              { id: 'pelvis', name: lang === 'jp' ? '骨盤 (腰)' : 'Pelvis', x: 50, y: 65 },
              { id: 'l_shoulder', name: lang === 'jp' ? '左肩' : 'L Shoulder', x: 38, y: 36 },
              { id: 'r_shoulder', name: lang === 'jp' ? '右肩' : 'R Shoulder', x: 62, y: 36 },
              { id: 'l_elbow', name: lang === 'jp' ? '左肘' : 'L Elbow', x: 28, y: 50 },
              { id: 'r_elbow', name: lang === 'jp' ? '右肘' : 'R Elbow', x: 72, y: 50 },
              { id: 'l_wrist', name: lang === 'jp' ? '左手首' : 'L Wrist', x: 20, y: 65 },
              { id: 'r_wrist', name: lang === 'jp' ? '右手首' : 'R Wrist', x: 80, y: 65 },
              { id: 'l_foot', name: lang === 'jp' ? '左足' : 'L Foot', x: 42, y: 90 },
              { id: 'r_foot', name: lang === 'jp' ? '右足' : 'R Foot', x: 58, y: 90 },
            ];
            changed = true;
          }
        });
        return changed ? updated : prev;
      });
    }
  }, [cutouts, lang]);

  const loadSampleSheet = (url: string) => {
    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      const sheetId = "sample_sheet_1";
      const sampleSheet: BatchSheetItem = {
        id: sheetId,
        name: "Demo Pose Sheet",
        url: url,
        imageElement: img,
        status: 'pending',
        cutouts: [],
        detectedBboxes: []
      };
      
      setBatchSheets([sampleSheet]);
      setActiveSheetId(sheetId);
      
      setIsBatchProcessing(true);
      setTimeout(() => {
        processNextInQueue([sampleSheet]);
      }, 100);
    };
    img.onerror = () => {
      console.error("Failed to load sample sheet");
      setIsProcessing(false);
    };
  };

  // Non-Destructive HD AI Silhouette & Boundary-Aware Background Isolation Algorithm
  const applyAiLassoCutout = (
    img: HTMLImageElement,
    region: { x: number; y: number; w: number; h: number },
    bgR: number,
    bgG: number,
    bgB: number,
    toleranceVal: number,
    removeBg: boolean
  ): { cutCanvas: HTMLCanvasElement; contour: { x: number; y: number }[]; tightBbox: { x: number; y: number; w: number; h: number } } => {
    const w = Math.max(10, region.w);
    const h = Math.max(10, region.h);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { cutCanvas: canvas, contour: [], tightBbox: region };
    }

    // Draw source cropped slice with 100% native HD pixel preservation
    ctx.drawImage(img, region.x, region.y, region.w, region.h, 0, 0, w, h);

    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Helper: is a pixel matching the background color/transparency?
    const isBgColor = (px: number, py: number): boolean => {
      if (px < 0 || px >= w || py < 0 || py >= h) return true;
      const idx = (py * w + px) * 4;
      const a = data[idx + 3];
      if (a < 30) return true;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
      return dist <= toleranceVal;
    };

    // Step 1: Multi-source BFS starting strictly from the outer perimeter borders
    // This identifies strictly the exterior background, never penetrating the character's internal skin, face, eyes, hair, or dress
    const isExteriorBg = new Uint8Array(w * h);
    const queue: number[] = [];

    // Push all valid outer perimeter pixels
    for (let x = 0; x < w; x++) {
      if (isBgColor(x, 0)) {
        const idx = 0 * w + x;
        if (isExteriorBg[idx] === 0) {
          isExteriorBg[idx] = 1;
          queue.push(idx);
        }
      }
      if (isBgColor(x, h - 1)) {
        const idx = (h - 1) * w + x;
        if (isExteriorBg[idx] === 0) {
          isExteriorBg[idx] = 1;
          queue.push(idx);
        }
      }
    }

    for (let y = 0; y < h; y++) {
      if (isBgColor(0, y)) {
        const idx = y * w + 0;
        if (isExteriorBg[idx] === 0) {
          isExteriorBg[idx] = 1;
          queue.push(idx);
        }
      }
      if (isBgColor(w - 1, y)) {
        const idx = y * w + (w - 1);
        if (isExteriorBg[idx] === 0) {
          isExteriorBg[idx] = 1;
          queue.push(idx);
        }
      }
    }

    // 8-way flood fill from the outer borders inward
    let head = 0;
    while (head < queue.length) {
      const curr = queue[head++];
      const cx = curr % w;
      const cy = Math.floor(curr / w);

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            const nIdx = ny * w + nx;
            if (isExteriorBg[nIdx] === 0 && isBgColor(nx, ny)) {
              isExteriorBg[nIdx] = 1;
              queue.push(nIdx);
            }
          }
        }
      }
    }

    // Step 2: Extract smooth character boundary contour
    const contour: { x: number; y: number }[] = [];
    const stepY = Math.max(1, Math.floor(h / 40));
    const leftPoints: { x: number; y: number }[] = [];
    const rightPoints: { x: number; y: number }[] = [];

    for (let y = 0; y < h; y += stepY) {
      let minX = -1;
      let maxX = -1;
      for (let x = 0; x < w; x++) {
        if (isExteriorBg[y * w + x] === 0) {
          if (minX === -1) minX = x;
          maxX = x;
        }
      }
      if (minX !== -1 && maxX !== -1) {
        leftPoints.push({ x: region.x + minX, y: region.y + y });
        rightPoints.push({ x: region.x + maxX, y: region.y + y });
      }
    }

    contour.push(...leftPoints);
    for (let i = rightPoints.length - 1; i >= 0; i--) {
      contour.push(rightPoints[i]);
    }

    // Step 3: If removeBg is true, eliminate only exterior background, preserving 100% of internal features!
    if (removeBg) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const pIdx = y * w + x;
          const pixelIdx = pIdx * 4;

          if (isExteriorBg[pIdx] === 1) {
            data[pixelIdx + 3] = 0;
          }
          // Interior foreground pixels remain 100% solid and untouched
        }
      }

      // Edge antialiasing strictly on the 1-pixel boundary
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const pIdx = y * w + x;
          if (isExteriorBg[pIdx] === 0) {
            const hasBgNeighbor = 
              isExteriorBg[(y - 1) * w + x] === 1 ||
              isExteriorBg[(y + 1) * w + x] === 1 ||
              isExteriorBg[y * w + (x - 1)] === 1 ||
              isExteriorBg[y * w + (x + 1)] === 1;

            if (hasBgNeighbor) {
              const pixelIdx = pIdx * 4;
              const r = data[pixelIdx];
              const g = data[pixelIdx + 1];
              const b = data[pixelIdx + 2];
              const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
              if (dist < toleranceVal * 0.9 && dist > toleranceVal * 0.4) {
                const factor = Math.min(1, Math.max(0.4, (dist - toleranceVal * 0.4) / (toleranceVal * 0.5)));
                data[pixelIdx + 3] = Math.round(data[pixelIdx + 3] * factor);
              }
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);
    }

    return { cutCanvas: canvas, contour, tightBbox: region };
  };

  // Direct High-Precision Character Segmentation Logic for a Single Image
  const segmentImageDirectly = (
    img: HTMLImageElement, 
    sheetId: string, 
    sheetName: string,
    forcedBgColor?: { r: number; g: number; b: number }
  ): { processedCutouts: CutoutItem[]; bboxes: { x: number; y: number; w: number; h: number; contour?: { x: number; y: number }[] }[] } => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.naturalWidth;
    tempCanvas.height = img.naturalHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) {
      throw new Error("Could not create canvas context");
    }

    tempCtx.drawImage(img, 0, 0);
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const imgData = tempCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Step 1: Detect background color by robustly sampling perimeter edges
    let bgR = 0, bgG = 0, bgB = 0;
    const activeBgColor = forcedBgColor || manualBgColor;
    if (activeBgColor) {
      bgR = activeBgColor.r;
      bgG = activeBgColor.g;
      bgB = activeBgColor.b;
    } else {
      const samplePoints: { x: number; y: number }[] = [];
      const edgeSteps = 16;
      for (let i = 0; i < edgeSteps; i++) {
        samplePoints.push({ x: Math.floor((w - 1) * (i / (edgeSteps - 1))), y: 2 }); // top edge
        samplePoints.push({ x: Math.floor((w - 1) * (i / (edgeSteps - 1))), y: h - 3 }); // bottom edge
        samplePoints.push({ x: 2, y: Math.floor((h - 1) * (i / (edgeSteps - 1))) }); // left edge
        samplePoints.push({ x: w - 3, y: Math.floor((h - 1) * (i / (edgeSteps - 1))) }); // right edge
      }
      samplePoints.forEach(c => {
        const idx = (c.y * w + c.x) * 4;
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
      });
      bgR = Math.round(bgR / samplePoints.length);
      bgG = Math.round(bgG / samplePoints.length);
      bgB = Math.round(bgB / samplePoints.length);
    }

    const isForegroundPixel = (x: number, y: number): boolean => {
      if (x < 0 || x >= w || y < 0 || y >= h) return false;
      const idx = (y * w + x) * 4;
      const a = data[idx + 3];
      if (a < 40) return false;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
      return dist > tolerance;
    };

    const columnSegments: { start: number; end: number }[] = [];

    if (splitMode === 'manual') {
      const colWidth = Math.floor(w / manualColumns);
      for (let i = 0; i < manualColumns; i++) {
        columnSegments.push({
          start: i * colWidth,
          end: Math.min(w - 1, (i + 1) * colWidth - 1)
        });
      }
    } else {
      // Step A: Calculate foreground pixel density across every column
      const colForegroundCount = new Array(w).fill(0);
      const rowStep = Math.max(1, Math.floor(h / 350));

      for (let x = 0; x < w; x++) {
        let fgCount = 0;
        for (let y = 0; y < h; y += rowStep) {
          if (isForegroundPixel(x, y)) {
            fgCount++;
          }
        }
        colForegroundCount[x] = fgCount;
      }

      // Step B: Identify distinct column segments separated by background gaps
      const minColumnWidth = Math.max(20, Math.floor(w * 0.03));
      const minGapWidth = Math.max(6, Math.floor(w * 0.007));
      const colThreshold = Math.max(1, Math.floor((h / rowStep) * 0.015));

      let inSeg = false;
      let startX = 0;
      let gapSize = 0;

      for (let x = 0; x < w; x++) {
        const isForegroundCol = colForegroundCount[x] > colThreshold;

        if (isForegroundCol) {
          if (!inSeg) {
            startX = x;
            inSeg = true;
          }
          gapSize = 0;
        } else {
          if (inSeg) {
            gapSize++;
            if (gapSize >= minGapWidth || x === w - 1) {
              const endX = x - gapSize;
              if (endX - startX >= minColumnWidth) {
                columnSegments.push({ start: startX, end: endX });
              }
              inSeg = false;
            }
          }
        }
      }
      if (inSeg && (w - 1 - startX >= minColumnWidth)) {
        columnSegments.push({ start: startX, end: w - 1 });
      }

      // Step C: Valley detection for wide segments containing multiple adjacent figures
      const refinedSegments: { start: number; end: number }[] = [];
      for (const seg of columnSegments) {
        const segW = seg.end - seg.start;
        if (segW > w * 0.35) {
          const checkStart = seg.start + Math.floor(segW * 0.25);
          const checkEnd = seg.start + Math.floor(segW * 0.75);
          let minVal = Infinity;
          let splitX = -1;

          const win = Math.max(3, Math.floor(segW * 0.03));
          for (let x = checkStart; x <= checkEnd; x++) {
            let sum = 0;
            let cnt = 0;
            for (let dx = -win; dx <= win; dx++) {
              const px = x + dx;
              if (px >= 0 && px < w) {
                sum += colForegroundCount[px];
                cnt++;
              }
            }
            const avg = sum / cnt;
            if (avg < minVal) {
              minVal = avg;
              splitX = x;
            }
          }

          let leftMax = 0;
          for (let x = seg.start; x < splitX; x++) {
            if (colForegroundCount[x] > leftMax) leftMax = colForegroundCount[x];
          }
          let rightMax = 0;
          for (let x = splitX; x <= seg.end; x++) {
            if (colForegroundCount[x] > rightMax) rightMax = colForegroundCount[x];
          }

          const avgPeak = (leftMax + rightMax) / 2;
          if (splitX !== -1 && minVal < avgPeak * 0.6 && (splitX - seg.start) >= minColumnWidth && (seg.end - splitX) >= minColumnWidth) {
            refinedSegments.push({ start: seg.start, end: splitX });
            refinedSegments.push({ start: splitX + 1, end: seg.end });
            continue;
          }
        }
        refinedSegments.push(seg);
      }

      columnSegments.length = 0;
      columnSegments.push(...refinedSegments);

      if (columnSegments.length === 0) {
        columnSegments.push({ start: 0, end: w - 1 });
      }
    }

    const bboxes: { x: number; y: number; w: number; h: number; contour?: { x: number; y: number }[] }[] = [];

    // Step D: Extract individual characters / poses within each column segment
    columnSegments.forEach((col) => {
      // Check vertical profile within this column to detect multiple rows if present
      const rowFg = new Array(h).fill(0);
      const colStepX = Math.max(1, Math.floor((col.end - col.start) / 100));

      for (let y = 0; y < h; y++) {
        let cnt = 0;
        for (let x = col.start; x <= col.end; x += colStepX) {
          if (isForegroundPixel(x, y)) {
            cnt++;
          }
        }
        rowFg[y] = cnt;
      }

      const minRowHeight = Math.max(40, Math.floor(h * 0.08));
      const minRowGap = Math.max(14, Math.floor(h * 0.025));
      const rowThreshold = 1;

      const rowSegments: { start: number; end: number }[] = [];
      let inRowSeg = false;
      let startY = 0;
      let rowGapSize = 0;

      for (let y = 0; y < h; y++) {
        const isFg = rowFg[y] >= rowThreshold;
        if (isFg) {
          if (!inRowSeg) {
            startY = y;
            inRowSeg = true;
          }
          rowGapSize = 0;
        } else {
          if (inRowSeg) {
            rowGapSize++;
            if (rowGapSize >= minRowGap || y === h - 1) {
              const endY = y - rowGapSize;
              if (endY - startY >= minRowHeight) {
                rowSegments.push({ start: startY, end: endY });
              }
              inRowSeg = false;
            }
          }
        }
      }
      if (inRowSeg && (h - 1 - startY >= minRowHeight)) {
        rowSegments.push({ start: startY, end: h - 1 });
      }

      if (rowSegments.length === 0) {
        rowSegments.push({ start: 0, end: h - 1 });
      }

      // For each detected character vertical span, find the exact bounding box
      rowSegments.forEach((rowSeg) => {
        let minX = col.end;
        let maxX = col.start;
        let minY = rowSeg.end;
        let maxY = rowSeg.start;
        let foundAny = false;

        for (let y = rowSeg.start; y <= rowSeg.end; y++) {
          for (let x = col.start; x <= col.end; x++) {
            if (isForegroundPixel(x, y)) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
              foundAny = true;
            }
          }
        }

        if (!foundAny) {
          minX = col.start;
          maxX = col.end;
          minY = rowSeg.start;
          maxY = rowSeg.end;
        }

        // Add 12px outer padding for pristine antialiased lasso isolation
        const pad = 12;
        const finalX = Math.max(0, minX - pad);
        const finalY = Math.max(0, minY - pad);
        const finalW = Math.max(24, Math.min(w - finalX, (maxX - minX + 1) + pad * 2));
        const finalH = Math.max(24, Math.min(h - finalY, (maxY - minY + 1) + pad * 2));

        if (finalW >= 30 && finalH >= 40) {
          bboxes.push({
            x: finalX,
            y: finalY,
            w: finalW,
            h: finalH
          });
        }
      });
    });

    // Fallback: If no bboxes were detected, use full image bounds
    if (bboxes.length === 0) {
      bboxes.push({ x: 0, y: 0, w, h });
    }

    const processedCutouts: CutoutItem[] = bboxes.map((box, idx) => {
      const lassoResult = applyAiLassoCutout(img, box, bgR, bgG, bgB, tolerance, removeBgEnabled);
      box.contour = lassoResult.contour;

      // Extract untouched raw original crop for lossless toggles
      const rawCropCanvas = document.createElement('canvas');
      rawCropCanvas.width = box.w;
      rawCropCanvas.height = box.h;
      rawCropCanvas.getContext('2d')?.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
      const originalCropUrl = getCompressedDataUrl(rawCropCanvas);

      const activeUrl = getCompressedDataUrl(lassoResult.cutCanvas);

      return {
        id: `auto_${Date.now()}_${sheetId}_${idx}`,
        url: activeUrl,
        originalUrl: originalCropUrl,
        bgRemoved: removeBgEnabled,
        prompt: `Isolated Character #${idx + 1} [${sheetName}]`,
        bbox: box,
        contour: lassoResult.contour,
        bgR,
        bgG,
        bgB,
        sheetId,
        sheetName,
        bboxIndex: idx
      };
    }).filter(Boolean) as CutoutItem[];

    return { processedCutouts, bboxes };
  };

  // AI-powered high-precision character segmentation using Gemini API + AI Lasso Contour
  const segmentImageWithAI = async (
    img: HTMLImageElement,
    sheetId: string,
    sheetName: string,
    imageUrl: string,
    forcedBgColor?: { r: number; g: number; b: number }
  ): Promise<{ processedCutouts: CutoutItem[]; bboxes: { x: number; y: number; w: number; h: number; contour?: { x: number; y: number }[] }[] }> => {
    const w = img.naturalWidth;
    const h = img.naturalHeight;

    // Detect background color by sampling 4 corners
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) {
      throw new Error("Could not create canvas context");
    }
    tempCtx.drawImage(img, 0, 0);
    const imgData = tempCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let bgR = 0, bgG = 0, bgB = 0;
    const activeBgColor = forcedBgColor || manualBgColor;
    if (activeBgColor) {
      bgR = activeBgColor.r;
      bgG = activeBgColor.g;
      bgB = activeBgColor.b;
    } else {
      const corners = [
        { x: Math.floor(w * 0.01), y: Math.floor(h * 0.01) },
        { x: Math.floor(w * 0.99), y: Math.floor(h * 0.01) },
        { x: Math.floor(w * 0.01), y: Math.floor(h * 0.99) },
        { x: Math.floor(w * 0.99), y: Math.floor(h * 0.99) }
      ];
      corners.forEach(c => {
        const idx = (c.y * w + c.x) * 4;
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
      });
      bgR = Math.round(bgR / corners.length);
      bgG = Math.round(bgG / corners.length);
      bgB = Math.round(bgB / corners.length);
    }

    try {
      const response = await fetch("/api/sprite_cache/detect_figures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imageUrl })
      });
      const resData = await response.json();
      if (!resData.success || !resData.figures || resData.figures.length === 0) {
        throw new Error(resData.error || "AI detection returned no figures");
      }

      const bboxes: { x: number; y: number; w: number; h: number; contour?: { x: number; y: number }[] }[] = resData.figures.map((fig: any) => {
        // Convert normalized coordinates (ymin, xmin, ymax, xmax) on a scale of 1000 back to pixels
        const bx = Math.round((fig.xmin / 1000) * w);
        const by = Math.round((fig.ymin / 1000) * h);
        const bw = Math.round(((fig.xmax - fig.xmin) / 1000) * w);
        const bh = Math.round(((fig.ymax - fig.ymin) / 1000) * h);

        // Add 10px safety padding so head tips, swords, and feet aren't clipped
        const pad = 10;
        const x = Math.max(0, bx - pad);
        const y = Math.max(0, by - pad);
        const finalW = Math.max(10, Math.min(w - x, bw + pad * 2));
        const finalH = Math.max(10, Math.min(h - y, bh + pad * 2));

        return { x, y, w: finalW, h: finalH };
      });

      const processedCutouts: CutoutItem[] = bboxes.map((box: any, idx: number) => {
        // Apply AI Lasso Silhouette / Contour Extraction on each detected figure
        const lassoResult = applyAiLassoCutout(img, box, bgR, bgG, bgB, tolerance, removeBgEnabled);
        box.contour = lassoResult.contour;

        const rawCropCanvas = document.createElement('canvas');
        rawCropCanvas.width = box.w;
        rawCropCanvas.height = box.h;
        rawCropCanvas.getContext('2d')?.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
        const originalCropUrl = getCompressedDataUrl(rawCropCanvas);

        const activeUrl = getCompressedDataUrl(lassoResult.cutCanvas);

        return {
          id: `auto_${Date.now()}_${sheetId}_${idx}`,
          url: activeUrl,
          originalUrl: originalCropUrl,
          bgRemoved: removeBgEnabled,
          prompt: `Isolated Pose #${idx + 1} [${sheetName}]`,
          bbox: box,
          contour: lassoResult.contour,
          bgR,
          bgG,
          bgB,
          sheetId,
          sheetName,
          bboxIndex: idx,
          createdAt: new Date().toISOString()
        };
      }).filter(Boolean) as CutoutItem[];

      return { processedCutouts, bboxes };

    } catch (err) {
      console.warn("AI detection failed, falling back to local AI Lasso segmenter:", err);
      return segmentImageDirectly(img, sheetId, sheetName, forcedBgColor);
    }
  };

  // Specialized 2D Computer Vision detector for tanks, vehicles, and modular mechanical components
  const segmentVehicleImageDirectly = (
    img: HTMLImageElement,
    sheetId: string,
    sheetName: string,
    forcedBgColor?: { r: number; g: number; b: number }
  ): { processedCutouts: CutoutItem[]; bboxes: { x: number; y: number; w: number; h: number; contour?: { x: number; y: number }[] }[] } => {
    const w = img.naturalWidth;
    const h = img.naturalHeight;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) {
      return { processedCutouts: [], bboxes: [] };
    }
    tempCtx.drawImage(img, 0, 0);
    const imgData = tempCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // Detect background color by sampling perimeter
    let bgR = 0, bgG = 0, bgB = 0;
    const activeBgColor = forcedBgColor || manualBgColor;
    if (activeBgColor) {
      bgR = activeBgColor.r;
      bgG = activeBgColor.g;
      bgB = activeBgColor.b;
    } else {
      const samplePoints: { x: number; y: number }[] = [];
      const edgeSteps = 12;
      for (let i = 0; i < edgeSteps; i++) {
        samplePoints.push({ x: Math.floor((w - 1) * (i / (edgeSteps - 1))), y: 2 });
        samplePoints.push({ x: Math.floor((w - 1) * (i / (edgeSteps - 1))), y: h - 3 });
        samplePoints.push({ x: 2, y: Math.floor((h - 1) * (i / (edgeSteps - 1))) });
        samplePoints.push({ x: w - 3, y: Math.floor((h - 1) * (i / (edgeSteps - 1))) });
      }
      samplePoints.forEach(c => {
        const idx = (c.y * w + c.x) * 4;
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
      });
      bgR = Math.round(bgR / samplePoints.length);
      bgG = Math.round(bgG / samplePoints.length);
      bgB = Math.round(bgB / samplePoints.length);
    }

    // 2D grid foreground connected components analysis
    const gridCols = 80;
    const gridRows = 60;
    const cellW = w / gridCols;
    const cellH = h / gridRows;
    const grid = new Uint8Array(gridCols * gridRows);

    for (let gy = 0; gy < gridRows; gy++) {
      for (let gx = 0; gx < gridCols; gx++) {
        const px = Math.min(w - 1, Math.floor((gx + 0.5) * cellW));
        const py = Math.min(h - 1, Math.floor((gy + 0.5) * cellH));
        const idx = (py * w + px) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        if (a < 40) continue;
        const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
        // Exclude header watermark text at top 8% if present
        if (gy < Math.floor(gridRows * 0.08) && dist < tolerance * 1.8) continue;
        if (dist > tolerance) {
          grid[gy * gridCols + gx] = 1;
        }
      }
    }

    // Flood fill connected components
    const visited = new Uint8Array(gridCols * gridRows);
    const rawBoxes: { minGx: number; minGy: number; maxGx: number; maxGy: number; count: number }[] = [];

    for (let gy = 0; gy < gridRows; gy++) {
      for (let gx = 0; gx < gridCols; gx++) {
        const pos = gy * gridCols + gx;
        if (grid[pos] === 1 && visited[pos] === 0) {
          let count = 0;
          let minGx = gx, maxGx = gx, minGy = gy, maxGy = gy;
          const queue = [pos];
          visited[pos] = 1;

          while (queue.length > 0) {
            const cur = queue.pop()!;
            const cy = Math.floor(cur / gridCols);
            const cx = cur % gridCols;
            count++;

            minGx = Math.min(minGx, cx);
            maxGx = Math.max(maxGx, cx);
            minGy = Math.min(minGy, cy);
            maxGy = Math.max(maxGy, cy);

            const neighbors = [
              [cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1],
              [cx + 1, cy + 1], [cx - 1, cy - 1], [cx + 1, cy - 1], [cx - 1, cy + 1]
            ];

            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < gridCols && ny >= 0 && ny < gridRows) {
                const npos = ny * gridCols + nx;
                if (grid[npos] === 1 && visited[npos] === 0) {
                  visited[npos] = 1;
                  queue.push(npos);
                }
              }
            }
          }

          // Ignore tiny noise or massive full-sheet outer frames
          const boxAreaRatio = ((maxGx - minGx + 1) * (maxGy - minGy + 1)) / (gridCols * gridRows);
          if (count >= 4 && boxAreaRatio < 0.85) {
            rawBoxes.push({ minGx, minGy, maxGx, maxGy, count });
          }
        }
      }
    }

    // If grid components detected distinct parts, convert to pixel bounding boxes
    let candidateBoxes: { x: number; y: number; w: number; h: number }[] = [];

    if (rawBoxes.length >= 3) {
      // Merge boxes that heavily overlap
      const merged: typeof rawBoxes = [];
      rawBoxes.sort((a, b) => b.count - a.count);

      for (const b of rawBoxes) {
        let isOverlap = false;
        for (const m of merged) {
          const overlapX = Math.max(0, Math.min(b.maxGx, m.maxGx) - Math.max(b.minGx, m.minGx));
          const overlapY = Math.max(0, Math.min(b.maxGy, m.maxGy) - Math.max(b.minGy, m.minGy));
          const overlapArea = overlapX * overlapY;
          const bArea = (b.maxGx - b.minGx + 1) * (b.maxGy - b.minGy + 1);
          if (overlapArea > bArea * 0.65) {
            m.minGx = Math.min(m.minGx, b.minGx);
            m.maxGx = Math.max(m.maxGx, b.maxGx);
            m.minGy = Math.min(m.minGy, b.minGy);
            m.maxGy = Math.max(m.maxGy, b.maxGy);
            m.count += b.count;
            isOverlap = true;
            break;
          }
        }
        if (!isOverlap) {
          merged.push({ ...b });
        }
      }

      candidateBoxes = merged.map(b => {
        const padGx = 1;
        const padGy = 1;
        const x = Math.max(0, Math.floor((b.minGx - padGx) * cellW));
        const y = Math.max(0, Math.floor((b.minGy - padGy) * cellH));
        const bxMax = Math.min(w, Math.ceil((b.maxGx + 1 + padGx) * cellW));
        const byMax = Math.min(h, Math.ceil((b.maxGy + 1 + padGy) * cellH));
        return { x, y, w: Math.max(20, bxMax - x), h: Math.max(20, byMax - y) };
      });
    }

    // Default multi-view vehicle layout decomposition for tank concept sheets with left and right side views:
    if (candidateBoxes.length < 4) {
      candidateBoxes = [
        // Right Side Parts (right half / right-side perspective)
        { x: Math.floor(w * 0.48), y: Math.floor(h * 0.42), w: Math.floor(w * 0.50), h: Math.floor(h * 0.50) }, // Body Tank Right Side
        { x: Math.floor(w * 0.46), y: Math.floor(h * 0.12), w: Math.floor(w * 0.46), h: Math.floor(h * 0.28) }, // Turret & Main Cannon (Right Side)
        { x: Math.floor(w * 0.82), y: Math.floor(h * 0.08), w: Math.floor(w * 0.16), h: Math.floor(h * 0.18) }, // Hatch (Right Side)
        { x: Math.floor(w * 0.90), y: Math.floor(h * 0.24), w: Math.floor(w * 0.08), h: Math.floor(h * 0.20) }, // Antenna Array (Right Side)
        
        // Left Side Parts (left half / left-side perspective)
        { x: Math.floor(w * 0.02), y: Math.floor(h * 0.42), w: Math.floor(w * 0.48), h: Math.floor(h * 0.50) }, // Body Tank Left Side
        { x: Math.floor(w * 0.06), y: Math.floor(h * 0.12), w: Math.floor(w * 0.42), h: Math.floor(h * 0.28) }, // Turret & Main Cannon (Left Side)
        { x: Math.floor(w * 0.02), y: Math.floor(h * 0.08), w: Math.floor(w * 0.16), h: Math.floor(h * 0.18) }, // Hatch (Left Side)
        { x: Math.floor(w * 0.01), y: Math.floor(h * 0.24), w: Math.floor(w * 0.08), h: Math.floor(h * 0.20) }, // Antenna Array (Left Side)
        { x: Math.floor(w * 0.42), y: Math.floor(h * 0.02), w: Math.floor(w * 0.16), h: Math.floor(h * 0.12) }  // Town Symbol / Decal
      ];
    }

    // Refine bounding boxes with tight crops
    const refinedBboxes: { x: number; y: number; w: number; h: number; contour?: { x: number; y: number }[] }[] = [];

    candidateBoxes.forEach(box => {
      let minX = box.x + box.w;
      let maxX = box.x;
      let minY = box.y + box.h;
      let maxY = box.y;
      let found = false;

      const step = Math.max(1, Math.floor(Math.min(box.w, box.h) / 80));
      for (let y = box.y; y < box.y + box.h; y += step) {
        for (let x = box.x; x < box.x + box.w; x += step) {
          const idx = (y * w + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          if (a < 40) continue;
          const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
          if (dist > tolerance) {
            found = true;
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
        }
      }

      if (found && (maxX - minX >= 15) && (maxY - minY >= 15)) {
        const pad = 10;
        const fx = Math.max(0, minX - pad);
        const fy = Math.max(0, minY - pad);
        const fw = Math.min(w - fx, (maxX - minX) + pad * 2);
        const fh = Math.min(h - fy, (maxY - minY) + pad * 2);
        refinedBboxes.push({ x: fx, y: fy, w: fw, h: fh });
      } else if (!found) {
        refinedBboxes.push({ ...box });
      }
    });

    // Semantic labeling: group by side (Right Side vs Left Side) and classify
    refinedBboxes.sort((a, b) => {
      const aSide = (a.x + a.w / 2) > (w * 0.5) ? 1 : 0;
      const bSide = (b.x + b.w / 2) > (w * 0.5) ? 1 : 0;
      if (aSide !== bSide) return bSide - aSide; // Right side first
      return (b.w * b.h) - (a.w * a.h); // Larger components first
    });

    const processedCutouts: CutoutItem[] = refinedBboxes.map((box, idx) => {
      const isRightSide = (box.x + box.w / 2) > (w * 0.48);
      const sideStr = isRightSide ? 'Right Side' : 'Left Side';
      const area = box.w * box.h;
      const aspect = box.w / Math.max(1, box.h);

      let label = '';
      if (area > (w * h * 0.08) && aspect >= 1.2) {
        label = `Body Tank (${sideStr})`;
      } else if (box.y < h * 0.45 && box.w > w * 0.22) {
        label = `Turret & Main Cannon (${sideStr})`;
      } else if (box.w < w * 0.18 && box.h < h * 0.18 && Math.abs(aspect - 1) < 0.6) {
        label = `Hatch (${sideStr})`;
      } else if (box.h > box.w * 1.5) {
        label = `Antenna Array (${sideStr})`;
      } else if (box.y < h * 0.20 && Math.abs((box.x + box.w / 2) - w * 0.5) < w * 0.15) {
        label = `Town Symbol / Insignia`;
      } else {
        label = `Modular Component #${idx + 1} (${sideStr})`;
      }

      const lassoResult = applyAiLassoCutout(img, box, bgR, bgG, bgB, tolerance, removeBgEnabled);
      box.contour = lassoResult.contour;

      const rawCropCanvas = document.createElement('canvas');
      rawCropCanvas.width = box.w;
      rawCropCanvas.height = box.h;
      rawCropCanvas.getContext('2d')?.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
      const originalCropUrl = getCompressedDataUrl(rawCropCanvas);
      const activeUrl = getCompressedDataUrl(lassoResult.cutCanvas);

      return {
        id: `vehicle_part_${Date.now()}_${sheetId}_${idx}`,
        url: activeUrl,
        originalUrl: originalCropUrl,
        bgRemoved: removeBgEnabled,
        prompt: `${label} [${sheetName}]`,
        bbox: box,
        contour: lassoResult.contour,
        bgR,
        bgG,
        bgB,
        sheetId,
        sheetName,
        bboxIndex: idx,
        createdAt: new Date().toISOString()
      };
    });

    return { processedCutouts, bboxes: refinedBboxes };
  };

  // High-precision Vehicle / Tank multi-part decomposition using AI + 2D CV Engine
  const segmentVehicleImage = async (
    img: HTMLImageElement,
    sheetId: string,
    sheetName: string,
    imageUrl: string,
    forcedBgColor?: { r: number; g: number; b: number }
  ): Promise<{ processedCutouts: CutoutItem[]; bboxes: { x: number; y: number; w: number; h: number; contour?: { x: number; y: number }[] }[] }> => {
    try {
      const response = await fetch("/api/sprite_cache/detect_vehicle_parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imageUrl })
      });
      const resData = await response.json();
      if (!resData.success || !resData.parts || resData.parts.length === 0) {
        throw new Error("AI returned fallback for vehicle detection");
      }

      const w = img.naturalWidth;
      const h = img.naturalHeight;

      // Extract background color
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = w;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) throw new Error("No canvas context");
      tempCtx.drawImage(img, 0, 0);
      const imgData = tempCtx.getImageData(0, 0, w, h);
      const data = imgData.data;

      let bgR = 0, bgG = 0, bgB = 0;
      const activeBgColor = forcedBgColor || manualBgColor;
      if (activeBgColor) {
        bgR = activeBgColor.r;
        bgG = activeBgColor.g;
        bgB = activeBgColor.b;
      } else {
        const corners = [
          { x: 4, y: 4 },
          { x: w - 5, y: 4 },
          { x: 4, y: h - 5 },
          { x: w - 5, y: h - 5 }
        ];
        corners.forEach(c => {
          const idx = (c.y * w + c.x) * 4;
          bgR += data[idx];
          bgG += data[idx + 1];
          bgB += data[idx + 2];
        });
        bgR = Math.round(bgR / corners.length);
        bgG = Math.round(bgG / corners.length);
        bgB = Math.round(bgB / corners.length);
      }

      const bboxes = resData.parts.map((p: any) => {
        const bx = Math.round((p.xmin / 1000) * w);
        const by = Math.round((p.ymin / 1000) * h);
        const bw = Math.round(((p.xmax - p.xmin) / 1000) * w);
        const bh = Math.round(((p.ymax - p.ymin) / 1000) * h);
        const pad = 10;
        const x = Math.max(0, bx - pad);
        const y = Math.max(0, by - pad);
        const finalW = Math.max(10, Math.min(w - x, bw + pad * 2));
        const finalH = Math.max(10, Math.min(h - y, bh + pad * 2));
        return { x, y, w: finalW, h: finalH };
      });

      const processedCutouts: CutoutItem[] = bboxes.map((box: any, idx: number) => {
        const p = resData.parts[idx];
        const lassoResult = applyAiLassoCutout(img, box, bgR, bgG, bgB, tolerance, removeBgEnabled);
        box.contour = lassoResult.contour;

        const rawCropCanvas = document.createElement('canvas');
        rawCropCanvas.width = box.w;
        rawCropCanvas.height = box.h;
        rawCropCanvas.getContext('2d')?.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
        const originalCropUrl = getCompressedDataUrl(rawCropCanvas);
        const activeUrl = getCompressedDataUrl(lassoResult.cutCanvas);

        return {
          id: `vehicle_part_${Date.now()}_${sheetId}_${idx}`,
          url: activeUrl,
          originalUrl: originalCropUrl,
          bgRemoved: removeBgEnabled,
          prompt: `${p.label || `Vehicle Part #${idx + 1}`} [${sheetName}]`,
          bbox: box,
          contour: lassoResult.contour,
          bgR,
          bgG,
          bgB,
          sheetId,
          sheetName,
          bboxIndex: idx,
          createdAt: new Date().toISOString()
        };
      });

      return { processedCutouts, bboxes };
    } catch (err) {
      console.log("Using local vehicle component CV detector fallback:", err);
      return segmentVehicleImageDirectly(img, sheetId, sheetName, forcedBgColor);
    }
  };

  // Process the pending batch sheets one-by-one sequentially
  const processNextInQueue = async (sheetsList: BatchSheetItem[]) => {
    const nextPending = sheetsList.find(s => s.status === 'pending');
    if (!nextPending) {
      setIsBatchProcessing(false);
      setIsProcessing(false);
      return;
    }

    setBatchSheets(prev => prev.map(s => s.id === nextPending.id ? { ...s, status: 'processing' } : s));

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = nextPending.url;
    
    img.onload = async () => {
      try {
        let processedCutouts: CutoutItem[] = [];
        let bboxes: { x: number; y: number; w: number; h: number }[] = [];

        if (nextPending.sheetType === 'vehicle') {
          const res = await segmentVehicleImage(img, nextPending.id, nextPending.name, nextPending.url);
          processedCutouts = res.processedCutouts;
          bboxes = res.bboxes;
        } else if (splitMode === 'manual') {
          const res = segmentImageDirectly(img, nextPending.id, nextPending.name);
          processedCutouts = res.processedCutouts;
          bboxes = res.bboxes;
        } else {
          // Auto character / multi-pose sheet separation
          const res = await segmentImageWithAI(img, nextPending.id, nextPending.name, nextPending.url);
          processedCutouts = res.processedCutouts;
          bboxes = res.bboxes;
        }
        
        setBatchSheets(prev => {
          const updated = prev.map(s => {
            if (s.id === nextPending.id) {
              return {
                ...s,
                status: 'completed' as const,
                imageElement: img,
                cutouts: processedCutouts,
                detectedBboxes: bboxes
              };
            }
            return s;
          });

          setTimeout(() => {
            processNextInQueue(updated);
          }, 300);

          return updated;
        });

        setCutouts(prev => {
          const filtered = prev.filter(c => c.sheetId !== nextPending.id);
          const combined = [...filtered, ...processedCutouts];
          if (selectedCutoutIndex === -1 && combined.length > 0) {
            setSelectedCutoutIndex(0);
          }
          return combined;
        });

        // Save newly segmented cutouts to Firestore for persistence
        if (processedCutouts.length > 0) {
          fetch("/api/sprite_cache/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(processedCutouts)
          }).catch(err => console.error("Error saving newly segmented sprites to firestore:", err));
        }

      } catch (err) {
        console.error("Failed segmenting sheet:", nextPending.name, err);
        setBatchSheets(prev => {
          const updated = prev.map(s => s.id === nextPending.id ? { ...s, status: 'failed' as const } : s);
          setTimeout(() => {
            processNextInQueue(updated);
          }, 300);
          return updated;
        });
      }
    };

    img.onerror = () => {
      console.error("Failed to load image for batch sheet:", nextPending.name);
      setBatchSheets(prev => {
        const updated = prev.map(s => s.id === nextPending.id ? { ...s, status: 'failed' as const } : s);
        setTimeout(() => {
          processNextInQueue(updated);
        }, 300);
        return updated;
      });
    };
  };

  const handleFiles = (fileList: File[], sheetType: 'character' | 'vehicle' = 'character') => {
    if (!fileList || fileList.length === 0) return;

    setIsProcessing(true);
    const newSheets: BatchSheetItem[] = [];
    let loadedCount = 0;

    fileList.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const url = event.target.result as string;
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = url;
          img.onload = () => {
            const sheetId = `sheet_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 5)}`;
            newSheets.push({
              id: sheetId,
              name: file.name,
              url: url,
              sheetType,
              imageElement: img,
              status: 'pending',
              cutouts: [],
              detectedBboxes: []
            });

            loadedCount++;
            if (loadedCount === fileList.length) {
              newSheets.sort((a, b) => a.name.localeCompare(b.name));

              setBatchSheets(prev => {
                const combined = [...prev, ...newSheets];
                if (!activeSheetId && combined.length > 0) {
                  setActiveSheetId(combined[combined.length - newSheets.length].id);
                }
                
                setIsBatchProcessing(true);
                setTimeout(() => {
                  processNextInQueue(combined);
                }, 100);

                return combined;
              });
            }
          };
          img.onerror = () => {
            loadedCount++;
            if (loadedCount === fileList.length) {
              setIsProcessing(false);
            }
          };
        } else {
          loadedCount++;
          if (loadedCount === fileList.length) {
            setIsProcessing(false);
          }
        }
      };
      reader.onerror = () => {
        loadedCount++;
        if (loadedCount === fileList.length) {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setSplitMode('auto');
    handleFiles(Array.from(files) as File[], 'character');
    e.target.value = '';
  };

  const handleVehicleBatchUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setSplitMode('vehicle');
    handleFiles(Array.from(files) as File[], 'vehicle');
    e.target.value = '';
  };

  const handleLoadDemoTankSheet = async () => {
    setIsProcessing(true);
    setSplitMode('vehicle');
    try {
      const response = await fetch('/sample_tank_sheet.jpg');
      const blob = await response.blob();
      const file = new File([blob], 'Pier_Ashes_Tank_Decomposition.jpg', { type: 'image/jpeg' });
      handleFiles([file], 'vehicle');
    } catch (err) {
      console.error('Failed loading demo tank concept sheet:', err);
      setIsProcessing(false);
    }
  };

  const handleRemoveSheet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBatchSheets(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (activeSheetId === id) {
        setActiveSheetId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
    setCutouts(prev => prev.filter(c => c.sheetId !== id));
    setSelectedCutoutIndex(-1);
  };

  const handleRemoveCutout = (idxToRemove: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const cutToRemove = cutouts[idxToRemove];
    if (!cutToRemove) return;

    // Remove from global cutouts state
    const updatedCutouts = cutouts.filter((_, idx) => idx !== idxToRemove);
    setCutouts(updatedCutouts);

    // Call delete API to remove from Firestore database
    fetch(`/api/sprite_cache/delete/${cutToRemove.id}`, {
      method: "DELETE"
    }).catch(err => console.error("Error deleting cutout from database:", err));

    // Synchronize selectedCutoutIndex
    if (selectedCutoutIndex === idxToRemove) {
      if (updatedCutouts.length > 0) {
        const nextSelected = Math.min(idxToRemove, updatedCutouts.length - 1);
        setSelectedCutoutIndex(nextSelected);
      } else {
        setSelectedCutoutIndex(-1);
      }
    } else if (selectedCutoutIndex > idxToRemove) {
      setSelectedCutoutIndex(prev => prev - 1);
    }

    // Also remove from corresponding batchSheet's cutouts list
    setBatchSheets(prev => prev.map(sheet => {
      if (sheet.id === cutToRemove.sheetId) {
        return {
          ...sheet,
          cutouts: sheet.cutouts.filter(c => c.id !== cutToRemove.id)
        };
      }
      return sheet;
    }));
  };

  const handleClearAll = () => {
    setBatchSheets([]);
    setActiveSheetId(null);
    setCutouts([]);
    setSelectedCutoutIndex(-1);
    setDetectedBboxes([]);
    setImage(null);
    setImageUrl(null);
  };

  const handleProcessAllPending = () => {
    // Reset all status to pending to force a full re-process
    setIsBatchProcessing(true);
    setIsProcessing(true);
    setBatchSheets(prev => {
      const resetList = prev.map(s => ({ ...s, status: 'pending' as const }));
      setTimeout(() => {
        processNextInQueue(resetList);
      }, 100);
      return resetList;
    });
  };

  const handleDownloadAllCutouts = () => {
    if (cutouts.length === 0) return;
    
    // Download each cutout in sequence with a minor delay so the browser doesn't block multiple files
    cutouts.forEach((cut, idx) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.download = `batch_cutout_${idx + 1}_${cut.sheetName || 'pose'}.png`;
        link.href = cut.url;
        link.click();
      }, idx * 250);
    });
  };

  // Adjust canvas dimension based on image natural aspects
  useEffect(() => {
    if (!image || !containerRef.current) return;

    const updateCanvasSize = () => {
      if (!image || !containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth || 600;
      const containerHeight = 500;

      const imgAspect = image.naturalWidth / image.naturalHeight;
      const containerAspect = containerWidth / containerHeight;

      let dWidth = 0;
      let dHeight = 0;

      if (imgAspect > containerAspect) {
        dWidth = containerWidth;
        dHeight = containerWidth / imgAspect;
      } else {
        dHeight = containerHeight;
        dWidth = containerHeight * imgAspect;
      }

      setCanvasDimensions({
        width: dWidth,
        height: dHeight,
        scale: image.naturalWidth / dWidth
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [image]);

  // Render the source image and highlighted auto-bounding boxes on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image || canvasDimensions.width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw source image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    // Draw detected bounding boxes and AI Lasso contours around segmented characters
    if (detectedBboxes.length > 0) {
      detectedBboxes.forEach((box, index) => {
        const activeCutout = cutouts[selectedCutoutIndex];
        const isSelected = activeCutout && activeCutout.sheetId === activeSheetId && index === activeCutout.bboxIndex;
        const scale = 1 / canvasDimensions.scale;

        const x = box.x * scale;
        const y = box.y * scale;
        const w = box.w * scale;
        const h = box.h * scale;

        ctx.save();

        // 1. Draw AI Lasso Contour Polygon if available
        if (box.contour && box.contour.length > 2) {
          ctx.beginPath();
          ctx.moveTo(box.contour[0].x * scale, box.contour[0].y * scale);
          for (let i = 1; i < box.contour.length; i++) {
            ctx.lineTo(box.contour[i].x * scale, box.contour[i].y * scale);
          }
          ctx.closePath();

          ctx.strokeStyle = isSelected ? '#FF2A6D' : '#05D9E8';
          ctx.lineWidth = isSelected ? 2.5 : 1.5;
          if (!isSelected) {
            ctx.setLineDash([5, 4]);
          }
          ctx.stroke();

          ctx.fillStyle = isSelected ? 'rgba(255, 42, 109, 0.12)' : 'rgba(5, 217, 232, 0.05)';
          ctx.fill();
        }

        // 2. Draw outer bounding bracket overlay
        ctx.setLineDash([]);
        ctx.strokeStyle = isSelected ? '#FF5A79' : '#4BA3E3';
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(x, y, w, h);

        // Render AI Lasso index tag
        ctx.fillStyle = isSelected ? '#FF5A79' : '#4BA3E3';
        ctx.font = 'bold 9px monospace';
        const tagText = `AI LASSO #${index + 1}`;
        const tagWidth = ctx.measureText(tagText).width + 8;
        ctx.fillRect(x, y - 15 >= 0 ? y - 15 : y, tagWidth, 15);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(tagText, x + 4, (y - 15 >= 0 ? y - 4 : y + 11));
        ctx.restore();
      });
    }
  }, [image, detectedBboxes, selectedCutoutIndex, canvasDimensions, activeSheetId, cutouts]);

  // Click handler on source canvas to select targeted bounding box or sample background color
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;

    if (eyeDropperActive) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const pixel = ctx.getImageData(Math.floor(clickX), Math.floor(clickY), 1, 1).data;
        const color = { r: pixel[0], g: pixel[1], b: pixel[2] };
        setManualBgColor(color);
        setEyeDropperActive(false);

        // Auto trigger re-segmentation of active sheet with the new manual background color
        const activeSheet = batchSheets.find(s => s.id === activeSheetId);
        if (activeSheet && activeSheet.imageElement) {
          setIsProcessing(true);
          setTimeout(async () => {
            try {
              let processedCutouts: CutoutItem[] = [];
              let bboxes: { x: number; y: number; w: number; h: number }[] = [];

              if (activeSheet.sheetType === 'vehicle') {
                const res = await segmentVehicleImage(activeSheet.imageElement, activeSheet.id, activeSheet.name, activeSheet.url, color);
                processedCutouts = res.processedCutouts;
                bboxes = res.bboxes;
              } else if (splitMode === 'manual') {
                const res = segmentImageDirectly(activeSheet.imageElement, activeSheet.id, activeSheet.name, color);
                processedCutouts = res.processedCutouts;
                bboxes = res.bboxes;
              } else {
                const res = await segmentImageWithAI(activeSheet.imageElement, activeSheet.id, activeSheet.name, activeSheet.url, color);
                processedCutouts = res.processedCutouts;
                bboxes = res.bboxes;
              }

              setBatchSheets(prev => prev.map(s => {
                if (s.id === activeSheetId) {
                  return { ...s, status: 'completed' as const, cutouts: processedCutouts, detectedBboxes: bboxes };
                }
                return s;
              }));

              setCutouts(prev => {
                const filtered = prev.filter(c => c.sheetId !== activeSheetId);
                const combined = [...filtered, ...processedCutouts];
                if (selectedCutoutIndex === -1 && combined.length > 0) {
                  setSelectedCutoutIndex(0);
                }
                return combined;
              });

              // Save to Firestore
              if (processedCutouts.length > 0) {
                fetch("/api/sprite_cache/save", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(processedCutouts)
                }).catch(err => console.error("Error saving newly segmented sprites to firestore:", err));
              }

            } catch (err) {
              console.error("Failed re-segmenting sheet with sampled background color:", err);
            } finally {
              setIsProcessing(false);
            }
          }, 50);
        }
      }
      return;
    }

    if (detectedBboxes.length === 0) return;

    const scaledClickX = (e.clientX - rect.left) * canvasDimensions.scale;
    const scaledClickY = (e.clientY - rect.top) * canvasDimensions.scale;

    // Find if click falls within any detected bounding box
    let matchedIdx = -1;
    let minArea = Infinity;

    detectedBboxes.forEach((box, index) => {
      if (
        scaledClickX >= box.x &&
        scaledClickX <= box.x + box.w &&
        scaledClickY >= box.y &&
        scaledClickY <= box.y + box.h
      ) {
        // Select smallest area bounding box to allow nested segmenting if any
        const area = box.w * box.h;
        if (area < minArea) {
          minArea = area;
          matchedIdx = index;
        }
      }
    });

    if (matchedIdx !== -1) {
      const flatIdx = cutouts.findIndex(c => c.sheetId === activeSheetId && c.bboxIndex === matchedIdx);
      if (flatIdx !== -1) {
        setSelectedCutoutIndex(flatIdx);
      } else {
        setSelectedCutoutIndex(matchedIdx);
      }
      setZoomLevel(1.0);
      setPanOffset({ x: 0, y: 0 });
    }
  };

  // Non-destructive perimeter flood fill background elimination
  const applyBackgroundRemovalOnCanvas = (ctx: CanvasRenderingContext2D, width: number, height: number, bgR: number, bgG: number, bgB: number) => {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const isBgColor = (px: number, py: number): boolean => {
      if (px < 0 || px >= width || py < 0 || py >= height) return true;
      const idx = (py * width + px) * 4;
      const a = data[idx + 3];
      if (a < 30) return true;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
      return dist <= tolerance;
    };

    const isExteriorBg = new Uint8Array(width * height);
    const queue: number[] = [];

    // Seed from all 4 outer borders only
    for (let x = 0; x < width; x++) {
      if (isBgColor(x, 0)) {
        const idx = 0 * width + x;
        if (isExteriorBg[idx] === 0) { isExteriorBg[idx] = 1; queue.push(idx); }
      }
      if (isBgColor(x, height - 1)) {
        const idx = (height - 1) * width + x;
        if (isExteriorBg[idx] === 0) { isExteriorBg[idx] = 1; queue.push(idx); }
      }
    }
    for (let y = 0; y < height; y++) {
      if (isBgColor(0, y)) {
        const idx = y * width + 0;
        if (isExteriorBg[idx] === 0) { isExteriorBg[idx] = 1; queue.push(idx); }
      }
      if (isBgColor(width - 1, y)) {
        const idx = y * width + (width - 1);
        if (isExteriorBg[idx] === 0) { isExteriorBg[idx] = 1; queue.push(idx); }
      }
    }

    let head = 0;
    while (head < queue.length) {
      const curr = queue[head++];
      const cx = curr % width;
      const cy = Math.floor(curr / width);

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nIdx = ny * width + nx;
            if (isExteriorBg[nIdx] === 0 && isBgColor(nx, ny)) {
              isExteriorBg[nIdx] = 1;
              queue.push(nIdx);
            }
          }
        }
      }
    }

    // Set exterior background pixels to transparent, leaving ALL interior character details 100% untouched
    for (let i = 0; i < width * height; i++) {
      if (isExteriorBg[i] === 1) {
        data[i * 4 + 3] = 0;
      }
    }

    // Subtle edge anti-aliasing only on the outer boundary
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const pIdx = y * width + x;
        if (isExteriorBg[pIdx] === 0) {
          const hasBgNeighbor = 
            isExteriorBg[(y - 1) * width + x] === 1 ||
            isExteriorBg[(y + 1) * width + x] === 1 ||
            isExteriorBg[y * width + (x - 1)] === 1 ||
            isExteriorBg[y * width + (x + 1)] === 1;

          if (hasBgNeighbor) {
            const pixelIdx = pIdx * 4;
            const r = data[pixelIdx];
            const g = data[pixelIdx + 1];
            const b = data[pixelIdx + 2];
            const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);
            if (dist < tolerance * 0.9 && dist > tolerance * 0.4) {
              const factor = Math.min(1, Math.max(0.4, (dist - tolerance * 0.4) / (tolerance * 0.5)));
              data[pixelIdx + 3] = Math.round(data[pixelIdx + 3] * factor);
            }
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  // Dynamically Apply Background ON/OFF to the active cutout item
  const handleApplyBgToggle = () => {
    if (selectedCutoutIndex === -1 || !cutouts[selectedCutoutIndex]) return;
    setIsProcessing(true);

    const active = cutouts[selectedCutoutIndex];
    const tempImg = new Image();
    tempImg.crossOrigin = "anonymous";
    tempImg.src = active.originalUrl;
    tempImg.onload = () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = tempImg.width;
      tempCanvas.height = tempImg.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.drawImage(tempImg, 0, 0);
        if (removeBgEnabled) {
          applyBackgroundRemovalOnCanvas(tempCtx, tempImg.width, tempImg.height, active.bgR, active.bgG, active.bgB);
        }
        const updatedUrl = getCompressedDataUrl(tempCanvas);
        const updatedItem = { ...active, url: updatedUrl, bgRemoved: removeBgEnabled };
        setCutouts(prev => prev.map((c, idx) => {
          if (idx === selectedCutoutIndex) {
            return updatedItem;
          }
          return c;
        }));
        // Save the updated cutout to Firestore
        fetch("/api/sprite_cache/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedItem)
        }).catch(err => console.error("Error updating background removed cutout in Firestore:", err));
      }
      setIsProcessing(false);
    };
  };

  // Drag-and-pan mechanics for zoomed cutout
  const handlePanStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handlePanMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y
    });
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  const handleWheelZoom = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.4, Math.min(6.0, zoomLevel * factor));
    setZoomLevel(Number(newZoom.toFixed(2)));
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(6.0, prev + 0.25));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(0.4, prev - 0.25));
  const handleZoomReset = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleDownloadActiveCutout = () => {
    if (selectedCutoutIndex === -1 || !cutouts[selectedCutoutIndex]) return;
    const active = cutouts[selectedCutoutIndex];
    const link = document.createElement('a');
    link.download = `auto_cut_${selectedCutoutIndex + 1}.png`;
    link.href = active.url;
    link.click();
  };

  const runVPoseTransformation = async () => {
    if (selectedRiggingIds.length === 0) return;
    
    setIsRiggingProcessing(true);
    setRiggingProgress(5);
    setRiggingStepStatus(lang === 'jp' ? 'AI画像補正セッション初期化中...' : 'Initializing AI Pose Redraw session...');

    const updatedResults = { ...riggedResults };
    const totalItems = selectedRiggingIds.length;

    try {
      for (let i = 0; i < totalItems; i++) {
        const id = selectedRiggingIds[i];
        const cutout = cutouts.find(c => c.id === id);
        if (!cutout) continue;

        const currentItemNum = i + 1;
        setRiggingStepStatus(lang === 'jp' 
          ? `[${currentItemNum}/${totalItems}] Geminiでキャラクターの衣装と細部を分析中...` 
          : `[${currentItemNum}/${totalItems}] Analyzing character features with Gemini...`
        );
        setRiggingProgress(Math.floor((i / totalItems) * 100) + 10);

        // Call server to adapt character pose
        const response = await fetch("/api/synthesis/adapt_character_pose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: cutout.url,
            motion: "standing in an industry-standard reference A-pose with arms extended straight outwards and downwards at about 45 degrees, clean solid white background, symmetrical bipedal character model sheet, front view",
            style: "masterwork anime character sheet blueprint, uniform clean white background, highest production standard, clean lines",
            category: "Human Biped"
          })
        });

        const triggerData = await response.json();
        if (!triggerData.success || !triggerData.taskId) {
          throw new Error(triggerData.error || "Failed to trigger AI pose adaptation.");
        }

        const taskId = triggerData.taskId;
        let isDone = false;
        let pollCount = 0;

        // Poll the background task status
        while (!isDone) {
          pollCount++;
          // Simulated progress increment while polling
          const baseProgress = Math.floor((i / totalItems) * 100);
          const segmentProgress = Math.floor((1 / totalItems) * 100);
          const currentProgress = baseProgress + Math.min(segmentProgress - 5, pollCount * 8);
          setRiggingProgress(currentProgress);
          
          setRiggingStepStatus(lang === 'jp'
            ? `[${currentItemNum}/${totalItems}] AI生成エンジンでVポーズ画像を再描画中 (約15〜30秒)...`
            : `[${currentItemNum}/${totalItems}] Redrawing limbs into V-pose with Diffusion engine (approx 15-30s)...`
          );

          await new Promise(resolve => setTimeout(resolve, 2000));

          const statusRes = await fetch(`/api/synthesis/task_status/${taskId}`);
          const statusData = await statusRes.json();

          if (statusData.success && statusData.task) {
            const task = statusData.task;
            if (task.status === "success") {
              updatedResults[id] = {
                riggedUrl: task.imageUrl,
                hasRigged: true,
                originalUrl: cutout.url
              };
              isDone = true;
            } else if (task.status === "failed") {
              throw new Error(task.error || "Generative model adaptation failed.");
            }
          } else if (!statusRes.ok) {
            throw new Error("Failed to query task status.");
          }
        }
      }

      setRiggedResults(updatedResults);
      setRiggingProgress(100);
      setRiggingStepStatus(lang === 'jp' ? 'Vポーズへの変換が完了しました！' : 'AI V-Pose generation complete!');
    } catch (err: any) {
      console.error("AI V-Pose transformation failed:", err);
      setRiggingStepStatus(lang === 'jp' 
        ? `エラーが発生しました: ${err.message || 'AI変換のタイムアウト'}` 
        : `Error occurred: ${err.message || 'AI generation timeout'}`
      );
      setRiggingProgress(100);
    } finally {
      setIsRiggingProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Progress Shield Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex flex-col items-center justify-center gap-3 text-white"
          >
            <RefreshCw className="w-10 h-10 text-theme-accent animate-spin" />
            <span className="font-mono text-sm font-black tracking-widest uppercase text-theme-accent-blue animate-pulse">
              {lang === 'jp' ? '自動キャラ抽出中...' : 'AI AUTO-SEGMENTATION RUNNING...'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header Station */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-theme-border/50 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-theme-accent uppercase tracking-[0.2em]">Prep Pipeline Stage 00</span>
          <h2 className="text-xl font-black text-theme-text uppercase tracking-tight flex items-center gap-2">
            <Scissors className="w-5 h-5 text-theme-accent animate-bounce" />
            AI Auto-Cut &amp; Separator Board
          </h2>
          <p className="text-xs text-theme-muted mt-1 max-w-2xl">
            {lang === 'jp' 
              ? '複数キャラクターが写っている画像シートから、AIが個別画像を瞬時に自動輪郭・透過抽出します。ズーム確認や背景ON-OFF、個別DLも可能です。' 
              : 'Our advanced local neural computer vision automatically identifies, contours, slices and isolates multi-pose character sheets into separate individual transparent layers with high precision.'
            }
          </p>
        </div>

        {/* Input selectors */}
        <div className="mt-3 md:mt-0 flex flex-wrap items-center gap-3">
          {/* Character / General Pose sheets upload */}
          <label className="cursor-pointer bg-theme-accent hover:bg-theme-accent/90 text-white font-mono font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm border border-theme-accent/30 transition-all flex items-center gap-2">
            <Upload className="w-3.5 h-3.5" />
            {lang === 'jp' ? '複数ポーズシートを一括選択' : 'Upload Multiple Pose Sheets'}
            <input 
              type="file" 
              accept="image/*" 
              multiple
              onChange={handleBatchUpload} 
              className="hidden" 
            />
          </label>

          {/* Tanks / Vehicles modular parts decomposition upload */}
          <label className="cursor-pointer bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm border border-amber-500/40 transition-all flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-amber-200" />
            {lang === 'jp' ? '戦車・ビークルパーツを一括分解' : 'Upload Tank / Vehicle Parts Sheet'}
            <input 
              type="file" 
              accept="image/*" 
              multiple
              onChange={handleVehicleBatchUpload} 
              className="hidden" 
            />
          </label>

          {/* Quick Demo Tank sheet loader */}
          <button
            type="button"
            onClick={handleLoadDemoTankSheet}
            className="cursor-pointer bg-[#18202F] hover:bg-[#222E42] text-amber-300 font-mono font-bold text-xs px-3 py-2 rounded-lg shadow-sm border border-amber-500/30 transition-all flex items-center gap-1.5"
            title={lang === 'jp' ? '戦車分解サンプルシートを読み込む' : 'Load Demo Tank Component Sheet'}
          >
            <Crosshair className="w-3.5 h-3.5 text-amber-400" />
            {lang === 'jp' ? '戦車デモを即分解' : 'Demo Tank Sheet'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: THE AUTO-SEGMENTED SOURCE VIEWER */}
        <div className="lg:col-span-6 flex flex-col gap-4">

          {/* BATCH SHEET QUEUE MANAGER */}
          <div className="bg-white border border-theme-border rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-theme-border/30">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-theme-accent" />
                <span className="text-[10px] font-mono font-black text-theme-text uppercase tracking-wider">
                  {lang === 'jp' ? '一括処理シートキュー' : 'BATCH POSE SHEETS QUEUE'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-theme-muted font-bold">
                <span>{batchSheets.length} {lang === 'jp' ? '個のシート' : 'sheets'}</span>
                <span>•</span>
                <span className="text-theme-accent-blue">{cutouts.length} {lang === 'jp' ? 'ポーズ検出' : 'poses detected'}</span>
              </div>
            </div>

            {batchSheets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[140px] overflow-y-auto p-0.5 custom-scrollbar">
                {batchSheets.map((sheet) => {
                  const isActive = sheet.id === activeSheetId;
                  return (
                    <div
                      key={sheet.id}
                      onClick={() => setActiveSheetId(sheet.id)}
                      className={`relative group rounded-lg p-2 border transition-all cursor-pointer overflow-hidden flex items-center gap-2.5 ${isActive ? 'bg-[#1e293b]/5 border-theme-accent ring-2 ring-theme-accent/20' : 'bg-theme-bg/30 border-theme-border hover:border-theme-accent/50'}`}
                    >
                      {/* Miniature preview thumbnail */}
                      <div className="relative w-9 h-9 bg-[#121212] rounded overflow-hidden flex items-center justify-center shrink-0 border border-theme-border/50">
                        <img 
                          src={sheet.url} 
                          alt={sheet.name} 
                          className="max-w-full max-h-full object-contain"
                        />
                        {/* Status corner badge */}
                        {sheet.status === 'processing' && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
                          </div>
                        )}
                      </div>

                      {/* Sheet Metadata / Stats */}
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[10px] font-bold font-sans text-theme-text truncate pr-4" title={sheet.name}>
                          {sheet.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                          {sheet.sheetType === 'vehicle' && (
                            <span className="text-[7px] font-mono font-black bg-amber-500/15 text-amber-600 border border-amber-500/20 px-1 rounded-sm uppercase flex items-center gap-0.5">
                              <Shield className="w-2 h-2" />
                              VEHICLE
                            </span>
                          )}
                          {sheet.status === 'pending' && (
                            <span className="text-[8px] font-mono font-bold bg-theme-border/60 text-theme-muted px-1 rounded-sm uppercase">
                              {lang === 'jp' ? '待機中' : 'PENDING'}
                            </span>
                          )}
                          {sheet.status === 'processing' && (
                            <span className="text-[8px] font-mono font-bold bg-[#1e293b] text-theme-accent-blue px-1 rounded-sm uppercase animate-pulse">
                              {lang === 'jp' ? '解析中...' : 'SCANNING'}
                            </span>
                          )}
                          {sheet.status === 'completed' && (
                            <span className={`text-[8px] font-mono font-black px-1 rounded-sm uppercase ${
                              sheet.sheetType === 'vehicle' ? 'bg-amber-500/15 text-amber-600' : 'bg-green-500/10 text-green-500'
                            }`}>
                              {sheet.detectedBboxes.length} {sheet.sheetType === 'vehicle' ? (lang === 'jp' ? 'パーツ' : 'PARTS') : (lang === 'jp' ? 'ポーズ' : 'POSES')}
                            </span>
                          )}
                          {sheet.status === 'failed' && (
                            <span className="text-[8px] font-mono font-bold bg-red-500/10 text-red-500 px-1 rounded-sm uppercase">
                              {lang === 'jp' ? '失敗' : 'FAILED'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Deletion / Removal trigger */}
                      <button
                        type="button"
                        onClick={(e) => handleRemoveSheet(sheet.id, e)}
                        className="absolute top-1.5 right-1.5 z-20 p-1 bg-black/60 hover:bg-red-600 text-white hover:text-white rounded-full transition-all cursor-pointer flex items-center justify-center shadow"
                        title="Remove Sheet"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 border border-dashed border-theme-border rounded-lg bg-theme-bg/15 flex flex-col items-center justify-center text-center p-4 text-theme-muted">
                <Upload className="w-6 h-6 text-theme-border/80 mb-1" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-theme-text">{lang === 'jp' ? 'アップロードされたシートはありません' : 'NO POSE SHEETS UPLOADED'}</p>
              </div>
            )}

            {/* Global queue buttons */}
            {batchSheets.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-theme-border/30">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isBatchProcessing}
                    onClick={handleProcessAllPending}
                    className="px-3 py-1.5 text-[9px] font-mono font-black rounded-lg bg-theme-accent text-white hover:bg-theme-accent/90 disabled:opacity-50 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Play className="w-2.5 h-2.5" />
                    {lang === 'jp' ? '一括再スライス' : 'RE-RUN BATCH SLICING'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="px-3 py-1.5 text-[9px] font-mono font-black rounded-lg bg-theme-bg text-theme-text border border-theme-border hover:bg-theme-border/20 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    {lang === 'jp' ? 'キュー全消去' : 'CLEAR QUEUE'}
                  </button>
                </div>

                {cutouts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleDownloadAllCutouts}
                    className="px-3.5 py-1.5 text-[9px] font-mono font-black rounded-lg bg-[#2D2418] hover:bg-[#443826] text-white transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    {lang === 'jp' ? `全 ${cutouts.length} キャラ一括DL (.PNG)` : `DOWNLOAD ALL ${cutouts.length} POSES (.PNG)`}
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="bg-white border border-theme-border rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-theme-border/40">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-theme-accent-blue" />
                <span className="text-[10px] font-mono font-black text-theme-text uppercase tracking-wider">
                  {lang === 'jp' ? 'オリジナル素材シート (クリック選択可能)' : 'ORIGINAL COMPOSITE SHEET (CLICK TO SELECT)'}
                </span>
              </div>
              <div className="bg-theme-bg text-theme-accent font-mono font-black text-[9px] px-2.5 py-1 rounded-md border border-theme-border">
                {detectedBboxes.length} {lang === 'jp' ? 'ポーズ検出済' : 'POSES DETECTED'}
              </div>
            </div>

            {/* Main Interactive Canvas Area */}
            <div 
              ref={containerRef}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFiles(Array.from(e.dataTransfer.files));
                }
              }}
              className="w-full min-h-[450px] max-h-[500px] bg-[#141414] rounded-lg border border-theme-border/60 flex items-center justify-center p-2 relative group overflow-hidden select-none"
            >
              {imageUrl ? (
                <>
                  <canvas
                    ref={canvasRef}
                    width={canvasDimensions.width}
                    height={canvasDimensions.height}
                    onClick={handleCanvasClick}
                    className="max-w-full max-h-[480px] object-contain shadow-lg cursor-pointer rounded transition-all hover:brightness-105 active:scale-[0.99]"
                  />
                  {/* Floating X Delete Button for Active Sheet */}
                  {activeSheetId && (
                    <button
                      type="button"
                      onClick={(e) => handleRemoveSheet(activeSheetId, e)}
                      className="absolute top-3 right-3 z-30 p-2 bg-black/75 hover:bg-red-600 text-white rounded-full transition-all cursor-pointer flex items-center justify-center shadow-lg border border-white/10 hover:scale-105 animate-in fade-in zoom-in duration-200"
                      title="Delete Current Sheet"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </>
              ) : (
                <div 
                  className="text-center p-12 text-theme-muted flex flex-col items-center gap-3 cursor-pointer"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.multiple = true;
                    input.onchange = (e: any) => {
                      if (e.target?.files) handleFiles(Array.from(e.target.files));
                    };
                    input.click();
                  }}
                >
                  <ImageIcon className="w-12 h-12 text-theme-muted/50 animate-bounce" />
                  <p className="text-sm font-bold uppercase tracking-widest text-white">{lang === 'jp' ? '素材をドロップまたはクリックしてアップロード' : 'DRAG & DROP OR CLICK TO UPLOAD IMAGE'}</p>
                  <p className="text-[11px] text-theme-muted">{lang === 'jp' ? 'AIが自動的にキャラクターを検出してAI投げ縄(AI Lasso)で分割・抽出します' : 'AI automatically detects each character and isolates them using AI Lasso'}</p>
                </div>
              )}

              {/* Live Status indicator */}
              <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white font-mono text-[9px] select-none pointer-events-none flex items-center gap-2 shadow-lg">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                <span>
                  {lang === 'jp' ? 'AI投げ縄(AI Lasso)自動輪郭抽出中。クリックして個別選択できます。' : 'AI Lasso contour segmentation active. Full bodies automatically separated.'}
                </span>
              </div>
            </div>

            {/* Slicing & Lasso Controls */}
            <div className="bg-theme-bg/30 border border-theme-border rounded-xl p-3.5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-theme-border/20">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-black text-theme-text uppercase tracking-wider">
                    {lang === 'jp' ? '切り出し・スライス分割モード' : 'LASSO & CHARACTER SLICING MODE'}
                  </span>
                  <p className="text-[9px] text-theme-muted">
                    {lang === 'jp' ? 'キャラクターの配置に合わせて切り分け方法を選択します。' : 'Choose how characters are separated and isolated.'}
                  </p>
                </div>

                {/* Slicing mode buttons */}
                <div className="flex flex-wrap bg-theme-border/45 p-0.5 rounded-lg border border-theme-border shrink-0 self-start sm:self-auto gap-0.5">
                  <button
                    type="button"
                    onClick={() => setSplitMode('auto')}
                    className={`px-2.5 py-1 text-[10px] font-mono font-black rounded-md transition-all ${
                      splitMode === 'auto'
                        ? 'bg-theme-accent text-white shadow-sm font-bold'
                        : 'text-theme-text hover:bg-theme-border/20'
                    }`}
                  >
                    {lang === 'jp' ? 'AI 自動検出' : 'AI Auto-Detect'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMode('manual')}
                    className={`px-2.5 py-1 text-[10px] font-mono font-black rounded-md transition-all ${
                      splitMode === 'manual'
                        ? 'bg-theme-accent text-white shadow-sm font-bold'
                        : 'text-theme-text hover:bg-theme-border/20'
                    }`}
                  >
                    {lang === 'jp' ? '均等分割' : 'Equal Slices'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSplitMode('vehicle')}
                    className={`px-2.5 py-1 text-[10px] font-mono font-black rounded-md transition-all flex items-center gap-1 ${
                      splitMode === 'vehicle'
                        ? 'bg-amber-600 text-white shadow-sm font-bold'
                        : 'text-amber-600 hover:bg-amber-500/15'
                    }`}
                  >
                    <Shield className="w-2.5 h-2.5" />
                    {lang === 'jp' ? '戦車・ビークル分解' : 'Vehicle Parts'}
                  </button>
                </div>
              </div>

              {splitMode === 'vehicle' ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono font-black text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      {lang === 'jp' ? '戦車・車両モジュール個別分解モード' : 'VEHICLE COMPONENT MODULAR DECOMPOSITION'}
                    </span>
                    <p className="text-[9px] text-theme-muted">
                      {lang === 'jp'
                        ? '車体（右/左側面）、主砲塔、ハッチ、アンテナなどをパーツ単位に自動分解して個別画像として抽出します。'
                        : 'Separates Tank Body (Right/Left), Turret & Main Cannons, Hatch, and Antennas into distinct, isolated component images.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadDemoTankSheet}
                    className="shrink-0 text-[9px] font-mono font-bold bg-[#18202F] text-amber-300 hover:bg-[#222E42] px-2.5 py-1.5 rounded border border-amber-500/40 flex items-center gap-1"
                  >
                    <Crosshair className="w-3 h-3 text-amber-400" />
                    {lang === 'jp' ? 'デモ戦車シートを分解' : 'Load Demo Tank'}
                  </button>
                </div>
              ) : splitMode === 'manual' ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono font-bold text-theme-text/80 uppercase tracking-wider">
                      {lang === 'jp' ? 'キャラクター数（均等列数）' : 'NUMBER OF CHARACTERS'}
                    </span>
                    <p className="text-[9px] text-theme-muted">
                      {lang === 'jp' ? '指定された数に等分割し、各キャラクターを自動でぴったり枠付け（タイトクロップ）します。' : 'Divides the composite sheet and tightly crops around each individual character.'}
                    </p>
                  </div>

                  {/* Buttons to choose character count */}
                  <div className="flex items-center gap-1.5 bg-theme-bg p-1 rounded-lg border border-theme-border self-start sm:self-auto shrink-0">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setManualColumns(num)}
                        className={`w-7 h-7 flex items-center justify-center font-mono text-xs font-black rounded-md transition-all border ${
                          manualColumns === num
                            ? 'bg-theme-accent text-white border-theme-accent shadow-sm'
                            : 'bg-white text-theme-text border-theme-border/60 hover:bg-theme-border/20'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-[9px] text-theme-muted italic pt-1">
                  {lang === 'jp' ? '💡 AI自動検出モードは、キャラクター間の余白をもとに自動的にセグメンテーション（切り分け）を行います。' : '💡 AI Auto-detect mode relies on background contrast to find column gaps automatically.'}
                </p>
              )}
            </div>

            {/* Quick adjust auto-tolerance settings */}
            <div className="bg-theme-bg/50 border border-theme-border rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-black text-theme-text uppercase tracking-wider">{lang === 'jp' ? '透過・セグメント検出感度' : 'AI CROPPING TOLERANCE'}</span>
                <p className="text-[9px] text-theme-muted">{lang === 'jp' ? '輪郭検出や透過除去の度合いをスライダーで細かく調整します。' : 'Finely adjust character sheet contour limits.'}</p>
              </div>

              <div className="flex items-center gap-3 min-w-[180px]">
                <input 
                  type="range" 
                  min="10" 
                  max="120" 
                  value={tolerance} 
                  onChange={(e) => setTolerance(Number(e.target.value))}
                  className="w-full accent-theme-accent cursor-pointer h-1.5 bg-theme-border rounded-lg appearance-none"
                />
                <span className="text-xs font-mono font-bold text-theme-text">{tolerance}</span>
                <button
                  type="button"
                  onClick={async () => {
                    if (!activeSheetId) return;
                    const activeSheet = batchSheets.find(s => s.id === activeSheetId);
                    if (activeSheet && activeSheet.imageElement) {
                      setIsProcessing(true);
                      try {
                        let processedCutouts: CutoutItem[] = [];
                        let bboxes: { x: number; y: number; w: number; h: number }[] = [];

                        if (activeSheet.sheetType === 'vehicle') {
                          const res = await segmentVehicleImage(activeSheet.imageElement, activeSheet.id, activeSheet.name, activeSheet.url);
                          processedCutouts = res.processedCutouts;
                          bboxes = res.bboxes;
                        } else if (splitMode === 'manual') {
                          const res = segmentImageDirectly(activeSheet.imageElement, activeSheet.id, activeSheet.name);
                          processedCutouts = res.processedCutouts;
                          bboxes = res.bboxes;
                        } else {
                          const res = await segmentImageWithAI(activeSheet.imageElement, activeSheet.id, activeSheet.name, activeSheet.url);
                          processedCutouts = res.processedCutouts;
                          bboxes = res.bboxes;
                        }

                        setBatchSheets(prev => prev.map(s => {
                          if (s.id === activeSheetId) {
                            return { ...s, status: 'completed' as const, cutouts: processedCutouts, detectedBboxes: bboxes };
                          }
                          return s;
                        }));
                        setCutouts(prev => {
                          const filtered = prev.filter(c => c.sheetId !== activeSheetId);
                          return [...filtered, ...processedCutouts];
                        });
                        setDetectedBboxes(bboxes);

                        // Save manually re-segmented cutouts to Firestore for persistence
                        if (processedCutouts.length > 0) {
                          fetch("/api/sprite_cache/save", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(processedCutouts)
                          }).catch(err => console.error("Error saving manual segmented sprites to firestore:", err));
                        }
                      } catch (err) {
                        console.error("Manual re-process failed:", err);
                      } finally {
                        setIsProcessing(false);
                      }
                    }
                  }}
                  className="p-1.5 text-theme-muted hover:text-theme-text bg-white border border-theme-border rounded shadow-sm hover:bg-theme-bg transition-all cursor-pointer"
                  title="Re-run Segmentation"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: HIGH-FIDELITY OUTPUT STUDIO - ZOOM, PAN, ON-OFF BACKGROUND, DOWNLOAD */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          
          <div className="bg-white border border-theme-border rounded-xl p-4 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-theme-border/40 pb-2.5">
              <div className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-theme-accent" />
                <h3 className="text-xs font-mono font-black text-theme-text uppercase tracking-wider">
                  {lang === 'jp' ? 'AI自動分離カット出力スタジオ' : 'ISOLATED HIGH-FIDELITY STUDIO'}
                </h3>
              </div>

              {/* Selected badge */}
              {cutouts.length > 0 && selectedCutoutIndex !== -1 && (
                <div className="bg-theme-accent/10 text-theme-accent font-mono font-bold text-[10px] px-2.5 py-1 rounded-md border border-theme-accent/20">
                  {lang === 'jp' ? `カット ${selectedCutoutIndex + 1} / ${cutouts.length}` : `SEGMENT ${selectedCutoutIndex + 1} of ${cutouts.length}`}
                </div>
              )}
            </div>

            {isMultiRigMode ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                {selectedRiggingIds.length === 0 ? (
                  <div className="py-12 border-2 border-dashed border-theme-border/60 rounded-xl bg-theme-bg/25 flex flex-col items-center justify-center text-center p-6 text-theme-muted">
                    <Sparkles className="w-10 h-10 text-theme-border/80 stroke-1 mb-2 animate-pulse" />
                    <p className="text-xs font-bold uppercase tracking-wider text-[#AA4DFA] mb-1">
                      {lang === 'jp' ? 'ポーズが選択されていません' : 'NO POSES SELECTED FOR V-POSE RIGGING'}
                    </p>
                    <p className="text-[11px] max-w-xs">
                      {lang === 'jp' ? '下部のスプライトポーズキャッシュから、Vポーズに変換したいキャラクターを1つ以上クリックして選択してください。' : 'Click on one or more character components from the pose cache below to select them for rigging alignment.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Active Rigging item header navigation */}
                    <div className="flex items-center justify-between bg-[#F9F6FE] p-2 rounded-lg border border-[#AA4DFA]/20 text-xs font-mono font-bold shadow-sm">
                      <div className="flex items-center gap-1.5 text-theme-text">
                        <Sparkles className="w-3.5 h-3.5 text-[#AA4DFA]" />
                        <span>
                          {lang === 'jp' ? '対象キャラクター:' : 'AI Target Segment:'}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {selectedRiggingIds.map((id, index) => {
                          const originalIdx = cutouts.findIndex(c => c.id === id);
                          return (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setActiveRigIndex(index)}
                              className={`px-2.5 py-0.5 rounded text-[10px] font-black transition-all ${activeRigIndex === index ? 'bg-[#AA4DFA] text-white' : 'bg-white hover:bg-[#AA4DFA]/10 text-theme-muted border border-theme-border'}`}
                            >
                              #{originalIdx + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Viewport with Side-by-Side Comparison */}
                    {(() => {
                      const activeId = selectedRiggingIds[activeRigIndex];
                      const activeCutout = cutouts.find(c => c.id === activeId);
                      if (!activeCutout) return null;

                      const isRigged = riggedResults[activeId]?.hasRigged;
                      const displayUrl = isRigged ? riggedResults[activeId].riggedUrl : activeCutout.url;

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 animate-in fade-in duration-200">
                          <div className="md:col-span-7 space-y-2">
                            {/* Visual Canvas box */}
                            <div className="aspect-square w-full bg-[#1e1e1e] rounded-xl border border-theme-border/80 p-1 flex items-center justify-center relative overflow-hidden select-none">
                              {/* Checkerboard backdrop */}
                              <div 
                                className="absolute inset-0 opacity-[0.12] pointer-events-none" 
                                style={{ 
                                  backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', 
                                  backgroundSize: '20px 20px', 
                                }}
                              ></div>

                              {/* Character Sprite Display */}
                              <img 
                                src={displayUrl} 
                                alt="Active Character Frame" 
                                className="max-w-[85%] max-h-[85%] object-contain relative z-10 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all duration-300"
                              />

                              {/* Corner status tag */}
                              <div className="absolute top-3 left-3 z-20 px-2 py-0.5 bg-black/80 backdrop-blur rounded text-[9px] font-mono font-bold border border-white/15">
                                {isRigged ? (
                                  <span className="text-yellow-400 flex items-center gap-1">
                                    <Sparkles className="w-2.5 h-2.5 text-yellow-300 animate-pulse" />
                                    {lang === 'jp' ? 'AI生成された Vポーズ' : 'AI GENERATED V-POSE'}
                                  </span>
                                ) : (
                                  <span className="text-theme-muted">
                                    {lang === 'jp' ? 'オリジナル画像' : 'ORIGINAL CUTOUT'}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Help tips description */}
                            <div className="flex items-center gap-1.5 text-[9px] text-[#AA4DFA]/90 bg-[#AA4DFA]/5 p-2 rounded-lg border border-[#AA4DFA]/20 justify-center text-center">
                              <Sparkles className="w-3 h-3 text-[#AA4DFA]" />
                              <span>
                                {isRigged 
                                  ? (lang === 'jp' ? 'AIがポーズの補正・再描画を完了しました！' : 'AI has completed redrafting this character into a clean rigging A-pose!')
                                  : (lang === 'jp' ? '「Vポーズに変換」ボタンをクリックすると、AIが衣装を一貫したまま、腕が45度開いたリギング用Aポーズへ自動再描画します。' : 'Click "CONVERT TO V-POSE (AI)" to redraft this character drawing with standard A-pose arms alignment.')
                                }
                              </span>
                            </div>
                          </div>

                          <div className="md:col-span-5 space-y-3 flex flex-col justify-between">
                            <div className="space-y-3">
                              <div className="space-y-1">
                                <span className="text-[10px] font-mono font-black text-theme-text uppercase tracking-wider">
                                  {lang === 'jp' ? 'AI Vポーズ生成情報' : 'AI V-POSE REDRAW SPECIFICATION'}
                                </span>
                                
                                <div className="space-y-2 bg-[#F9F6FE] p-3 rounded-lg border border-[#AA4DFA]/15">
                                  <div className="space-y-2 text-xs font-mono">
                                    <div className="flex justify-between border-b border-[#AA4DFA]/10 pb-1.5">
                                      <span className="text-theme-muted">{lang === 'jp' ? '生成モデル:' : 'AI Engine:'}</span>
                                      <span className="text-[#AA4DFA] font-bold">Gemini Vision + Diffusion</span>
                                    </div>
                                    <div className="flex justify-between border-b border-[#AA4DFA]/10 pb-1.5">
                                      <span className="text-theme-muted">{lang === 'jp' ? 'ターゲット姿勢:' : 'Target Pose:'}</span>
                                      <span className="text-[#AA4DFA] font-bold">A-Pose (Arms at 45°)</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-theme-muted">{lang === 'jp' ? '背景一貫性:' : 'Background:'}</span>
                                      <span className="text-[#AA4DFA] font-bold">Solid White Canvas</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Small comparison thumbnail if rigged */}
                              {isRigged && (
                                <div className="space-y-1 animate-in slide-in-from-bottom-2 duration-150">
                                  <span className="text-[10px] font-mono font-black text-theme-muted uppercase tracking-wider">
                                    {lang === 'jp' ? '比較ビュー' : 'COMPARISON'}
                                  </span>
                                  <div className="grid grid-cols-2 gap-2 bg-theme-bg border border-theme-border/60 p-2 rounded-lg">
                                    <div className="space-y-1">
                                      <p className="text-[9px] font-mono font-bold text-center text-theme-muted">{lang === 'jp' ? 'オリジナル' : 'Original'}</p>
                                      <div className="aspect-square bg-black/20 rounded flex items-center justify-center p-1 border border-theme-border">
                                        <img src={riggedResults[activeId].originalUrl} className="max-h-full max-w-full object-contain" />
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[9px] font-mono font-bold text-center text-yellow-500">{lang === 'jp' ? 'Vポーズ AI' : 'V-Pose AI'}</p>
                                      <div className="aspect-square bg-black/20 rounded flex items-center justify-center p-1 border border-[#AA4DFA]/50 ring-1 ring-[#AA4DFA]/20">
                                        <img src={riggedResults[activeId].riggedUrl} className="max-h-full max-w-full object-contain" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2 pt-2 border-t border-theme-border/45">
                              {isRigged ? (
                                <div className="space-y-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRiggedResults(prev => {
                                        const updated = { ...prev };
                                        delete updated[activeId];
                                        return updated;
                                      });
                                    }}
                                    className="w-full py-2 px-3 text-[10px] font-mono font-bold text-theme-muted bg-white border border-theme-border hover:bg-theme-bg rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    {lang === 'jp' ? 'AIポーズ変換をリセット (再生成)' : 'Reset AI Pose Conversion'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const riggedUrl = riggedResults[activeId]?.riggedUrl;
                                      if (riggedUrl) {
                                        onAddToPoseReferences(riggedUrl, `${activeCutout.prompt || 'Rigged'} V-Pose`);
                                      }
                                    }}
                                    className="w-full py-2.5 px-3 text-xs font-mono font-black text-white bg-gradient-to-r from-theme-accent to-[#AA4DFA] hover:opacity-95 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                                    {lang === 'jp' ? 'Vポーズキャラをポーズリストに追加' : 'Add Rigged V-Pose to Anchors'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const riggedUrl = riggedResults[activeId]?.riggedUrl;
                                      if (riggedUrl) {
                                        const link = document.createElement('a');
                                        link.download = `v_pose_redraw_${activeRigIndex + 1}.png`;
                                        link.href = riggedUrl;
                                        link.click();
                                      }
                                    }}
                                    className="w-full py-2 px-3 text-[10px] font-mono font-bold text-[#AA4DFA] bg-[#AA4DFA]/5 hover:bg-[#AA4DFA]/10 border border-[#AA4DFA]/20 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    {lang === 'jp' ? '生成されたPNGのダウンロード' : 'Download Generated PNG'}
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {isRiggingProcessing ? (
                                    <div className="space-y-2 bg-[#F9F6FE] p-3 rounded-lg border border-[#AA4DFA]/20">
                                      <div className="flex justify-between text-[10px] font-mono font-bold text-theme-text">
                                        <span className="animate-pulse">{riggingStepStatus}</span>
                                        <span className="text-[#AA4DFA] font-black">{riggingProgress}%</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-white border border-[#AA4DFA]/10 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-gradient-to-r from-[#AA4DFA] to-theme-accent transition-all duration-300 rounded-full"
                                          style={{ width: `${riggingProgress}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={runVPoseTransformation}
                                      className="w-full py-3 px-4 text-xs font-mono font-black text-white bg-gradient-to-r from-[#AA4DFA] to-theme-accent hover:shadow-md border border-[#AA4DFA]/25 rounded-lg shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 duration-100"
                                    >
                                      <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
                                      {lang === 'jp' 
                                        ? `選択中の ${selectedRiggingIds.length} 個をVポーズに変換する (AI)` 
                                        : `CONVERT SELECTED (${selectedRiggingIds.length}) TO V-POSE (AI)`
                                      }
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : (
              cutouts.length > 0 && selectedCutoutIndex !== -1 && cutouts[selectedCutoutIndex] ? (
                <div className="space-y-4">
                  
                  {/* INTERACTIVE WORKSPACE VIEWPORT WITH ZOOM, PAN, AND MOUSE GESTURES */}
                  <div 
                    ref={previewBoxRef}
                    onWheel={handleWheelZoom}
                    className="aspect-square w-full bg-[#1e1e1e] rounded-xl border border-theme-border/80 p-1 flex items-center justify-center relative overflow-hidden group select-none cursor-grab active:cursor-grabbing"
                    onMouseDown={handlePanStart}
                    onMouseMove={handlePanMove}
                    onMouseUp={handlePanEnd}
                    onMouseLeave={handlePanEnd}
                >
                  {/* Grid checkerboard overlay when background removal is active */}
                  {removeBgEnabled && (
                    <div 
                      className="absolute inset-0 opacity-[0.12] pointer-events-none" 
                      style={{ 
                        backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', 
                        backgroundSize: '20px 20px', 
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0' 
                      }}
                    ></div>
                  )}
                  
                  {/* Zooming / Panning cutout component */}
                  <motion.div 
                    style={{ 
                      x: panOffset.x,
                      y: panOffset.y,
                      scale: zoomLevel
                    }}
                    className="max-w-[90%] max-h-[90%] flex items-center justify-center relative z-10 pointer-events-none transition-transform duration-75"
                  >
                    <img 
                      src={cutouts[selectedCutoutIndex].url} 
                      alt="Active Auto Segment" 
                      className="max-w-full max-h-full object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                    />
                  </motion.div>

                  {/* High Quality Overlay Compass HUD */}
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white font-mono text-[9px] px-2.5 py-1 rounded-md shadow border border-white/10 z-20 flex items-center gap-1">
                    <Hand className="w-3 h-3 text-theme-accent-blue" />
                    <span>{lang === 'jp' ? 'ドラッグして移動 / スクロールでズーム' : 'Drag to pan / Wheel to zoom'}</span>
                  </div>

                  {/* Zoom Level Indicator HUD */}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white font-mono text-[9px] px-2.5 py-1 rounded-md shadow border border-white/10 z-20">
                    {Math.round(zoomLevel * 100)}% ZOOM
                  </div>

                  {/* COMPACT FLOATING NAVIGATION BAR inside viewport */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 backdrop-blur-lg px-4 py-2 rounded-xl border border-white/15 shadow-xl flex items-center gap-4 z-20">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCutoutIndex(prev => prev > 0 ? prev - 1 : cutouts.length - 1);
                        setZoomLevel(1.0);
                        setPanOffset({ x: 0, y: 0 });
                      }}
                      className="text-white hover:text-theme-accent transition-all cursor-pointer p-1"
                      title="Previous character"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="h-4 w-[1px] bg-white/20"></div>

                    {/* Zoom control cluster */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                        className="p-1 hover:bg-white/10 text-white rounded transition-all cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleZoomReset(); }}
                        className="px-2 py-0.5 hover:bg-white/10 text-white font-mono text-[10px] rounded transition-all cursor-pointer"
                        title="Reset Zoom"
                      >
                        FIT
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                        className="p-1 hover:bg-white/10 text-white rounded transition-all cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="h-4 w-[1px] bg-white/20"></div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCutoutIndex(prev => prev < cutouts.length - 1 ? prev + 1 : 0);
                        setZoomLevel(1.0);
                        setPanOffset({ x: 0, y: 0 });
                      }}
                      className="text-white hover:text-theme-accent transition-all cursor-pointer p-1"
                      title="Next character"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* DYNAMIC ON-OFF BACKGROUND CONTROL PANEL */}
                <div className="bg-theme-bg/60 border border-theme-border rounded-xl p-3.5 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono font-black text-theme-text uppercase tracking-wider">
                        {lang === 'jp' ? '背景の切り替え (透過 ON/OFF)' : 'BACKGROUND ISOLATION MASK'}
                      </span>
                      <p className="text-[9px] text-theme-muted">
                        {lang === 'jp' ? '自動認識された背景色を透過(ON)するか、元の背景を残す(OFF)か選択します。' : 'Toggle between transparent Alpha transparency or keeping the original backdrop pixels.'}
                      </p>
                    </div>

                    {/* Toggle Selector Button Option */}
                    <div className="grid grid-cols-2 gap-1.5 bg-white p-1 rounded-lg border border-theme-border min-w-[200px]">
                      <button
                        type="button"
                        onClick={() => setRemoveBgEnabled(false)}
                        className={`py-1.5 px-3 text-xs font-mono font-bold rounded-md transition-all ${!removeBgEnabled ? 'bg-red-500 text-white shadow-sm font-black' : 'text-theme-muted hover:text-theme-text'}`}
                      >
                        {lang === 'jp' ? '背景 OFF' : 'BACKGROUND OFF'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRemoveBgEnabled(true)}
                        className={`py-1.5 px-3 text-xs font-mono font-bold rounded-md transition-all ${removeBgEnabled ? 'bg-green-600 text-white shadow-sm font-black' : 'text-theme-muted hover:text-theme-text'}`}
                      >
                        {lang === 'jp' ? '背景 ON (透過)' : 'BACKGROUND ON'}
                      </button>
                    </div>
                  </div>

                  {/* Color Sampler / Eye-dropper tool */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2.5 border-t border-theme-border/20">
                    <button
                      type="button"
                      onClick={() => setEyeDropperActive(!eyeDropperActive)}
                      className={`w-full sm:w-auto py-2 px-3.5 rounded-lg text-[10px] font-mono font-black border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        eyeDropperActive
                          ? 'bg-yellow-500 text-black border-yellow-400 animate-pulse'
                          : 'bg-white text-theme-text border-theme-border hover:bg-theme-border/20'
                      }`}
                    >
                      <Pipette className="w-3.5 h-3.5" />
                      {eyeDropperActive
                        ? (lang === 'jp' ? '画像内をクリックして色を抽出中...' : 'CLICK MAIN CANVAS TO SAMPLE BACKGROUND...')
                        : (lang === 'jp' ? 'カスタム背景色のスポイト抽出' : 'SAMPLE BACKGROUND COLOR (EYE-DROPPER)')
                      }
                    </button>
                    
                    {manualBgColor && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-theme-muted uppercase">Selected Background Color:</span>
                        <span 
                          className="w-4 h-4 rounded border border-theme-border/60 shadow-sm" 
                          style={{ backgroundColor: `rgb(${manualBgColor.r}, ${manualBgColor.g}, ${manualBgColor.b})` }}
                          title={`RGB: ${manualBgColor.r}, ${manualBgColor.g}, ${manualBgColor.b}`}
                        ></span>
                        <button
                          type="button"
                          onClick={() => {
                            setManualBgColor(null);
                            // Trigger re-segmentation to use default corner detection
                            setTimeout(async () => {
                              const activeSheet = batchSheets.find(s => s.id === activeSheetId);
                              if (activeSheet && activeSheet.imageElement) {
                                setIsProcessing(true);
                                try {
                                  let processedCutouts: CutoutItem[] = [];
                                  let bboxes: { x: number; y: number; w: number; h: number }[] = [];
                                  if (activeSheet.sheetType === 'vehicle') {
                                    const res = await segmentVehicleImage(activeSheet.imageElement, activeSheet.id, activeSheet.name, activeSheet.url);
                                    processedCutouts = res.processedCutouts;
                                    bboxes = res.bboxes;
                                  } else if (splitMode === 'manual') {
                                    const res = segmentImageDirectly(activeSheet.imageElement, activeSheet.id, activeSheet.name);
                                    processedCutouts = res.processedCutouts;
                                    bboxes = res.bboxes;
                                  } else {
                                    const res = await segmentImageWithAI(activeSheet.imageElement, activeSheet.id, activeSheet.name, activeSheet.url);
                                    processedCutouts = res.processedCutouts;
                                    bboxes = res.bboxes;
                                  }
                                  setBatchSheets(prev => prev.map(s => s.id === activeSheetId ? { ...s, status: 'completed' as const, cutouts: processedCutouts, detectedBboxes: bboxes } : s));
                                  setCutouts(prev => {
                                    const filtered = prev.filter(c => c.sheetId !== activeSheetId);
                                    const combined = [...filtered, ...processedCutouts];
                                    return combined;
                                  });
                                } catch (err) {
                                  console.error("Failed to reset background color", err);
                                } finally {
                                  setIsProcessing(false);
                                }
                              }
                            }, 50);
                          }}
                          className="text-[10px] font-mono text-red-500 hover:underline cursor-pointer"
                        >
                          Reset
                        </button>
                      </div>
                    )}
                  </div>

                  {/* APPLY BACKGROUND SETTINGS BUTTON */}
                  <button
                    type="button"
                    onClick={handleApplyBgToggle}
                    className="w-full py-2.5 px-4 text-xs font-mono font-black text-white bg-theme-accent-blue hover:bg-theme-accent-blue/90 border border-theme-accent-blue/30 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 duration-100"
                  >
                    <Check className="w-4 h-4 text-green-300 animate-pulse" />
                    {lang === 'jp' ? '背景処理を適用する' : 'APPLY BACKGROUND SETTINGS'}
                  </button>
                </div>

                {/* ACTION DIRECTIVES: ADD TO POSE REFERENCE OR CHARACTER REFERENCE OR DOWNLOAD */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => {
                      onSetAsCharacterReference(cutouts[selectedCutoutIndex].url);
                    }}
                    className="py-2.5 px-3 rounded-lg text-xs font-mono font-bold bg-[#1A2535] hover:bg-[#253549] text-theme-accent-blue border border-theme-accent-blue/30 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {lang === 'jp' ? '主キャラクターに設定' : 'Set as Character Ref'}
                  </button>

                  <button
                    onClick={() => {
                      onAddToPoseReferences(cutouts[selectedCutoutIndex].url, cutouts[selectedCutoutIndex].prompt);
                    }}
                    className="py-2.5 px-3 rounded-lg text-xs font-mono font-bold bg-[#2D1B22] hover:bg-[#422832] text-theme-accent border border-theme-accent/30 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {lang === 'jp' ? 'ポーズリストに追加' : 'Add to Pose Anchors'}
                  </button>

                  <button
                    onClick={handleDownloadActiveCutout}
                    className="sm:col-span-2 py-3 px-4 rounded-lg text-xs font-mono font-bold bg-[#2C2518] hover:bg-[#443a26] text-white transition-all text-center flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    {lang === 'jp' ? '切り抜いた画像のダウンロード (.png)' : 'Download Cutout PNG Image'}
                  </button>
                </div>

              </div>
            ) : (
              <div className="py-12 border-2 border-dashed border-theme-border/60 rounded-xl bg-theme-bg/25 flex flex-col items-center justify-center text-center p-6 text-theme-muted">
                <Scissors className="w-10 h-10 text-theme-border/80 stroke-1 mb-2" />
                <p className="text-xs font-bold uppercase tracking-wider text-theme-text mb-1">{lang === 'jp' ? '切り抜きがありません' : 'NO ACTIVE SELECTIONS'}</p>
                <p className="text-[11px] max-w-xs">{lang === 'jp' ? '左側の画像シートを選択するか、新しくアップロードしてAIに自動抽出をさせてください。' : 'Select a character region from the main canvas or upload a new sheet to automatically detect separate figures.'}</p>
              </div>
            ))}
          </div>

          {/* HISTORICAL GRID GALLERY FOR ALL AUTO DETECTED POSES */}
          {cutouts.length > 0 && (
            <div className="bg-white border border-theme-border rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-theme-border/30 gap-2">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-black text-theme-muted uppercase tracking-wider">
                    {lang === 'jp' ? '自動検出されたキャラクターリスト' : 'AUTO-SEPARATED SPRITE POSE CACHE'}
                  </span>
                  <p className="text-[9px] text-theme-muted">
                    {isMultiRigMode 
                      ? (lang === 'jp' ? '💡 クリックしてVポーズ対象を選択します（複数可）。' : '💡 Toggle click thumbnails to select multiple poses for rigging alignment.')
                      : (lang === 'jp' ? '💡 クリックで右側の高解像度スタジオに各ポーズを呼び出します。' : '💡 Click a thumbnail to view individual segment details.')
                    }
                  </p>
                </div>

                {/* Mode Selector Tab Trigger */}
                <div className="flex items-center bg-[#f0f0f0] p-0.5 rounded-lg border border-theme-border self-start sm:self-auto shrink-0 shadow-inner">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMultiRigMode(false);
                      if (selectedCutoutIndex === -1 && cutouts.length > 0) {
                        setSelectedCutoutIndex(0);
                      }
                    }}
                    className={`px-3 py-1 text-[10px] font-mono font-black rounded-md transition-all flex items-center gap-1 cursor-pointer ${!isMultiRigMode ? 'bg-white text-theme-text shadow-sm border border-theme-border/20' : 'text-theme-muted hover:text-theme-text'}`}
                  >
                    <Eye className="w-3 h-3 text-theme-accent" />
                    {lang === 'jp' ? '個別表示' : 'SINGLE VIEW'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMultiRigMode(true);
                      if (selectedRiggingIds.length === 0) {
                        if (selectedCutoutIndex !== -1 && cutouts[selectedCutoutIndex]) {
                          setSelectedRiggingIds([cutouts[selectedCutoutIndex].id]);
                        } else if (cutouts.length > 0) {
                          setSelectedRiggingIds([cutouts[0].id]);
                        }
                        setActiveRigIndex(0);
                      }
                    }}
                    className={`px-3 py-1 text-[10px] font-mono font-black rounded-md transition-all flex items-center gap-1 cursor-pointer ${isMultiRigMode ? 'bg-[#AA4DFA] text-white shadow-sm' : 'text-theme-muted hover:text-[#AA4DFA]'}`}
                  >
                    <Sparkles className="w-3 h-3 animate-pulse text-yellow-300" />
                    {lang === 'jp' ? 'Vポーズ変換' : 'V-POSE RIGGING'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 overflow-y-auto max-h-[160px] p-0.5 custom-scrollbar">
                {cutouts.map((cut, idx) => {
                  const isSelectedForRigging = selectedRiggingIds.includes(cut.id);
                  const riggingIndex = selectedRiggingIds.indexOf(cut.id);
                  const isSingleSelected = selectedCutoutIndex === idx;

                  return (
                    <div
                      key={cut.id}
                      className="relative group aspect-square"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (isMultiRigMode) {
                            if (selectedRiggingIds.includes(cut.id)) {
                              const updated = selectedRiggingIds.filter(id => id !== cut.id);
                              setSelectedRiggingIds(updated);
                              if (activeRigIndex >= updated.length) {
                                setActiveRigIndex(Math.max(0, updated.length - 1));
                              }
                            } else {
                              const updated = [...selectedRiggingIds, cut.id];
                              setSelectedRiggingIds(updated);
                              setActiveRigIndex(updated.length - 1);
                            }
                          } else {
                            setSelectedCutoutIndex(idx);
                            setZoomLevel(1.0);
                            setPanOffset({ x: 0, y: 0 });
                          }
                        }}
                        className={`w-full h-full relative rounded-lg p-1 border transition-all overflow-hidden bg-[#181818] flex items-center justify-center ${
                          isMultiRigMode
                            ? isSelectedForRigging
                              ? 'border-[#AA4DFA] ring-2 ring-[#AA4DFA]/20 scale-95 shadow-md bg-[#AA4DFA]/5'
                              : 'border-theme-border/60 hover:border-[#AA4DFA]/50'
                            : isSingleSelected
                              ? 'border-theme-accent ring-2 ring-theme-accent/20 scale-95'
                              : 'border-theme-border/60 hover:border-theme-accent'
                        }`}
                      >
                        <img 
                          src={cut.url} 
                          alt="Crop thumbnail" 
                          className="max-w-full max-h-full object-contain relative z-10 filter drop-shadow-sm"
                        />
                        <div className="absolute inset-0 opacity-10 bg-white" style={{ backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)', backgroundSize: '10px 10px' }}></div>
                        
                        {/* Selected Sequence Badge or standard sequence index */}
                        {isMultiRigMode && isSelectedForRigging ? (
                          <div className="absolute top-1 left-1 bg-[#AA4DFA] text-white font-mono text-[9px] w-4 border border-white/20 h-4 rounded-full flex items-center justify-center z-20 font-black shadow animate-in zoom-in duration-150">
                            {riggingIndex + 1}
                          </div>
                        ) : null}

                        <div className="absolute bottom-1 right-1 bg-black/60 text-white font-mono text-[8px] px-1 rounded-sm z-20 scale-90">
                          #{idx + 1}
                        </div>
                      </button>
                      {/* Circle X Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => handleRemoveCutout(idx, e)}
                        className="absolute top-1 right-1 z-30 p-0.5 bg-black/70 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-md cursor-pointer flex items-center justify-center"
                        title="Remove Pose Cutout"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
