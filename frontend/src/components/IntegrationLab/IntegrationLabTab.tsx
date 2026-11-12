import React, { useState } from 'react';
import {
  Sigma,
  BookOpen,
  ArrowRight,
  Calculator,
  CheckCircle2,
  RefreshCw,
  Lightbulb,
  Table2,
  Sparkles,
  Layers,
  HelpCircle
} from 'lucide-react';
import { computeMatrixStats } from '../../utils/mathEngine';
import { FormulaCard } from '../common/FormulaCard';
import { StatCard } from '../common/StatCard';

export const IntegrationLabTab: React.FC = () => {
  // Interactive 3x3 matrix state, initialized with the exact benchmark matrix
  const [matrix, setMatrix] = useState<number[][]>([
    [10, 20, 30],
    [40, 50, 60],
    [70, 80, 90],
  ]);

  const [activeStep, setActiveStep] = useState<number>(1);

  // Compute stats on the current matrix
  const stats = computeMatrixStats(matrix);

  // Calculate row sums
  const rowSums = matrix.map((row) => row.reduce((acc, val) => acc + val, 0));

  const handleCellChange = (r: number, c: number, valueStr: string) => {
    const val = Math.max(0, Math.min(255, parseFloat(valueStr) || 0));
    const newMatrix = matrix.map((row, rIdx) =>
      row.map((cell, cIdx) => (rIdx === r && cIdx === c ? val : cell))
    );
    setMatrix(newMatrix);
  };

  const resetToBenchmark = () => {
    setMatrix([
      [10, 20, 30],
      [40, 50, 60],
      [70, 80, 90],
    ]);
  };

  const setAllWhite = () => {
    setMatrix([
      [255, 255, 255],
      [255, 255, 255],
      [255, 255, 255],
    ]);
  };

  const setAllBlack = () => {
    setMatrix([
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]);
  };

  const steps = [
    {
      num: 1,
      title: 'Matrix Pixel Sampling',
      math: 'A = [a_{ij}] \\in \\mathbb{R}^{m \\times n}',
      desc: 'The spatial optical image is digitized by sampling onto an m × n sensor array. Each pixel is an individual matrix entry indexed by row i and column j.',
    },
    {
      num: 2,
      title: 'Luminance Calculation',
      math: 'B(i, j) = 0.299R + 0.587G + 0.114B',
      desc: 'Multichannel RGB color vectors are projected to scalar photometric luminance using the ITU-R BT.601 standard photopic curve.',
    },
    {
      num: 3,
      title: 'Domain Partitioning',
      math: 'D = \\bigcup_{i=1}^m \\bigcup_{j=1}^n \\Delta A_{ij}, \\quad \\Delta A = 1',
      desc: 'The continuous 2D domain D = [0, W] × [0, H] is partitioned into m × n disjoint rectangular sub-elements, each representing unit pixel area ΔA = 1.',
    },
    {
      num: 4,
      title: 'Row-Wise Accumulation',
      math: 'R_i = \\sum_{j=1}^n B(i, j)',
      desc: 'Inner summation evaluates the discrete line integral across each horizontal row i, producing row luminance profiles.',
    },
    {
      num: 5,
      title: 'Double Numerical Integral',
      math: 'T = \\sum_{i=1}^m R_i = \\sum_{i=1}^m \\sum_{j=1}^n B(i, j)',
      desc: 'Outer summation aggregates all row sums into the global discrete Riemann double sum, approximating ∬_D B(x,y) dA.',
    },
    {
      num: 6,
      title: 'Mean Value of the Integral',
      math: '\\bar{B} = \\frac{1}{|D|} \\iint_D B(x,y) dA \\approx \\frac{T}{m \\times n}',
      desc: 'Applying the Mean Value Theorem for multiple integrals yields the average brightness across the entire image area.',
    },
    {
      num: 7,
      title: 'Physical & Perceptual Interpretation',
      math: 'B_{norm} = \\left(\\frac{\\bar{B}}{255}\\right) \\times 100\\%',
      desc: 'The normalized percentage maps the energy from 0% (total absorption / darkness) to 100% (maximum photometric emission / white).',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white border border-scientific-border p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-scientific-violetLight text-scientific-violet border border-purple-200 text-xs font-semibold mb-3">
            <Sigma className="w-4 h-4" />
            <span>Mathematical Foundations & Theory</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-scientific-text tracking-tight">
            Double Integration vs Discrete Riemann Matrix Summation
          </h2>
          <p className="mt-2 text-sm sm:text-base text-scientific-subtext leading-relaxed">
            In physical optics, brightness is a continuous surface{' '}
            <span className="font-mono text-scientific-primary font-semibold">B(x, y)</span> over a continuous domain{' '}
            <span className="font-mono text-scientific-primary font-semibold">D</span>.
            In digital image processing, cameras discretize this field into an{' '}
            <span className="font-mono text-scientific-violet font-semibold">m × n</span> matrix.
            Discover how discrete summation converges to the continuous double integral.
          </p>
        </div>
      </div>

      {/* Formal Double Integration Model Formulation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormulaCard
          title="Continuous Surface Integral Formulation"
          formula="T = \iint_D B(x, y) \, dA"
          description="Represents the exact total luminous flux passing through continuous region D. In multivariable calculus, this is evaluated as an iterated integral."
          variables={[
            { symbol: 'D', meaning: 'The spatial bounding rectangle [0, W] × [0, H]' },
            { symbol: 'B(x,y)', meaning: 'Continuous brightness height field at coordinate (x,y)' },
            { symbol: 'dA', meaning: 'Differential area element dx · dy' },
            { symbol: 'T', meaning: 'Total radiant energy / brightness volume under surface' },
          ]}
          highlight
        />

        <FormulaCard
          title="Discrete Pixel Approximation (Riemann Double Sum)"
          formula="T \approx \sum_{i=1}^m \sum_{j=1}^n B(i, j) \cdot \Delta A \quad (\text{with } \Delta A = 1)"
          description="Because digital pixels are finite squares with unit area ΔA = 1, the continuous double integral simplifies exactly to the double sum of all matrix entries."
          variables={[
            { symbol: 'm', meaning: 'Number of vertical rows (image height)' },
            { symbol: 'n', meaning: 'Number of horizontal columns (image width)' },
            { symbol: 'B(i,j)', meaning: 'Grayscale luminance entry at row i and column j' },
            { symbol: 'ΔA = 1', meaning: 'Standard convention: unit area per discrete pixel' },
          ]}
          discreteVsContinuous={{
            continuous: '∬_D B(x,y) dA',
            discrete: 'Σ_{i=1}^m Σ_{j=1}^n B(i,j) · 1',
            note: 'As pixel count N → ∞ (infinite resolution), the discrete sum converges to the continuous integral.',
          }}
        />
      </div>

      {/* Interactive Worked Example: The Benchmark 3x3 Matrix */}
      <section className="bg-white rounded-3xl border border-scientific-border p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-scientific-violet uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Interactive Viva Benchmark Matrix</span>
            </div>
            <h3 className="text-xl font-bold text-scientific-text mt-1">
              Worked Verification Matrix A ∈ ℝ³ˣ³
            </h3>
            <p className="text-xs text-scientific-subtext">
              Modify matrix entries to observe real-time row summations, integral aggregation, and average luminance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetToBenchmark}
              className="px-3 py-1.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Benchmark (T=450)</span>
            </button>
            <button
              onClick={setAllWhite}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium"
            >
              All White (255)
            </button>
            <button
              onClick={setAllBlack}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium"
            >
              All Black (0)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* 3x3 Matrix Input Grid with Visual Grayscale Cells */}
          <div className="lg:col-span-6 space-y-4">
            <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Interactive Matrix Editor [aᵢⱼ]</span>
              <span className="text-slate-400 font-mono text-[11px]">Inputs [0 .. 255]</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-inner">
              <div className="grid grid-cols-4 gap-3 items-center">
                {/* Column Headers */}
                <div className="text-[11px] font-mono font-bold text-slate-400 text-center">Row / Col</div>
                <div className="text-[11px] font-mono font-bold text-slate-600 text-center">j = 1</div>
                <div className="text-[11px] font-mono font-bold text-slate-600 text-center">j = 2</div>
                <div className="text-[11px] font-mono font-bold text-slate-600 text-center">j = 3</div>

                {/* Rows with row sum indicator */}
                {matrix.map((row, r) => (
                  <React.Fragment key={r}>
                    <div className="text-[11px] font-mono font-bold text-slate-600 text-center">
                      i = {r + 1}
                    </div>
                    {row.map((val, c) => {
                      // Calculate grayscale background color
                      const normVal = val / 255;
                      const textColor = normVal > 0.5 ? '#000000' : '#FFFFFF';
                      const cellBg = `rgb(${val}, ${val}, ${val})`;

                      return (
                        <div key={c} className="relative group">
                          <input
                            type="number"
                            min="0"
                            max="255"
                            value={val}
                            onChange={(e) => handleCellChange(r, c, e.target.value)}
                            className="w-full text-center font-mono font-bold text-base py-3 rounded-xl border-2 border-slate-300 focus:border-scientific-violet focus:outline-none transition-all shadow-xs"
                            style={{
                              backgroundColor: cellBg,
                              color: textColor,
                              textShadow: normVal > 0.5 ? 'none' : '0 1px 2px rgba(0,0,0,0.8)',
                            }}
                          />
                          <span className="absolute -top-1.5 -right-1 text-[9px] font-mono px-1 rounded bg-slate-800 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            a_{r+1}{c+1}
                          </span>
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>

              {/* Row Accumulation Details */}
              <div className="mt-4 pt-3 border-t border-slate-200 space-y-1.5 text-xs font-mono">
                {rowSums.map((sum, r) => (
                  <div key={r} className="flex items-center justify-between text-slate-600">
                    <span>{`Row ${r + 1} Line Sum (R_${r + 1} = Σ a_${r + 1},${'j'}):`}</span>
                    <strong className="text-scientific-primary font-bold">{sum}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mathematical Summation Calculation Walkthrough */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-scientific-violetLight/40 rounded-2xl border border-purple-200 p-5 space-y-4">
              <h4 className="font-bold text-scientific-text text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4 text-scientific-violet" />
                <span>Step-by-Step Numerical Integration</span>
              </h4>

              <div className="space-y-3 text-xs">
                {/* Step 1: Discrete Sum */}
                <div className="p-3 bg-white rounded-xl border border-purple-100 shadow-xs">
                  <div className="font-semibold text-purple-900 mb-1">
                    1. Double Summation (Total Integral T)
                  </div>
                  <div className="font-mono text-slate-700">
                    T = R₁ + R₂ + R₃ = {rowSums[0]} + {rowSums[1]} + {rowSums[2]} ={' '}
                    <span className="text-scientific-violet font-bold text-base">
                      {stats.totalBrightness}
                    </span>
                  </div>
                </div>

                {/* Step 2: Average Brightness */}
                <div className="p-3 bg-white rounded-xl border border-purple-100 shadow-xs">
                  <div className="font-semibold text-purple-900 mb-1">
                    2. Average Intensity B̄ (Mean Value Theorem)
                  </div>
                  <div className="font-mono text-slate-700">
                    B̄ = T / (m × n) = {stats.totalBrightness} / 9 ={' '}
                    <span className="text-scientific-primary font-bold text-base">
                      {stats.averageBrightness.toFixed(2)}
                    </span>{' '}
                    / 255
                  </div>
                </div>

                {/* Step 3: Normalized % */}
                <div className="p-3 bg-white rounded-xl border border-purple-100 shadow-xs">
                  <div className="font-semibold text-purple-900 mb-1">
                    3. Normalized Brightness Percentage
                  </div>
                  <div className="font-mono text-slate-700">
                    B_norm = (B̄ / 255) × 100% = ({stats.averageBrightness.toFixed(2)} / 255) × 100% ={' '}
                    <span className="text-emerald-700 font-bold text-base">
                      {stats.normalizedAverage.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Verified specification badge */}
                <div className="flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    Specification Match: When A = [[10,20,30],[40,50,60],[70,80,90]], Pixel Count = 9, Total = 450, Average = 50.00, Normalized ≈ 19.61%.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7-Step Educational Pipeline Walkthrough */}
      <section className="bg-white rounded-3xl border border-scientific-border p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-scientific-primary uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Curriculum Pipeline</span>
          </div>
          <h3 className="text-xl font-bold text-scientific-text mt-1">
            The 7-Stage Digital Image Integration Process
          </h3>
          <p className="text-xs text-scientific-subtext">
            From optical photons to numerical double integrals — click each stage to explore its calculus formulation.
          </p>
        </div>

        {/* Step Indicator Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {steps.map((s) => (
            <button
              key={s.num}
              onClick={() => setActiveStep(s.num)}
              className={`p-3 rounded-2xl border text-left transition-all ${
                activeStep === s.num
                  ? 'border-scientific-primary bg-blue-50/80 shadow-xs'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                    activeStep === s.num
                      ? 'bg-scientific-primary text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  0{s.num}
                </span>
                {activeStep === s.num && (
                  <div className="w-2 h-2 rounded-full bg-scientific-primary" />
                )}
              </div>
              <div className="text-xs font-bold text-slate-800 truncate">
                {s.title}
              </div>
            </button>
          ))}
        </div>

        {/* Active Step Detailed Explanation Box */}
        {(() => {
          const current = steps.find((s) => s.num === activeStep) || steps[0];
          return (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-scientific-primary uppercase tracking-wider">
                  Stage {current.num} of 7: {current.title}
                </span>
                <span className="text-xs font-mono text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 font-semibold">
                  {current.math}
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed font-sans">
                {current.desc}
              </p>
            </div>
          );
        })()}
      </section>
    </div>
  );
};
