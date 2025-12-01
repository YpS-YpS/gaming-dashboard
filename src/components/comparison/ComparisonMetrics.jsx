import React from 'react';
import { TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react';

const MetricComparison = ({ label, leftValue, rightValue, unit, format = 'number', higherIsBetter = true }) => {
  const left = typeof leftValue === 'number' ? leftValue : 0;
  const right = typeof rightValue === 'number' ? rightValue : 0;
  const diff = right - left;
  const diffPercent = left !== 0 ? ((right - left) / left) * 100 : 0;
  
  const isNeutral = Math.abs(diffPercent) < 1;
  const isImprovement = higherIsBetter ? diff > 0 : diff < 0;
  
  let diffColor, DiffIcon;
  if (isNeutral) {
    diffColor = '#64748b';
    DiffIcon = Minus;
  } else if (isImprovement) {
    diffColor = '#10b981';
    DiffIcon = TrendingUp;
  } else {
    diffColor = '#ef4444';
    DiffIcon = TrendingDown;
  }

  const formatValue = (val) => {
    if (format === 'decimal') return val.toFixed(1);
    if (format === 'temp') return `${Math.round(val)}°C`;
    if (format === 'power') return `${Math.round(val)}W`;
    if (format === 'mhz') return `${Math.round(val)} MHz`;
    return Math.round(val);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      padding: '12px 16px',
      background: 'rgba(15, 10, 35, 0.5)',
      borderRadius: '10px',
      border: '1px solid rgba(139, 92, 246, 0.1)'
    }}>
      {/* Left Value */}
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#06b6d4' }}>
          {formatValue(left)}{unit && <span style={{ fontSize: '14px', color: '#64748b', marginLeft: '2px' }}>{unit}</span>}
        </div>
      </div>

      {/* Center - Label & Delta */}
      <div style={{ textAlign: 'center', padding: '0 20px' }}>
        <div style={{
          fontSize: '12px',
          color: '#64748b',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '4px'
        }}>
          {label}
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          borderRadius: '6px',
          background: `${diffColor}15`
        }}>
          <DiffIcon size={14} style={{ color: diffColor }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: diffColor }}>
            {diff >= 0 && !isNeutral ? '+' : ''}{diffPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Right Value */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#ec4899' }}>
          {formatValue(right)}{unit && <span style={{ fontSize: '14px', color: '#64748b', marginLeft: '2px' }}>{unit}</span>}
        </div>
      </div>
    </div>
  );
};

const ComparisonMetrics = ({ leftMetrics, rightMetrics, leftLabel, rightLabel }) => {
  const metricGroups = [
    {
      title: 'FPS Performance',
      metrics: [
        { key: 'avgFps', label: 'Average FPS', unit: '', higherIsBetter: true },
        { key: 'onePercentLow', label: '1% Low', unit: '', higherIsBetter: true },
        { key: 'pointOnePercentLow', label: '0.1% Low', unit: '', higherIsBetter: true },
        { key: 'maxFps', label: 'Max FPS', unit: '', higherIsBetter: true },
        { key: 'minFps', label: 'Min FPS', unit: '', higherIsBetter: true },
      ]
    },
    {
      title: 'CPU Frequency',
      metrics: [
        { key: 'avgPCoreMhz', label: 'Avg P-Core', unit: '', format: 'mhz', higherIsBetter: true },
        { key: 'maxPCoreMhz', label: 'Max P-Core', unit: '', format: 'mhz', higherIsBetter: true },
        { key: 'avgECoreMhz', label: 'Avg E-Core', unit: '', format: 'mhz', higherIsBetter: true },
        { key: 'maxECoreMhz', label: 'Max E-Core', unit: '', format: 'mhz', higherIsBetter: true },
      ]
    },
    {
      title: 'Thermal & Power',
      metrics: [
        { key: 'avgPackageTemp', label: 'Avg Package Temp', unit: '', format: 'temp', higherIsBetter: false },
        { key: 'maxPackageTemp', label: 'Max Package Temp', unit: '', format: 'temp', higherIsBetter: false },
        { key: 'avgPower', label: 'Avg Power Draw', unit: '', format: 'power', higherIsBetter: false },
        { key: 'maxPower', label: 'Max Power Draw', unit: '', format: 'power', higherIsBetter: false },
      ]
    },
    {
      title: 'Utilization',
      metrics: [
        { key: 'avgCpuUsage', label: 'CPU Usage', unit: '%', higherIsBetter: true },
        { key: 'avgGpuUsage', label: 'GPU Usage', unit: '%', higherIsBetter: true },
      ]
    }
  ];

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '0 16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#06b6d4' }} />
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#06b6d4' }}>{leftLabel}</span>
        </div>
        <ArrowRight size={20} style={{ color: '#64748b' }} />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '8px'
        }}>
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#ec4899' }}>{rightLabel}</span>
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ec4899' }} />
        </div>
      </div>

      {/* Metric Groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {metricGroups.map((group) => (
          <div key={group.title}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#94a3b8',
              marginBottom: '12px',
              paddingLeft: '4px'
            }}>
              {group.title}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {group.metrics.map((metric) => (
                <MetricComparison
                  key={metric.key}
                  label={metric.label}
                  leftValue={leftMetrics[metric.key]}
                  rightValue={rightMetrics[metric.key]}
                  unit={metric.unit}
                  format={metric.format}
                  higherIsBetter={metric.higherIsBetter}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComparisonMetrics;
