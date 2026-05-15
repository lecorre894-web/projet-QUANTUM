@echo off
title OMNIQ v8 SOVEREIGN — Backend Local
color 0A

echo.
echo  ============================================
echo   OMNIQ v8 SOVEREIGN - Backend Local
echo   HTTP  : http://localhost:8764
echo   WS    : ws://localhost:8765
echo  ============================================
echo.

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERREUR] Python non trouve. Installe Python 3.10+ depuis https://python.org
    pause
    exit /b 1
)

echo [INFO] Installation des dependances...
pip install -q aiohttp websockets psutil

echo [INFO] Demarrage du backend...
echo.
python server.py

pause
