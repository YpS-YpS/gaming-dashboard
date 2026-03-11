@echo off
cd /d "%~dp0"
python -m backend.etl.ingest_gui
pause
