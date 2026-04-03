@echo off
cd /d "%~dp0"
echo Starting SCL Backend...
start "" javaw -jar "%~dp0..\backend\build\libs\scl-backend-1.0.0.jar"
