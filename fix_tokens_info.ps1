$path = "c:\Users\conej\Documents\conecta-social-comunidad-main\src\pages\TokensInfo.tsx"
$content = Get-Content $path -Raw -Encoding UTF8

# .NET String.Replace is case-sensitive
$content = $content.Replace("circulaciÃ³n", "circulación")
$content = $content.Replace("CirculaciÃ³n", "Circulación")
$content = $content.Replace("CaracterÃ­sticas", "Características")
$content = $content.Replace("DiseÃ±ado", "Diseñado")

Set-Content $path -Value $content -Encoding UTF8
Write-Host "Fixed mojibake in TokensInfo.tsx"
