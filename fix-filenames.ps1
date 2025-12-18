# Script para sanitizar nombres de archivos en public/assets/
# Normaliza archivos recursivamente: elimina espacios, paréntesis, convierte a kebab-case

$targetPath = Join-Path $PSScriptRoot "public\assets"

if (-not (Test-Path $targetPath)) {
    Write-Host "❌ Error: No se encontró la carpeta public/assets" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Sanitizando nombres de archivos en: $targetPath" -ForegroundColor Cyan
Write-Host ""

function Convert-ToKebabCase {
    param([string]$text)
    
    # Convertir a minúsculas
    $text = $text.ToLower()
    
    # Reemplazar espacios y caracteres especiales por guiones
    $text = $text -replace '[áàäâ]', 'a'
    $text = $text -replace '[éèëê]', 'e'
    $text = $text -replace '[íìïî]', 'i'
    $text = $text -replace '[óòöô]', 'o'
    $text = $text -replace '[úùüû]', 'u'
    $text = $text -replace 'ñ', 'n'
    
    # Eliminar paréntesis, corchetes, etc.
    $text = $text -replace '[\(\)\[\]\{\}]', ''
    
    # Reemplazar espacios y guiones bajos por guiones
    $text = $text -replace '[\s_]+', '-'
    
    # Eliminar caracteres especiales excepto guiones, puntos y números
    $text = $text -replace '[^a-z0-9\-\.]', ''
    
    # Eliminar múltiples guiones consecutivos
    $text = $text -replace '-+', '-'
    
    # Eliminar guiones al inicio/final
    $text = $text.Trim('-')
    
    return $text
}

# Obtener todos los archivos recursivamente
$files = Get-ChildItem -Path $targetPath -File -Recurse

$renamedCount = 0
$errorCount = 0

foreach ($file in $files) {
    $fileName = $file.BaseName
    $extension = $file.Extension
    $directory = $file.DirectoryName
    
    # Sanitizar nombre
    $newBaseName = Convert-ToKebabCase $fileName
    
    # Si el nombre no cambió, continuar
    if ($newBaseName -eq $fileName.ToLower() -and $file.Name -eq "$newBaseName$extension") {
        continue
    }
    
    $newName = "$newBaseName$extension"
    $newPath = Join-Path $directory $newName
    
    # Verificar si ya existe un archivo con ese nombre
    if ((Test-Path $newPath) -and ($newPath -ne $file.FullName)) {
        Write-Host "⚠️  SKIP: Ya existe '$newName' en $(Split-Path $directory -Leaf)/" -ForegroundColor Yellow
        $errorCount++
        continue
    }
    
    try {
        # Renombrar archivo
        Rename-Item -Path $file.FullName -NewName $newName -ErrorAction Stop
        Write-Host "✅ Renombrado: '$($file.Name)' → '$newName'" -ForegroundColor Green
        $renamedCount++
    }
    catch {
        Write-Host "❌ ERROR: No se pudo renombrar '$($file.Name)': $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✨ RESUMEN:" -ForegroundColor Cyan
Write-Host "   Archivos renombrados: $renamedCount" -ForegroundColor Green
if ($errorCount -gt 0) {
    Write-Host "   Errores/Omitidos: $errorCount" -ForegroundColor Yellow
}
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚡ Para ejecutar: .\fix-filenames.ps1" -ForegroundColor Magenta
