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
    <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-[#0f0a23]/50 rounded-xl border border-primary/10">
      {/* Left Value */}
      <div className="text-left">
        <div className="text-2xl font-bold text-[#06b6d4]">
          {formatValue(left)}{unit && <span className="text-sm text-slate-500 ml-0.5">{unit}</span>}
        </div>
      </div>

      {/* Center - Label & Delta */}
      <div className="text-center px-5">
        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
          {label}
        </div>
        <div
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md"
          style={{ background: `${diffColor}15` }}
        >
          <DiffIcon size={14} style={{ color: diffColor }} />
          <span className="text-[13px] font-semibold" style={{ color: diffColor }}>
            {diff >= 0 && !isNeutral ? '+' : ''}{diffPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Right Value */}
      <div className="text-right">
        <div className="text-2xl font-bold text-[#ec4899]">
          {formatValue(right)}{unit && <span className="text-sm text-slate-500 ml-0.5">{unit}</span>}
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
      <div className="grid grid-cols-[1fr_auto_1fr] items-center mb-5 px-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#06b6d4]" />
          <span className="text-base font-semibold text-[#06b6d4]">{leftLabel}</span>
        </div>
        <ArrowRight size={20} className="text-slate-500" />
        <div className="flex items-center justify-end gap-2">
          <span className="text-base font-semibold text-[#ec4899]">{rightLabel}</span>
          <div className="w-3 h-3 rounded-full bg-[#ec4899]" />
        </div>
      </div>

      {/* Metric Groups */}
      <div className="flex flex-col gap-6">
        {metricGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-sm font-semibold text-slate-400 mb-3 pl-1">
              {group.title}
            </h3>
            <div className="flex flex-col gap-2">
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
