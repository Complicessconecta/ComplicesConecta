# generate_index.ps1
$UiDir = "src/components/ui"
$Subfolders = Get-ChildItem -Path $UiDir -Directory
$Exports = @()

foreach ($folder in $Subfolders) {
    if ($folder.Name -like "_*") { continue }
    
    $IndexPath = Join-Path $folder.FullName "index.ts"
    if (Test-Path $IndexPath) {
        Write-Host "Folder $($folder.Name) has index.ts"
        $Exports += "export * from './$($folder.Name)';"
    } else {
        Write-Host "Folder $($folder.Name) scanning for files..."
        $Components = Get-ChildItem -Path $folder.FullName -Recurse -File | Where-Object { $_.Extension -match "\.tsx?$" -and $_.Name -ne "index.ts" }
        foreach ($comp in $Components) {
            $RelPath = $comp.FullName.Substring((Get-Item $UiDir).FullName.Length + 1)
            $RelPath = $RelPath -replace "\\", "/" -replace "\.tsx?$", ""
            $Exports += "export * from './$RelPath';"
        }
    }
}

$IndexFile = "$UiDir/index.ts"
$Exports | Out-File -FilePath $IndexFile -Encoding utf8
Write-Host "Total Exports: $($Exports.Count)"
$Exports | ForEach-Object { Write-Host $_ }
