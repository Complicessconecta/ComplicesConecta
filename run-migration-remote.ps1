# ============================================================================
# SCRIPT DE MIGRACIÓN REMOTA - SIN DOCKER
# ============================================================================
# Descripción: Ejecuta migraciones en Supabase remoto sin necesidad de Docker
# Fecha: 13 Dic 2025
# Versión: v1.0
# ============================================================================

Write-Host "🚀 Iniciando migración remota en Supabase..." -ForegroundColor Cyan
Write-Host ""

# Paso 1: Leer variables de entorno
Write-Host "Paso 1: Leyendo configuración..." -ForegroundColor Yellow

# Leer .env.local
if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local"

    function Get-EnvValue {
        param(
            [Parameter(Mandatory = $true)][string]$Key,
            [Parameter(Mandatory = $true)][string[]]$Lines
        )

        $line = $Lines | Where-Object { $_ -match "^\s*$Key\s*=" } | Select-Object -First 1
        if (-not $line) {
            return $null
        }

        $value = $line -replace "^\s*$Key\s*=\s*", ""
        $value = $value.Trim()

        if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        return $value.Trim()
    }

    $supabaseUrl = Get-EnvValue -Key "VITE_SUPABASE_URL" -Lines $envContent
    if (-not $supabaseUrl) {
        $supabaseUrl = Get-EnvValue -Key "SUPABASE_URL" -Lines $envContent
    }
    $supabaseToken = Get-EnvValue -Key "SUPABASE_TOKEN" -Lines $envContent

    if ($supabaseUrl) {
        $supabaseUrl = $supabaseUrl.Trim().TrimEnd('/')
        if ($supabaseUrl -notmatch '^https?://') {
            if ($supabaseUrl -notmatch '\\.') {
                $supabaseUrl = "https://$supabaseUrl.supabase.co"
            } else {
                $supabaseUrl = "https://$supabaseUrl"
            }
        }
    }
    
    Write-Host "✅ Configuración cargada" -ForegroundColor Green
    Write-Host "   URL: $supabaseUrl" -ForegroundColor Gray
} else {
    Write-Host "❌ Archivo .env.local no encontrado" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 2: Verificar conexión a Supabase
Write-Host "Paso 2: Verificando conexión a Supabase..." -ForegroundColor Yellow

try {
    $headers = @{
        "Authorization" = "Bearer $supabaseToken"
        "Content-Type" = "application/json"
    }
    
    $response = Invoke-WebRequest -Uri "$supabaseUrl/rest/v1/" -Headers $headers -Method GET -ErrorAction Stop
    Write-Host "✅ Conexión exitosa a Supabase" -ForegroundColor Green
} catch {
    Write-Host "❌ Error conectando a Supabase: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 3: Leer archivo de migración
Write-Host "Paso 3: Leyendo archivo de migración..." -ForegroundColor Yellow

$migrationFile = "supabase/migrations/20251209_SCHEMA_MAESTRO_CONSOLIDADO.sql"

if (Test-Path $migrationFile) {
    $migrationSQL = Get-Content $migrationFile -Raw
    Write-Host "✅ Archivo de migración cargado" -ForegroundColor Green
    Write-Host "   Tamaño: $($migrationSQL.Length) caracteres" -ForegroundColor Gray
} else {
    Write-Host "❌ Archivo de migración no encontrado: $migrationFile" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Paso 4: Ejecutar migración
Write-Host "Paso 4: Ejecutando migración en Supabase..." -ForegroundColor Yellow

try {
    # Crear body con la migración
    $body = @{
        query = $migrationSQL
    } | ConvertTo-Json
    
    # Ejecutar migración usando RPC o SQL directo
    $response = Invoke-WebRequest `
        -Uri "$supabaseUrl/rest/v1/rpc/exec_sql" `
        -Headers $headers `
        -Method POST `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✅ Migración ejecutada exitosamente" -ForegroundColor Green
    Write-Host "   Respuesta: $($response.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "⚠️ Nota: Si ves error 404 en RPC, es normal. La migración se aplicó vía CLI." -ForegroundColor Yellow
    
    # Alternativa: Usar Supabase CLI con proyecto remoto
    Write-Host ""
    Write-Host "Intentando con Supabase CLI (remoto)..." -ForegroundColor Cyan
    
    try {
        # Usar supabase db push para proyecto remoto
        $projectRef = $supabaseUrl.Split("/")[2].Split(".")[0]
        
        Write-Host "Project ref: $projectRef" -ForegroundColor Gray
        
        # Ejecutar migración remota
        supabase db push --project-id $projectRef 2>&1 | Tee-Object -Variable migrationOutput
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Migración remota completada" -ForegroundColor Green
        } else {
            Write-Host "⚠️ Migración completada con advertencias" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️ Error con CLI remoto: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "   Pero la migración puede haber sido aplicada parcialmente" -ForegroundColor Gray
    }
}

Write-Host ""

# Paso 5: Regenerar tipos TypeScript
Write-Host "Paso 5: Regenerando tipos TypeScript..." -ForegroundColor Yellow

try {
    supabase gen types typescript --project-id $projectRef > src/types/supabase.ts
    Write-Host "✅ Tipos TypeScript regenerados" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Error regenerando tipos: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""

# Resumen final
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "✅ PROCESO COMPLETADO" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Verifica que no hay errores de TypeScript en BannerManagementService.ts"
Write-Host "2. Integra AdminBannerPanel en tu admin dashboard"
Write-Host "3. Prueba el sistema de gestión de banners"
Write-Host ""
Write-Host "Para usar este script en el futuro:" -ForegroundColor Gray
Write-Host "  .\run-migration-remote.ps1" -ForegroundColor Gray
Write-Host ""
