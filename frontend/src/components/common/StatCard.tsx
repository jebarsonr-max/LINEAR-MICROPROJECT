import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  unit?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'violet' | 'green' | 'amber' | 'slate';
  tooltip?: string;
  formula?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  unit,
  icon: Icon,
  variant = 'blue',
  tooltip,
  formula,
}) => {
  const styles = {
    blue: {
      border: 'border-blue-100',
      bg: 'bg-white',
      iconBg: 'bg-blue-50 text-scientific-primary',
      badge: 'bg-blue-50 text-scientific-primary border-blue-100',
    },
    violet: {
      border: 'border-purple-100',
      bg: 'bg-white',
      iconBg: 'bg-purple-50 text-scientific-violet',
      badge: 'bg-purple-50 text-scientific-violet border-purple-100',
    },
    green: {
      border: 'border-emerald-100',
      bg: 'bg-white',
      iconBg: 'bg-emerald-50 text-emerald-600',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    amber: {
      border: 'border-amber-100',
      bg: 'bg-white',
      iconBg: 'bg-amber-50 text-amber-600',
      badge: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    slate: {
      border: 'border-slate-200',
      bg: 'bg-white',
      iconBg: 'bg-slate-100 text-slate-700',
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
    },
  }[variant];

  return (
    <div
      className={`rounded-2xl border ${styles.border} ${styles.bg} p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden`}
      title={tooltip}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-scientific-subtext uppercase tracking-wider">
            {label}
          </p>
          <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-2xl font-bold text-scientific-text tracking-tight font-mono">
              {value}
            </span>
            {unit && (
              <span className="text-xs font-medium text-scientific-subtext">
                {unit}
              </span>
            )}
          </div>
          {subValue && (
            <p className="mt-1 text-xs text-scientific-subtext font-medium">
              {subValue}
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-xl ${styles.iconBg} flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {formula && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            {formula}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${styles.badge}`}>
            Verified
          </span>
        </div>
      )}
    </div>
  );
};
