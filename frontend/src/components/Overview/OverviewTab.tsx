import React from 'react';
import {
  Image as ImageIcon,
  Sigma,
  Calculator,
  ArrowRight,
  Sparkles,
  BarChart3,
  Layers,
  History,
  Info,
  Maximize2,
  CheckCircle2
} from 'lucide-react';
import { ImageStats, ImageAnalysisSession, ActiveTab } from '../../types';
import { StatCard } from '../common/StatCard';
import { ImageDropzone } from '../common/ImageDropzone';
import { ProcessedImageData } from '../../utils/imageProcessor';

interface OverviewTabProps {
  imageData: ProcessedImageData | null;
  imageName: string;
  onImageProcessed: (data: ProcessedImageData, name: string) => void;
  onLoadSample: (type: 'benchmark' | 'gradient' | 'gaussian' | 'academic') => void;
  sessions: ImageAnalysisSession[];
  onSelectSession: (session: ImageAnalysisSession) => void;
  onNavigateTab: (tab: ActiveTab) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  imageData,
  imageName,
  onImageProcessed,
  onLoadSample,
  sessions,
  onSelectSession,
  onNavigateTab,
}) => {
  const stats = imageData?.stats;

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#172554] via-[#1E3A8A] to-[#2563EB] text-white p-6 sm:p-10 shadow-lg overflow-hidden">
        {/* Background decorative geometry */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center font-mono text-[120px] font-black select-none">
          ∬
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>College Linear Algebra & Calculus Honors Project</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            BrightInt — Calculating Total Image Brightness Using Integration
          </h2>

          <p className="mt-3 text-sm sm:text-base text-blue-100/90 leading-relaxed">
            Bridge the gap between pure mathematics and modern computer vision.
            Discover how every digital photograph is fundamentally a matrix{' '}
            <span className="font-mono font-semibold text-blue-200">A = [aᵢⱼ]</span>,
            how pixel intensities represent sampled surface elevations{' '}
            <span className="font-mono font-semibold text-blue-200">B(x, y)</span>, and
            how discrete double summation evaluates the continuous double integral{' '}
            <span className="font-mono font-semibold text-purple-200">∬_D B(x, y) dA</span>.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('integration')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-scientific-primary font-bold text-xs sm:text-sm shadow-md hover:bg-blue-50 transition-colors"
            >
              <Sigma className="w-4 h-4 text-scientific-violet" />
              <span>Explore Integration Lab</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateTab('linear-algebra')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-900/60 text-blue-100 border border-blue-400/30 font-medium text-xs sm:text-sm hover:bg-blue-900/90 transition-colors"
            >
              <span>Matrix Theory & Viva Guide</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Upload / Dropzone */}
      <section className="bg-transparent">
        <ImageDropzone
          onImageProcessed={onImageProcessed}
          onLoadSample={onLoadSample}
        />
      </section>

      {/* Calculated Metrics Grid */}
      {stats && stats.totalPixels > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-bold text-scientific-text flex items-center gap-2">
              <Calculator className="w-4 h-4 text-scientific-primary" />
              <span>Real-Time Numerical Integration Metrics</span>
            </h3>
            <span className="text-xs font-mono text-slate-500">
              IEEE-754 Precision
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Image Resolution"
              value={`${stats.width} × ${stats.height}`}
              subValue={`${stats.totalPixels.toLocaleString()} total unit pixels`}
              unit="px"
              icon={Maximize2}
              variant="blue"
              formula="Dimensions: m × n"
            />
            <StatCard
              label="Total Brightness (T)"
              value={stats.totalBrightness.toLocaleString(undefined, {
                maximumFractionDigits: 1,
              })}
              subValue="Discrete double sum of float luminance"
              unit="lum"
              icon={Sigma}
              variant="violet"
              formula="T = Σ Σ B(i,j) · ΔA"
            />
            <StatCard
              label="Average Brightness"
              value={stats.averageBrightness.toFixed(2)}
              subValue={`Range: [${stats.minBrightness.toFixed(1)} – ${stats.maxBrightness.toFixed(1)}]`}
              unit="/ 255"
              icon={Calculator}
              variant="green"
              formula="B̄ = T / (m · n)"
            />
            <StatCard
              label="Normalized Intensity"
              value={`${stats.normalizedAverage.toFixed(2)}%`}
              subValue="Scale: 0% (pitch black) to 100% (pure white)"
              unit="%"
              icon={BarChart3}
              variant="amber"
              formula="(B̄ / 255) × 100%"
            />
          </div>
        </section>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center bg-white/60">
          <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h4 className="font-semibold text-slate-700 text-sm">No Image Loaded Yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Upload an image above or click on one of the academic test patterns to calculate real numerical brightness metrics.
          </p>
        </div>
      )}

      {/* Image Preview & Compact Histogram Grid */}
      {imageData && stats && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Grayscale & Original Preview Card */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-scientific-border p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-scientific-text text-sm sm:text-base flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-scientific-primary" />
                  <span>Image Luminance Conversion Preview</span>
                </h4>
                <p className="text-xs text-scientific-subtext">
                  File: <span className="font-mono text-slate-700">{imageName}</span>
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('analyzer')}
                className="text-xs font-semibold text-scientific-primary hover:text-scientific-primaryHover flex items-center gap-1"
              >
                <span>Inspect in Analyzer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Original Preview */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
                  <span>Original RGB Image</span>
                  <span className="text-[10px] text-slate-500">Color Input</span>
                </div>
                <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200/80">
                  <img
                    src={imageData.originalDataUrl}
                    alt="Original"
                    className="max-h-full max-w-full object-contain"
                    style={{ imageRendering: stats.width <= 16 ? 'pixelated' : 'auto' }}
                  />
                </div>
              </div>

              {/* Grayscale Luminance Preview */}
              <div className="border border-purple-100 rounded-xl p-3 bg-purple-50/30">
                <div className="text-xs font-semibold text-purple-900 mb-2 flex items-center justify-between">
                  <span>Grayscale Luminance Field</span>
                  <span className="text-[10px] font-mono text-purple-600 font-semibold">ITU-R BT.601</span>
                </div>
                <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border border-purple-200/80">
                  <img
                    src={imageData.grayscaleDataUrl}
                    alt="Grayscale"
                    className="max-h-full max-w-full object-contain"
                    style={{ imageRendering: stats.width <= 16 ? 'pixelated' : 'auto' }}
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-blue-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-scientific-primary flex-shrink-0 mt-0.5" />
              <span>
                <strong>Luminance Formula:</strong>{' '}
                <span className="font-mono">Gray(i, j) = 0.299R + 0.587G + 0.114B</span>.
                Notice human photopic vision gives highest weight to green photons (58.7%).
              </span>
            </div>
          </div>

          {/* Compact Brightness Histogram */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-scientific-border p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-scientific-text text-sm sm:text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-scientific-violet" />
                  <span>Brightness Intensity Distribution</span>
                </h4>
                <p className="text-xs text-scientific-subtext">
                  256 Intensity Bins [0..255]
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('visualizations')}
                className="text-xs font-semibold text-scientific-violet hover:underline flex items-center gap-1"
              >
                <span>3D & Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Compact Canvas Histogram */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <MiniHistogramCanvas histogram={stats.histogram} />
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-2 px-1">
                <span>0 (Black)</span>
                <span>64</span>
                <span>128 (Midtone)</span>
                <span>192</span>
                <span>255 (White)</span>
              </div>
            </div>

            {/* Histogram Key Statistics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 text-[11px] block">Minimum Luminance</span>
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {stats.minBrightness.toFixed(1)} / 255
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-500 text-[11px] block">Maximum Luminance</span>
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {stats.maxBrightness.toFixed(1)} / 255
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Session History & Fast Lab Shortcut */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Session Images */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-scientific-border p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-scientific-text text-sm sm:text-base flex items-center gap-2">
              <History className="w-4 h-4 text-scientific-primary" />
              <span>Current Session History</span>
            </h4>
            <span className="text-xs text-slate-400">
              {sessions.length} analyzed image{sessions.length === 1 ? '' : 's'}
            </span>
          </div>

          {sessions.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 text-center">
              No recent images. Upload or load samples to track your test cases.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  onClick={() => onSelectSession(sess)}
                  className="cursor-pointer border border-slate-200 hover:border-scientific-primary/80 rounded-xl p-3 bg-slate-50/50 hover:bg-blue-50/40 transition-all flex items-center gap-3 group"
                >
                  <img
                    src={sess.thumbnailUrl}
                    alt={sess.name}
                    className="w-12 h-12 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-scientific-primary">
                      {sess.name}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500">
                      {sess.stats.width}×{sess.stats.height} px
                    </p>
                    <p className="text-[10px] font-mono text-scientific-violet font-medium">
                      Avg: {sess.stats.averageBrightness.toFixed(1)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Integration Lab Callout Card */}
        <div className="lg:col-span-4 rounded-2xl bg-gradient-to-br from-scientific-violetLight to-scientific-blueLight border border-purple-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-xl bg-scientific-violet text-white flex items-center justify-center mb-3 shadow-md shadow-purple-500/30">
              <Sigma className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-scientific-text text-base">
              The Double Integral Model
            </h4>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Step into the formal calculus laboratory. Examine how Riemann double sums partition an image grid, study row-by-row accumulation, and test your understanding with an interactive 3×3 matrix viva benchmark.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('integration')}
            className="mt-4 w-full py-2.5 px-4 rounded-xl bg-scientific-violet hover:bg-purple-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <span>Open Integration Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
};

/**
 * Mini 256-bin Canvas Histogram Component
 */
const MiniHistogramCanvas: React.FC<{ histogram: number[] }> = ({ histogram }) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const maxCount = Math.max(...histogram, 1);
    const barWidth = width / 256;

    // Draw background grid lines
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height * 0.25);
    ctx.lineTo(width, height * 0.25);
    ctx.moveTo(0, height * 0.5);
    ctx.lineTo(width, height * 0.5);
    ctx.moveTo(0, height * 0.75);
    ctx.lineTo(width, height * 0.75);
    ctx.stroke();

    // Draw bars with subtle gradient
    for (let i = 0; i < 256; i++) {
      const count = histogram[i];
      const barH = (count / maxCount) * (height - 6);
      const x = i * barWidth;
      const y = height - barH;

      // Color tint from indigo to bright blue
      const t = i / 255;
      const r = Math.round(37 + t * (124 - 37));
      const g = Math.round(99 + t * (58 - 99));
      const b = Math.round(235 + t * (237 - 235));

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x, y, Math.max(1, barWidth), barH);
    }
  }, [histogram]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={140}
      className="w-full h-32 rounded-lg"
    />
  );
};
