# 🏗️ Guía de Refactor Estructural - ComplicesConecta v3.8.0

## Objetivo
Unificar la estructura de directorios de Vite eliminando patrones Next.js (`src/app/`) y consolidando componentes duplicados.

## Estado Actual
```
src/
├── app/                    ❌ Patrón Next.js (debe eliminarse)
│   ├── (admin)/           → Migrar a src/pages/admin/
│   ├── (auth)/            → Ya existe en src/pages/
│   ├── (clubs)/           → Ya existe en src/pages/
│   └── (discover)/        → Ya existe en src/pages/
├── components/
│   ├── profile/           ❌ Singular (consolidar en profiles/shared/)
│   └── profiles/          ✅ Plural (estructura moderna)
├── pages/                 ✅ Ubicación correcta
├── services/              ⚠️ Revisar dependencias circulares
└── styles/                ⚠️ Estilos duplicados
```

## Plan de Ejecución

### PASO 1: Crear estructura de destino
```powershell
# Crear directorios para admin pages
New-Item -ItemType Directory -Path "src/pages/admin" -Force
New-Item -ItemType Directory -Path "src/pages/discover" -Force
```

### PASO 2: Migrar archivos de src/app/(admin)/ → src/pages/admin/
```powershell
# Copiar archivos admin
Copy-Item "src/app/(admin)/Admin.tsx" "src/pages/admin/Admin.tsx" -Force
Copy-Item "src/app/(admin)/AdminProduction.tsx" "src/pages/admin/AdminProduction.tsx" -Force
Copy-Item "src/app/(admin)/AdminPartners.tsx" "src/pages/admin/AdminPartners.tsx" -Force
Copy-Item "src/app/(admin)/AdminCareerApplications.tsx" "src/pages/admin/AdminCareerApplications.tsx" -Force
Copy-Item "src/app/(admin)/AdminModerators.tsx" "src/pages/admin/AdminModerators.tsx" -Force
Copy-Item "src/app/(admin)/AdminAnalytics.tsx" "src/pages/admin/AdminAnalytics.tsx" -Force
Copy-Item "src/app/(admin)/AdminDashboard.tsx" "src/pages/admin/AdminDashboard.tsx" -Force
Copy-Item "src/app/(admin)/hooks" "src/pages/admin/hooks" -Recurse -Force
```

### PASO 3: Migrar src/app/(discover)/ → src/pages/discover/
```powershell
Copy-Item "src/app/(discover)/Discover.tsx" "src/pages/Discover.tsx" -Force
```

### PASO 4: Actualizar imports en src/App.tsx
Cambiar:
- `@/app/(admin)/Admin` → `@/pages/admin/Admin`
- `@/app/(admin)/AdminProduction` → `@/pages/admin/AdminProduction`
- `@/app/(admin)/AdminPartners` → `@/pages/admin/AdminPartners`
- `@/app/(admin)/AdminCareerApplications` → `@/pages/admin/AdminCareerApplications`
- `@/app/(admin)/AdminModerators` → `@/pages/admin/AdminModerators`
- `@/app/(admin)/AdminAnalytics` → `@/pages/admin/AdminAnalytics`
- `@/app/(discover)/Discover` → `@/pages/Discover` (ya existe)
- `@/app/(auth)/Auth` → `@/pages/Auth` (ya existe)
- `@/app/(clubs)/Clubs` → `@/pages/Clubs` (ya existe)

### PASO 5: Consolidar componentes de profile
```powershell
# Copiar componentes únicos de src/components/profile/ a src/components/profiles/shared/
Copy-Item "src/components/profile/EnhancedGallery.tsx" "src/components/profiles/shared/EnhancedGallery.tsx" -Force
Copy-Item "src/components/profile/ImageGallery.tsx" "src/components/profiles/shared/ImageGallery.tsx" -Force
Copy-Item "src/components/profile/ImageUpload.tsx" "src/components/profiles/shared/ImageUpload.tsx" -Force
Copy-Item "src/components/profile/PrivateImageRequest.tsx" "src/components/profiles/shared/PrivateImageRequest.tsx" -Force
# Gallery.tsx probablemente ya existe en profiles/shared/
```

### PASO 6: Actualizar imports globales
```powershell
# Buscar y reemplazar en todos los archivos
# De: @/components/profile/
# A: @/components/profiles/shared/

# Ejemplo con PowerShell:
Get-ChildItem -Path "src" -Recurse -Include "*.tsx", "*.ts" | 
  ForEach-Object {
    (Get-Content $_.FullName) -replace '@/components/profile/', '@/components/profiles/shared/' |
    Set-Content $_.FullName
  }
```

### PASO 7: Eliminar directorios antiguos
```powershell
# DESPUÉS de verificar que todos los imports funcionan:
Remove-Item "src/app" -Recurse -Force
Remove-Item "src/components/profile" -Recurse -Force
```

### PASO 8: Verificar tipos
```powershell
pnpm run type-check
```

### PASO 9: Consolidar estilos duplicados
```powershell
# Fusionar src/styles/couple.css y src/styles/profiles/couple.css
# Opción 1: Mantener en src/styles/profiles/couple.css y eliminar src/styles/couple.css
# Opción 2: Usar CSS Modules o Tailwind inline

Remove-Item "src/styles/couple.css" -Force
```

## Checklist de Verificación

- [ ] Directorios `src/pages/admin/` y `src/pages/discover/` creados
- [ ] Archivos admin copiados a `src/pages/admin/`
- [ ] Archivo Discover copiado a `src/pages/Discover.tsx`
- [ ] Imports en `src/App.tsx` actualizados
- [ ] Componentes de `profile/` copiados a `profiles/shared/`
- [ ] Imports globales actualizados (`@/components/profile/` → `@/components/profiles/shared/`)
- [ ] `pnpm run type-check` pasa sin errores
- [ ] Estilos duplicados consolidados
- [ ] Directorios antiguos eliminados (`src/app/`, `src/components/profile/`)
- [ ] Build local funciona: `pnpm run build`
- [ ] Tests pasan: `pnpm run test` (si aplica)

## Notas Importantes

1. **Orden es crítico**: Copiar archivos ANTES de actualizar imports
2. **Backup**: Considera hacer commit antes de eliminar directorios
3. **Verificación**: Ejecuta `pnpm run type-check` después de cada paso importante
4. **Imports relativos**: Algunos archivos pueden tener imports relativos que necesiten ajuste manual
5. **Dependencias circulares**: Después del refactor, ejecuta análisis de dependencias

## Dependencias Circulares a Revisar

- `src/services/SustainableEventsService.ts` importa desde `src/components/profiles/couple/AdvancedCoupleService.ts`
- `src/services/index.ts` exporta servicios que pueden tener dependencias cruzadas

**Solución**: Refactorizar `src/services/index.ts` para exportar solo tipos, no instancias.

---

**Ejecutar este refactor después de que el usuario lo autorice.**
