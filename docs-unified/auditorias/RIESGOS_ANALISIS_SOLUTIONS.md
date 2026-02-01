# Análisis de Riesgos - CómplicesConecta

**Fecha:** 1 Feb 2026  
**Analista:** AI Senior Engineer  
**Objetivo:** Eliminar riesgos de flujos asíncronos rotos, tipado débil, estados inconsistentes, inicialización fuera de orden y errores que solo aparecen en Android/iOS.

---

## 📊 Tabla de Hallazgos

| # | Nombre | Ruta | Severidad | Síntoma | Solución |
|---|--------|------|-----------|---------|----------|
| 1 | Race Condition en Inicialización | `src/features/auth/useAuth.ts:222-298` | 🔴 Crítica | UI renderiza con `loading=false` mientras `profile` es `null` | Esperar carga completa de `loadProfile` antes de marcar `loading=false` |
| 2 | Parseo Inseguro de demoUser (7 ocurrencias) | `src/features/auth/useAuth.ts:58-89,238-260,504-513,523-524,536-539,584-589,600-604` | 🔴 Crítica | `JSON.parse()` sin validación puede causar crash con datos corruptos | Crear `safeParseDemoUser()` con validación de estructura mínima |
| 3 | Cast Inseguro en signIn | `src/features/auth/useAuth.ts:408` | 🔴 Crítica | `_setDemoUser(mockUser as unknown as Profile)` puede causar errores de tipo | Construir objeto `Profile` completo sin cast inseguro |
| 4 | Promise No Manejada | `src/integrations/supabase/client.ts:233-296` | 🔴 Crítica | `initializeSupabase()` se ejecuta como Promise no manejada | Manejar Promise con try-catch y `.catch()` |
| 5 | No Valida Datos Antes de Desencriptar | `src/lib/storage/secure-storage.ts:66-80` | 🔴 Crítica | `getItem()` no valida datos antes de desencriptar, causando crash | Validar formato y JSON antes de desencriptar |
| 6 | Dependencia Circular en useCallback | `src/features/auth/useAuth.ts:214` | 🟠 Media | `loadProfile` usa variables externas sin dependencias | Agregar `[demoUser, supabase]` a dependencias |
| 7 | Race Condition en signOut | `src/features/auth/useAuth.ts:354-355` | 🟠 Media | `window.location.href` interrumpe limpieza de datos | Esperar limpieza completa con `Promise.all()` antes de redirigir |
| 8 | Timeout Arbitrario | `src/integrations/supabase/client.ts:240` | 🟠 Media | Timeout de 5 segundos es arbitrario y no maneja todos los casos | Usar timeout configurable (10s dev, 5s prod) |
| 9 | Falta Validación de Datos de Supabase | `src/features/auth/useAuth.ts:130-207` | 🟢 Baja | No se valida estructura de datos de API | Validar campos requeridos antes de usar datos |
| 10 | No Maneja Errores en signOut | `src/features/auth/useAuth.ts:300-361` | 🟢 Baja | Error en signOut deja estado inconsistente | Forzar limpieza incluso con error |

---

## 🎯 Fases de Implementación

### Fase 1: Riesgos Críticos en useAuth.ts (Inicialización y Parseo)

**Objetivo:** Corregir race conditions y parseo inseguro que causan crashes en producción móvil.

**Archivos afectados:**
- `src/features/auth/useAuth.ts`

**Cambios:**

1. **Crear función `safeParseDemoUser()` al inicio del archivo:**
```typescript
function safeParseDemoUser<T>(data: T): Profile | null {
  if (!data) return null;
  
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    
    // Validar estructura mínima
    if (!parsed || typeof parsed !== 'object') return null;
    
    const required = ['id', 'email'];
    for (const field of required) {
      if (!(field in parsed)) return null;
    }
    
    return parsed as Profile;
  } catch (error) {
    logger.error("❌ Error parseando demoUser:", { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return null;
  }
}
```

2. **Corregir `loadProfile()` (líneas 58-89):**
   - Reemplazar parseo directo con `safeParseDemoUser(currentDemoUser)`
   - Validar que `parsedDemoUser` no sea null antes de usar

3. **Corregir `useEffect` inicial (líneas 222-298):**
   - Envolver inicialización demo en `async IIFE`
   - Esperar `loadProfile()` con `await` antes de `setLoading(false)`
   - Mismo patrón para Supabase real

4. **Corregir `signIn()` (línea 408):**
   - Construir objeto `Profile` completo sin `as unknown as Profile`

5. **Corregir todas las ocurrencias de parseo de demoUser:**
   - Líneas 238-260 (initApp)
   - Líneas 504-513 (isAuthenticated)
   - Líneas 523-524 (getProfileType)
   - Líneas 536-539 (isAdmin)
   - Líneas 584-589 (isDemo)
   - Líneas 600-604 (shouldUseProductionAdmin)

**Verificación:**
```bash
npm run build:check
npm run tsc
npm run lint
```

**No avanzar a Fase 2 hasta que:** build:check, tsc y lint pasen sin errores.

---

### Fase 2: Riesgos Críticos en Storage y Seguridad

**Objetivo:** Corregir Promise no manejada y validación de datos en storage.

**Archivos afectados:**
- `src/integrations/supabase/client.ts`
- `src/lib/storage/secure-storage.ts`

**Cambios en `client.ts`:**

1. **Corregir `initializeSupabase()` (líneas 233-296):**
   - Envolver en `try-catch` externo
   - Agregar `.catch()` al final para manejar errores no capturados
   - Manejar errores de forma segura

2. **Corregir timeout (línea 240):**
   - Usar timeout configurable: `import.meta.env.DEV ? 10000 : 5000`

**Cambios en `secure-storage.ts`:**

1. **Corregir `getItem()` (líneas 66-80):**
   - Validar que `encryptedValue` sea string y no esté vacío
   - Validar que `JSON.parse()` no falle
   - Eliminar datos corruptos automáticamente

**Verificación:**
```bash
npm run build:check
npm run tsc
npm run lint
```

**No avanzar a Fase 3 hasta que:** build:check, tsc y lint pasen sin errores.

---

### Fase 3: Riesgos Medios de Flujo Asíncrono

**Objetivo:** Corregir race conditions y dependencias circulares que causan comportamientos inesperados.

**Archivos afectados:**
- `src/features/auth/useAuth.ts`

**Cambios:**

1. **Corregir dependencias de `loadProfile` (línea 214):**
   - Cambiar `}, []);` por `}, [demoUser, supabase]);`

2. **Corregir `signOut()` (líneas 354-355):**
   - Envolver limpieza en `Promise.all()`
   - Esperar todas las promesas antes de `window.location.href = "/"`

**Verificación:**
```bash
npm run build:check
npm run tsc
npm run lint
```

**No avanzar a Fase 4 hasta que:** build:check, tsc y lint pasen sin errores.

---

### Fase 4: Riesgos Bajos de Validación

**Objetivo:** Corregir validación de datos y manejo de errores para mayor robustez.

**Archivos afectados:**
- `src/features/auth/useAuth.ts`

**Cambios:**

1. **Corregir validación de datos de Supabase (líneas 147-156):**
   - Validar campos requeridos: `id`, `first_name`, `email`
   - Retornar null si faltan campos

2. **Corregir manejo de errores en `signOut()` (líneas 356-360):**
   - Forzar limpieza con try-catch incluso si hay error
   - Redirigir siempre a "/" para evitar estado inconsistente

**Verificación:**
```bash
npm run build:check
npm run tsc
npm run lint
```

**No avanzar a Fase 5 hasta que:** build:check, tsc y lint pasen sin errores.

---

### Fase 5: Verificación Final y Testing

**Objetivo:** Verificar que todas las correcciones funcionan correctamente en producción móvil.

**Verificaciones:**

1. **Compilación:**
```bash
npm run build:check  # Debe pasar sin errores
npm run tsc          # Debe pasar sin errores
npm run lint         # Debe pasar sin errores
```

2. **Sync Android:**
```bash
npx cap sync android  # Debe pasar sin errores
```

3. **Testing Manual:**
   - Iniciar sesión demo
   - Iniciar sesión real
   - Cerrar sesión
   - Verificar que no hay crashes
   - Verificar que UI no tiene flashes
   - Verificar que profile se carga correctamente

**Commits:**
- Cada fase debe tener su propio commit
- Mensajes de commit en español MX con fecha y hora

---

## 📝 Checklist de Completación

- [ ] Fase 1 completada y verificada
- [ ] Fase 2 completada y verificada
- [ ] Fase 3 completada y verificada
- [ ] Fase 4 completada y verificada
- [ ] Fase 5 completada y verificada
- [ ] Todos los tests pasan
- [ ] Android sync exitoso
- [ ] Documentación actualizada

---

## ⚠️ Notas Importantes

1. **NO avanzar entre fases** hasta que la actual esté completamente verificada
2. **Cada fase debe pasar:** build:check, tsc, lint
3. **Usar commits separados** para cada fase
4. **Verificar en dispositivo móvil real** después de cada fase
5. **Documentar cualquier desviación** o problema encontrado

---

## 🔗 Referencias

- Archivos analizados:
  - `src/features/auth/useAuth.ts` (644 líneas)
  - `src/integrations/supabase/client.ts` (300 líneas)
  - `src/lib/storage/secure-storage.ts` (161 líneas)
  - `src/lib/storage-manager.ts` (103 líneas)
  - `src/integrations/supabase/security-helpers.ts` (332 líneas)
  - `src/services/auth/auth/SecurityService.ts` (916 líneas)

- Severidades:
  - 🔴 Crítica (5): Pueden causar crashes en producción móvil
  - 🟠 Media (3): Pueden causar comportamientos inesperados
  - 🟢 Baja (2): Mejoras de robustez y seguridad

- Total de riesgos: 10
- Total de fases: 5
- Tiempo estimado por fase: 15-30 minutos
