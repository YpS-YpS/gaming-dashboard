import React, { useState, useMemo, Component } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Gauge, Settings, Monitor, HardDrive, MemoryStick, Layers, ChevronDown, ChevronUp, Timer, Code2, Gamepad2, Info, Cpu } from 'lucide-react';
import { programs, getGameImageUrl } from '../../data';
import {
  getFpsColor,
  generateDetailedFrameTimeData,
  generatePerCoreFrequencyData,
  generateCpuResidencyData,
  generatePerformanceCapabilityData,
  generateClipReasonData,
  generatePerCoreTemperatureData,
  generatePowerData,
  generateSystemConfig,
  generateGameMetricsForBuild,
  getBuildTrend
} from '../../utils';
import DeltaBadge from '../common/DeltaBadge';
import GameImage from '../common/GameImage';

// Chart Components
import FrameTimeChart from '../charts/analysis/FrameTimeChart';
import FrequencyChart from '../charts/analysis/FrequencyChart';
import CpuResidencyChart from '../charts/analysis/CpuResidencyChart';
import PerformanceCapabilityChart from '../charts/analysis/PerformanceCapabilityChart';
import ClipReasonChart from '../charts/analysis/ClipReasonChart';
import TemperatureChart from '../charts/analysis/TemperatureChart';
import PowerChart from '../charts/analysis/PowerChart';
import TrendChart from '../charts/analysis/TrendChart';


// Error Boundary Component
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0a1e] via-[#1a0f2e] to-[#0d0a18] text-white flex items-center justify-center font-space p-10">
          <div className="text-center max-w-[600px]">
            <div className="text-5xl mb-4">⚠️</div>
            <div className="text-xl text-red-500 mb-3">Something went wrong</div>
            <div className="text-sm text-slate-500 bg-black/30 p-4 rounded-lg text-left overflow-auto">
              {this.state.error?.toString()}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Config Section Component
const ConfigSection = ({ title, icon: Icon, children }) => (
  <div className="bg-[#0f0a23]/70 rounded-xl p-4 border border-primary/15">
    <div className="flex items-center gap-2.5 mb-3">
      <Icon size={18} className="text-primary" />
      <span className="text-[15px] font-semibold text-slate-50">{title}</span>
    </div>
    {children}
  </div>
);

// Config Row Component
const ConfigRow = ({ label, value, highlight }) => (
  <div className="flex justify-between py-1.5 border-b border-primary/10">
    <span className="text-[13px] text-slate-500">{label}</span>
    <span className="text-[13px] font-medium" style={{ color: highlight || '#e2e8f0' }}>{value}</span>
  </div>
);

// FAQ Item Component
const FAQItem = ({ faq, index, isOpen, onToggle }) => (
  <div
    className={`
      rounded-xl border overflow-hidden transition-all duration-300
      ${isOpen
        ? 'bg-primary/10 border-primary/30'
        : 'bg-[#0f0a23]/50 border-primary/10'}
    `}
  >
    <button
      onClick={onToggle}
      className="w-full p-5 bg-transparent border-none cursor-pointer flex items-center justify-between gap-3"
    >
      <span className={`
        text-sm font-semibold text-left transition-colors duration-300
        ${isOpen ? 'text-primary' : 'text-slate-200'}
      `}>
        {faq.q}
      </span>
      {isOpen ?
        <ChevronUp size={18} className="text-primary flex-shrink-0" /> :
        <ChevronDown size={18} className="text-slate-500 flex-shrink-0" />
      }
    </button>
    <div className={`
      overflow-hidden transition-all duration-300 ease-in-out
      ${isOpen ? 'max-h-[200px]' : 'max-h-0'}
    `}>
      <p className="m-0 px-5 pb-4 text-[13px] leading-relaxed text-slate-400">
        {faq.a}
      </p>
    </div>
  </div>
);

// Technical Spec Badge Component
const TechBadge = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-3 p-3 px-4 bg-[#0f0a23]/60 rounded-xl border border-primary/15">
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center"
      style={{ background: `${color}20` }}
    >
      <Icon size={18} style={{ color }} />
    </div>
    <div>
      <div className="text-[11px] text-slate-500 mb-0.5">{label}</div>
      <div className="text-sm font-semibold text-slate-50">{value}</div>
    </div>
  </div>
);

const DetailedAnalysisPage = ({ game, skuId, buildId, isDemoMode = false }) => {
  const navigate = useNavigate();
  const { programId } = useParams();
  const [searchParams] = useSearchParams();
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [heroError, setHeroError] = useState(false);

  // Calculate seed safely (needed for hooks below)
  const safeGameId = game?.id || 1;
  const safeSkuId = skuId || 'ARL-U9';
  const safeBuildId = buildId || 'WW01.2';
  const seed = safeGameId * 1000 + safeSkuId.charCodeAt(0);

  // All useMemo hooks MUST be called before any early returns (React rules of hooks)
  const detailedFrameTimeData = useMemo(() => generateDetailedFrameTimeData(seed), [seed]);
  const perCoreResult = useMemo(() => generatePerCoreFrequencyData(safeSkuId, seed), [safeSkuId, seed]);
  const trendResult = useMemo(() => getBuildTrend(safeGameId, safeSkuId, safeBuildId), [safeGameId, safeSkuId, safeBuildId]);
  const cpuResidencyData = useMemo(() => generateCpuResidencyData(seed), [seed]);
  const performanceCapabilityData = useMemo(() => generatePerformanceCapabilityData(seed), [seed]);
  const clipReasonResult = useMemo(() => generateClipReasonData(seed), [seed]);
  const perCoreTempResult = useMemo(() => generatePerCoreTemperatureData(safeSkuId, seed), [safeSkuId, seed]);
  const powerData = useMemo(() => generatePowerData(seed), [seed]);

  // Handle Escape key to close
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        // Navigate to the SKU dashboard, preserving the build query param if it exists
        const buildParam = searchParams.get('build');
        const targetUrl = `/program/${programId}/sku/${skuId}${buildParam ? `?build=${buildParam}` : ''}`;
        navigate(targetUrl);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  // Destructure memoized results with safe defaults
  const { data: perCoreData = [], pCores: pCoreCount = 4, eCores: eCoreCount = 4 } = perCoreResult || {};
  const { trendData = [], delta = 0, deltaPercent = 0 } = trendResult || {};
  const { data: clipReasonData = [] } = clipReasonResult || {};
  const { data: perCoreTemperatureData = [], coreCount: tempCoreCount = 8 } = perCoreTempResult || {};

  // Convert core counts to arrays for mapping
  const pCores = Array.from({ length: pCoreCount }, (_, i) => i);
  const eCores = Array.from({ length: eCoreCount }, (_, i) => i);

  // Defensive check - return early if required props missing
  if (!game || !skuId || !buildId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0a1e] via-[#1a0f2e] to-[#0d0a18] text-white flex items-center justify-center font-space">
        <div className="text-center">
          <div className="text-5xl mb-4">🎮</div>
          <div className="text-lg text-slate-500">Loading game data...</div>
        </div>
      </div>
    );
  }

  const program = programs.find(p => p.skus.some(s => s.id === skuId));
  const sku = program?.skus.find(s => s.id === skuId);
  const metrics = generateGameMetricsForBuild(game.id, skuId, buildId);
  const systemConfig = generateSystemConfig(skuId, buildId);

  // Get hero image - fallback to header if hero fails
  const heroUrl = getGameImageUrl(game, 'hero');
  const fallbackUrl = getGameImageUrl(game, 'header');



  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0a1e] via-[#1a0f2e] to-[#0d0a18] text-white font-space">
      {/* Hero Section with Game Backdrop */}
      <div className={`relative overflow-hidden transition-all duration-500 ${isDemoMode ? 'min-h-[75vh]' : 'min-h-[420px]'}`}>
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          {(heroUrl || fallbackUrl) && (
            <img
              src={heroError ? fallbackUrl : heroUrl}
              alt=""
              onLoad={() => setHeroLoaded(true)}
              onError={() => {
                if (!heroError) {
                  setHeroError(true);
                  setHeroLoaded(false);
                }
              }}
              className={`
                w-full h-full object-cover object-top transition-all duration-[20s] ease-linear
                ${heroLoaded ? 'opacity-70' : 'opacity-0'}
                ${heroError ? 'blur-sm scale-110' : 'scale-100'}
                ${isDemoMode ? 'scale-110 animate-[kenburns_20s_ease-in-out_infinite_alternate]' : ''}
              `}
            />
          )}
        </div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[#0f0a1e]/30 via-[#0f0a1e]/70 to-[#0f0a1e]" />
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[#0f0a1e]/90 via-transparent to-[#0f0a1e]/90" />
        <div
          className="absolute inset-0 z-[1]"
          style={{ background: `radial-gradient(ellipse at top left, ${program?.color || '#a855f7'}15 0%, transparent 50%)` }}
        />

        {/* Hero Content */}
        <div className={`relative z-[2] p-10 pb-[60px] ${isDemoMode ? 'flex flex-col justify-end h-full absolute inset-0' : ''}`}>
          {/* Game Header */}
          <div className="flex items-start gap-6 mb-8">
            <GameImage
              game={game}
              size={isDemoMode ? 220 : 140}
              borderRadius={16}
              style={{
                border: `3px solid ${program?.color || '#a855f7'}60`,
                boxShadow: `0 8px 32px ${program?.color || '#a855f7'}30`
              }}
            />
            <div className="flex-1">
              <h1 className={`m-0 font-bold text-slate-50 mb-2 drop-shadow-lg ${isDemoMode ? 'text-7xl' : 'text-5xl'}`}>
                {game.name}
              </h1>
              <p className={`m-0 mb-4 text-slate-400 max-w-[600px] leading-relaxed ${isDemoMode ? 'text-xl' : 'text-sm'}`}>
                {game.description}
              </p>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-[13px] px-3.5 py-1.5 rounded-full bg-primary/20 text-primary font-medium">
                  {game.genre}
                </span>
                <span
                  className="text-[13px] px-3.5 py-1.5 rounded-full font-medium"
                  style={{ background: `${program?.color || '#a855f7'}20`, color: program?.color || '#a855f7' }}
                >
                  {sku?.fullName}
                </span>
                <span className="text-[13px] px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-500 font-medium">
                  Build {buildId}
                </span>
                <span className="text-[13px] px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-500 font-medium">
                  {game.developer}
                </span>
              </div>
            </div>
          </div>

          {/* Technical Specs Row */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <TechBadge
              icon={Code2}
              label="Game Engine"
              value={game.engine || 'Custom Engine'}
              color="#a855f7"
            />
            <TechBadge
              icon={Monitor}
              label="Graphics API"
              value={game.graphicsAPI || 'DirectX 12'}
              color="#3b82f6"
            />
            <TechBadge
              icon={Timer}
              label="Benchmark Duration"
              value={game.benchmarkDuration || '60s'}
              color="#10b981"
            />
            <TechBadge
              icon={Gamepad2}
              label="Benchmark Scene"
              value={game.benchmarkScene || 'Built-in Benchmark'}
              color="#f59e0b"
            />
          </div>

          {/* Fun Facts / Did You Know */}
          {game.funFacts && game.funFacts.length > 0 && (
            <div className="mt-6 border-t border-white/10 pt-6">
              <h3 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                <Info size={16} />
                Did You Know?
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {game.funFacts.map((fact, i) => (
                  <p key={i} className="text-[13px] text-slate-300 leading-relaxed m-0">
                    {fact}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-10 pb-10">
        {/* Quick Stats & FAQs Grid */}
        {/* Quick Stats Grid */}
        <div className="mb-8 mt-6">
          {/* Performance Overview - Full Width */}
          <div className="bg-[#0f0a23]/80 backdrop-blur-xl rounded-2xl p-6 border border-primary/20">
            <h3 className="m-0 mb-5 text-lg font-semibold text-slate-50 flex items-center gap-2.5">
              <Gauge size={20} className="text-emerald-500" />
              Performance Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Row 1 */}
              <div className="bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 rounded-xl p-4 border border-emerald-500/20">
                <div className="text-xs text-slate-500 mb-1">Average FPS</div>
                <div className="text-[28px] font-bold" style={{ color: getFpsColor(metrics.avgFps) }}>
                  {metrics.avgFps.toFixed(0)}
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-500/15 to-amber-500/5 rounded-xl p-4 border border-amber-500/20">
                <div className="text-xs text-slate-500 mb-1">1% Low FPS</div>
                <div className="text-[28px] font-bold text-amber-500">
                  {metrics.onePercentLow.toFixed(0)}
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-500/15 to-red-500/5 rounded-xl p-4 border border-red-500/20">
                <div className="text-xs text-slate-500 mb-1">0.1% Low FPS</div>
                <div className="text-[28px] font-bold text-red-500">
                  {metrics.pointOnePercentLow.toFixed(0)}
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/15 to-purple-500/5 rounded-xl p-4 border border-purple-500/20">
                <div className="text-xs text-slate-500 mb-1">Frame Time</div>
                <div className="text-[28px] font-bold text-purple-500">
                  {(1000 / metrics.avgFps).toFixed(1)}ms
                </div>
              </div>

              {/* Row 2 */}
              <div className="bg-gradient-to-br from-blue-500/15 to-blue-500/5 rounded-xl p-4 border border-blue-500/20">
                <div className="text-xs text-slate-500 mb-1">CPU Usage</div>
                <div className="text-[28px] font-bold text-blue-500">
                  {metrics.avgCpuUsage}%
                </div>
              </div>
              <div className="bg-gradient-to-br from-indigo-500/15 to-indigo-500/5 rounded-xl p-4 border border-indigo-500/20">
                <div className="text-xs text-slate-500 mb-1">GPU Usage</div>
                <div className="text-[28px] font-bold text-indigo-500">
                  {metrics.avgGpuUsage}%
                </div>
              </div>
              <div className="bg-gradient-to-br from-rose-500/15 to-rose-500/5 rounded-xl p-4 border border-rose-500/20">
                <div className="text-xs text-slate-500 mb-1">Pkg Temp</div>
                <div className="text-[28px] font-bold text-rose-500">
                  {metrics.avgPackageTemp}°C
                </div>
              </div>
              <div className="bg-gradient-to-br from-yellow-500/15 to-yellow-500/5 rounded-xl p-4 border border-yellow-500/20">
                <div className="text-xs text-slate-500 mb-1">Power Draw</div>
                <div className="text-[28px] font-bold text-yellow-500">
                  {metrics.avgPower}W
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Frame Time Analysis */}
        <FrameTimeChart data={detailedFrameTimeData} />

        {/* Per-Core Frequency */}
        <FrequencyChart data={perCoreData} pCores={pCores} eCores={eCores} />

        {/* CPU Residency vs. Relative Time - Full width */}
        <CpuResidencyChart data={cpuResidencyData} />

        {/* Performance Capability & C-State - Full width */}
        <PerformanceCapabilityChart data={performanceCapabilityData} />

        {/* IA Clip Reason */}
        <ClipReasonChart data={clipReasonData} />

        {/* Per-Core Temperature */}
        <TemperatureChart data={perCoreTemperatureData} tempCoreCount={tempCoreCount} />

        {/* Power */}
        <PowerChart data={powerData} />

        {/* Build Trend */}
        <TrendChart data={trendData} delta={delta} deltaPercent={deltaPercent} />

        {/* System Configuration */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings size={20} className="text-primary" />
            <span className="text-xl font-semibold text-slate-50">System Configuration</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <ConfigSection title="CPU" icon={Cpu}>
              <ConfigRow label="Processor" value={systemConfig.cpu.name} highlight="#a855f7" />
              <ConfigRow label="Cores" value={systemConfig.cpu.cores} />
              <ConfigRow label="Boost" value={systemConfig.cpu.boostClock} highlight="#10b981" />
              <ConfigRow label="TDP" value={systemConfig.cpu.tdp} />
            </ConfigSection>
            <ConfigSection title="Memory" icon={MemoryStick}>
              <ConfigRow label="Type" value={systemConfig.memory.type} highlight="#ec4899" />
              <ConfigRow label="Capacity" value={systemConfig.memory.capacity} />
              <ConfigRow label="Timings" value={systemConfig.memory.timings} />
            </ConfigSection>
            <ConfigSection title="GPU" icon={Monitor}>
              <ConfigRow label="Model" value={systemConfig.gpu.name} highlight="#10b981" />
              <ConfigRow label="Driver" value={systemConfig.gpu.driver} highlight="#f59e0b" />
              <ConfigRow label="VRAM" value={systemConfig.gpu.vram} />
            </ConfigSection>
            <ConfigSection title="BIOS" icon={Layers}>
              <ConfigRow label="Version" value={systemConfig.bios.version} highlight="#06b6d4" />
              <ConfigRow label="Date" value={systemConfig.bios.date} />
              <ConfigRow label="Mode" value={systemConfig.bios.mode} />
            </ConfigSection>
            <ConfigSection title="OS" icon={HardDrive}>
              <ConfigRow label="Name" value={systemConfig.os.name} highlight="#06b6d4" />
              <ConfigRow label="Build" value={systemConfig.os.build} />
              <ConfigRow label="DirectX" value={systemConfig.os.directX} />
            </ConfigSection>
            <ConfigSection title="Test Settings" icon={Settings}>
              <ConfigRow label="Resolution" value={systemConfig.testSettings.resolution} highlight="#a855f7" />
              <ConfigRow label="Preset" value={systemConfig.testSettings.preset} />
              <ConfigRow label="DLSS" value={systemConfig.testSettings.dlss} />
            </ConfigSection>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrapped export with error boundary
const DetailedAnalysisPageWithErrorBoundary = (props) => (
  <ErrorBoundary>
    <DetailedAnalysisPage {...props} />
  </ErrorBoundary>
);

export default DetailedAnalysisPageWithErrorBoundary;
