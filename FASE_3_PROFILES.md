# FASE 3: PROFILES - Ejecución

## 📋 Objetivo
Consolidar 43 archivos de profiles en `src/components/profiles/`

## 🔍 Análisis Previo

### Estructura Actual
```
src/profiles/
├── couple/ (5 archivos)
├── shared/ (20+ archivos)
└── single/ (varios archivos)

src/components/profile/ (1 archivo)
src/features/profile/ (6 archivos - SERVICIOS, mantener)
src/layouts/ProfileLayout.tsx (LAYOUT, mantener)
```

### Estructura Destino
```
src/components/profiles/
├── shared/ (componentes compartidos)
├── couple/ (componentes de pareja)
└── single/ (componentes individuales)

src/features/profile/ (mantener servicios)
src/layouts/ProfileLayout.tsx (mantener layout)
```

### Imports Encontrados
```
@/profiles/couple/
@/profiles/shared/
@/profiles/single/
```

**Archivos que necesitan actualización:**
- src/services/SustainableEventsService.ts
- src/profiles/shared/ProfileTabs.tsx
- src/profiles/shared/ProfileThemeShowcase.tsx
- src/profiles/shared/ProfileThemeDemo.tsx
- src/profiles/shared/ProfileReportsPanel.test.tsx
- src/profiles/single/ProfileSingle.tsx
- src/profiles/single/ProfileSingle.test.tsx
- src/profiles/single/EditProfileSingle.test.tsx
- src/profiles/couple/ProfileCouple.tsx
- src/profiles/couple/CoupleDashboard.tsx
- src/pages/Discover.tsx
- src/components/AppSidebar.tsx
- src/components/discover/index.ts
- src/components/auth/ThemeInfoModal.tsx

---

## ⚠️ NOTA IMPORTANTE

**Esta es la fase más compleja.** Requiere:
1. Crear estructura de directorios
2. Mover 43 archivos
3. Actualizar 14+ archivos con imports
4. Compilar y verificar

**Se recomienda hacer esto en pasos pequeños y compilar después de cada paso.**

---

## ✅ Ejecución FASE 3 (Paso a Paso)

### Paso 3.1: Crear estructura de directorios
```bash
mkdir -p src/components/profiles/shared
mkdir -p src/components/profiles/couple
mkdir -p src/components/profiles/single
```

### Paso 3.2: Mover componentes compartidos
```bash
# Mover todos los archivos de src/profiles/shared/ a src/components/profiles/shared/
mv src/profiles/shared/* src/components/profiles/shared/
```

### Paso 3.3: Mover componentes de pareja
```bash
# Mover todos los archivos de src/profiles/couple/ a src/components/profiles/couple/
mv src/profiles/couple/* src/components/profiles/couple/
```

### Paso 3.4: Mover componentes individuales
```bash
# Mover todos los archivos de src/profiles/single/ a src/components/profiles/single/
mv src/profiles/single/* src/components/profiles/single/
```

### Paso 3.5: Mover componente de profile
```bash
# Mover src/components/profile/AdvancedProfileEditor.tsx a src/components/profiles/
mv src/components/profile/AdvancedProfileEditor.tsx src/components/profiles/
```

### Paso 3.6: Crear barrel exports
```typescript
// src/components/profiles/index.ts
export * from './shared'
export * from './couple'
export * from './single'

// src/components/profiles/shared/index.ts
export { AnimatedProfileCard } from './AnimatedProfileCard'
export { ProfileCard } from './ProfileCard'
// ... etc (todos los componentes)

// src/components/profiles/couple/index.ts
export { CoupleProfileCard } from './CoupleProfileCard'
export { ProfileCouple } from './ProfileCouple'
// ... etc

// src/components/profiles/single/index.ts
export { ProfileSingle } from './ProfileSingle'
// ... etc
```

### Paso 3.7: Actualizar imports

**Patrón de búsqueda y reemplazo:**
```
@/profiles/shared/ → @/components/profiles/shared/
@/profiles/couple/ → @/components/profiles/couple/
@/profiles/single/ → @/components/profiles/single/
```

**Archivos a actualizar:**
1. src/services/SustainableEventsService.ts
2. src/profiles/shared/ProfileTabs.tsx
3. src/profiles/shared/ProfileThemeShowcase.tsx
4. src/profiles/shared/ProfileThemeDemo.tsx
5. src/profiles/shared/ProfileReportsPanel.test.tsx
6. src/profiles/single/ProfileSingle.tsx
7. src/profiles/single/ProfileSingle.test.tsx
8. src/profiles/single/EditProfileSingle.test.tsx
9. src/profiles/couple/ProfileCouple.tsx
10. src/profiles/couple/CoupleDashboard.tsx
11. src/pages/Discover.tsx
12. src/components/AppSidebar.tsx
13. src/components/discover/index.ts
14. src/components/auth/ThemeInfoModal.tsx

### Paso 3.8: Compilar y verificar
```bash
pnpm run build
```

### Paso 3.9: Eliminar directorios vacíos
```bash
rmdir src/profiles/shared
rmdir src/profiles/couple
rmdir src/profiles/single
rmdir src/profiles
rmdir src/components/profile
```

### Paso 3.10: Commit
```bash
git add src/components/profiles/
git commit -m "refactor: consolidate profiles in components/profiles"
```

---

## 📊 Resumen FASE 3

| Métrica | Valor |
|---------|-------|
| Archivos movidos | 43 |
| Imports a actualizar | 14+ |
| Tiempo estimado | 2 horas |
| Riesgo | ALTO |
| Complejidad | ALTA |
| Estado | ⏳ PENDIENTE |

---

## 🚨 Consideraciones Críticas

1. **Hacer cambios en pasos pequeños**
2. **Compilar después de cada paso importante**
3. **Usar grep para verificar imports**
4. **Hacer commits frecuentes**
5. **Si algo falla, revertir el último commit**

---

## 🎯 Próxima Fase
Ver: `FASE_4_MODALS.md`
