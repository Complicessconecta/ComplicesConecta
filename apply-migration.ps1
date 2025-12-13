# Script para aplicar migración de banner_config a Supabase local
# Uso: .\apply-migration.ps1

Write-Host "Iniciando aplicación de migracion banner_config..." -ForegroundColor Green
Write-Host ""

# Leer token desde .env.local
$envFile = ".env.local"
$SUPABASE_TOKEN = $null

if (Test-Path $envFile) {
    Write-Host "Leyendo token desde .env.local..." -ForegroundColor Cyan
    $envContent = Get-Content $envFile -Raw
    
    # Extraer SUPABASE_TOKEN
    if ($envContent -match 'SUPABASE_TOKEN="([^"]+)"') {
        $SUPABASE_TOKEN = $matches[1]
        Write-Host "Token obtenido desde .env.local" -ForegroundColor Green
    }
}

# Si no se encontro token en .env.local, solicitar manualmente
if (-not $SUPABASE_TOKEN) {
    Write-Host "Token no encontrado en .env.local" -ForegroundColor Yellow
    $SUPABASE_TOKEN = Read-Host "Ingresa tu token de Supabase (opcional, presiona Enter para omitir)"
}

# Configurar token si existe
if ($SUPABASE_TOKEN) {
    $env:SUPABASE_ACCESS_TOKEN = $SUPABASE_TOKEN
    Write-Host "Token configurado exitosamente" -ForegroundColor Green
} else {
    Write-Host "Continuando sin token (modo local)" -ForegroundColor Yellow
}

Write-Host ""

# Esperar a que Supabase este listo
Write-Host "Esperando a que Supabase este listo..." -ForegroundColor Yellow
$maxAttempts = 60
$attempt = 0
$ready = $false

while ($attempt -lt $maxAttempts -and -not $ready) {
    try {
        $status = supabase status 2>&1
        $statusStr = $status | Out-String
        
        # Verificar que PostgreSQL este disponible
        if ($statusStr -match "PostgreSQL" -and $statusStr -notmatch "not ready") {
            $ready = $true
            Write-Host "Supabase esta completamente listo" -ForegroundColor Green
        } else {
            $attempt++
            Write-Host "Intento $attempt/$maxAttempts - Esperando a que PostgreSQL este listo..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    } catch {
        $attempt++
        Write-Host "Intento $attempt/$maxAttempts - Esperando..." -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
}

if (-not $ready) {
    Write-Host "Supabase no esta listo despues de esperar. Intenta:" -ForegroundColor Red
    Write-Host ""
    Write-Host "1. Abre Docker Desktop y verifica que este corriendo"
    Write-Host "2. En terminal, ejecuta: supabase start"
    Write-Host "3. Espera 60-90 segundos para que PostgreSQL inicie completamente"
    Write-Host "4. Luego ejecuta este script nuevamente"
    Write-Host ""
    Write-Host "Si persiste el error, intenta:"
    Write-Host "   supabase stop"
    Write-Host "   supabase start"
    exit 1
}

# Aplicar migracion
Write-Host "Aplicando migracion..." -ForegroundColor Cyan

# Usar el archivo de migracion con timestamp correcto
$migrationFile = "supabase/migrations/20251212000000_create_banner_config_table.sql"

if (Test-Path $migrationFile) {
    Write-Host "Usando archivo de migracion: $migrationFile" -ForegroundColor Cyan
    
    # Intentar aplicar migracion
    supabase migration up
    
    # Si falla, intentar reset y luego aplicar
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Limpiando estado de migraciones..." -ForegroundColor Yellow
        supabase db reset --local
        
        Write-Host "Aplicando migracion nuevamente..." -ForegroundColor Cyan
        supabase migration up
    }
} else {
    Write-Host "Archivo de migracion no encontrado: $migrationFile" -ForegroundColor Red
    exit 1
}

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
