$ErrorActionPreference = "Stop"
$root = Get-Location
$src = "$root\src"
$logFile = "$root\encoding_fix_log_v2.txt"

"Timestamp: $(Get-Date)" | Out-File $logFile

function Build-String {
    param ([int[]]$codes)
    $chars = $codes | ForEach-Object { [char]$_ }
    return -join $chars
}

# Define replacements using ONLY code points to avoid script encoding issues
$replacements = [ordered]@{
    # Ã¡ -> á
    (Build-String 0xC3, 0xA1) = "á"
    
    # Ã© -> é
    (Build-String 0xC3, 0xA9) = "é"
    
    # Ã­ -> í (C3 + Soft Hyphen)
    (Build-String 0xC3, 0xAD) = "í"
    
    # Ã³ -> ó
    (Build-String 0xC3, 0xB3) = "ó"
    
    # Ãº -> ú
    (Build-String 0xC3, 0xBA) = "ú"
    
    # Ã± -> ñ
    (Build-String 0xC3, 0xB1) = "ñ"
    
    # Ã‘ -> Ñ
    (Build-String 0xC3, 0x2018) = "Ñ"
    
    # Â¿ -> ¿
    (Build-String 0xC2, 0xBF) = "¿"
    
    # Â¡ -> ¡
    (Build-String 0xC2, 0xA1) = "¡"
    
    # â™¿ -> ♿ (U+2679)
    (Build-String 0xE2, 0x2122, 0xBF) = [char]0x2679
    
    # ðŸ”§ -> 🔧 (U+1F527)
    (Build-String 0xF0, 0x0178, 0x201D, 0xA7) = [char]::ConvertFromUtf32(0x1F527)
}

$files = Get-ChildItem -Path $src -Recurse -Include *.tsx, *.ts

foreach ($file in $files) {
    try {
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
            Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
            "Fixed encoding in: $($file.Name)" | Out-File -Append $logFile
        }
    } catch {
        "Error processing $($file.Name): $_" | Out-File -Append $logFile
    }
}

"Encoding fix v2 complete. Check $logFile."
