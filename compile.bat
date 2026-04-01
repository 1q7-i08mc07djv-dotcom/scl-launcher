@echo off
chcp 65001 >nul
echo.
echo ========================================================
echo     SCL - C++ Build Script
echo ========================================================
echo.

:: Compile Resource
if exist scl.rc (
    echo [Compiling Resources]
    rc /r scl.rc
)

:: Compile C++
echo [Compiling C++]
cl /EHsc /O2 /Fe:SCL.exe scl.cpp winhttp.lib comctl32.lib shlwapi.lib user32.lib gdi32.lib

if exist "SCL.exe" (
    echo.
    echo ========================================================
    echo     Build Success!
    echo ========================================================
    echo.
    for %%A in ("SCL.exe") do echo Size: %%~zA bytes
    echo.
    echo Run: SCL.exe
    echo.
) else (
    echo.
    echo Build failed!
    echo.
)

pause
