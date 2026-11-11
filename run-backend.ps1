# LEDGERLINE Backend Launcher
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Starting LEDGERLINE Backend (Spring Boot 3.3.5) " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Ensure Java is available
if (-not $env:JAVA_HOME) {
    if (Get-Command java -ErrorAction SilentlyContinue) {
        # System java available
    } elseif (Test-Path "C:\Users\prane\.jdks\openjdk-23.0.2") {
        $env:JAVA_HOME = "C:\Users\prane\.jdks\openjdk-23.0.2"
        $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
    } else {
        Write-Error "Java 21+ runtime not found. Please install JDK 21+ and set JAVA_HOME."
        exit 1
    }
} else {
    $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
}

Write-Host "Java Runtime:" -ForegroundColor Yellow
& java -version

# Build JAR if not already built
$jarPath = "target/ledgerline-backend-1.0.0-SNAPSHOT.jar"
if (-not (Test-Path $jarPath)) {
    Write-Host "`nBuilding application package with Maven Wrapper..." -ForegroundColor Yellow
    & .\mvnw.cmd clean package -DskipTests
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Maven build failed."
        exit 1
    }
}

Write-Host "`nLaunching backend at http://localhost:8080 ..." -ForegroundColor Green
& java -jar $jarPath
