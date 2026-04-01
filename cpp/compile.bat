@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo    SCL C++ 编译工具
echo ========================================================
echo.

set "PROJECT_DIR=%~dp0"
set "SRC_DIR=%PROJECT_DIR%src"
set "DIST_DIR=%PROJECT_DIR%dist"

if not exist "%DIST_DIR%" mkdir "%DIST_DIR%"

echo [检查] 编译器...

:: 检查Visual Studio
where cl >nul 2>&1
if errorlevel 1 (
    echo.
    echo [错误] 未找到Visual C++编译器!
    echo.
    echo 请使用以下方法之一:
    echo 1. 打开 "x64 Native Tools Command Prompt for VS"
    echo 2. 运行 "vswhere" 后再执行此脚本
    echo.
    echo 或者使用在线编译: https://replit.com
    echo.
    pause
    exit /b 1
)

echo [编译] C++代码...
set "SRC_FILES="
for %%f in ("%SRC_DIR%\*.cpp") do set "SRC_FILES=!SRC_FILES! "%%f""
for %%f in ("%SRC_DIR%\*.rc") do set "RES_FILE="%%f""

:: 编译
cl /EHsc /O2 /MD /Fe:"%DIST_DIR%\SCL.exe" /Fo:"%DIST_DIR%\SCL.obj" %SRC_FILES% winhttp.lib comctl32.lib shlwapi.lib 2>nul

if errorlevel 1 (
    :: 尝试带资源文件编译
    echo [编译] 带资源文件...
    rc /r "%SRC_DIR%\resources.rc"
    cl /EHsc /O2 /MD /Fe:"%DIST_DIR%\SCL.exe" %SRC_FILES% "%DIST_DIR%\resources.res" winhttp.lib comctl32.lib shlwapi.lib user32.lib gdi32.lib 2>nul
    
    if errorlevel 1 (
        echo.
        echo [错误] 编译失败!
        echo.
        echo 请确保已安装 Visual Studio 2015 或更高版本
        echo 并从 "Developer Command Prompt" 运行此脚本
        echo.
        pause
        exit /b 1
    )
)

if exist "%DIST_DIR%\SCL.exe" (
    echo.
    echo ========================================================
    echo    编译成功!
    echo ========================================================
    echo.
    echo 输出文件: %DIST_DIR%\SCL.exe
    echo.
    echo 大小:
    for %%A in ("%DIST_DIR%\SCL.exe") do echo    %%~zA bytes
    echo.
    echo 可以直接双击运行!
    echo.
) else (
    echo.
    echo [错误] 编译失败
    echo.
)

pause
