# UI/UX Design System

## Theme
- **Background**: #0f0a1e (deep dark purple)
- **Surface**: #140f2d
- **Primary**: #a855f7 (purple)
- **Secondary**: #06b6d4 (cyan)
- **Font**: Space Grotesk (Google Fonts, weights 300-700)
- **Style**: Dark cyberpunk / deep-space aesthetic

## FPS Color Coding
| Threshold | Color | Hex |
|-----------|-------|-----|
| >= 120 FPS | Green | #10b981 |
| >= 60 FPS | Cyan | #06b6d4 |
| >= 30 FPS | Amber | #f59e0b |
| < 30 FPS | Red | #ef4444 |

## Chart Color Conventions
- **P-Cores**: Purple palette (`pCoreColors` - 8 shades, solid lines)
- **E-Cores**: Green palette (`eCoreColors` - 8 shades, dashed lines)
- **Temperature**: Same P/E grouping, Package = rose-red thick line
- **Power**: IA = blue, Package = violet, trends = darker variants
- **Clip Reasons**: Dynamic per reason type (clipReasonColors map)
- **Core Temps**: 16-color gradient (`tempCoreColors`)

## Program Colors
| Program | Color |
|---------|-------|
| Arrow Lake | #a855f7 |
| Arrow Lake Refresh | #c084fc |
| Nova Lake | #22d3ee |
| Panther Lake | #f472b6 |
| Raptor Lake | #f97316 / #fb923c |
| Raptor Lake Refresh | #fdba74 |

## CSS Keyframe Animations (src/index.css)

### fadeSlideIn
- opacity 0->1, translateY 12px->0
- Used for: game card stagger (80ms per card)

### beacon
- scale 1->2.2, opacity 0.6->0
- Used for: detail button pulse on expanded GameCard

### loading
- translateX sweep
- Used for: splash screen loading bar, shimmer effects

### fadeInUp
- opacity + translateY
- Used for: splash screen text cascade (0, 100ms, 200ms delays)

## Tailwind Keyframes (tailwind.config.js)

### kenburns
- Background size/position animation (parallax)

### pulseGlow
- Glow pulse effect

### slideInLeft / slideInRight
- Overlay sidebar (left) and content (right) entry animations

### fadeIn
- Simple opacity 0->1

### logoSequence (Sidebar)
- 43s cycle with 8 pulses + electrify burst
- Applied to Intel SIV logo

## Animation Patterns

### Staggered Game Cards
- Skeleton cards while loading
- `fadeSlideIn` with 80ms delay per card index
- Applied via inline style: `animationDelay: ${index * 80}ms`

### Staggered Chart Loading (DetailedAnalysisPage)
- `LazyChart` wrapper shows `ChartSkeleton` during load
- Configurable delay per chart (500ms gaps)
- Opacity transition 0->1 after delay

### Page Transitions
- Content fade-in/out on SKU change (150ms)
- Splash page slides up after 3.5s

### Overlay Animations
- Sidebar: `slideInLeft`
- Content: `slideInRight`
- Backdrop: semi-transparent black + blur

## Design Rules
- All time-based X-axes auto-scale from data (5s/10s tick intervals)
- All Y-axes auto-scale from data (no hardcoded domains)
- Decimal precision: FPS/power/temps = 2 decimal places, frequencies = integers
- DO NOT remove Recharts animations (user preference)
- Custom scrollbar: purple gradient
- Grid backgrounds with blur circles for depth

## Component Styling Patterns
- Cards: `bg-white/5 border border-white/10 rounded-xl`
- Hover: `hover:border-white/20` or program color
- Selected: colored border + gradient background
- Badges: small rounded pills with semi-transparent backgrounds
- Icons: Lucide React library
