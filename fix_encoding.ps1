$ErrorActionPreference = "Stop"
$root = Get-Location
$src = "$root\src"
$logFile = "$root\encoding_fix_log.txt"

"Timestamp: $(Get-Date)" | Out-File $logFile

# Map of common mojibake patterns to correct characters
# Based on UTF-8 bytes being interpreted as Windows-1252
$replacements = @{
    "Ã¡" = "á"
    "Ã©" = "é"
    "Ã­" = "í"
    "Ã³" = "ó"
    "Ãº" = "ú"
    "Ã±" = "ñ"
    "Ã‘" = "Ñ"
    "Â¿" = "¿"
    "Â¡" = "¡"
}

# Special case handling might be needed for characters that don't map cleanly to printable 1252 chars
# But these are the most common in Spanish text.

$files = Get-ChildItem -Path $src -Recurse -Include *.tsx, *.ts

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content
    $changed = $false
    
    foreach ($key in $replacements.Keys) {
        if ($newContent.Contains($key)) {
            $newContent = $newContent.Replace($key, $replacements[$key])
            $changed = $true
        }
    }
    
    if ($changed) {
        # Check for "Ã" followed by " " (nbsp) which might be used for indentation or spacing? 
        # Actually usually it's just artifacts.
        
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
        "Fixed encoding in: $($file.Name)" | Out-File -Append $logFile
    }
}

"Encoding fix complete. Check $logFile."
