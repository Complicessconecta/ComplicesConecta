# Auditoría de Comentarios — `ProfileSingle.tsx`

Archivo auditado:
- `src/pages/profiles/single/ProfileSingle.tsx`
- Longitud aproximada: ~1629 líneas

## Criterios
Para cada comentario (`//` o `{/* ... */}`) se valida:
- Si **describe correctamente** el comportamiento del bloque inmediato.
- Si es **redundante** (el código ya es autoexplicativo y el comentario no aporta).
- Si está **desactualizado** o si el flujo **no existe/no se ejecuta**.
- Si hay **incoherencias de flujo** (p. ej. el comentario promete algo pero el handler no hace nada).

Leyenda:
- **Cumple✅**: comentario coincide con el comportamiento.
- **Incompleto⚠️**: indica intención pero la función/flujo no está implementado o queda a medias.
- **No cumple❌**: contradice el código o promete algo que no ocurre.
- **Redundante🟡**: no aporta valor (no es error).

---

## Hallazgos por comentario (en orden de aparición)

### L58-L63 — `// Funcin helper para verificar autenticacin`
- **Evaluación:** Cumple✅
- **Por qué:** `checkAuth()` normaliza `isAuthenticated` que puede ser función o booleano.

### L88-L90 — `// Sin biometría ni PIN configurados...`
- **Evaluación:** Cumple✅
- **Por qué:** `requireSecureAccess()` devuelve `true` si no hay biometría ni PIN; el comentario lo explica y advierte producción.

### L108-L112 — `// Demo: controlar desbloqueo visual...`
- **Evaluación:** Cumple✅
- **Por qué:** `demoPrivateUnlocked` se usa en `isGalleryUnlocked` y se setea desde clicks/control parental.

### L115-L119 — `// Estado para control parental: no auto-bloquear...`
- **Evaluación:** Cumple✅
- **Por qué:** se inicializa desde `localStorage` y por default `false`.

### L121-L128 — `// Estados para modal de carrusel avanzado`
- **Evaluación:** Cumple✅
- **Por qué:** `showImageModal`, `selectedImageIndex`, likes, etc. gobiernan `ImageModal`.

### L142-L150 — `// Estados para funcionalidades blockchain`
- **Evaluación:** Cumple✅
- **Por qué:** `tokenBalances`, `testnetInfo`, `userNFTs`, `isClaimingTokens` se usan en secciones blockchain.

### L151-L152 — `// Determinar si es el perfil propio`
- **Evaluación:** Cumple✅
- **Por qué:** `isOwnProfile` depende de auth y compara `user?.id === profile?.id`.

### L154-L162 — `// 🎨 Aplicar tema distintivo para perfil demo`
- **Evaluación:** Cumple✅
- **Por qué:** `isDemoProfile` se calcula por flags/id y se pasa `demoTheme` a `useProfileTheme`.

### L164-L172 — `// Datos de imágenes privadas para el carrusel`
- **Evaluación:** Cumple✅
- **Por qué:** define tipo y se construye `privateImages` + `galleryImages`.

### L193-L195 — `// Evitar que la galería privada repita exactamente el avatar principal`
- **Evaluación:** Cumple✅
- **Por qué:** filtra imágenes privadas comparando `src !== profile?.avatar_url`.

### L218-L221 — `// Flags internos para bloquear secciones...`
- **Evaluación:** Cumple✅
- **Por qué:** `SHOW_ONLINE_BADGE` y `SHOW_BIO_SECTION` apagan secciones opcionales.

### L222-L248 — `// Funciones para el modal del carrusel`
- **Evaluación:** Cumple✅
- **Por qué:** `handleImageLike`, `navigateCarousel`, `handleAddComment` son callbacks del `ImageModal`.

### L250 — `// Handlers para las acciones del perfil`
- **Evaluación:** Redundante🟡
- **Por qué:** no es incorrecto, pero el nombre de las funciones ya deja claro el propósito.

### L253-L258 — `// Demo: Simular subida de imagen a galería (NO es crear post)`
- **Evaluación:** Cumple✅
- **Por qué:** no sube imagen; solo muestra toast/log.

### L264-L275 — `// Demo: Modal de confirmación` + `// TODO: En producción...`
- **Evaluación:** Cumple✅ / Incompleto⚠️
- **Por qué:** en demo usa `window.confirm`. El TODO es real: no hay implementación de borrado real.

### L280 — `// Implementar lógica de comentario`
- **Evaluación:** Incompleto⚠️
- **Por qué:** `handleCommentPost` solo loggea y no implementa comentarios.

### L283 — `// Funciones para cargar datos adicionales`
- **Evaluación:** Redundante🟡

### L286 — `// Estadísticas fijas DEMO`
- **Evaluación:** Cumple✅

### L311-L317 — `// Fallback para navegadores que no soportan Web Share API`
- **Evaluación:** Cumple✅

### L320-L324 — `// Track en PostHog`
- **Evaluación:** Cumple✅

### L339-L365 — `// DEMO: Por seguridad, mostrar modal en lugar de descargar JSON plano`
- **Evaluación:** No cumple❌
- **Por qué:** NO se muestra un modal; se genera `modalContent` pero solo se hace `toast(...)` (mensaje genérico) y `logger.info` con `{ modalContent }`.
- **Riesgo/nota:** `logger.info` con `modalContent` incluye datos (aunque parcialmente anonimizados). Para Ley Olimpia/compliance, esto debería evitarse o censurarse más.

### L367 — `// Funciones para blockchain`
- **Evaluación:** Cumple✅

### L378-L395 — `// En DEMO no consultamos provider ni claims...`
- **Evaluación:** Cumple✅
- **Por qué:** en demo solo trae NFTs, setea balances/testnet mock y retorna.

### L398-L415 — `// Producción: obtener address real antes de consultar balances`
- **Evaluación:** Cumple✅

### L418-L431 — `// Fallback demo sin user.id...`
- **Evaluación:** Cumple✅

### L446-L460 — `// Modo demo - simular reclamo` y `// Actualizar estado local...`
- **Evaluación:** Cumple✅

### L461-L467 — `// Modo real - reclamar tokens reales` y `// Recargar información`
- **Evaluación:** Cumple✅

### L484-L500 — `// Modo demo - simular reclamo diario` y `// Actualizar estado local...`
- **Evaluación:** Cumple✅

### L502-L508 — `// Modo real - reclamar tokens diarios` y `// Recargar información`
- **Evaluación:** Cumple✅

### L518 — `// Migracin localStorage ? usePersistedState`
- **Evaluación:** Incompleto⚠️
- **Por qué:** el comentario sugiere una migración pendiente/decisión. No hay implementación clara de migración aquí; solo `useEffect` normal.

### L558 — `// profile es no nulo a partir de aquí`
- **Evaluación:** Cumple✅

### L567-L573 — `// Valores de display seguros...`
- **Evaluación:** Cumple✅

---

## Comentarios JSX (UI) — principales

### L609-L616 — `{/* Imagen de perfil */}`
- **Evaluación:** Cumple✅

### L625 — `{/* Informacoin basica */}`
- **Evaluación:** Cumple✅

### L670-L675 — `{/* Biografa */}`
- **Evaluación:** Cumple✅ (pero sección deshabilitada)
- **Nota:** `SHOW_BIO_SECTION` está en `false` → este bloque no se renderiza (intencional).

### L677 — `{/* Botones de accion */}`
- **Evaluación:** Cumple✅

### L729-L764 — `{/* Botón de usuario/sesión con Logout real */}`
- **Evaluación:** Parcial⚠️
- **Por qué:** el flujo de logout sí existe, pero el item `DropdownMenuItem` en L743-L747 está vacío (no muestra texto/acción visible), lo que afecta coherencia UX.

### L766-L778 — `{/* Botón para solicitar acceso a fotos privadas */}`
- **Evaluación:** Cumple✅
- **Por qué:** muestra CTA solo cuando `privateImageAccess === "none"` y abre el flujo con seguridad (`handleViewPrivatePhotos`).

### L780-L792 — `{/* Estado de solicitud pendiente */}`
- **Evaluación:** Cumple✅

### L794-L806 — `{/* Acceso aprobado */}`
- **Evaluación:** No cumple❌
- **Por qué:** el botón se renderiza, pero el `onClick` tiene un bloque vacío con comentario `/* Mostrar galera privada */` y no ejecuta nada.

### L813 — `{/* Estadísticas mejoradas */}`
- **Evaluación:** Cumple✅

### L883 — `{/* Sección Blockchain - Perfil propio o demo */}`
- **Evaluación:** Cumple✅

### L898 — `{/* Información de Wallet */}`
- **Evaluación:** Cumple✅

### L930 — `{/* Botones de Acción Blockchain */}`
- **Evaluación:** Cumple✅

### L954 — `{/* Reclamar Tokens Gratuitos */}`
- **Evaluación:** Cumple✅

### L968 — `{/* Reclamar Tokens Diarios */}`
- **Evaluación:** Cumple✅

### L982 — `{/* Mintear NFT */}`
- **Evaluación:** Cumple✅

### L1043 — `{/* Información de Testnet */}`
- **Evaluación:** Cumple✅

### L1073 — `{/* Lista de NFTs */}`
- **Evaluación:** Cumple✅

### L1175 — `{/* Resumen rápido de Wallet & NFTs */}`
- **Evaluación:** Cumple✅

### L1209 — `{/* Token Dashboard se gestiona sólo en la página /tokens... */}`
- **Evaluación:** Cumple✅

### L1211 — `{/* Contenido del resumen - ProfileContent existente */}`
- **Evaluación:** Cumple✅

### L1219 — `{/* Intereses - grid demo con efecto hover */}`
- **Evaluación:** Cumple✅

### L1275 — `{/* Experiencias demo: eventos, registro rápido y verificación KYC */}`
- **Evaluación:** Cumple✅

### L1303 — `{/* TODO: Inyectar aquí el contenido actual de VipBookingModal... */}`
- **Evaluación:** Incompleto⚠️
- **Por qué:** el comentario expresa una integración pendiente.

### L1333 — `{/* Galera */}`
- **Evaluación:** Cumple✅

### L1342 — `{/* Mostrar mensaje de acceso denegado si corresponde */}`
- **Evaluación:** Cumple✅

### L1355 — `{/* Galera pblica siempre visible */}`
- **Evaluación:** Cumple✅

### L1380 — `{/* Galería privada mejorada con carrusel */}`
- **Evaluación:** Cumple✅

### L1389-L1401 — comentarios inline sobre BLOQUEAR/DESBLOQUEAR/PIN
- **Evaluación:** Cumple✅
- **Por qué:** el botón bloquea sin PIN, y el desbloqueo queda delegado al modal/control parental.

### L1428 — `{/* SECCIÓN GALERÍA PRIVADA CORREGIDA */}`
- **Evaluación:** Cumple✅

### L1521 — `{/* Mostrar fotos normales si es dueño (para demo) */}`
- **Evaluación:** Parcial⚠️
- **Por qué:** se muestra solo para `isOwnProfile`, no para `isDemoProfile`. El texto “para demo” puede confundir si el dueño no es demo.

### L1565-L1578 — `{/* Modal de solicitud de acceso a fotos privadas */}`
- **Evaluación:** Cumple✅
- **Por qué:** el modal se renderiza solo si `showPrivateImageRequest` es true y en `onRequestSent` pasa el estado a `pending` y cierra el modal.

### L1580-L1598 — `{/* Control Parental */}`
- **Evaluación:** Cumple✅

### L1600-L1615 — `{/* Modal de carrusel de imágenes */}`
- **Evaluación:** Cumple✅

### L1617-L1623 — `{/* Modal de reporte */}`
- **Evaluación:** Cumple✅

---

## Resumen de issues detectados (accionables)

- **No cumple❌ (2):**
  - L339-L365: comentario dice “mostrar modal” pero solo hay toast/log.
  - L794-L806: botón “Acceso aprobado” no hace nada (handler vacío).

- **Incompleto⚠️ (4):**
  - L280: comentario de implementar comentarios pero no existe lógica.
  - L518: comentario de migración sin implementación clara.
  - L1303: TODO de inyectar contenido VIP (pendiente).
  - L729-L764: dropdown de cuenta con item vacío afecta coherencia UX.

- **Redundante🟡:** varios encabezados de sección (no es problema, solo ruido).
