# ============================================================================
# SCRIPT DE MIGRACIÓN CON PSQL - SIN DOCKER
# ============================================================================
# Descripción: Ejecuta migraciones en Supabase usando psql directamente
# Requisito: psql debe estar instalado (PostgreSQL client tools)
# Fecha: 13 Dic 2025
# Versión: v1.0
# ============================================================================

Write-Host "🚀 Iniciando migración con psql (sin Docker)..." -ForegroundColor Cyan
Write-Host ""

# Paso 1: Verificar que psql está instalado
Write-Host "Paso 1: Verificando que psql está instalado..." -ForegroundColor Yellow

try {
    $psqlVersion = psql --version 2>&1
    Write-Host "✅ psql encontrado: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ psql no está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Para instalar PostgreSQL client tools:" -ForegroundColor Yellow
    Write-Host "1. Descarga desde: https://www.postgresql.org/download/windows/" -ForegroundColor Gray
    Write-Host "2. O usa: choco install postgresql" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

Write-Host ""

# Paso 2: Leer variables de entorno
Write-Host "Paso 2: Leyendo configuración de Supabase..." -ForegroundColor Yellow

if (Test-Path ".env.local") {
    $envContent = Get-Content ".env.local"
    
    # Extraer URL de Supabase
    $supabaseUrl = ($envContent | Select-String "VITE_SUPABASE_URL" | ForEach-Object { $_.Line.Split("=")[1] }).Trim()
    
    # Extraer host de la URL (ej: https://project.supabase.co -> project.supabase.co)
    $supabaseHost = $supabaseUrl -replace "https://", "" -replace "/$", ""
    
    Write-Host "✅ Configuración cargada" -ForegroundColor Green
    Write-Host "   Host: $supabaseHost" -ForegroundColor Gray
} else {
    Write-Host "❌ Archivo .env.local no encontrado" -ForegroundColor Red
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
Write-Host "   Host: $supabaseHost" -ForegroundColor Gray
Write-Host ""

# Crear archivo temporal con la migración
$tempFile = [System.IO.Path]::GetTempFileName() -replace '\.tmp$', '.sql'
Set-Content -Path $tempFile -Value $migrationSQL -Encoding UTF8

try {
    # Ejecutar psql con el archivo de migración
    # Nota: Necesitas proporcionar la contraseña interactivamente o usar PGPASSWORD
    Write-Host "Conectando a Supabase..." -ForegroundColor Cyan
    Write-Host "Por favor ingresa la contraseña de Supabase cuando se solicite" -ForegroundColor Yellow
    Write-Host ""
    
    # Usar psql para conectar a Supabase
    psql -h $supabaseHost `
         -U postgres `
         -d postgres `
         -f $tempFile `
         -v ON_ERROR_STOP=1 2>&1 | Tee-Object -Variable migrationOutput
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migración ejecutada exitosamente" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "⚠️ Migración completada con advertencias o errores" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error ejecutando migración: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Limpiar archivo temporal
    if (Test-Path $tempFile) {
        Remove-Item $tempFile -Force
    }
}

Write-Host ""

# Paso 5: Regenerar tipos TypeScript
Write-Host "Paso 5: Regenerando tipos TypeScript..." -ForegroundColor Yellow

try {
    supabase gen types typescript --project-id (($supabaseHost -split "\.")[0]) > src/types/supabase.ts
    Write-Host "✅ Tipos TypeScript regenerados" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Error regenerando tipos: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   Pero la migración puede haber sido aplicada correctamente" -ForegroundColor Gray
}

Write-Host ""

# Resumen final
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host "✅ PROCESO COMPLETADO" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Cyan
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Yellow
Write-Host "1. Verifica que no hay errores de TypeScript"
Write-Host "2. Integra AdminBannerPanel en tu admin dashboard"
Write-Host "3. Prueba el sistema de gestión de banners"
Write-Host ""
Write-Host "Para usar este script en el futuro:" -ForegroundColor Gray
Write-Host "  .\run-migration-psql.ps1" -ForegroundColor Gray
Write-Host ""
