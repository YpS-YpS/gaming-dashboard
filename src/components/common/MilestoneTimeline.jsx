import React from 'react';

/**
 * Milestone timeline — horizontal gradient line with beacon dots.
 *
 * Props:
 *   milestones  — ordered array of { key, label }
 *   current     — key of the active milestone
 *   color       — accent color (default: purple primary)
 */

const DEFAULTS = {
  milestones: [
    { key: 'po',    label: 'PO' },
    { key: 'alpha', label: 'Alpha' },
    { key: 'beta',  label: 'Beta' },
    { key: 'qs',    label: 'QS' },
    { key: 'pv',    label: 'PV' },
  ],
  color: '#a855f7',
};

export default function MilestoneTimeline({
  milestones = DEFAULTS.milestones,
  current = 'beta',
  color = DEFAULTS.color,
}) {
  const currentIdx = milestones.findIndex(m => m.key === current);

  return (
    <div className="relative flex items-center w-full select-none" style={{ height: 56 }}>
      {/* Background line (full width, dimmed) */}
      <div
        className="absolute left-0 right-0 rounded-full"
        style={{ height: 2, top: 20, background: `${color}15` }}
      />

      {/* Progress line (gradient, up to current milestone) */}
      {currentIdx > 0 && (
        <div
          className="absolute rounded-full"
          style={{
            height: 2,
            top: 20,
            left: 0,
            width: `${(currentIdx / (milestones.length - 1)) * 100}%`,
            background: `linear-gradient(90deg, ${color}40, ${color})`,
          }}
        />
      )}

      {/* Milestone dots + labels */}
      {milestones.map((m, i) => {
        const pct = (i / (milestones.length - 1)) * 100;
        const isPast = i < currentIdx;
        const isCurrent = i === currentIdx;
        const isFuture = i > currentIdx;

        return (
          <div
            key={m.key}
            className="absolute flex flex-col items-center"
            style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
          >
            {/* Dot container */}
            <div className="relative flex items-center justify-center" style={{ width: 20, height: 40 }}>
              {/* Beacon pulse ring (current only) */}
              {isCurrent && (
                <span
                  className="absolute rounded-full animate-ping"
                  style={{
                    width: 20,
                    height: 20,
                    background: `${color}30`,
                  }}
                />
              )}

              {/* Outer glow (current only) */}
              {isCurrent && (
                <span
                  className="absolute rounded-full"
                  style={{
                    width: 18,
                    height: 18,
                    background: `${color}25`,
                    boxShadow: `0 0 12px 4px ${color}40`,
                  }}
                />
              )}

              {/* Dot */}
              <span
                className="relative rounded-full z-10 transition-all duration-300"
                style={{
                  width: isCurrent ? 12 : 8,
                  height: isCurrent ? 12 : 8,
                  background: isFuture ? `${color}30` : color,
                  boxShadow: isCurrent ? `0 0 8px ${color}` : 'none',
                }}
              />
            </div>

            {/* Label */}
            <span
              className="text-[10px] font-semibold uppercase tracking-wider transition-colors duration-300"
              style={{
                color: isCurrent ? color : isPast ? `${color}90` : '#475569',
                marginTop: -2,
              }}
            >
              {m.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
