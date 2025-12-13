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
Write-Host ""

# Leer token desde .env.local
Write-Host "Leyendo token desde .env.local..." -ForegroundColor Cyan
$envFile = ".env.local"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
    $tokenLine = $envContent | Select-String "SUPABASE_TOKEN="
    if ($tokenLine) {
        $token = $tokenLine -replace 'SUPABASE_TOKEN="', '' -replace '"', ''
        $env:SUPABASE_TOKEN = $token
        Write-Host "Token obtenido desde .env.local" -ForegroundColor Green
    } else {
        Write-Host "Token no encontrado en .env.local" -ForegroundColor Yellow
    }
} else {
    Write-Host "Archivo .env.local no encontrado" -ForegroundColor Yellow
}

# Esperar a que Supabase este listo
Write-Host ""
Write-Host "Esperando a que Supabase este listo..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$supabaseReady = $false

while ($attempt -lt $maxAttempts -and -not $supabaseReady) {
    try {
        $status = supabase status 2>&1
        if ($status -match "running") {
            $supabaseReady = $true
            Write-Host "Supabase esta completamente listo" -ForegroundColor Green
        }
    } catch {
        # Ignorar errores
    }
    
    if (-not $supabaseReady) {
        Start-Sleep -Seconds 2
        $attempt++
    }
}

if (-not $supabaseReady) {
    Write-Host "ERROR: Supabase no se inicio correctamente" -ForegroundColor Red
    supabase stop
    exit 1
}

# Aplicar migracion
Write-Host ""
Write-Host "Aplicando migracion..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Ejecutando: supabase migration up" -ForegroundColor Cyan
supabase migration up 2>&1 | Tee-Object -Variable migrationOutput

# Verificar si la migracion se aplico correctamente
$migrationSuccess = $migrationOutput -match "banner_config|SCHEMA_MAESTRO"

if ($migrationSuccess) {
    Write-Host ""
    Write-Host "Migracion aplicada exitosamente" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Advertencia: No se pudo verificar si la migracion se aplico correctamente" -ForegroundColor Yellow
    Write-Host "Verifica manualmente en Supabase Studio: http://127.0.0.1:54323" -ForegroundColor Yellow
}

# Regenerar tipos TypeScript
Write-Host ""
Write-Host "Regenerando tipos TypeScript..." -ForegroundColor Cyan
supabase gen types typescript --local | Out-File -FilePath "src/integrations/supabase/types.ts" -Encoding UTF8

if ($LASTEXITCODE -eq 0) {
    Write-Host "Tipos TypeScript regenerados" -ForegroundColor Green
} else {
    Write-Host "Error al regenerar tipos" -ForegroundColor Red
}

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
