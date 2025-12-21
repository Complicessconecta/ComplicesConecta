# App Master Context – ComplicesConecta (Legal & Tokens)

## 1. Propósito

Este documento es la **fuente de verdad única** para la lógica legal y financiera relacionada con:

- Perfiles de pareja (`ProfileCouple.tsx`).
- Contratos prenupciales digitales (`CouplePreNuptialAgreement.tsx`).
- Protocolo de disolución de pareja (`CoupleDisputeManager.tsx` + `CoupleDissolutionService.ts`).
- Gating operativo de Wallet / Staking / NFTs (`Tokens.tsx`, `WalletService`, `NFTService`).

Cualquier IA local (WebLLM) que asesore sobre estos temas debe basarse **exclusivamente** en estas reglas.

---

## 2. Lógica Persistente (Supabase como verdad única)

### 2.1. Estado de la relación (ACTIVE / FROZEN_DISPUTE / DISSOLVED)

El estado **real** de la relación de pareja se deriva de dos tablas:

1. `couple_agreements`
2. `couple_disputes`

#### 2.1.1. Tabla `couple_agreements`

- Representa el **Acuerdo Prenupcial Digital** de la pareja.
- Campos clave:
  - `id`: identificador único del acuerdo.
  - `couple_id`: ID de la pareja (`couple_profiles`).
  - `partner_1_id`, `partner_2_id`: IDs de los perfiles individuales.
  - `partner_1_signature`, `partner_2_signature`: firmas booleanas.
  - `signed_at`: fecha/hora en que el acuerdo se consideró firmado.
  - `agreement_hash`: hash SHA-256 del texto completo del acuerdo.
  - `partner_1_ip`, `partner_2_ip`: IPs de los firmantes.
  - `status`: estado lógico del contrato (`PENDING`, `ACTIVE`, `DISPUTED`, `DISSOLVED`, `FORFEITED`).

Regla crítica:

- Un contrato está **ACTIVO** solo si:
  - `status = 'ACTIVE'` **y**
  - `partner_1_signature = true` **y**
  - `partner_2_signature = true`.

#### 2.1.2. Tabla `couple_disputes`

- Representa las **disputas legales** asociadas a un acuerdo de pareja.
- Campos clave:
  - `id`: identificador de la disputa.
  - `couple_agreement_id`: referencia al acuerdo de pareja.
  - `dispute_reason`: motivo de la disputa.
  - `nfts_in_dispute`: snapshot de NFTs involucrados.
  - `tokens_in_dispute`: snapshot de tokens CMPX/GTK involucrados.
  - `created_at`: fecha/hora de inicio.
  - `resolved_at`: fecha/hora de resolución (si existe).
  - `resolution_type`: tipo de resolución (transferencia, confiscación, etc.).

La app deriva `relationshipStatus` como:

- `ACTIVE`:
  - No hay registros en `couple_disputes` para ese `couple_agreement_id`, **o**
  - Todas las disputas asociadas tienen `resolved_at` no nulo (ya resueltas).

- `FROZEN_DISPUTE`:
  - Existe al menos una disputa para ese `couple_agreement_id` con `resolved_at IS NULL`.
  - Resultado: **congelamiento inmediato** de los activos CMPX/GTK y NFTs de pareja.

- `DISSOLVED`:
  - La disputa relevante se marcó con `resolved_at` no nulo y `resolution_type` indica transferencia o confiscación.
  - Resultado: la relación se considera legalmente disuelta.

---

## 3. Constitución Legal (Consentimiento, Hashes y Evidencia)

### 3.1. Cinco Puntos de Consentimiento Obligatorio

Antes de firmar el Acuerdo Prenupcial Digital, el usuario debe aceptar explícitamente **5 puntos clave** (checkboxes obligatorios):

1. **Firma Digital Vinculante**  
   Acepto que mi firma electrónica, vinculada a mi IP y Hash de sesión, tiene validez legal plena para la gestión de activos en Cómplices Conecta.

2. **Cláusula de Muerte Súbita**  
   Entiendo que si se inicia una disputa y no hay acuerdo en 30 días, el sistema ejecutará la confiscación/quema automática de los tokens involucrados.

3. **Propiedad Proindiviso**  
   Reconozco que todos los NFTs y saldos en CMPX generados en modo pareja pertenecen al contrato común y no pueden ser retirados unilateralmente.

4. **Registro de Evidencia**  
   Autorizo el registro inmutable de mis metadatos (IP, Timestamp, Dispositivo) como prueba pericial ante posibles arbitrajes.

5. **Protocolo de Congelación**  
   Acepto que cualquier indicio de fraude o disputa activa congelará mis activos inmediatamente hasta la resolución del conflicto.

Regla:  
El botón de firma **no puede habilitarse** mientras no se hayan marcado los 5 checkboxes.

### 3.2. Hashes SHA-256 como Firma Electrónica

- El texto completo del acuerdo se concatena en un string estructurado.
- Se utiliza **SHA-256** (vía `crypto.subtle.digest`) para obtener un `agreement_hash`:
  - `agreement_hash = sha256(agreement_text)`.
- Este hash se almacena en `couple_agreements.agreement_hash`.
- Junto con la IP y el timestamp de firma, el hash constituye una **Firma Electrónica Avanzada (FEA)** alineada con la Ley de Servicios de Confianza y Firma Electrónica.

### 3.3. Registro de IP y Metadatos en `user_consents`

- `ConsentGuard` registra consentimientos en la tabla `user_consents` con:
  - `ip_address`: IP del usuario (obtenida de servicios tipo `api.ipify.org`).
  - `user_agent`: dispositivo/navegador.
  - `consent_text_hash`: hash SHA-256 del texto del consentimiento.
  - `consented_at` / `expires_at`.

Esta tabla sirve como **bitácora forense** de todos los consentimientos legales otorgados por cada usuario.

---

## 4. Gating Operativo (Wallet, Staking, NFTs)

El sistema aplica un **gating legal- operativo** basado en el estado del contrato y de las disputas.

### 4.1. Condición de Contrato ACTIVO

- Para cualquier acción que implique **activos compartidos de pareja** (tokens CMPX/GTK o NFTs de pareja) se requiere:
  - Un registro en `couple_agreements` con `status = 'ACTIVE'`.
  - Ambas firmas registradas (`partner_1_signature` y `partner_2_signature` en `true`).

Si no existe contrato ACTIVO:

- No se permite:
  - Crear o mintear NFTs de pareja.
  - Hacer staking de activos compartidos (CMPX/GTK asociados a pareja).
  - Desbloquear ciertas funciones premium en el perfil de pareja.

### 4.2. Condición de Disputa (FROZEN_DISPUTE)

- Si `relationshipStatus = 'FROZEN_DISPUTE'` (hay disputa sin `resolved_at`):
  - Los activos compartidos de pareja se consideran **congelados**.
  - No se permite:
    - Crear nuevos NFTs de pareja.
    - Retirar o mover tokens CMPX/GTK compartidos.
    - Cambiar ciertas configuraciones legales del perfil.

### 4.3. Reglas Concretas por Área

#### 4.3.1. ProfileCouple.tsx (Perfil de Pareja)

- **Hard-Lock Legal**:
  - Si no hay contrato ACTIVO, se muestra un overlay full-screen que bloquea toda interacción.
  - El usuario solo puede:
    - Leer los puntos legales.
    - Avanzar con el wizard de `CouplePreNuptialAgreement` hasta activar el contrato.

- **Creación de NFT de Pareja**:
  - Solo permitida si:
    - `hasActiveAgreement === true`.
    - `relationshipStatus === 'ACTIVE'`.

#### 4.3.2. Tokens.tsx (Página de Tokens)

- **Staking de activos**:
  - Si el usuario está asociado a un perfil de pareja y **no** tiene contrato ACTIVO:
    - El botón de "Hacer Staking" está bloqueado.
    - Se muestra el mensaje:  
      _"Acción Bloqueada: Se requiere un Acuerdo Prenupcial Activo para garantizar la transparencia de los activos compartidos."_

- **Evidencia Legal en tiempo real**:
  - Se muestra un bloque glass con:
    - ID del acuerdo activo.
    - Hash de seguridad (`agreement_hash`).
    - IP registrada.
    - Timestamp de firma.

---

## 5. Protocolo de Crisis (72h de congelamiento / 30 días de Muerte Súbita)

El Protocolo de Crisis se activa cuando se inicia una disputa de pareja.

### 5.1. Ventana de 72 horas (Cuenta Regresiva de Disputa)

- A través de `CoupleDissolutionService.freezeAccount`:
  - Se crea un snapshot de activos (`frozen_assets_snapshot`).
  - Se crea una fila en `couple_disputes` vinculada a `couple_agreement_id`.
  - Se establece un `deadline_at` a 72 horas.

Durante estas 72h:

- Los activos compartidos quedan **congelados**.
- Las partes pueden proponer y aceptar un distribuidor de activos (ganador).

### 5.2. Ventana de 30 días (Muerte Súbita del Contrato)

- A nivel de contrato prenupcial, la **Cláusula de Muerte Súbita** establece:
  - Si en un plazo de 30 días naturales no se resuelve la disputa:
    - Los activos no reclamados pueden pasar a **confiscación/quema automática** o a la plataforma como "gastos administrativos".

Esto se implementa mediante funciones de mantenimiento (`cron`) que:

- Buscan disputas expiradas.
- Ejecutan la transferencia o confiscación según la configuración del acuerdo (`asset_disposition_clause`).

---

## 6. Rol esperado de la IA Local (WebLLM)

La IA local (modelo Phi-3-mini vía WebLLM) debe actuar como **Auditor Legal de Cómplices**, con las siguientes responsabilidades:

1. **Responder preguntas operativas** como:
   - "¿Por qué mis activos están congelados?"
   - "¿Por qué no puedo comprar NFTs de pareja?"
   - "¿Qué acepté en los 5 puntos de consentimiento?".

2. **Usar siempre la lógica del estado runtime**:
   - `hasActivePrenup` (derivado de `couple_agreements`).
   - `relationshipStatus` (derivado de `couple_disputes`).

3. **No prometer bypass de reglas**:
   - Si una acción está bloqueada por el Hard-Lock o por una disputa, la IA debe explicarlo, no intentar eludirlo.

4. **Referenciar este documento**:
   - Cualquier explicación legal/operativa debe ser coherente con este `app-master-context.md`.

---

## 7. Resumen rápido para prompts de sistema

- El estado de la relación (ACTIVE / FROZEN_DISPUTE / DISSOLVED) se determina con `couple_agreements` + `couple_disputes`.
- Los 5 puntos de consentimiento cubren: firma digital vinculante, muerte súbita, propiedad proindiviso, registro de evidencia y protocolo de congelación.
- La compra de NFTs de pareja y el staking de activos compartidos solo se permiten con contrato ACTIVO.
- Ante disputas, se aplica una ventana de 72h de congelamiento operativo y 30 días de tolerancia antes de ejecutar la Muerte Súbita.
- Este documento es la referencia canónica para cualquier asesoría legal/operativa de la IA.
