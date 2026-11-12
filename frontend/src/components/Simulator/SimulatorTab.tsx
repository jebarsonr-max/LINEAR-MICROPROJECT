import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  SlidersHorizontal,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Info,
  Maximize2,
  Sparkles,
  BarChart3,
  Layers,
  Check
} from 'lucide-react';
import { ProcessedImageData, createDataUrlFromLuminance } from '../../utils/imageProcessor';
import { simulateTransformation, clamp } from '../../utils/mathEngine';
import { SimulationParams } from '../../types';
import { StatCard } from '../common/StatCard';
import { FormulaCard } from '../common/FormulaCard';

interface SimulatorTabProps {
  imageData: ProcessedImageData | null;
  imageName: string;
}

export const SimulatorTab: React.FC<SimulatorTabProps> = ({
  imageData,
  imageName,
}) => {
  const [params, setParams] = useState<SimulationParams>({
    brightnessOffset: 0,
    contrast: 1.0,
  });

  const stats = imageData?.stats;

  // Run simulation engine
  const simResult = useMemo(() => {
    if (!stats || !stats.luminanceMatrix) return null;
    return simulateTransformation(stats, params);
  }, [stats, params]);

  // Generate transformed DataURL
  const transformedDataUrl = useMemo(() => {
    if (!simResult || !stats) return null;
    return createDataUrlFromLuminance(
      simResult.stats.luminanceMatrix!,
      stats.width,
      stats.height
    );
  }, [simResult, stats]);

  const resetParams = () => {
    setParams({ brightnessOffset: 0, contrast: 1.0 });
  };

  const applyPreset = (preset: 'brighten' | 'darken' | 'high-contrast' | 'low-contrast') => {
    if (preset === 'brighten') setParams({ brightnessOffset: 45, contrast: 1.1 });
    else if (preset === 'darken') setParams({ brightnessOffset: -45, contrast: 1.0 });
    else if (preset === 'high-contrast') setParams({ brightnessOffset: 0, contrast: 1.8 });
    else setParams({ brightnessOffset: 0, contrast: 0.5 });
  };

  if (!imageData || !stats) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center bg-white max-w-7xl mx-auto">
        <SlidersHorizontal className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-700">No Image Loaded</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
          Upload an image on the Overview dashboard to run the What-If simulation and observe calculus integral responses.
        </p>
      </div>
    );
  }

  const isChanged = params.brightnessOffset !== 0 || params.contrast !== 1.0;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header Info */}
      <div className="rounded-2xl bg-white border border-scientific-border p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-scientific-violetLight text-scientific-violet border border-purple-200">
              What-If Simulation Lab
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Transfer Function & Integral Derivative Response
            </span>
          </div>
          <h2 className="text-xl font-bold text-scientific-text mt-1">
            Dynamic Brightness & Contrast Transformation
          </h2>
          <p className="text-xs text-scientific-subtext mt-0.5">
            Test how point transformations alter the discrete double integral{' '}
            <span className="font-mono text-purple-700 font-semibold">T_new = Σ Σ I_new(i,j)</span>.
          </p>
        </div>

        {isChanged && (
          <button
            onClick={resetParams}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset to Original (0, 1.0)</span>
          </button>
        )}
      </div>

      {/* Sliders and Presets Control Panel */}
      <div className="bg-white rounded-3xl border border-scientific-border p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-scientific-text flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-scientific-primary" />
            <span>Transformation Transfer Function Parameters</span>
          </h3>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Presets:</span>
            <button
              onClick={() => applyPreset('brighten')}
              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
            >
              +45 Boost
            </button>
            <button
              onClick={() => applyPreset('darken')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium"
            >
              -45 Dim
            </button>
            <button
              onClick={() => applyPreset('high-contrast')}
              className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 font-medium"
            >
              High Contrast (1.8x)
            </button>
            <button
              onClick={() => applyPreset('low-contrast')}
              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium"
            >
              Low Contrast (0.5x)
            </button>
          </div>
        </div>

        {/* Dual Interactive Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Brightness Offset Slider */}
          <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Brightness Offset (Δb)
              </label>
              <span className="font-mono text-base font-extrabold text-scientific-primary">
                {params.brightnessOffset > 0 ? `+${params.brightnessOffset}` : params.brightnessOffset}
              </span>
            </div>
            <input
              type="range"
              min="-100"
              max="100"
              step="1"
              value={params.brightnessOffset}
              onChange={(e) =>
                setParams((prev) => ({
                  ...prev,
                  brightnessOffset: parseInt(e.target.value),
                }))
              }
              className="w-full accent-scientific-primary cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>-100 (Max Dim)</span>
              <span>0 (Unchanged)</span>
              <span>+100 (Max Bright)</span>
            </div>
          </div>

          {/* Contrast Multiplier Slider */}
          <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Contrast Multiplier (c)
              </label>
              <span className="font-mono text-base font-extrabold text-scientific-violet">
                {params.contrast.toFixed(2)}×
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="3.0"
              step="0.05"
              value={params.contrast}
              onChange={(e) =>
                setParams((prev) => ({
                  ...prev,
                  contrast: parseFloat(e.target.value),
                }))
              }
              className="w-full accent-scientific-violet cursor-pointer h-2 bg-slate-200 rounded-lg"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>0.0× (Flat Gray)</span>
              <span>1.0× (Linear)</span>
              <span>3.0× (High Dynamic)</span>
            </div>
          </div>
        </div>

        {/* Transfer Function Formula Box */}
        <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 text-xs font-mono text-purple-900 text-center">
          I_new = clamp( {params.contrast.toFixed(2)} · (I_orig - 127.5) + 127.5 + ({params.brightnessOffset}), 0, 255 )
        </div>
      </div>

      {/* Before vs After Visual Image Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Original */}
        <div className="bg-white rounded-3xl border border-scientific-border p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Original Grayscale Reference
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Avg: {stats.averageBrightness.toFixed(1)} / 255
            </span>
          </div>
          <div className="aspect-square bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-200">
            <img
              src={imageData.grayscaleDataUrl}
              alt="Original Grayscale"
              className="max-h-full max-w-full object-contain"
              style={{ imageRendering: stats.width <= 16 ? 'pixelated' : 'auto' }}
            />
          </div>
        </div>

        {/* Transformed */}
        <div className="bg-white rounded-3xl border border-purple-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-scientific-violet uppercase tracking-wider">
              Transformed Image Simulation
            </span>
            <span className="text-[11px] font-mono text-scientific-violet font-bold">
              Avg: {simResult ? simResult.stats.averageBrightness.toFixed(1) : 0} / 255
            </span>
          </div>
          <div className="aspect-square bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center border border-purple-300">
            {transformedDataUrl && (
              <img
                src={transformedDataUrl}
                alt="Transformed Simulation"
                className="max-h-full max-w-full object-contain"
                style={{ imageRendering: stats.width <= 16 ? 'pixelated' : 'auto' }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Calculus Delta Metric Cards */}
      {simResult && (
        <section className="space-y-4">
          <h3 className="text-base font-bold text-scientific-text flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-scientific-primary" />
            <span>Integral Variation & Delta Metrics</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Original Total (T_orig)"
              value={stats.totalBrightness.toLocaleString(undefined, {
                maximumFractionDigits: 1,
              })}
              subValue={`Avg: ${stats.averageBrightness.toFixed(1)}`}
              icon={Layers}
              variant="slate"
              formula="T_orig = Σ Σ I_orig(i, j)"
            />

            <StatCard
              label="Simulated Total (T_new)"
              value={simResult.stats.totalBrightness.toLocaleString(undefined, {
                maximumFractionDigits: 1,
              })}
              subValue={`Avg: ${simResult.stats.averageBrightness.toFixed(1)}`}
              icon={Sparkles}
              variant="violet"
              formula="T_new = Σ Σ I_new(i, j)"
            />

            <StatCard
              label="Absolute Change (ΔT)"
              value={
                (simResult.deltaTotal >= 0 ? '+' : '') +
                simResult.deltaTotal.toLocaleString(undefined, {
                  maximumFractionDigits: 1,
                })
              }
              subValue={`ΔAvg: ${(simResult.deltaAverage >= 0 ? '+' : '') + simResult.deltaAverage.toFixed(2)}`}
              icon={simResult.deltaTotal >= 0 ? TrendingUp : TrendingDown}
              variant={simResult.deltaTotal >= 0 ? 'green' : 'amber'}
              formula="ΔT = T_new - T_orig"
            />

            <StatCard
              label="Percentage Change (%Δ)"
              value={
                simResult.percentageChange !== null
                  ? (simResult.percentageChange >= 0 ? '+' : '') +
                    simResult.percentageChange.toFixed(2) +
                    '%'
                  : 'N/A'
              }
              subValue={
                simResult.percentageChange === null
                  ? 'Original total is zero (undefined)'
                  : 'Relative luminance shift'
              }
              icon={BarChart3}
              variant={simResult.deltaTotal >= 0 ? 'green' : 'amber'}
              formula="%Δ = (ΔT / T_orig) × 100%"
            />
          </div>
        </section>
      )}

      {/* Dual Overlay Histogram Comparison */}
      {simResult && (
        <div className="bg-white rounded-3xl border border-scientific-border p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-scientific-text text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-scientific-violet" />
              <span>Histogram Shift: Before (Blue) vs After (Violet)</span>
            </h4>
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-blue-700">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                Original
              </span>
              <span className="flex items-center gap-1.5 text-purple-700">
                <span className="w-3 h-3 rounded-full bg-purple-500 inline-block" />
                Transformed
              </span>
            </div>
          </div>

          <DualHistogramCanvas
            origHist={stats.histogram}
            newHist={simResult.stats.histogram}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Dual Histogram Canvas: Overlays Original and Transformed Distributions
 */
const DualHistogramCanvas: React.FC<{ origHist: number[]; newHist: number[] }> = ({
  origHist,
  newHist,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const maxCount = Math.max(...origHist, ...newHist, 1);
    const barWidth = w / 256;

    // Draw Original Histogram (Translucent Blue)
    ctx.fillStyle = 'rgba(37, 99, 235, 0.45)';
    for (let i = 0; i < 256; i++) {
      const bh = (origHist[i] / maxCount) * (h - 15);
      ctx.fillRect(i * barWidth, h - bh, Math.max(1, barWidth), bh);
    }

    // Draw Transformed Histogram (Translucent Purple)
    ctx.fillStyle = 'rgba(124, 58, 237, 0.55)';
    for (let i = 0; i < 256; i++) {
      const bh = (newHist[i] / maxCount) * (h - 15);
      ctx.fillRect(i * barWidth, h - bh, Math.max(1, barWidth), bh);
    }
  }, [origHist, newHist]);

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
      <canvas ref={canvasRef} width={768} height={200} className="w-full h-48 rounded-xl" />
      <div className="flex items-center justify-between text-xs font-mono text-slate-500 mt-2 px-1">
        <span>0 (Black)</span>
        <span>64</span>
        <span>128</span>
        <span>192</span>
        <span>255 (White)</span>
      </div>
    </div>
  );
};
