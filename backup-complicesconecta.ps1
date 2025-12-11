# Bloque de Importaciones
# Descripción: Este bloque prepara dependencias y configuración básica para el script de respaldo

param()

# Bloque de Constantes
# Descripción: Define rutas base, nombre del proyecto y formato de timestamp

$ProjectName = "complicesconecta"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackupRoot = "D:\complicesconecta_backups"
$Timestamp  = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFileName = "${ProjectName}_backup_${Timestamp}.zip"
$BackupPath = Join-Path $BackupRoot $BackupFileName

# Bloque de Funciones
# Descripción: Funciones auxiliares para logging y validaciones

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Bloque de Eventos
# Descripción: Manejo básico de errores del script

$ErrorActionPreference = "Stop"

# Bloque de Estilos
# Descripción: No aplica estilos visuales, solo colores en consola para mensajes

# (Ya se usan colores en Write-Info y Write-ErrorMsg)

# Bloque de Componentes
# Descripción: Preparación de directorios y verificación de rutas

Write-Info "Directorio del proyecto: $ProjectRoot"
Write-Info "Directorio de backups: $BackupRoot"

if (-not (Test-Path $ProjectRoot)) {
    Write-ErrorMsg "No se encontró el directorio del proyecto: $ProjectRoot"
    exit 1
}

if (-not (Test-Path $BackupRoot)) {
    Write-Info "Directorio de backups no existe, creando: $BackupRoot"
    New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null
}

# Bloque de Renderizado
# Descripción: Ejecución del proceso de compresión y creación del archivo ZIP de respaldo (versión ligera)

Write-Info "Iniciando respaldo LIGERO del proyecto (sin node_modules / dist / coverage / reports)..."
Write-Info "Archivo de salida: $BackupPath"

try {
    # Se usará una carpeta temporal para copiar solo contenido relevante al respaldo ligero
    $tempRoot = Join-Path $env:TEMP "${ProjectName}_backup_${Timestamp}"

    if (Test-Path $tempRoot) {
        Write-Info "Limpando carpeta temporal previa: $tempRoot"
        Remove-Item -Path $tempRoot -Recurse -Force
    }

    Write-Info "Creando carpeta temporal: $tempRoot"
    New-Item -ItemType Directory -Path $tempRoot -Force | Out-Null

    # Paths a incluir explícitamente (ligero pero completo para código, config y CI/CD)
    $includePaths = @(
        "src",
        "supabase",
        "scripts",
        ".github",
        ".circleci",
        "kubernetes",
        "docs",
        "legal",
        "android",
        "playwright.config.*",
        "package.json",
        "pnpm-lock.yaml",
        "pnpm-workspace.yaml",
        "tsconfig*.json",
        ".windsurfrules",
        ".gitignore",
        ".npmrc",
        "*.md",
        ".env*"
    )

    foreach ($relPath in $includePaths) {
        $source = Join-Path $ProjectRoot $relPath
        $items = Get-ChildItem -Path $source -Recurse -ErrorAction SilentlyContinue

        if (-not $items) {
            continue
        }

        Write-Info "Agregando al backup ligero: $relPath"

        foreach ($item in $items) {
            $relative = $item.FullName.Substring($ProjectRoot.Length).TrimStart('\\','/')
            $dest = Join-Path $tempRoot $relative
            $destDir = Split-Path -Parent $dest

            if (-not (Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            }

            if ($item.PSIsContainer) {
                if (-not (Test-Path $dest)) {
                    New-Item -ItemType Directory -Path $dest -Force | Out-Null
                }
            }
            else {
                Copy-Item -Path $item.FullName -Destination $dest -Force
            }
        }
    }

    # Comprimir solo la carpeta temporal (ligera)
    Compress-Archive -Path (Join-Path $tempRoot '*') -DestinationPath $BackupPath -Force

    Write-Info "Respaldo ligero completado correctamente."
    Write-Info "Backup generado en: $BackupPath"

    # Limpieza de carpeta temporal
    Write-Info "Eliminando carpeta temporal: $tempRoot"
    Remove-Item -Path $tempRoot -Recurse -Force
}
catch {
    Write-ErrorMsg "Falló la creación del respaldo ligero: $($_.Exception.Message)"
    exit 1
}
