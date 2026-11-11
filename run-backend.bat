@echo off
setlocal enabledelayedexpansion
title LEDGERLINE Backend

echo ==================================================
echo   Starting LEDGERLINE Backend (Spring Boot 3.3.5)
echo ==================================================

rem Check if JAVA_HOME is set; if not, check default paths or PATH
if "%JAVA_HOME%"=="" (
    where java >nul 2>&1
    if errorlevel 1 (
        if exist "C:\Users\prane\.jdks\openjdk-23.0.2" (
            set "JAVA_HOME=C:\Users\prane\.jdks\openjdk-23.0.2"
            set "PATH=!JAVA_HOME!\bin;%PATH%"
        ) else (
            echo ERROR: Java 21+ runtime not found. Please install JDK 21+ and set JAVA_HOME.
            pause
            exit /b 1
        )
    )
) else (
    set "PATH=%JAVA_HOME%\bin;%PATH%"
)

echo Java Runtime:
java -version
echo.

rem Build JAR if not present
if not exist "target\ledgerline-backend-1.0.0-SNAPSHOT.jar" (
    echo Building application package with Maven Wrapper...
    call mvnw.cmd clean package -DskipTests
    if errorlevel 1 (
        echo ERROR: Maven build failed.
        pause
        exit /b 1
    )
)

echo Launching backend at http://localhost:8080 ...
java -jar target\ledgerline-backend-1.0.0-SNAPSHOT.jar
pause
