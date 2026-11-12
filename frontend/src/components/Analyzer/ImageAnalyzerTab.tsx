import React, { useState, useRef, useEffect } from 'react';
import {
  ScanEye,
  Crop,
  Layers,
  Info,
  Maximize2,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Calculator,
  Sigma,
  Crosshair,
  Sliders,
  Check
} from 'lucide-react';
import { ProcessedImageData } from '../../utils/imageProcessor';
import { RegionOfInterest, RegionStats } from '../../types';
import { computeRegionStats } from '../../utils/mathEngine';
import { StatCard } from '../common/StatCard';
import { FormulaCard } from '../common/FormulaCard';

interface ImageAnalyzerTabProps {
  imageData: ProcessedImageData | null;
  imageName: string;
}

export const ImageAnalyzerTab: React.FC<ImageAnalyzerTabProps> = ({
  imageData,
  imageName,
}) => {
  const [roi, setRoi] = useState<RegionOfInterest | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [hoverPixel, setHoverPixel] = useState<{ x: number; y: number; lum: number } | null>(null);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'grayscale-only' | 'original-only'>('side-by-side');

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stats = imageData?.stats;

  // Calculate Region Stats if ROI is active
  const regionStats: RegionStats | null = React.useMemo(() => {
    if (!stats || !stats.luminanceMatrix || !roi || roi.width === 0 || roi.height === 0) {
      return null;
    }
    return computeRegionStats(stats.luminanceMatrix, stats.width, stats.height, roi);
  }, [stats, roi]);

  // Handle ROI mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !stats) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = stats.width / rect.width;
    const scaleY = stats.height / rect.height;

    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);

    setStartPos({ x, y });
    setRoi({ x, y, width: 1, height: 1 });
    setIsSelecting(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !stats || !stats.luminanceMatrix) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = stats.width / rect.width;
    const scaleY = stats.height / rect.height;

    const currentX = Math.min(stats.width - 1, Math.max(0, Math.floor((e.clientX - rect.left) * scaleX)));
    const currentY = Math.min(stats.height - 1, Math.max(0, Math.floor((e.clientY - rect.top) * scaleY)));

    // Update hover pixel
    const lumVal = stats.luminanceMatrix[currentY * stats.width + currentX];
    setHoverPixel({ x: currentX, y: currentY, lum: lumVal });

    // Update ROI selection if dragging
    if (isSelecting && startPos) {
      const width = currentX - startPos.x;
      const height = currentY - startPos.y;
      setRoi({
        x: startPos.x,
        y: startPos.y,
        width,
        height,
      });
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
    if (roi && (Math.abs(roi.width) <= 1 || Math.abs(roi.height) <= 1)) {
      setRoi(null); // Clear accidental micro-clicks
    }
  };

  const clearRoi = () => {
    setRoi(null);
  };

  // Select quick preset ROIs
  const setPresetRoi = (preset: 'center' | 'top-half' | 'bottom-half') => {
    if (!stats) return;
    const w = stats.width;
    const h = stats.height;
    if (preset === 'center') {
      setRoi({
        x: Math.floor(w * 0.25),
        y: Math.floor(h * 0.25),
        width: Math.floor(w * 0.5),
        height: Math.floor(h * 0.5),
      });
    } else if (preset === 'top-half') {
      setRoi({
        x: 0,
        y: 0,
        width: w,
        height: Math.floor(h * 0.5),
      });
    } else {
      setRoi({
        x: 0,
        y: Math.floor(h * 0.5),
        width: w,
        height: Math.floor(h * 0.5),
      });
    }
  };

  // Draw Interactive ROI Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageData || !stats) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = stats.width;
      canvas.height = stats.height;
      ctx.drawImage(img, 0, 0);

      // Draw ROI overlay if active
      if (roi && roi.width !== 0 && roi.height !== 0) {
        const normX = Math.min(roi.x, roi.x + roi.width);
        const normY = Math.min(roi.y, roi.y + roi.height);
        const normW = Math.abs(roi.width);
        const normH = Math.abs(roi.height);

        // Dim outer region
        ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
        // Top
        ctx.fillRect(0, 0, stats.width, normY);
        // Bottom
        ctx.fillRect(0, normY + normH, stats.width, stats.height - (normY + normH));
        // Left
        ctx.fillRect(0, normY, normX, normH);
        // Right
        ctx.fillRect(normX + normW, normY, stats.width - (normX + normW), normH);

        // Draw selection rectangle border
        ctx.strokeStyle = '#7C3AED';
        ctx.lineWidth = Math.max(1, Math.min(stats.width, stats.height) / 150);
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(normX, normY, normW, normH);

        // Solid inner highlight
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.strokeRect(normX, normY, normW, normH);
      }
    };
    img.src = imageData.grayscaleDataUrl;
  }, [imageData, stats, roi]);

  if (!imageData || !stats) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center bg-white">
        <ScanEye className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-700">No Image Loaded</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          Please upload an image from the Overview dashboard or select a sample image to perform detailed luminance analysis and region-based integration.
        </p>
      </div>
    );
  }

  const activeStats = regionStats || stats;
  const isRegionActive = !!regionStats;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header Info Banner */}
      <div className="rounded-2xl bg-white border border-scientific-border p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-scientific-blueLight text-scientific-primary border border-blue-200">
              Module 01
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Pixel Luminance & ROI Sub-Integration
            </span>
          </div>
          <h2 className="text-xl font-bold text-scientific-text mt-1">
            Spatial Luminance Partitioning & Region Analysis
          </h2>
          <p className="text-xs text-scientific-subtext mt-0.5">
            Drag directly on the grayscale image below to define a custom Region of Interest (ROI) sub-domain{' '}
            <span className="font-mono text-purple-700 font-semibold">D_sub ⊂ D</span>.
          </p>
        </div>

        {/* View Mode Toggles */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'side-by-side'
                  ? 'bg-white text-scientific-primary shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setViewMode('grayscale-only')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'grayscale-only'
                  ? 'bg-white text-scientific-primary shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Grayscale ROI
            </button>
            <button
              onClick={() => setViewMode('original-only')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'original-only'
                  ? 'bg-white text-scientific-primary shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Original RGB
            </button>
          </div>
        </div>
      </div>

      {/* Main Image Inspector & Canvas Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Inspection Card */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-scientific-border p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Crop className="w-4 h-4 text-scientific-violet" />
              <span className="text-sm font-bold text-scientific-text">
                Interactive Canvas (Drag to Select Region)
              </span>
            </div>

            {/* Selection Status & Presets */}
            <div className="flex items-center gap-2">
              {isRegionActive ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-purple-600" />
                    ROI: {regionStats.roi.width} × {regionStats.roi.height} px
                  </span>
                  <button
                    onClick={clearRoi}
                    className="text-xs text-slate-500 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Clear ROI
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span>Presets:</span>
                  <button
                    onClick={() => setPresetRoi('center')}
                    className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                  >
                    Center 50%
                  </button>
                  <button
                    onClick={() => setPresetRoi('top-half')}
                    className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                  >
                    Top Half
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Canvas Display View */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Original RGB */}
            {(viewMode === 'side-by-side' || viewMode === 'original-only') && (
              <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50">
                <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                  <span>Input Image (Color RGB)</span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {stats.width} × {stats.height} px
                  </span>
                </div>
                <div className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
                  <img
                    src={imageData.originalDataUrl}
                    alt="Original"
                    className="max-h-full max-w-full object-contain"
                    style={{ imageRendering: stats.width <= 16 ? 'pixelated' : 'auto' }}
                  />
                </div>
              </div>
            )}

            {/* Right: Interactive Grayscale ROI Canvas */}
            {(viewMode === 'side-by-side' || viewMode === 'grayscale-only') && (
              <div className={`border border-purple-200 rounded-2xl p-3 bg-purple-50/20 ${viewMode === 'grayscale-only' ? 'md:col-span-2' : ''}`}>
                <div className="text-xs font-semibold text-purple-900 mb-2 flex items-center justify-between">
                  <span>Grayscale Luminance Field (B)</span>
                  <span className="text-[10px] font-mono text-purple-700 font-semibold">
                    Interactive ROI Selection
                  </span>
                </div>
                <div
                  ref={containerRef}
                  className="relative aspect-square bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center cursor-crosshair border border-purple-300 select-none"
                >
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => {
                      setIsSelecting(false);
                      setHoverPixel(null);
                    }}
                    className="max-h-full max-w-full object-contain"
                    style={{
                      imageRendering: stats.width <= 20 ? 'pixelated' : 'auto',
                    }}
                  />

                  {/* Pixel Inspector Float Pill */}
                  {hoverPixel && (
                    <div className="absolute bottom-2 left-2 bg-slate-900/90 text-white backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-[11px] font-mono pointer-events-none shadow-lg">
                      <span className="text-slate-400">Pos:</span> ({hoverPixel.x}, {hoverPixel.y}){' '}
                      <span className="text-purple-300 ml-2">Luminance:</span> {hoverPixel.lum.toFixed(1)} / 255
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Live Hover Pixel Readout Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-scientific-primary" />
              <span className="font-semibold text-slate-700">Real-Time Pixel Probe:</span>
              {hoverPixel ? (
                <span className="font-mono text-scientific-text">
                  (x={hoverPixel.x}, y={hoverPixel.y}) → Luminance ={' '}
                  <strong className="text-scientific-violet">{hoverPixel.lum.toFixed(2)}</strong>
                </span>
              ) : (
                <span className="text-slate-400 italic">
                  Hover over the grayscale image to inspect individual pixel intensity
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Conventions: 0 = Pure Black, 255 = Pure White
            </div>
          </div>
        </div>

        {/* Real-Time Integration Statistics Comparison Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl border border-scientific-border p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-scientific-text text-base flex items-center gap-2">
                <Sigma className="w-5 h-5 text-scientific-violet" />
                <span>Integration Results</span>
              </h3>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  isRegionActive
                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                    : 'bg-blue-100 text-blue-800 border-blue-300'
                }`}
              >
                {isRegionActive ? 'Selected ROI Sub-domain' : 'Full Image Domain'}
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                  Domain Dimensions
                </span>
                <span className="text-xl font-bold font-mono text-scientific-text">
                  {isRegionActive ? `${regionStats.roi.width} × ${regionStats.roi.height}` : `${stats.width} × ${stats.height}`}
                </span>
                <span className="text-xs text-slate-500 block mt-0.5">
                  Pixel Count (N):{' '}
                  <strong className="text-slate-800 font-mono">
                    {('pixelCount' in activeStats ? activeStats.pixelCount : activeStats.totalPixels).toLocaleString()}
                  </strong>
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200">
                <span className="text-xs font-semibold text-purple-900 uppercase tracking-wider block">
                  Total Brightness Integral (T)
                </span>
                <span className="text-2xl font-bold font-mono text-scientific-violet">
                  {activeStats.totalBrightness.toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })}
                </span>
                <span className="text-xs text-purple-700 block mt-0.5 font-mono">
                  T = ∬_{isRegionActive ? 'ROI' : 'D'} B(x,y) dA ≈ Σ Σ B(i,j)
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200">
                <span className="text-xs font-semibold text-blue-900 uppercase tracking-wider block">
                  Average Brightness (B̄)
                </span>
                <span className="text-2xl font-bold font-mono text-scientific-primary">
                  {activeStats.averageBrightness.toFixed(2)}
                  <span className="text-xs text-slate-500 font-normal ml-1">/ 255</span>
                </span>
                <span className="text-xs text-blue-700 block mt-0.5">
                  Normalized:{' '}
                  <strong className="font-mono">{activeStats.normalizedAverage.toFixed(2)}%</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Min Intensity</span>
                  <span className="font-bold font-mono text-slate-800 text-sm">
                    {activeStats.minBrightness.toFixed(1)}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Max Intensity</span>
                  <span className="font-bold font-mono text-slate-800 text-sm">
                    {activeStats.maxBrightness.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {isRegionActive && (
              <div className="pt-2">
                <button
                  onClick={clearRoi}
                  className="w-full py-2 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset to Full Image Domain</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mathematical Formulation Explanations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormulaCard
          title="ITU-R BT.601 Luminance Conversion"
          formula="Gray(i, j) = 0.299·R(i, j) + 0.587·G(i, j) + 0.114·B(i, j)"
          description="Human photopic vision is unequally sensitive to different wavelengths: green cones contribute nearly 59% of perceived brightness, red cones contribute 30%, and blue cones contribute only 11%."
          variables={[
            { symbol: 'R, G, B', meaning: '8-bit RGB color channels in range [0, 255]' },
            { symbol: 'Gray', meaning: 'True floating-point luminance intensity' },
            { symbol: '0.299', meaning: 'Red spectral weighting coefficient' },
            { symbol: '0.587', meaning: 'Green spectral weighting coefficient' },
          ]}
          highlight
        />

        <FormulaCard
          title="Subregion (ROI) Double Integration"
          formula="T_ROI = ∬_{D_{ROI}} B(x,y) dA ≈ Σ_{i=y_1}^{y_2} Σ_{j=x_1}^{x_2} B(i,j) · ΔA"
          description="By restricting the limits of integration to the coordinates [x1, x2] and [y1, y2], we isolate localized lighting features, contrast variations, and focal brightness."
          variables={[
            { symbol: 'D_ROI', meaning: 'Sub-rectangle bounded by [x1, x2] × [y1, y2]' },
            { symbol: 'ΔA', meaning: 'Area per pixel (normalized to 1 unit^2)' },
            { symbol: 'B̄_ROI', meaning: 'Local mean brightness = T_ROI / (Δx · Δy)' },
            { symbol: 'T_ROI', meaning: 'Accumulated local luminance flux' },
          ]}
        />
      </div>
    </div>
  );
};
