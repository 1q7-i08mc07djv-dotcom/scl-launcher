@echo off
echo ========================================================
echo     SCL - SUPER CRAFT LAUNCHER - Build
echo ========================================================
echo.

where cl >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Visual C++ compiler not found!
    echo Please open this from "x64 Native Tools Command Prompt"
    echo.
    pause
    exit /b 1
)

echo [1/2] Compiling resources...
rc /nologo scl.rc
if %errorlevel% neq 0 (
    echo ERROR: Resource compilation failed!
    pause
    exit /b 1
)

echo [2/2] Compiling C source...
cl /nologo /EHsc /O2 /DUNICODE /D_UNICODE /W3 /Fe:SCL.exe scl.c scl.res user32.lib comctl32.lib wininet.lib shlwapi.lib shell32.lib
if %errorlevel% neq 0 (
    echo ERROR: Compilation failed!
    pause
    exit /b 1
)

if exist SCL.exe (
    del scl.res 2>nul
    del scl.obj 2>nul
    echo.
    echo ========================================================
    echo SUCCESS! SCL.exe created!
    echo ========================================================
    echo.
    start SCL.exe
) else (
    echo.
    echo FAILED!
)

pause
