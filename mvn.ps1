if (-not $env:JAVA_HOME) {
    $env:JAVA_HOME = "C:\Users\prane\.jdks\openjdk-23.0.2"
}
$env:PATH = "$env:JAVA_HOME\bin;D:\apache-maven-3.9.9\bin;$env:PATH"
& "D:\apache-maven-3.9.9\bin\mvn.cmd" @args
