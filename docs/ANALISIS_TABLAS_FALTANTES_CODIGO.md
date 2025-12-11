# 📊 ANÁLISIS DE TABLAS FALTANTES EN CÓDIGO

**Fecha:** 9 Diciembre 2025  
**Objetivo:** Identificar todas las tablas referenciadas en el código que faltan en el schema  
**Estado:** ✅ ANÁLISIS COMPLETADO

---

## 🔍 TABLAS ENCONTRADAS EN CÓDIGO (NO EN SCHEMA)

### TABLAS DE TOKENS (TokenService.ts)
1. **user_token_balances** ❌ FALTA
   - Columnas: user_id, cmpx_balance, gtk_balance
   - Uso: Almacenar balance de tokens CMPX y GTK por usuario
   - Líneas: 98, 135, 192, 267

2. **token_transactions** ❌ FALTA
   - Columnas: user_id, transaction_type, token_type, amount, balance_after, description, metadata, created_at
   - Uso: Registrar historial de transacciones de tokens
   - Líneas: 318, 347

3. **staking_records** ❌ FALTA
   - Columnas: user_id, token_type, amount, start_date, end_date, reward_percentage, reward_claimed, status, apy, updated_at
   - Uso: Almacenar registros de staking de tokens
   - Líneas: 428, 472, 502

### TABLAS DE MATCHING (SmartMatchingService.ts)
4. **matches** ✅ EXISTE (pero con columnas incorrectas)
   - Código usa: user1_id, user2_id
   - Schema tiene: profile_id_1, profile_id_2
   - **NECESITA:** Renombrar columnas o agregar aliases

### TABLAS DE WALLETS (WalletService.ts)
5. **user_wallets** ✅ EXISTE
   - Columnas: user_id, address, encrypted_private_key, network, created_at, updated_at
   - Estado: Correcto

6. **testnet_token_claims** ✅ EXISTE
   - Columnas: user_id, amount_claimed, claimed_at
   - Uso: Registrar reclamos de tokens testnet
   - Líneas: 737, 763

7. **daily_token_claims** ✅ EXISTE
   - Columnas: user_id, amount_claimed, claim_date
   - Uso: Registrar reclamos diarios de tokens
   - Líneas: 857

8. **app_logs** ❌ FALTA
   - Columnas: message, level, user_id, metadata, created_at
   - Uso: Registrar logs de aplicación
   - Línea: 824

### TABLAS DE VERIFICACIÓN (UserVerificationService.ts)
9. **profiles** ✅ EXISTE (pero falta columnas de verificación)
   - Columnas faltantes: email_verified_at, phone_verified_at
   - Líneas: 366-367, 452, 455

### TABLAS DE IDENTIFICACIÓN (UserIdentificationService.ts)
10. **user_identifiers** ❌ FALTA
    - Columnas: unique_id, user_id, profile_type, prefix, numeric_id, metadata, created_at
    - Uso: Almacenar identificadores únicos de usuarios
    - Líneas: 106, 139

### TABLAS DE REPORTES (ReportService.ts)
11. **reports** ✅ EXISTE (pero falta columnas)
    - Columnas faltantes: reporter_user_id, reported_content_id, content_type, report_type, severity, reviewed_by, reviewed_at, resolution_notes, action_taken, is_false_positive
    - Líneas: 76-87

### TABLAS DE INTERESES (useInterests.ts)
12. **user_interests** ✅ EXISTE
    - Columnas: user_id, interest_id, created_at
    - Estado: Correcto

---

## 🚨 TABLAS CRÍTICAS FALTANTES (PRIORIDAD ALTA)

### TIER 1: CRÍTICAS (Bloquean funcionalidad)
1. **user_token_balances** - Sistema de tokens
2. **token_transactions** - Historial de transacciones
3. **staking_records** - Sistema de staking
4. **app_logs** - Logging de aplicación
5. **user_identifiers** - Identificación de usuarios

### TIER 2: IMPORTANTES (Mejoran funcionalidad)
6. Agregar columnas a **profiles**: email_verified_at, phone_verified_at
7. Agregar columnas a **reports**: reporter_user_id, reported_content_id, content_type, report_type, severity, reviewed_by, reviewed_at, resolution_notes, action_taken, is_false_positive
8. Renombrar/agregar columnas en **matches**: user1_id, user2_id (actualmente: profile_id_1, profile_id_2)

---

## 📋 SCRIPT SQL PARA AGREGAR TABLAS FALTANTES

```sql
-- Tabla: user_token_balances
CREATE TABLE IF NOT EXISTS user_token_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    cmpx_balance DECIMAL(18,8) DEFAULT 0,
    gtk_balance DECIMAL(18,8) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_token_balances_user_id ON user_token_balances(user_id);

-- Tabla: token_transactions
CREATE TABLE IF NOT EXISTS token_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL,
    token_type TEXT NOT NULL,
    amount DECIMAL(18,8) NOT NULL,
    balance_after DECIMAL(18,8),
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at DESC);

-- Tabla: staking_records
CREATE TABLE IF NOT EXISTS staking_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_type TEXT NOT NULL,
    amount DECIMAL(18,8) NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    reward_percentage DECIMAL(5,2),
    apy DECIMAL(5,2),
    reward_claimed BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staking_records_user_id ON staking_records(user_id);
CREATE INDEX IF NOT EXISTS idx_staking_records_status ON staking_records(status);

-- Tabla: app_logs
CREATE TABLE IF NOT EXISTS app_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message TEXT NOT NULL,
    level TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_logs_user_id ON app_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_app_logs_created_at ON app_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_logs_level ON app_logs(level);

-- Tabla: user_identifiers
CREATE TABLE IF NOT EXISTS user_identifiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unique_id VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    profile_type TEXT NOT NULL,
    prefix VARCHAR(10),
    numeric_id INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_identifiers_unique_id ON user_identifiers(unique_id);
CREATE INDEX IF NOT EXISTS idx_user_identifiers_user_id ON user_identifiers(user_id);

-- Agregar columnas faltantes a profiles
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

-- Agregar columnas faltantes a reports
ALTER TABLE IF EXISTS reports ADD COLUMN IF NOT EXISTS reporter_user_id UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS reports ADD COLUMN IF NOT EXISTS reported_content_id UUID;
ALTER TABLE IF EXISTS reports ADD COLUMN IF NOT EXISTS content_type TEXT;
ALTER TABLE IF EXISTS reports ADD COLUMN IF NOT EXISTS report_type TEXT;
ALTER TABLE IF EXISTS reports ADD COLUMN IF NOT EXISTS severity TEXT;
ALTER TABLE IF EXISTS reports ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS reports ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS reports ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE IF EXISTS reports ADD COLUMN IF NOT EXISTS action_taken TEXT;
ALTER TABLE IF EXISTS reports ADD COLUMN IF NOT EXISTS is_false_positive BOOLEAN;

-- Agregar columnas a matches (si no existen)
ALTER TABLE IF EXISTS matches ADD COLUMN IF NOT EXISTS user1_id UUID;
ALTER TABLE IF EXISTS matches ADD COLUMN IF NOT EXISTS user2_id UUID;

-- Habilitar RLS
ALTER TABLE IF EXISTS user_token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staking_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS app_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_identifiers ENABLE ROW LEVEL SECURITY;
```

---

## 📊 RESUMEN

| Tabla | Estado | Acción |
|-------|--------|--------|
| user_token_balances | ❌ FALTA | Crear |
| token_transactions | ❌ FALTA | Crear |
| staking_records | ❌ FALTA | Crear |
| app_logs | ❌ FALTA | Crear |
| user_identifiers | ❌ FALTA | Crear |
| profiles | ✅ EXISTE | Agregar columnas |
| reports | ✅ EXISTE | Agregar columnas |
| matches | ✅ EXISTE | Agregar columnas |

---

**Estado:** ✅ ANÁLISIS COMPLETADO  
**Próximo:** Agregar estas tablas al schema maestro consolidado
