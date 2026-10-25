@echo off
cd /d "%~dp0.."
if not exist .venv\Scripts\python.exe py -3 -m venv .venv
if errorlevel 1 exit /b 1
.venv\Scripts\python.exe -m pip install -r windows\requirements.txt
if errorlevel 1 exit /b 1
.venv\Scripts\python.exe windows\overlay.py
pause
