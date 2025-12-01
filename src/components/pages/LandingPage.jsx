import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { programs, builds, games } from '../../data';
import { calculatePerformanceIndex } from '../../utils';
import DeltaBadge from '../common/DeltaBadge';

const LandingPage = ({ onNavigate }) => {
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
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{
          margin: 0,
          fontSize: '40px',
          fontWeight: 700,
          background: 'linear-gradient(90deg, #a855f7, #06b6d4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px'
        }}>
          Performance Index Trends Across SKUs
        </h1>
        <p style={{ margin: 0, fontSize: '16px', color: '#64748b' }}>
          Aggregate gaming performance index across all {games.length} games
        </p>
      </div>

      {programs.map(program => (
        <div key={program.id} style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <span style={{ fontSize: '28px' }}>{program.icon}</span>
            <h2 style={{ margin: 0, fontSize: '26px', fontWeight: 600, color: '#f1f5f9' }}>
              {program.name}
            </h2>
            <span style={{
              fontSize: '13px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: 600,
              background: `${program.color}20`,
              color: program.color
            }}>
              {program.codename}
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(program.skus.length, 4)}, 1fr)`,
            gap: '16px'
          }}>
            {skuData.filter(d => d.program.id === program.id).map(({ sku, buildData, latestIndex, delta, deltaPercent }) => (
              <div
                key={sku.id}
                onClick={() => onNavigate(program, sku)}
                style={{
                  background: 'rgba(20, 15, 45, 0.6)',
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1px solid rgba(139, 92, 246, 0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${program.color}50`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.15)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: program.color }}>
                      {sku.name}
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                      {sku.fullName}
                    </p>
                  </div>
                  <DeltaBadge delta={delta} deltaPercent={deltaPercent} />
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Performance Index
                  </div>
                  <div style={{ fontSize: '42px', fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>
                    {latestIndex}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    avg FPS across {games.length} games
                  </div>
                </div>

                <div style={{ height: '60px', marginBottom: '12px' }}>
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
                        <div style={{
                          background: 'rgba(15, 10, 40, 0.95)',
                          border: `1px solid ${program.color}50`,
                          borderRadius: '8px',
                          padding: '8px 12px'
                        }}>
                          <p style={{ fontSize: '10px', color: program.color, marginBottom: '4px', fontWeight: 600 }}>
                            Build {payload[0].payload.build}
                          </p>
                          <p style={{ fontSize: '14px', color: '#f1f5f9', margin: 0, fontWeight: 700 }}>
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
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{
                    fontSize: '12px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    color: '#94a3b8'
                  }}>
                    {sku.cores}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: 'rgba(139, 92, 246, 0.1)',
                    color: '#94a3b8'
                  }}>
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
