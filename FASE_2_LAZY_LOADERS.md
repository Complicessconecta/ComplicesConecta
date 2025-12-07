# FASE 2: LAZY LOADERS - Ejecución

## 📋 Objetivo
Consolidar archivos Lazy* en `src/components/lazy/`

## 🔍 Análisis Previo

### Archivos a mover
```
1. src/components/ui/LazyImage.tsx → src/components/lazy/LazyImage.tsx
2. src/components/android/LazyImageLoader.tsx → src/components/lazy/LazyImageLoader.tsx
3. src/components/performance/LazyComponentLoader.tsx → src/components/lazy/LazyComponentLoader.tsx

Nota: src/pages/TokensInfoLazy.tsx se mantiene en pages/
```

### Búsqueda de imports
```bash
grep -r "LazyImage\|LazyImageLoader\|LazyComponentLoader" src/ --include="*.tsx" --include="*.ts"
```

---

## ✅ Ejecución FASE 2

### Paso 2.1: Crear directorio
```bash
mkdir -p src/components/lazy
```

### Paso 2.2: Mover archivos
```bash
mv src/components/ui/LazyImage.tsx src/components/lazy/
mv src/components/android/LazyImageLoader.tsx src/components/lazy/
mv src/components/performance/LazyComponentLoader.tsx src/components/lazy/
```

### Paso 2.3: Crear barrel export
```typescript
// src/components/lazy/index.ts
export { LazyImage } from './LazyImage'
export { LazyImageLoader } from './LazyImageLoader'
export { LazyComponentLoader } from './LazyComponentLoader'
```

### Paso 2.4: Actualizar imports
Buscar y reemplazar:
```
@/components/ui/LazyImage → @/components/lazy/LazyImage
@/components/android/LazyImageLoader → @/components/lazy/LazyImageLoader
@/components/performance/LazyComponentLoader → @/components/lazy/LazyComponentLoader
```

### Paso 2.5: Compilar y verificar
```bash
pnpm run build
```

### Paso 2.6: Commit
```bash
git add src/components/lazy/
git commit -m "refactor: consolidate lazy loaders in components/lazy"
```

---

## 📊 Resumen FASE 2

| Métrica | Valor |
|---------|-------|
| Archivos movidos | 3 |
| Imports a actualizar | TBD |
| Tiempo | ~30 minutos |
| Riesgo | MEDIO |
| Estado | ⏳ EN PROGRESO |

---

## 🎯 Próxima Fase
Ver: `FASE_3_PROFILES.md`
