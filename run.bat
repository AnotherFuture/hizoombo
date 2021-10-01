@ECHO OFF
start cmd.exe /C "python -m http.server 2002"
start chrome http://127.0.0.1:2002/index.html