$ErrorActionPreference = "Stop"

Write-Host "=========================================="
Write-Host "   CamBus-Interface Setup & Install"
Write-Host "=========================================="
Write-Host ""
Write-Host "[1/3] Limpiando dependencias previas..."
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
}

Write-Host "[2/3] Instalando dependencias limpias..."
npm install

Write-Host "[3/3] Compilando versin de produccin (Next.js)..."
npm run build

Write-Host ""
Write-Host "=========================================="
Write-Host " Listo! Puedes iniciar el sistema con:"
Write-Host " -> front-end: npm run dev / npm run start"
Write-Host " -> back-end daemon: node ./scripts/daemon_simulador.js"
Write-Host "=========================================="
