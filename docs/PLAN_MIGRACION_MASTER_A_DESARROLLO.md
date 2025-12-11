# Plan de Migración: Master → feature/desarrollo

## 🎯 OBJETIVO
Migrar master desde React 19 + Router 7 + Tailwind 4 a React 18 + Router 6 + Tailwind 3 (como feature/desarrollo).

## ⚠️ PRECAUCIÓN
**NO MODIFICAR feature/desarrollo**. Solo usar como referencia.

---

## FASE 1: Análisis de Dependencias Críticas

### Dependencias que DEBEN cambiar en master

#### 1. React & React-DOM
```json
// ACTUAL (Master)
"react": "^19.2.1",
"react-dom": "^19.2.1",

// CAMBIAR A
"react": "^18.3.1",
"react-dom": "^18.3.1",
```

#### 2. React Types
```json
// ACTUAL (Master)
"@types/react": "^19.2.7",
"@types/react-dom": "^19.2.3",

// CAMBIAR A
"@types/react": "^18.3.26",
"@types/react-dom": "^18.3.7",
```

#### 3. React Router
```json
// ACTUAL (Master)
"react-router-dom": "^7.10.1",

// CAMBIAR A
"react-router-dom": "^6.30.1",
```

#### 4. Tailwind CSS
```json
// ACTUAL (Master)
"tailwindcss": "4.1.17",
"@tailwindcss/postcss": "^4.1.17",

// CAMBIAR A
"tailwindcss": "^3.4.18",
// REMOVER @tailwindcss/postcss
```

#### 5. Vite Plugin React
```json
// ACTUAL (Master)
"@vitejs/plugin-react": "^5.1.2",

// CAMBIAR A
"@vitejs/plugin-react": "^4.7.0",
```

#### 6. Librerías que usan React 19
```json
// REMOVER (no compatibles con React 18)
"@tsparticles/engine": "^3.9.1",
"@tsparticles/react": "^3.0.0",
"@tsparticles/slim": "^3.9.1",
"react-markdown": "^10.1.0",
"rehype-raw": "^7.0.0",
"remark-gfm": "^4.0.1",
"ai": "^5.0.108",
```

#### 7. Librerías a Downgrade
```json
// Cambios menores pero importantes
"@supabase/supabase-js": "^2.87.1" → "^2.81.0",
"@tanstack/react-query": "^5.90.12" → "^5.90.7",
"@worldcoin/idkit": "^2.4.2" → "^1.5.0",
"ethers": "^6.16.0" → "^5.8.0",
"neo4j-driver": "^6.0.1" → "^5.28.2",
"stripe": "^20.0.0" → "^19.3.1",
"framer-motion": "^12.23.25" → "^11.18.2",
"lucide-react": "^0.556.0" → "^0.451.0",
"recharts": "^3.5.1" → "^3.3.0",
```

---

## FASE 2: Cambios en Archivos de Configuración

### 1. tsconfig.json
```diff
{
  "compilerOptions": {
    "types": [
      "node",
      "react",
      "react-dom",
-     "vite/client"
    ]
  }
}
```

**Razón**: Vite 7+ proporciona tipos automáticamente.

### 2. tailwind.config.ts
```diff
- import type { Config } from "tailwindcss/types";
+ import type { Config } from "tailwindcss";

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ... resto del config
    }
  },
  plugins: [],
} satisfies Config;
```

**Razón**: Tailwind v3 usa config tradicional, no @tailwindcss/postcss.

### 3. postcss.config.js
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**Razón**: Tailwind v3 se integra directamente con PostCSS.

### 4. vite.config.ts
```diff
import react from '@vitejs/plugin-react';

export default {
  plugins: [
-   react({ babel: { plugins: [...] } }),
+   react(),
  ],
  // ... resto del config
};
```

**Razón**: React 18 no necesita configuración especial de Babel.

---

## FASE 3: Cambios en Código

### 1. App.tsx - Remover tipos de React 19
```diff
- import type { FC, ReactNode } from 'react';
+ import { Suspense } from 'react';

// Los componentes FC<Props> funcionan sin cambios en React 18
```

### 2. Componentes con Suspense
```diff
- <Suspense fallback={<LoadingSpinner />}>
+ <Suspense fallback={<LoadingSpinner />}>
    <Routes>
      {/* ... */}
    </Routes>
  </Suspense>
```

**No hay cambios**, Suspense funciona igual en React 18.

### 3. Router v6 vs v7
```diff
- import { BrowserRouter, Routes, Route } from 'react-router-dom';
+ import { BrowserRouter, Routes, Route } from 'react-router-dom';

// API es idéntica en v6 y v7, solo cambios internos
// No requiere cambios en el código
```

### 4. Remover imports de librerías eliminadas
```diff
- import { Particles } from '@tsparticles/react';
- import { ReactMarkdown } from 'react-markdown';
- import { useAI } from 'ai/react';

// Usar alternativas o remover si no son críticas
```

---

## FASE 4: Proceso de Migración Paso a Paso

### Paso 1: Backup
```bash
git checkout -b master-backup-before-downgrade
git checkout master
```

### Paso 2: Actualizar package.json
```bash
# Remover dependencias incompatibles
npm uninstall @tailwindcss/postcss @tsparticles/engine @tsparticles/react @tsparticles/slim react-markdown rehype-raw remark-gfm ai

# Instalar versiones correctas
npm install react@18.3.1 react-dom@18.3.1
npm install --save-dev @types/react@18.3.26 @types/react-dom@18.3.7
npm install --save-dev tailwindcss@3.4.18
npm install --save-dev @vitejs/plugin-react@4.7.0
npm install react-router-dom@6.30.1

# Downgrade otras librerías
npm install @supabase/supabase-js@2.81.0
npm install @tanstack/react-query@5.90.7
npm install @worldcoin/idkit@1.5.0
npm install ethers@5.8.0
npm install neo4j-driver@5.28.2
npm install stripe@19.3.1
npm install framer-motion@11.18.2
npm install lucide-react@0.451.0
npm install recharts@3.3.0
```

### Paso 3: Actualizar archivos de configuración
```bash
# Editar tsconfig.json (remover "vite/client")
# Editar tailwind.config.ts (cambiar import)
# Editar postcss.config.js (usar config v3)
# Editar vite.config.ts (simplificar react plugin)
```

### Paso 4: Limpiar imports
```bash
# Buscar y remover imports de librerías eliminadas
grep -r "@tsparticles" src/
grep -r "react-markdown" src/
grep -r "from 'ai'" src/
```

### Paso 5: Verificar build
```bash
npm run build
# Debe completar sin errores

npm run dev
# Debe iniciar sin errores
```

### Paso 6: Verificar tipos
```bash
npx tsc --noEmit --skipLibCheck
# Debe retornar 0 errores
```

---

## FASE 5: Validación

### Checklist de Validación
- [ ] Build completa sin errores (npm run build)
- [ ] Dev server inicia sin errores (npm run dev)
- [ ] TypeScript type-check: 0 errores
- [ ] App carga en navegador (http://localhost:8080)
- [ ] Navegación funciona (Routes)
- [ ] Componentes renderean correctamente
- [ ] No hay console errors
- [ ] Tests pasan (npm run test:run)

---

## FASE 6: Migraciones Supabase

### Análisis de Migraciones
```bash
# Comparar migraciones
git diff master feature/desarrollo -- supabase/migrations/
```

### Migraciones a Revisar
1. **20251115120000_fix_blockchain_tables.sql** - Revisar RLS
2. **20251115130000_fix_triggers.sql** - Revisar triggers
3. **20251113080002_fix_all_blockchain_issues.sql** - Revisar cambios

### Migraciones a EVITAR (causaban RLS infinita)
- ❌ 20251121_couple_dissolution_protocol.sql
- ❌ 2025112020_security_fix_demo_isolation.sql
- ❌ 20251123_fix_rls_simple.sql

---

## FASE 7: Commit y Push

```bash
# Verificar cambios
git status

# Agregar cambios
git add .

# Commit
git commit -m "fix: Downgrade to React 18 + Router 6 + Tailwind 3 for stability

- Downgrade React 19.2.1 → 18.3.1
- Downgrade react-router-dom 7.10.1 → 6.30.1
- Downgrade tailwindcss 4.1.17 → 3.4.18
- Remove @tailwindcss/postcss (not needed for v3)
- Remove @tsparticles/* (not used in feature/desarrollo)
- Downgrade other libraries for compatibility
- Update tsconfig.json, tailwind.config.ts, postcss.config.js
- Align with feature/desarrollo (v3.6.4) which compiles successfully

Fixes: Master branch not loading due to React 19 type incompatibilities"

# Push
git push origin master
```

---

## ⚠️ RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Mitigación |
|--------|-------------|-----------|
| Breaking changes en Router v6 | Baja | API es compatible, solo cambios internos |
| Tailwind v3 config issues | Baja | Config es más simple que v4 |
| Librerías incompatibles | Media | Usar versiones específicas de feature/desarrollo |
| RLS conflicts en Supabase | Alta | Evitar migraciones problemáticas |
| Type errors persisten | Baja | Usar skipLibCheck si es necesario |

---

## 📊 TIMELINE ESTIMADO

| Fase | Tiempo | Notas |
|------|--------|-------|
| Fase 1: Análisis | 5 min | Ya completada |
| Fase 2: Config | 10 min | Cambios simples |
| Fase 3: Código | 15 min | Buscar/reemplazar |
| Fase 4: Migración | 20 min | Instalar dependencias |
| Fase 5: Validación | 15 min | Build + tests |
| Fase 6: Supabase | 10 min | Revisar migraciones |
| Fase 7: Commit | 5 min | Push a GitHub |
| **TOTAL** | **80 min** | ~1.5 horas |

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Crear este plan (COMPLETADO)
2. ⏳ Ejecutar Fase 1-2 (Análisis + Config)
3. ⏳ Ejecutar Fase 3-4 (Código + Migración)
4. ⏳ Ejecutar Fase 5-6 (Validación + Supabase)
5. ⏳ Ejecutar Fase 7 (Commit + Push)

---

**Documento creado**: 9 Diciembre 2025
**Rama de referencia**: feature/desarrollo (v3.6.4)
**Estado**: LISTO PARA EJECUTAR
