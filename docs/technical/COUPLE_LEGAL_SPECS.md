# Especificaciones Técnicas: Protocolo Legal de Pareja (v3.7.2)

## 1. Introducción

Este documento detalla los requisitos de base de datos y backend necesarios para soportar los componentes `CouplePreNuptialAgreement` y `CoupleDisputeManager`.

## 2. Esquema de Base de Datos (Supabase/PostgreSQL)

### 2.1 Tabla `couple_agreements`

Almacena los acuerdos prenupciales digitales.

```sql
CREATE TABLE couple_agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couple_profiles(id),
  partner_1_id UUID NOT NULL REFERENCES profiles(id),
  partner_2_id UUID NOT NULL REFERENCES profiles(id),
  agreement_hash TEXT NOT NULL,
  death_clause_text TEXT NOT NULL,
  asset_disposition_clause TEXT NOT NULL DEFAULT 'ADMIN_FORFEIT',
  partner_1_signature BOOLEAN DEFAULT FALSE,
  partner_2_signature BOOLEAN DEFAULT FALSE,
  partner_1_ip TEXT,
  partner_2_ip TEXT,
  partner_1_signed_at TIMESTAMP WITH TIME ZONE,
  partner_2_signed_at TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('PENDING', 'ACTIVE', 'DISPUTED', 'DISSOLVED', 'FORFEITED')) DEFAULT 'PENDING',
  signed_at TIMESTAMP WITH TIME ZONE, -- Fecha cuando ambas firmas se completaron
  dispute_deadline TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_couple_agreements_couple_id ON couple_agreements(couple_id);
```

### 2.2 Tabla `couple_disputes`

Gestiona el proceso de disolución y la cuenta regresiva.

```sql
CREATE TABLE couple_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES couple_profiles(id),
  initiated_by UUID NOT NULL REFERENCES profiles(id),
  status TEXT CHECK (status IN ('FROZEN_PENDING', 'PROPOSAL_MADE', 'RESOLVED_AGREEMENT', 'RESOLVED_FORFEIT')) DEFAULT 'FROZEN_PENDING',
  frozen_assets_snapshot JSONB, -- Snapshot de balances al momento del congelamiento
  proposed_winner_id UUID REFERENCES profiles(id),
  proposal_text TEXT,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE NOT NULL, -- start_time + 72 hours
  resolution_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_couple_disputes_couple_id ON couple_disputes(couple_id);
```

## 3. Lógica de Backend (Edge Functions / Triggers)

### 3.1 Trigger `on_agreement_signed`

Cuando `partner_1_signature` y `partner_2_signature` son TRUE:

1. Actualizar `status` a 'ACTIVE'.
2. Establecer `signed_at` a NOW().
3. Notificar a ambos usuarios.

### 3.2 Cron Job `check_dispute_deadlines`

Ejecutar cada hora:

1. Buscar disputas con `status` = 'FROZEN_PENDING' y `end_time` < NOW().
2. Cambiar `status` a 'RESOLVED_FORFEIT'.
3. Ejecutar transferencia de activos a la wallet de administración (Platform Admin Wallet).
4. Marcar `couple_profile` como 'DISSOLVED'.

## 4. Integración Frontend

- **CouplePreNuptialAgreement.tsx**: Interfaz para creación y firma. Requiere conexión a `couple_agreements`.
- **CoupleDisputeManager.tsx**: Interfaz de cuenta regresiva. Requiere conexión a `couple_disputes` y servicio `CoupleDissolutionService`.

## 5. Seguridad

- RLS (Row Level Security) debe estar habilitado.
- Solo los miembros de la pareja (`couple_id`) pueden ver/editar sus acuerdos.
- Nadie puede modificar un acuerdo con `status` = 'ACTIVE' excepto para iniciar disputa.
