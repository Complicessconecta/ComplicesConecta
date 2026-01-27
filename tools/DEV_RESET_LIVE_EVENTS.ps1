param(
  [int]$PortPrimary = 8080,
  [int]$PortVite = 5173,
  [string]$DevCommand = "npm run dev",
  [switch]$KillOnly,
  [switch]$BackupLight
)

$ErrorActionPreference = "Stop"

function Write-Section([string]$title) {
  Write-Host ""
  Write-Host "=== $title ==="
}

function Stop-ProcessesByName([string[]]$Names) {
  foreach ($n in $Names) {
    $procs = Get-Process -Name $n -ErrorAction SilentlyContinue
    foreach ($p in $procs) {
      try {
        Write-Host "Stopping process: $($p.ProcessName) (PID $($p.Id))"
        Stop-Process -Id $p.Id -Force -ErrorAction Stop
      } catch {
        Write-Host "WARN: Could not stop $n (PID $($p.Id)): $($_.Exception.Message)"
      }
    }
  }
}

function Stop-ListenersOnPort([int]$port) {
  $lines = netstat -ano | Select-String -Pattern (":$port\s+")
  if (-not $lines) {
    Write-Host "No listeners found on port $port"
    return
  }

  $pids = @()
  foreach ($m in $lines) {
    $parts = ($m.ToString() -split "\s+") | Where-Object { $_ -ne "" }
    # Expected: Proto LocalAddress ForeignAddress State PID
    if ($parts.Length -ge 5) {
      $processId = $parts[$parts.Length - 1]
      if ($processId -match "^\d+$") { $pids += [int]$processId }
    }
  }

  $pids = $pids | Sort-Object -Unique
  foreach ($processId in $pids) {
    try {
      $p = Get-Process -Id $processId -ErrorAction Stop
      Write-Host "Stopping listener on port ${port}: $($p.ProcessName) (PID $processId)"
      Stop-Process -Id $processId -Force -ErrorAction Stop
    } catch {
      Write-Host "WARN: Could not stop PID $processId for port ${port}: $($_.Exception.Message)"
    }
  }
}

function Open-Urls([string[]]$Urls) {
  foreach ($u in $Urls) {
    try {
      Write-Host "Opening: $u"
      Start-Process $u
    } catch {
      Write-Host "WARN: Could not open ${u}: $($_.Exception.Message)"
    }
  }
}

function Backup-Lightweight([string]$SourceRoot) {
  $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
  $destRoot = "D:\CC_BACKUP_${timestamp}"

  Write-Section "Backup lightweight to D:"
  Write-Host "Source: $SourceRoot"
  Write-Host "Dest:   $destRoot"

  $excludeDirs = @(
    "node_modules",
    "dist",
    "dist-ssr",
    "build",
    ".vite",
    ".vite-cache",
    "android",
    "ios",
    "coverage",
    "playwright-report",
    "playwright-report-e2e",
    "test-results",
    "docker-data",
    "docker-volumes",
    "docs-unified"
  )

  # Robocopy: máximo rendimiento (multi-thread), copia recursiva, tolerante a errores
  $roboArgs = @(
    $SourceRoot,
    $destRoot,
    "/E",
    "/COPY:DAT",
    "/DCOPY:DAT",
    "/R:2",
    "/W:1",
    "/MT:32",
    "/NP",
    "/NFL",
    "/NDL",
    "/XD"
  ) + $excludeDirs

  $proc = Start-Process -FilePath "robocopy" -ArgumentList $roboArgs -Wait -PassThru -NoNewWindow
  # Robocopy considera 0-7 como éxito (con variaciones)
  if ($proc.ExitCode -gt 7) {
    throw "Robocopy failed with exit code $($proc.ExitCode)"
  }

  Write-Host "Backup completed (robocopy exit code $($proc.ExitCode))"
}

Write-Section "Kill Docker-related processes"
Stop-ProcessesByName @(
  "Docker Desktop",
  "DockerDesktop",
  "com.docker.backend",
  "com.docker.build",
  "com.docker.cli",
  "dockerd",
  "docker"
)

Write-Section "Kill Node/Vite listeners (ports $PortPrimary, $PortVite)"
Stop-ListenersOnPort -port $PortPrimary
Stop-ListenersOnPort -port $PortVite

if ($BackupLight) {
  $projectRoot = Split-Path -Parent $PSScriptRoot
  Backup-Lightweight -SourceRoot $projectRoot
}

if ($KillOnly) {
  Write-Host ""
  Write-Host "KillOnly enabled: not starting dev server."
  exit 0
}

Write-Section "Start dev server"
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $projectRoot

Write-Host "Running: $DevCommand"
Write-Host "(Close this terminal window to stop the dev server)"

# Open browser first so you can see when it comes up
Open-Urls @(
  "http://localhost:$PortPrimary",
  "http://localhost:$PortVite"
)

Write-Host ""
Write-Host "IDE Browser Preview tip:"
Write-Host "- PowerShell cannot force the IDE panel to appear; open Browser Preview manually and point it to one of:"
Write-Host "  - http://localhost:$PortPrimary"
Write-Host "  - http://localhost:$PortVite"

# Run dev command in current shell (blocking)
Invoke-Expression $DevCommand
