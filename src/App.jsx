import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ChevronRight, Gauge, ArrowLeftRight, Layers } from 'lucide-react';
import { programs, builds, games } from './data';

// Lazy load pages
const LandingPage = React.lazy(() => import('./components/pages/LandingPage'));
const ComparisonPage = React.lazy(() => import('./components/comparison').then(module => ({ default: module.ComparisonPage })));
const ProgramDashboard = React.lazy(() => import('./components/pages/ProgramDashboard'));

// Loading Fallback
const PageLoader = () => (
  <div className="flex items-center justify-center h-full min-h-[400px]">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      <div className="text-slate-500 text-sm animate-pulse">Loading...</div>
    </div>
  </div>
);

export default function GamingDashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get current build from URL or default to first one
  const currentBuild = searchParams.get('build') || builds[0];

  const handleBuildSelect = (build) => {
    setSearchParams(prev => {
      prev.set('build', build);
      return prev;
    });
  };

  const handleProgramSelect = (program) => {
    navigate(`/program/${program.id}`);
  };

  const handleNavigateToLanding = () => {
    navigate('/');
  };

  // Helper to check if a program is active based on URL
  const isProgramActive = (programId) => {
    return location.pathname === `/program/${programId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#1a0f2e] to-[#0d0a18] text-white font-sans overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] left-[10%] w-[600px] h-[600px] bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-[20%] right-[10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative flex z-10 h-screen">
        {/* Sidebar */}
        <aside
          className={`
            flex flex-col flex-shrink-0 min-h-screen
            bg-gradient-to-b from-[#140f2d]/95 to-[#0f0a23]/98
            border-r border-primary/15
            transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden
            ${sidebarCollapsed ? 'w-[72px] py-6 px-3' : 'w-[260px] p-6'}
          `}
        >
          {/* Logo */}
          <div
            onClick={handleNavigateToLanding}
            className="flex items-center gap-3 mb-8 cursor-pointer p-2 -mx-2 rounded-xl transition-colors hover:bg-primary/10 group"
          >
            <div className="w-[42px] h-[42px] rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_4px_20px_rgba(139,92,246,0.4)] flex-shrink-0">
              <Gauge size={22} className="text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="m-0 text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent whitespace-nowrap">
                  Intel SIV Gaming
                </h1>
                <p className="m-0 text-[11px] text-slate-500 uppercase tracking-widest whitespace-nowrap">
                  Performance Lab
                </p>
              </div>
            )}
          </div>

          {/* Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`
              absolute top-8 w-6 h-6 rounded-full
              bg-primary/30 border border-primary/50
              cursor-pointer flex items-center justify-center
              transition-all duration-300 z-20
              ${sidebarCollapsed ? 'right-1/2 translate-x-1/2' : '-right-3 translate-x-0'}
            `}
          >
            <ChevronRight
              size={14}
              className={`text-primary transition-transform duration-300 ${sidebarCollapsed ? 'rotate-0' : 'rotate-180'}`}
            />
          </button>

          {/* Programs */}
          <div className="mb-6">
            {!sidebarCollapsed && (
              <h2 className="text-xs text-slate-500 uppercase tracking-widest mb-3 pl-2">
                Programs
              </h2>
            )}
            <nav className="flex flex-col gap-1">
              {programs.map((program) => {
                const isActive = isProgramActive(program.id);
                return (
                  <button
                    key={program.id}
                    onClick={() => handleProgramSelect(program)}
                    title={sidebarCollapsed ? program.name : ''}
                    className={`
                      w-full flex items-center gap-3 rounded-xl border-none cursor-pointer transition-all duration-200
                      ${sidebarCollapsed ? 'justify-center p-3' : 'justify-start p-3'}
                      ${isActive ? 'bg-primary/15 border-l-[3px]' : 'bg-transparent border-l-[3px] border-transparent'}
                    `}
                    style={{
                      borderLeftColor: isActive ? program.color : 'transparent'
                    }}
                  >
                    <span className="text-xl">{program.icon}</span>
                    {!sidebarCollapsed && (
                      <div className="text-left flex-1">
                        <div className={`text-base font-medium ${isActive ? 'text-slate-50' : 'text-slate-400'}`}>
                          {program.name}
                        </div>
                        <div className="text-xs text-slate-500">{program.skus.length} SKUs</div>
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Compare Mode */}
          <div className="mb-6">
            {!sidebarCollapsed && (
              <h2 className="text-xs text-slate-500 uppercase tracking-widest mb-3 pl-2">
                Tools
              </h2>
            )}
            <button
              onClick={() => navigate('/compare')}
              title={sidebarCollapsed ? 'Compare Configurations' : ''}
              className={`
                w-full flex items-center gap-3 rounded-xl border-none cursor-pointer transition-all duration-200
                ${sidebarCollapsed ? 'justify-center p-3' : 'justify-start p-3'}
                ${location.pathname === '/compare'
                  ? 'bg-gradient-to-br from-secondary/20 to-pink-500/20 border-l-[3px] border-pink-500'
                  : 'bg-transparent border-l-[3px] border-transparent'}
              `}
            >
              <ArrowLeftRight size={20} className={location.pathname === '/compare' ? 'text-pink-500' : 'text-slate-500'} />
              {!sidebarCollapsed && (
                <div className="text-left flex-1">
                  <div className={`text-base font-medium ${location.pathname === '/compare' ? 'text-slate-50' : 'text-slate-400'}`}>
                    Compare
                  </div>
                  <div className="text-xs text-slate-500">Any vs Any</div>
                </div>
              )}
            </button>
          </div>

          {/* Build Selection - Only show when in a program view */}
          {location.pathname.includes('/program/') && (
            <div className="mb-6 animate-fadeIn">
              {!sidebarCollapsed && (
                <h2 className="text-xs text-slate-500 uppercase tracking-widest mb-3 pl-2">
                  Build Version
                </h2>
              )}
              <div className="flex flex-col gap-1">
                {builds.map((build) => (
                  <button
                    key={build}
                    onClick={() => handleBuildSelect(build)}
                    title={sidebarCollapsed ? `Build ${build}` : ''}
                    className={`
                      w-full flex items-center gap-3 rounded-xl border-none cursor-pointer transition-all duration-200
                      ${sidebarCollapsed ? 'justify-center p-3' : 'justify-start p-3'}
                      ${currentBuild === build
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        : 'bg-transparent border border-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200'}
                    `}
                  >
                    <Layers size={18} />
                    {!sidebarCollapsed && (
                      <span className="text-sm font-medium">{build}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="mt-auto pt-6 border-t border-primary/10">
            <div className={`grid gap-3 ${sidebarCollapsed ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <div className="bg-[#1e143c]/50 rounded-xl p-3 text-center">
                <div className={`font-bold text-primary ${sidebarCollapsed ? 'text-lg' : 'text-2xl'}`}>
                  {games.length}
                </div>
                {!sidebarCollapsed && (
                  <div className="text-[11px] text-slate-500 uppercase">Games</div>
                )}
              </div>
              {!sidebarCollapsed && (
                <div className="bg-[#1e143c]/50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-secondary">{builds.length}</div>
                  <div className="text-[11px] text-slate-500 uppercase">Builds</div>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden scroll-smooth">
          <React.Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage onNavigate={(p) => navigate(`/program/${p.id}`)} />} />
              <Route path="/compare" element={<ComparisonPage />} />
              <Route path="/program/:programId" element={<ProgramDashboard sidebarCollapsed={sidebarCollapsed} />} />
              <Route path="/program/:programId/sku/:skuId" element={<ProgramDashboard sidebarCollapsed={sidebarCollapsed} />} />
              <Route path="/program/:programId/sku/:skuId/game/:gameSlug" element={<ProgramDashboard sidebarCollapsed={sidebarCollapsed} />} />
            </Routes>
          </React.Suspense>
        </main>
      </div>
    </div>
  );
}
