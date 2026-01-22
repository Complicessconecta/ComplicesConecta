# TestSprite - Reporte Completo (Nombre / Ruta / Síntoma / Acción)

- **Proyecto:** ComplicesConecta
- **Fecha de ejecución:** 2026-01-22
- **Tipo:** Frontend (MCP)
- **Fuente de verdad:** `testsprite_tests/tmp/raw_report.md`
- **Servidor local:** `http://localhost:5173/`
- **Resultado:** **4/20 passed**, **16/20 failed**

---

## 1) Resumen de Hallazgos Clave

- **Bloqueo principal:** múltiples casos se detienen por **autenticación** (credenciales inválidas) o por **interactividad UI** (inputs/botones no clickeables).
- **Navegación crítica:** el CTA **"Ingresar" redirige a `/news`** en vez de `/auth`.
- **Dependencias de configuración (no secret, pero ruido):** warnings repetidos por `VITE_ONESIGNAL_APP_ID` y `VITE_POSTHOG_KEY` no configuradas.

---

## 2) Casos de Prueba

> Nota: Las rutas de los tests se reportan tal como aparecen en el `raw_report.md` (archivos `.py` generados por TestSprite dentro de `testsprite_tests/tmp/`).

### TC001 - User Registration with Valid Data ❌
- **Ruta:** `testsprite_tests/tmp/TC001_User_Registration_with_Valid_Data.py`
- **Síntoma:** formulario de registro visible pero **no permite interacción** (no se logra llenar/enviar).
- **Acción propuesta:**
  - Revisar `/auth`: overlays, `pointer-events`, z-index, contenedores con `overflow`.
  - Verificar `src/pages/Auth.tsx` y el componente de registro (si aplica `src/components/auth/RegisterForm.tsx`).

### TC002 - User Login with Correct Credentials ❌
- **Ruta:** `testsprite_tests/tmp/TC002_User_Login_with_Correct_Credentials.py`
- **Síntoma:** Supabase retorna `Invalid login credentials`.
- **Acción propuesta:**
  - Proveer credenciales QA reales (usuario existente en Supabase) o adaptar tests para modo demo.
  - Verificar que el form y el submit estén conectados correctamente.

### TC003 - User Login with Multi-Factor Authentication Enabled ❌
- **Ruta:** `testsprite_tests/tmp/TC003_User_Login_with_Multi_Factor_Authentication_Enabled.py`
- **Síntoma:** no aparece challenge MFA; el login se resetea.
- **Acción propuesta:**
  - Revisar gating MFA y control de estado en login.
  - Revisar servicios: `src/services/auth/MFAService.ts` y `src/services/auth/mfa/MFAService.ts`.

### TC004 - User Login Fails with Incorrect Password ❌
- **Ruta:** `testsprite_tests/tmp/TC004_User_Login_Fails_with_Incorrect_Password.py`
- **Síntoma:** login falla pero **no muestra mensaje de error** al usuario.
- **Acción propuesta:**
  - Mostrar error (toast/alert) cuando Supabase retorna error.
  - Asegurar que el UI no silencie el error.

### TC005 - Demo Mode Access Without Credentials ✅
- **Ruta:** `testsprite_tests/tmp/TC005_Demo_Mode_Access_Without_Credentials.py`
- **Síntoma:** N/A
- **Acción propuesta:** N/A

### TC006 - Discover Profiles and Like Functionality ❌
- **Ruta:** `testsprite_tests/tmp/TC006_Discover_Profiles_and_Like_Functionality.py`
- **Síntoma:** pantalla Discover sin perfiles ni botones de like.
- **Acción propuesta:**
  - Validar que en demo/anon exista data seed (mock) o fallback.
  - Revisar render del listado en ruta `/discover`.

### TC007 - Match Generation and Visibility in Matches Screen ❌
- **Ruta:** `testsprite_tests/tmp/TC007_Match_Generation_and_Visibility_in_Matches_Screen.py`
- **Síntoma:** likes mutuos no generan match visible; matches en 0.
- **Acción propuesta:**
  - Auditar pipeline like→match→listado matches (servicio, realtime, queries, policies).

### TC008 - Real-Time Chat Between Matched Users ❌
- **Ruta:** `testsprite_tests/tmp/TC008_Real_Time_Chat_Between_Matched_Users.py`
- **Síntoma:** CTA "Ingresar" redirige a `/news`, bloquea login y chat.
- **Acción propuesta:**
  - Corregir navegación de CTA "Ingresar" a `/auth`.

### TC009 - Private Gallery Access Denied Without Token Payment ❌
- **Ruta:** `testsprite_tests/tmp/TC009_Private_Gallery_Access_Denied_Without_Token_Payment.py`
- **Síntoma:** token-gating/prompt de pago **inconsistente**.
- **Acción propuesta:**
  - Unificar fuente de verdad del lock/unlock (DB vs state) y hacer determinística la condición de render.

### TC010 - Unlock Private Gallery Via Token Payment ❌
- **Ruta:** `testsprite_tests/tmp/TC010_Unlock_Private_Gallery_Via_Token_Payment.py`
- **Síntoma:** no inicia interfaz de pago para desbloquear.
- **Acción propuesta:**
  - Revisar handler/CTA de desbloqueo y dependencias (sesión/demo, estados, modales).

### TC011 - Token Wallet Dashboard Displays Correct Balances ❌
- **Ruta:** `testsprite_tests/tmp/TC011_Token_Wallet_Dashboard_Displays_Correct_Balances.py`
- **Síntoma:** bloqueado por login/demo; no valida dashboard.
- **Acción propuesta:**
  - Asegurar dashboard accesible en demo o proveer credenciales QA.

### TC012 - Profile Editing for Single Profile ❌
- **Ruta:** `testsprite_tests/tmp/TC012_Profile_Editing_for_Single_Profile.py`
- **Síntoma:** "Acceso Demo" visible pero no clickeable; login falla.
- **Acción propuesta:**
  - Revisar interactividad del botón demo y navegación.

### TC013 - Role-Based Access Control for Admin Routes ❌
- **Ruta:** `testsprite_tests/tmp/TC013_Role_Based_Access_Control_for_Admin_Routes.py`
- **Síntoma:** no se valida RBAC por credenciales inválidas.
- **Acción propuesta:**
  - Proveer usuario QA normal + usuario QA admin (o tests en demo).

### TC014 - Responsive Navigation Menus On Different Devices ✅
- **Ruta:** `testsprite_tests/tmp/TC014_Responsive_Navigation_Menus_On_Different_Devices.py`
- **Síntoma:** N/A
- **Acción propuesta:** N/A

### TC015 - AI Help Center Accessibility and Functionality ✅
- **Ruta:** `testsprite_tests/tmp/TC015_AI_Help_Center_Accessibility_and_Functionality.py`
- **Síntoma:** N/A
- **Acción propuesta:** N/A

### TC016 - Marketplace and NFTs Screens Load Correctly ✅
- **Ruta:** `testsprite_tests/tmp/TC016_Marketplace_and_NFTs_Screens_Load_Correctly.py`
- **Síntoma:** N/A
- **Acción propuesta:** N/A

### TC017 - Parental Controls Enforce Access Restrictions on Private Galleries ❌
- **Ruta:** `testsprite_tests/tmp/TC017_Parental_Controls_Enforce_Access_Restrictions_on_Private_Galleries.py`
- **Síntoma:** credenciales inválidas, no se valida parental controls.
- **Acción propuesta:**
  - Proveer credenciales QA para usuario con parental controls, o habilitar flujo demo.

### TC018 - Loading Legal and Compliance Pages Correctly ❌
- **Ruta:** `testsprite_tests/tmp/TC018_Loading_Legal_and_Compliance_Pages_Correctly.py`
- **Síntoma:** botón "Más" no navega a Privacy/Legal hub.
- **Acción propuesta:**
  - Revisar menú "Más" (dropdown/route) y rutas legales.

### TC019 - Secure Routing Prevents Unauthorized Access ❌
- **Ruta:** `testsprite_tests/tmp/TC019_Secure_Routing_Prevents_Unauthorized_Access.py`
- **Síntoma:** bloqueado por CTA "Ingresar" (news) y el test visita `/protected-route` (404).
- **Acción propuesta:**
  - Corregir CTA.
  - Ajustar test para una ruta protegida real existente.

### TC020 - Automated Tests Coverage Verification ❌
- **Ruta:** `testsprite_tests/tmp/TC020_Automated_Tests_Coverage_Verification.py`
- **Síntoma:** intenta navegar a rutas tipo `/src/tests/unit` (404). No hay UI para ver/ejecutar tests.
- **Acción propuesta:**
  - Documentar comandos de test en docs.
  - (Opcional) una pantalla QA solo DEV.

---

## 3) Dependencias de Configuración (observado en consola)
- **OneSignal:** warnings por `VITE_ONESIGNAL_APP_ID` no configurada.
- **PostHog:** warnings por `VITE_POSTHOG_KEY` no configurada.

---

## 4) Siguiente Acción Recomendada
- Corregir **CTA Ingresar → /auth** y **interactividad** de `/auth` (inputs / demo button).
- Definir **usuarios QA** (normal/admin/parental) para que los tests no mueran por credenciales.
