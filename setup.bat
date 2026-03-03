@echo off
color 0B
echo ==========================================================
echo       INSTALADOR AUTOMATICO - SISTEMA CAMBUS V2
echo ==========================================================
echo.
echo Paso 1: Instalando dependencias del sistema...
call npm install --silent

echo.
echo Paso 2: Configurando la Base de Datos automaticamente...
echo [Nota] Asegurandose de que PostgreSQL este corriendo.
node scripts/db-setup.js

echo.
echo Paso 3: Iniciando servidor en segundo plano...
start "Servidor CamBus Web" cmd /k "npm run dev"

echo.
echo Paso 4: Iniciando simulador logistico (Hub Central)...
start "Daemon CamBus LPR" cmd /k "npm run daemon"

echo.
echo ==========================================================
echo  Instalacion y despliegue completado satisfactoriamente.
echo  Redirigiendo a http://localhost:3000
echo ==========================================================
timeout /t 5 >nul
start http://localhost:3000
