$ErrorActionPreference = "Stop"

function Ensure-Dir($path) {
  if (-not (Test-Path $path)) { New-Item -ItemType Directory -Path $path | Out-Null }
}

function Move-PreferringNewer($src, $destDir) {
  if (-not (Test-Path $src)) { return }
  Ensure-Dir $destDir
  $dest = Join-Path $destDir (Split-Path $src -Leaf)
  if (Test-Path $dest) {
    $s = Get-Item $src
    $d = Get-Item $dest
    if ($s.LastWriteTime -gt $d.LastWriteTime) {
      Move-Item -Force $src $dest
    } else {
      Remove-Item -Force $src
    }
  } else {
    Move-Item -Force $src $dest
  }
}

# 1) couples -> profiles/couple
$cplSrc = "src/components/couples"
$cplDst = "src/components/profiles/couple"
if (Test-Path $cplSrc) {
  Get-ChildItem -Path $cplSrc -File | ForEach-Object { Move-PreferringNewer $_.FullName $cplDst }
  Remove-Item -Recurse -Force $cplSrc
}

# 3A) StoryReportDialog: dialogs -> stories
$storyDlgSrc = "src/components/dialogs/StoryReportDialog.tsx"
$storyDlgDstDir = "src/components/stories"
if (Test-Path $storyDlgSrc) { Move-PreferringNewer $storyDlgSrc $storyDlgDstDir }

# 3B) InvitationDialog: dialogs -> invitations
$invDlgSrc = "src/components/dialogs/InvitationDialog.tsx"
$invDlgDstDir = "src/components/invitations"
if (Test-Path $invDlgSrc) { Move-PreferringNewer $invDlgSrc $invDlgDstDir }

# 4) CoupleProfilesService -> services/couple
Ensure-Dir "src/services/couple"
$svcSrc = "src/components/profiles/couple/CoupleProfilesService.ts"
if (Test-Path $svcSrc) { Move-PreferringNewer $svcSrc "src/services/couple" }

# Limpieza de carpetas vacías
if ((Test-Path "src/components/dialogs") -and ((Get-ChildItem "src/components/dialogs").Count -eq 0)) {
  Remove-Item -Recurse -Force "src/components/dialogs"
}

Write-Host "Pendiente: actualizar imports '@/components/couples/' -> '@/components/profiles/couple/'"
Write-Host "Pendiente: actualizar imports '@/components/dialogs/StoryReportDialog' -> '@/components/stories/StoryReportDialog'"
Write-Host "Pendiente: actualizar imports '@/components/dialogs/InvitationDialog' -> '@/components/invitations/InvitationDialog'"
Write-Host "Pendiente: actualizar imports a CoupleProfilesService -> '@/services/couple/CoupleProfilesService'"
Write-Host "Pendiente: migrar '@/shared/ui/*' a '@/components/ui/*' donde sea seguro; marcar legacy"
