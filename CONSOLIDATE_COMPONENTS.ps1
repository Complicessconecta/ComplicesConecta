# ============================================================================
# Script: Consolidar componentes profile/ a profiles/shared/
# Descripción: Copia componentes únicos de src/components/profile/ a 
#              src/components/profiles/shared/ y elimina el directorio antiguo
# ============================================================================

param(
    [switch]$DryRun = $false,
    [switch]$Force = $false
)

# Colores para output
$colors = @{
    Info = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
}

function Write-Info { Write-Host "[INFO] $args" -ForegroundColor $colors.Info }
function Write-Success { Write-Host "[✓] $args" -ForegroundColor $colors.Success }
function Write-Warning { Write-Host "[!] $args" -ForegroundColor $colors.Warning }
function Write-Error { Write-Host "[✗] $args" -ForegroundColor $colors.Error }

# ============================================================================
# PASO 1: Verificar directorios
# ============================================================================
Write-Info "Verificando directorios..."

$sourceDir = "src/components/profile"
$targetDir = "src/components/profiles/shared"

if (-not (Test-Path $sourceDir)) {
    Write-Error "Directorio fuente no existe: $sourceDir"
    exit 1
}

if (-not (Test-Path $targetDir)) {
    Write-Error "Directorio destino no existe: $targetDir"
    exit 1
}

Write-Success "Directorios verificados"

# ============================================================================
# PASO 2: Listar archivos a consolidar
# ============================================================================
Write-Info "Archivos en $sourceDir:"
$sourceFiles = Get-ChildItem -Path $sourceDir -File | Where-Object { $_.Extension -eq ".tsx" -or $_.Extension -eq ".ts" }

foreach ($file in $sourceFiles) {
    Write-Info "  - $($file.Name)"
}

# ============================================================================
# PASO 3: Comparar y copiar archivos
# ============================================================================
Write-Info "Comparando archivos..."

$copiedFiles = @()
$skippedFiles = @()

foreach ($file in $sourceFiles) {
    $targetPath = Join-Path $targetDir $file.Name
    
    if (Test-Path $targetPath) {
        # Comparar contenido
        $sourceContent = Get-Content $file.FullName -Raw
        $targetContent = Get-Content $targetPath -Raw
        
        if ($sourceContent -eq $targetContent) {
            Write-Warning "  $($file.Name) - Idéntico, saltando"
            $skippedFiles += $file.Name
        } else {
            Write-Warning "  $($file.Name) - Existe pero es diferente"
            Write-Info "    Comparación: source=$(($sourceContent | Measure-Object -Character).Characters) bytes vs target=$(($targetContent | Measure-Object -Character).Characters) bytes"
            
            if (-not $Force) {
                Write-Warning "    Use -Force para sobrescribir"
                $skippedFiles += $file.Name
            } else {
                if (-not $DryRun) {
                    Copy-Item $file.FullName $targetPath -Force
                    Write-Success "  $($file.Name) - Sobrescrito"
                    $copiedFiles += $file.Name
                } else {
                    Write-Info "  [DRY-RUN] $($file.Name) - Sería sobrescrito"
                    $copiedFiles += $file.Name
                }
            }
        }
    } else {
        # Copiar archivo nuevo
        if (-not $DryRun) {
            Copy-Item $file.FullName $targetPath
            Write-Success "  $($file.Name) - Copiado"
            $copiedFiles += $file.Name
        } else {
            Write-Info "  [DRY-RUN] $($file.Name) - Sería copiado"
            $copiedFiles += $file.Name
        }
    }
}

# ============================================================================
# PASO 4: Resumen
# ============================================================================
Write-Info ""
Write-Info "Resumen:"
Write-Info "  Archivos copiados: $($copiedFiles.Count)"
Write-Info "  Archivos saltados: $($skippedFiles.Count)"

if ($copiedFiles.Count -gt 0) {
    Write-Info ""
    Write-Info "Archivos copiados:"
    foreach ($file in $copiedFiles) {
        Write-Info "    - $file"
    }
}

if ($skippedFiles.Count -gt 0) {
    Write-Info ""
    Write-Warning "Archivos saltados:"
    foreach ($file in $skippedFiles) {
        Write-Warning "    - $file"
    }
}

# ============================================================================
# PASO 5: Eliminar directorio antiguo (solo si no es dry-run)
# ============================================================================
if (-not $DryRun -and $copiedFiles.Count -gt 0) {
    Write-Warning ""
    Write-Warning "¿Eliminar directorio antiguo $sourceDir? (S/N)"
    $response = Read-Host
    
    if ($response -eq "S" -or $response -eq "s") {
        Remove-Item $sourceDir -Recurse -Force
        Write-Success "Directorio $sourceDir eliminado"
    } else {
        Write-Warning "Directorio $sourceDir NO fue eliminado"
    }
}

if ($DryRun) {
    Write-Info ""
    Write-Info "Modo DRY-RUN: No se realizaron cambios"
    Write-Info "Ejecuta sin -DryRun para aplicar cambios"
}

Write-Success "Consolidación completada"
