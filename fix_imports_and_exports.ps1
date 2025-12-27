param (
    [string]$TargetDir = "src",
    [switch]$Rollback = $false,
    [switch]$NoBackup = $false
)

$ErrorActionPreference = "Stop"
$root = Get-Location
$targetPath = Join-Path $root $TargetDir
$logFile = "$root\import_fix_log.txt"
$reportFile = "$root\import_validation_report.txt"

if ($Rollback) {
    Write-Host "Iniciando ROLLBACK..." -ForegroundColor Yellow
    $backupFiles = Get-ChildItem -Path $targetPath -Recurse -Include *.bak
    foreach ($bak in $backupFiles) {
        $originalName = $bak.FullName.Substring(0, $bak.FullName.Length - 4)
        Copy-Item -Path $bak.FullName -Destination $originalName -Force
        Remove-Item $bak.FullName
        Write-Host "Restored: $originalName"
    }
    Write-Host "Rollback completado." -ForegroundColor Green
    exit
}

"Timestamp: $(Get-Date)" | Out-File $logFile
"Timestamp: $(Get-Date)" | Out-File $reportFile

function Resolve-Path-Custom {
    param ($basePath, $importPath)
    
    if ($importPath.StartsWith("@/")) {
        return $importPath.Replace("@/", "$root/src/")
    }
    elseif ($importPath.StartsWith(".")) {
        $combined = Join-Path $basePath $importPath
        return [System.IO.Path]::GetFullPath($combined)
    }
    return $null
}

if (-not (Test-Path $targetPath)) {
    Write-Error "Directorio no encontrado: $targetPath"
    exit
}

$files = Get-ChildItem -Path $targetPath -Recurse -Include *.tsx, *.ts

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content
    $changed = $false
    
    # Regex to capture import paths
    # Matches: import ... from 'path'; or import ... from "path";
    # Also handles dynamic imports: import('path')
    $imports = [regex]::Matches($content, "from\s+['""]([^'""]+)['""]|import\(['""]([^'""]+)['""]\)")
    
    foreach ($match in $imports) {
        $importPath = if ($match.Groups[1].Value) { $match.Groups[1].Value } else { $match.Groups[2].Value }
        
        # Skip non-relative/non-alias imports (packages)
        if (-not ($importPath.StartsWith(".") -or $importPath.StartsWith("@/"))) { continue }

        $resolvedPath = Resolve-Path-Custom -basePath $file.DirectoryName -importPath $importPath
        
        if ($resolvedPath) {
            # Check extensions: .tsx, .ts, index.tsx, index.ts
            $exists = $false
            $candidates = @(
                "$resolvedPath.tsx",
                "$resolvedPath.ts",
                "$resolvedPath\index.tsx",
                "$resolvedPath\index.ts",
                "$resolvedPath.d.ts",
                 $resolvedPath # In case it points to a file with extension already
            )
            
            # If explicit extension provided
            if (Test-Path $resolvedPath -PathType Leaf) { $exists = $true }
            
            foreach ($c in $candidates) {
                if (Test-Path $c) { $exists = $true; break }
            }
            
            if (-not $exists) {
                # Attempt Auto-Fix for known moved components
                $fixedPath = $null
                
                # UI Components Logic
                if ($importPath -match "@/components/ui/Button") { $fixedPath = "@/components/ui/buttons/Button" }
                elseif ($importPath -match "@/components/ui/Card") { $fixedPath = "@/components/ui/cards/Card" }
                elseif ($importPath -match "@/components/ui/Input") { $fixedPath = "@/components/ui/forms/Input" }
                # Profiles Logic
                elseif ($importPath -match "@/components/profile/") { $fixedPath = $importPath.Replace("profile/", "profiles/") }
                # Utils to Lib
                elseif ($importPath -match "@/utils/") { $fixedPath = $importPath.Replace("utils/", "lib/") }

                if ($fixedPath) {
                    "Fixing: $($file.Name) -> $importPath to $fixedPath" | Out-File -Append $logFile
                    $newContent = $newContent.Replace($importPath, $fixedPath)
                    $changed = $true
                } else {
                    "MISSING: $($file.FullName) -> $importPath" | Out-File -Append $reportFile
                }
            }
        }
    }
    
    if ($changed) {
        if (-not $NoBackup) {
            Copy-Item -Path $file.FullName -Destination "$($file.FullName).bak" -Force
        }
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
        "Saved changes to $($file.Name)" | Out-File -Append $logFile
    }
}

"Validation complete. Check $reportFile for missing imports."
