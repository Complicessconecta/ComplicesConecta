# SCRIPT DE AUDITORÍA - ComplicesConecta v3.8.16
# Verifica la integridad del proyecto

Write-Host "`n=== AUDITORÍA DEL PROYECTO ===" -ForegroundColor Cyan
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

# 1. Verificar tablas base
Write-Host "`n1. Verificando estructura de directorios..." -ForegroundColor Yellow
$dirs = @('src', 'src/components', 'src/features', 'src/hooks', 'src/services', 'supabase', 'supabase/migrations')
foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Write-Host "  ✓ $dir" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $dir (FALTA)" -ForegroundColor Red
    }
}

# 2. Verificar archivos críticos
Write-Host "`n2. Verificando archivos críticos..." -ForegroundColor Yellow
$files = @(
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'src/App.tsx',
    'src/main.tsx',
    'supabase/migrations/20251207_add_missing_columns.sql'
)
foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $file (FALTA)" -ForegroundColor Red
    }
}

# 3. Contar archivos TypeScript
Write-Host "`n3. Estadísticas de archivos..." -ForegroundColor Yellow
$tsFiles = @(Get-ChildItem -Path "src" -Recurse -Filter "*.ts" -ErrorAction SilentlyContinue).Count
$tsxFiles = @(Get-ChildItem -Path "src" -Recurse -Filter "*.tsx" -ErrorAction SilentlyContinue).Count
$cssFiles = @(Get-ChildItem -Path "src" -Recurse -Filter "*.css" -ErrorAction SilentlyContinue).Count

Write-Host "  TypeScript files (.ts): $tsFiles" -ForegroundColor Cyan
Write-Host "  React files (.tsx): $tsxFiles" -ForegroundColor Cyan
Write-Host "  CSS files (.css): $cssFiles" -ForegroundColor Cyan

# 4. Verificar migraciones SQL
Write-Host "`n4. Verificando migraciones SQL..." -ForegroundColor Yellow
$migrations = Get-ChildItem -Path "supabase/migrations" -Filter "*.sql" -ErrorAction SilentlyContinue
Write-Host "  Migraciones encontradas: $($migrations.Count)" -ForegroundColor Cyan
foreach ($migration in $migrations | Select-Object -First 5) {
    Write-Host "    - $($migration.Name)" -ForegroundColor Gray
}

# 5. Verificar git status
Write-Host "`n5. Estado de Git..." -ForegroundColor Yellow
$gitStatus = git status --short
if ($gitStatus) {
    Write-Host "  Cambios sin commitear:" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor Gray
} else {
    Write-Host "  ✓ Working tree clean" -ForegroundColor Green
}

# 6. Últimos commits
Write-Host "`n6. Últimos commits..." -ForegroundColor Yellow
$commits = git log --oneline -5
Write-Host $commits -ForegroundColor Gray

Write-Host "`n=== AUDITORÍA COMPLETADA ===" -ForegroundColor Cyan
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""
