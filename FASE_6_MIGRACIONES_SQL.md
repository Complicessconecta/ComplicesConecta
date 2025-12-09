# 🗄️ FASE 6: MIGRACIONES SQL EN SUPABASE

**Fecha:** 9 Diciembre 2025  
**Objetivo:** Crear tablas faltantes y regenerar tipos  
**Estado:** 🔄 EN PROGRESO

---

## 📋 TABLAS A CREAR

### 1. COUPLE PROFILES
```sql
-- couple_profile_views
CREATE TABLE couple_profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_profile_id UUID NOT NULL REFERENCES couple_profiles(id),
  viewer_id UUID NOT NULL REFERENCES profiles(id),
  viewed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- couple_profile_reports
CREATE TABLE couple_profile_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_profile_id UUID NOT NULL REFERENCES couple_profiles(id),
  reporter_id UUID NOT NULL REFERENCES profiles(id),
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. REPORTS & CLASSIFICATION
```sql
-- report_ai_classification
CREATE TABLE report_ai_classification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL,
  classification VARCHAR(100),
  confidence FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. REFERRAL SYSTEM
```sql
-- user_referral_balances
CREATE TABLE user_referral_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  balance DECIMAL(10, 2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- referral_statistics
CREATE TABLE referral_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  total_referrals INT DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- referral_transactions
CREATE TABLE referral_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id),
  referred_id UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. SECURITY & MONITORING
```sql
-- security_events
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  event_type VARCHAR(100),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- digital_fingerprints
CREATE TABLE digital_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  fingerprint_hash VARCHAR(255),
  device_info JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- permanent_bans
CREATE TABLE permanent_bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  reason TEXT,
  banned_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. EVENTS & INTERACTIONS
```sql
-- couple_events
CREATE TABLE couple_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_profile_id UUID NOT NULL REFERENCES couple_profiles(id),
  event_type VARCHAR(100),
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- user_interests
CREATE TABLE user_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  interest_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- story_comments
CREATE TABLE story_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id),
  comment_text TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 6. MONITORING & PERFORMANCE
```sql
-- error_alerts
CREATE TABLE error_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type VARCHAR(100),
  error_message TEXT,
  stack_trace TEXT,
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- monitoring_sessions
CREATE TABLE monitoring_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  session_start TIMESTAMP,
  session_end TIMESTAMP,
  duration_ms INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- performance_metrics
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100),
  metric_value FLOAT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- web_vitals_history
CREATE TABLE web_vitals_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  lcp FLOAT,
  fid FLOAT,
  cls FLOAT,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 PASOS A EJECUTAR

### 1. Conectar a Supabase
```bash
# Verificar conexión
supabase status
```

### 2. Crear tablas
```bash
# Ejecutar migraciones
supabase migration up
# O manualmente en Supabase SQL Editor
```

### 3. Regenerar tipos
```bash
# Generar tipos TypeScript desde Supabase
supabase gen types typescript --linked > src/types/supabase-generated.ts
```

### 4. Validar tipos
```bash
# Verificar que los tipos se generaron correctamente
npx tsc --noEmit --skipLibCheck
```

### 5. Validar build
```bash
# Compilar la aplicación
npm run build
```

---

## ✅ VALIDACIONES

- [ ] Todas las tablas creadas en Supabase
- [ ] Tipos regenerados correctamente
- [ ] TypeScript sin errores
- [ ] Build exitoso
- [ ] Tests pasando

---

## 🎯 ERRORES A RESOLVER

### Tests que fallarán inicialmente:
1. `webVitals.test.ts` - Necesita tabla web_vitals_history
2. `ReportService.test.ts` - Necesita tabla report_ai_classification
3. `realtime-chat.test.ts` - Necesita configuración realtime
4. `media-access.test.ts` - Necesita permisos de acceso
5. `biometric-auth.test.ts` - Necesita configuración biométrica

---

## 📊 PROGRESO

| Tarea | Estado |
|-------|--------|
| Crear tablas | ⏳ Pendiente |
| Regenerar tipos | ⏳ Pendiente |
| Validar TypeScript | ⏳ Pendiente |
| Validar build | ⏳ Pendiente |
| Resolver tests | ⏳ Pendiente |

---

**Próximo paso:** Ejecutar migraciones SQL en Supabase
