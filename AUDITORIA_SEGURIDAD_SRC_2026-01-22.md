# Auditoría de Seguridad (Estática) - src/

- **Proyecto:** ComplicesConecta
- **Fecha:** 2026-01-22
- **Scope:** `src/` (auditoría estática por búsqueda/inspección de patrones)

> Importante: esta auditoría **no garantiza** ausencia total de bugs/exploits; para ello se requiere también
> pruebas dinámicas (pentest), revisión de backend/RLS y pruebas de runtime.

---

## 1) Hallazgos (Nombre / Ruta / Síntoma / Acción)

### H001 - HTML dinámico sin sanitización (XSS potencial) [ALTO]
- **Ruta:** `src/hooks/useScreenshotProtection.ts`
- **Síntoma:** usa `warningDiv.innerHTML = \`...${method}...\``.
  - Aunque `method` se arma desde constantes internas, el patrón `innerHTML` es un vector XSS si en el futuro se concatena contenido externo.
- **Acción a aplicar:**
  - Reemplazar por creación de nodos DOM (`document.createElement`) + `textContent` (sin HTML).
  - Alternativa: si se requiere HTML, sanitizar estrictamente y **no** interpolar valores externos.

### H002 - Uso de `dangerouslySetInnerHTML` para inyectar CSS [MEDIO]
- **Ruta:** `src/components/ui/charts/chart.tsx`
- **Síntoma:** `dangerouslySetInnerHTML` inyecta un bloque `<style>` con variables CSS.
  - No parece usar input de usuario directamente; `colorConfig` viene de `config` del componente.
  - Aun así, `dangerouslySetInnerHTML` eleva el riesgo si `config` llega a alimentarse por contenido no confiable.
- **Acción a aplicar:**
  - Asegurar que `ChartConfig` solo se construya desde constantes internas.
  - (Mejor) generar CSS via atributos/estilos controlados en React sin `dangerouslySetInnerHTML`.

### H003 - URLs externas y carga de scripts remotos (riesgo supply-chain / CSP) [MEDIO]
- **Rutas:**
  - `src/services/social/notifications/OneSignalService.ts` (carga `https://cdn.onesignal.com/...`)
  - `src/config/posthog.config.ts` (carga `https://app.posthog.com/static/array.js`)
- **Síntoma:** carga de scripts de terceros en runtime.
- **Acción a aplicar:**
  - Asegurar que exista una **CSP** estricta y lista de dominios permitidos.
  - Cargar scripts solo si hay consentimiento y solo en PROD (si aplica).
  - Verificar integridad/uso (OneSignal/PostHog están opcionales, pero generan warnings si no config).

### H004 - Uso de LocalStorage para datos demo (riesgo de exposición local) [BAJO/MEDIO]
- **Ruta:** `src/services/payments/NFTService.ts`
- **Síntoma:** `window.localStorage.getItem(getDemoNFTStorageKey(uid))` para NFTs demo.
- **Acción a aplicar:**
  - Asegurar que el contenido guardado sea estrictamente demo (no PII real).
  - Si se guarda algo sensible, cifrar o migrar a almacenamiento seguro.

---

## 2) Observaciones relevantes (no necesariamente vulnerabilidad)

- **OWASP checklist:** existe `src/security/owasp-checklist.ts` con checklists; es útil como guía.
- **Credenciales/secrets hardcodeados:** en las búsquedas rápidas no apareció `sk_live_`/`sk_test_` en `src/`.
  - `PINATA` aparece principalmente por uso de `VITE_PINATA_PROXY_URL` (correcto) y constantes públicas (`PINATA_API_URL`).

---

## 3) Recomendaciones de Hardening

- **Eliminar/evitar `innerHTML`** (H001) y preferir `textContent`.
- **Minimizar `dangerouslySetInnerHTML`** (H002) y restringir `ChartConfig` a valores internos.
- **CSP + consent + feature flags** para scripts externos (H003).
- **Revisar flujos de almacenamiento** (localStorage) para asegurar no persistir PII/token secrets (H004).

---

## 4) Próximos pasos de verificación

- Ejecutar SAST (Snyk Code u otro) y SCA (`npm audit`) en CI.
- Revisar RLS/Edge Functions para endpoints sensibles.
- Re-ejecutar TestSprite después de corregir autenticación/interactividad.
