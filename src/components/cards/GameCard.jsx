import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { ChevronDown, Activity, Clock, Thermometer, Monitor, Cpu, Zap, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { getFpsColor, generateFrameTimeData, generateFrequencyData, generateTempData, getBuildTrend } from '../../utils';
import TrendSparkline from '../charts/TrendSparkline';
import { CustomTooltip, TrendTooltip } from '../charts/tooltips';
import DeltaBadge from '../common/DeltaBadge';
import GameImage from '../common/GameImage';
import MetricCard from './MetricCard';

const GameCard = ({ game, metrics, isExpanded, onToggle, skuId, currentBuild, onOpenDetail }) => {
  const frameTimeData = useMemo(() => generateFrameTimeData(), []);
  const frequencyData = useMemo(() => generateFrequencyData(), []);
  const tempData = useMemo(() => generateTempData(), []);
  const { trendData, delta, deltaPercent } = useMemo(
    () => getBuildTrend(game.id, skuId, currentBuild),
    [game.id, skuId, currentBuild]
  );

  return (
    <div style={{
      background: isExpanded ? 'rgba(30, 20, 60, 0.8)' : 'rgba(20, 15, 45, 0.6)',
      borderRadius: '16px',
      border: isExpanded ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(139, 92, 246, 0.1)',
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    }}>
      {/* Header Row */}
      <div
        onClick={onToggle}
        style={{
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
          <GameImage game={game} size={48} borderRadius={12} />
          <div style={{ minWidth: '200px' }}>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#f1f5f9' }}>
              {game.name}
            </h3>
            <span style={{ fontSize: '14px', color: '#64748b' }}>{game.genre}</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          {/* Trend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '11px',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '2px'
              }}>
                Last 4 Builds
              </div>
              <TrendSparkline data={trendData} delta={delta} />
            </div>
            <DeltaBadge delta={delta} deltaPercent={deltaPercent} />
          </div>

          <div style={{ width: '1px', height: '40px', background: 'rgba(139, 92, 246, 0.2)' }} />

          {/* FPS Metrics */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div style={{ textAlign: 'center', minWidth: '50px' }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: getFpsColor(metrics.avgFps) }}>
                {metrics.avgFps}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Avg</div>
            </div>
            <div style={{ textAlign: 'center', minWidth: '50px' }}>
              <div style={{ fontSize: '24px', fontWeight: 600, color: getFpsColor(metrics.onePercentLow) }}>
                {metrics.onePercentLow}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>1% Low</div>
            </div>
            <div style={{ textAlign: 'center', minWidth: '50px' }}>
              <div style={{ fontSize: '24px', fontWeight: 600, color: getFpsColor(metrics.pointOnePercentLow) }}>
                {metrics.pointOnePercentLow}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>0.1% Low</div>
            </div>
          </div>

          {/* Detail Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onOpenDetail(game); }}
            title="Open detailed analysis"
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: 'rgba(139, 92, 246, 0.15)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            <Activity size={18} style={{ color: '#a855f7' }} />
          </button>

          <ChevronDown
            size={20}
            style={{
              color: '#64748b',
              transition: 'transform 0.3s ease',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
            }}
          />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)',
            marginBottom: '20px'
          }} />

          {/* Build Trend Chart */}
          <div style={{
            background: 'rgba(15, 10, 35, 0.7)',
            borderRadius: '12px',
            padding: '16px',
            border: '1px solid rgba(139, 92, 246, 0.1)',
            marginBottom: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={14} style={{ color: '#a855f7' }} />
                <span style={{ fontSize: '15px', fontWeight: 500, color: '#e2e8f0' }}>
                  Build-over-Build Trend
                </span>
              </div>
              <DeltaBadge delta={delta} deltaPercent={deltaPercent} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ flex: 1, height: '60px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id={`trendGrad-${game.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={delta >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={delta >= 0 ? '#10b981' : '#ef4444'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="build" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip content={<TrendTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="avgFps"
                      stroke={delta >= 0 ? '#10b981' : '#ef4444'}
                      strokeWidth={2}
                      fill={`url(#trendGrad-${game.id})`}
                      dot={{ r: 4, fill: delta >= 0 ? '#10b981' : '#ef4444', strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                {trendData.map((d, i) => (
                  <div key={d.build} style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 600,
                      color: i === trendData.length - 1 ? (delta >= 0 ? '#10b981' : '#ef4444') : '#94a3b8'
                    }}>
                      {d.avgFps}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{d.build}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Metric Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <MetricCard label="Max FPS" value={metrics.maxFps} unit="fps" icon={TrendingUp} color="#10b981" />
            <MetricCard label="Min FPS" value={metrics.minFps} unit="fps" icon={TrendingDown} color="#ef4444" />
            <MetricCard label="CPU Usage" value={metrics.avgCpuUsage} unit="%" icon={Cpu} color="#06b6d4" />
            <MetricCard label="GPU Usage" value={metrics.avgGpuUsage} unit="%" icon={Monitor} color="#a855f7" />
            <MetricCard label="Avg Power" value={metrics.avgPower} unit="W" icon={Zap} color="#f59e0b" />
            <MetricCard label="Max Power" value={metrics.maxPower} unit="W" icon={Zap} color="#f97316" />
          </div>

          {/* Mini Charts Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '20px'
          }}>
            {/* Frame Time */}
            <div style={{
              background: 'rgba(15, 10, 35, 0.7)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(139, 92, 246, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Clock size={14} style={{ color: '#a855f7' }} />
                <span style={{ fontSize: '15px', fontWeight: 500, color: '#e2e8f0' }}>Frame Time</span>
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={frameTimeData}>
                  <defs>
                    <linearGradient id="ftGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="frame" hide />
                  <YAxis domain={[0, 30]} hide />
                  <Tooltip content={<CustomTooltip unit="ms" />} />
                  <Area type="monotone" dataKey="frameTime" stroke="#a855f7" strokeWidth={1.5} fill="url(#ftGrad)" name="Frame Time" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* CPU Frequency */}
            <div style={{
              background: 'rgba(15, 10, 35, 0.7)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(139, 92, 246, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Activity size={14} style={{ color: '#06b6d4' }} />
                <span style={{ fontSize: '15px', fontWeight: 500, color: '#e2e8f0' }}>CPU Frequency</span>
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <LineChart data={frequencyData}>
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[3000, 6000]} hide />
                  <Tooltip content={<CustomTooltip unit=" MHz" />} />
                  <Line type="monotone" dataKey="pCore0" stroke="#06b6d4" strokeWidth={1.5} dot={false} name="P-Core 0" />
                  <Line type="monotone" dataKey="pCore1" stroke="#22d3ee" strokeWidth={1.5} dot={false} name="P-Core 1" />
                  <Line type="monotone" dataKey="eCore0" stroke="#a855f7" strokeWidth={1.5} dot={false} name="E-Core 0" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Temperature */}
            <div style={{
              background: 'rgba(15, 10, 35, 0.7)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(139, 92, 246, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Thermometer size={14} style={{ color: '#f43f5e' }} />
                <span style={{ fontSize: '15px', fontWeight: 500, color: '#e2e8f0' }}>Temperature</span>
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={tempData}>
                  <defs>
                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[40, 100]} hide />
                  <Tooltip content={<CustomTooltip unit="°C" />} />
                  <Area type="monotone" dataKey="package" stroke="#f43f5e" strokeWidth={1.5} fill="url(#tempGrad)" name="Package" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detail Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {/* P-Core Frequency */}
            <div style={{
              background: 'rgba(15, 10, 35, 0.7)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(139, 92, 246, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4' }} />
                <span style={{ fontSize: '15px', fontWeight: 500, color: '#e2e8f0' }}>P-Core Frequency</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>Average</span>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: '#06b6d4' }}>{metrics.avgPCoreMhz} MHz</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>Maximum</span>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: '#10b981' }}>{metrics.maxPCoreMhz} MHz</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>Minimum</span>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: '#ef4444' }}>{metrics.minPCoreMhz} MHz</span>
                </div>
              </div>
            </div>

            {/* E-Core Frequency */}
            <div style={{
              background: 'rgba(15, 10, 35, 0.7)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(139, 92, 246, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a855f7' }} />
                <span style={{ fontSize: '15px', fontWeight: 500, color: '#e2e8f0' }}>E-Core Frequency</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>Average</span>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: '#a855f7' }}>{metrics.avgECoreMhz} MHz</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>Maximum</span>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: '#10b981' }}>{metrics.maxECoreMhz} MHz</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>Minimum</span>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: '#ef4444' }}>{metrics.minECoreMhz} MHz</span>
                </div>
              </div>
            </div>

            {/* Thermal */}
            <div style={{
              background: 'rgba(15, 10, 35, 0.7)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(139, 92, 246, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e' }} />
                <span style={{ fontSize: '15px', fontWeight: 500, color: '#e2e8f0' }}>Thermal</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>Avg Package</span>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: '#f59e0b' }}>{metrics.avgPackageTemp}°C</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>Max Package</span>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: '#f43f5e' }}>{metrics.maxPackageTemp}°C</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#64748b' }}>Headroom</span>
                  <span style={{ fontSize: '15px', fontWeight: 500, color: '#10b981' }}>{100 - metrics.maxPackageTemp}°C</span>
                </div>
              </div>
            </div>

            {/* Throttling */}
            <div style={{
              background: 'rgba(15, 10, 35, 0.7)',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(139, 92, 246, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <AlertTriangle size={14} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: '15px', fontWeight: 500, color: '#e2e8f0' }}>Throttling</span>
              </div>
              {metrics.throttling.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {metrics.throttling.map((reason, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.2)'
                    }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b' }} />
                      <span style={{ fontSize: '14px', color: '#f59e0b' }}>{reason}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)'
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ fontSize: '14px', color: '#10b981' }}>No throttling detected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCard;
