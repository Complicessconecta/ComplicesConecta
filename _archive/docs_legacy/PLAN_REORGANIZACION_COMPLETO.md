# Plan de Reorganización Completo - Consolidación de Directorios

## 📊 Análisis de Estructura Actual

### 1. LAYOUTS (9 archivos)
```
Ubicación Actual:
├── src/components/AppLayout.tsx
├── src/layouts/AdminLayout.tsx
├── src/layouts/AuthLayout.tsx
├── src/layouts/EmptyLayout.tsx
├── src/layouts/MainLayout.tsx
├── src/layouts/ProfileLayout.tsx
├── src/layouts/ResponsiveLayout.tsx
└── src/hooks/useIsomorphicLayoutEffect.ts
└── src/utils/safeLayoutEffect.ts

Problema: AppLayout.tsx está en src/components/ en lugar de src/layouts/
```

**Recomendación:** Mover `AppLayout.tsx` a `src/layouts/`

---

### 2. BACKGROUNDS (3 archivos)
```
Ubicación Actual:
src/components/ui/
├── GlobalBackground.tsx
├── ParticlesBackground.tsx
└── RandomBackground.tsx

Estado: ✅ BIEN ORGANIZADOS
```

**Recomendación:** Mantener como está (ya están en UI)

---

### 3. LAZY LOADERS (4 archivos)
```
Ubicación Actual:
├── src/components/android/LazyImageLoader.tsx
├── src/components/performance/LazyComponentLoader.tsx
├── src/components/ui/LazyImage.tsx
└── src/pages/TokensInfoLazy.tsx

Problema: Dispersos en múltiples directorios
```

**Recomendación:** Consolidar en `src/components/lazy/`
- LazyImage.tsx (UI component)
- LazyImageLoader.tsx (Android specific)
- LazyComponentLoader.tsx (Performance)
- TokensInfoLazy.tsx (Page component - mantener en pages)

---

### 4. PROFILES (43 archivos)
```
Ubicación Actual:
├── src/components/profile/AdvancedProfileEditor.tsx
├── src/features/profile/ (6 archivos)
├── src/layouts/ProfileLayout.tsx
├── src/profiles/couple/ (5 archivos)
├── src/profiles/shared/ (20+ archivos)
└── src/profiles/single/ (varios archivos)

Problema: ALTAMENTE DISPERSOS
- Componentes en src/components/profile/
- Servicios en src/features/profile/
- Componentes en src/profiles/shared/
- Componentes específicos en src/profiles/couple/ y single/
```

**Recomendación:** Consolidar en `src/components/profiles/`
```
src/components/profiles/
├── shared/
│   ├── AnimatedProfileCard.tsx (mover desde src/profiles/shared/)
│   ├── ProfileCard.tsx
│   ├── ProfileDetail.tsx
│   ├── ProfileGrid.tsx
│   ├── ProfileFilters.tsx
│   └── ... (otros componentes compartidos)
├── couple/
│   ├── CoupleProfileCard.tsx
│   ├── CoupleProfileHeader.tsx
│   ├── ProfileCouple.tsx
│   └── EditProfileCouple.tsx
├── single/
│   ├── ProfileSingle.tsx
│   ├── EditProfileSingle.tsx
│   └── ...
└── index.ts (barrel export)

src/features/profile/ (mantener servicios)
├── CoupleProfilesService.ts
├── ProfileReportService.ts
├── coupleProfiles.ts
├── useCoupleProfile.ts
└── ... (hooks y servicios)
```

---

## 🎯 Plan de Acción Detallado

### FASE 1: LAYOUTS (Baja Complejidad)

#### Paso 1.1: Mover AppLayout.tsx
```bash
mv src/components/AppLayout.tsx src/layouts/AppLayout.tsx
```

#### Paso 1.2: Actualizar imports
Buscar y reemplazar:
```typescript
// Antes
import { AppLayout } from '@/components/AppLayout'

// Después
import { AppLayout } from '@/layouts/AppLayout'
```

**Archivos afectados:** Buscar con grep
```bash
grep -r "from '@/components/AppLayout'" src/
```

---

### FASE 2: LAZY LOADERS (Media Complejidad)

#### Paso 2.1: Crear directorio
```bash
mkdir -p src/components/lazy
```

#### Paso 2.2: Mover archivos
```bash
mv src/components/ui/LazyImage.tsx src/components/lazy/
mv src/components/android/LazyImageLoader.tsx src/components/lazy/
mv src/components/performance/LazyComponentLoader.tsx src/components/lazy/
```

#### Paso 2.3: Crear barrel export
```typescript
// src/components/lazy/index.ts
export { LazyImage } from './LazyImage'
export { LazyImageLoader } from './LazyImageLoader'
export { LazyComponentLoader } from './LazyComponentLoader'
```

#### Paso 2.4: Actualizar imports
```bash
# Buscar todos los imports
grep -r "LazyImage\|LazyImageLoader\|LazyComponentLoader" src/ --include="*.tsx" --include="*.ts"

# Reemplazar
# De: @/components/ui/LazyImage → @/components/lazy/LazyImage
# De: @/components/android/LazyImageLoader → @/components/lazy/LazyImageLoader
# De: @/components/performance/LazyComponentLoader → @/components/lazy/LazyComponentLoader
```

---

### FASE 3: PROFILES (Alta Complejidad)

#### Paso 3.1: Crear estructura de directorios
```bash
mkdir -p src/components/profiles/shared
mkdir -p src/components/profiles/couple
mkdir -p src/components/profiles/single
```

#### Paso 3.2: Mover componentes compartidos
```bash
# De src/profiles/shared/ a src/components/profiles/shared/
mv src/profiles/shared/AnimatedProfileCard.tsx src/components/profiles/shared/
mv src/profiles/shared/ProfileCard.tsx src/components/profiles/shared/
mv src/profiles/shared/ProfileDetail.tsx src/components/profiles/shared/
mv src/profiles/shared/ProfileGrid.tsx src/components/profiles/shared/
mv src/profiles/shared/ProfileFilters.tsx src/components/profiles/shared/
# ... (resto de componentes compartidos)
```

#### Paso 3.3: Mover componentes específicos
```bash
# Couple profiles
mv src/profiles/couple/CoupleProfileCard.tsx src/components/profiles/couple/
mv src/profiles/couple/CoupleProfileHeader.tsx src/components/profiles/couple/
mv src/profiles/couple/ProfileCouple.tsx src/components/profiles/couple/
mv src/profiles/couple/EditProfileCouple.tsx src/components/profiles/couple/

# Single profiles
mv src/profiles/single/ProfileSingle.tsx src/components/profiles/single/
mv src/profiles/single/EditProfileSingle.tsx src/components/profiles/single/
```

#### Paso 3.4: Crear barrel exports
```typescript
// src/components/profiles/index.ts
export * from './shared'
export * from './couple'
export * from './single'

// src/components/profiles/shared/index.ts
export { AnimatedProfileCard } from './AnimatedProfileCard'
export { ProfileCard } from './ProfileCard'
export { ProfileDetail } from './ProfileDetail'
// ... etc

// src/components/profiles/couple/index.ts
export { CoupleProfileCard } from './CoupleProfileCard'
export { ProfileCouple } from './ProfileCouple'
// ... etc

// src/components/profiles/single/index.ts
export { ProfileSingle } from './ProfileSingle'
// ... etc
```

#### Paso 3.5: Actualizar imports
```bash
# Buscar todos los imports de profiles
grep -r "from '@/profiles/" src/ --include="*.tsx" --include="*.ts"

# Reemplazar patrones:
# @/profiles/shared/AnimatedProfileCard → @/components/profiles/shared/AnimatedProfileCard
# @/profiles/couple/ProfileCouple → @/components/profiles/couple/ProfileCouple
# @/profiles/single/ProfileSingle → @/components/profiles/single/ProfileSingle
```

---

## 📋 Matriz de Cambios

### LAYOUTS
| Archivo | Desde | Hacia | Archivos Afectados |
|---------|-------|-------|-------------------|
| AppLayout.tsx | src/components/ | src/layouts/ | TBD |

### LAZY
| Archivo | Desde | Hacia | Archivos Afectados |
|---------|-------|-------|-------------------|
| LazyImage.tsx | src/components/ui/ | src/components/lazy/ | TBD |
| LazyImageLoader.tsx | src/components/android/ | src/components/lazy/ | TBD |
| LazyComponentLoader.tsx | src/components/performance/ | src/components/lazy/ | TBD |

### PROFILES
| Archivo | Desde | Hacia | Archivos Afectados |
|---------|-------|-------|-------------------|
| AnimatedProfileCard.tsx | src/profiles/shared/ | src/components/profiles/shared/ | Discover.tsx (4 refs) |
| ProfileCard.tsx | src/profiles/shared/ | src/components/profiles/shared/ | TBD |
| ... | src/profiles/shared/ | src/components/profiles/shared/ | TBD |
| ProfileCouple.tsx | src/profiles/couple/ | src/components/profiles/couple/ | TBD |
| ProfileSingle.tsx | src/profiles/single/ | src/components/profiles/single/ | TBD |

---

## 🔍 Scripts de Búsqueda y Reemplazo

### Script 1: Encontrar todos los imports de AppLayout
```bash
grep -r "from '@/components/AppLayout'" src/
```

### Script 2: Encontrar todos los imports de Lazy
```bash
grep -r "from '@/components/ui/LazyImage\|from '@/components/android/LazyImageLoader\|from '@/components/performance/LazyComponentLoader'" src/
```

### Script 3: Encontrar todos los imports de Profiles
```bash
grep -r "from '@/profiles/" src/
```

---

## ✅ Checklist de Implementación

### FASE 1: LAYOUTS
- [ ] Mover AppLayout.tsx a src/layouts/
- [ ] Actualizar imports en archivos afectados
- [ ] Compilar y verificar: `pnpm run build`
- [ ] Commit: "refactor: consolidate layouts"

### FASE 2: LAZY LOADERS
- [ ] Crear directorio src/components/lazy/
- [ ] Mover archivos Lazy*
- [ ] Crear barrel export
- [ ] Actualizar imports
- [ ] Compilar y verificar: `pnpm run build`
- [ ] Commit: "refactor: consolidate lazy loaders"

### FASE 3: PROFILES
- [ ] Crear estructura de directorios
- [ ] Mover componentes compartidos
- [ ] Mover componentes específicos
- [ ] Crear barrel exports
- [ ] Actualizar imports (CRÍTICO - muchos archivos)
- [ ] Compilar y verificar: `pnpm run build`
- [ ] Commit: "refactor: consolidate profiles"

---

## 🚨 Consideraciones Importantes

### Riesgos
1. **ALTO:** Cambios en imports pueden romper la app
2. **MEDIO:** Muchos archivos afectados en profiles
3. **BAJO:** Cambios en layouts son simples

### Mitigación
1. Hacer cambios en fases
2. Compilar después de cada fase
3. Usar grep para encontrar todos los imports
4. Hacer commits después de cada fase

### Orden Recomendado
1. **Primero:** LAYOUTS (simple, bajo riesgo)
2. **Segundo:** LAZY LOADERS (medio, pocos archivos)
3. **Tercero:** PROFILES (complejo, muchos archivos)

---

## 📊 Resumen

| Categoría | Archivos | Complejidad | Riesgo | Tiempo |
|-----------|----------|-------------|--------|--------|
| Layouts | 1 | Baja | Bajo | 15 min |
| Lazy | 3 | Media | Medio | 30 min |
| Profiles | 43 | Alta | Alto | 2 horas |
| **TOTAL** | **47** | **Media** | **Medio** | **2.5 horas** |

---

## 🎯 Beneficios Esperados

✅ **Mejor Organización:** Componentes agrupados por funcionalidad
✅ **Fácil Mantenimiento:** Estructura clara y consistente
✅ **Reutilización:** Barrel exports facilitan importaciones
✅ **Escalabilidad:** Fácil agregar nuevos componentes
✅ **Consistencia:** Todos los componentes en src/components/

---

## 📝 Notas

- Mantener src/features/profile/ para servicios y hooks
- Mantener src/layouts/ para layouts globales
- Mantener src/pages/ para pages
- Mantener src/components/ui/ para componentes UI puros
- Crear src/components/profiles/ para componentes de perfil
- Crear src/components/lazy/ para componentes lazy
