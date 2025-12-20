# 📋 PLAN DE CONSOLIDACIÓN DE DIRECTORIOS

**Fecha:** 9 Diciembre 2025  
**Objetivo:** Consolidar directorios duplicados y reorganizar estructura

---

## FASE 1: CONSOLIDACIÓN DE DIRECTORIOS DUPLICADOS

### 1. Consolidar Animaciones

**Situación Actual:**
```
src/animations/              ← Directorio principal
src/components/animations/   ← Duplicado
```

**Acción:**
```bash
# 1. Mover archivos de componentes a principal
cp -r src/components/animations/* src/animations/

# 2. Actualizar imports en archivos que usan src/components/animations
# Buscar: import.*from.*@/components/animations
# Reemplazar: import.*from.*@/animations

# 3. Eliminar directorio duplicado
rm -rf src/components/animations/

# 4. Verificar index.ts
# Asegurar que src/animations/index.ts exporta todos los componentes
```

**Archivos a Actualizar:**
- Buscar todos los imports de `@/components/animations`
- Reemplazar con `@/animations`

---

### 2. Consolidar Backgrounds

**Situación Actual:**
```
src/backgrounds/             ← Directorio principal
src/components/ui/backgrounds/ ← Duplicado
```

**Acción:**
```bash
# 1. Mover archivos
cp -r src/components/ui/backgrounds/* src/backgrounds/

# 2. Actualizar imports
# Buscar: import.*from.*@/components/ui/backgrounds
# Reemplazar: import.*from.*@/backgrounds

# 3. Eliminar directorio duplicado
rm -rf src/components/ui/backgrounds/

# 4. Verificar index.ts
```

**Archivos a Actualizar:**
- Buscar todos los imports de `@/components/ui/backgrounds`
- Reemplazar con `@/backgrounds`

---

### 3. Consolidar Profiles (Singular → Plural)

**Situación Actual:**
```
src/components/profiles/     ← Plural (correcto)
src/components/profile/      ← Singular (incorrecto)
```

**Acción:**
```bash
# 1. Mover archivos
cp -r src/components/profile/* src/components/profiles/

# 2. Actualizar imports
# Buscar: import.*from.*@/components/profile
# Reemplazar: import.*from.*@/components/profiles

# 3. Eliminar directorio duplicado
rm -rf src/components/profile/
```

**Archivos a Actualizar:**
- Buscar todos los imports de `@/components/profile`
- Reemplazar con `@/components/profiles`

---

### 4. Mover Lazy Components

**Situación Actual:**
```
src/components/lazy/         ← Componentes lazy
src/components/performance/  ← Performance related
```

**Acción:**
```bash
# 1. Mover archivos lazy a performance
cp -r src/components/lazy/* src/components/performance/

# 2. Actualizar imports
# Buscar: import.*from.*@/components/lazy
# Reemplazar: import.*from.*@/components/performance

# 3. Eliminar directorio duplicado
rm -rf src/components/lazy/
```

---

### 5. Mover Cache Components

**Situación Actual:**
```
src/components/cache/        ← Cache components
src/lib/cache/               ← Cache utilities
```

**Acción:**
```bash
# 1. Mover archivos a lib
cp -r src/components/cache/* src/lib/cache/

# 2. Actualizar imports
# Buscar: import.*from.*@/components/cache
# Reemplazar: import.*from.*@/lib/cache

# 3. Eliminar directorio duplicado
rm -rf src/components/cache/
```

---

## FASE 2: ESTANDARIZACIÓN DE EXPORTS/IMPORTS

### Crear Barrel Exports

**Patrón Correcto:**

```typescript
// src/animations/index.ts
export { FadeInAnimation } from './FadeInAnimation';
export { SlideInAnimation } from './SlideInAnimation';
export { ScaleAnimation } from './ScaleAnimation';
export type { AnimationProps } from './types';

// Uso:
import { FadeInAnimation, SlideInAnimation } from '@/animations';
```

**Directorios a Actualizar:**
1. `src/animations/index.ts`
2. `src/backgrounds/index.ts`
3. `src/components/profiles/index.ts`
4. `src/components/performance/index.ts`
5. `src/lib/cache/index.ts`

---

## FASE 3: AUDITORÍA DE IMPORTS

### Buscar Imports Inconsistentes

```bash
# Buscar imports con rutas relativas
grep -r "from '\.\./\.\./\.\." src/

# Buscar imports sin alias
grep -r "from '\.\./" src/ | grep -v node_modules

# Buscar imports incompletos
grep -r "from '@/" src/ | grep -v "from '@/[a-z]"
```

### Reemplazar Imports

**Patrón Incorrecto:**
```typescript
import Button from '../../../components/ui/Button';
import { Card } from '../../shared/ui/Card';
```

**Patrón Correcto:**
```typescript
import { Button } from '@/components/ui/Button';
import { Card } from '@/shared/ui/Card';
```

---

## FASE 4: VERIFICACIÓN DE ARCHIVOS HUÉRFANOS

### Archivos sin Importaciones

```bash
# Buscar archivos que no son importados por nadie
for file in src/**/*.{ts,tsx}; do
  if ! grep -r "from.*$file" src/ > /dev/null; then
    echo "Potencial huérfano: $file"
  fi
done
```

### Archivos Duplicados

```bash
# Buscar archivos con mismo contenido
find src/ -type f -name "*.tsx" -o -name "*.ts" | while read f1; do
  while read f2; do
    if [ "$f1" != "$f2" ] && cmp -s "$f1" "$f2"; then
      echo "Duplicados: $f1 == $f2"
    fi
  done
done
```

---

## FASE 5: VALIDACIÓN DE TABLAS SUPABASE

### Crear Tablas Faltantes

```sql
-- Crear tabla virtual_events si es necesaria
CREATE TABLE IF NOT EXISTS virtual_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla couple_profile_views
CREATE TABLE IF NOT EXISTS couple_profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_profile_id UUID REFERENCES couple_profiles(id),
  viewer_id UUID REFERENCES profiles(id),
  viewed_at TIMESTAMP DEFAULT NOW()
);

-- Crear tabla couple_profile_reports
CREATE TABLE IF NOT EXISTS couple_profile_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_profile_id UUID REFERENCES couple_profiles(id),
  reporter_id UUID REFERENCES profiles(id),
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## CHECKLIST DE CONSOLIDACIÓN

### Fase 1: Directorios
- [ ] Consolidar `src/components/animations/` → `src/animations/`
- [ ] Consolidar `src/components/ui/backgrounds/` → `src/backgrounds/`
- [ ] Consolidar `src/components/profile/` → `src/components/profiles/`
- [ ] Mover `src/components/lazy/` → `src/components/performance/`
- [ ] Mover `src/components/cache/` → `src/lib/cache/`

### Fase 2: Exports/Imports
- [ ] Crear/actualizar `src/animations/index.ts`
- [ ] Crear/actualizar `src/backgrounds/index.ts`
- [ ] Crear/actualizar `src/components/profiles/index.ts`
- [ ] Crear/actualizar `src/components/performance/index.ts`
- [ ] Crear/actualizar `src/lib/cache/index.ts`

### Fase 3: Imports Inconsistentes
- [ ] Buscar imports con rutas relativas
- [ ] Reemplazar con alias `@/`
- [ ] Validar que no hay imports rotos

### Fase 4: Archivos Huérfanos
- [ ] Auditar archivos sin importaciones
- [ ] Eliminar o documentar archivos obsoletos
- [ ] Consolidar duplicados

### Fase 5: Tablas Supabase
- [ ] Crear `virtual_events` si es necesaria
- [ ] Crear `couple_profile_views` si es necesaria
- [ ] Crear `couple_profile_reports` si es necesaria
- [ ] Regenerar tipos TypeScript

---

## IMPACTO ESTIMADO

| Fase | Archivos Afectados | Tiempo Estimado | Riesgo |
|------|-------------------|-----------------|--------|
| 1 | 50-100 | 30 min | BAJO |
| 2 | 5-10 | 15 min | BAJO |
| 3 | 100-200 | 45 min | MEDIO |
| 4 | 10-50 | 30 min | BAJO |
| 5 | 3 tablas | 15 min | BAJO |

**Total:** ~2.5 horas

---

## VALIDACIÓN POST-CONSOLIDACIÓN

```bash
# 1. Verificar que no hay imports rotos
npm run build

# 2. Ejecutar tests
npm run test

# 3. Verificar ESLint
npx eslint src --ext .ts,.tsx

# 4. Verificar TypeScript
npx tsc --noEmit --skipLibCheck

# 5. Verificar que la app carga
npm run dev
```

---

**Estado:** 📋 PLAN LISTO PARA EJECUCIÓN  
**Rama:** integrate/lab-selective-safe  
**Próximo Paso:** Ejecutar Fase 1 (Consolidación de Directorios)
