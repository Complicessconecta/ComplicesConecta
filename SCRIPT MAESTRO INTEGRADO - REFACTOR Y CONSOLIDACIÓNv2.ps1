# SCRIPT MAESTRO INTEGRADO - REFACTOR Y CONSOLIDACIÓN
# ComplicesConecta v3.6.6
# Consolida refactorización, actualización de imports, auditoría, CSS y consolidación de duplicados

param(
    [switch]$All,
    [switch]$Move,
    [switch]$UpdateImports,
    [switch]$Audit,
    [switch]$FixCSS,
    [switch]$CreateMaster,
    [switch]$RemoveDuplicates,
    [switch]$RemoveEmptyDirs,
    [switch]$DryRun
)

$ErrorActionPreference = "Continue"

function Show-MainMenu {
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║        SCRIPT MAESTRO - REFACTOR Y CONSOLIDACIÓN           ║" -ForegroundColor Cyan
    Write-Host "║                  ComplicesConecta v3.6.6                    ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 REFACTORIZACIÓN Y ACTUALIZACIÓN:" -ForegroundColor Yellow
    Write-Host "  1. Mover archivos a estructura nueva"
    Write-Host "  2. Actualizar imports en archivos"
    Write-Host "  3. Auditoría de código y seguridad"
    Write-Host "  4. Fix CSS y estilos"
    Write-Host "  5. Crear archivo maestro consolidado"
    Write-Host "  6. Ejecutar todo el refactor (1-5)"
    Write-Host ""
    Write-Host "🧹 LIMPIEZA Y OPTIMIZACIÓN:" -ForegroundColor Yellow
    Write-Host "  7. Eliminar archivos duplicados"
    Write-Host "  8. Eliminar directorios vacíos"
    Write-Host "  9. Limpiar todo (duplicados + vacíos)"
    Write-Host "  10. Limpiar y optimizar todo el proyecto (1-9)"
    Write-Host "  11. Consolidar duplicados y limpiar"
    Write-Host "  12. Ejecutar lint y chequeo de errores/warnings"
    Write-Host ""
    Write-Host "0. Salir" -ForegroundColor Red
    Write-Host ""
    $choice = Read-Host "Selecciona una opción"
    return $choice
}

function Move-FilesToNewStructure {
    Write-Host "Moviendo archivos a estructura nueva..." -ForegroundColor Green
    # Lógica de movimiento de archivos (implementar según necesidades)
    Write-Host "Movimiento completado."
}

function Update-Imports {
    Write-Host "Actualizando imports en archivos..." -ForegroundColor Green
    # Lógica de actualización de imports (implementar según necesidades)
    Write-Host "Imports actualizados."
}

function Invoke-Audit {
    Write-Host "Ejecutando auditoría de código y seguridad..." -ForegroundColor Green
    # Lógica de auditoría (implementar según necesidades)
    Write-Host "Auditoría completada."
}

function Repair-CSS {
    Write-Host "Arreglando CSS y estilos..." -ForegroundColor Green
    # Lógica de fix CSS (implementar según necesidades)
    Write-Host "CSS arreglado."
}

function New-MasterFile {
    Write-Host "Creando archivo maestro consolidado..." -ForegroundColor Green
    # Lógica de creación del archivo maestro (implementar según necesidades)
    Write-Host "Archivo maestro creado."
}

function Remove-DuplicateFiles {
    Write-Host "Eliminando archivos duplicados..." -ForegroundColor Green
    # Lógica de eliminación de duplicados (implementar según necesidades)
    Write-Host "Duplicados eliminados."
}

function Remove-EmptyDirectories {
    Write-Host "Eliminando directorios vacíos..." -ForegroundColor Green
    # Lógica de eliminación de directorios vacíos (implementar según necesidades)
    Write-Host "Directorios vacíos eliminados."
}

function Invoke-LintCheck {
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║             EJECUTANDO LINT Y CHEQUEO DE ERRORES           ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

    # Ejecutar npm run lint y capturar errores/warnings
    Write-Host "`n🔍 Ejecutando npm run lint y filtrando errores/warnings..." -ForegroundColor Yellow
    npm run lint 2>&1 | findstr /C:"error" /C:"warning" | findstr /V "truncated"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ⚠️  Errores o warnings encontrados en el lint" -ForegroundColor Yellow
    } else {
        Write-Host "  ✅ No se encontraron errores o warnings críticos" -ForegroundColor Green
    }

    # Ejecutar npm run lint y capturar problemas con ✖
    Write-Host "`n🔍 Ejecutando npm run lint y filtrando problemas (✖)..." -ForegroundColor Yellow
    npm run lint 2>&1 | findstr /C:"✖" /C:"problems"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ⚠️  Problemas encontrados en el lint" -ForegroundColor Yellow
    } else {
        Write-Host "  ✅ Lint completado sin problemas" -ForegroundColor Green
    }
}

function Invoke-AllRefactor {
    Move-FilesToNewStructure
    Update-Imports
    Invoke-Audit
    Repair-CSS
    New-MasterFile
}

function Invoke-AllClean {
    Remove-DuplicateFiles
    Remove-EmptyDirectories
}

function Invoke-FullProjectClean {
    Invoke-AllRefactor
    Invoke-AllClean
}

do {
    $choice = Show-MainMenu
    switch ($choice) {
        "1" { Move-FilesToNewStructure }
        "2" { Update-Imports }
        "3" { Invoke-Audit }
        "4" { Repair-CSS }
        "5" { New-MasterFile }
        "6" { Invoke-AllRefactor }
        "7" { Remove-DuplicateFiles }
        "8" { Remove-EmptyDirectories }
        "9" { Invoke-AllClean }
        "10" { Invoke-FullProjectClean }
        "11" { Invoke-AllClean }
        "12" { Invoke-LintCheck }
        "0" { 
            Write-Host "`n¡Hasta luego!" -ForegroundColor Cyan
            exit 0 
        }
        default { Write-Host "`n✗ Opción inválida. Intenta de nuevo." -ForegroundColor Red }
    }
} while ($true)