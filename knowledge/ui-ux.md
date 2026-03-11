# UI/UX Design System

## Theme
- **Background**: #0f0a1e (deep dark purple)
- **Surface**: #140f2d
- **Primary**: #a855f7 (purple)
- **Secondary**: #06b6d4 (cyan)
- **Font**: Space Grotesk (Google Fonts, weights 300-700)
- **Style**: Dark cyberpunk / deep-space aesthetic

## Layout
- **Horizontal flex**: collapsible left sidebar (260px / 48px) + scrollable main content
- Sidebar has smooth 300ms cubic-bezier transition on width change
- Main content uses `overflow-y-auto overflow-x-hidden`

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

## Sidebar Design
- **Expanded** (260px): Full labels, section headers, build tree, stats
- **Collapsed** (48px): Icons only, tooltips on hover
- **Sections** (top to bottom):
  1. Toggle button (ChevronLeft/Right)
  2. Logo ("Intel SIV Gaming / Performance Lab") with `logoSequence` animation
  3. Programs list (emoji + name, colored left border when active)
  4. SKUs (shown when a program is selected, derived from URL)
  5. Build Tree (shown when a SKU is selected, git-branch style)
  6. Tools (Compare, Demo)
  7. Stats footer (game count, build count)

## Build Tree UI
- **Git-graph layout** (absolute positioned, 32px fixed gutter):
  - Continuous vertical rail at x=12px (`programColor` at 35% opacity)
  - **BKC nodes**: 10px circle on rail, program color, filled+glow when selected
  - **Experiment branches**: horizontal connector from rail to 8px amber dot at x=24px
  - `FlaskConical` icon + label (amber) or truncated build_id
- Active build: `bg-white/10` highlight + colored left border (program color for BKC, amber for experiments)
- Non-active: slate-400/500 text, hover brightens
- **Experiment labels**: when `label` field present, shown as primary amber text with build_id as small subtitle

## Experiment Banner
- Shown on ProgramDashboard when the current build is an experiment
- Amber themed: `bg-amber-500/10 border border-amber-500/20`
- Shows: FlaskConical icon + **label** (bold, if set) + experiment build_id + "branched from" + parent BKC name
- Placed between SKU selector and game results
- Build switch re-triggers `fadeSlideIn` stagger animation on game cards (key includes `selectedBuild`)

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
- 43s cycle with 8 pulses + electrify burst at end
- Applied to Intel SIV logo icon

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

### Sidebar Collapse
- Width transition: 300ms cubic-bezier(0.4, 0, 0.2, 1)
- Content fades/hides based on `collapsed` prop

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
- Sidebar nav buttons: `bg-transparent hover:bg-white/5`, active: `bg-white/10`
