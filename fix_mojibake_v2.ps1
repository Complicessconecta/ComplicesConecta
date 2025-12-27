$files = @(
    "src\pages\TokensInfo.tsx",
    "src\components\settings\ExplicitInterestsEditor.tsx",
    "src\components\profiles\single\ProfileSingle.tsx"
)

foreach ($file in $files) {
    $path = Join-Path "c:\Users\conej\Documents\conecta-social-comunidad-main" $file
    if (Test-Path $path) {
        $content = Get-Content $path -Raw -Encoding UTF8
        
        # Sequential replacements to avoid hash literal syntax errors with special chars
        $content = $content.Replace("circulaciÃ³n", "circulación")
        $content = $content.Replace("CirculaciÃ³n", "Circulación")
        $content = $content.Replace("CaracterÃ­sticas", "Características")
        $content = $content.Replace("DiseÃ±ado", "Diseñado")
        $content = $content.Replace("ExplÃ­citos", "Explícitos")
        $content = $content.Replace("InformaciÃ³n", "Información")
        $content = $content.Replace("pÃºblico", "público")
        $content = $content.Replace("estÃ¡n", "están")
        $content = $content.Replace("polÃ­ticas", "políticas")
        $content = $content.Replace("mÃ¡s", "más")
        $content = $content.Replace("Ã¢â€ â€™", "->")
        $content = $content.Replace("âš ï¸", "⚠️")
        $content = $content.Replace("Saber mÃ¡s", "Saber más")
        
        # Fix Irregular Whitespace (U+00A0)
        $content = $content.Replace([char]0x00A0, " ")

        Set-Content $path -Value $content -Encoding UTF8
        Write-Host "Processed $file"
    } else {
        Write-Host "File not found: $file"
    }
}
