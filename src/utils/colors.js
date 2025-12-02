// FPS color coding
export const getFpsColor = (fps) => {
  if (fps >= 120) return '#10b981';
  if (fps >= 60) return '#06b6d4';
  if (fps >= 30) return '#f59e0b';
  return '#ef4444';
};

// P-Core colors for frequency charts
export const pCoreColors = [
  '#a855f7', '#8b5cf6', '#7c3aed', '#6d28d9',
  '#5b21b6', '#4c1d95', '#4338ca', '#3730a3'
];

// E-Core colors for frequency charts
export const eCoreColors = [
  '#10b981', '#059669', '#047857', '#065f46',
  '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4'
];

// Temperature core colors
export const tempCoreColors = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#10b981', '#14b8a6',
  '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
];

// Clip reason colors for IA Clip visualization
export const clipReasonColors = {
  'MAX_TURBO': '#06b6d4',        // Cyan
  'PBM_PL1': '#f59e0b',          // Orange
  'PL1;MAX_TURBO': '#fbbf24',    // Yellow/Gold
  'PBM_PL2': '#ef4444',          // Red
  'PL2;MAX_TURBO': '#ec4899',    // Pink
  'THERMAL': '#8b5cf6'           // Purple
};
