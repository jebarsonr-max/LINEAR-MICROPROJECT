import React, { useState } from 'react';
import {
  Grid3X3,
  BookOpen,
  HelpCircle,
  Calculator,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Table,
  Layers
} from 'lucide-react';
import { computeMatrixStats } from '../../utils/mathEngine';
import { FormulaCard } from '../common/FormulaCard';

export const LinearAlgebraTab: React.FC = () => {
  const [matrixSize, setMatrixSize] = useState<3 | 4 | 5>(3);

  // Editable matrix state
  const [matrix, setMatrix] = useState<number[][]>([
    [10, 20, 30],
    [40, 50, 60],
    [70, 80, 90],
  ]);

  // Scalar multiplier for matrix operations
  const [scalar, setScalar] = useState<number>(1.2);

  // Collapsible Viva Q&A state
  const [expandedViva, setExpandedViva] = useState<number | null>(0);

  const stats = computeMatrixStats(matrix);

  // Resize matrix
  const handleSizeChange = (newSize: 3 | 4 | 5) => {
    setMatrixSize(newSize);
    const newM: number[][] = [];
    for (let r = 0; r < newSize; r++) {
      const row: number[] = [];
      for (let c = 0; c < newSize; c++) {
        // Generate academic step pattern
        row.push(Math.round((((r * newSize + c + 1) * 255) / (newSize * newSize)) * 0.8));
      }
      newM.push(row);
    }
    setMatrix(newM);
  };

  const handleCellChange = (r: number, c: number, valStr: string) => {
    const val = Math.max(0, Math.min(255, parseFloat(valStr) || 0));
    const next = matrix.map((row, rIdx) =>
      row.map((cell, cIdx) => (rIdx === r && cIdx === c ? val : cell))
    );
    setMatrix(next);
  };

  const multiplyByScalar = () => {
    const next = matrix.map((row) =>
      row.map((val) => Math.min(255, Math.round(val * scalar)))
    );
    setMatrix(next);
  };

  const resetToIdentityPattern = () => {
    if (matrixSize === 3) {
      setMatrix([
        [10, 20, 30],
        [40, 50, 60],
        [70, 80, 90],
      ]);
    } else {
      handleSizeChange(matrixSize);
    }
  };

  // 8 College Viva Exam Questions with rigorous mathematical answers
  const vivaQuestions = [
    {
      q: '1. How is a digital image formally represented as a mathematical matrix?',
      a: 'A digital image of resolution m × n is modeled as a matrix A = [aᵢⱼ] ∈ ℝ^(m × n), where index i ∈ {1, ..., m} denotes the row (vertical coordinate y) and index j ∈ {1, ..., n} denotes the column (horizontal coordinate x). Each scalar entry aᵢⱼ corresponds to the sampled photometric luminance (or pixel brightness) at that spatial coordinate, typically quantized to 8 bits [0, 255].',
    },
    {
      q: '2. What is the fundamental connection between matrix summation and double integration?',
      a: 'The continuous luminous flux over a 2D spatial region D is defined by the double integral ∬_D B(x, y) dA. When an image is discretized into pixels with unit area ΔA = 1, this integral is approximated by the 2D Riemann double sum T ≈ Σᵢ Σⱼ B(i, j) · ΔA. In linear algebra terms, this equals the sum of all elements of matrix A (or 1^T · A · 1, where 1 is the vector of all ones). By the fundamental definition of Riemann integration, as the pixel resolution approaches infinity (ΔA → 0), the matrix sum converges to the continuous double integral.',
    },
    {
      q: '3. Why are ITU-R BT.601 coefficients (0.299, 0.587, 0.114) used instead of an unweighted arithmetic average of RGB channels?',
      a: 'Human visual perception is non-uniform across the electromagnetic spectrum. Under photopic (daylight) conditions, human eye cone cells have peak sensitivity in the green spectrum (~555 nm). The ITU-R BT.601 standard weights the RGB color vector [R, G, B]^T with the projection vector w = [0.299, 0.587, 0.114]^T to compute scalar perceived luminance: Gray = w · [R, G, B]^T. An unweighted arithmetic average (R+G+B)/3 would incorrectly overemphasize blue photons, to which the human eye is least sensitive.',
    },
    {
      q: '4. How do linear transformations on matrices relate to brightness adjustments?',
      a: 'Brightness shift corresponds to matrix addition: A_new = A + b · J, where J is an m × n matrix of ones (all elements shifted by scalar offset b), followed by a non-linear clamping operator to the interval [0, 255]. Contrast scaling corresponds to scalar multiplication: A_new = c · A. Combining both produces an affine transformation: A_new = clamp(c · (A - 127.5 · J) + 127.5 · J + b · J, 0, 255).',
    },
    {
      q: '5. In our 3×3 benchmark matrix [[10, 20, 30], [40, 50, 60], [70, 80, 90]], calculate the exact total and average brightness.',
      a: 'Summing row by row: Row 1 = 10 + 20 + 30 = 60. Row 2 = 40 + 50 + 60 = 150. Row 3 = 70 + 80 + 90 = 240. The total brightness integral T = 60 + 150 + 240 = 450. The average brightness B̄ = T / (m · n) = 450 / 9 = 50.00. The normalized intensity is (50 / 255) × 100% ≈ 19.61%.',
    },
    {
      q: '6. How does image resolution affect the discrete double integral calculation?',
      a: 'Image resolution dictates the matrix dimensions m and n. As resolution increases (e.g. from 100×100 to 1000×1000), the number of sampled points grows quadratically (N = m · n). If physical image dimensions remain constant, the pixel area ΔA = (W / n) · (H / m) shrinks. Under the unit-area convention (ΔA = 1), the discrete sum T scales proportionally to total pixel count N, while the average brightness B̄ = T / N remains invariant to sampling density.',
    },
    {
      q: '7. What mathematical precaution must be taken when computing percentage change in total brightness?',
      a: 'Percentage change is defined as %Δ = ((T_new - T_orig) / T_orig) × 100%. If an image is pitch black (all pixel entries are 0, so T_orig = 0), this produces a division by zero (indeterminate form 0/0 or division by zero). A mathematically sound implementation must detect T_orig = 0 and return an explicit undefined / not-applicable status instead of NaN or Infinity.',
    },
    {
      q: '8. What is the Mean Value Theorem for multiple integrals and how is it realized in this project?',
      a: 'The Mean Value Theorem for double integrals states that for a continuous function B(x, y) on a closed bounded region D, there exists a point (x₀, y₀) ∈ D such that ∬_D B(x, y) dA = B(x₀, y₀) · Area(D). In our digital implementation, the average brightness B̄ = (1 / |D|) ∬_D B(x, y) dA is approximated by B̄ = (1 / (m · n)) Σᵢ Σⱼ B(i, j). This represents the uniform height field having identical integral volume to the original image.',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-3xl bg-white border border-scientific-border p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-scientific-blueLight text-scientific-primary border border-blue-200 text-xs font-semibold mb-3">
            <Grid3X3 className="w-4 h-4" />
            <span>Linear Algebra & Matrix Operations</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-scientific-text tracking-tight">
            Digital Images as Real Matrices A = [aᵢⱼ]
          </h2>
          <p className="mt-2 text-sm sm:text-base text-scientific-subtext leading-relaxed">
            Every digital image is fundamentally a discrete real matrix. Understand how scalar multiplication, matrix addition, and trace operations govern computer vision and numerical integration.
          </p>
        </div>
      </div>

      {/* Interactive Matrix Workspace & Operations */}
      <section className="bg-white rounded-3xl border border-scientific-border p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-scientific-text flex items-center gap-2">
              <Table className="w-5 h-5 text-scientific-violet" />
              <span>Interactive Matrix Workbench: A ∈ ℝ^{matrixSize}×{matrixSize}</span>
            </h3>
            <p className="text-xs text-scientific-subtext">
              Directly edit pixel cells, apply linear algebra scalar operations, and track double summation metrics.
            </p>
          </div>

          {/* Matrix Dimension Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Dimensions:</span>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              {([3, 4, 5] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => handleSizeChange(sz)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    matrixSize === sz
                      ? 'bg-white text-scientific-primary shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sz} × {sz}
                </button>
              ))}
            </div>

            <button
              onClick={resetToIdentityPattern}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
              title="Reset matrix"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Editable Matrix Grid with Grayscale Visual Feedback */}
          <div className="lg:col-span-7 space-y-4">
            <div
              className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-inner"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${matrixSize}, minmax(0, 1fr))`,
                gap: '8px',
              }}
            >
              {matrix.map((row, r) =>
                row.map((val, c) => {
                  const norm = val / 255;
                  const textColor = norm > 0.5 ? '#0F172A' : '#FFFFFF';
                  return (
                    <div key={`${r}-${c}`} className="relative group">
                      <input
                        type="number"
                        min="0"
                        max="255"
                        value={val}
                        onChange={(e) => handleCellChange(r, c, e.target.value)}
                        className="w-full h-14 sm:h-16 text-center font-mono font-bold text-sm sm:text-base rounded-xl border-2 border-slate-300 focus:border-scientific-violet focus:outline-none transition-all shadow-xs"
                        style={{
                          backgroundColor: `rgb(${val}, ${val}, ${val})`,
                          color: textColor,
                          textShadow: norm > 0.5 ? 'none' : '0 1px 2px rgba(0,0,0,0.8)',
                        }}
                      />
                      <span className="absolute top-1 left-1 text-[8px] font-mono px-1 rounded bg-black/60 text-white pointer-events-none">
                        a_{r+1}{c+1}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Matrix Linear Operations Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50/50 border border-blue-100 p-3.5 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-blue-950">Scalar Multiply (c · A):</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="3.0"
                  value={scalar}
                  onChange={(e) => setScalar(parseFloat(e.target.value) || 1.0)}
                  className="w-16 px-2 py-1 rounded-lg border border-blue-200 bg-white text-center font-mono font-bold text-blue-900"
                />
                <button
                  onClick={multiplyByScalar}
                  className="px-3 py-1 rounded-lg bg-scientific-primary text-white font-semibold hover:bg-scientific-primaryHover transition-colors"
                >
                  Apply c · A
                </button>
              </div>
              <span className="text-slate-500 text-[11px] font-mono">
                Formula: aᵢⱼ ← clamp(c · aᵢⱼ, 0, 255)
              </span>
            </div>
          </div>

          {/* Computed Linear Algebra Statistics */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-5 rounded-2xl bg-scientific-violetLight/40 border border-purple-200 space-y-3.5">
              <span className="text-xs font-bold text-scientific-violet uppercase tracking-wider block">
                Matrix Summation & Integration Summary
              </span>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-2.5 bg-white rounded-xl border border-purple-100 flex justify-between items-center">
                  <span className="text-slate-600">Total Entries (N = m · n):</span>
                  <strong className="text-slate-900 text-sm">{stats.totalPixels}</strong>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-purple-100 flex justify-between items-center">
                  <span className="text-slate-600">Total Matrix Sum (1ᵀ · A · 1):</span>
                  <strong className="text-scientific-violet text-base font-bold">
                    {stats.totalBrightness}
                  </strong>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-purple-100 flex justify-between items-center">
                  <span className="text-slate-600">Average Intensity (B̄ = T / N):</span>
                  <strong className="text-scientific-primary text-base font-bold">
                    {stats.averageBrightness.toFixed(2)}
                  </strong>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-purple-100 flex justify-between items-center">
                  <span className="text-slate-600">Normalized Relative Energy:</span>
                  <strong className="text-emerald-700 text-base font-bold">
                    {stats.normalizedAverage.toFixed(2)}%
                  </strong>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-purple-100 flex justify-between items-center">
                  <span className="text-slate-600">Entry Range [Min, Max]:</span>
                  <strong className="text-slate-800 text-sm">
                    [{stats.minBrightness}, {stats.maxBrightness}]
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* College Viva Oral Exam Prep Guide */}
      <section className="bg-white rounded-3xl border border-scientific-border p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-scientific-primary uppercase tracking-wider">
              <HelpCircle className="w-4 h-4" />
              <span>Oral Defense Preparation</span>
            </div>
            <h3 className="text-xl font-bold text-scientific-text mt-1">
              College Viva Voce Q&A Master Guide
            </h3>
            <p className="text-xs text-scientific-subtext">
              Essential theoretical and mathematical questions with rigorous answers for examiner evaluation.
            </p>
          </div>
          <span className="text-xs font-mono text-purple-700 font-semibold bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
            8 Verified Questions
          </span>
        </div>

        {/* Accordion Questions */}
        <div className="space-y-3">
          {vivaQuestions.map((item, idx) => {
            const isExpanded = expandedViva === idx;
            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-slate-50/40 hover:bg-white"
              >
                <button
                  onClick={() => setExpandedViva(isExpanded ? null : idx)}
                  className="w-full text-left p-4 flex items-center justify-between gap-4"
                >
                  <span className="text-sm font-bold text-scientific-text font-sans">
                    {item.q}
                  </span>
                  <div className="p-1 rounded-lg bg-slate-100 text-slate-500">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-700 leading-relaxed border-t border-slate-100 bg-white font-sans">
                    <p className="p-3.5 rounded-xl bg-blue-50/40 border border-blue-100/70 text-slate-800">
                      {item.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
