<#
.SYNOPSIS
  Normaliza importaciones a alias "@/" y alerta sobre default exports.
.DESCRIPTION
  • Recorre recursivamente todos los .ts/.tsx/.js/.jsx bajo /src
  • Reemplaza rutas relativas en import/export por alias
  • Reporta archivos con `export default`
  • Modo prueba controlado por $dryRun
.NOTES
  PowerShell Core 7+
#>

param(
  [string]$Root = (Resolve-Path "./src").Path
)

$ErrorActionPreference = "Stop"
$dryRun = $false  # Cambiar a $false para aplicar cambios
$importRegex = @'
(import|export)\s+[^;]*?\sfrom\s+['"`](\.{1,2}/[^'"`]+)['"`]
'@ 
$defaultExportRegex = 'export\s+default'

function Resolve-AbsolutePath {
  param([string]$RelativePath, [string]$CurrentDir)
  $combined = Join-Path $CurrentDir $RelativePath
  try { return (Resolve-Path -LiteralPath $combined).Path } catch { return $null }
}

function Convert-ToAlias {
  param([string]$AbsolutePath, [string]$SrcRoot)
  if ($AbsolutePath -like "$SrcRoot*") {
    $rel = $AbsolutePath.Substring($SrcRoot.Length).TrimStart([char]'\',[char]'/')
  $normalized = $rel -replace '\\\\','/'
    return "@/$normalized"
  }
  return $null
}

Write-Host "🔍 Escaneando archivos en $Root`n"

Get-ChildItem -Path $Root -Recurse -Include *.ts,*.tsx,*.js,*.jsx | ForEach-Object {
  $filePath = $_.FullName
  $content  = Get-Content $filePath -Raw
  $dir      = Split-Path $filePath
  $newContent = $content
  $hasChanges = $false

  if ($content -match $defaultExportRegex) {
    Write-Warning "⚠️  Default Export detectado: $filePath"
  }

  [regex]::Matches($content, $importRegex) | ForEach-Object {
    $full = $_.Value
    $rel  = $_.Groups[2].Value
    $abs  = Resolve-AbsolutePath $rel $dir
    if (!$abs) { return }
    $alias = Convert-ToAlias $abs (Resolve-Path $Root).Path
    if ($alias) {
      $escaped = [regex]::Escape($rel)
      $newLine = $full -replace $escaped, $alias
      $newContent = $newContent -replace [regex]::Escape($full), [System.Text.RegularExpressions.Regex]::Escape($newLine)
      $hasChanges = $true
      Write-Host "• $filePath`n   $rel  →  $alias"
    }
  }

  if ($hasChanges -and -not $dryRun) {
    Set-Content -Path $filePath -Value $newContent -Encoding UTF8
  }
}

if ($dryRun) {
  Write-Host "`n🏁 Dry-run completado. Nada modificado. Cambia $dryRun = \$false para aplicar."
} else {
  Write-Host "`n✅ Rutas normalizadas y guardadas."
}
