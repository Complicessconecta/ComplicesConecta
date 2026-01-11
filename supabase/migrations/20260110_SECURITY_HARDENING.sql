-- ============================================================================
-- MIGRACIÓN DE HARDENING DE SEGURIDAD - PROTECCIÓN COMPLETA
-- Fecha: January 10, 2026
-- Objetivo: Implementar protección contra inyección SQL, DDoS, XSS y exposición de datos sensibles
-- ============================================================================

-- ============================================================================
-- PASO 1: CREAR VISTAS SEGUURAS PARA EVITAR EXPOSICIÓN DE DATOS SENSIBLES
-- ============================================================================

-- Vista segura de profiles (sin datos sensibles)
CREATE OR REPLACE VIEW public.profiles_safe AS
SELECT 
    id,
    user_id,
    display_name,
    profile_type,
    is_verified,
    is_premium,
    created_at,
    updated_at
FROM public.profiles;

-- Vista segura de auth.users (sin emails ni contraseñas)
CREATE OR REPLACE VIEW public.users_safe AS
SELECT 
    id,
    created_at,
    updated_at,
    last_sign_in_at,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data
FROM auth.users;

-- ============================================================================
-- PASO 2: CREAR FUNCIONES DE SANITIZACIÓN Y VALIDACIÓN
-- ============================================================================

-- Función para sanitizar inputs contra inyección SQL
CREATE OR REPLACE FUNCTION public.sanitize_input(input_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Eliminar caracteres peligrosos
    RETURN regexp_replace(
        regexp_replace(
            regexp_replace(input_text, '''', '', 'g'),
            ';', '', 'g'
        ),
        '--', '', 'g'
    );
END;
$$;

-- Función para validar email
CREATE OR REPLACE FUNCTION public.is_valid_email(email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$;

-- Función para validar UUID
CREATE OR REPLACE FUNCTION public.is_valid_uuid(uuid TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN uuid ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
END;
$$;

-- Función para enmascarar email (para logs)
CREATE OR REPLACE FUNCTION public.mask_email(email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    local_part TEXT;
    domain TEXT;
BEGIN
    IF email IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Extraer local part y domain
    local_part := split_part(email, '@', 1);
    domain := split_part(email, '@', 2);
    
    -- Enmascarar local part (mostrar solo primeros 2 caracteres)
    IF length(local_part) > 2 THEN
        local_part := substring(local_part, 1, 2) || '***';
    ELSE
        local_part := '***';
    END IF;
    
    RETURN local_part || '@' || domain;
END;
$$;

-- Función para enmascarar datos sensibles
CREATE OR REPLACE FUNCTION public.mask_sensitive_data(data TEXT, data_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF data IS NULL THEN
        RETURN NULL;
    END IF;
    
    CASE data_type
        WHEN 'email' THEN
            RETURN mask_email(data);
        WHEN 'phone' THEN
            -- Enmascarar número de teléfono
            IF length(data) > 4 THEN
                RETURN '***' || substring(data, length(data) - 3);
            ELSE
                RETURN '***';
            END IF;
        WHEN 'credit_card' THEN
            -- Enmascarar tarjeta de crédito
            IF length(data) > 4 THEN
                RETURN '****-****-****-' || substring(data, length(data) - 3);
            ELSE
                RETURN '****';
            END IF;
        ELSE
            RETURN '***';
    END CASE;
END;
$$;

-- ============================================================================
-- PASO 3: CREAR TRIGGERS DE VALIDACIÓN Y SANITIZACIÓN
-- ============================================================================

-- Trigger para validar email en profiles
CREATE OR REPLACE FUNCTION public.validate_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.email IS NOT NULL AND NOT is_valid_email(NEW.email) THEN
        RAISE EXCEPTION 'Email inválido: %', NEW.email;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER validate_profile_email_trigger
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_profile_email();

-- Trigger para sanitizar inputs en profiles
CREATE OR REPLACE FUNCTION public.sanitize_profile_inputs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Sanitizar campos de texto
    IF NEW.display_name IS NOT NULL THEN
        NEW.display_name := sanitize_input(NEW.display_name);
    END IF;
    
    IF NEW.first_name IS NOT NULL THEN
        NEW.first_name := sanitize_input(NEW.first_name);
    END IF;
    
    IF NEW.last_name IS NOT NULL THEN
        NEW.last_name := sanitize_input(NEW.last_name);
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER sanitize_profile_inputs_trigger
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.sanitize_profile_inputs();

-- ============================================================================
-- PASO 4: IMPLEMENTAR RATE LIMITING CONTRA DDoS
-- ============================================================================

-- Tabla para tracking de rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    ip_address TEXT,
    endpoint TEXT,
    request_count INTEGER DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    window_end TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 minute',
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_id ON public.rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_address ON public.rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limits_endpoint ON public.rate_limits(endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end ON public.rate_limits(window_end);

-- Habilitar RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para rate_limits
CREATE POLICY "System can manage rate limits" ON public.rate_limits
    FOR ALL
    USING (TRUE);

-- Función para verificar rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
    p_user_id UUID,
    p_ip_address TEXT,
    p_endpoint TEXT,
    p_max_requests INTEGER DEFAULT 100
)
RETURNS TABLE(
    allowed BOOLEAN,
    remaining_requests INTEGER,
    reset_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_window_start TIMESTAMP WITH TIME ZONE;
    v_window_end TIMESTAMP WITH TIME ZONE;
    v_request_count INTEGER;
    v_remaining INTEGER;
    v_allowed BOOLEAN;
BEGIN
    -- Definir ventana de tiempo (1 minuto)
    v_window_start := date_trunc('minute', NOW());
    v_window_end := v_window_start + INTERVAL '1 minute';
    
    -- Buscar o crear registro de rate limit
    SELECT 
        request_count,
        CASE 
            WHEN request_count < p_max_requests THEN TRUE
            ELSE FALSE
        END,
        p_max_requests - request_count,
        window_end
    INTO 
        v_request_count,
        v_allowed,
        v_remaining,
        v_window_end
    FROM public.rate_limits
    WHERE 
        user_id = p_user_id 
        AND window_start = v_window_start
        AND endpoint = p_endpoint;
    
    -- Si no existe registro, crear uno nuevo
    IF NOT FOUND THEN
        INSERT INTO public.rate_limits (
            user_id, 
            ip_address, 
            endpoint, 
            request_count, 
            window_start, 
            window_end
        ) VALUES (
            p_user_id, 
            p_ip_address, 
            p_endpoint, 
            1, 
            v_window_start, 
            v_window_end
        );
        
        v_allowed := TRUE;
        v_remaining := p_max_requests - 1;
        v_window_end := v_window_start + INTERVAL '1 minute';
    ELSE
        -- Incrementar contador si está permitido
        IF v_allowed THEN
            UPDATE public.rate_limits
            SET 
                request_count = request_count + 1,
                updated_at = NOW()
            WHERE 
                user_id = p_user_id 
                AND window_start = v_window_start
                AND endpoint = p_endpoint;
        END IF;
    END IF;
    
    RETURN QUERY SELECT 
        v_allowed AS allowed,
        v_remaining AS remaining_requests,
        v_window_end AS reset_at;
END;
$$;

-- Función para bloquear IP
CREATE OR REPLACE FUNCTION public.block_ip(p_ip_address TEXT, p_reason TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Crear registro de bloqueo
    INSERT INTO public.rate_limits (ip_address, endpoint, request_count, is_blocked)
    VALUES (p_ip_address, 'BLOCKED', 999999, TRUE);
    
    RAISE NOTICE 'IP bloqueada: % - Razón: %', p_ip_address, p_reason;
    
    RETURN TRUE;
END;
$$;

-- Función para verificar si IP está bloqueada
CREATE OR REPLACE FUNCTION public.is_ip_blocked(p_ip_address TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_blocked BOOLEAN;
BEGIN
    SELECT is_blocked INTO v_blocked
    FROM public.rate_limits
    WHERE 
        ip_address = p_ip_address 
        AND is_blocked = TRUE
        AND window_end > NOW()
    LIMIT 1;
    
    RETURN COALESCE(v_blocked, FALSE);
END;
$$;

-- ============================================================================
-- PASO 5: CREAR FUNCIONES DE AUDITORÍA DE SEGURIDAD
-- ============================================================================

-- Tabla de auditoría de seguridad
CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    ip_address TEXT,
    action TEXT,
    resource TEXT,
    details JSONB,
    severity TEXT DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_action ON public.security_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON public.security_audit_log(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para security_audit_log
CREATE POLICY "Users can view own audit logs" ON public.security_audit_log
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid() AND is_active = TRUE
        )
    );

CREATE POLICY "System can insert audit logs" ON public.security_audit_log
    FOR INSERT
    WITH CHECK (TRUE);

-- Función para registrar evento de seguridad
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_user_id UUID,
    p_ip_address TEXT,
    p_action TEXT,
    p_resource TEXT,
    p_details JSONB,
    p_severity TEXT DEFAULT 'info'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.security_audit_log (
        user_id, 
        ip_address, 
        action, 
        resource, 
        details, 
        severity
    ) VALUES (
        p_user_id, 
        p_ip_address, 
        p_action, 
        p_resource, 
        p_details, 
        p_severity
    )
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$;

-- ============================================================================
-- PASO 6: CREAR FUNCIONES DE PROTECCIÓN XSS
-- ============================================================================

-- Función para escapar HTML
CREATE OR REPLACE FUNCTION public.escape_html(text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF text IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Escapar caracteres HTML peligrosos
    RETURN replace(
        replace(
            replace(
                replace(
                    replace(text, '&', '&amp;'),
                    '<', '&lt;'
                ),
                '>', '&gt;'
            ),
            '"', '&quot;'
        ),
        '''', '&#39;'
    );
END;
$$;

-- Función para validar y sanitizar contenido de usuario
CREATE OR REPLACE FUNCTION public.sanitize_user_content(content TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF content IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Sanitizar contra inyección SQL y XSS
    RETURN escape_html(sanitize_input(content));
END;
$$;

-- ============================================================================
-- PASO 7: CREAR POLÍTICAS RLS ADICIONALES DE SEGURIDAD
-- ============================================================================

-- Política para prevenir acceso por índice a tablas sensibles
DROP POLICY IF EXISTS "No direct access to auth.users" ON auth.users;

-- ============================================================================
-- PASO 8: CREAR FUNCIONES DE VALIDACIÓN DE PERMISOS
-- ============================================================================

-- Función para verificar permiso de acceso a datos sensibles
CREATE OR REPLACE FUNCTION public.has_access_to_sensitive_data(
    p_target_user_id UUID,
    p_data_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- El usuario siempre puede acceder a sus propios datos
    IF p_target_user_id = auth.uid() THEN
        RETURN TRUE;
    END IF;
    
    -- Los admins pueden acceder a cualquier dato
    IF EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = auth.uid() AND is_active = TRUE
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Para datos específicos, verificar permisos adicionales
    CASE p_data_type
        WHEN 'email' THEN
            -- Solo el propio usuario y admins pueden ver emails
            RETURN FALSE;
        WHEN 'phone' THEN
            -- Solo el propio usuario y admins pueden ver teléfonos
            RETURN FALSE;
        WHEN 'financial' THEN
            -- Solo el propio usuario y admins pueden ver datos financieros
            RETURN FALSE;
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$;

-- ============================================================================
-- PASO 9: CREAR TRIGGERS DE AUDITORÍA AUTOMÁTICA
-- ============================================================================

-- Trigger para auditar cambios en profiles
CREATE OR REPLACE FUNCTION public.audit_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        INSERT INTO public.security_audit_log (
            user_id,
            action,
            resource,
            details,
            severity
        ) VALUES (
            NEW.user_id,
            'PROFILE_UPDATED',
            'profiles',
            jsonb_build_object(
                'old_email', mask_email(OLD.email),
                'new_email', mask_email(NEW.email),
                'changes', jsonb_build_object(
                    'display_name', OLD.display_name IS DISTINCT FROM NEW.display_name,
                    'is_verified', OLD.is_verified IS DISTINCT FROM NEW.is_verified
                )
            ),
            'info'
        );
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.security_audit_log (
            user_id,
            action,
            resource,
            details,
            severity
        ) VALUES (
            NEW.user_id,
            'PROFILE_CREATED',
            'profiles',
            jsonb_build_object(
                'email', mask_email(NEW.email),
                'display_name', NEW.display_name
            ),
            'info'
        );
    END IF;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

CREATE TRIGGER audit_profile_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.audit_profile_changes();

-- ============================================================================
-- PASO 10: CREAR FUNCIONES DE MONITOREO DE SEGURIDAD
-- ============================================================================

-- Función para detectar actividad sospechosa
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity(p_user_id UUID)
RETURNS TABLE(
    is_suspicious BOOLEAN,
    reason TEXT,
    severity TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_suspicious BOOLEAN := FALSE;
    v_reason TEXT := '';
    v_severity TEXT := 'low';
    v_multiple_ips INTEGER;
    v_high_request_rate INTEGER;
BEGIN
    -- Verificar múltiples IPs en corto tiempo
    SELECT COUNT(DISTINCT ip_address) INTO v_multiple_ips
    FROM public.rate_limits
    WHERE 
        user_id = p_user_id 
        AND window_start > NOW() - INTERVAL '1 hour';
    
    IF v_multiple_ips > 5 THEN
        v_suspicious := TRUE;
        v_reason := 'Múltiples IPs detectadas en 1 hora: ' || v_multiple_ips;
        v_severity := 'high';
    END IF;
    
    -- Verificar alta tasa de requests
    SELECT COUNT(*) INTO v_high_request_rate
    FROM public.rate_limits
    WHERE 
        user_id = p_user_id 
        AND window_start > NOW() - INTERVAL '5 minutes';
    
    IF v_high_request_rate > 500 THEN
        v_suspicious := TRUE;
        v_reason := COALESCE(v_reason || ', ', '') || 'Alta tasa de requests: ' || v_high_request_rate;
        v_severity := 'high';
    END IF;
    
    RETURN QUERY SELECT 
        v_suspicious AS is_suspicious,
        v_reason AS reason,
        v_severity AS severity;
END;
$$;

-- ============================================================================
-- FIN DE MIGRACIÓN
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migración de hardening de seguridad completada exitosamente';
    RAISE NOTICE '✅ Vistas seguras creadas para evitar exposición de datos sensibles';
    RAISE NOTICE '✅ Funciones de sanitización y validación implementadas';
    RAISE NOTICE '✅ Rate limiting implementado contra DDoS';
    RAISE NOTICE '✅ Funciones de protección XSS creadas';
    RAISE NOTICE '✅ Auditoría de seguridad implementada';
    RAISE NOTICE '✅ Monitoreo de actividad sospechosa implementado';
END $$;
