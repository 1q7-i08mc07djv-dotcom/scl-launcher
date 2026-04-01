@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

echo ============================================
echo   SCL EXE 打包工具
echo ============================================
echo.

:: 设置路径
set "PROJECT_DIR=%~dp0"
set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"
set "DIST_DIR=%PROJECT_DIR%\dist"
set "BUILD_DIR=%PROJECT_DIR%\build"
set "JAR_FILE=%BUILD_DIR%\libs\SCL-1.0.0.jar"
set "EXE_OUTPUT=%DIST_DIR%\SCL.exe"
set "JRE_DIR=%PROJECT_DIR%\jre"

:: 创建dist目录
if not exist "%DIST_DIR%" mkdir "%DIST_DIR%"

:: 检查JAR文件
if not exist "%JAR_FILE%" (
    echo [错误] 未找到JAR文件: %JAR_FILE%
    echo 请先运行: gradle jar
    pause
    exit /b 1
)

echo [1/3] 检查Launch4j...
where launch4j >nul 2>&1
if errorlevel 1 (
    echo [提示] 未安装Launch4j，尝试下载...
    
    :: 检查Java
    java -version >nul 2>&1
    if errorlevel 1 (
        echo [错误] 需要Java运行环境来下载Launch4j
        pause
        exit /b 1
    )
    
    :: 下载Launch4j
    echo 正在下载Launch4j...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/launch4j-mirror/launch4j-mirror/releases/download/v2.5.1/launch4j-2.5.1-win32.zip' -OutFile '%TEMP%\launch4j.zip'"
    
    :: 解压
    powershell -Command "Expand-Archive -Path '%TEMP%\launch4j.zip' -DestinationPath '%PROJECT_DIR%\.launch4j' -Force"
    
    :: 清理
    del "%TEMP%\launch4j.zip" 2>nul
    
    set "LAUNCH4J_HOME=%PROJECT_DIR%\.launch4j\launch4j"
) else (
    :: 获取Launch4j安装目录
    for /f "delims=" %%i in ('where launch4j') do set "LAUNCH4J_HOME=%%~dpi"
    set "LAUNCH4J_HOME=%LAUNCH4J_HOME:~0,-1%"
)

echo 使用Launch4j: %LAUNCH4J_HOME%

:: 检查图标
if not exist "%PROJECT_DIR%\src\main\resources\assets\icon.ico" (
    echo [警告] 未找到图标文件，创建默认图标...
    powershell -Command "
        Add-Type -AssemblyName System.Drawing
        `$bmp = New-Object System.Drawing.Bitmap(256, 256)
        `$g = [System.Drawing.Graphics]::FromImage(`$bmp)
        `$g.Clear([System.Drawing.Color]::FromArgb(30, 30, 62))
        `$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(233, 69, 96))
        `$g.FillEllipse(`$brush, 28, 28, 200, 200)
        `$font = New-Object System.Drawing.Font('Arial', 100, [System.Drawing.FontStyle]::Bold)
        `$g.DrawString('S', `$font, [System.Drawing.Brushes]::White, 58, 48)
        `$bmp.Save('%PROJECT_DIR%\src\main\resources\assets\icon.png')
        `$g.Dispose()
        `$bmp.Dispose()
    "
    echo [提示] 请手动转换为ICO格式，或使用在线工具
)

echo.
echo [2/3] 构建EXE...
echo.

:: 运行Launch4j
"%LAUNCH4J_HOME%\launch4j.exe" "%PROJECT_DIR%\build_exe.xml"

if exist "%EXE_OUTPUT%" (
    echo.
    echo [3/3] 打包完成!
    echo EXE文件: %EXE_OUTPUT%
    
    :: 创建自解压包
    echo.
    echo [可选] 是否需要打包完整安装包? (Y/N)
    set /p choice=
    if /i "!choice!"=="Y" (
        echo 正在创建安装包...
        powershell -Command "Compress-Archive -Path '%PROJECT_DIR%\dist\SCL.exe','%JRE_DIR%','%PROJECT_DIR%\README.md' -DestinationPath '%DIST_DIR%\SCL-1.0.0-Portable.zip' -Force"
        echo 安装包已创建: %DIST_DIR%\SCL-1.0.0-Portable.zip
    )
) else (
    echo.
    echo [错误] EXE构建失败!
    pause
    exit /b 1
)

echo.
echo ============================================
echo   打包完成!
echo ============================================
echo.
pause
