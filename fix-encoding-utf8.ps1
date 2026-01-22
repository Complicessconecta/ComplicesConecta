# Fix Encoding UTF-8 Masivo
# Fecha: 22 de Enero, 2026
# Versión: v3.9.2

$files = Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts
$totalFiles = $files.Count
$fixedFiles = 0

Write-Host "Iniciando fix de encoding UTF-8 masivo..." -ForegroundColor Green
Write-Host "Total de archivos: $totalFiles" -ForegroundColor Yellow

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8

    # Reemplazos de encoding corrupto
    $originalContent = $content
    $content = $content -replace 'aos(?![a-zA-Z])', 'años'
    $content = $content -replace 'das(?![a-zA-Z])', 'días'
    $content = $content -replace 'autnticas', 'auténticas'
    $content = $content -replace 'relacin', 'relación'
    $content = $content -replace 'sesin', 'sesión'
    $content = $content -replace 'mismos', 'mísimos'
    $content = $content -replace 'tambin', 'también'
    $content = $content -replace 'ningn', 'ningún'

    if ($content -ne $originalContent) {
        Set-Content $file.FullName -Value $content -Encoding UTF8
        $fixedFiles++
        Write-Host "Fixed: $($file.FullName)" -ForegroundColor Cyan
    }
}

Write-Host "`nFix completado!" -ForegroundColor Green
Write-Host "Archivos corregidos: $fixedFiles de $totalFiles" -ForegroundColor Yellow

# Verificación
Write-Host "`nVerificando archivos con encoding corrupto restantes..." -ForegroundColor Yellow
$corruptedFiles = Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts |
    Select-String -Pattern 'aos(?![a-zA-Z])|das(?![a-zA-Z])|autnticas|relacin' |
    Select-Object -Unique Path

if ($corruptedFiles) {
    Write-Host "Archivos con encoding corrupto restantes:" -ForegroundColor Red
    $corruptedFiles | ForEach-Object { Write-Host "  - $($_.Path)" }
} else {
    Write-Host "No se encontraron archivos con encoding corrupto." -ForegroundColor Green
}
