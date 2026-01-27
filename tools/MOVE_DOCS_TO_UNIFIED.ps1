param(
  [string]$Root = "c:\Users\conej\Documents\conecta-social-comunidad-main"
)

$ErrorActionPreference = "Stop"

function New-DirIfMissing([string]$path) {
  if (!(Test-Path -LiteralPath $path)) {
    New-Item -ItemType Directory -Force -Path $path | Out-Null
  }
}

function Move-NoClobber([string]$srcFile, [string]$dstDir) {
  $srcPath = Join-Path $Root $srcFile
  if (!(Test-Path -LiteralPath $srcPath)) {
    Write-Host ("SKIP (missing): {0}" -f $srcFile)
    return
  }

  New-DirIfMissing $dstDir
  $dstPath = Join-Path $dstDir (Split-Path $srcFile -Leaf)
  if (Test-Path -LiteralPath $dstPath) {
    Write-Host ("SKIP (exists): {0}" -f $dstPath)
    return
  }

  Move-Item -LiteralPath $srcPath -Destination $dstDir
  Write-Host ("MOVED: {0} -> {1}" -f $srcFile, $dstDir)
}

$dev = Join-Path $Root "docs-unified\development"
$aud = Join-Path $Root "docs-unified\auditorias"
$impl = Join-Path $Root "docs-unified\implementation"

New-DirIfMissing $dev
New-DirIfMissing $aud
New-DirIfMissing $impl

# development/
Move-NoClobber "ESTADO_DOMINIOS_REFACTOR_2026-01-24.md" $dev
Move-NoClobber "FASE2_COMPAT_LAYER_2026-01-24.md" $dev
Move-NoClobber "FASE4_CLEANUP_2026-01-24.md" $dev

# auditorias/
Move-NoClobber "audit-report.md" $aud
Move-NoClobber "audit-hallazgos.md" $aud
Move-NoClobber "AUDITORIA_SEGURIDAD_SRC_2026-01-22.md" $aud

# implementation/
Move-NoClobber "VALIDACION_PROMPTS_ECOSISTEMA_CLUBES_v3.6.6.md" $impl
