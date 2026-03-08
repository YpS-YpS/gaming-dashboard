import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { usePrograms } from '../../data';
import { usePerformanceIndex } from '../../hooks/usePerformanceIndex';
import DeltaBadge from '../common/DeltaBadge';

const SkuCard = ({ program, sku, onNavigate, isReady }) => {
  const { data, loading } = usePerformanceIndex(sku.id);

  const hasData = data && data.length > 0;
  const buildData = hasData ? data.slice().reverse().map(d => ({ build: d.build_id, index: d.perf_index })) : [];
  const latestIndex = hasData ? data[0].perf_index : null;
  const gameCount = hasData ? data[0].game_count : 0;
  const previous = hasData && data.length > 1 ? data[1].perf_index : latestIndex;
  const delta = hasData ? latestIndex - previous : 0;
  const deltaPercent = hasData && previous ? ((latestIndex - previous) / previous) * 100 : 0;

  if (loading) {
    return (
      <div className="bg-[#140f2d]/60 rounded-2xl p-5 border border-primary/15 animate-pulse">
        <div className="h-6 w-24 bg-primary/20 rounded mb-2" />
        <div className="h-4 w-36 bg-primary/10 rounded mb-4" />
        <div className="h-12 w-20 bg-primary/15 rounded mb-3" />
        <div className="h-[60px] bg-primary/5 rounded" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="bg-[#140f2d]/30 rounded-2xl p-5 border border-slate-700/30 opacity-50 cursor-default">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="m-0 text-xl font-bold text-slate-600">
              {sku.name}
            </h3>
            <p className="m-0 mt-1 text-[13px] text-slate-600">
              {sku.fullName}
            </p>
          </div>
        </div>
        <div className="mb-4">
          <div className="text-xs text-slate-600 uppercase mb-1">Performance Index</div>
          <div className="text-lg font-semibold text-slate-600">No data available</div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-700/20 text-slate-600">{sku.cores}</span>
          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-700/20 text-slate-600">{sku.tdp}</span>
          {sku.graphics && (
            <span className="text-xs px-2.5 py-1 rounded-md bg-slate-700/20 text-slate-600">
              {sku.graphics}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onNavigate(program, sku)}
      className="bg-[#140f2d]/60 rounded-2xl p-5 border border-primary/15 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 group"
      style={{ borderColor: 'rgba(139, 92, 246, 0.15)' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${program.color}50`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.15)'; }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="m-0 text-xl font-bold" style={{ color: program.color }}>
            {sku.name}
          </h3>
          <p className="m-0 mt-1 text-[13px] text-slate-500">{sku.fullName}</p>
        </div>
        <DeltaBadge delta={delta} deltaPercent={deltaPercent} />
      </div>

      <div className="mb-4">
        <div className="text-xs text-slate-500 uppercase mb-1">Performance Index</div>
        <div className="text-[42px] font-bold text-slate-50 leading-none">{latestIndex}</div>
        <div className="text-[13px] text-slate-500">avg FPS across {gameCount} games</div>
      </div>

      <div className="h-[60px] mb-3">
        {isReady && buildData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={buildData}>
              <defs>
                <linearGradient id={`landingGrad-${sku.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={program.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={program.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="build" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
              <Tooltip content={({ active, payload }) => active && payload?.length ? (
                <div className="bg-[#0f0a28]/95 border rounded-lg p-2 px-3" style={{ borderColor: `${program.color}50` }}>
                  <p className="text-[10px] font-semibold mb-1" style={{ color: program.color }}>
                    Build {payload[0].payload.build}
                  </p>
                  <p className="text-sm font-bold text-slate-50 m-0">{payload[0].value} avg FPS</p>
                </div>
              ) : null} />
              <Area
                type="monotone"
                dataKey="index"
                stroke={program.color}
                strokeWidth={2}
                fill={`url(#landingGrad-${sku.id})`}
                dot={{ r: 3, fill: program.color, strokeWidth: 0 }}
                animationDuration={1500}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <span className="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-slate-400">{sku.cores}</span>
        <span className="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-slate-400">{sku.tdp}</span>
        {sku.graphics && (
          <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${
            sku.graphics === 'dGFX'
              ? 'bg-blue-500/15 text-blue-400'
              : 'bg-amber-500/15 text-amber-400'
          }`}>
            {sku.graphics}{sku.gpu ? ` · ${sku.gpu}` : ''}
          </span>
        )}
      </div>
    </div>
  );
};

const LandingPage = ({ onNavigate, isReady = true }) => {
  const { programs } = usePrograms();
  return (
    <div className="p-8">
      <div className="mb-10 text-center">
        <h1 className="m-0 text-5xl md:text-7xl font-black bg-gradient-to-r from-[#d946ef] via-white to-[#7c3aed] bg-clip-text text-transparent mb-4 tracking-tight drop-shadow-2xl">
          Performance Index Trends Across SKUs
        </h1>
        <p className="m-0 text-base text-slate-500">
          Aggregate gaming performance index across all tested games
        </p>
      </div>

      {programs.map(program => (
        <div key={program.id} className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-3xl">{program.icon}</span>
            <h2 className="m-0 text-2xl font-semibold text-slate-50">{program.name}</h2>
            <span
              className="text-[13px] px-2.5 py-1 rounded-md font-semibold"
              style={{ background: `${program.color}20`, color: program.color }}
            >
              {program.codename}
            </span>
          </div>

          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${Math.min(program.skus.length, 4)}, 1fr)` }}
          >
            {program.skus.map(sku => (
              <SkuCard
                key={sku.id}
                program={program}
                sku={sku}
                onNavigate={onNavigate}
                isReady={isReady}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LandingPage;
