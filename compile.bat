@echo off
echo Building SCL...

:: Resource
rc /r scl.rc 2>nul

:: Compile
cl /EHsc /O2 /Fe:SCL.exe scl.cpp wininet.lib comctl32.lib shlwapi.lib

:: Done
if exist SCL.exe (
    echo.
    echo SUCCESS!
    echo.
    for %%A in (SCL.exe) do echo Size: %%~zA bytes
) else (
    echo Failed!
)
pause
