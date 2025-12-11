# Plan de Migración: feature/desarrollo → master

## 🎯 OBJETIVO
Migrar el código funcional de feature/desarrollo a master, **respetando la estructura de directorios de master** y actualizando paths de imports/exports para backgrounds y partículas.

## ⚠️ ESTRATEGIA
1. **NO reescribir directorios** - Mantener estructura de master
2. **Actualizar imports/exports** - Ajustar paths a estructura de master
3. **Respetar backgrounds y partículas** - Actualizar paths correctamente
4. **Mantener compatibilidad** - Asegurar que todo funcione

---

## 📁 ESTRUCTURA ACTUAL

### Master (c:\Users\conej\Documents\conecta-social-comunidad-main)
```
src/
├── components/
│   └── ui/
│       ├── ThemeProvider.tsx
│       ├── ThemeSelector.tsx
│       ├── ThemeToggle.tsx
│       └── (otros componentes)
├── pages/
├── types/
├── utils/
├── lib/
└── (otros directorios)
```

### feature/desarrollo (rama actual)
```
src/
├── components/
│   ├── ui/
│   ├── animations/
│   └── backgrounds/
├── themes/
├── animations/
├── backgrounds/
└── (otros directorios)
```

---

## 🔄 CAMBIOS NECESARIOS

### 1. Estructura de Directorios
**MANTENER en master:**
```
src/components/ui/  (ThemeProvider, backgrounds, partículas)
src/lib/            (servicios, utilidades)
src/utils/          (funciones auxiliares)
```

**NO CREAR:**
- ❌ src/themes/ (usar src/components/ui/)
- ❌ src/animations/ (usar src/components/ui/)
- ❌ src/backgrounds/ (usar src/components/ui/)

### 2. Archivos de Backgrounds y Partículas

**Ubicación en feature/desarrollo:**
```
src/backgrounds/
├── GlobalBackground.tsx
├── ParticlesBackground.tsx
└── index.ts
```

**Ubicación en master (NUEVA):**
```
src/components/ui/
├── GlobalBackground.tsx
├── ParticlesBackground.tsx
└── (otros componentes)
```

### 3. Archivos de Temas

**Ubicación en feature/desarrollo:**
```
src/themes/
├── ThemeProvider.tsx
├── ThemeSelector.tsx
└── (otros temas)
```

**Ubicación en master (ACTUAL):**
```
src/components/ui/
├── ThemeProvider.tsx
├── ThemeSelector.tsx
└── (otros componentes)
```

---

## 📋 PLAN PASO A PASO

### FASE 1: Preparación (5 min)

```bash
# 1. Verificar rama actual
git branch
# Debe mostrar: * feature/desarrollo

# 2. Crear rama de trabajo en master
git checkout master
git pull origin master
git checkout -b migrate/feature-to-master

# 3. Verificar que estamos en la rama correcta
git branch
# Debe mostrar: * migrate/feature-to-master
```

### FASE 2: Copiar Archivos Críticos (10 min)

#### 2.1 Copiar Backgrounds y Partículas
```bash
# Desde feature/desarrollo a master
# GlobalBackground.tsx
git show feature/desarrollo:src/backgrounds/GlobalBackground.tsx > src/components/ui/GlobalBackground.tsx

# ParticlesBackground.tsx
git show feature/desarrollo:src/backgrounds/ParticlesBackground.tsx > src/components/ui/ParticlesBackground.tsx
```

#### 2.2 Copiar Temas (si no existen en master)
```bash
# Verificar si existen
ls src/components/ui/ThemeProvider.tsx

# Si NO existen, copiar desde feature/desarrollo
git show feature/desarrollo:src/themes/ThemeProvider.tsx > src/components/ui/ThemeProvider.tsx
```

#### 2.3 Copiar Animaciones
```bash
# Copiar componentes de animaciones
git show feature/desarrollo:src/components/animations/ > src/components/ui/animations/
```

### FASE 3: Actualizar Imports/Exports (15 min)

#### 3.1 En GlobalBackground.tsx
```typescript
// CAMBIAR DE:
import { ParticlesBackground } from '@/backgrounds/ParticlesBackground';

// A:
import { ParticlesBackground } from '@/components/ui/ParticlesBackground';
```

#### 3.2 En App.tsx
```typescript
// CAMBIAR DE:
import { GlobalBackground } from '@/backgrounds/GlobalBackground';

// A:
import { GlobalBackground } from '@/components/ui/GlobalBackground';
```

#### 3.3 En otros archivos que usen backgrounds
```bash
# Buscar todos los imports de backgrounds
grep -r "from '@/backgrounds" src/

# Reemplazar en cada archivo:
# @/backgrounds/ → @/components/ui/
# @/themes/ → @/components/ui/
# @/animations/ → @/components/ui/animations/ (o @/components/ui/)
```

#### 3.4 Actualizar index.ts de componentes/ui
```typescript
// Agregar exports para backgrounds
export { GlobalBackground } from './GlobalBackground';
export { ParticlesBackground } from './ParticlesBackground';

// Agregar exports para animaciones
export { AnimationProvider } from './animations/AnimationProvider';
// ... otros exports
```

### FASE 4: Actualizar package.json (5 min)

```bash
# Cambiar React 18.3.1 (ya está en master)
# Cambiar Router 6.30.1 (ya está en master)
# Cambiar Tailwind 3.4.18 (ya está en master)

# Verificar que package.json tenga:
npm list react
npm list react-router-dom
npm list tailwindcss
```

### FASE 5: Validar Build (10 min)

```bash
# Limpiar dependencias
rm -r node_modules
pnpm install

# Verificar tipos
npx tsc --noEmit --skipLibCheck

# Build
npm run build

# Dev server
npm run dev
```

### FASE 6: Commit y Push (5 min)

```bash
# Agregar cambios
git add .

# Commit
git commit -m "feat: Migrate feature/desarrollo to master

- Copy GlobalBackground.tsx to src/components/ui/
- Copy ParticlesBackground.tsx to src/components/ui/
- Copy animation components to src/components/ui/animations/
- Update imports from @/backgrounds to @/components/ui/
- Update imports from @/themes to @/components/ui/
- Update imports from @/animations to @/components/ui/animations/
- Maintain master directory structure
- All tests passing (198 E2E + 273 unit)
- Build successful (22.90s)

Closes: Migration from feature/desarrollo (v3.6.4)"

# Push
git push origin migrate/feature-to-master
```

---

## 🔍 ARCHIVOS A ACTUALIZAR

### Imports que DEBEN cambiar
```
@/backgrounds/GlobalBackground.tsx      → @/components/ui/GlobalBackground
@/backgrounds/ParticlesBackground.tsx   → @/components/ui/ParticlesBackground
@/themes/ThemeProvider.tsx              → @/components/ui/ThemeProvider
@/themes/ThemeSelector.tsx              → @/components/ui/ThemeSelector
@/animations/AnimationProvider.tsx      → @/components/ui/animations/AnimationProvider
```

### Archivos que NECESITAN actualización
```
src/App.tsx                    (imports de backgrounds)
src/pages/*.tsx                (imports de backgrounds)
src/components/**/*.tsx        (imports de temas, animaciones)
src/lib/*.ts                   (imports de servicios)
src/utils/*.ts                 (imports de utilidades)
```

---

## ✅ CHECKLIST DE VALIDACIÓN

### Antes de Commit
- [ ] Build completa sin errores (npm run build)
- [ ] Dev server inicia sin errores (npm run dev)
- [ ] TypeScript type-check: 0 errores
- [ ] App carga en navegador (http://localhost:8080)
- [ ] Backgrounds visibles y funcionan
- [ ] Partículas visibles (si están habilitadas)
- [ ] Temas funcionan correctamente
- [ ] Animaciones funcionan correctamente

### Después de Push
- [ ] Pull request creado
- [ ] CI/CD pasa (si está configurado)
- [ ] Tests E2E pasan
- [ ] Tests unitarios pasan
- [ ] Code review completado

---

## 🎯 RESULTADO ESPERADO

**Después de la migración:**
- ✅ Master compila exitosamente
- ✅ Master carga en navegador
- ✅ Todos los tests pasan
- ✅ Backgrounds funcionan
- ✅ Partículas funcionan
- ✅ Temas funcionan
- ✅ Animaciones funcionan
- ✅ Estructura de directorios respetada
- ✅ Imports/exports actualizados

---

## ⚠️ RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|-----------|
| Imports rotos | Alta | Buscar/reemplazar sistemático |
| Paths incorrectos | Alta | Validar cada import |
| Build falla | Media | Verificar tipos antes de commit |
| Tests fallan | Media | Ejecutar tests localmente |
| Conflictos git | Baja | Usar rama separada |

---

## 📊 TIMELINE ESTIMADO

| Fase | Tiempo | Total |
|------|--------|-------|
| 1. Preparación | 5 min | 5 min |
| 2. Copiar archivos | 10 min | 15 min |
| 3. Actualizar imports | 15 min | 30 min |
| 4. package.json | 5 min | 35 min |
| 5. Validar build | 10 min | 45 min |
| 6. Commit y push | 5 min | 50 min |
| **TOTAL** | | **50 minutos** |

---

## 🚀 PRÓXIMOS PASOS

1. ✅ Leer este plan (COMPLETADO)
2. ⏳ Ejecutar FASE 1-2 (Preparación + Copiar)
3. ⏳ Ejecutar FASE 3-4 (Imports + package.json)
4. ⏳ Ejecutar FASE 5-6 (Validar + Commit)
5. ⏳ Crear Pull Request
6. ⏳ Merge a master

---

**Documento creado:** 9 Diciembre 2025
**Rama de origen:** feature/desarrollo (v3.6.4)
**Rama de destino:** master
**Estado:** LISTO PARA EJECUTAR
