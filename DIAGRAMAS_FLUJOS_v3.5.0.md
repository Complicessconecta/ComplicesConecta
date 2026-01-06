# 📊 DIAGRAMAS DE FLUJOS v3.8.0 - COMPLICESCONECTA v3.8.0

**Fecha:** 26 Diciembre 2025
**Versión:** 3.8.0
**Estado:** ✅ PRIVACY ENHANCED - UI POLISHED - CODE STANDARDIZED

---

## 🔄 FLUJO COMPLETO DE USUARIO (Actualizado v3.7.0)

```mermaid
flowchart TD
    A[Landing +18] --> B{Opción Usuario}
    B -->|Modo Demo| C[Ruta /demo]
    B -->|Registro Real| D[Ruta /auth]

    C --> E{Selector Demo}
    E -->|Usuario Single| F[Demo Single]
    E -->|Pareja| G[Demo Pareja]

    F --> H[Perfil Demo Activo]
    G --> H

    D --> I{Registro + Validación Teléfono MX}
    I -->|Con WorldID| J[Verificación Instantánea]
    I -->|Sin WorldID| K[Verificación Manual]

    J --> O[Perfil Real Creado]
    K --> O

    subgraph Leyenda
        direction LR
        Note1[Nota: El 'Onboarding' es una presentación de características, no un paso de validación.]
    end

    H --> P[Discover]
    O --> P

    P --> Q{Acción}
    Q -->|Match| R[Chat Realtime]
    Q -->|Club Check-in| S[Geoloc 50m]
    Q -->|Comprar Tokens| T[Shop CMPX]
    Q -->|Invertir| U[Donativos /invest]
    Q -->|Mint NFT| N1[NFT Gallery]

    S --> V{Verificado?}
    V -->|Sí| W[Reseña 24h después]
    V -->|No| X[Check-in no válido]

    R --> Y{Galería Privada?}
    Y -->|Sí| Z[Pago CMPX / Unlock]
    Y -->|No| AA[Chat Gratis]

    Z -->|Locked| BLUR[Blur Agresivo + Candado]
    BLUR -->|Unlock| AB[Creador gana 90%]
    W --> AC[Club Rating Actualizado]

    style C fill:#8b5cf6
    style E fill:#3b82f6
    style J fill:#10b981
    style M fill:#f59e0b
    style S fill:#3b82f6
    style Z fill:#f59e0b
    style U fill:#8b5cf6
    style BLUR fill:#ef4444
```

---

## 🏢 FLUJO DE VERIFICACIÓN DE CLUB

```mermaid
sequenceDiagram
    participant C as Club Partner
    participant A as App
    participant S as SuperAdmin<br/>(Tú + Esposa)
    participant DB as Base de Datos
    participant U as Usuarios

    C->>A: Registro como Partner
    C->>A: Sube flyers + redes sociales
    A->>S: Notificación nueva solicitud
    S->>DB: Validación MANUAL
    DB->>C: Badge VERIFICADO ✅
    DB->>A: Página pública activa<br/>/clubs/{slug}

    U->>A: Visita página club
    U->>A: Check-in geoloc (radio 50m)
    A->>DB: Registra visita + timestamp
    A->>U: Notificación 24h después
    U->>A: Reseña verificada
    DB->>C: Rating actualizado automático

    C->>A: Sube fotos evento
    A->>A: Watermark automático<br/>ComplicesConecta + Club
    A->>A: Blur IA caras/tatuajes
    A->>DB: Guarda imágenes procesadas
```

---

## 🛡️ FLUJO DE MODERACIÓN COMPLETO

```mermaid
flowchart LR
    A[Usuario Reporta] --> B{IA Pre-clasifica}
    B -->|Urgente<br/>Drogas/Armas/Menores| C[Notificación Push<br/>3 Moderadores Elite]
    B -->|Normal<br/>Spam/Hate| D[Cola Normal<br/>Respuesta <4 hrs]
    B -->|Bajo<br/>Fake/Spam| E[Auto-resuelto<br/>IA]

    C --> F[Moderador Responde<br/><15 min]
    D --> F
    F --> G{Decisión}
    G -->|Advertencia| H[Nivel 1<br/>7 días sin chat]
    G -->|Suspensión| I[Nivel 2<br/>30 días + pérdida tokens]
    G -->|Baneo| J[Nivel 3<br/>Permanente]

    J --> K[Huella Digital<br/>Canvas + WorldID]
    K --> L[Bloqueo Futuro<br/>99.9% imposible volver]

    F --> M(Feedback Usuario<br/>1-5 estrellas)
    M -.->|5 estrellas| N(FEATURE PENDING<br/>+100 CMPX<br/>Moderador)
    M -.->|1-4 estrellas| O(FEATURE PENDING<br/>Sin bonus)

    style M fill:#f59e0b,stroke:#b45309,stroke-dasharray: 5 5
    style N fill:#f59e0b,stroke:#b45309,stroke-dasharray: 5 5
    style O fill:#f59e0b,stroke:#b45309,stroke-dasharray: 5 5

    style C fill:#ef4444
    style F fill:#10b981
    style J fill:#dc2626
    style K fill:#7c3aed
```

---

## 💎 FLUJO DE COMPRA Y USO DE TOKENS CMPX

```mermaid
sequenceDiagram
    participant U as Usuario
    participant S as Shop
    participant ST as Stripe
    participant DB as Base de Datos
    participant C as Creador<br/>Galería Privada

    U->>S: Selecciona paquete CMPX<br/>1000 CMPX = $300 MXN
    S->>ST: Crea Checkout Session
    ST->>U: Pago con tarjeta/SPEI
    ST->>DB: Webhook: checkout.completed
    DB->>U: Tokens acreditados<br/>+1000 CMPX

    U->>C: Intenta ver galería privada
    C->>U: Solicita 1000 CMPX
    U->>DB: Pago 1000 CMPX
    DB->>C: +900 CMPX (90%)
    DB->>DB: +100 CMPX comisión (10%)
    DB->>U: Acceso galería desbloqueado

    Note over DB: Comisión 10%<br/>Creador gana 90%
    Note right of U: ✅ IMPLEMENTADO
```

---

## 💰 FLUJO DE DONATIVOS/INVERSIÓN

```mermaid
flowchart TD
    A[Inversor] --> B[Landing /invest]
    B --> C{Selecciona Tier}
    C -->|$10K| D[Tier Bronce<br/>10% anual + 100K CMPX]
    C -->|$25K| E[Tier Plata<br/>10% anual + 300K CMPX]
    C -->|$50K| F[Tier Oro<br/>10% anual + 750K CMPX]
    C -->|$100K| G[Tier Diamante<br/>10% anual + 2M CMPX]

    D --> H[Stripe Checkout]
    E --> H
    F --> H
    G --> H

    H --> I[Pago Completado]
    I --> J[SAFTE Automático<br/>Contrato generado]
    I --> K[Tokens CMPX Acreditados]
    I --> L[Badge Inversor]
    I --> M[Retorno 10% anual<br/>Garantizado]

    M --> N[Pago Mensual Automático<br/>1/12 del 10% anual]

    style D fill:#cd7f32
    style E fill:#c0c0c0
    style F fill:#ffd700
    style G fill:#b9f2ff
```

---

## 🤖 FLUJO DE IA COMPLICE (ASISTENTE PERSONAL)

```mermaid
graph TB
    A[Usuario Activo] --> B[IA Complice<br/>Monitoreo 24/7]
    B --> C{Evento Detectado}
    C -->|Parejas Cercanas| D[Notificación Push<br/>6 parejas a <8km]
    C -->|Club Evento| E[Mensaje Personalizado<br/>¿Reservamos La Azotea?]
    C -->|Match Nuevo| F[Sugerencia Mensaje<br/>Basado en perfil]
    C -->|Búsqueda Web| G[Resultados Eventos<br/>Flyers, reseñas]
```

---

### 🧩 Notas de Arquitectura de UI (v3.8.0)

graph TD
%% Lógica de Navegación Condicional
User[Usuario Navega] --> Router{¿Qué Ruta es?}

    %% Flujo Público
    Router -->|Ruta Pública / Landing| PublicLayout[Layout Público]
    PublicLayout --> ShowHeader[✅ MOSTRAR: HeaderNav]
    PublicLayout --> HideTabs[❌ OCULTAR: ProfileNavTabs]

    %% Flujo Privado (Perfiles)
    Router -->|Ruta Privada /profile| ProfileLayout[Layout Perfil]
    ProfileLayout --> HideHeader[❌ OCULTAR: HeaderNav]
    ProfileLayout --> ShowTabs[✅ MOSTRAR: ProfileNavTabs]

    %% Lógica del Botón de Login (Global)
    ShowHeader & ShowTabs --> AuthCheck{¿Autenticado?}
    AuthCheck -->|No| BtnLogin[Mostrar Botón: 'Iniciar Sesión']
    AuthCheck -->|Sí| BtnUser[Mostrar Botón: 'Nombre/Nickname']

    %% Estilos
    style PublicLayout fill:#e1f5fe,stroke:#01579b
    style ProfileLayout fill:#fff3e0,stroke:#e65100
    style HideHeader fill:#ffcdd2,stroke:#b71c1c
    style ShowTabs fill:#c8e6c9,stroke:#1b5e20

sequenceDiagram
participant User as Usuario
participant UI as Interfaz
participant Logic as Permisos

    User->>UI: Click en Imagen de Galería
    UI->>Logic: ¿Tiene Permiso de Visualización?

    alt Es VIP o Dueño
        Logic-->>UI: Acceso Total
        UI->>UI: Abrir Lightbox (Sin Blur)
    else Usuario Gratuito / No Match
        Logic-->>UI: Acceso Restringido
        UI->>UI: Abrir Lightbox + APLICAR BLUR (CSS filter)
        UI->>User: Mostrar Overlay "Desbloquear Foto"
        User->>UI: Click "Desbloquear"
        UI->>Logic: Procesar Pago/Token
        Logic-->>UI: Retirar Blur
    end

    sequenceDiagram
    participant User as Usuario
    participant UI as Interfaz
    participant Logic as Permisos

    User->>UI: Click en Imagen de Galería
    UI->>Logic: ¿Tiene Permiso de Visualización?

    alt Es VIP o Dueño
        Logic-->>UI: Acceso Total
        UI->>UI: Abrir Lightbox (Sin Blur)
    else Usuario Gratuito / No Match
        Logic-->>UI: Acceso Restringido
        UI->>UI: Abrir Lightbox + APLICAR BLUR (CSS filter)
        UI->>User: Mostrar Overlay "Desbloquear Foto"
        User->>UI: Click "Desbloquear"
        UI->>Logic: Procesar Pago/Token
        Logic-->>UI: Retirar Blur
    end

- ## Todos los flujos descritos se renderizan ahora bajo un **MainLayout** unificado que controla:
  - ## El sistema de fondos (`UnifiedBackground` + partículas híbridas) con gradientes nocturnos tipo Plexus.
  - ## La navegación global fija (`AppSidebar` + header) para evitar barras duplicadas por página.
- ## Las páginas de **Tokens**, **NFTs**, **Perfil Single** y **Settings** adoptan glassmorphism consistente para las cards principales, mientras que las sub-cards (proyecciones, ventajas, condiciones) usan un patrón glass ligero para marcar jerarquías visuales.
- ## Se añade un **Centro de Control IA** (`/ai-help`) como vista dedicada donde se explica al usuario qué es CómplicesConecta, cómo funciona la IA Local sobre WebLLM (modelo Phi‑3‑mini ejecutado en el navegador) y cómo se aplican las reglas legales del Libro Maestro (`app-master-context.md`). Desde esta página, el usuario puede interactuar con el Asistente IA Legal antes de firmar contratos o realizar operaciones con tokens/NFTs.

# Flujo de Funcionalidad NFT - CómplicesConecta

## 1. Descripción General

El sistema de NFTs permite a los usuarios (singles y parejas) "mintear" (crear) tokens no fungibles que representan contenido exclusivo o identidad en la blockchain de Polygon.

## 2. Componente Principal

`NFTMintButton` (`src/components/blockchain/NFTMintButton.tsx`)

### Props

- `userId`: ID del usuario.
- `type`: 'single' | 'couple'.
- `nftName`: Nombre del activo.
- `nftDescription`: Descripción.
- `imageFile`: Archivo a mintear.
- `partnerEmail`: (Requerido para 'couple').

## 3. Lógica de Negocio

### Validaciones

- **Tamaño de archivo:** Máximo 5MB.
- **Formato:** JPG, PNG, WEBP.
- **Parejas:** Requiere email de la pareja para flujo de doble consentimiento.

### Modos de Operación

1. **Modo Demo:**
   - Simula la transacción sin costo.
   - Retorna un `tokenId` simulado.
   - No interactúa con la blockchain real.
   - Ideal para pruebas y desarrollo.

2. **Modo Producción:**
   - Interactúa con `WalletService` y `NFTService`.
   - **Single:** Minteo directo.
   - **Couple:** Crea una solicitud de firma pendiente. La pareja debe aprobar.

## 4. Flujo de Usuario

1. Usuario selecciona imagen en Galería.
2. Clic en "Mintear NFT".
3. Se valida el archivo.
4. Feedback visual (Loading/Spinner).
5. **Éxito:**
   - Single: Mensaje "NFT Minteado".
   - Couple: Mensaje "Solicitud enviada a pareja".
6. **Error:**
   - Mensaje descriptivo (e.g., "Archivo muy grande").

## 5. Pruebas

## "Arquitectura UI"

A. Nuevo Flujo de Navegación (Header vs Tabs)

graph TD
%% Lógica de Navegación Condicional
User[Usuario Navega] --> Router{¿Qué Ruta es?}

    %% Flujo Público
    Router -->|Ruta Pública / Landing| PublicLayout[Layout Público]
    PublicLayout --> ShowHeader[✅ MOSTRAR: HeaderNav]
    PublicLayout --> HideTabs[❌ OCULTAR: ProfileNavTabs]

    %% Flujo Privado (Perfiles)
    Router -->|Ruta Privada /profile| ProfileLayout[Layout Perfil]
    ProfileLayout --> HideHeader[❌ OCULTAR: HeaderNav]
    ProfileLayout --> ShowTabs[✅ MOSTRAR: ProfileNavTabs]

    %% Lógica del Botón de Login (Global)
    ShowHeader & ShowTabs --> AuthCheck{¿Autenticado?}
    AuthCheck -->|No| BtnLogin[Mostrar Botón: 'Iniciar Sesión']
    AuthCheck -->|Sí| BtnUser[Mostrar Botón: 'Nombre/Nickname']

    %% Estilos
    style PublicLayout fill:#e1f5fe,stroke:#01579b
    style ProfileLayout fill:#fff3e0,stroke:#e65100
    style HideHeader fill:#ffcdd2,stroke:#b71c1c
    style ShowTabs fill:#c8e6c9,stroke:#1b5e20

B. Nuevo Flujo de Galería (Lógica del Blur)

## "Flujos de Usuario":

sequenceDiagram
participant User as Usuario
participant UI as Interfaz
participant Logic as Permisos

    User->>UI: Click en Imagen de Galería
    UI->>Logic: ¿Tiene Permiso de Visualización?

    alt Es VIP o Dueño
        Logic-->>UI: Acceso Total
        UI->>UI: Abrir Lightbox (Sin Blur)
    else Usuario Gratuito / No Match
        Logic-->>UI: Acceso Restringido
        UI->>UI: Abrir Lightbox + APLICAR BLUR (CSS filter)
        UI->>User: Mostrar Overlay "Desbloquear Foto"
        User->>UI: Click "Desbloquear"
        UI->>Logic: Procesar Pago/Token
        Logic-->>UI: Retirar Blur
    end

## "Flujo de Creación de NFT (El Botón Perdido)"

    graph LR
    %% Flujo de Creación
    Start((Inicio)) --> BtnCreate[Click: Botón 'Crear NFT']
    BtnCreate --> Upload{¿Subir o Seleccionar?}
    Upload -->|Galería| Select[Seleccionar de Galería Existente]
    Upload -->|Nuevo| Camera[Subir Foto Nueva]

    Select & Camera --> Preview[Vista Previa NFT]
    Preview --> Mint[Ejecutar Minting en Blockchain]
    Mint --> Wallet[Interacción Wallet]
    Wallet -->|Confirmado| Success[✨ NFT Creado en Perfil]

## "Arquitectura UI"

A. Nuevo Flujo de Navegación (Header vs Tabs)

graph TD
%% Lógica de Navegación Condicional
User[Usuario Navega] --> Router{¿Qué Ruta es?}

    %% Flujo Público
    Router -->|Ruta Pública / Landing| PublicLayout[Layout Público]
    PublicLayout --> ShowHeader[✅ MOSTRAR: HeaderNav]
    PublicLayout --> HideTabs[❌ OCULTAR: ProfileNavTabs]

    %% Flujo Privado (Perfiles)
    Router -->|Ruta Privada /profile| ProfileLayout[Layout Perfil]
    ProfileLayout --> HideHeader[❌ OCULTAR: HeaderNav]
    ProfileLayout --> ShowTabs[✅ MOSTRAR: ProfileNavTabs]

    %% Lógica del Botón de Login (Global)
    ShowHeader & ShowTabs --> AuthCheck{¿Autenticado?}
    AuthCheck -->|No| BtnLogin[Mostrar Botón: 'Iniciar Sesión']
    AuthCheck -->|Sí| BtnUser[Mostrar Botón: 'Nombre/Nickname']

    %% Estilos
    style PublicLayout fill:#e1f5fe,stroke:#01579b
    style ProfileLayout fill:#fff3e0,stroke:#e65100
    style HideHeader fill:#ffcdd2,stroke:#b71c1c
    style ShowTabs fill:#c8e6c9,stroke:#1b5e20

## "Flujos de Usuario"

B. Nuevo Flujo de Galería (Lógica del Blur)

sequenceDiagram
participant User as Usuario
participant UI as Interfaz
participant Logic as Permisos

    User->>UI: Click en Imagen de Galería
    UI->>Logic: ¿Tiene Permiso de Visualización?

    alt Es VIP o Dueño
        Logic-->>UI: Acceso Total
        UI->>UI: Abrir Lightbox (Sin Blur)
    else Usuario Gratuito / No Match
        Logic-->>UI: Acceso Restringido
        UI->>UI: Abrir Lightbox + APLICAR BLUR (CSS filter)
        UI->>User: Mostrar Overlay "Desbloquear Foto"
        User->>UI: Click "Desbloquear"
        UI->>Logic: Procesar Pago/Token
        Logic-->>UI: Retirar Blur
    end

## "Economía y Tokens"

C. Flujo de Creación de NFT (El Botón Perdido)

graph LR
%% Flujo de Creación
Start((Inicio)) --> BtnCreate[Click: Botón 'Crear NFT']
BtnCreate --> Upload{¿Subir o Seleccionar?}
Upload -->|Galería| Select[Seleccionar de Galería Existente]
Upload -->|Nuevo| Camera[Subir Foto Nueva]

    Select & Camera --> Preview[Vista Previa NFT]
    Preview --> Mint[Ejecutar Minting en Blockchain]
    Mint --> Wallet[Interacción Wallet]
    Wallet -->|Confirmado| Success[✨ NFT Creado en Perfil]
