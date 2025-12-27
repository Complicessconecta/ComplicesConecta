
$files = @(
    "src/components/performance/LazyComponentLoader.tsx",
    "src/components/profiles/couple/CouplePreNuptialAgreement.tsx",
    "src/pages/TokensInfo.tsx",
    "src/components/admin/AnalyticsDashboard.tsx",
    "src/components/admin/ModerationMetrics.tsx",
    "src/components/ai/SmartMatchingModal.tsx",
    "src/components/android/AndroidOptimizedApp.tsx",
    "src/components/auth/InterestsSelector.tsx",
    "src/components/chat/ChatRoom.tsx",
    "src/components/chat/ConsentIndicator.tsx",
    "src/components/modals/InstallAppModal.tsx",
    "src/components/modals/SmartMatchingModal.tsx",
    "src/components/modals/StakingModal.tsx",
    "src/components/modals/TermsModalAuth.tsx",
    "src/components/performance/CodeSplittingManager.tsx",
    "src/components/performance/ImageOptimizer.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
        
        # Fix Mojibake (Common patterns)
        $content = $content.Replace("âš ï¸", "⚠️")
        $content = $content.Replace("pÃ¡gina", "página")
        $content = $content.Replace("ClÃ¡usula", "Cláusula")
        $content = $content.Replace("SÃºbita", "Súbita")
        $content = $content.Replace("disoluciÃ³n", "disolución")
        $content = $content.Replace("dÃ­as", "días")
        $content = $content.Replace("ðŸ ", "🏠")
        $content = $content.Replace("MÃ©xico", "México")
        $content = $content.Replace("automÃ¡tica", "automática")
        $content = $content.Replace("InformaciÃ³n", "Información")
        $content = $content.Replace("PolÃ­tica", "Política")
        $content = $content.Replace("TambiÃ©n", "También")
        $content = $content.Replace("vÃ­deo", "vídeo")
        $content = $content.Replace("cÃ¡mara", "cámara")
        $content = $content.Replace("crÃ©dito", "crédito")
        $content = $content.Replace("bÃ¡sica", "básica")
        $content = $content.Replace("pÃºblica", "pública")
        $content = $content.Replace("autenticaciÃ³n", "autenticación")
        $content = $content.Replace("verificaciÃ³n", "verificación")
        $content = $content.Replace("configuraciÃ³n", "configuración")
        $content = $content.Replace("ubicaciÃ³n", "ubicación")
        $content = $content.Replace("notificaciÃ³n", "notificación")
        $content = $content.Replace("acciÃ³n", "acción")
        $content = $content.Replace("secciÃ³n", "sección")
        $content = $content.Replace("elecciÃ³n", "elección")
        $content = $content.Replace("direcciÃ³n", "dirección")
        $content = $content.Replace("protecciÃ³n", "protección")
        $content = $content.Replace("interacciÃ³n", "interacción")
        $content = $content.Replace("conexiÃ³n", "conexión")
        $content = $content.Replace("ediciÃ³n", "edición")
        $content = $content.Replace("cÃ³digo", "código")
        $content = $content.Replace("tÃ©rminos", "términos")
        $content = $content.Replace("condiciÃ³n", "condición")
        
        # Fix Irregular Whitespace (NBSP to Space)
        $content = $content.Replace([char]0x00A0, " ")
        
        [System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Fixed encoding/whitespace in $file"
    } else {
        Write-Host "File not found: $file"
    }
}
