@echo off
cd /d "%~dp0"
if exist gradlew.bat (
    gradlew.bat %*
) else (
    gradle.bat %*
)
