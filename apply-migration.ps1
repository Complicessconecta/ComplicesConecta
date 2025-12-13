# Script para aplicar migración de banner_config a Supabase local
# Uso: .\apply-migration.ps1

Write-Host "Iniciando aplicación de migración banner_config..." -ForegroundColor Green
Write-Host ""

# Solicitar token de Supabase
$SUPABASE_TOKEN = Read-Host "Ingresa tu token de Supabase (opcional, presiona Enter para omitir)"

if ($SUPABASE_TOKEN) {
    $env:SUPABASE_ACCESS_TOKEN = $SUPABASE_TOKEN
    Write-Host "Token configurado exitosamente" -ForegroundColor Green
} else {
    Write-Host "Continuando sin token (modo local)" -ForegroundColor Yellow
}

Write-Host ""

# Esperar a que Supabase este listo
Write-Host "Esperando a que Supabase este listo..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts -and -not $ready) {
    try {
        $status = supabase status 2>&1
        if ($status -notmatch "not ready") {
            $ready = $true
            Write-Host "Supabase esta listo" -ForegroundColor Green
        } else {
            $attempt++
            Write-Host "Intento $attempt/$maxAttempts - Esperando..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    } catch {
        $attempt++
        Start-Sleep -Seconds 2
    }
}

if (-not $ready) {
    Write-Host "Supabase no esta listo despues de esperar. Intenta:" -ForegroundColor Red
    Write-Host "   1. Verifica que Docker Desktop este corriendo"
    Write-Host "   2. Ejecuta: supabase start"
    Write-Host "   3. Espera 30-60 segundos"
    exit 1
}

# Aplicar migracion
Write-Host "Aplicando migracion..." -ForegroundColor Cyan
supabase migration up

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migracion aplicada exitosamente" -ForegroundColor Green
} else {
    Write-Host "Error al aplicar migracion" -ForegroundColor Red
    exit 1
}

# Regenerar tipos TypeScript
Write-Host "Regenerando tipos TypeScript..." -ForegroundColor Cyan
supabase gen types typescript --local | Out-File -FilePath "src/integrations/supabase/types.ts" -Encoding UTF8

if ($LASTEXITCODE -eq 0) {
    Write-Host "Tipos TypeScript regenerados" -ForegroundColor Green
} else {
    Write-Host "Error al regenerar tipos" -ForegroundColor Red
    exit 1
}

Write-Host "Migracion completada exitosamente!" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor Yellow
Write-Host "1. Verifica que no hay errores de TypeScript en BannerManagementService.ts"
Write-Host "2. Integra AdminBannerPanel en tu admin dashboard"
Write-Host "3. Prueba el sistema de gestion de banners"
