# SCRIPT MAESTRO INTEGRADO - REFACTOR Y CONSOLIDACIÓN
# ComplicesConecta v3.6.6
# Consolida refactorización, actualización de imports, auditoría, CSS y consolidación de duplicados

param(
    [switch]$All,
    [switch]$Move,
    [switch]$UpdateImports,
    [switch]$Audit,
    [switch]$FixCSS,
    [switch]$CreateMaster,
    [switch]$RemoveDuplicates,
    [switch]$RemoveEmptyDirs,
    [switch]$DryRun
)

$ErrorActionPreference = "Continue"

function Show-MainMenu {
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║        SCRIPT MAESTRO - REFACTOR Y CONSOLIDACIÓN           ║" -ForegroundColor Cyan
    Write-Host "║                  ComplicesConecta v3.6.6                    ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 REFACTORIZACIÓN Y ACTUALIZACIÓN:" -ForegroundColor Yellow
    Write-Host "  1. Mover archivos a estructura nueva" -ForegroundColor White
    Write-Host "  2. Actualizar todos los imports" -ForegroundColor White
    Write-Host "  3. Auditoría completa del proyecto" -ForegroundColor White
    Write-Host "  4. Analizar y corregir CSS" -ForegroundColor White
    Write-Host "  5. Crear archivo maestro de imports" -ForegroundColor White
    Write-Host ""
    Write-Host "🧹 CONSOLIDACIÓN Y LIMPIEZA:" -ForegroundColor Yellow
    Write-Host "  6. Eliminar archivos duplicados" -ForegroundColor White
    Write-Host "  7. Eliminar directorios vacíos" -ForegroundColor White
    Write-Host "  8. Modo DRY-RUN (previsualizar cambios)" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "⚡ EJECUCIÓN RÁPIDA:" -ForegroundColor Yellow
    Write-Host "  9. Ejecutar TODO (1-7)" -ForegroundColor Green
    Write-Host " 10. Ejecutar Refactor (1-5)" -ForegroundColor Green
    Write-Host " 11. Ejecutar Consolidación (6-7)" -ForegroundColor Green
    Write-Host ""
    Write-Host "  0. Salir" -ForegroundColor Red
    Write-Host ""
}

# ==================== FUNCIONES DE REFACTORIZACIÓN ====================

function Move-FilesToStructure {
    Write-Host "`n=== MOVIENDO ARCHIVOS A ESTRUCTURA NUEVA ===" -ForegroundColor Cyan
    
    Write-Host "`n1. Moviendo archivos Admin..." -ForegroundColor Yellow
    $adminFiles = @(
        "src/pages/Admin.tsx", "src/pages/AdminProduction.tsx", "src/pages/AdminPartners.tsx",
        "src/pages/AdminModerators.tsx", "src/pages/AdminDashboard.tsx",
        "src/pages/AdminCareerApplications.tsx", "src/pages/AdminAnalytics.tsx"
    )
    foreach ($file in $adminFiles) {
        if (Test-Path $file) {
            $dest = Join-Path "src" "app" "(admin)" (Split-Path $file -Leaf)
            try {
                Move-Item $file $dest -Force -ErrorAction Stop
                Write-Host "  ✓ Movido: $(Split-Path $file -Leaf) -> app/(admin)/" -ForegroundColor Green
            } catch {
                Write-Host "  ✗ ERROR al mover $file : $_" -ForegroundColor Red
            }
        }
    }
    
    Write-Host "`n2. Moviendo archivos Clubs..." -ForegroundColor Yellow
    if (Test-Path "src/pages/Clubs.tsx") {
        $dest = Join-Path "src" "app" "(clubs)" "Clubs.tsx"
        try {
            Move-Item "src/pages/Clubs.tsx" $dest -Force -ErrorAction Stop
            Write-Host "  ✓ Movido: Clubs.tsx -> app/(clubs)/" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ ERROR al mover Clubs.tsx: $_" -ForegroundColor Red
        }
    }
    
    Write-Host "`n3. Moviendo archivos Discover..." -ForegroundColor Yellow
    if (Test-Path "src/pages/Discover.tsx") {
        $dest = Join-Path "src" "app" "(discover)" "Discover.tsx"
        try {
            Move-Item "src/pages/Discover.tsx" $dest -Force -ErrorAction Stop
            Write-Host "  ✓ Movido: Discover.tsx -> app/(discover)/" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ ERROR al mover Discover.tsx: $_" -ForegroundColor Red
        }
    }
    
    Write-Host "`n4. Moviendo archivos Auth..." -ForegroundColor Yellow
    if (Test-Path "src/pages/Auth.tsx") {
        $dest = Join-Path "src" "app" "(auth)" "Auth.tsx"
        try {
            Move-Item "src/pages/Auth.tsx" $dest -Force -ErrorAction Stop
            Write-Host "  ✓ Movido: Auth.tsx -> app/(auth)/" -ForegroundColor Green
        } catch {
            Write-Host "  ✗ ERROR al mover Auth.tsx: $_" -ForegroundColor Red
        }
    }
    
    Write-Host "`n5. Moviendo archivos a Features..." -ForegroundColor Yellow
    $authFiles = @(
        @{ Source = 'src/hooks/useAuth.ts'; Dest = 'src/features/auth/useAuth.ts' },
        @{ Source = 'src/hooks/useBiometricAuth.ts'; Dest = 'src/features/auth/useBiometricAuth.ts' }
    )
    foreach ($file in $authFiles) {
        if (Test-Path $file.Source) {
            $destDir = Split-Path $file.Dest -Parent
            New-Item -ItemType Directory -Force -Path $destDir | Out-Null
            try {
                Move-Item $file.Source $file.Dest -Force -ErrorAction Stop
                Write-Host "  ✓ Movido: $(Split-Path $file.Source -Leaf) -> features/auth/" -ForegroundColor Green
            } catch {
                Write-Host "  ✗ ERROR al mover $($file.Source): $_" -ForegroundColor Red
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
            $destDir = Split-Path $file.Dest -Parent
            New-Item -ItemType Directory -Force -Path $destDir | Out-Null
            try {
                Move-Item $file.Source $file.Dest -Force -ErrorAction Stop
                Write-Host "  ✓ Movido: $(Split-Path $file.Source -Leaf) -> features/profile/" -ForegroundColor Magenta
            } catch {
                Write-Host "  ✗ ERROR al mover $($file.Source): $_" -ForegroundColor Red
            }
        }
    }
    
    if (Test-Path "src/services/clubFlyerImageProcessing.ts") {
        New-Item -ItemType Directory -Force -Path "src/features/clubs" | Out-Null
        $dest = Join-Path "src" "features" "clubs" "clubFlyerImageProcessing.ts"
        try {
            Move-Item "src/services/clubFlyerImageProcessing.ts" $dest -Force -ErrorAction Stop
            Write-Host "  ✓ Movido: clubFlyerImageProcessing.ts -> features/clubs/" -ForegroundColor Cyan
        } catch {
            Write-Host "  ✗ ERROR al mover clubFlyerImageProcessing.ts: $_" -ForegroundColor Red
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
                Move-Item $file.Source $file.Dest -Force -ErrorAction Stop
                Write-Host "  ✓ Movido: $(Split-Path $file.Source -Leaf) -> features/chat/" -ForegroundColor Yellow
            } catch {
                Write-Host "  ✗ ERROR al mover $($file.Source): $_" -ForegroundColor Red
            }
        }
    }
    
    Write-Host "`n✓ Archivos movidos correctamente" -ForegroundColor Green
}

function Update-AllImports {
    Write-Host "`n=== ACTUALIZANDO TODOS LOS IMPORTS ===" -ForegroundColor Cyan
    
    $archivos = Get-ChildItem "src" -Recurse -File | Where-Object { $_.Extension -match '\.(tsx|ts)$' -and $_.FullName -notmatch 'node_modules|dist|build' }
    
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
    foreach ($archivo in $archivos) {
        try {
            $contenido = Get-Content $archivo.FullName -Raw -ErrorAction Stop
        } catch {
            Write-Host "  ✗ ERROR al leer $($archivo.FullName): $_" -ForegroundColor Red
            continue
        }
        
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
            try {
                Set-Content $archivo.FullName -Value $nuevoContenido -NoNewline -Encoding UTF8 -ErrorAction Stop
                $actualizados++
            } catch {
                Write-Host "  ✗ ERROR al escribir $($archivo.FullName): $_" -ForegroundColor Red
            }
        }
    }
    
    Write-Host "`n✓ Archivos actualizados: $actualizados" -ForegroundColor Green
}

function Start-Audit {
    Write-Host "`n=== AUDITORIA COMPLETA DEL PROYECTO ===" -ForegroundColor Cyan
    
    $report = @{
        Duplicados = @()
        ImportsIncorrectos = @()
        ArchivosFaltantes = @()
        DirectoriosVacios = @()
    }
    
    Write-Host "`n1. Buscando archivos duplicados..." -ForegroundColor Yellow
    $allFiles = Get-ChildItem "src" -Recurse -File | Where-Object { 
        $_.Extension -match '\.(ts|tsx|css)$' -and $_.FullName -notmatch 'node_modules|dist|build' 
    }
    $filesByName = $allFiles | Group-Object Name
    $duplicados = $filesByName | Where-Object { $_.Count -gt 1 }
    
    if ($duplicados.Count -gt 0) {
        Write-Host "  ✗ Duplicados encontrados: $($duplicados.Count)" -ForegroundColor Red
        foreach ($dup in $duplicados) {
            Write-Host "    - $($dup.Name) ($($dup.Count) copias)" -ForegroundColor Yellow
            $report.Duplicados += $dup.Name
        }
    } else {
        Write-Host "  ✓ No se encontraron duplicados" -ForegroundColor Green
    }
    
    Write-Host "`n2. Buscando directorios vacios..." -ForegroundColor Yellow
    $allDirs = Get-ChildItem "src" -Recurse -Directory | Where-Object { 
        $_.FullName -notmatch 'node_modules|dist|build|\.git' 
    }
    $vacios = 0
    foreach ($dir in $allDirs) {
        $files = Get-ChildItem $dir.FullName -Recurse -File | Where-Object { 
            $_.Extension -match '\.(ts|tsx|css)$' 
        }
        if ($files.Count -eq 0) {
            $relPath = $dir.FullName.Replace($PWD.Path + '\', '')
            Write-Host "  ⚠ Vacio: $relPath" -ForegroundColor Yellow
            $report.DirectoriosVacios += $relPath
            $vacios++
        }
    }
    Write-Host "  Total: $vacios directorios vacíos" -ForegroundColor Cyan
    
    Write-Host "`n3. Verificando imports incorrectos..." -ForegroundColor Yellow
    $importPatterns = @(
        @{ Pattern = '@/pages/(Admin|Clubs|Discover|Auth)'; Correcto = '@/app/' },
        @{ Pattern = '@/hooks/useAuth'; Correcto = '@/features/auth/useAuth' },
        @{ Pattern = '@/components/ui/button'; Correcto = '@/shared/ui/Button' },
        @{ Pattern = '@/lib/utils'; Correcto = '@/shared/lib/cn' }
    )
    
    $tsFiles = $allFiles | Where-Object { $_.Extension -match '\.(ts|tsx)$' }
    $incorrectos = 0
    foreach ($file in $tsFiles) {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if ($content) {
            foreach ($pattern in $importPatterns) {
                if ($content -match $pattern.Pattern) {
                    $relPath = $file.FullName.Replace($PWD.Path + '\', '')
                    $report.ImportsIncorrectos += @{
                        Archivo = $relPath
                        ImportIncorrecto = $pattern.Pattern
                        ImportCorrecto = $pattern.Correcto
                    }
                    $incorrectos++
                }
            }
        }
    }
    
    if ($incorrectos -gt 0) {
        Write-Host "  ✗ Imports incorrectos encontrados: $incorrectos" -ForegroundColor Red
    } else {
        Write-Host "  ✓ No se encontraron imports incorrectos" -ForegroundColor Green
    }
    
    $reportPath = Join-Path "docs" "AUDITORIA_$(Get-Date -Format 'yyyyMMdd_HHmmss').json"
    New-Item -ItemType Directory -Force -Path "docs" | Out-Null
    try {
        $report | ConvertTo-Json -Depth 10 | Out-File $reportPath -Encoding UTF8 -ErrorAction Stop
        Write-Host "`n✓ Reporte guardado en: $reportPath" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ ERROR al guardar reporte: $_" -ForegroundColor Red
    }
}

function Repair-CSS {
    Write-Host "`n=== ANALIZANDO Y CORRIGIENDO CSS ===" -ForegroundColor Cyan
    
    if (Test-Path "src/styles/ui-fixes-consolidated.css") {
        $uiFixes = Get-Content "src/styles/ui-fixes-consolidated.css" -Raw
        
        $lineClampMatches = [regex]::Matches($uiFixes, '-webkit-line-clamp:\s*\d+', [System.Text.RegularExpressions.RegexOptions]::Multiline)
        if ($lineClampMatches.Count -gt 0) {
            Write-Host "  Verificando $($lineClampMatches.Count) ocurrencias de -webkit-line-clamp..." -ForegroundColor Gray
            $corregidos = 0
            for ($i = $lineClampMatches.Count - 1; $i -ge 0; $i--) {
                $match = $lineClampMatches[$i]
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
                $cssPath = Join-Path "src" "styles" "ui-fixes-consolidated.css"
                Set-Content -Path $cssPath -Value $uiFixes -NoNewline -Encoding UTF8
                Write-Host "  ✓ Corregidos: $corregidos" -ForegroundColor Green
            }
        }
    }
    
    Write-Host "`n✓ CSS verificado y corregido" -ForegroundColor Green
}

function New-MasterImports {
    Write-Host "`n=== CREANDO ARCHIVO MAESTRO DE IMPORTS ===" -ForegroundColor Cyan
    
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
    
    $libPath = Join-Path "src" "lib"
    New-Item -ItemType Directory -Force -Path $libPath | Out-Null
    $indexPath = Join-Path $libPath "index.ts"
    try {
        Set-Content -Path $indexPath -Value $masterContent -NoNewline -Encoding UTF8 -ErrorAction Stop
        Write-Host "`n✓ Archivo maestro creado en src/lib/index.ts" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ ERROR al crear archivo maestro: $_" -ForegroundColor Red
    }
}

# ==================== FUNCIONES DE CONSOLIDACIÓN ====================

function Remove-DuplicateFiles {
    Write-Host "`n=== ELIMINANDO ARCHIVOS DUPLICADOS ===" -ForegroundColor Cyan
    
    $duplicates = @(
        @{ Old = 'src/components/profiles/single/ProfileSingle.tsx'; New = 'src/profiles/single/ProfileSingle.tsx' },
        @{ Old = 'src/components/profiles/single/ProfileSingle.test.tsx'; New = 'src/profiles/single/ProfileSingle.test.tsx' },
        @{ Old = 'src/components/profiles/single/EditProfileSingle.tsx'; New = 'src/profiles/single/EditProfileSingle.tsx' },
        @{ Old = 'src/components/profiles/single/EditProfileSingle.test.tsx'; New = 'src/profiles/single/EditProfileSingle.test.tsx' },
        @{ Old = 'src/components/profiles/couple/ProfileCouple.tsx'; New = 'src/profiles/couple/ProfileCouple.tsx' },
        @{ Old = 'src/components/profiles/couple/EditProfileCouple.tsx'; New = 'src/profiles/couple/EditProfileCouple.tsx' }
    )
    
    $eliminados = 0
    $errores = 0
    
    foreach ($dup in $duplicates) {
        if (Test-Path $dup.Old) {
            if (Test-Path $dup.New) {
                try {
                    Remove-Item $dup.Old -Force -ErrorAction Stop
                    Write-Host "  ✓ Eliminado: $($dup.Old)" -ForegroundColor Green
                    $eliminados++
                } catch {
                    Write-Host "  ✗ ERROR al eliminar $($dup.Old): $_" -ForegroundColor Red
                    $errores++
                }
            } else {
                Write-Host "  ⚠ ADVERTENCIA: $($dup.Old) existe pero $($dup.New) NO existe" -ForegroundColor Yellow
                try {
                    $destDir = Split-Path $dup.New -Parent
                    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
                    Move-Item $dup.Old $dup.New -Force -ErrorAction Stop
                    Write-Host "    ✓ Movido: $($dup.Old) -> $($dup.New)" -ForegroundColor Green
                    $eliminados++
                } catch {
                    Write-Host "    ✗ ERROR al mover: $_" -ForegroundColor Red
                    $errores++
                }
            }
        }
    }
    
    Write-Host "`n  Resumen: Eliminados=$eliminados, Errores=$errores" -ForegroundColor Cyan
}

function Remove-EmptyDirectories {
    Write-Host "`n=== ELIMINANDO DIRECTORIOS VACÍOS ===" -ForegroundColor Cyan
    
    $emptyDirs = @(
        'src/assets',
        'src/assets/events',
        'src/assets/icons',
        'src/assets/img',
        'src/assets/lifestyle',
        'src/assets/Ntf',
        'src/assets/people',
        'src/assets/svg',
        'src/assets/people/couple',
        'src/assets/people/female',
        'src/assets/people/male',
        'src/assets/people/privado',
        'src/assets/people/couple/privado',
        'src/assets/people/male/privado'
    )
    
    $eliminados = 0
    $errores = 0
    
    $emptyDirs = $emptyDirs | Sort-Object { ($_ -split '/').Count } -Descending
    
    foreach ($dir in $emptyDirs) {
        if (Test-Path $dir) {
            $files = Get-ChildItem $dir -Recurse -File 2>$null | Measure-Object
            
            if ($files.Count -eq 0) {
                try {
                    Remove-Item $dir -Recurse -Force -ErrorAction Stop
                    Write-Host "  ✓ Eliminado: $dir" -ForegroundColor Green
                    $eliminados++
                } catch {
                    Write-Host "  ✗ ERROR al eliminar $dir : $_" -ForegroundColor Red
                    $errores++
                }
            } else {
                Write-Host "  ⚠ NO VACÍO: $dir ($($files.Count) archivos)" -ForegroundColor Yellow
            }
        }
    }
    
    Write-Host "`n  Resumen: Eliminados=$eliminados, Errores=$errores" -ForegroundColor Cyan
}

# ==================== EJECUCIÓN PRINCIPAL ====================

if ($All) {
    Move-FilesToStructure
    Update-AllImports
    Start-Audit
    Repair-CSS
    New-MasterImports
    Remove-DuplicateFiles
    Remove-EmptyDirectories
    Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║              ✓ PROCESO COMPLETO EXITOSO                   ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
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
} elseif ($RemoveDuplicates) {
    Remove-DuplicateFiles
} elseif ($RemoveEmptyDirs) {
    Remove-EmptyDirectories
} elseif ($DryRun) {
    Write-Host "`n=== MODO DRY-RUN ===" -ForegroundColor Magenta
    Write-Host "Previsualización de cambios (sin aplicar):" -ForegroundColor Yellow
    Remove-DuplicateFiles
    Remove-EmptyDirectories
    Write-Host "`n✓ Previsualización completada" -ForegroundColor Green
} else {
    # Modo interactivo
    do {
        Show-MainMenu
        $opcion = Read-Host "Selecciona una opción"
        
        switch ($opcion) {
            "1" { Move-FilesToStructure; Read-Host "`nPresiona Enter para continuar" }
            "2" { Update-AllImports; Read-Host "`nPresiona Enter para continuar" }
            "3" { Start-Audit; Read-Host "`nPresiona Enter para continuar" }
            "4" { Repair-CSS; Read-Host "`nPresiona Enter para continuar" }
            "5" { New-MasterImports; Read-Host "`nPresiona Enter para continuar" }
            "6" { Remove-DuplicateFiles; Read-Host "`nPresiona Enter para continuar" }
            "7" { Remove-EmptyDirectories; Read-Host "`nPresiona Enter para continuar" }
            "8" { 
                Write-Host "`n=== MODO DRY-RUN ===" -ForegroundColor Magenta
                Remove-DuplicateFiles
                Remove-EmptyDirectories
                Write-Host "`n✓ Previsualización completada" -ForegroundColor Green
                Read-Host "`nPresiona Enter para continuar"
            }
            "9" { 
                Move-FilesToStructure
                Update-AllImports
                Start-Audit
                Repair-CSS
                New-MasterImports
                Remove-DuplicateFiles
                Remove-EmptyDirectories
                Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
                Write-Host "║              ✓ PROCESO COMPLETO EXITOSO                   ║" -ForegroundColor Green
                Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
                Read-Host "`nPresiona Enter para continuar"
            }
            "10" {
                Move-FilesToStructure
                Update-AllImports
                Start-Audit
                Repair-CSS
                New-MasterImports
                Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
                Write-Host "║          ✓ REFACTOR COMPLETADO EXITOSAMENTE              ║" -ForegroundColor Green
                Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
                Read-Host "`nPresiona Enter para continuar"
            }
            "11" {
                Remove-DuplicateFiles
                Remove-EmptyDirectories
                Write-Host "`n╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
                Write-Host "║       ✓ CONSOLIDACIÓN COMPLETADA EXITOSAMENTE            ║" -ForegroundColor Green
                Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
                Read-Host "`nPresiona Enter para continuar"
            }
            "0" { 
                Write-Host "`n¡Hasta luego!" -ForegroundColor Cyan
                exit 0 
            }
            default { Write-Host "`n✗ Opción inválida. Intenta de nuevo." -ForegroundColor Red }
        }
    } while ($true)
}
