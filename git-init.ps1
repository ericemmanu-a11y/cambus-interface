<#
.SYNOPSIS
    Script de DevOps para Inicialización Segura del Repositorio de Cambus (Proyecto Mabe).

.DESCRIPTION
    Este script inicializa localmente el repositorio Git, asegura que la rama principal sea 'main',
    añade los archivos de Next.js al área de preparación (stage), respetando el exhaustivo .gitignore
    configurado, y realiza el primer Commit Oficial de la infraestructura.

.NOTES
    Autor: Asistente Experto DevOps
    Fecha: Febrero 2026
#>

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "🚀 Iniciando Secuencia de Configuración de Git" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# 1. Asegurar que estamos en el directorio de la aplicación
$ProjectPath = "C:\Users\Erice\Documents\Proyecto Mabe\cambus-interface"
if (Test-Path $ProjectPath) {
    Set-Location -Path $ProjectPath
    Write-Host "[OK] Ubicado en el directorio del proyecto: $ProjectPath" -ForegroundColor Green
}
else {
    Write-Host "[ERROR] No se encuentra la ruta del proyecto. Abortando." -ForegroundColor Red
    exit 1
}

# 2. Inicializar el repositorio Git local
Write-Host "`n[1/4] Inicializando Repositorio Git..." -ForegroundColor Yellow
git init
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Repositorio inicializado exitosamente." -ForegroundColor Green
}

# 3. Forzar el nombre de la rama principal a 'main' (estándar moderno de DevOps)
Write-Host "`n[2/4] Configurando la rama principal a 'main'..." -ForegroundColor Yellow
git branch -M main
Write-Host "[OK] Rama configurada: main." -ForegroundColor Green

# 4. Añadir todos los archivos al Stage (respetando el exhaustivo .gitignore)
Write-Host "`n[3/4] Indexando archivos del proyecto (stage)..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Todos los archivos válidos han sido añadidos al área de preparación." -ForegroundColor Green
}

# 5. Ejecutar el Primer Commit Oficial
Write-Host "`n[4/4] Creando el Commit Inicial..." -ForegroundColor Yellow

git commit -m "chore(init): initial commit with DevOps configurations" -m "- Bootstrapped Next.js 15 App Router architecture." -m "- Integrated TailwindCSS & TypeScript styling pipeline." -m "- Added comprehensive .gitignore for Node, Next.js, Env secrets, and OS clutter." -m "- Connected V2 Database Logic and Pooling Configurations."

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=============================================" -ForegroundColor Cyan
    Write-Host "✅ ¡ÉXITO! El repositorio local está listo en la rama 'main'." -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Cyan
    Write-Host "Siguiente paso (Manual): Git Remote Add y Git Push hacia el origen."
}
else {
    Write-Host "`n[ATENCIÓN] Posiblemente el commit ya existía o no hay cambios nuevos para confirmar." -ForegroundColor Yellow
}
