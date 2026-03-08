# Configuration & Infrastructure

## Ports
| Service | Port | Context |
|---------|------|---------|
| Backend (FastAPI/uvicorn) | 9001 | Dev (start.bat) |
| Frontend (Vite) | 5173 | Dev |
| Production (FastAPI serves dist/) | 8000 | Single-port deployment |

## package.json
```
Name: intel-gaming-dashboard
Type: ES module

Dependencies:
  react 18.2, react-dom 18.2, react-router-dom 7.10
  recharts 2.10.3
  tailwindcss 3.4.18, autoprefixer, postcss
  lucide-react 0.263.1

DevDependencies:
  vite 7.3.1, @vitejs/plugin-react 4.2.1
  @types/react, @types/react-dom

Scripts:
  dev: vite
  build: vite build
  preview: vite preview
```

## vite.config.js
- Base: "./" (relative paths for production)
- Server host: 0.0.0.0 (network accessible)
- Proxy: /api -> http://localhost:9001
- Plugin: @vitejs/plugin-react

## tailwind.config.js
- Content: html, js, jsx, tsx files
- Font: Space Grotesk (400, 500, 600, 700)
- Custom colors:
  - background: #0f0a1e
  - surface: #140f2d
  - primary: #a855f7 (purple)
  - secondary: #06b6d4 (cyan)
  - brand-dark: #000814
  - brand-purple: #2e1065
  - brand-violet: #7c3aed
  - brand-cyan: #00C7FD
  - brand-pink: #d946ef
- Keyframes: kenburns, pulseGlow, slideInLeft, slideInRight, fadeIn

## postcss.config.js
- Plugins: tailwindcss, autoprefixer

## backend/requirements.txt
```
fastapi==0.115.0
uvicorn[standard]==0.30.6
duckdb==1.1.3
polars==1.9.0
pydantic==2.9.2
numpy==2.1.3
```

## start.bat
- Starts backend on port 9001: `python -m uvicorn backend.main:app --port 9001 --host 0.0.0.0`
- Starts frontend: `npm run dev -- --host`
- Extracts and displays local IP
- No --reload on uvicorn (Windows instability)

## stop.bat
- Kills processes on ports 8000 and 5173 via taskkill

## index.html
- Title: "Intel SIV Gaming Performance Lab"
- Fonts: Space Grotesk from Google Fonts (300-700)
- Custom scrollbar: purple gradient
- Background: #0f0a1e
- Root div: #root, script: /src/main.jsx (ES module)

## .gitignore Highlights
- node_modules, __pycache__, .venv
- dist/, out/, .next/
- *.duckdb (database files)
- WW*/ (raw build data folders)
- .claude/

## Other Root Files
| File | Purpose |
|------|---------|
| CLAUDE.md | Project instructions for AI assistants |
| README.md | Project overview |
| LICENSE | MIT |
| walkthrough.md | User guide |
| FF_Dawntrail_*.csv | Legacy FFXIV test file (15 MB, should clean up) |
