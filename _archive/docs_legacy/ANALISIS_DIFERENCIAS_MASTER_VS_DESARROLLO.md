# Análisis Detallado: Master vs feature/desarrollo

## 🔴 PROBLEMA PRINCIPAL: React Version Mismatch

### Master (NO CARGA)
- **React**: 19.2.1
- **React-DOM**: 19.2.1
- **@types/react**: 19.2.7
- **@types/react-dom**: 19.2.3

### feature/desarrollo (FUNCIONA)
- **React**: 18.3.1
- **React-DOM**: 18.3.1
- **@types/react**: 18.3.26
- **@types/react-dom**: 18.3.7

**Impacto**: React 19 cambió la definición de `ReactNode` para incluir `Promise<ReactNode>`, lo que causa conflictos de tipos con componentes que retornan `FC<Props>`.

---

## 📊 DIFERENCIAS CRÍTICAS POR CATEGORÍA

### 1. **Dependencias de Build** (CRÍTICO)
```
Master                          feature/desarrollo
─────────────────────────────────────────────────
@vitejs/plugin-react 5.1.2      4.7.0
vite 7.2.7                      7.1.12
tailwindcss 4.1.17              3.4.18
@tailwindcss/postcss 4.1.17     (no tiene)
```

**Problema**: Master usa Tailwind v4 con PostCSS plugin separado, feature/desarrollo usa v3.

### 2. **Librerías de UI** (CRÍTICO)
```
Master                          feature/desarrollo
─────────────────────────────────────────────────
framer-motion 12.23.25          11.18.2
lucide-react 0.556.0            0.451.0
recharts 3.5.1                  3.3.0
```

### 3. **Librerías de Routing** (CRÍTICO)
```
Master                          feature/desarrollo
─────────────────────────────────────────────────
react-router-dom 7.10.1         6.30.1
```

**Problema**: Router v7 tiene cambios API incompatibles con v6.

### 4. **Librerías Removidas en feature/desarrollo**
```
- @tsparticles/engine 3.9.1
- @tsparticles/react 3.0.0
- @tsparticles/slim 3.9.1
- react-markdown 10.1.0
- rehype-raw 7.0.0
- remark-gfm 4.0.1
- ai 5.0.108
- capacitor-secure-storage-plugin 0.12.0
```

### 5. **Librerías Downgraded**
```
Master → feature/desarrollo
─────────────────────────────
@supabase/supabase-js 2.87.1 → 2.81.0
@tanstack/react-query 5.90.12 → 5.90.7
@worldcoin/idkit 2.4.2 → 1.5.0
ethers 6.16.0 → 5.8.0
neo4j-driver 6.0.1 → 5.28.2
stripe 20.0.0 → 19.3.1
```

### 6. **Cambios en TypeScript**
```
Master                          feature/desarrollo
─────────────────────────────────────────────────
@types/uuid 11.0.0              10.0.0
@types/node 24.10.2             24.10.0
```

---

## 📁 CAMBIOS EN ARCHIVOS CRÍTICOS

### App.tsx (Errores de Tipos)
- **Master**: Errores de JSX con React 19 types
- **feature/desarrollo**: Sin errores (React 18 compatible)

### tsconfig.json
```
Master: Incluye "vite/client" en types
feature/desarrollo: Sin "vite/client" (Vite 7+ proporciona tipos automáticamente)
```

### tailwind.config.ts
```
Master: Usa @tailwindcss/postcss v4
feature/desarrollo: Usa tailwindcss v3 (config tradicional)
```

### postcss.config.js
```
Master: Configurado para @tailwindcss/postcss
feature/desarrollo: Configurado para tailwindcss v3
```

---

## 🗄️ CAMBIOS EN MIGRACIONES SUPABASE

### Migraciones Removidas en feature/desarrollo
```
- 20251121_couple_dissolution_protocol.sql (476 líneas)
- 2025112020_security_fix_demo_isolation.sql (166 líneas)
- 20251123_fix_rls_simple.sql (32 líneas)
- 20251207_add_missing_columns.sql (93 líneas)
- 20251207_fix_migrations.sql (57 líneas)
- Y 10+ más...
```

**Impacto**: Master tiene migraciones más recientes pero pueden tener conflictos RLS.

### Tipos Supabase
```
Master: supabase-generated.ts (7538 líneas)
feature/desarrollo: supabase-generated.ts (más pequeño)
```

---

## 🔧 ESTRATEGIA DE MIGRACIÓN

### Opción 1: Downgrade Master a React 18 (RECOMENDADO)
```bash
# En master:
npm install react@18.3.1 react-dom@18.3.1
npm install --save-dev @types/react@18.3.26 @types/react-dom@18.3.7
npm install --save-dev tailwindcss@3.4.18
npm uninstall @tailwindcss/postcss
npm install --save-dev @vitejs/plugin-react@4.7.0
npm install react-router-dom@6.30.1
```

### Opción 2: Upgrade feature/desarrollo a React 19 (RIESGOSO)
- Requiere reescribir componentes para React 19
- Cambios en Router v7
- Cambios en Tailwind v4
- Mayor riesgo de breaking changes

### Opción 3: Merge Selectivo (RECOMENDADO)
1. Mantener feature/desarrollo como base
2. Cherry-pick migraciones útiles de master
3. Actualizar tipos Supabase gradualmente

---

## ✅ CHECKLIST DE MIGRACIÓN

### Paso 1: Preparar Master
- [ ] Downgrade React a 18.3.1
- [ ] Downgrade @types/react-dom a 18.3.7
- [ ] Downgrade tailwindcss a 3.4.18
- [ ] Downgrade react-router-dom a 6.30.1
- [ ] Remover @tailwindcss/postcss
- [ ] Remover @tsparticles/* (no usadas en feature/desarrollo)

### Paso 2: Validar Build
- [ ] npm run build (sin errores)
- [ ] npm run dev (sin errores)
- [ ] TypeScript type-check (0 errores)

### Paso 3: Migraciones Supabase
- [ ] Revisar migraciones de master vs feature/desarrollo
- [ ] Aplicar solo migraciones críticas
- [ ] Evitar RLS conflicts

### Paso 4: Testing
- [ ] Verificar que app carga en navegador
- [ ] Verificar funcionalidad crítica
- [ ] Verificar no hay breaking changes

---

## 📊 RESUMEN DE CAMBIOS

| Categoría | Master | feature/desarrollo | Diferencia |
|-----------|--------|-------------------|-----------|
| React | 19.2.1 | 18.3.1 | ❌ Incompatible |
| Router | 7.10.1 | 6.30.1 | ❌ API diferente |
| Tailwind | 4.1.17 | 3.4.18 | ❌ Config diferente |
| Vite | 7.2.7 | 7.1.12 | ✅ Compatible |
| Archivos | 904 cambios | - | ⚠️ Muchos cambios |
| Migraciones | 20+ nuevas | Menos | ⚠️ Revisar RLS |

---

## 🎯 RECOMENDACIÓN FINAL

**Usar feature/desarrollo como base** porque:
1. ✅ Compila sin errores
2. ✅ Carga en navegador
3. ✅ Tests E2E funcionan
4. ✅ React 18 es más estable que 19
5. ✅ Router v6 es más maduro que v7

**Luego migrar selectivamente** cambios útiles de master:
- Migraciones Supabase críticas
- Tipos actualizados
- Features nuevas (sin breaking changes)

---

**Fecha**: 9 Diciembre 2025
**Rama Actual**: feature/desarrollo (v3.6.4)
**Estado**: FUNCIONAL ✅
