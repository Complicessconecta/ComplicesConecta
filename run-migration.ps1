# Script para iniciar Supabase y aplicar migracion automaticamente
# Uso: .\run-migration.ps1

Write-Host "Iniciando proceso completo de migracion..." -ForegroundColor Green
Write-Host ""

# Paso 1: Detener Supabase si esta corriendo
Write-Host "Paso 1: Deteniendo Supabase (si esta corriendo)..." -ForegroundColor Cyan
supabase stop
Start-Sleep -Seconds 5

# Paso 2: Iniciar Supabase
Write-Host ""
Write-Host "Paso 2: Iniciando Supabase..." -ForegroundColor Cyan
supabase start

Write-Host ""
Write-Host "Esperando a que Supabase se inicie completamente..." -ForegroundColor Yellow
Write-Host "Esto puede tomar 60-90 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 90

# Paso 3: Verificar que Supabase esta listo
Write-Host ""
Write-Host "Paso 3: Verificando estado de Supabase..." -ForegroundColor Cyan
$status = supabase status
Write-Host $status

# Paso 4: Ejecutar migracion
Write-Host ""
Write-Host "Paso 4: Ejecutando migracion..." -ForegroundColor Cyan
.\apply-migration.ps1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Proceso completado exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Proximos pasos:" -ForegroundColor Yellow
    Write-Host "1. Verifica que no hay errores de TypeScript en BannerManagementService.ts"
    Write-Host "2. Integra AdminBannerPanel en tu admin dashboard"
    Write-Host "3. Prueba el sistema de gestion de banners"
} else {
    Write-Host ""
    Write-Host "Error durante la migracion. Revisa los mensajes arriba." -ForegroundColor Red
    exit 1
}
