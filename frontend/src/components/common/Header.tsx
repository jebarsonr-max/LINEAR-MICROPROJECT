import React from 'react';
import { Menu, RefreshCw, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { ActiveTab, ImageStats } from '../../types';

interface HeaderProps {
  activeTab: ActiveTab;
  setMobileOpen: (open: boolean) => void;
  stats: ImageStats | null;
  onReset: () => void;
  onLoadSample: (type: 'benchmark' | 'gradient' | 'gaussian' | 'academic') => void;
  onNavigateTab: (tab: ActiveTab) => void;
  backendOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setMobileOpen,
  stats,
  onReset,
  onLoadSample,
  onNavigateTab,
  backendOnline,
}) => {
  const getTabTitle = (tab: ActiveTab) => {
    switch (tab) {
      case 'overview':
        return { title: 'Project Overview & Dashboard', subtitle: 'Image brightness representation & numerical integration platform' };
      case 'analyzer':
        return { title: 'Image Analyzer & Luminance Mapping', subtitle: 'ITU-R BT.601 conversion & Region of Interest (ROI) integration' };
      case 'integration':
        return { title: 'Double Integration Lab', subtitle: 'Comparing continuous double integrals with discrete 2D Riemann matrix sums' };
      case 'visualizations':
        return { title: 'Scientific Visualizations', subtitle: 'Interactive 3D intensity surface, 2D heatmaps, and spatial profiles' };
      case 'simulator':
        return { title: 'What-If Brightness & Contrast Simulator', subtitle: 'Dynamic luminance transformations and total integral delta calculations' };
      case 'linear-algebra':
        return { title: 'Linear Algebra & Matrix Representation', subtitle: 'Images as matrices A=[aij], operations, and college viva questions' };
      case 'reports':
        return { title: 'Results & Academic Report', subtitle: 'Formal mathematical documentation and print-ready summary' };
      case 'history':
        return { title: 'Analysis Database History', subtitle: 'Persistent SQLite analysis records and PDF report downloads' };
    }
  };

  const { title, subtitle } = getTabTitle(activeTab);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-scientific-border px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 -ml-2 rounded-xl text-scientific-text hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-scientific-text tracking-tight">
              {title}
            </h1>
            {stats && stats.totalPixels > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                {stats.width} × {stats.height} px
              </span>
            )}
          </div>
          <p className="text-xs text-scientific-subtext hidden md:block">
            {subtitle}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Backend Connectivity Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
            backendOnline
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
          title={backendOnline ? 'Connected to FastAPI & SQLite backend' : 'Running in local browser fallback mode'}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              backendOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="hidden md:inline font-mono">
            {backendOnline ? 'FastAPI Online' : 'Local Fallback'}
          </span>
        </div>

        {stats && stats.totalPixels > 0 && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            title="Reset current image data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}

        {/* Quick Sample Selector */}
        <div className="relative group">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-scientific-blueLight text-scientific-primary border border-blue-200 text-xs font-semibold hover:bg-blue-100/80 transition-colors">
            <span>Sample Images</span>
          </button>
          <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 hidden group-hover:block z-50">
            <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Academic Test Patterns
            </div>
            <button
              onClick={() => onLoadSample('benchmark')}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between"
            >
              <span>3×3 Benchmark Matrix</span>
              <span className="text-[10px] font-mono text-purple-600 font-semibold">T=450</span>
            </button>
            <button
              onClick={() => onLoadSample('gaussian')}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between"
            >
              <span>Gaussian 2D Surface</span>
              <span className="text-[10px] font-mono text-blue-600">Continuous</span>
            </button>
            <button
              onClick={() => onLoadSample('gradient')}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between"
            >
              <span>Linear Gradient Ramp</span>
              <span className="text-[10px] font-mono text-slate-500">0→255</span>
            </button>
            <button
              onClick={() => onLoadSample('academic')}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between"
            >
              <span>Concentric Circles</span>
              <span className="text-[10px] font-mono text-slate-500">Multimodal</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('reports')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-scientific-primary text-white text-xs font-semibold hover:bg-scientific-primaryHover transition-colors shadow-xs"
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">View Report</span>
        </button>
      </div>
    </header>
  );
};
