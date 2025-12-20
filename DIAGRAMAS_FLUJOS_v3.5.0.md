# 📊 DIAGRAMAS DE FLUJOS v3.8.0 - COMPLICESCONECTA v3.8.0

**Fecha:** 20 Diciembre 2025
**Versión:** 3.8.0
**Estado:** ✅ PRIVACY ENHANCED - UI POLISHED - ASSETS STANDARDIZED

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
    
    D --> I{Registro}
    I -->|Con WorldID| J[Verificación Instantánea]
    I -->|Sin WorldID| K[Verificación Manual]
    
    J --> L[Onboarding]
    K --> L
    
    L --> M[Validación Teléfono MX]
    M --> N{Teléfono Válido?}
    N -->|Sí +52XXXXXXXXXX| O[Perfil Real Creado]
    N -->|No| L
    
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
    S->>DB: Validación INSTANTÁNEA
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
    
    F --> M[Feedback Usuario<br/>1-5 estrellas]
    M -->|5 estrellas| N[+100 CMPX<br/>Moderador]
    M -->|1-4 estrellas| O[Sin bonus]
    
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
