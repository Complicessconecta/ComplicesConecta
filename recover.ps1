$targetBase = "bcktraesrc"
if (!(Test-Path $targetBase)) { New-Item -ItemType Directory -Path $targetBase }

$filesRefact = @(
    "src/components/clubs/PartnerRequestModal.tsx",
    "src/components/ui/aspect-ratio.tsx",
    "src/components/ui/calendar.tsx",
    "src/components/ui/collapsible.tsx",
    "src/components/ui/command.tsx",
    "src/components/ui/context-menu.tsx",
    "src/components/ui/events-carousel.tsx",
    "src/components/ui/file-upload.tsx",
    "src/components/ui/form.tsx",
    "src/components/ui/hover-card.tsx",
    "src/components/ui/input-otp.tsx",
    "src/components/ui/menubar.tsx",
    "src/components/ui/navigation-menu.tsx",
    "src/components/ui/pagination.tsx",
    "src/components/ui/resizable.tsx",
    "src/components/ui/toggle-group.tsx",
    "docs/roadmap/PLAN_MAESTRO_CONSOLIDACION.md",
    "docs/roadmap/PLAN_CORRECCION_VISUAL_SINGLE.md"
)

foreach ($file in $filesRefact) {
    $targetPath = Join-Path $targetBase $file
    $parentDir = Split-Path $targetPath
    if (!(Test-Path $parentDir)) { New-Item -ItemType Directory -Path $parentDir -Force | Out-Null }
    
    try {
        # Using git show with specific encoding handling for PowerShell
        # We redirect stderr to null to avoid clutter if file missing
        git show "refact-inteligente-Tra-2025-12-23:$file" 2>$null | Out-File -FilePath $targetPath -Encoding utf8
        if (Test-Path $targetPath) {
             if ((Get-Item $targetPath).Length -gt 0) {
                Write-Host "Recovered from refact: $file"
             } else {
                Remove-Item $targetPath
                Write-Host "File empty or not found in refact: $file"
             }
        }
    } catch {
        Write-Host "Error recovering: $file"
    }
}

$filesLab = @(
    "src/components/profile/ParentalControl.tsx",
    "src/components/profiles/couple/useCouplePhotos.ts",
    "src/components/ui/GlobalBackground.tsx",
    "src/components/ui/GlobalBackgroundWrapper.tsx",
    "src/components/ui/ImageWithFallback.tsx",
    "src/components/ui/LazyImage.tsx",
    "src/components/ui/LogoutButton.tsx",
    "src/components/ui/OptimizedImage.tsx",
    "src/components/ui/chart.tsx",
    "src/components/ui/drawer.tsx",
    "src/components/ui/popover.tsx",
    "src/components/ui/sonner.tsx",
    "src/components/ui/table.tsx",
    "src/pages/Admin.tsx",
    "src/pages/AdminAnalytics.tsx",
    "src/pages/AdminCareerApplications.tsx",
    "src/pages/AdminDashboard.tsx",
    "src/pages/AdminModerators.tsx",
    "src/pages/AdminPartners.tsx",
    "src/pages/AdminProduction.tsx",
    "src/types/supabase-extensions.ts",
    "src/types/supabase-final.ts",
    "src/types/supabase-helpers.ts",
    "src/types/supabase-local.ts",
    "src/types/supabase-remote.ts",
    "src/types/supabase-updated.ts",
    "src/utils/captureConsoleErrors.ts",
    "src/utils/clearStorage.ts",
    "src/utils/dynamicImports.ts",
    "src/utils/emailValidation.ts",
    "src/utils/hcaptcha-verify.ts",
    "src/utils/imageProcessing.ts",
    "src/utils/lazyComponents.ts",
    "src/utils/platformDetection.ts"
)

foreach ($file in $filesLab) {
    $targetPath = Join-Path $targetBase $file
    if (Test-Path $targetPath) {
        Write-Host "Skipping (already recovered): $file"
        continue
    }
    
    $parentDir = Split-Path $targetPath
    if (!(Test-Path $parentDir)) { New-Item -ItemType Directory -Path $parentDir -Force | Out-Null }
    
    try {
        git show "laboratorio-test:$file" 2>$null | Out-File -FilePath $targetPath -Encoding utf8
        if (Test-Path $targetPath) {
             if ((Get-Item $targetPath).Length -gt 0) {
                Write-Host "Recovered from lab: $file"
             } else {
                Remove-Item $targetPath
                Write-Host "File empty or not found in lab: $file"
             }
        }
    } catch {
        Write-Host "Error recovering: $file"
    }
}
