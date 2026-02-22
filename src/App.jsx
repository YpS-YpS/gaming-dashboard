import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Gauge, ArrowLeftRight, Layers } from 'lucide-react';
import { programs, games } from './data';
import { useAvailableBuilds } from './hooks/useGameData';


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

// Splash Page
import SplashPage from './components/pages/SplashPage';
import Sidebar from './components/layout/Sidebar';

import DemoMode from './components/demo/DemoMode';

export default function GamingDashboard() {
  const [showSplash, setShowSplash] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Resolve current SKU from URL so we can query the right builds
  const skuIdFromUrl = (() => {
    const match = location.pathname.match(/\/sku\/([^/]+)/);
    return match ? match[1] : null;
  })();

  // Fetch real builds from API for current SKU (e.g. ['WW0826'] for NVL S)
  const realBuilds = useAvailableBuilds(skuIdFromUrl);

  // displayBuilds: use real builds from API (empty if no data for this SKU)
  const displayBuilds = realBuilds;

  // Get current build from URL or default to first available build
  const currentBuild = searchParams.get('build') || displayBuilds[0];


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

  // Helper to check if a program is active based on the URL
  const isProgramActive = (programId) => {
    return location.pathname === `/program/${programId}`;
  };

  // Handle Demo Mode Deep Link
  useEffect(() => {
    if (location.pathname === '/demo') {
      setIsDemoMode(true);
      navigate('/', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-[#1a0f2e] to-[#0d0a18] text-white font-sans overflow-hidden">
      {showSplash && <SplashPage onComplete={() => setShowSplash(false)} />}

      <DemoMode isActive={isDemoMode} onClose={() => setIsDemoMode(false)} />

      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] left-[10%] w-[600px] h-[600px] bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-[20%] right-[10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative flex flex-col z-10 h-screen">
        {/* Top Navbar */}
        <Sidebar
          navigate={navigate}
          location={location}
          currentBuild={currentBuild}
          handleBuildSelect={handleBuildSelect}
          handleProgramSelect={handleProgramSelect}
          handleNavigateToLanding={handleNavigateToLanding}
          isProgramActive={isProgramActive}
          onStartDemo={() => setIsDemoMode(true)}
          displayBuilds={displayBuilds}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          <React.Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LandingPage onNavigate={(p) => navigate(`/program/${p.id}`)} isReady={!showSplash} />} />
              <Route path="/compare" element={<ComparisonPage />} />
              <Route path="/program/:programId" element={<ProgramDashboard />} />
              <Route path="/program/:programId/sku/:skuId" element={<ProgramDashboard />} />
              <Route path="/program/:programId/sku/:skuId/game/:gameSlug" element={<ProgramDashboard />} />
            </Routes>
          </React.Suspense>
        </main>
      </div>
    </div>
  );
}
