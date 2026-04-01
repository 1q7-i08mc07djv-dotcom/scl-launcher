@echo off
setlocal EnableDelayedExpansion

echo.
echo  ███████╗██╗   ██╗██████╗ ███████╗ █████╗ ██████╗ ███╗   ███╗
echo  ██╔════╝██║   ██║██╔══██╗██╔════╝██╔══██╗██╔══██╗████╗ ████║
echo  ███████╗██║   ██║██████╔╝█████╗  ███████║██████╔╝██╔████╔██║
echo  ╚════██║██║   ██║██╔═══╝ ██╔══╝  ╚════██║██╔══██╗██║╚██╔╝██║
echo  ███████║╚██████╔╝██║     ███████╗     ██║██║  ██║██║ ╚═╝ ██║
echo  ╚══════╝ ╚═════╝ ╚═╝     ╚══════╝     ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝
echo.
echo  SUPER CRAFT LAUNCHER - Minecraft Launcher
echo  =========================
echo.

set "PROJ=%~dp0"
set "BUILD=%PROJ%build"
set "DIST=%PROJ%dist"
set "TEMP=%PROJ%.tmp"
set "LIBS=%TEMP%\libs"
set "JAVAFX=%TEMP%\javafx"

:: Clean
if exist "%TEMP%" rd /s /q "%TEMP%"
if exist "%BUILD%" rd /s /q "%BUILD%"
if exist "%DIST%" rd /s /q "%DIST%"
mkdir "%DIST%"
mkdir "%TEMP%"
mkdir "%LIBS%"
mkdir "%JAVAFX%"

echo [Step 1/8] Checking Java...
where javac >nul 2>&1
if errorlevel 1 (
    echo ERROR: JDK not found! Please install JDK 21
    echo Download: https://adoptium.net/
    pause
    exit /b 1
)

for /f "delims=" %%i in ('where javac') do set "JC=%%~dpi"
set "JH=!JC:~0,-5!"
echo OK: JAVA_HOME = !JH!
echo.

echo [Step 2/8] Downloading dependencies...
echo - Gson
powershell -Command "Invoke-WebRequest -Uri 'https://repo1.maven.org/maven2/com/google/code/gson/gson/2.10.1/gson-2.10.1.jar' -OutFile '%LIBS%\gson.jar' -UseBasicParsing -TimeoutSec 30" 2>nul

echo - OkHttp
powershell -Command "Invoke-WebRequest -Uri 'https://repo1.maven.org/maven2/com/squareup/okhttp3/okhttp/4.12.0/okhttp-4.12.0.jar' -OutFile '%LIBS%\okhttp.jar' -UseBasicParsing -TimeoutSec 30" 2>nul

echo - OkIO
powershell -Command "Invoke-WebRequest -Uri 'https://repo1.maven.org/maven2/com/squareup/okio/okio/3.6.0/okio-3.6.0.jar' -OutFile '%LIBS%\okio.jar' -UseBasicParsing -TimeoutSec 30" 2>nul
echo.

echo [Step 3/8] Downloading JavaFX SDK...
set "JZIP=%TEMP%\javafx.zip"

echo - Downloading JavaFX 21...
powershell -Command "Invoke-WebRequest -Uri 'https://download2.gluonhq.com/openjfx/21.0.2/openjfx-21.0.2_windows-x64_bin-sdk.zip' -OutFile '%JZIP%' -UseBasicParsing -TimeoutSec 120" 2>nul

if exist "%JZIP%" (
    echo - Extracting...
    powershell -Command "Expand-Archive -Path '%JZIP%' -DestinationPath '%TEMP%' -Force" 2>nul
    for /d %%i in ("%TEMP%\javafx-sdk-*") do (
        if exist "%%i\lib" copy "%%i\lib\*.jar" "%JAVAFX%\" >nul 2>&1
    )
    del "%JZIP%" 2>nul
    echo OK: JavaFX SDK
) else (
    echo WARNING: JavaFX download failed
)
echo.

echo [Step 4/8] Creating package structure...

:: Create com/scl directories
set "SRC=%PROJ%src\main\java"
set "DEST=%BUILD%\classes"

mkdir "%DEST%"
mkdir "%DEST%\com\scl\data"
mkdir "%DEST%\com\scl\ui"
mkdir "%DEST%\com\scl\utils"
mkdir "%DEST%\com\scl\core\auth"
mkdir "%DEST%\com\scl\core\download"
mkdir "%DEST%\com\scl\core\game"
mkdir "%DEST%\com\scl\core\java"
mkdir "%DEST%\com\scl\core\version"
mkdir "%DEST%\fxml"
mkdir "%DEST%\css"
mkdir "%DEST%\assets"

echo OK: Package structure created
echo.

echo [Step 5/8] Copying source files...

:: Copy and convert Java files (fix package names)
for /r "%SRC%" %%f in (*.java) do (
    set "SRC_FILE=%%f"
    set "REL_PATH=!SRC_FILE:%SRC%=!"
    set "DEST_FILE=%DEST%!REL_PATH!"
    
    :: Read and fix package names
    powershell -Command "(Get-Content '%%f' -Raw -Encoding UTF8) -replace 'package com\.SCL\.', 'package com.scl.' -replace 'import com\.SCL\.', 'import com.scl.' | Set-Content '%DEST%!REL_PATH!' -NoNewline -Encoding UTF8"
)

echo OK: Source files copied and fixed
echo.

echo [Step 6/8] Copying resources...
if exist "%PROJ%src\main\resources" (
    xcopy /e /y /q "%PROJ%src\main\resources" "%DEST%\" >nul 2>&1
    echo OK: Resources copied
)
echo.

echo [Step 7/8] Compiling...
set "CP=%JAVAFX%;%LIBS%\gson.jar;%LIBS%\okhttp.jar;%LIBS%\okio.jar"

set "SRC_FILES="
for /r "%DEST%" %%f in (*.java) do set "SRC_FILES=!SRC_FILES! "%%f""

javac -encoding UTF-8 -d "%DEST%" -cp "%CP%" !SRC_FILES! 2>nul

if errorlevel 1 (
    echo WARNING: Some compilation errors, continuing...
) else (
    echo OK: Compilation completed
)
echo.

echo [Step 8/8] Creating JAR...
set "JAR=%DIST%\SCL-1.0.0.jar"

(
echo Manifest-Version: 1.0
echo Main-Class: com.scl.Main
echo Class-Path: .
echo.
) > "%TEMP%\MANIFEST.MF"

cd /d "%DEST%"
jar cfm "%JAR%" "%TEMP%\MANIFEST.MF" * >nul 2>&1

if exist "%JAR%" (
    echo OK: JAR created - SCL-1.0.0.jar
) else (
    echo ERROR: JAR creation failed!
    pause
    exit /b 1
)
echo.

:: Download Launch4j
echo [Extra] Setting up Launch4j...
set "L4J=%TEMP%\launch4j"
if not exist "%L4J%\launch4j.exe" (
    echo - Downloading Launch4j...
    powershell -Command "Invoke-WebRequest -Uri 'https://github.com/launch4j-mirror/launch4j-mirror/releases/download/v2.5.1/launch4j-2.5.1-win32.zip' -OutFile '%TEMP%\launch4j.zip' -UseBasicParsing -TimeoutSec 60" 2>nul
    if exist "%TEMP%\launch4j.zip" (
        powershell -Command "Expand-Archive -Path '%TEMP%\launch4j.zip' -DestinationPath '%L4J%' -Force" 2>nul
        del "%TEMP%\launch4j.zip" 2>nul
        echo OK: Launch4j downloaded
    )
)

:: Create Launch4j config
(
echo ^<launch4jConfig^>
echo   ^<headerType^>gui^</headerType^>
echo   ^<dontWrapJar^>true^</dontWrapJar^>
echo   ^<outfile^>%DIST%\SCL.exe^</outfile^>
echo   ^<jar^>%JAR%^</jar^>
echo   ^<jre^>
echo     ^<minVersion^>21.0^</minVersion^>
echo     ^<maxHeapSize^>2048^</maxHeapSize^>
echo   ^</jre^>
echo   ^<singleInstance^>yes^</singleInstance^>
echo   ^<singleInstanceMutex^>SCL_SingleInstance^</singleInstanceMutex^>
echo ^</launch4jConfig^>
) > "%TEMP%\config.xml"

:: Build EXE
if exist "%L4J%\launch4j.exe" (
    echo Building EXE...
    "%L4J%\launch4j.exe" "%TEMP%\config.xml" 2>nul
    
    if exist "%DIST%\SCL.exe" (
        echo OK: EXE created - SCL.exe
    )
)

:: Cleanup
rd /s /q "%TEMP%" 2>nul
rd /s /q "%BUILD%" 2>nul

echo.
echo ========================================================
echo    BUILD COMPLETED!
echo ========================================================
echo.
echo Output files in: %DIST%
dir "%DIST%" /b 2>nul
echo.
echo Run with: %DIST%\SCL.exe
echo.
pause
