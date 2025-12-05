import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { programs, builds, games } from '../../data';
import { calculatePerformanceIndex } from '../../utils';
import DeltaBadge from '../common/DeltaBadge';

const LandingPage = ({ onNavigate, isReady = true }) => {
  const getAllSkuData = () => {
    const data = [];
    programs.forEach(program => {
      program.skus.forEach(sku => {
        const buildData = builds.map(build => ({
          build,
          index: calculatePerformanceIndex(sku.id, build)
        }));
        const latest = buildData[0].index;
        const previous = buildData[1]?.index || latest;
        data.push({
          program,
          sku,
          buildData: buildData.slice().reverse(),
          latestIndex: latest,
          delta: latest - previous,
          deltaPercent: ((latest - previous) / previous) * 100
        });
      });
    });
    return data;
  };

  const skuData = getAllSkuData();

  return (
    <div className="p-8">
      <div className="mb-10 text-center">
        <h1 className="m-0 text-5xl md:text-7xl font-black bg-gradient-to-r from-[#d946ef] via-white to-[#7c3aed] bg-clip-text text-transparent mb-4 tracking-tight drop-shadow-2xl">
          Performance Index Trends Across SKUs
        </h1>
        <p className="m-0 text-base text-slate-500">
          Aggregate gaming performance index across all {games.length} games
        </p>
      </div>

      {programs.map(program => (
        <div key={program.id} className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-3xl">{program.icon}</span>
            <h2 className="m-0 text-2xl font-semibold text-slate-50">
              {program.name}
            </h2>
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
            {skuData.filter(d => d.program.id === program.id).map(({ sku, buildData, latestIndex, delta, deltaPercent }) => (
              <div
                key={sku.id}
                onClick={() => onNavigate(program, sku)}
                className="bg-[#140f2d]/60 rounded-2xl p-5 border border-primary/15 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 group"
                style={{ borderColor: 'rgba(139, 92, 246, 0.15)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${program.color}50`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.15)';
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="m-0 text-xl font-bold" style={{ color: program.color }}>
                      {sku.name}
                    </h3>
                    <p className="m-0 mt-1 text-[13px] text-slate-500">
                      {sku.fullName}
                    </p>
                  </div>
                  <DeltaBadge delta={delta} deltaPercent={deltaPercent} />
                </div>

                <div className="mb-4">
                  <div className="text-xs text-slate-500 uppercase mb-1">
                    Performance Index
                  </div>
                  <div className="text-[42px] font-bold text-slate-50 leading-none">
                    {latestIndex}
                  </div>
                  <div className="text-[13px] text-slate-500">
                    avg FPS across {games.length} games
                  </div>
                </div>

                <div className="h-[60px] mb-3">
                  {isReady && (
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
                            <p className="text-sm font-bold text-slate-50 m-0">
                              {payload[0].value} avg FPS
                            </p>
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

                <div className="flex gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-slate-400">
                    {sku.cores}
                  </span>
                  <span className="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-slate-400">
                    {sku.tdp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default LandingPage;
