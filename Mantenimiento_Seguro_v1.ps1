# SCRIPT MANTENIMIENTO SEGURO v1.0
# ComplicesConecta v3.8.16 - Estabilización
# Reparación de lógica crítica y operaciones seguras

param(
    [switch]$All,
    [switch]$Move,
    [switch]$UpdateImports,
    [switch]$Audit,
    [switch]$FixCSS,
    [switch]$CreateMaster,
    [switch]$DryRun = $true
)

$ErrorActionPreference = "Continue"
$WhatIfPreference = $DryRun

# Colores para output
$ColorSuccess = 'Green'
$ColorWarning = 'Yellow'
$ColorError = 'Red'
$ColorInfo = 'Cyan'

function Write-SafeLog {
    param([string]$Message, [string]$Level = 'Info')
    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $color = switch ($Level) {
        'Success' { $ColorSuccess }
        'Warning' { $ColorWarning }
        'Error' { $ColorError }
        default { $ColorInfo }
    }
    Write-Host "[$timestamp] $Message" -ForegroundColor $color
}

function Show-Menu {
    Write-Host "`n=== SCRIPT MANTENIMIENTO SEGURO v1.0 ===" -ForegroundColor $ColorInfo
    Write-Host "Modo: $(if ($DryRun) { 'SIMULACIÓN (Dry Run)' } else { 'EJECUCIÓN REAL' })" -ForegroundColor $ColorWarning
    Write-Host ""
    Write-Host "1. Mover archivos a estructura nueva" -ForegroundColor $ColorWarning
    Write-Host "2. Actualizar todos los imports" -ForegroundColor $ColorWarning
    Write-Host "3. Auditoría completa del proyecto" -ForegroundColor $ColorWarning
    Write-Host "4. Analizar y corregir CSS" -ForegroundColor $ColorWarning
    Write-Host "5. Crear archivo maestro de imports" -ForegroundColor $ColorWarning
    Write-Host "6. Ejecutar todo (1-5)" -ForegroundColor $ColorSuccess
    Write-Host "0. Salir" -ForegroundColor $ColorError
    Write-Host ""
}

function Move-FilesToStructure {
    Write-SafeLog "=== MOVIENDO ARCHIVOS A ESTRUCTURA NUEVA ===" -Level Info
    
    $moveCount = 0
    $errorCount = 0
    
    # 1. Mover archivos Admin
    Write-SafeLog "1. Moviendo archivos Admin..." -Level Warning
    $adminFiles = @(
        "src/pages/Admin.tsx", "src/pages/AdminProduction.tsx", "src/pages/AdminPartners.tsx",
        "src/pages/AdminModerators.tsx", "src/pages/AdminDashboard.tsx",
        "src/pages/AdminCareerApplications.tsx", "src/pages/AdminAnalytics.tsx"
    )
    foreach ($file in $adminFiles) {
        if (Test-Path $file) {
            $dest = "src/app/(admin)/$(Split-Path $file -Leaf)"
            try {
                if ($WhatIfPreference) {
                    Write-SafeLog "  [DRY RUN] Mover: $file -> $dest" -Level Info
                } else {
                    Move-Item $file $dest -Force
                    Write-SafeLog "  ✓ Movido: $(Split-Path $file -Leaf) -> app/(admin)/" -Level Success
                }
                $moveCount++
            } catch {
                Write-SafeLog "  ✗ Error moviendo $file : $_" -Level Error
                $errorCount++
            }
        }
    }
    
    # 2. Mover archivos Clubs
    Write-SafeLog "2. Moviendo archivos Clubs..." -Level Warning
    if (Test-Path "src/pages/Clubs.tsx") {
        try {
            if ($WhatIfPreference) {
                Write-SafeLog "  [DRY RUN] Mover: src/pages/Clubs.tsx -> src/app/(clubs)/Clubs.tsx" -Level Info
            } else {
                Move-Item "src/pages/Clubs.tsx" "src/app/(clubs)/Clubs.tsx" -Force
                Write-SafeLog "  ✓ Movido: Clubs.tsx -> app/(clubs)/" -Level Success
            }
            $moveCount++
        } catch {
            Write-SafeLog "  ✗ Error moviendo Clubs.tsx: $_" -Level Error
            $errorCount++
        }
    }
    
    # 3. Mover archivos Discover
    Write-SafeLog "3. Moviendo archivos Discover..." -Level Warning
    if (Test-Path "src/pages/Discover.tsx") {
        try {
            if ($WhatIfPreference) {
                Write-SafeLog "  [DRY RUN] Mover: src/pages/Discover.tsx -> src/app/(discover)/Discover.tsx" -Level Info
            } else {
                Move-Item "src/pages/Discover.tsx" "src/app/(discover)/Discover.tsx" -Force
                Write-SafeLog "  ✓ Movido: Discover.tsx -> app/(discover)/" -Level Success
            }
            $moveCount++
        } catch {
            Write-SafeLog "  ✗ Error moviendo Discover.tsx: $_" -Level Error
            $errorCount++
        }
    }
    
    # 4. Mover archivos Auth
    Write-SafeLog "4. Moviendo archivos Auth..." -Level Warning
    if (Test-Path "src/pages/Auth.tsx") {
        try {
            if ($WhatIfPreference) {
                Write-SafeLog "  [DRY RUN] Mover: src/pages/Auth.tsx -> src/app/(auth)/Auth.tsx" -Level Info
            } else {
                Move-Item "src/pages/Auth.tsx" "src/app/(auth)/Auth.tsx" -Force
                Write-SafeLog "  ✓ Movido: Auth.tsx -> app/(auth)/" -Level Success
            }
            $moveCount++
        } catch {
            Write-SafeLog "  ✗ Error moviendo Auth.tsx: $_" -Level Error
            $errorCount++
        }
    }
    
    # 5. Mover archivos a Features
    Write-SafeLog "5. Moviendo archivos a Features..." -Level Warning
    $authFiles = @(
        @{ Source = 'src/hooks/useAuth.ts'; Dest = 'src/features/auth/useAuth.ts' },
        @{ Source = 'src/hooks/useBiometricAuth.ts'; Dest = 'src/features/auth/useBiometricAuth.ts' }
    )
    foreach ($file in $authFiles) {
        if (Test-Path $file.Source) {
            try {
                $destDir = Split-Path $file.Dest -Parent
                if (-not (Test-Path $destDir)) {
                    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
                }
                if ($WhatIfPreference) {
                    Write-SafeLog "  [DRY RUN] Mover: $($file.Source) -> $($file.Dest)" -Level Info
                } else {
                    Move-Item $file.Source $file.Dest -Force
                    Write-SafeLog "  ✓ Movido: $(Split-Path $file.Source -Leaf) -> features/auth/" -Level Success
                }
                $moveCount++
            } catch {
                Write-SafeLog "  ✗ Error moviendo $($file.Source): $_" -Level Error
                $errorCount++
            }
        }
    }
    
    $profileFiles = @(
        @{ Source = 'src/hooks/useProfileQuery.ts'; Dest = 'src/features/profile/useProfileQuery.ts' },
        @{ Source = 'src/hooks/useProfileCache.ts'; Dest = 'src/features/profile/useProfileCache.ts' },
        @{ Source = 'src/hooks/useCoupleProfile.ts'; Dest = 'src/features/profile/useCoupleProfile.ts' },
        @{ Source = 'src/hooks/useProfileTheme.ts'; Dest = 'src/features/profile/useProfileTheme.ts' },
        @{ Source = 'src/services/CoupleProfilesService.ts'; Dest = 'src/features/profile/CoupleProfilesService.ts' },
        @{ Source = 'src/services/ProfileReportService.ts'; Dest = 'src/features/profile/ProfileReportService.ts' },
        @{ Source = 'src/lib/coupleProfiles.ts'; Dest = 'src/features/profile/coupleProfiles.ts' },
        @{ Source = 'src/lib/coupleProfilesCompatibility.ts'; Dest = 'src/features/profile/coupleProfilesCompatibility.ts' }
    )
    foreach ($file in $profileFiles) {
        if (Test-Path $file.Source) {
            try {
                $destDir = Split-Path $file.Dest -Parent
                if (-not (Test-Path $destDir)) {
                    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
                }
                if ($WhatIfPreference) {
                    Write-SafeLog "  [DRY RUN] Mover: $($file.Source) -> $($file.Dest)" -Level Info
                } else {
                    Move-Item $file.Source $file.Dest -Force
                    Write-SafeLog "  ✓ Movido: $(Split-Path $file.Source -Leaf) -> features/profile/" -Level Success
                }
                $moveCount++
            } catch {
                Write-SafeLog "  ✗ Error moviendo $($file.Source): $_" -Level Error
                $errorCount++
            }
        }
    }
    
    if (Test-Path "src/services/clubFlyerImageProcessing.ts") {
        try {
            New-Item -ItemType Directory -Force -Path "src/features/clubs" | Out-Null
            if ($WhatIfPreference) {
                Write-SafeLog "  [DRY RUN] Mover: src/services/clubFlyerImageProcessing.ts -> src/features/clubs/" -Level Info
            } else {
                Move-Item "src/services/clubFlyerImageProcessing.ts" "src/features/clubs/clubFlyerImageProcessing.ts" -Force
                Write-SafeLog "  ✓ Movido: clubFlyerImageProcessing.ts -> features/clubs/" -Level Success
            }
            $moveCount++
        } catch {
            Write-SafeLog "  ✗ Error moviendo clubFlyerImageProcessing.ts: $_" -Level Error
            $errorCount++
        }
    }
    
    $chatFiles = @(
        @{ Source = 'src/hooks/useRealtimeChat.ts'; Dest = 'src/features/chat/useRealtimeChat.ts' },
        @{ Source = 'src/hooks/useVideoChat.ts'; Dest = 'src/features/chat/useVideoChat.ts' },
        @{ Source = 'src/hooks/ai/useChatSummary.ts'; Dest = 'src/features/chat/useChatSummary.ts' },
        @{ Source = 'src/services/ChatPrivacyService.ts'; Dest = 'src/features/chat/ChatPrivacyService.ts' },
        @{ Source = 'src/services/ai/ChatSummaryService.ts'; Dest = 'src/features/chat/ChatSummaryService.ts' }
    )
    New-Item -ItemType Directory -Force -Path "src/features/chat" | Out-Null
    foreach ($file in $chatFiles) {
        if (Test-Path $file.Source) {
            try {
                if ($WhatIfPreference) {
                    Write-SafeLog "  [DRY RUN] Mover: $($file.Source) -> $($file.Dest)" -Level Info
                } else {
                    Move-Item $file.Source $file.Dest -Force
                    Write-SafeLog "  ✓ Movido: $(Split-Path $file.Source -Leaf) -> features/chat/" -Level Success
                }
                $moveCount++
            } catch {
                Write-SafeLog "  ✗ Error moviendo $($file.Source): $_" -Level Error
                $errorCount++
            }
        }
    }
    
    Write-SafeLog "Resumen: $moveCount movidos, $errorCount errores" -Level $(if ($errorCount -eq 0) { 'Success' } else { 'Warning' })
}

function Update-AllImports {
    Write-SafeLog "=== ACTUALIZANDO TODOS LOS IMPORTS ===" -Level Info
    
    $archivos = Get-ChildItem "src" -Recurse -File -ErrorAction SilentlyContinue | Where-Object { 
        $_.Extension -match '\.(tsx|ts)$' -and $_.FullName -notmatch 'node_modules|dist|build' 
    }
    
    $reemplazos = @(
        @{ Viejo = '@/pages/Admin'; Nuevo = '@/app/(admin)/Admin' },
        @{ Viejo = '@/pages/AdminProduction'; Nuevo = '@/app/(admin)/AdminProduction' },
        @{ Viejo = '@/pages/AdminPartners'; Nuevo = '@/app/(admin)/AdminPartners' },
        @{ Viejo = '@/pages/AdminModerators'; Nuevo = '@/app/(admin)/AdminModerators' },
        @{ Viejo = '@/pages/AdminDashboard'; Nuevo = '@/app/(admin)/AdminDashboard' },
        @{ Viejo = '@/pages/AdminCareerApplications'; Nuevo = '@/app/(admin)/AdminCareerApplications' },
        @{ Viejo = '@/pages/AdminAnalytics'; Nuevo = '@/app/(admin)/AdminAnalytics' },
        @{ Viejo = '@/pages/Clubs'; Nuevo = '@/app/(clubs)/Clubs' },
        @{ Viejo = '@/pages/Discover'; Nuevo = '@/app/(discover)/Discover' },
        @{ Viejo = '@/pages/Auth'; Nuevo = '@/app/(auth)/Auth' },
        @{ Viejo = '@/hooks/useAuth'; Nuevo = '@/features/auth/useAuth' },
        @{ Viejo = '@/hooks/useBiometricAuth'; Nuevo = '@/features/auth/useBiometricAuth' },
        @{ Viejo = '@/hooks/useProfileQuery'; Nuevo = '@/features/profile/useProfileQuery' },
        @{ Viejo = '@/hooks/useProfileCache'; Nuevo = '@/features/profile/useProfileCache' },
        @{ Viejo = '@/hooks/useCoupleProfile'; Nuevo = '@/features/profile/useCoupleProfile' },
        @{ Viejo = '@/hooks/useProfileTheme'; Nuevo = '@/features/profile/useProfileTheme' },
        @{ Viejo = '@/hooks/useRealtimeChat'; Nuevo = '@/features/chat/useRealtimeChat' },
        @{ Viejo = '@/hooks/useVideoChat'; Nuevo = '@/features/chat/useVideoChat' },
        @{ Viejo = '@/hooks/ai/useChatSummary'; Nuevo = '@/features/chat/useChatSummary' },
        @{ Viejo = '@/services/CoupleProfilesService'; Nuevo = '@/features/profile/CoupleProfilesService' },
        @{ Viejo = '@/services/ProfileReportService'; Nuevo = '@/features/profile/ProfileReportService' },
        @{ Viejo = '@/services/ChatPrivacyService'; Nuevo = '@/features/chat/ChatPrivacyService' },
        @{ Viejo = '@/services/clubFlyerImageProcessing'; Nuevo = '@/features/clubs/clubFlyerImageProcessing' },
        @{ Viejo = '@/services/ai/ChatSummaryService'; Nuevo = '@/features/chat/ChatSummaryService' },
        @{ Viejo = '@/lib/coupleProfiles'; Nuevo = '@/features/profile/coupleProfiles' },
        @{ Viejo = '@/lib/coupleProfilesCompatibility'; Nuevo = '@/features/profile/coupleProfilesCompatibility' },
        @{ Viejo = '@/pages/ProfileSingle'; Nuevo = '@/profiles/single/ProfileSingle' },
        @{ Viejo = '@/pages/EditProfileSingle'; Nuevo = '@/profiles/single/EditProfileSingle' },
        @{ Viejo = '@/pages/ProfileCouple'; Nuevo = '@/profiles/couple/ProfileCouple' },
        @{ Viejo = '@/pages/EditProfileCouple'; Nuevo = '@/profiles/couple/EditProfileCouple' },
        @{ Viejo = '@/pages/Profiles'; Nuevo = '@/profiles/shared/Profiles' },
        @{ Viejo = '@/pages/ProfileDetail'; Nuevo = '@/profiles/shared/ProfileDetail' },
        @{ Viejo = '@/components/ui/button'; Nuevo = '@/shared/ui/Button' },
        @{ Viejo = '@/components/ui/card'; Nuevo = '@/shared/ui/Card' },
        @{ Viejo = '@/components/ui/input'; Nuevo = '@/shared/ui/Input' },
        @{ Viejo = '@/components/ui/dialog'; Nuevo = '@/shared/ui/Modal' },
        @{ Viejo = '@/lib/utils'; Nuevo = '@/shared/lib/cn' },
        @{ Viejo = '@/shared/hooks/useGeolocation'; Nuevo = '@/hooks/useGeolocation' },
        @{ Viejo = '@/shared/hooks/usePersistedState'; Nuevo = '@/hooks/usePersistedState' },
        @{ Viejo = '@/shared/hooks/useIsomorphicLayoutEffect'; Nuevo = '@/hooks/useIsomorphicLayoutEffect' },
        @{ Viejo = '@/shared/hooks/useToast'; Nuevo = '@/hooks/useToast' },
        @{ Viejo = '@/hooks/use-toast'; Nuevo = '@/hooks/useToast' },
        @{ Viejo = '@/types/user'; Nuevo = '@/entities/user' },
        @{ Viejo = '@/types/profile'; Nuevo = '@/entities/profile' },
        @{ Viejo = '@/types/club'; Nuevo = '@/entities/club' }
    )
    
    $actualizados = 0
    $errores = 0
    
    foreach ($archivo in $archivos) {
        try {
            $contenido = Get-Content $archivo.FullName -Raw -ErrorAction SilentlyContinue
            if ($null -eq $contenido) { continue }
            
            $modificado = $false
            $nuevoContenido = $contenido
            
            foreach ($reemplazo in $reemplazos) {
                if ($nuevoContenido -match [regex]::Escape($reemplazo.Viejo)) {
                    $nuevoContenido = $nuevoContenido -replace [regex]::Escape($reemplazo.Viejo), $reemplazo.Nuevo
                    $modificado = $true
                }
            }
            
            if ($modificado) {
                if ($WhatIfPreference) {
                    Write-SafeLog "  [DRY RUN] Actualizar: $($archivo.Name)" -Level Info
                } else {
                    Set-Content $archivo.FullName -Value $nuevoContenido -NoNewline -Encoding UTF8
                }
                $actualizados++
            }
        } catch {
            Write-SafeLog "  ✗ Error procesando $($archivo.Name): $_" -Level Error
            $errores++
        }
    }
    
    Write-SafeLog "Resumen: $actualizados actualizados, $errores errores" -Level $(if ($errores -eq 0) { 'Success' } else { 'Warning' })
}

function Start-Audit {
    Write-SafeLog "=== AUDITORIA COMPLETA DEL PROYECTO ===" -Level Info
    
    $report = @{
        Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        Duplicados = @()
        ImportsIncorrectos = @()
        DirectoriosVacios = @()
    }
    
    # Buscar duplicados
    Write-SafeLog "1. Buscando archivos duplicados..." -Level Warning
    $allFiles = Get-ChildItem "src" -Recurse -File -ErrorAction SilentlyContinue | Where-Object { 
        $_.Extension -match '\.(ts|tsx|css)$' -and $_.FullName -notmatch 'node_modules|dist|build' 
    }
    $filesByName = $allFiles | Group-Object Name
    $duplicados = $filesByName | Where-Object { $_.Count -gt 1 }
    
    if ($duplicados.Count -gt 0) {
        Write-SafeLog "  Duplicados encontrados: $($duplicados.Count)" -Level Warning
        foreach ($dup in $duplicados) {
            Write-SafeLog "    $($dup.Name) ($($dup.Count) copias)" -Level Warning
            $report.Duplicados += $dup.Name
        }
    } else {
        Write-SafeLog "  No se encontraron duplicados" -Level Success
    }
    
    # Buscar directorios vacíos
    Write-SafeLog "2. Buscando directorios vacios..." -Level Warning
    $allDirs = Get-ChildItem "src" -Recurse -Directory -ErrorAction SilentlyContinue | Where-Object { 
        $_.FullName -notmatch 'node_modules|dist|build|\.git' 
    }
    foreach ($dir in $allDirs) {
        $files = Get-ChildItem $dir.FullName -Recurse -File -ErrorAction SilentlyContinue | Where-Object { 
            $_.Extension -match '\.(ts|tsx|css)$' 
        }
        if ($files.Count -eq 0) {
            $relPath = $dir.FullName.Replace($PWD.Path + [System.IO.Path]::DirectorySeparatorChar, '')
            Write-SafeLog "  Vacio: $relPath" -Level Warning
            $report.DirectoriosVacios += $relPath
        }
    }
    
    # Verificar imports incorrectos
    Write-SafeLog "3. Verificando imports incorrectos..." -Level Warning
    $importPatterns = @(
        @{ Pattern = '@/pages/(Admin|Clubs|Discover|Auth)'; Correcto = '@/app/' },
        @{ Pattern = '@/hooks/useAuth'; Correcto = '@/features/auth/useAuth' },
        @{ Pattern = '@/components/ui/button'; Correcto = '@/shared/ui/Button' },
        @{ Pattern = '@/lib/utils'; Correcto = '@/shared/lib/cn' }
    )
    
    $tsFiles = $allFiles | Where-Object { $_.Extension -match '\.(ts|tsx)$' }
    foreach ($file in $tsFiles) {
        try {
            $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
            if ($content) {
                foreach ($pattern in $importPatterns) {
                    if ($content -match $pattern.Pattern) {
                        $relPath = $file.FullName.Replace($PWD.Path + [System.IO.Path]::DirectorySeparatorChar, '')
                        $report.ImportsIncorrectos += @{
                            Archivo = $relPath
                            ImportIncorrecto = $pattern.Pattern
                            ImportCorrecto = $pattern.Correcto
                        }
                    }
                }
            }
        } catch {
            Write-SafeLog "  ✗ Error leyendo $($file.Name): $_" -Level Error
        }
    }
    
    if ($report.ImportsIncorrectos.Count -gt 0) {
        Write-SafeLog "  Imports incorrectos encontrados: $($report.ImportsIncorrectos.Count)" -Level Warning
    } else {
        Write-SafeLog "  No se encontraron imports incorrectos" -Level Success
    }
    
    # Guardar reporte
    $reportPath = "docs/AUDITORIA_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
    try {
        New-Item -ItemType Directory -Force -Path "docs" -ErrorAction SilentlyContinue | Out-Null
        $report | ConvertTo-Json -Depth 10 | Out-File $reportPath -Encoding UTF8
        Write-SafeLog "Reporte guardado en: $reportPath" -Level Success
    } catch {
        Write-SafeLog "✗ Error guardando reporte: $_" -Level Error
    }
}

function Repair-CSS {
    Write-SafeLog "=== ANALIZANDO Y CORRIGIENDO CSS ===" -Level Info
    
    if (-not (Test-Path "src/styles/ui-fixes-consolidated.css")) {
        Write-SafeLog "Archivo CSS no encontrado, saltando..." -Level Warning
        return
    }
    
    try {
        $uiFixes = Get-Content "src/styles/ui-fixes-consolidated.css" -Raw
        
        # CORRECCIÓN CRÍTICA: Procesar matches de atrás hacia adelante para no invalidar índices
        $lineClampMatches = [regex]::Matches($uiFixes, '-webkit-line-clamp:\s*\d+', [System.Text.RegularExpressions.RegexOptions]::Multiline)
        
        if ($lineClampMatches.Count -gt 0) {
            Write-SafeLog "Verificando $($lineClampMatches.Count) ocurrencias de -webkit-line-clamp..." -Level Info
            
            # Crear array de matches para procesar en orden inverso
            $matchArray = @()
            foreach ($match in $lineClampMatches) {
                $matchArray += $match
            }
            
            $corregidos = 0
            # Procesar de atrás hacia adelante para no invalidar índices
            for ($i = $matchArray.Count - 1; $i -ge 0; $i--) {
                $match = $matchArray[$i]
                $startIndex = [Math]::Max(0, $match.Index - 50)
                $length = [Math]::Min(200, $uiFixes.Length - $startIndex)
                
                if ($length -gt 0) {
                    $contexto = $uiFixes.Substring($startIndex, $length)
                    if ($contexto -notmatch 'line-clamp:\s*\d+') {
                        $valor = $match.Value -replace '-webkit-line-clamp:\s*(\d+)', '$1'
                        $nuevo = $match.Value + "`n    line-clamp: $valor;"
                        $uiFixes = $uiFixes.Substring(0, $match.Index) + $nuevo + $uiFixes.Substring($match.Index + $match.Length)
                        $corregidos++
                    }
                }
            }
            
            if ($corregidos -gt 0) {
                $cssPath = "src/styles/ui-fixes-consolidated.css"
                if ($WhatIfPreference) {
                    Write-SafeLog "  [DRY RUN] Corregir $corregidos ocurrencias de line-clamp" -Level Info
                } else {
                    Set-Content -Path $cssPath -Value $uiFixes -NoNewline -Encoding UTF8
                    Write-SafeLog "  ✓ Corregidos: $corregidos" -Level Success
                }
            }
        }
        
        Write-SafeLog "CSS verificado y corregido" -Level Success
    } catch {
        Write-SafeLog "✗ Error procesando CSS: $_" -Level Error
    }
}

function New-MasterImports {
    Write-SafeLog "=== CREANDO ARCHIVO MAESTRO DE IMPORTS ===" -Level Info
    
    $masterContent = @'
// src/lib/index.ts - ARCHIVO MAESTRO DE IMPORTS
// USO: import { Button, Card, useAuth } from '@/lib'

// UI
export * from '@/shared/ui/Button';
export * from '@/shared/ui/Card';
export * from '@/shared/ui/Input';
export * from '@/shared/ui/Modal';

// Hooks compartidos
export * from '@/hooks/useGeolocation';
export * from '@/hooks/usePersistedState';
export * from '@/hooks/useIsomorphicLayoutEffect';
export * from '@/hooks/useToast';

// Utils
export * from '@/shared/lib/cn';
export * from '@/shared/lib/format';
export * from '@/shared/lib/validation';

// Entities
export * from '@/entities/user';
export * from '@/entities/profile';
export * from '@/entities/club';
'@
    
    try {
        New-Item -ItemType Directory -Force -Path "src/lib" -ErrorAction SilentlyContinue | Out-Null
        if ($WhatIfPreference) {
            Write-SafeLog "  [DRY RUN] Crear: src/lib/index.ts" -Level Info
        } else {
            Set-Content -Path "src/lib/index.ts" -Value $masterContent -NoNewline -Encoding UTF8
            Write-SafeLog "  ✓ Archivo maestro creado en src/lib/index.ts" -Level Success
        }
    } catch {
        Write-SafeLog "✗ Error creando archivo maestro: $_" -Level Error
    }
}

# Ejecución principal
if ($All) {
    Move-FilesToStructure
    Update-AllImports
    Start-Audit
    Repair-CSS
    New-MasterImports
    Write-SafeLog "=== PROCESO COMPLETO ===" -Level Success
} elseif ($Move) {
    Move-FilesToStructure
} elseif ($UpdateImports) {
    Update-AllImports
} elseif ($Audit) {
    Start-Audit
} elseif ($FixCSS) {
    Repair-CSS
} elseif ($CreateMaster) {
    New-MasterImports
} else {
    # Modo interactivo
    do {
        Show-Menu
        $opcion = Read-Host "Selecciona una opción"
        
        switch ($opcion) {
            "1" { Move-FilesToStructure; Read-Host "Presiona Enter para continuar" }
            "2" { Update-AllImports; Read-Host "Presiona Enter para continuar" }
            "3" { Start-Audit; Read-Host "Presiona Enter para continuar" }
            "4" { Repair-CSS; Read-Host "Presiona Enter para continuar" }
            "5" { New-MasterImports; Read-Host "Presiona Enter para continuar" }
            "6" { 
                Move-FilesToStructure
                Update-AllImports
                Start-Audit
                Repair-CSS
                New-MasterImports
                Write-SafeLog "=== PROCESO COMPLETO ===" -Level Success
                Read-Host "Presiona Enter para continuar"
            }
            "0" { exit 0 }
            default { Write-SafeLog "Opcion invalida" -Level Error }
        }
    } while ($true)
}
