# Bloque de Importaciones
# Descripción: Script para sincronizar una rama de respaldo con el estado actual de otra rama (ej. master)

param(
    [string]$SourceBranch = "master",
    [string]$BackupBranch = "backup/main-11dic2025"
)

# Bloque de Constantes
# Descripción: Define la ruta del repo y comandos base de git

$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-WarnMsg {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Bloque de Validaciones Iniciales
# Descripción: Verifica que el repositorio esté limpio antes de sincronizar

Set-Location $RepoRoot

Write-Info "Repositorio: $RepoRoot"

# Verificar estado de git
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-WarnMsg "Hay cambios sin commitear en la rama actual. Confirma antes de continuar."
    Write-Host $gitStatus
    Write-ErrorMsg "Abortando para no perder trabajo local. Commitea o stashea antes de correr este script."
    exit 1
}

# Bloque de Sincronización
# Descripción: Actualiza la rama de respaldo para que apunte al mismo commit que la rama origen

try {
    Write-Info "Cambiando a rama de respaldo: $BackupBranch"
    git checkout $BackupBranch | Out-Null
}
catch {
    Write-ErrorMsg "No se pudo hacer checkout a la rama '$BackupBranch'. Verifica que exista."
    exit 1
}

Write-Info "Reseteando '$BackupBranch' al estado de '$SourceBranch' (git reset --hard)"
$resetResult = git reset --hard $SourceBranch
Write-Host $resetResult

Write-Info "Pusheando respaldo actualizado a origin/$BackupBranch (force)"
$pushResult = git push origin $BackupBranch --force
Write-Host $pushResult

Write-Info "Volviendo a rama origen: $SourceBranch"
git checkout $SourceBranch | Out-Null

Write-Info "Respaldo actualizado correctamente."
Write-Info "BackupBranch: $BackupBranch -> ahora apunta a la misma revisión que '$SourceBranch'."
