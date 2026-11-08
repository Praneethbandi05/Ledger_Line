@echo off
title LEDGERLINE Backend
echo ==================================================
echo   Starting LEDGERLINE Backend (Spring Boot 3.3.5)
echo ==================================================

set "JAVA_HOME=C:\Users\prane\.jdks\openjdk-23.0.2"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo Java Version:
java -version
echo.
echo Launching backend at http://localhost:8080 ...
java -jar target\ledgerline-backend-1.0.0-SNAPSHOT.jar
pause
