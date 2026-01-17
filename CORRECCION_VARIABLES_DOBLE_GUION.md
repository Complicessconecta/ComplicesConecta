# Corrección de Variables con Doble Guion Bajo (__)

Este documento contiene las soluciones para corregir las variables con doble guion bajo (`__`) que están deshabilitadas temporalmente en el proyecto.

---

## Archivo: `pages\admin\AdminProduction.tsx` ✅ CORREGIDO

**Ruta:** `c:\Users\conej\Documents\conecta-social-comunidad-main\src\pages\admin\AdminProduction.tsx`

**Variables encontradas:**
- `__dataLoading` (línea 144) ✅ Corregido a `dataLoading`
- `__selectedProfile` (línea 145) ✅ Corregido a `selectedProfile`
- `__auditReport` (línea 153) ✅ Corregido a `auditReport`
- `__notifications` (línea 154) ✅ Corregido a `notifications`
- `__systemAlerts` (línea 157) ✅ Corregido a `systemAlerts`
- `__dateFilter` (línea 158) ✅ Corregido a `dateFilter`
- `__typeFilter` (línea 159) ✅ Corregido a `typeFilter`
- `__userFilter` (línea 160) ✅ Corregido a `userFilter`
- `__searchTerm` (línea 161) ✅ Corregido a `searchTerm`
- `__realTimeStats` (línea 162) ✅ Corregido a `realTimeStats`

**Solución aplicada:**
```tsx
// ANTES:
const [__dataLoading, setDataLoading] = useState(true);
const [__selectedProfile, _setSelectedProfile] = useState<Profile | null>(null);
const [__auditReport, _setAuditReport] = useState<any>(null);
const [__notifications, _setNotifications] = useState<NotificationStats[]>([]);
const [__systemAlerts, _setSystemAlerts] = useState<SystemAlert[]>([]);
const [__dateFilter, _setDateFilter] = useState("today");
const [__typeFilter, _setTypeFilter] = useState("all");
const [__userFilter, _setUserFilter] = useState("");
const [__searchTerm, _setSearchTerm] = useState("");
const [__realTimeStats, _setRealTimeStats] = useState(true);

// DESPUÉS:
const [dataLoading, setDataLoading] = useState(true);
const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
const [auditReport, setAuditReport] = useState<any>(null);
const [notifications, setNotifications] = useState<NotificationStats[]>([]);
const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
const [dateFilter, setDateFilter] = useState("today");
const [typeFilter, setTypeFilter] = useState("all");
const [userFilter, setUserFilter] = useState("");
const [searchTerm, setSearchTerm] = useState("");
const [realTimeStats, setRealTimeStats] = useState(true);
```

**Estado:** ✅ COMPLETADO - 17 de Enero, 2026

---

## Archivo: `src\pages\Auth.tsx` ✅ CORREGIDO

**Ruta:** `c:\Users\conej\Documents\conecta-social-comunidad-main\src\pages\Auth.tsx`

**Variables encontradas (ya corregidas):**
- `showResetPassword` ✅
- `resetEmail` ✅
- `autoLocationRequested` ✅
- `showThemeModal` ✅
- `showTermsModal` ✅

**Solución aplicada:**
- Se quitaron los dobles guiones bajos
- Se agregó funcionalidad completa para cada variable
- Se crearon modales interactivos para `showResetPassword`, `showThemeModal`, y `showTermsModal`
- Se agregó botón de geolocalización para `autoLocationRequested`

**Estado:** ✅ COMPLETADO - 17 de Enero, 2026

---

## Archivos con "__" que NO deben modificarse

Los siguientes archivos contienen variables con "__" que son parte del sistema y NO deben modificarse:

### Variables Globales de Window (Browser API)
- `utils\captureConsoleErrors.ts` - `__originalFetch` (variable global de window)
- `utils\androidSecurity.ts` - `__REACT_DEVTOOLS_GLOBAL_HOOK__`, `__VUE_DEVTOOLS_GLOBAL_HOOK__`
- `lib\security\androidSecurity.ts` - `__REACT_DEVTOOLS_GLOBAL_HOOK__`, `__VUE_DEVTOOLS_GLOBAL_HOOK__`
- `main.tsx` - `__LOADING_DEBUG__`
- `components\ui\ThemeProvider.tsx` - `__LOADING_DEBUG__`
- `components\ui\sidebar.tsx` - `__LOADING_DEBUG__`
- `features\auth\useAuth.ts` - `__demoLoggedOnce` (flag de sesión demo)

### Tipos de TypeScript (Supabase)
- `types\supabase.ts` - `__InternalSupabase`
- `types\supabase-updated.ts` - `__InternalSupabase`
- `types\supabase-remote.ts` - `__InternalSupabase`
- `types\supabase-local.ts` - `__InternalSupabase`
- `types\supabase-generated.ts` - `__InternalSupabase`
- `types\supabase-final.ts` - `__InternalSupabase`
- `integrations\supabase\types.ts` - `__InternalSupabase`

### Tipos de TypeScript (React)
- `types\react.types.ts` - `__REACT_POLYFILL__`, `__LOADING_DEBUG__`

### Tests
- `tests\unit\androidSecurity.test.ts` - `__REACT_DEVTOOLS_GLOBAL_HOOK__`, `__VUE_DEVTOOLS_GLOBAL_HOOK__` (mocks para tests)

### Variables Comentadas
- `hooks\usePersistedState.ts` - `__e` (variable comentada en código no usado)
- `pages\admin\AdminProduction.tsx` - `__appMetrics` (comentario en código)

---

## Patrones Comunes de Variables con Doble Guion Bajo

**Por qué se usan dobles guiones bajos:**
- Indican variables deshabilitadas temporalmente
- Suelen ser features en desarrollo o refactorización
- Pueden causar warnings de TypeScript/ESLint

**Cómo corregir:**
1. Quitar el doble guion bajo del nombre de la variable
2. Quitar el guion bajo del setter (si aplica)
3. Actualizar todos los usos de la variable en el componente
4. Agregar funcionalidad si la variable no se está usando

**Ejemplo:**
```tsx
// ANTES (variable deshabilitada):
const [__showModal, _setShowModal] = useState(false);

// DESPUÉS (variable activa):
const [showModal, setShowModal] = useState(false);

// USO:
<button onClick={() => setShowModal(true)}>Abrir Modal</button>
{showModal && <Modal onClose={() => setShowModal(false)} />}
```

---

## Notas Importantes

- **NO eliminar variables** - El usuario solicitó mantenerlas y agregar funcionalidad
- **Usar variables existentes** en lugar de crear nuevas
- **Mantener consistencia** con el estilo del proyecto
- **Verificar imports** al cambiar nombres de variables
- **Actualizar tests** si existen para las variables renombradas
- **NO modificar variables globales de window** como `__REACT_DEVTOOLS_GLOBAL_HOOK__`
- **NO modificar tipos de TypeScript** como `__InternalSupabase`

---

## Estado de Corrección

- ✅ `src\pages\Auth.tsx` - Completado (17 Ene 2026)
- ✅ `pages\admin\AdminProduction.tsx` - Completado (17 Ene 2026)
- ⏸️ Archivos con variables globales de window - NO deben modificarse
- ⏸️ Archivos con tipos de TypeScript - NO deben modificarse
- ⏸️ Tests - NO deben modificarse

---

## Resumen

**Archivos corregidos:** 2
**Archivos que no requieren corrección:** 17 (variables globales de window, tipos de TypeScript, tests)

**Variables corregidas:** 15
- Auth.tsx: 5 variables
- AdminProduction.tsx: 10 variables

---

**Última actualización:** 17 de Enero, 2026
