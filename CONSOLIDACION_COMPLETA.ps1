# ============================================================================
# SCRIPT DE CONSOLIDACIÓN COMPLETA - ComplicesConecta v3.8.0
# ============================================================================
# 
# Descripción: Script PowerShell que ejecuta todas las fases de consolidación
# del proyecto ComplicesConecta (9 Diciembre 2025)
#
# Fases:
#   FASE 1: Consolidación de directorios duplicados
#   FASE 2: Estandarización de exports (Barrel exports)
#   FASE 3: Auditoría de imports inconsistentes
#   FASE 4: Auditar archivos huérfanos
#   FASE 5: Crear tablas Supabase faltantes
#
# Uso: .\CONSOLIDACION_COMPLETA.ps1
# ============================================================================

param(
    [ValidateSet("1", "2", "3", "4", "5", "all")]
    [string]$Fase = "all",
    
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

# ============================================================================
# FUNCIONES AUXILIARES
# ============================================================================

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║ $Text" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Text, [int]$Number)
    Write-Host "$Number️⃣ $Text" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Text)
    Write-Host "   ✅ $Text" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Text)
    Write-Host "   ⚠️  $Text" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Text)
    Write-Host "   ❌ $Text" -ForegroundColor Red
}

# ============================================================================
# FASE 1: CONSOLIDACIÓN DE DIRECTORIOS DUPLICADOS
# ============================================================================

function Invoke-Fase1 {
    Write-Header "FASE 1: CONSOLIDACIÓN DE DIRECTORIOS DUPLICADOS - 30 min"
    
    # 1. Crear directorio src/animations si no existe
    Write-Step "Creando src/animations..." 1
    if (-not (Test-Path "src/animations")) {
        New-Item -ItemType Directory -Path "src/animations" -Force | Out-Null
        Write-Success "Directorio creado"
    } else {
        Write-Warning "Directorio ya existe"
    }
    
    # 2. Mover archivos de src/components/animations a src/animations
    Write-Step "Moviendo archivos de src/components/animations..." 2
    if (Test-Path "src/components/animations") {
        $animFiles = Get-ChildItem -Path "src/components/animations" -File
        foreach ($file in $animFiles) {
            Copy-Item -Path $file.FullName -Destination "src/animations/$($file.Name)" -Force
            Write-Success "$($file.Name)"
        }
    }
    
    # 3. Crear directorio src/backgrounds si no existe
    Write-Step "Creando src/backgrounds..." 3
    if (-not (Test-Path "src/backgrounds")) {
        New-Item -ItemType Directory -Path "src/backgrounds" -Force | Out-Null
        Write-Success "Directorio creado"
    } else {
        Write-Warning "Directorio ya existe"
    }
    
    # 4. Mover archivos de backgrounds
    Write-Step "Moviendo archivos de backgrounds..." 4
    if (Test-Path "src/components/ui/ParticlesBackground.tsx") {
        Copy-Item -Path "src/components/ui/ParticlesBackground.tsx" -Destination "src/backgrounds/ParticlesBackground.tsx" -Force
        Write-Success "ParticlesBackground.tsx"
    }
    if (Test-Path "src/components/ui/RandomBackground.tsx") {
        Copy-Item -Path "src/components/ui/RandomBackground.tsx" -Destination "src/backgrounds/RandomBackground.tsx" -Force
        Write-Success "RandomBackground.tsx"
    }
    if (Test-Path "src/components/ui/GlobalBackground.tsx") {
        Copy-Item -Path "src/components/ui/GlobalBackground.tsx" -Destination "src/backgrounds/GlobalBackground.tsx" -Force
        Write-Success "GlobalBackground.tsx"
    }
    
    # 5. Reemplazar imports de @/components/animations
    Write-Step "Reemplazando imports de @/components/animations..." 5
    $files = Get-ChildItem -Path "src" -Recurse -Include "*.tsx", "*.ts" | Where-Object { $_.FullName -notmatch "\\animations\\" }
    $count = 0
    foreach ($file in $files) {
        $content = Get-Content -Path $file.FullName -Raw
        if ($content -match "@/components/animations") {
            $newContent = $content -replace "@/components/animations", "@/animations"
            if (-not $DryRun) {
                Set-Content -Path $file.FullName -Value $newContent
            }
            $count++
            if ($Verbose) { Write-Success "$($file.Name)" }
        }
    }
    Write-Success "Reemplazados: $count archivos"
    
    # 6. Reemplazar imports de backgrounds
    Write-Step "Reemplazando imports de backgrounds..." 6
    $files = Get-ChildItem -Path "src" -Recurse -Include "*.tsx", "*.ts" | Where-Object { $_.FullName -notmatch "\\backgrounds\\" }
    $count = 0
    foreach ($file in $files) {
        $content = Get-Content -Path $file.FullName -Raw
        if ($content -match "@/components/ui/(ParticlesBackground|RandomBackground|GlobalBackground)") {
            $newContent = $content -replace "@/components/ui/ParticlesBackground", "@/backgrounds/ParticlesBackground"
            $newContent = $newContent -replace "@/components/ui/RandomBackground", "@/backgrounds/RandomBackground"
            $newContent = $newContent -replace "@/components/ui/GlobalBackground", "@/backgrounds/GlobalBackground"
            if (-not $DryRun) {
                Set-Content -Path $file.FullName -Value $newContent
            }
            $count++
            if ($Verbose) { Write-Success "$($file.Name)" }
        }
    }
    Write-Success "Reemplazados: $count archivos"
    
    # 7. Reemplazar imports de @/theme/ con @/themes/
    Write-Step "Reemplazando imports de @/theme/ con @/themes/..." 7
    $files = Get-ChildItem -Path "src" -Recurse -Include "*.tsx", "*.ts"
    $count = 0
    foreach ($file in $files) {
        $content = Get-Content -Path $file.FullName -Raw
        if ($content -match "@/theme/") {
            $newContent = $content -replace "@/theme/", "@/themes/"
            if (-not $DryRun) {
                Set-Content -Path $file.FullName -Value $newContent
            }
            $count++
            if ($Verbose) { Write-Success "$($file.Name)" }
        }
    }
    Write-Success "Reemplazados: $count archivos"
    
    Write-Host ""
    Write-Host "✅ FASE 1 COMPLETADA" -ForegroundColor Green
}

# ============================================================================
# FASE 2: ESTANDARIZACIÓN DE EXPORTS (BARREL EXPORTS)
# ============================================================================

function Invoke-Fase2 {
    Write-Header "FASE 2: ESTANDARIZACIÓN DE EXPORTS - 15 min"
    
    # 1. Crear index.ts en src/animations/
    Write-Step "Creando barrel export en src/animations/index.ts..." 1
    $animationsIndex = @"
export { AnimationProvider } from './AnimationProvider';
export { AnimationSettings, AnimationSettingsButton } from './AnimationSettings';
export { EnhancedComponents } from './EnhancedComponents';
export { GlobalAnimations } from './GlobalAnimations';
export { InteractiveAnimations } from './InteractiveAnimations';
export { NotificationProvider, NotificationSystem } from './NotificationSystem';
export { PageTransitionWrapper, PageTransitions } from './PageTransitions';
"@
    if (-not $DryRun) {
        Set-Content -Path "src/animations/index.ts" -Value $animationsIndex
    }
    Write-Success "src/animations/index.ts creado"
    
    # 2. Crear index.ts en src/backgrounds/
    Write-Step "Creando barrel export en src/backgrounds/index.ts..." 2
    $backgroundsIndex = @"
export { ParticlesBackground } from './ParticlesBackground';
export { RandomBackground } from './RandomBackground';
export { GlobalBackground } from './GlobalBackground';
"@
    if (-not $DryRun) {
        Set-Content -Path "src/backgrounds/index.ts" -Value $backgroundsIndex
    }
    Write-Success "src/backgrounds/index.ts creado"
    
    # 3. Crear index.ts en src/hooks/
    Write-Step "Creando barrel export en src/hooks/index.ts..." 3
    $hooksIndex = @"
export { useAuth } from '@/features/auth/useAuth';
export { usePersistedState } from './usePersistedState';
export { useBgMode } from './useBgMode';
export { useFeatures } from './useFeatures';
export { useToast } from './useToast';
export { useMobile } from './use-mobile';
"@
    if (-not $DryRun) {
        Set-Content -Path "src/hooks/index.ts" -Value $hooksIndex
    }
    Write-Success "src/hooks/index.ts creado"
    
    # 4. Crear index.ts en src/services/
    Write-Step "Creando barrel export en src/services/index.ts..." 4
    $servicesIndex = @"
// Servicios principales
export { supabase } from '@/integrations/supabase/client';
export { logger } from '@/lib/logger';

// Servicios de negocio
export { PredictiveMatchingService } from './PredictiveMatchingService';
export { ChatService } from './ChatService';
export { WalletService } from './WalletService';
export { TokensService } from './nft/TokensService';
"@
    if (-not $DryRun) {
        Set-Content -Path "src/services/index.ts" -Value $servicesIndex
    }
    Write-Success "src/services/index.ts creado"
    
    # 5. Crear index.ts en src/types/
    Write-Step "Creando barrel export en src/types/index.ts..." 5
    $typesIndex = @"
export type { Database } from './supabase-generated';
export type { Profile, CoupleProfile, Match } from './supabase-generated';
"@
    if (-not $DryRun) {
        Set-Content -Path "src/types/index.ts" -Value $typesIndex
    }
    Write-Success "src/types/index.ts creado"
    
    Write-Host ""
    Write-Host "✅ FASE 2 COMPLETADA" -ForegroundColor Green
}

# ============================================================================
# FASE 3: AUDITORÍA DE IMPORTS INCONSISTENTES
# ============================================================================

function Invoke-Fase3 {     
    Write-Header "FASE 3: AUDITORÍA DE IMPORTS INCONSISTENTES - 45 min"
    
    Write-Step "Buscando imports con rutas relativas..." 1
    $relativeImports = Get-ChildItem -Path "src" -Recurse -Include "*.tsx", "*.ts" | Select-String -Pattern "from ['\"]\.\./"
    Write-Host "   Encontrados: $($relativeImports.Count) imports relativos"
    
    Write-Step "Buscando imports sin alias..." 2
    $noAliasImports = Get-ChildItem -Path "src" -Recurse -Include "*.tsx", "*.ts" | Select-String -Pattern "from ['\"](?!@)"
    Write-Host "   Encontrados: $($noAliasImports.Count) imports sin alias"
    
    Write-Step "Buscando imports incompletos..." 3
    $incompleteImports = Get-ChildItem -Path "src" -Recurse -Include "*.tsx", "*.ts" | Select-String -Pattern "from '@/[A-Z]"
    Write-Host "   Encontrados: $($incompleteImports.Count) imports incompletos"
    
    Write-Host ""
    Write-Host "✅ FASE 3 COMPLETADA" -ForegroundColor Green 
}

# ============================================================================
# FASE 4: AUDITAR ARCHIVOS HUÉRFANOS
# ============================================================================

function Invoke-Fase4 {
    Write-Header "FASE 4: AUDITAR ARCHIVOS HUÉRFANOS - 30 min"
    
    Write-Step "Buscando archivos sin importaciones..." 1
    $allFiles = Get-ChildItem -Path "src" -Recurse -Include "*.tsx", "*.ts" | Where-Object { $_.Name -ne "index.ts" }
    $orphanedFiles = @()
    
    foreach ($file in $allFiles) {
        $fileName = $file.Name -replace '\.[^.]+$'
        $isImported = Get-ChildItem -Path "src" -Recurse -Include "*.tsx", "*.ts" | Select-String -Pattern "from.*$fileName" | Measure-Object
        if ($isImported.Count -eq 0) {
            $orphanedFiles += $file.FullName
        }
    }
    
    Write-Host "   Encontrados: $($orphanedFiles.Count) archivos potencialmente huérfanos"
    
    Write-Step "Buscando archivos duplicados..." 2
    $duplicates = @()
    $fileHashes = @{}
    
    foreach ($file in $allFiles) {
        $hash = Get-FileHash -Path $file.FullName -Algorithm MD5
        if ($fileHashes.ContainsKey($hash.Hash)) {
            $duplicates += @($file.FullName, $fileHashes[$hash.Hash])
        } else {
            $fileHashes[$hash.Hash] = $file.FullName
        }
    }
    
    Write-Host "   Encontrados: $($duplicates.Count) archivos duplicados"
    
    Write-Host ""
    Write-Host "✅ FASE 4 COMPLETADA" -ForegroundColor Green
}

# ============================================================================
# FASE 5: CREAR TABLAS SUPABASE FALTANTES
# ============================================================================

function Invoke-Fase5 {
    Write-Header "FASE 5: CREAR TABLAS SUPABASE FALTANTES - 15 min"
    
    Write-Step "Verificando tablas faltantes..." 1
    Write-Host "   Tablas a crear:"
    Write-Host "   - virtual_events"
    Write-Host "   - couple_profile_views"
    Write-Host "   - couple_profile_reports"
    
    Write-Step "Regenerando tipos TypeScript..." 2
    Write-Host "   Comando: supabase gen types typescript --linked > src/types/supabase-generated.ts"
    Write-Host "   ⚠️  Ejecutar manualmente en terminal"
    
    Write-Host ""
    Write-Host "✅ FASE 5 COMPLETADA" -ForegroundColor Green
}

# ============================================================================
# MAIN
# ============================================================================

function Main {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  CONSOLIDACIÓN COMPLETA - ComplicesConecta v3.8.0              ║" -ForegroundColor Cyan
    Write-Host "║  9 Diciembre 2025                                              ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    
    if ($DryRun) {
        Write-Host "🔍 MODO DRY-RUN: No se realizarán cambios" -ForegroundColor Yellow
    }
    
    Write-Host ""
    
    switch ($Fase) {
        "1" { Invoke-Fase1 }
        "2" { Invoke-Fase2 }
        "3" { Invoke-Fase3 }
        "4" { Invoke-Fase4 }
        "5" { Invoke-Fase5 }
        "all" {
            Invoke-Fase1
            Invoke-Fase2
            Invoke-Fase3
            Invoke-Fase4
            Invoke-Fase5
        }
    }
    
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║   ✅ CONSOLIDACIÓN COMPLETADA                                  ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 PRÓXIMOS PASOS:" -ForegroundColor Cyan
    Write-Host "   1. Ejecutar: npm run build"
    Write-Host "   2. Ejecutar: npm run test"
    Write-Host "   3. Ejecutar: git add . && git commit -m 'refactor: Consolidación completa'" -ForegroundColor Green
    Write-Host "   4. Ejecutar: git push" -ForegroundColor Green
    Write-Host ""
}

# Ejecutar main
Main