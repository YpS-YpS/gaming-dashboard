import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { ChevronDown, Activity, Thermometer, Monitor, Cpu, Zap, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { getFpsColor } from '../../utils';
import { useTimeseries } from '../../hooks/useGameData';
import TrendSparkline from '../charts/TrendSparkline';
import { CustomTooltip, TrendTooltip } from '../charts/tooltips';
import DeltaBadge from '../common/DeltaBadge';
import GameImage from '../common/GameImage';
import MetricCard from './MetricCard';

const GameCard = ({ game, metrics, isExpanded, onToggle, skuId, currentBuild, onOpenDetail, iconSize = 64, animationDelay = 0, showCharts = true }) => {
  // Single-point trend: just the current build's FPS
  const trendData = useMemo(() => {
    if (!metrics || !currentBuild) return [];
    return [{ build: currentBuild, avgFps: metrics.avgFps }];
  }, [metrics, currentBuild]);
  const delta = 0;
  const deltaPercent = 0;

  // Lazily fetch timeseries when expanded
  const { data: tsData, loading: tsLoading } = useTimeseries(
    isExpanded ? game.slug : null,
    skuId,
    currentBuild,
    ['frametimes', 'frequency', 'temperature', 'power'], 2000
  );

  // Extract chart data from timeseries API response
  const frameTimeData = tsData?.frametimes || [];
  const frequencyData = tsData?.frequency || [];
  const tempData = tsData?.temperature || [];
  const powerData = tsData?.power || [];

  const [loading, setLoading] = React.useState(!!animationDelay);

  React.useEffect(() => {
    if (animationDelay) {
      const timer = setTimeout(() => setLoading(false), animationDelay);
      return () => clearTimeout(timer);
    }
  }, [animationDelay]);

  return (
    <div className={`
      rounded-2xl overflow-hidden transition-all duration-300
      ${isExpanded
        ? 'bg-[#1e143c]/80 border border-primary/40'
        : 'bg-[#140f2d]/60 border border-primary/10'}
    `}>
      {/* Header Row */}
      <div
        onClick={onToggle}
        className="px-3 py-3 flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-4 flex-1">
          <GameImage game={game} size={iconSize} borderRadius={12} style={{ height: iconSize }} />
          <div className="min-w-[200px]">
            <h3 className="m-0 text-[17px] font-semibold text-slate-50">
              {game.name}
            </h3>
            <span className="text-sm text-slate-500">{game.genre}</span>
          </div>
        </div>

        <div className="flex items-center gap-8">
          {/* Trend */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-0.5">
                Build History
              </div>
              {loading ? (
                <div className="w-20 h-8 bg-white/5 animate-pulse rounded" />
              ) : trendData.length > 0 ? (
                <TrendSparkline data={trendData} delta={delta} />
              ) : (
                <div className="w-20 h-8 flex items-center justify-center text-xs text-slate-600">—</div>
              )}
            </div>
            <DeltaBadge delta={delta} deltaPercent={deltaPercent} />
          </div>

          <div className="w-px h-10 bg-primary/20" />

          {/* FPS Metrics */}
          <div className="flex items-center gap-8">
            <div className="text-center min-w-[50px]">
              <div className="text-3xl font-bold" style={{ color: getFpsColor(metrics.avgFps) }}>
                {Math.round(metrics.avgFps)}
              </div>

              <div className="text-[11px] text-slate-500 uppercase">Avg</div>
            </div>
            <div className="text-center min-w-[50px]">
              <div className="text-2xl font-semibold" style={{ color: getFpsColor(metrics.onePercentLow) }}>
                {Math.round(metrics.onePercentLow)}
              </div>

              <div className="text-[11px] text-slate-500 uppercase">1% Low</div>
            </div>
            <div className="text-center min-w-[50px]">
              <div className="text-2xl font-semibold" style={{ color: getFpsColor(metrics.pointOnePercentLow) }}>
                {Math.round(metrics.pointOnePercentLow)}
              </div>

              <div className="text-[11px] text-slate-500 uppercase">0.1% Low</div>
            </div>
          </div>

          {/* Detail Button */}
          <div className="relative flex items-center justify-center">
            {isExpanded && (
              <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#7c3aed] via-[#d946ef] to-[#00C7FD] animate-[beacon_1.5s_ease-out_infinite]" />
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onOpenDetail(game); }}
              title="Open detailed analysis"
              className={`
                relative p-3 rounded-xl border-none cursor-pointer flex items-center justify-center transition-all
                ${isExpanded
                  ? 'bg-gradient-to-r from-[#7c3aed] via-[#d946ef] to-[#00C7FD]'
                  : 'bg-primary/15 hover:bg-primary/25'}
              `}
            >
              <Activity size={22} className={`${isExpanded ? 'text-white' : 'text-primary'}`} />
            </button>
          </div>

          <ChevronDown
            size={20}
            className={`text-slate-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
          />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6">
          <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent mb-5" />

          {/* Build Trend Chart */}
          <div className="bg-[#0f0a23]/70 rounded-xl p-4 border border-primary/10 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-primary" />
                <span className="text-[15px] font-medium text-slate-200">
                  Build History
                </span>
              </div>
              <DeltaBadge delta={delta} deltaPercent={deltaPercent} />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex-1 h-[60px]">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} key={`${game.id}-${skuId}-${currentBuild}`}>
                      <defs>
                        <linearGradient id={`trendGrad-${game.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="build" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                      <Tooltip content={<TrendTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="avgFps"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill={`url(#trendGrad-${game.id})`}
                        dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                        isAnimationActive={true}
                        animationDuration={2000}
                        animationEasing="ease-in-out"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-slate-600">
                    No build history available
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                {trendData.map((d) => (
                  <div key={d.build} className="text-center">
                    <div className="text-lg font-semibold text-emerald-500">
                      {Math.round(d.avgFps)}
                    </div>
                    <div className="text-[11px] text-slate-500">{d.build}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-6 gap-3 mb-5">
            <MetricCard label="Max FPS" value={metrics.maxFps} unit="fps" icon={TrendingUp} color="#10b981" />
            <MetricCard label="Min FPS" value={metrics.minFps} unit="fps" icon={TrendingDown} color="#ef4444" />
            <MetricCard label="CPU Usage" value={metrics.avgCpuUsage} unit="%" icon={Cpu} color="#06b6d4" />
            <MetricCard label="GPU Usage" value={metrics.avgGpuUsage} unit="%" icon={Monitor} color="#a855f7" />
            <MetricCard label="Avg Power" value={metrics.avgPower} unit="W" icon={Zap} color="#f59e0b" />
            <MetricCard label="Max Power" value={metrics.maxPower} unit="W" icon={Zap} color="#f97316" />
          </div>

          {/* Mini Charts Row */}
          <div className="grid grid-cols-4 gap-4 mb-5">
            {/* FPS */}
            <div className="bg-[#0f0a23]/70 rounded-xl p-4 border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={14} className="text-emerald-500" />
                <span className="text-[15px] font-medium text-slate-200">FPS</span>
              </div>
              <div className="relative h-[100px]">
                <div className={`absolute inset-0 bg-white/5 rounded-lg transition-opacity duration-700 ${!tsLoading && frameTimeData.length > 0 && showCharts ? 'opacity-0' : 'opacity-100 animate-pulse'}`} />
                {!tsLoading && frameTimeData.length > 0 && (
                  <div className={`absolute inset-0 transition-opacity duration-700 ${showCharts ? 'opacity-100' : 'opacity-0'}`}>
                    <ResponsiveContainer width="100%" height={100}>
                      <AreaChart data={frameTimeData} key={showCharts ? `fps-${game.id}-active` : `fps-${game.id}-pre`}>
                        <defs>
                          <linearGradient id="fpsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="frame" hide />
                        <YAxis domain={[0, 'dataMax + 20']} hide />
                        <Tooltip content={<CustomTooltip unit=" FPS" />} />
                        <Area type="monotone" dataKey="fps" stroke="#10b981" strokeWidth={1.5} fill="url(#fpsGrad)" name="FPS" isAnimationActive={showCharts} animationDuration={2000} animationEasing="ease-in-out" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* CPU Frequency */}
            <div className="bg-[#0f0a23]/70 rounded-xl p-4 border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={14} className="text-secondary" />
                <span className="text-[15px] font-medium text-slate-200">CPU Frequency</span>
              </div>
              <div className="relative h-[100px]">
                <div className={`absolute inset-0 bg-white/5 rounded-lg transition-opacity duration-700 ${!tsLoading && frequencyData.length > 0 && showCharts ? 'opacity-0' : 'opacity-100 animate-pulse'}`} />
                {!tsLoading && frequencyData.length > 0 && (
                  <div className={`absolute inset-0 transition-opacity duration-700 ${showCharts ? 'opacity-100' : 'opacity-0'}`}>
                    <ResponsiveContainer width="100%" height={100}>
                      <LineChart data={frequencyData} key={showCharts ? `freq-${game.id}-active` : `freq-${game.id}-pre`}>
                        <XAxis dataKey="time" hide />
                        <YAxis domain={['dataMin - 200', 'dataMax + 200']} hide />
                        <Tooltip content={<CustomTooltip unit=" MHz" />} />
                        <Line type="monotone" dataKey="pCore0" stroke="#a855f7" strokeWidth={1.5} dot={false} name="P-Core 0" isAnimationActive={showCharts} animationDuration={2000} animationEasing="ease-in-out" />
                        <Line type="monotone" dataKey="pCore1" stroke="#8b5cf6" strokeWidth={1.5} dot={false} name="P-Core 1" isAnimationActive={showCharts} animationDuration={2000} animationEasing="ease-in-out" />
                        <Line type="monotone" dataKey="pCore2" stroke="#7c3aed" strokeWidth={1.5} dot={false} name="P-Core 2" isAnimationActive={showCharts} animationDuration={2000} animationEasing="ease-in-out" />
                        <Line type="monotone" dataKey="pCore3" stroke="#6d28d9" strokeWidth={1.5} dot={false} name="P-Core 3" isAnimationActive={showCharts} animationDuration={2000} animationEasing="ease-in-out" />
                        <Line type="monotone" dataKey="eCore0" stroke="#10b981" strokeWidth={1.5} dot={false} name="E-Core 0" strokeDasharray="4 2" isAnimationActive={showCharts} animationDuration={2000} animationEasing="ease-in-out" />
                        <Line type="monotone" dataKey="eCore1" stroke="#059669" strokeWidth={1.5} dot={false} name="E-Core 1" strokeDasharray="4 2" isAnimationActive={showCharts} animationDuration={2000} animationEasing="ease-in-out" />
                        <Line type="monotone" dataKey="eCore2" stroke="#047857" strokeWidth={1.5} dot={false} name="E-Core 2" strokeDasharray="4 2" isAnimationActive={showCharts} animationDuration={2000} animationEasing="ease-in-out" />
                        <Line type="monotone" dataKey="eCore3" stroke="#065f46" strokeWidth={1.5} dot={false} name="E-Core 3" strokeDasharray="4 2" isAnimationActive={showCharts} animationDuration={2000} animationEasing="ease-in-out" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Temperature */}
            <div className="bg-[#0f0a23]/70 rounded-xl p-4 border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <Thermometer size={14} className="text-rose-500" />
                <span className="text-[15px] font-medium text-slate-200">Temperature</span>
              </div>
              <div className="relative h-[100px]">
                <div className={`absolute inset-0 bg-white/5 rounded-lg transition-opacity duration-700 ${!tsLoading && tempData.length > 0 && showCharts ? 'opacity-0' : 'opacity-100 animate-pulse'}`} />
                {!tsLoading && tempData.length > 0 && (
                  <div className={`absolute inset-0 transition-opacity duration-700 ${showCharts ? 'opacity-100' : 'opacity-0'}`}>
                    <ResponsiveContainer width="100%" height={100}>
                      <AreaChart data={tempData} key={showCharts ? `temp-${game.id}-active` : `temp-${game.id}-pre`}>
                        <defs>
                          <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" hide />
                        <YAxis domain={[40, 100]} hide />
                        <Tooltip content={<CustomTooltip unit="°C" />} />
                        <Area type="monotone" dataKey="package" stroke="#f43f5e" strokeWidth={1.5} fill="url(#tempGrad)" name="Package" isAnimationActive={showCharts} animationDuration={2000} animationEasing="ease-in-out" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Package Power */}
            <div className="bg-[#0f0a23]/70 rounded-xl p-4 border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={14} className="text-amber-500" />
                <span className="text-[15px] font-medium text-slate-200">Package Power</span>
              </div>
              <div className="relative h-[100px]">
                <div className={`absolute inset-0 bg-white/5 rounded-lg transition-opacity duration-700 ${!tsLoading && powerData.length > 0 && showCharts ? 'opacity-0' : 'opacity-100 animate-pulse'}`} />
                {!tsLoading && powerData.length > 0 && (
                  <div className={`absolute inset-0 transition-opacity duration-700 ${showCharts ? 'opacity-100' : 'opacity-0'}`}>
                    <ResponsiveContainer width="100%" height={100}>
                      <AreaChart data={powerData} key={showCharts ? `pwr-${game.id}-active` : `pwr-${game.id}-pre`}>
                        <defs>
                          <linearGradient id="pwrGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="time" hide />
                        <YAxis domain={[0, 'dataMax + 10']} hide />
                        <Tooltip content={<CustomTooltip unit="W" />} />
                        <Area type="monotone" dataKey="packagePower" stroke="#f59e0b" strokeWidth={1.5} fill="url(#pwrGrad)" name="Pkg Power" isAnimationActive={showCharts} animationDuration={2000} animationEasing="ease-in-out" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detail Cards Row */}
          <div className="grid grid-cols-4 gap-4">
            {/* P-Core Frequency */}
            <div className="bg-[#0f0a23]/70 rounded-xl p-4 border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-secondary" />
                <span className="text-[15px] font-medium text-slate-200">P-Core Frequency</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Average</span>
                  <span className="text-[15px] font-medium text-secondary">{metrics.avgPCoreMhz ?? '—'} MHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Maximum</span>
                  <span className="text-[15px] font-medium text-emerald-500">{metrics.maxPCoreMhz ?? '—'} MHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Minimum</span>
                  <span className="text-[15px] font-medium text-amber-500">{metrics.minPCoreMhz ?? '—'} MHz</span>
                </div>
              </div>
            </div>

            {/* E-Core Frequency */}
            <div className="bg-[#0f0a23]/70 rounded-xl p-4 border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <span className="text-[15px] font-medium text-slate-200">E-Core Frequency</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Average</span>
                  <span className="text-[15px] font-medium text-primary">{metrics.avgECoreMhz ?? '—'} MHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Maximum</span>
                  <span className="text-[15px] font-medium text-emerald-500">{metrics.maxECoreMhz ?? '—'} MHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Minimum</span>
                  <span className="text-[15px] font-medium text-amber-500">{metrics.minECoreMhz ?? '—'} MHz</span>
                </div>
              </div>
            </div>

            {/* Thermal */}
            <div className="bg-[#0f0a23]/70 rounded-xl p-4 border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-[15px] font-medium text-slate-200">Thermal</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Avg Package</span>
                  <span className="text-[15px] font-medium text-amber-500">{metrics.avgPackageTemp ?? '—'}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Max Package</span>
                  <span className="text-[15px] font-medium text-rose-500">{metrics.maxPackageTemp ?? '—'}°C</span>
                </div>
                {metrics.maxPackageTemp != null && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Headroom</span>
                    <span className="text-[15px] font-medium text-emerald-500">{100 - metrics.maxPackageTemp}°C</span>
                  </div>
                )}
              </div>
            </div>

            {/* Throttling */}
            <div className="bg-[#0f0a23]/70 rounded-xl p-4 border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-amber-500" />
                <span className="text-[15px] font-medium text-slate-200">Throttling</span>
              </div>
              {metrics.throttling && metrics.throttling.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {metrics.throttling.map((reason, i) => (
                    <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="text-sm text-amber-500">{reason}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-sm text-emerald-500">No throttling detected</span>
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
