$files = @(
    "src\pages\TokensInfo.tsx",
    "src\components\settings\ExplicitInterestsEditor.tsx",
    "src\components\profiles\single\ProfileSingle.tsx"
)

$replacements = @{
    "circulaciÃ³n" = "circulación";
    "CirculaciÃ³n" = "Circulación";
    "CaracterÃ­sticas" = "Características";
    "DiseÃ±ado" = "Diseñado";
    "ExplÃ­citos" = "Explícitos";
    "InformaciÃ³n" = "Información";
    "pÃºblico" = "público";
    "estÃ¡n" = "están";
    "polÃ­ticas" = "políticas";
    "mÃ¡s" = "más";
    "Ã¢â€ â€™" = "→";
    "âš ï¸" = "⚠️";
}

foreach ($file in $files) {
    $path = Join-Path "c:\Users\conej\Documents\conecta-social-comunidad-main" $file
    if (Test-Path $path) {
        $content = Get-Content $path -Raw -Encoding UTF8
        $original = $content
        foreach ($key in $replacements.Keys) {
            # Use [regex]::Escape to handle special characters if necessary, but direct string replace is safer for these exact matches
            # But string replace is case sensitive
            $content = $content.Replace($key, $replacements[$key])
        }
        
        if ($content -ne $original) {
            Set-Content $path -Value $content -Encoding UTF8
            Write-Host "Fixed mojibake in $file"
        }
    }
}
