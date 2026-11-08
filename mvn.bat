@echo off
if "%JAVA_HOME%"=="" set JAVA_HOME=C:\Users\prane\.jdks\openjdk-23.0.2
set "PATH=%JAVA_HOME%\bin;D:\apache-maven-3.9.9\bin;%PATH%"
call "D:\apache-maven-3.9.9\bin\mvn.cmd" %*
