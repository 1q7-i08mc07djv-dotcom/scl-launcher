@echo off
setlocal EnableDelayedExpansion

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

echo.
echo ========================================================
echo    SCL - Build Package Tool
echo ========================================================
echo.

set "BUILD=%PROJECT_DIR%build"
set "DIST=%PROJECT_DIR%dist"
set "TEMP=%PROJECT_DIR%.pkg"
set "LIBS=%TEMP%\libs"
set "JAVAFX=%TEMP%\javafx"

if exist "%TEMP%" rd /s /q "%TEMP%"
mkdir "%DIST%"
mkdir "%TEMP%"
mkdir "%LIBS%"
mkdir "%JAVAFX%"

echo [Step 1/7] Checking Java...
where javac >nul 2>&1
if errorlevel 1 (
    echo ERROR: JDK not found! Please install JDK 21
    pause
    exit /b 1
)

for /f "delims=" %%i in ('where javac') do set "JAVAC_PATH=%%~dpi"
set "JAVA_HOME=%JAVAC_PATH:~0,-5%"
echo OK: JAVA_HOME = %JAVA_HOME%
echo.

echo [Step 2/7] Downloading dependencies...

powershell -Command "Invoke-WebRequest -Uri 'https://repo1.maven.org/maven2/com/google/code/gson/gson/2.10.1/gson-2.10.1.jar' -OutFile '%LIBS%\gson.jar' -UseBasicParsing -TimeoutSec 30" 2>nul
powershell -Command "Invoke-WebRequest -Uri 'https://repo1.maven.org/maven2/com/squareup/okhttp3/okhttp/4.12.0/okhttp-4.12.0.jar' -OutFile '%LIBS%\okhttp.jar' -UseBasicParsing -TimeoutSec 30" 2>nul
powershell -Command "Invoke-WebRequest -Uri 'https://repo1.maven.org/maven2/com/squareup/okio/okio/3.6.0/okio-3.6.0.jar' -OutFile '%LIBS%\okio.jar' -UseBasicParsing -TimeoutSec 30" 2>nul

echo OK: Dependencies downloaded
echo.

echo [Step 3/7] Downloading JavaFX SDK...
set "JAVAFX_ZIP=%TEMP%\javafx.zip"

powershell -Command "Invoke-WebRequest -Uri 'https://download2.gluonhq.com/openjfx/21.0.2/openjfx-21.0.2_windows-x64_bin-sdk.zip' -OutFile '%JAVAFX_ZIP%' -UseBasicParsing -TimeoutSec 120" 2>nul

if exist "%JAVAFX_ZIP%" (
    powershell -Command "Expand-Archive -Path '%JAVAFX_ZIP%' -DestinationPath '%TEMP%' -Force" 2>nul
    for /d %%i in ("%TEMP%\javafx-sdk-*") do (
        if exist "%%i\lib" copy "%%i\lib\*.jar" "%JAVAFX%\" >nul 2>&1
    )
    del "%JAVAFX_ZIP%" 2>nul
    echo OK: JavaFX SDK downloaded
) else (
    echo WARNING: JavaFX download failed
)
echo.

echo [Step 4/7] Compiling Java code...
set "SRC_DIR=%PROJECT_DIR%src\main\java"
set "CLASS_DIR=%BUILD%\classes"
set "RES_DIR=%PROJECT_DIR%src\main\resources"

mkdir "%CLASS_DIR%"

set "CP=%JAVAFX%"
for %%f in ("%LIBS%\*.jar") do set "CP=!CP!;%%f"

set "JAVA_FILES="
for /r "%SRC_DIR%" %%f in (*.java) do set "JAVA_FILES=!JAVA_FILES! "%%f""

javac -encoding UTF-8 -d "%CLASS_DIR%" -cp "%CP%" %JAVA_FILES% 2>nul

if errorlevel 1 (
    echo ERROR: Compilation failed!
    pause
    exit /b 1
)

echo OK: Compilation completed
echo.

if exist "%RES_DIR%" (
    echo [Step 5/7] Copying resources...
    xcopy /e /y /q "%RES_DIR%\*" "%CLASS_DIR%\" >nul 2>&1
    echo OK: Resources copied
) else (
    echo [Step 5/7] No resources to copy
)
echo.

echo [Step 6/7] Creating JAR...

set "MANIFEST=%TEMP%\MANIFEST.MF"
set "JAR_FILE=%DIST%\SCL-1.0.0.jar"

(
echo Manifest-Version: 1.0
echo Main-Class: com.SCL.Main
echo.
) > "%MANIFEST%"

cd /d "%CLASS_DIR%"
jar cfm "%JAR_FILE%" "%MANIFEST%" * >nul 2>&1

if exist "%JAR_FILE%" (
    echo OK: JAR created - %JAR_FILE%
) else (
    echo ERROR: JAR creation failed!
    pause
    exit /b 1
)
echo.

echo [Step 7/7] Creating EXE...

set "L4J_DIR=%TEMP%\launch4j"
set "L4J_EXE=%L4J_DIR%\launch4j.exe"

powershell -Command "Invoke-WebRequest -Uri 'https://github.com/launch4j-mirror/launch4j-mirror/releases/download/v2.5.1/launch4j-2.5.1-win32.zip' -OutFile '%TEMP%\launch4j.zip' -UseBasicParsing -TimeoutSec 60" 2>nul

if exist "%TEMP%\launch4j.zip" (
    powershell -Command "Expand-Archive -Path '%TEMP%\launch4j.zip' -DestinationPath '%L4J_DIR%' -Force" 2>nul
    del "%TEMP%\launch4j.zip" 2>nul
)

if exist "%L4J_EXE%" (
    set "L4J_CONFIG=%TEMP%\config.xml"
    (
    echo ^<launch4jConfig^>
    echo   ^<headerType^>gui^</headerType^>
    echo   ^<dontWrapJar^>true^</dontWrapJar^>
    echo   ^<outfile^>%DIST%\SCL.exe^</outfile^>
    echo   ^<jar^>%JAR_FILE%^</jar^>
    echo   ^<jre^>
    echo     ^<path^>^</path^>
    echo     ^<minVersion^>21.0^</minVersion^>
    echo     ^<maxHeapSize^>2048^</maxHeapSize^>
    echo   ^</jre^>
    echo   ^<singleInstance^>yes^</singleInstance^>
    echo   ^<singleInstanceMutex^>SCL_SingleInstance^</singleInstanceMutex^>
    echo ^</launch4jConfig^>
    ) > "%L4J_CONFIG%"
    
    "%L4J_EXE%" "%L4J_CONFIG%" 2>nul
    
    if exist "%DIST%\SCL.exe" (
        echo OK: EXE created - %DIST%\SCL.exe
    ) else (
        echo WARNING: EXE creation failed, but JAR is ready
    )
) else (
    echo WARNING: Launch4j not available
)
echo.

echo ========================================================
echo    BUILD COMPLETED
echo ========================================================
echo.
echo Output files:
echo   - %JAR_FILE%
if exist "%DIST%\SCL.exe" echo   - %DIST%\SCL.exe
echo.
echo Run with: java -jar "%JAR_FILE%"
echo.

rd /s /q "%TEMP%" 2>nul
rd /s /q "%BUILD%" 2>nul

pause
