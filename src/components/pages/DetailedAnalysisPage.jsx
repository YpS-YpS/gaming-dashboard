import React, { useState, useMemo, Component } from 'react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ScatterChart, Scatter, ComposedChart } from 'recharts';
import { Clock, Cpu, Activity, Gauge, AlertTriangle, Thermometer, Zap, Settings, Monitor, HardDrive, MemoryStick, Layers, ChevronDown, ChevronUp, Timer, Code2, Gamepad2, Info } from 'lucide-react';
import { programs, getGameImageUrl } from '../../data';
import {
  getFpsColor,
  pCoreColors,
  eCoreColors,
  tempCoreColors,
  clipReasonColors,
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
import { TrendTooltip, CpuResidencyTooltip, PerformanceCapabilityTooltip, PowerAnalysisTooltip } from '../charts/tooltips';
import DeltaBadge from '../common/DeltaBadge';
import GameImage from '../common/GameImage';

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
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0f2e 50%, #0d0a18 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Space Grotesk', sans-serif",
          padding: '40px'
        }}>
          <div style={{ textAlign: 'center', maxWidth: '600px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
            <div style={{ fontSize: '20px', color: '#ef4444', marginBottom: '12px' }}>Something went wrong</div>
            <div style={{ fontSize: '14px', color: '#64748b', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', textAlign: 'left', overflow: 'auto' }}>
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
  <div style={{
    background: 'rgba(15, 10, 35, 0.7)',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid rgba(139, 92, 246, 0.15)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
      <Icon size={18} style={{ color: '#a855f7' }} />
      <span style={{ fontSize: '15px', fontWeight: 600, color: '#f1f5f9' }}>{title}</span>
    </div>
    {children}
  </div>
);

// Config Row Component
const ConfigRow = ({ label, value, highlight }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    padding: '6px 0',
    borderBottom: '1px solid rgba(139, 92, 246, 0.08)'
  }}>
    <span style={{ fontSize: '13px', color: '#64748b' }}>{label}</span>
    <span style={{ fontSize: '13px', fontWeight: 500, color: highlight || '#e2e8f0' }}>{value}</span>
  </div>
);

// FAQ Item Component
const FAQItem = ({ faq, index, isOpen, onToggle }) => (
  <div 
    style={{
      background: isOpen ? 'rgba(139, 92, 246, 0.1)' : 'rgba(15, 10, 35, 0.5)',
      borderRadius: '12px',
      border: `1px solid ${isOpen ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.1)'}`,
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    }}
  >
    <button
      onClick={onToggle}
      style={{
        width: '100%',
        padding: '16px 20px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}
    >
      <span style={{ 
        fontSize: '14px', 
        fontWeight: 600, 
        color: isOpen ? '#a855f7' : '#e2e8f0',
        textAlign: 'left',
        transition: 'color 0.3s ease'
      }}>
        {faq.q}
      </span>
      {isOpen ? 
        <ChevronUp size={18} style={{ color: '#a855f7', flexShrink: 0 }} /> : 
        <ChevronDown size={18} style={{ color: '#64748b', flexShrink: 0 }} />
      }
    </button>
    <div style={{
      maxHeight: isOpen ? '200px' : '0',
      overflow: 'hidden',
      transition: 'max-height 0.3s ease'
    }}>
      <p style={{
        margin: 0,
        padding: '0 20px 16px 20px',
        fontSize: '13px',
        lineHeight: '1.6',
        color: '#94a3b8'
      }}>
        {faq.a}
      </p>
    </div>
  </div>
);

// Technical Spec Badge Component
const TechBadge = ({ icon: Icon, label, value, color }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: 'rgba(15, 10, 35, 0.6)',
    borderRadius: '10px',
    border: '1px solid rgba(139, 92, 246, 0.15)'
  }}>
    <div style={{
      width: '36px',
      height: '36px',
      borderRadius: '8px',
      background: `${color}20`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Icon size={18} style={{ color }} />
    </div>
    <div>
      <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>{value}</div>
    </div>
  </div>
);

const DetailedAnalysisPage = ({ game, skuId, buildId }) => {
  const [frameTimeMode, setFrameTimeMode] = useState('frameTime');
  const [selectedCores, setSelectedCores] = useState({ pCores: [0, 1], eCores: [0] });
  const [selectedTempCores, setSelectedTempCores] = useState([0, 1, 2, 3]);
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
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0f2e 50%, #0d0a18 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Space Grotesk', sans-serif"
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎮</div>
          <div style={{ fontSize: '18px', color: '#64748b' }}>Loading game data...</div>
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

  const frameTimeModes = [
    { id: 'frameTime', label: 'Frame Time', color: '#a855f7' },
    { id: 'fps', label: 'FPS', color: '#10b981' },
    { id: 'percentile95', label: '95th %', color: '#f59e0b' },
    { id: 'percentile99', label: '99th %', color: '#ef4444' },
    { id: 'onePercentLow', label: '1% Low', color: '#06b6d4' },
    { id: 'movingAvg', label: 'Moving Avg', color: '#8b5cf6' }
  ];

  const currentFrameTimeMode = frameTimeModes.find(m => m.id === frameTimeMode);

  const toggleCore = (type, index) => setSelectedCores(prev => {
    const key = type === 'p' ? 'pCores' : 'eCores';
    return { ...prev, [key]: prev[key].includes(index) ? prev[key].filter(i => i !== index) : [...prev[key], index] };
  });

  const toggleTempCore = (index) => setSelectedTempCores(prev =>
    prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0a1e 0%, #1a0f2e 50%, #0d0a18 100%)',
      color: 'white',
      fontFamily: "'Space Grotesk', sans-serif"
    }}>
      {/* Hero Section with Game Backdrop */}
      <div style={{ 
        position: 'relative', 
        minHeight: '420px',
        overflow: 'hidden'
      }}>
        {/* Background Image */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0
        }}>
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
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
                opacity: heroLoaded ? 0.5 : 0,
                transition: 'opacity 0.8s ease',
                filter: heroError ? 'blur(8px) scale(1.1)' : 'none',
                transform: heroError ? 'scale(1.1)' : 'scale(1)'
              }}
            />
          )}
        </div>
        
        {/* Gradient Overlays */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(15, 10, 30, 0.3) 0%, rgba(15, 10, 30, 0.7) 50%, rgba(15, 10, 30, 1) 100%)',
          zIndex: 1
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(90deg, rgba(15, 10, 30, 0.9) 0%, transparent 50%, rgba(15, 10, 30, 0.9) 100%)`,
          zIndex: 1
        }} />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse at top left, ${program?.color || '#a855f7'}15 0%, transparent 50%)`,
          zIndex: 1
        }} />

        {/* Hero Content */}
        <div style={{ 
          position: 'relative', 
          zIndex: 2, 
          padding: '40px',
          paddingBottom: '60px'
        }}>
          {/* Game Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            gap: '24px', 
            marginBottom: '32px' 
          }}>
            <GameImage 
              game={game} 
              size={100} 
              borderRadius={16}
              style={{ 
                border: `3px solid ${program?.color || '#a855f7'}60`,
                boxShadow: `0 8px 32px ${program?.color || '#a855f7'}30`
              }}
            />
            <div style={{ flex: 1 }}>
              <h1 style={{ 
                margin: 0, 
                fontSize: '36px', 
                fontWeight: 700, 
                color: '#f1f5f9', 
                marginBottom: '8px',
                textShadow: '0 2px 20px rgba(0,0,0,0.5)'
              }}>
                {game.name}
              </h1>
              <p style={{
                margin: '0 0 16px 0',
                fontSize: '14px',
                color: '#94a3b8',
                maxWidth: '600px',
                lineHeight: '1.5'
              }}>
                {game.description}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ 
                  fontSize: '13px', 
                  padding: '6px 14px', 
                  borderRadius: '20px', 
                  background: 'rgba(139, 92, 246, 0.2)', 
                  color: '#a855f7',
                  fontWeight: 500
                }}>
                  {game.genre}
                </span>
                <span style={{ 
                  fontSize: '13px', 
                  padding: '6px 14px', 
                  borderRadius: '20px', 
                  background: `${program?.color || '#a855f7'}20`, 
                  color: program?.color || '#a855f7',
                  fontWeight: 500
                }}>
                  {sku?.fullName}
                </span>
                <span style={{ 
                  fontSize: '13px', 
                  padding: '6px 14px', 
                  borderRadius: '20px', 
                  background: 'rgba(16, 185, 129, 0.2)', 
                  color: '#10b981',
                  fontWeight: 500
                }}>
                  Build {buildId}
                </span>
                <span style={{ 
                  fontSize: '13px', 
                  padding: '6px 14px', 
                  borderRadius: '20px', 
                  background: 'rgba(59, 130, 246, 0.2)', 
                  color: '#3b82f6',
                  fontWeight: 500
                }}>
                  {game.developer}
                </span>
              </div>
            </div>
          </div>

          {/* Technical Specs Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '32px'
          }}>
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
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '0 40px 40px 40px' }}>
        {/* Quick Stats & FAQs Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '24px',
          marginBottom: '32px',
          marginTop: '24px'
        }}>
          {/* Performance Overview */}
          <div style={{
            background: 'rgba(15, 10, 35, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(139, 92, 246, 0.2)'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              fontSize: '18px', 
              fontWeight: 600, 
              color: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Gauge size={20} style={{ color: '#10b981' }} />
              Performance Overview
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Average FPS</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: getFpsColor(metrics.avgFps) }}>
                  {metrics.avgFps.toFixed(0)}
                </div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(245, 158, 11, 0.2)'
              }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>1% Low FPS</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>
                  {metrics.onePercentLow.toFixed(0)}
                </div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.05) 100%)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(168, 85, 247, 0.2)'
              }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Frame Time</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#a855f7' }}>
                  {(1000 / metrics.avgFps).toFixed(1)}ms
                </div>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>CPU Usage</div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#3b82f6' }}>
                  {metrics.cpuUsage}%
                </div>
              </div>
            </div>
          </div>

          {/* Game FAQs */}
          <div style={{
            background: 'rgba(15, 10, 35, 0.8)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(139, 92, 246, 0.2)'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              fontSize: '18px', 
              fontWeight: 600, 
              color: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <Info size={20} style={{ color: '#a855f7' }} />
              Quick Facts
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(game.faqs || []).map((faq, index) => (
                <FAQItem 
                  key={index}
                  faq={faq}
                  index={index}
                  isOpen={openFaqIndex === index}
                  onToggle={() => setOpenFaqIndex(openFaqIndex === index ? -1 : index)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Frame Time Analysis */}
        <div style={{ 
          background: 'rgba(15, 10, 35, 0.7)', 
          borderRadius: '16px', 
          padding: '24px', 
          border: '1px solid rgba(139, 92, 246, 0.15)', 
          marginBottom: '24px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock size={20} style={{ color: '#a855f7' }} />
              <span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>Frame Time Analysis</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {frameTimeModes.map(mode => (
                <button key={mode.id} onClick={() => setFrameTimeMode(mode.id)} style={{ padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 500, background: frameTimeMode === mode.id ? `${mode.color}30` : 'rgba(30, 20, 60, 0.5)', color: frameTimeMode === mode.id ? mode.color : '#64748b', transition: 'all 0.2s ease' }}>{mode.label}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={detailedFrameTimeData}>
              <defs>
                <linearGradient id="frameTimeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentFrameTimeMode.color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={currentFrameTimeMode.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="frame" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
              <Tooltip content={({ active, payload }) => active && payload?.length ? (
                <div style={{ background: 'rgba(15, 10, 40, 0.95)', border: `1px solid ${currentFrameTimeMode.color}50`, borderRadius: '8px', padding: '12px 16px' }}>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Frame {payload[0].payload.frame}</p>
                  <p style={{ fontSize: '16px', color: currentFrameTimeMode.color, margin: 0, fontWeight: 600 }}>{payload[0].value.toFixed(2)} {frameTimeMode === 'fps' || frameTimeMode.includes('percent') || frameTimeMode.includes('Low') ? 'FPS' : 'ms'}</p>
                </div>
              ) : null} />
              <Area type="monotone" dataKey={frameTimeMode} stroke={currentFrameTimeMode.color} strokeWidth={2} fill="url(#frameTimeGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Per-Core Frequency */}
        <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Cpu size={20} style={{ color: '#ec4899' }} />
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>Per-Core Frequency</span>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>P-Cores:</span>
              {pCores.map((_, i) => (
                <button key={`p${i}`} onClick={() => toggleCore('p', i)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 500, background: selectedCores.pCores.includes(i) ? pCoreColors[i % pCoreColors.length] : 'rgba(30, 20, 60, 0.5)', color: selectedCores.pCores.includes(i) ? '#fff' : '#64748b' }}>P{i}</button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>E-Cores:</span>
              {eCores.map((_, i) => (
                <button key={`e${i}`} onClick={() => toggleCore('e', i)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 500, background: selectedCores.eCores.includes(i) ? eCoreColors[i % eCoreColors.length] : 'rgba(30, 20, 60, 0.5)', color: selectedCores.eCores.includes(i) ? '#fff' : '#64748b' }}>E{i}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={perCoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[3000, 5800]} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                <div style={{ background: 'rgba(15, 10, 40, 0.95)', border: '1px solid rgba(236, 72, 153, 0.3)', borderRadius: '8px', padding: '12px 16px', maxHeight: '200px', overflowY: 'auto' }}>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Time: {label}s</p>
                  {payload.map((entry, i) => <p key={i} style={{ fontSize: '12px', color: entry.color, margin: '2px 0', fontWeight: 500 }}>{entry.name}: {entry.value} MHz</p>)}
                </div>
              ) : null} />
              {selectedCores.pCores.map(i => <Line key={`pCore${i}`} type="monotone" dataKey={`pCore${i}`} name={`P-Core ${i}`} stroke={pCoreColors[i % pCoreColors.length]} strokeWidth={2} dot={false} />)}
              {selectedCores.eCores.map(i => <Line key={`eCore${i}`} type="monotone" dataKey={`eCore${i}`} name={`E-Core ${i}`} stroke={eCoreColors[i % eCoreColors.length]} strokeWidth={2} dot={false} strokeDasharray="4 2" />)}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* CPU Residency vs. Relative Time - Full width */}
        <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Activity size={20} style={{ color: '#3b82f6' }} />
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>CPU Residency vs. Relative Time</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={cpuResidencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
              />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 'auto']} />
              <Tooltip content={<CpuResidencyTooltip />} />
              <Line type="monotone" dataKey="trendLine" name="Trend" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Scatter dataKey="residency" name="Residency" fill="#3b82f6" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Capability & C-State - Full width */}
        <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Gauge size={20} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>Performance Capability & C-State</span>
            {/* Legends */}
            <div style={{ display: 'flex', gap: '16px', marginLeft: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 20, height: 3, background: '#10b981', borderRadius: '2px' }} />
                <span style={{ fontSize: '11px', color: '#64748b' }}>Capability</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#06b6d4' }} />
                <span style={{ fontSize: '11px', color: '#64748b' }}>C0 Active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ fontSize: '11px', color: '#64748b' }}>C1</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6' }} />
                <span style={{ fontSize: '11px', color: '#64748b' }}>C6</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={performanceCapabilityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
              />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 120]} />
              <Tooltip content={<PerformanceCapabilityTooltip />} />
              <Line type="monotone" dataKey="capability" name="Capability" stroke="#10b981" strokeWidth={2} dot={false} />
              <Scatter dataKey="c0Active" name="C0 Active" fill="#06b6d4" />
              <Scatter dataKey="c1" name="C1" fill="#f59e0b" />
              <Scatter dataKey="c6" name="C6" fill="#8b5cf6" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* IA Clip Reason */}
        <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <AlertTriangle size={20} style={{ color: '#ec4899' }} />
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>IA Clip Reason</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="rgba(139, 92, 246, 0.15)" 
                vertical={true}
                horizontalPoints={[0, 1, 2, 3, 4, 5]}
              />
              <XAxis 
                dataKey="time" 
                type="number" 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false} 
                domain={[0, 60000]}
                ticks={[0, 15000, 30000, 45000, 60000]}
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
              />
              <YAxis 
                type="category" 
                dataKey="reason" 
                tick={{ fontSize: 10, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false} 
                width={100}
                allowDuplicatedCategory={false}
              />
              <Tooltip content={({ active, payload }) => active && payload?.length ? (
                <div style={{ background: 'rgba(15, 10, 40, 0.95)', border: '1px solid rgba(236, 72, 153, 0.5)', borderRadius: '8px', padding: '12px 16px' }}>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Time: {(payload[0].payload.time / 1000).toFixed(1)}s ({payload[0].payload.time.toLocaleString()} ms)</p>
                  <p style={{ fontSize: '14px', color: clipReasonColors[payload[0].payload.reason], margin: 0, fontWeight: 600 }}>{payload[0].payload.reason}</p>
                </div>
              ) : null} />
              <Scatter data={clipReasonData} shape={(props) => props.cx && props.cy ? <circle cx={props.cx} cy={props.cy} r={5} fill={clipReasonColors[props.payload.reason] || '#ec4899'} fillOpacity={0.9} /> : null} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Per-Core Temperature */}
        <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Thermometer size={20} style={{ color: '#f43f5e' }} />
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>Per-Core Temperature</span>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {Array.from({ length: Math.min(tempCoreCount, 16) }, (_, i) => (
              <button key={`temp${i}`} onClick={() => toggleTempCore(i)} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 500, background: selectedTempCores.includes(i) ? tempCoreColors[i % tempCoreColors.length] : 'rgba(30, 20, 60, 0.5)', color: selectedTempCores.includes(i) ? '#fff' : '#64748b' }}>C{i}</button>
            ))}
            <button onClick={() => toggleTempCore('package')} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, background: selectedTempCores.includes('package') ? '#f43f5e' : 'rgba(30, 20, 60, 0.5)', color: selectedTempCores.includes('package') ? '#fff' : '#64748b' }}>Package</button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={perCoreTemperatureData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[55, 100]} />
              <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                <div style={{ background: 'rgba(15, 10, 40, 0.95)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', padding: '12px 16px', maxHeight: '200px', overflowY: 'auto' }}>
                  <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>Time: {label}s</p>
                  {payload.map((entry, i) => <p key={i} style={{ fontSize: '12px', color: entry.color, margin: '2px 0', fontWeight: 500 }}>{entry.name}: {entry.value}°C</p>)}
                </div>
              ) : null} />
              {selectedTempCores.filter(c => c !== 'package').map(i => <Line key={`core${i}`} type="monotone" dataKey={`core${i}`} name={`Core ${i}`} stroke={tempCoreColors[i % tempCoreColors.length]} strokeWidth={1.5} dot={false} />)}
              {selectedTempCores.includes('package') && <Line type="monotone" dataKey="package" name="Package" stroke="#f43f5e" strokeWidth={3} dot={false} />}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Power */}
        <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Zap size={20} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>Power Analysis</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={powerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={[0, 120]} />
              <Tooltip content={<PowerAnalysisTooltip />} />
              <Scatter dataKey="iaPower" name="IA Power" fill="#3b82f6" />
              <Scatter dataKey="packagePower" name="Package Power" fill="#7c3aed" />
              <Line type="monotone" dataKey="iaTrendLine" name="IA Trend" stroke="#1e40af" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="pkgTrendLine" name="Pkg Trend" stroke="#4c1d95" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Build Trend */}
        <div style={{ background: 'rgba(15, 10, 35, 0.7)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Activity size={20} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>Build-over-Build Trend</span>
            <DeltaBadge delta={delta} deltaPercent={deltaPercent} />
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="detailTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={delta >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={delta >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 92, 246, 0.1)" />
              <XAxis dataKey="build" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: 'rgba(139, 92, 246, 0.2)' }} tickLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip content={<TrendTooltip />} />
              <Area type="monotone" dataKey="avgFps" stroke={delta >= 0 ? '#10b981' : '#ef4444'} strokeWidth={3} fill="url(#detailTrendGrad)" dot={{ r: 6, fill: delta >= 0 ? '#10b981' : '#ef4444', strokeWidth: 2, stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* System Configuration */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <Settings size={20} style={{ color: '#a855f7' }} />
            <span style={{ fontSize: '20px', fontWeight: 600, color: '#f1f5f9' }}>System Configuration</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
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
