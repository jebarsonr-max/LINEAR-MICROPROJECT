import React from 'react';
import {
  LayoutDashboard,
  ScanEye,
  Sigma,
  SlidersHorizontal,
  Grid3X3,
  FileSpreadsheet,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  Database
} from 'lucide-react';
import { ActiveTab } from '../../types';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  hasImage: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  hasImage,
}) => {
  const navItems = [
    {
      id: 'overview' as ActiveTab,
      label: 'Overview',
      icon: LayoutDashboard,
      desc: 'Project dashboard & upload',
    },
    {
      id: 'analyzer' as ActiveTab,
      label: 'Image Analyzer',
      icon: ScanEye,
      desc: 'Luminance & Region ROI',
      badge: hasImage ? 'Ready' : undefined,
    },
    {
      id: 'integration' as ActiveTab,
      label: 'Integration Lab',
      icon: Sigma,
      desc: 'Continuous vs Riemann Sums',
    },
    {
      id: 'visualizations' as ActiveTab,
      label: 'Scientific Visuals',
      icon: Activity,
      desc: '3D Surface, Heatmap & Profiles',
    },
    {
      id: 'simulator' as ActiveTab,
      label: 'Brightness Simulator',
      icon: SlidersHorizontal,
      desc: 'What-If contrast & ΔT shifts',
    },
    {
      id: 'linear-algebra' as ActiveTab,
      label: 'Linear Algebra',
      icon: Grid3X3,
      desc: 'Matrix A=[aij] & viva guide',
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Results & Reports',
      icon: FileSpreadsheet,
      desc: 'Printable academic export',
    },
    {
      id: 'history' as ActiveTab,
      label: 'Analysis History',
      icon: Database,
      desc: 'SQLite persistent records',
    },
  ];

  const handleSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#172554] text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-blue-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-scientific-primary to-scientific-violet flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sigma className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-white font-sans">
                  BrightInt
                </span>
                <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-400/30 font-medium">
                  v2.0
                </span>
              </div>
              <p className="text-[11px] text-blue-300/80 font-normal">
                Calculus & Matrix Platform
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-blue-300 hover:bg-blue-900/60 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Academic Course Tag */}
        <div className="px-5 py-3 bg-blue-950/40 border-b border-blue-900/40">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-blue-300/70">
            College Subject Project
          </div>
          <div className="text-xs font-medium text-slate-200 mt-0.5 truncate">
            Linear Algebra & Multivariable Calculus
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all group relative ${
                  isActive
                    ? 'bg-scientific-primary text-white font-medium shadow-md shadow-blue-950/50'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform group-hover:scale-110 flex-shrink-0 ${
                    isActive ? 'text-white' : 'text-blue-300/70 group-hover:text-blue-200'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm truncate">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.2 rounded font-medium">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-[11px] truncate ${
                      isActive ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {item.desc}
                  </p>
                </div>
                {isActive && (
                  <ChevronRight className="w-4 h-4 text-white/70 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Mathematical Model Summary Footer */}
        <div className="p-4 border-t border-blue-900/50 bg-[#0F172A]/40 text-xs">
          <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-900/60 space-y-1.5">
            <div className="flex items-center gap-1.5 text-blue-200 font-mono text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>∬ B(x,y) dA ≈ Σ Σ B(i,j)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Unit pixel integration model with IEEE 754 precision.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
