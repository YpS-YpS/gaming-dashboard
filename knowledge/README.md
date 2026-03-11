# Knowledge Base - Intel Gaming Performance Dashboard

This folder contains deep documentation of the entire codebase, organized by area.
Use this as a reference when making changes or onboarding.

## Files

| File | Covers |
|------|--------|
| [architecture.md](architecture.md) | High-level architecture, data flow, tech stack, build hierarchy |
| [frontend.md](frontend.md) | React components, hooks, routing, state, styling |
| [backend.md](backend.md) | FastAPI endpoints, DB schema, caching, downsampling |
| [parsers-etl.md](parsers-etl.md) | PTAT/CapFrameX/PresentMon/SystemScope parsers, ETL pipeline, ingestion wizard |
| [gametraces.md](gametraces.md) | Gametraces folder structure, program.json schema, current data |
| [config-and-infra.md](config-and-infra.md) | Vite, Tailwind, package.json, start/stop scripts, ports |
| [data-models.md](data-models.md) | DuckDB tables, API response shapes, hook return types |
| [ui-ux.md](ui-ux.md) | Animations, color system, theming, design conventions |
| [automation-runs.md](automation-runs.md) | Raptor-X automation log structure, manifest schema, trace formats |

## Last Updated
2026-03-08 (branch: real-NVL-wip, experiment labels, manage builds tab, git-graph build tree, DB release/reacquire)
