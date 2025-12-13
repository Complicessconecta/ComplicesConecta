# Script para iniciar Supabase y aplicar migracion automaticamente
# Uso: .\run-migration.ps1

Write-Host "Iniciando proceso completo de migracion..." -ForegroundColor Green
Write-Host ""

# Paso 0: Verificar que Docker Desktop esta corriendo
Write-Host "Paso 0: Verificando que Docker Desktop esta corriendo..." -ForegroundColor Cyan
$dockerRunning = $false

try {
    docker ps | Out-Null 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
        Write-Host "Docker Desktop esta corriendo" -ForegroundColor Green
    }
} catch {
    $dockerRunning = $false
}

if (-not $dockerRunning) {
    Write-Host ""
    Write-Host "ERROR: Docker Desktop no esta corriendo" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor:" -ForegroundColor Yellow
    Write-Host "1. Abre Docker Desktop"
    Write-Host "2. Espera a que este completamente listo (2-3 minutos)"
    Write-Host "3. Luego ejecuta este script nuevamente"
    Write-Host ""
    Write-Host "Puedes verificar que Docker esta listo ejecutando: docker ps"
    exit 1
}

Write-Host ""

# Paso 1: Detener Supabase si esta corriendo
Write-Host "Paso 1: Deteniendo Supabase (si esta corriendo)..." -ForegroundColor Cyan
supabase stop
Start-Sleep -Seconds 5

# Paso 1.5: Limpiar contenedores Docker de Supabase
Write-Host "Paso 1.5: Limpiando contenedores Docker de Supabase..." -ForegroundColor Yellow
try {
    docker ps -a --filter "label=com.supabase.cli.project=conecta-social-comunidad-main" --format "{{.ID}}" | ForEach-Object {
        Write-Host "Eliminando contenedor: $_" -ForegroundColor Gray
        docker rm -f $_ | Out-Null
    }
    Write-Host "Contenedores limpios" -ForegroundColor Green
} catch {
    Write-Host "Advertencia: No se pudieron limpiar todos los contenedores, continuando..." -ForegroundColor Yellow
}
Start-Sleep -Seconds 3

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
    
    # Detener Supabase para no mantener Docker corriendo
    Write-Host "Deteniendo Supabase..." -ForegroundColor Cyan
    supabase stop
    Write-Host "Supabase detenido" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Proximos pasos:" -ForegroundColor Yellow
    Write-Host "1. Verifica que no hay errores de TypeScript en BannerManagementService.ts"
    Write-Host "2. Integra AdminBannerPanel en tu admin dashboard"
    Write-Host "3. Prueba el sistema de gestion de banners"
} else {
    Write-Host ""
    Write-Host "Error durante la migracion. Revisa los mensajes arriba." -ForegroundColor Red
    Write-Host ""
    Write-Host "Deteniendo Supabase..." -ForegroundColor Cyan
    supabase stop
    exit 1
}
