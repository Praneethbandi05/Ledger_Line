# LEDGERLINE Backend Launcher
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Starting LEDGERLINE Backend (Spring Boot 3.3.5) " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Set JAVA_HOME and update PATH for this session
$env:JAVA_HOME = "C:\Users\prane\.jdks\openjdk-23.0.2"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "Java Version:" -ForegroundColor Yellow
& java -version

Write-Host "`nLaunching backend at http://localhost:8080 ..." -ForegroundColor Green
& java -jar target/ledgerline-backend-1.0.0-SNAPSHOT.jar
