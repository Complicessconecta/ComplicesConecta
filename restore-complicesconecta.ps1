# Bloque de Importaciones
# Descripción: Script para restaurar un backup .zip del proyecto ComplicesConecta a una carpeta destino

param(
    [Parameter(Mandatory = $true)]
    [string]$ZipPath,

    [Parameter(Mandatory = $true)]
    [string]$DestinationPath
)

# Bloque de Constantes
# Descripción: Normaliza rutas y valida entrada

$ZipFullPath = (Resolve-Path $ZipPath).Path
$DestinationFullPath = (Resolve-Path $DestinationPath -ErrorAction SilentlyContinue)

# Bloque de Funciones
# Descripción: Logging básico en consola

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

$ErrorActionPreference = "Stop"

# Bloque de Componentes
# Descripción: Validación de archivo .zip y preparación de carpeta destino

if (-not (Test-Path $ZipFullPath)) {
    Write-ErrorMsg "No se encontró el archivo ZIP: $ZipPath"
    exit 1
}

if (-not $DestinationFullPath) {
    Write-Info "El directorio destino no existe, creando: $DestinationPath"
    New-Item -ItemType Directory -Path $DestinationPath -Force | Out-Null
    $DestinationFullPath = (Resolve-Path $DestinationPath).Path
}

Write-Info "ZIP de respaldo: $ZipFullPath"
Write-Info "Destino de restauración: $DestinationFullPath"

# Bloque de Renderizado
# Descripción: Proceso de extracción del ZIP al destino (no borra nada existente, solo sobreescribe conflictos)

try {
    Write-Info "Iniciando restauración del backup..."

    # Extrae el ZIP sobre la carpeta destino; archivos existentes con mismo nombre serán sobreescritos
    Expand-Archive -Path $ZipFullPath -DestinationPath $DestinationFullPath -Force

    Write-Info "Restauración completada correctamente."
}
catch {
    Write-ErrorMsg "Falló la restauración del backup: $($_.Exception.Message)"
    exit 1
}
