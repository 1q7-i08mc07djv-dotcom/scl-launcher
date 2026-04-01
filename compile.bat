@echo off
chcp 65001 >nul
echo.
echo ========================================================
echo     SCL Build
echo ========================================================
echo.

:: Compile Resource
if exist scl.rc (
    echo [Resources]
    rc /r scl.rc
)

:: Compile C++
echo [C++]
cl /EHsc /O2 /Fe:SCL.exe scl.cpp winhttp.lib comctl32.lib user32.lib gdi32.lib

if exist "SCL.exe" (
    echo.
    echo ========================================================
    echo     Success!
    echo ========================================================
    for %%A in ("SCL.exe") do echo Size: %%~zA bytes
) else (
    echo.
    echo Failed!
)
pause
