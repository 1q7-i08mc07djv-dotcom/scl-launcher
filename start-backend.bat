@echo off
cd /d "%~dp0backend"
echo Building SCL Backend...
call ..\gradlew.bat bootRun
