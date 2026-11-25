# Flujo: amistad, privacidad y perfiles (público / privado)

> Documento de trabajo del flujo social de ComplicesConecta (ronda de
> corrección post-test PR #72, 2026-11-24). Wacko lo pule en local.
> No contiene registros de conversación.

## 1. Resumen

Seis piezas que trabajan juntas:

| #   | Pieza                  | Qué hace                                                                                                       |
| --- | ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| 1   | País en registro       | El registro recoge el país de origen; el perfil muestra nombre del país + bandera.                             |
| 2   | Solicitud de amistad   | Enviar / aceptar / rechazar amistad desde la búsqueda o el perfil.                                             |
| 3   | Geolocalización        | Distancia **aproximada** en km (mín. 1 km, nunca la exacta), con opción de desactivarla.                       |
| 4   | Público / privado      | El perfil privado solo lo ven el dueño y sus amigos; los demás piden acceso.                                   |
| 5   | Reportar / bloquear    | Motivos desglosados; el bloqueo es como Twitter; todo reporte va a revisión de un administrador.               |
| 6   | Retención de identidad | Tras una baja por reporte, correo + usuario (ID) quedan guardados para impedir el re-registro con otro nombre. |

Código: `src/lib/countries.ts`, `src/lib/friends.ts`,
`src/lib/geolocation.ts`, `src/lib/profileVisibility.ts`,
`src/lib/reportBlock.ts`, `src/demo/socialDemoData.ts`.
Componentes: `src/components/profiles/shared/` (`NationalityBadge`,
`DistanceBadge`, `FriendsSection`, `FriendRequestButton`,
`PhotoAccessRequestButton`, `ReportBlockButtons`, `PrivateProfileGate`,
`ProfileSocialSettings`).
Migración: `supabase/migrations/20261124050000_social_friends_privacy.sql`
(**sin aplicar en producción todavía**).

## 2. País en registro → nacionalidad en el perfil

1. Registro single (`SingleRegistrationForm`) y pareja
   (`CoupleRegistrationForm`), paso 1: desplegable **País de origen**
   (México por defecto). Lista en `src/lib/countries.ts` (código ISO +
   nombre en español + bandera derivada del código).
2. Al crear la cuenta:
   - Pareja: se guarda `couple_profiles.country` (texto, columna que ya
     existía) y se intenta `country_code` (columna nueva; si la migración
     aún no está aplicada, el intento falla en silencio y el país queda en
     local).
   - Single: `profiles` no tiene columna de país hasta la migración, así
     que el país se guarda en local (`profile_country:<userId>`) y se
     intenta `country_code` en BD sin romper el registro.
3. El perfil muestra la insignia `NationalityBadge`: `🇲🇽 México` junto al
   signo zodiacal. Fuente, en orden: columna `country_code` → local del
   registro → datos sociales demo (por nombre).

## 3. Solicitud de amistad

Estados: `none` → `pending_sent` (enviada) → `friends` (aceptada) o
`none` (rechazada). Si el otro la envía primero, se ve
`pending_received` con **Aceptar / Rechazar**.

- **Dónde se envía:** desde el perfil ajeno (botón
  `FriendRequestButton` en `ProfileSingle` / `ProfileCouple`) y desde
  la búsqueda (mismo botón; ver §9, cableado pendiente).
- **Dónde se responde:** en el mismo botón cuando hay una solicitud
  entrante. (No hay bandeja propia de solicitudes de amistad: las
  solicitudes de conexión existentes viven en `/requests` con la tabla
  `invitations`; la amistad usa su propia tabla para no mezclar estados.)
- **Datos:** tabla `friend_requests` (`kind = 'friendship'`,
  `status pending/accepted/declined`). Al aceptar se crea la fila en
  `friendships` (par ordenado `user_id_a < user_id_b`, sin duplicados).
- **Demo:** `socialDemoData` trae amistades semilla por nombre (Sofía ↔
  Ana, Carlos, Carmen & Roberto, Lucía; etc.). Las solicitudes que se
  envían/aceptan en la sesión viven en localStorage
  (`friend_requests_demo`, `friendships_demo`).

## 4. Sección de amistades en el perfil

`FriendsSection`, debajo de la sección de Privacidad:

- Lista de amigos con estado: **🟢 En línea** si está activo ahora, o
  **Última conexión hace 5 min / 2 h / 3 días / 2 meses** (nunca la hora
  exacta). Formato en `formatLastSeen` (`src/lib/friends.ts`).
- En el perfil propio cada amigo tiene **Eliminar de amigos**. Si el
  perfil eliminado es privado, el eliminado tendrá que enviar de nuevo
  la solicitud para verlo (el gating del §6 vuelve a aplicar).
- En real la lista se lee de `friendships` + `profiles`
  (`listFriendsFromSupabase`); en demo, de `socialDemoData` + pares
  locales.

## 5. Geolocalización para matching

- La distancia que se ve es **aproximada**: por debajo de 10 km se
  redondea al km entero; a partir de 10 km, al múltiplo de 5 más
  cercano. **Mínimo 1 km**: aunque dos perfiles estén a 200 m, se
  muestra `A ~1 km`. La distancia exacta solo existe dentro del cálculo
  (Haversine) y nunca se muestra (`src/lib/geolocation.ts`).
- **Dónde se ve:** insignia `DistanceBadge` bajo cada tarjeta de
  Discover (demo y real). Discover ya calculaba `distance` por perfil;
  ahora se muestra aproximada.
- **Opción de privacidad:** en el perfil propio,
  `ProfileSocialSettings` trae el interruptor **Geolocalización para
  matching**. Apagado: la distancia de ese perfil no se muestra a
  nadie (ni en Discover ni en el perfil). Se guarda en
  `location_sharing_enabled` (migración) con respaldo local
  (`geo_sharing:<userId>`).

## 6. Perfiles públicos vs privados

- **Público** (por defecto): cualquiera ve el perfil completo.
- **Privado**: solo el dueño y sus amigos aceptados ven el perfil
  completo. Quien no es amigo ve solo la portada mínima + el aviso
  **“tiene el perfil privado”** + el botón de solicitud de amistad
  (`PrivateProfileGate`).
- **Control:** en el perfil propio, `ProfileSocialSettings` trae el
  desplegable **Visibilidad del perfil: 🌐 Público / 🔒 Privado**.
  Se guarda en la columna `visibility` (migración) con respaldo local
  (`profile_visibility:<userId>`). En pareja, `visibility` es el espejo
  explícito de `couple_profiles.is_public` (que ya existía).
- **Reglas de acceso:**
  - Ver el perfil completo: dueño, perfil público, o amigo aceptado.
  - Ver las fotos/galería: dueño, o acceso concedido por solicitud
    aceptada (ver §7). Si se declina, no se accede.
  - Agregar como amigo: igual en ambos casos (solicitud siempre).
  - Eliminar de amigos + perfil privado = hay que pedir de nuevo (§4).

## 7. Solicitud de ver fotos (galería)

- En el perfil ajeno y en el chat se puede pedir acceso a las fotos
  (`PhotoAccessRequestButton`): **Solicitar ver fotos** → pendiente →
  aceptado (acceso a la galería) o declinado (sin acceso).
- Datos: `friend_requests` con `kind = 'photo_access'`. La tabla
  existente `gallery_access_requests` sigue existiendo para el flujo
  anterior de galería privada; ambos flujos conviven y el administrador
  ve los dos en la revisión.
- El acceso concedido se consulta con `hasPhotoAccess`
  (`src/lib/friends.ts`).

## 8. Reportar y bloquear

### Reportar

- Motivos desglosados (`REPORT_REASONS` en `src/lib/reportBlock.ts`):
  - **Términos y condiciones:** infringe los términos y condiciones;
    perfil falso.
  - **Conducta:** suplantación de identidad; acoso; conducta de odio o
    discriminatoria; spam, estafa o fraude; otro motivo.
  - **Material prohibido:** menor de edad; material prohibido; contenido
    íntimo sin consentimiento (Ley Olimpia).
- Cada motivo lleva su severidad (`low/medium/high/critical`).
- El reporte se guarda en la tabla existente `reports`
  (`content_type = 'profile'`, `status = 'pending'`) para que el
  **administrador lo revise** y decida: habilitar el perfil, bloquearlo
  o darlo de baja (campos `reviewed_by`, `reviewed_at`,
  `resolution_notes`, `action_taken`).
- En demo el reporte se guarda en local (`profile_reports_demo`) con
  estado `pending` para que el flujo sea visible.

### Bloquear (como Twitter)

- Botón **Bloquear / Desbloquear** (`ReportBlockButtons`). El bloqueado
  **no puede buscar a quien lo bloqueó** ni ver su perfil: la app filtra
  los resultados con `isBlockedBy` / `isSearchBlockedSync`
  (`src/lib/reportBlock.ts`) antes de mostrarlos.
- Datos: tabla `profile_blocks` (migración) + respaldo demo en local.
- OJO: el checkbox “bloquear” del `ReportDialog` existente hoy solo
  muestra un toast y **no bloquea de verdad**. El botón real es el de
  `ReportBlockButtons`. Cablear ese checkbox (o quitarlo) es pendiente
  (ver §9).

## 9. Revisión del administrador y retención de identidad

1. El administrador revisa el reporte en `reports` (o en el panel de
   reportes existente) y decide:
   - **Habilitar el perfil:** `status = 'resolved'`, `action_taken =
'none'` (o nota de resolución).
   - **Bloquear el perfil:** `action_taken = 'suspended'` / bloqueo
     temporal con motivo.
   - **Dar de baja el perfil:** `action_taken = 'banned'` + baja.
2. **Si se da de baja, la identidad SE QUEDA:** antes de borrar el
   perfil, el administrador registra en `retained_identities` el
   **correo, el nombre de usuario (su ID) y el motivo** (helper
   `retainIdentityAfterBan` en `src/lib/reportBlock.ts`).
3. Esa fila **nunca se borra desde la app** (no hay políticas de UPDATE
   ni DELETE; solo lectura/inserción por administradores con
   `profiles.is_admin = true`).
4. **En el registro**, el servidor debe comprobar con rol administrador
   si el correo o el nombre de usuario están en `retained_identities`:
   si están, el registro se rechaza aunque la persona use otro nombre.
   Esa comprobación en el registro **aún no está implementada** (no hay
   Edge Function ni RPC para ello): es el paso que falta del lado del
   servidor, no del cliente.

## 10. Cableado pendiente (fuera de este alcance)

1. **`src/pages/Chat.tsx`** (otro encargado): en el encabezado de la
   conversación, junto al nombre del interlocutor, montar
   `FriendRequestButton` y `PhotoAccessRequestButton` con
   `profileId = interlocutor.id`, `viewerId = usuario actual`,
   `isOwnProfile = false`, `isDemo = isDemoMode`. La solicitud de
   amistad/fotos desde el chat usa el mismo `friends.ts`; no hace falta
   nada más.
2. **`src/components/profiles/shared/ProfileDetail.tsx`** (otro
   encargado, carga directa `/profile/:uuid`): ahí es donde se ven
   perfiles ajenos de verdad. Montar, en orden:
   - `NationalityBadge` junto a las demás insignias del encabezado
     (país desde `profile.country_code` → `getSocialDemoData(nombre)`).
   - `FriendRequestButton` + `PhotoAccessRequestButton` +
     `ReportBlockButtons` en la fila de acciones (con
     `onReport` abriendo el `ReportDialog` existente).
   - `FriendsSection` debajo de la información del perfil.
   - `PrivateProfileGate` **en lugar del contenido** cuando
     `isProfileGated({ visibility, isOwner, isFriend })` sea true
     (`visibility` desde la columna o `readVisibilityLocal`;
     `isFriend` con `areFriendsSync(viewerId, profileId, viewerName)`).
   - `DistanceBadge` en el encabezado cuando se ve un perfil ajeno
     (`distanceKm` desde las coordenadas del perfil y del espectador,
     aproximada por el propio componente).
3. **Discover / búsqueda:** el filtro “el bloqueado no puede buscar a
   quien lo bloqueó” está implementado en `reportBlock.ts`
   (`isBlockedBy` / `isSearchBlockedSync`), pero el filtrado de los
   resultados de Discover/búsqueda con ese chequeo aún no está aplicado
   (Discover solo recibió el `DistanceBadge` en esta ronda).
4. **Registro:** comprobar `retained_identities` antes de crear la
   cuenta (paso de servidor, ver §9.4).
5. **`ReportDialog`:** su checkbox de bloqueo no bloquea (solo toast);
   cablearlo a `blockProfile` o quitarlo.

## 11. Qué NO se tocó

- `src/demo/demoData.ts` (otro encargado): los datos sociales demo viven
  en `src/demo/socialDemoData.ts`, keyeados por nombre.
- `src/pages/Chat.tsx` y `ProfileDetail.tsx`: solo se dejan listos el lib
  y los componentes (ver §10).
- No se aplicó ninguna migración en producción. Cuando se aplique la
  `20261124050000`, los formularios de registro ya intentan escribir
  `country_code` / `visibility` / `location_sharing_enabled` en BD; hasta
  entonces esos valores viven en local con respaldo en BD al primer
  guardado posterior.
