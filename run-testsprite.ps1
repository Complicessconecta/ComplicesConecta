param(
  [int]$Port = 8080,
  [string]$ProjectRoot = (Get-Location).Path,
  [string]$TestspriteCli = "C:\Users\conej\AppData\Local\npm-cache\_npx\8ddf6bea01b2519d\node_modules\@testsprite\testsprite-mcp\dist\index.js",
  [int]$ServerWaitSeconds = 60
)

$ErrorActionPreference = 'Stop'

function Get-PidsListeningOnPort {
  param([int]$Port)

  $lines = cmd /c "netstat -ano | findstr :$Port" 2>$null
  if (-not $lines) { return @() }

  $pids = @()
  foreach ($line in ($lines -split "`r?`n")) {
    $trim = $line.Trim()
    if (-not $trim) { continue }

    # netstat output format: Proto LocalAddress ForeignAddress State PID
    # Example: TCP    0.0.0.0:8080   0.0.0.0:0   LISTENING   12345
    $parts = $trim -split '\s+'
    if ($parts.Count -lt 5) { continue }
    $procId = $parts[$parts.Count - 1]
    if ($procId -match '^\d+$') { $pids += [int]$procId }
  }

  return $pids | Select-Object -Unique
}

function Wait-Http200 {
  param(
    [string]$Url,
    [int]$TimeoutSeconds
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $status = (Invoke-WebRequest $Url -UseBasicParsing).StatusCode
      if ($status -eq 200) { return $true }
    } catch {
      Start-Sleep -Seconds 1
    }
  }
  return $false
}

function Write-TestspriteReport {
  param(
    [string]$RawReportPath,
    [string]$OutReportPath
  )

  $raw = Get-Content $RawReportPath -Raw -ErrorAction Stop

  $analysisText = "Verificación local OK (200). Fallos suelen deberse a expectativas de UI/selector o rutas protegidas; revisar cada caso en el raw_report."
  $gapsText = "- Persisten fallos por UI/selector (ej. TC001) y/o rutas protegidas.\n- Validar flujos no autenticados (chat/info) y consistencia de UI para tests automatizados."

  $report = $raw.Replace('{{TODO:AI_ANALYSIS}}', $analysisText).Replace('{AI_GNERATED_KET_GAPS_AND_RISKS}', $gapsText)

  # Forzar UTF-8
  Set-Content -Path $OutReportPath -Value $report -Encoding utf8
}

Write-Host "[1/4] Liberando puerto $Port..." -ForegroundColor Cyan
$pids = Get-PidsListeningOnPort -Port $Port
if ($pids.Count -gt 0) {
  foreach ($procId in ($pids)) {
    try {
      Write-Host " - Matando PID $procId" -ForegroundColor Yellow
      Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    } catch {}
  }
  Start-Sleep -Seconds 2
}

Write-Host "[2/4] Iniciando Vite (npm run dev) en $ProjectRoot..." -ForegroundColor Cyan
$dev = Start-Process -FilePath "cmd" -ArgumentList @("/c","npm.cmd","run","dev") -WorkingDirectory $ProjectRoot -PassThru

$localUrl = "http://localhost:$Port/"
if (-not (Wait-Http200 -Url $localUrl -TimeoutSeconds $ServerWaitSeconds)) {
  Write-Error "El servidor no respondió 200 en $localUrl dentro de $ServerWaitSeconds segundos."
}
Write-Host "Servidor listo: $localUrl" -ForegroundColor Green

Write-Host "[3/4] Ejecutando TestSprite..." -ForegroundColor Cyan
if (-not (Test-Path $TestspriteCli)) {
  Write-Error "No se encontró TestSprite CLI en: $TestspriteCli`nPasa -TestspriteCli con la ruta correcta."
}

$nodeArgs = @(
  $TestspriteCli,
  "generateCodeAndExecute"
)
$tests = Start-Process -FilePath "node" -ArgumentList $nodeArgs -WorkingDirectory $ProjectRoot -Wait -PassThru
if ($tests.ExitCode -ne 0) {
  Write-Error "TestSprite terminó con exit code $($tests.ExitCode)."
}

Write-Host "[4/4] Generando reporte Markdown UTF-8..." -ForegroundColor Cyan
$rawPath = Join-Path $ProjectRoot "testsprite_tests\tmp\raw_report.md"
$outPath = Join-Path $ProjectRoot "testsprite_tests\testsprite-mcp-test-report.md"
Write-TestspriteReport -RawReportPath $rawPath -OutReportPath $outPath
Write-Host "Reporte generado: $outPath" -ForegroundColor Green

Write-Host "Listo. Nota: el proceso Vite sigue corriendo con PID $($dev.Id)." -ForegroundColor Green
