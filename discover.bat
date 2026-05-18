@echo off
REM Backend API Discovery using CURL
setlocal enabledelayedexpansion

set BACKEND=http://192.168.1.35:3000
set EMAIL=admin@tudominio.com
set PASSWORD=Admin@12345Local
set TOKEN=

echo.
echo ========================================
echo Backend API Endpoint Discovery
echo ========================================
echo Backend: %BACKEND%
echo Email: %EMAIL%
echo.

REM Step 1: Test connectivity
echo [1] Testing backend connectivity...
curl -s -m 5 %BACKEND% > nul 2>&1
if %errorlevel% equ 0 (
    echo OK - Backend is reachable
) else (
    echo ERROR - Backend not reachable
    exit /b 1
)

REM Step 2: Authenticate
echo.
echo [2] Attempting authentication at /auth/login...
set PAYLOAD={"email":"%EMAIL%","password":"%PASSWORD%"}

for /f %%A in ('curl -s -X POST %BACKEND%/auth/login ^
  -H "Content-Type: application/json" ^
  -d "%PAYLOAD%" ^
  2^>nul ^
  ^| findstr /C:"token" /C:"accessToken" /C:"access_token"') do (
    echo %%A
)

REM Since extracting token from JSON is hard with batch, let's just test endpoints
echo.
echo [3] Probing endpoints...
echo.

REM First authenticate and save to temp file
curl -s -X POST %BACKEND%/auth/login ^
  -H "Content-Type: application/json" ^
  -d "%PAYLOAD%" > auth_response.json

type auth_response.json
echo.
echo Saved auth response to auth_response.json

echo.
echo Testing GET endpoints...

set "endpoints=/components /catalog /products /admin/components /admin/catalog /api/components /api/catalog /api/products /api/admin/components /api/admin/catalog /users"

for %%E in (%endpoints%) do (
    echo.
    echo Testing: %%E
    curl -s -m 5 -X GET %BACKEND%%%E ^
      -H "Accept: application/json" > nul 2>&1
    if !errorlevel! equ 0 (
        echo   Status: OK
    ) else (
        echo   Status: ERROR
    )
)

echo.
echo Discovery complete.
