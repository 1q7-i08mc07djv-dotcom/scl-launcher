@echo off
chcp 65001 >nul
echo ================================
echo     SCL Minecraft启动器
echo ================================
echo.

:: 设置工作目录
set "LAUNCHER_DIR=%~dp0"
cd /d "%LAUNCHER_DIR%"

:: 检查Java
java -version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Java运行环境！
    echo.
    echo 正在检查是否需要自动下载Java...
    
    :: 检查内置Java
    if exist "jre\bin\java.exe" (
        echo [信息] 发现内置Java，正在配置...
        set "JAVA_HOME=%LAUNCHER_DIR%jre"
        set "PATH=%JAVA_HOME%\bin;%PATH%"
    ) else (
        echo [信息] 将自动下载Java运行环境...
        echo 请稍候...
        
        :: 启动下载器
        powershell -Command "Start-Process -FilePath 'powershell' -ArgumentList '-NoProfile -ExecutionPolicy Bypass -Command \"& {Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('\''即将下载Java运行环境（约200MB），是否继续？'\'', '\''SCL'\'', '\''OKCancel'\'', '\''Information')}\"' -Wait"
    )
)

:: 检查Gradle
where gradle >nul 2>&1
if errorlevel 1 (
    echo [提示] 未检测到Gradle，将使用内置wrapper
    echo.
    
    if exist "gradle\wrapper\gradle-wrapper.jar" (
        echo [信息] 使用Gradle Wrapper启动...
        gradlew.bat run
    ) else (
        echo [信息] 下载Gradle Wrapper...
        powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/gradle/gradle/master/gradle/wrapper/gradle-wrapper.jar' -OutFile 'gradle\wrapper\gradle-wrapper.jar'"
        
        if exist "gradle\wrapper\gradle-wrapper.jar" (
            gradlew.bat run
        ) else (
            echo [错误] 无法获取Gradle!
            pause
            exit /b 1
        )
    )
) else (
    echo [信息] 使用系统Gradle启动...
    gradle run
)

pause
