import React from 'react';
import { Sigma, BookOpen } from 'lucide-react';

interface FormulaCardProps {
  title: string;
  formula: string;
  description: string;
  variables?: { symbol: string; meaning: string }[];
  discreteVsContinuous?: {
    continuous: string;
    discrete: string;
    note: string;
  };
  highlight?: boolean;
}

export const FormulaCard: React.FC<FormulaCardProps> = ({
  title,
  formula,
  description,
  variables,
  discreteVsContinuous,
  highlight = false,
}) => {
  return (
    <div
      className={`rounded-2xl border p-5 transition-all ${
        highlight
          ? 'border-scientific-violet/40 bg-scientific-violetLight/40 shadow-sm'
          : 'border-scientific-border bg-scientific-card shadow-sm'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-scientific-text flex items-center gap-2 text-sm sm:text-base">
          <Sigma className="w-4 h-4 text-scientific-violet" />
          {title}
        </h4>
        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-scientific-blueLight text-scientific-primary border border-blue-100">
          Math Formulation
        </span>
      </div>

      <div className="bg-white/80 border border-slate-200/80 rounded-xl p-3.5 my-2.5 font-mono text-center text-sm sm:text-base text-scientific-violet font-semibold tracking-wide overflow-x-auto shadow-inner">
        {formula}
      </div>

      <p className="text-xs sm:text-sm text-scientific-subtext mt-2 leading-relaxed">
        {description}
      </p>

      {variables && variables.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-200/60">
          <div className="text-xs font-semibold text-scientific-text uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-scientific-primary" />
            Variable Definitions
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {variables.map((v, i) => (
              <div
                key={i}
                className="flex items-start gap-2 bg-slate-50/70 p-1.5 rounded-lg border border-slate-100"
              >
                <span className="font-mono font-bold text-scientific-primary min-w-[28px] text-right">
                  {v.symbol}:
                </span>
                <span className="text-slate-600">{v.meaning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {discreteVsContinuous && (
        <div className="mt-4 pt-3 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100">
            <div className="font-bold text-blue-900 mb-1">Continuous Model</div>
            <div className="font-mono text-blue-700 font-semibold">{discreteVsContinuous.continuous}</div>
          </div>
          <div className="p-2.5 rounded-lg bg-purple-50/50 border border-purple-100">
            <div className="font-bold text-purple-900 mb-1">Discrete Matrix Riemann Sum</div>
            <div className="font-mono text-purple-700 font-semibold">{discreteVsContinuous.discrete}</div>
          </div>
          <div className="sm:col-span-2 text-[11px] text-slate-500 italic">
            Note: {discreteVsContinuous.note}
          </div>
        </div>
      )}
    </div>
  );
};
