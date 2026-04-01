@echo off
chcp 65001 >nul
echo.
echo  ========================================================
echo     SCL - 编译脚本
echo  ========================================================
echo.

:: 检查编译器
where cl >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Visual C++编译器!
    echo.
    echo 请使用以下方式之一:
    echo.
    echo 1. 打开 "x64 Native Tools Command Prompt for VS"
    echo    然后运行此脚本
    echo.
    echo 2. 或访问 https://visualstudio.microsoft.com/
    echo    下载 Visual Studio Community
    echo.
    echo 3. 使用在线编译: https://replit.com
    echo.
    pause
    exit /b 1
)

echo [编译] C++源码...
cl /EHsc /O2 /Fe:SCL.exe scl.cpp winhttp.lib comctl32.lib shlwapi.lib user32.lib gdi32.lib

if exist "SCL.exe" (
    echo.
    echo ========================================================
    echo     编译成功!
    echo ========================================================
    echo.
    echo 输出文件: SCL.exe
    echo.
    for %%A in ("SCL.exe") do echo 文件大小: %%~zA bytes
    echo.
    echo 直接双击运行!
    echo.
) else (
    echo.
    echo [错误] 编译失败!
    echo.
)

pause
