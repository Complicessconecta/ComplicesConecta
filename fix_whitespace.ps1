$files = @(
    "src\components\settings\PrivacySettings.tsx",
    "src\components\tokens\StakingModal.tsx",
    "src\components\tokens\TokenChatBot.tsx",
    "src\components\tokens\TokenDashboard.tsx",
    "src\lib\safe-storage.ts",
    "src\lib\storage-manager.ts",
    "src\pages\LeyOlimpia.tsx",
    "src\pages\ModeratorDashboard.tsx",
    "src\pages\TokensTerms.tsx",
    "src\services\PerformanceMonitoringService.ts",
    "src\services\security\SecurityMonitor.ts",
    "src\tests\Chat.test.tsx",
    "src\tests\components\Chat.test.tsx",
    "src\tests\components\TokenDashboard.test.tsx",
    "src\tests\e2e\helpers\test-utils.ts",
    "src\tests\setup.ts"
)

foreach ($file in $files) {
    $path = Join-Path "c:\Users\conej\Documents\conecta-social-comunidad-main" $file
    if (Test-Path $path) {
        $content = Get-Content $path -Raw -Encoding UTF8
        # Replace non-breaking space (U+00A0) with regular space
        $fixed = $content.Replace([char]0x00A0, " ")
        if ($content -ne $fixed) {
            Set-Content $path -Value $fixed -Encoding UTF8
            Write-Host "Fixed whitespace in $file"
        }
    } else {
        Write-Host "File not found: $file"
    }
}
