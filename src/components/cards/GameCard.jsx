import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { ChevronDown, Activity, Clock, Thermometer, Monitor, Cpu, Zap, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { getFpsColor, generateFrameTimeData, generateFrequencyData, generateTempData, getBuildTrend } from '../../utils';
import TrendSparkline from '../charts/TrendSparkline';
import { CustomTooltip, TrendTooltip } from '../charts/tooltips';
import DeltaBadge from '../common/DeltaBadge';
import GameImage from '../common/GameImage';
import MetricCard from './MetricCard';

const GameCard = ({ game, metrics, isExpanded, onToggle, skuId, currentBuild, onOpenDetail, iconSize = 48, animationDelay = 0 }) => {
  const frameTimeData = useMemo(() => generateFrameTimeData(), []);
  const frequencyData = useMemo(() => generateFrequencyData(), []);
  const tempData = useMemo(() => generateTempData(), []);
  const { trendData, delta, deltaPercent } = useMemo(
    () => getBuildTrend(game.id, skuId, currentBuild),
    [game.id, skuId, currentBuild]
  );

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
        className="p-6 flex items-center justify-between cursor-pointer"
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
                Last 4 Builds
              </div>
              {loading ? (
                <div className="w-20 h-8 bg-white/5 animate-pulse rounded" />
              ) : (
                <TrendSparkline data={trendData} delta={delta} />
              )}
            </div>
            <DeltaBadge delta={delta} deltaPercent={deltaPercent} />
          </div>

          <div className="w-px h-10 bg-primary/20" />

          {/* FPS Metrics */}
          <div className="flex items-center gap-8">
            <div className="text-center min-w-[50px]">
              <div className="text-3xl font-bold" style={{ color: getFpsColor(metrics.avgFps) }}>
                {metrics.avgFps}
              </div>
              <div className="text-[11px] text-slate-500 uppercase">Avg</div>
            </div>
            <div className="text-center min-w-[50px]">
              <div className="text-2xl font-semibold" style={{ color: getFpsColor(metrics.onePercentLow) }}>
                {metrics.onePercentLow}
              </div>
              <div className="text-[11px] text-slate-500 uppercase">1% Low</div>
            </div>
            <div className="text-center min-w-[50px]">
              <div className="text-2xl font-semibold" style={{ color: getFpsColor(metrics.pointOnePercentLow) }}>
                {metrics.pointOnePercentLow}
              </div>
              <div className="text-[11px] text-slate-500 uppercase">0.1% Low</div>
            </div>
          </div>

          {/* Detail Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onOpenDetail(game); }}
            title="Open detailed analysis"
            className="p-2 rounded-lg border-none bg-primary/15 cursor-pointer flex items-center justify-center transition-all hover:bg-primary/25"
          >
            <Activity size={18} className="text-primary" />
          </button>

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
                  Build-over-Build Trend
                </span>
              </div>
              <DeltaBadge delta={delta} deltaPercent={deltaPercent} />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex-1 h-[60px]">
                {loading ? (
                  <div className="w-full h-full bg-white/5 animate-pulse rounded-lg" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} key={game.id}>
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
                        isAnimationActive={true}
                        animationDuration={2000}
                        animationEasing="ease-in-out"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="flex gap-4">
                {trendData.map((d, i) => (
                  <div key={d.build} className="text-center">
                    <div className={`text-lg font-semibold ${i === trendData.length - 1 ? (delta >= 0 ? 'text-emerald-500' : 'text-red-500') : 'text-slate-400'}`}>
                      {d.avgFps}
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
          <div className="grid grid-cols-3 gap-4 mb-5">
            {/* Frame Time */}
            <div className="bg-[#0f0a23]/70 rounded-xl p-4 border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-primary" />
                <span className="text-[15px] font-medium text-slate-200">Frame Time</span>
              </div>
              <ResponsiveContainer width="100%" height={100}>
                {loading ? (
                  <div className="w-full h-full bg-white/5 animate-pulse rounded-lg" />
                ) : (
                  <AreaChart data={frameTimeData} key={`ft-${game.id}`}>
                    <defs>
                      <linearGradient id="ftGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="frame" hide />
                    <YAxis domain={[0, 30]} hide />
                    <Tooltip content={<CustomTooltip unit="ms" />} />
                    <Area
                      type="monotone"
                      dataKey="frameTime"
                      stroke="#a855f7"
                      strokeWidth={1.5}
                      fill="url(#ftGrad)"
                      name="Frame Time"
                      isAnimationActive={true}
                      animationDuration={2000}
                      animationEasing="ease-in-out"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* CPU Frequency */}
            <div className="bg-[#0f0a23]/70 rounded-xl p-4 border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={14} className="text-secondary" />
                <span className="text-[15px] font-medium text-slate-200">CPU Frequency</span>
              </div>
              <ResponsiveContainer width="100%" height={100}>
                {loading ? (
                  <div className="w-full h-full bg-white/5 animate-pulse rounded-lg" />
                ) : (
                  <LineChart data={frequencyData} key={`freq-${game.id}`}>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[3000, 6000]} hide />
                    <Tooltip content={<CustomTooltip unit=" MHz" />} />
                    <Line type="monotone" dataKey="pCore0" stroke="#06b6d4" strokeWidth={1.5} dot={false} name="P-Core 0" isAnimationActive={true} animationDuration={2000} animationEasing="ease-in-out" />
                    <Line type="monotone" dataKey="pCore1" stroke="#22d3ee" strokeWidth={1.5} dot={false} name="P-Core 1" isAnimationActive={true} animationDuration={2200} animationEasing="ease-in-out" />
                    <Line type="monotone" dataKey="eCore0" stroke="#a855f7" strokeWidth={1.5} dot={false} name="E-Core 0" isAnimationActive={true} animationDuration={2400} animationEasing="ease-in-out" />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Temperature */}
            <div className="bg-[#0f0a23]/70 rounded-xl p-4 border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <Thermometer size={14} className="text-rose-500" />
                <span className="text-[15px] font-medium text-slate-200">Temperature</span>
              </div>
              <ResponsiveContainer width="100%" height={100}>
                {loading ? (
                  <div className="w-full h-full bg-white/5 animate-pulse rounded-lg" />
                ) : (
                  <AreaChart data={tempData} key={`temp-${game.id}`}>
                    <defs>
                      <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[40, 100]} hide />
                    <Tooltip content={<CustomTooltip unit="°C" />} />
                    <Area
                      type="monotone"
                      dataKey="package"
                      stroke="#f43f5e"
                      strokeWidth={1.5}
                      fill="url(#tempGrad)"
                      name="Package"
                      isAnimationActive={true}
                      animationDuration={2000}
                      animationEasing="ease-in-out"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
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
                  <span className="text-[15px] font-medium text-secondary">{metrics.avgPCoreMhz} MHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Maximum</span>
                  <span className="text-[15px] font-medium text-emerald-500">{metrics.maxPCoreMhz} MHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Minimum</span>
                  <span className="text-[15px] font-medium text-red-500">{metrics.minPCoreMhz} MHz</span>
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
                  <span className="text-[15px] font-medium text-primary">{metrics.avgECoreMhz} MHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Maximum</span>
                  <span className="text-[15px] font-medium text-emerald-500">{metrics.maxECoreMhz} MHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Minimum</span>
                  <span className="text-[15px] font-medium text-red-500">{metrics.minECoreMhz} MHz</span>
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
                  <span className="text-[15px] font-medium text-amber-500">{metrics.avgPackageTemp}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Max Package</span>
                  <span className="text-[15px] font-medium text-rose-500">{metrics.maxPackageTemp}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Headroom</span>
                  <span className="text-[15px] font-medium text-emerald-500">{100 - metrics.maxPackageTemp}°C</span>
                </div>
              </div>
            </div>

            {/* Throttling */}
            <div className="bg-[#0f0a23]/70 rounded-xl p-4 border border-primary/10">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-amber-500" />
                <span className="text-[15px] font-medium text-slate-200">Throttling</span>
              </div>
              {metrics.throttling.length > 0 ? (
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
