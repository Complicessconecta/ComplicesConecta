

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE SCHEMA IF NOT EXISTS "private";


ALTER SCHEMA "private" OWNER TO "postgres";


COMMENT ON SCHEMA "private" IS 'Schema privado para materialized views y funciones internas';



COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "security";


ALTER SCHEMA "security" OWNER TO "postgres";


CREATE SCHEMA IF NOT EXISTS "stripe";


ALTER SCHEMA "stripe" OWNER TO "postgres";


COMMENT ON SCHEMA "stripe" IS 'Schema privado para Stripe FDW - NO exponer via API';



CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "private"."refresh_stripe_materialized_views"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY private.stripe_products;
  REFRESH MATERIALIZED VIEW CONCURRENTLY private.stripe_prices;
  
  RAISE NOTICE 'Stripe materialized views refreshed successfully';
END;
$$;


ALTER FUNCTION "private"."refresh_stripe_materialized_views"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."rotate_stripe_credentials"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_new_key TEXT;
BEGIN
  -- Aquí se integraría con Vault o sistema de rotación
  -- Por ahora, esto es un placeholder
  RAISE NOTICE 'Implementar rotación de credenciales con Vault';
END;
$$;


ALTER FUNCTION "private"."rotate_stripe_credentials"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_profile_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."audit_profile_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."block_ip"("p_ip_address" "text", "p_reason" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Crear registro de bloqueo
    INSERT INTO public.rate_limits (ip_address, endpoint, request_count, is_blocked)
    VALUES (p_ip_address, 'BLOCKED', 999999, TRUE);
    
    RAISE NOTICE 'IP bloqueada: % - Razón: %', p_ip_address, p_reason;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."block_ip"("p_ip_address" "text", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_rate_limit"("p_user_id" "uuid", "p_ip_address" "text", "p_endpoint" "text", "p_max_requests" integer DEFAULT 100) RETURNS TABLE("allowed" boolean, "remaining_requests" integer, "reset_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."check_rate_limit"("p_user_id" "uuid", "p_ip_address" "text", "p_endpoint" "text", "p_max_requests" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_stripe_customer"("p_user_id" "uuid", "p_email" "text" DEFAULT NULL::"text", "p_name" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("customer_id" "text", "success" boolean, "message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_customer_id TEXT;
  v_existing_customer TEXT;
BEGIN
  -- Verificar si el usuario ya tiene un customer
  SELECT stripe_customer_id INTO v_existing_customer
  FROM public.user_stripe_customers
  WHERE user_id = p_user_id;
  
  IF v_existing_customer IS NOT NULL THEN
    RETURN QUERY SELECT 
      v_existing_customer::TEXT,
      false::BOOLEAN,
      'User already has a Stripe customer'::TEXT;
    RETURN;
  END IF;
  
  -- Crear customer en Stripe via FDW INSERT
  INSERT INTO stripe.customers (email, name, metadata)
  VALUES (p_email, p_name, p_metadata)
  RETURNING id INTO v_customer_id;
  
  -- Guardar mapeo en tabla local
  INSERT INTO public.user_stripe_customers (user_id, stripe_customer_id, metadata)
  VALUES (p_user_id, v_customer_id, p_metadata)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN QUERY SELECT 
    v_customer_id::TEXT,
    true::BOOLEAN,
    'Stripe customer created successfully'::TEXT;
END;
$$;


ALTER FUNCTION "public"."create_stripe_customer"("p_user_id" "uuid", "p_email" "text", "p_name" "text", "p_metadata" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_stripe_customer"("p_user_id" "uuid", "p_email" "text", "p_name" "text", "p_metadata" "jsonb") IS 'Crea un Stripe customer para un usuario y lo mapea en user_stripe_customers';



CREATE OR REPLACE FUNCTION "public"."detect_suspicious_activity"("p_user_id" "uuid") RETURNS TABLE("is_suspicious" boolean, "reason" "text", "severity" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."detect_suspicious_activity"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."escape_html"("text" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."escape_html"("text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_access_to_sensitive_data"("p_target_user_id" "uuid", "p_data_type" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."has_access_to_sensitive_data"("p_target_user_id" "uuid", "p_data_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = auth.uid() AND is_active = TRUE
    );
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin_or_moderator"() RETURNS boolean
    LANGUAGE "sql" STABLE
    AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = auth.uid()
          AND role IN ('admin','superadmin','moderator')
    );
$$;


ALTER FUNCTION "public"."is_admin_or_moderator"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_ip_blocked"("p_ip_address" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."is_ip_blocked"("p_ip_address" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE user_id = auth.uid() AND role = 'super_admin' AND is_active = TRUE
    );
END;
$$;


ALTER FUNCTION "public"."is_super_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_valid_email"("email" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$_$;


ALTER FUNCTION "public"."is_valid_email"("email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_valid_uuid"("uuid" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $_$
BEGIN
    RETURN uuid ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
END;
$_$;


ALTER FUNCTION "public"."is_valid_uuid"("uuid" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_security_event"("p_user_id" "uuid", "p_ip_address" "text", "p_action" "text", "p_resource" "text", "p_details" "jsonb", "p_severity" "text" DEFAULT 'info'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."log_security_event"("p_user_id" "uuid", "p_ip_address" "text", "p_action" "text", "p_resource" "text", "p_details" "jsonb", "p_severity" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mask_email"("email" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."mask_email"("email" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mask_sensitive_data"("data" "text", "data_type" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."mask_sensitive_data"("data" "text", "data_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sanitize_input"("input_text" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."sanitize_input"("input_text" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sanitize_profile_inputs"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."sanitize_profile_inputs"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sanitize_user_content"("content" "text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF content IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Sanitizar contra inyección SQL y XSS
    RETURN escape_html(sanitize_input(content));
END;
$$;


ALTER FUNCTION "public"."sanitize_user_content"("content" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_club_applications_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_club_applications_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_couple_profiles_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_active = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_couple_profiles_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_gallery_permissions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_gallery_permissions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_invitations_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_invitations_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_profile_email"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF NEW.email IS NOT NULL AND NOT is_valid_email(NEW.email) THEN
        RAISE EXCEPTION 'Email inválido: %', NEW.email;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_profile_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "security"."check_exposed_credentials"() RETURNS TABLE("server_name" "text", "has_credentials" boolean, "severity" "text", "recommendation" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.srvname::TEXT as server_name,
    CASE 
      WHEN s.srvoptions::text LIKE '%api_key=%sk_%' THEN true
      ELSE false
    END as has_credentials,
    CASE 
      WHEN s.srvoptions::text LIKE '%api_key=%sk_%' THEN 'CRITICAL'
      ELSE 'LOW'
    END as severity,
    CASE 
      WHEN s.srvoptions::text LIKE '%api_key=%sk_%' THEN 'Migrate to Vault immediately'
      ELSE 'No action needed'
    END as recommendation
  FROM pg_foreign_server s
  WHERE s.srvname LIKE '%stripe%' OR s.srvname LIKE '%api%';
END;
$$;


ALTER FUNCTION "security"."check_exposed_credentials"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "security"."check_schema_permissions"() RETURNS TABLE("schemaname" "text", "nspowner" "text", "public_access" boolean, "severity" "text", "recommendation" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.nspname as schemaname,
    n.nspowner::regrole::text as nspowner,
    CASE 
      WHEN n.nspacl IS NULL THEN false
      WHEN n.nspacl::text LIKE '%PUBLIC%' THEN true
      ELSE false
    END as public_access,
    CASE 
      WHEN n.nspname IN ('stripe', 'private') AND n.nspacl::text LIKE '%PUBLIC%' THEN 'HIGH'
      WHEN n.nspname = 'public' THEN 'LOW'
      ELSE 'MEDIUM'
    END as severity,
    CASE 
      WHEN n.nspname IN ('stripe', 'private') AND n.nspacl::text LIKE '%PUBLIC%' THEN 'Revoke PUBLIC access immediately'
      WHEN n.nspname = 'public' THEN 'Review permissions'
      ELSE 'No action needed'
    END as recommendation
  FROM pg_namespace n
  WHERE n.nspname IN ('public', 'stripe', 'private')
  ORDER BY 
    CASE 
      WHEN n.nspname IN ('stripe', 'private') AND n.nspacl::text LIKE '%PUBLIC%' THEN 1
      ELSE 2
    END,
    n.nspname;
END;
$$;


ALTER FUNCTION "security"."check_schema_permissions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "security"."check_tables_without_rls"() RETURNS TABLE("schemaname" "text", "tablename" "text", "rowsecurity" boolean, "severity" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
      WHEN schemaname = 'public' AND rowsecurity = false THEN 'HIGH'
      WHEN schemaname = 'public' AND rowsecurity = true THEN 'LOW'
      ELSE 'MEDIUM'
    END as severity
  FROM pg_tables
  WHERE schemaname IN ('public', 'stripe', 'private')
  ORDER BY 
    CASE 
      WHEN schemaname = 'public' AND rowsecurity = false THEN 1
      ELSE 2
    END,
    schemaname,
    tablename;
END;
$$;


ALTER FUNCTION "security"."check_tables_without_rls"() OWNER TO "postgres";


CREATE FOREIGN DATA WRAPPER "stripe_wrapper" HANDLER "extensions"."stripe_fdw_handler" VALIDATOR "extensions"."stripe_fdw_validator";




CREATE SERVER "stripe_server" FOREIGN DATA WRAPPER "stripe_wrapper" OPTIONS (
    "api_key" 'sk_live_YOUR_NEW_STRIPE_SECRET_KEY_HERE',
    "api_url" 'https://api.stripe.com/v1/',
    "api_version" '2024-06-20'
);


ALTER SERVER "stripe_server" OWNER TO "postgres";


CREATE FOREIGN TABLE "stripe"."charges" (
    "id" "text",
    "object" "text",
    "amount" bigint,
    "amount_captured" bigint,
    "amount_refunded" bigint,
    "currency" "text",
    "created" timestamp with time zone,
    "customer" "text",
    "description" "text",
    "invoice" "text",
    "paid" boolean,
    "status" "text",
    "payment_intent" "text",
    "receipt_url" "text",
    "receipt_number" "text",
    "refunded" boolean,
    "metadata" "jsonb",
    "livemode" boolean
)
SERVER "stripe_server"
OPTIONS (
    "object" 'charges'
);


ALTER FOREIGN TABLE "stripe"."charges" OWNER TO "postgres";


CREATE FOREIGN TABLE "stripe"."customers" (
    "id" "text",
    "object" "text",
    "email" "text",
    "name" "text",
    "description" "text",
    "created" timestamp with time zone,
    "currency" "text",
    "default_source" "text",
    "invoice_settings" "jsonb",
    "metadata" "jsonb",
    "livemode" boolean,
    "tax_exempt" "text",
    "test_clock" "text"
)
SERVER "stripe_server"
OPTIONS (
    "object" 'customers'
);


ALTER FOREIGN TABLE "stripe"."customers" OWNER TO "postgres";


CREATE FOREIGN TABLE "stripe"."payment_intents" (
    "id" "text",
    "object" "text",
    "amount" bigint,
    "amount_capturable" bigint,
    "amount_received" bigint,
    "currency" "text",
    "created" timestamp with time zone,
    "customer" "text",
    "description" "text",
    "invoice" "text",
    "payment_method" "text",
    "status" "text",
    "next_action" "jsonb",
    "metadata" "jsonb",
    "livemode" boolean
)
SERVER "stripe_server"
OPTIONS (
    "object" 'payment_intents'
);


ALTER FOREIGN TABLE "stripe"."payment_intents" OWNER TO "postgres";


CREATE FOREIGN TABLE "stripe"."subscriptions" (
    "id" "text",
    "object" "text",
    "cancel_at_period_end" boolean,
    "cancel_at" timestamp with time zone,
    "canceled_at" timestamp with time zone,
    "collection_method" "text",
    "created" timestamp with time zone,
    "currency" "text",
    "current_period_end" timestamp with time zone,
    "current_period_start" timestamp with time zone,
    "customer" "text",
    "default_payment_method" "text",
    "items" "jsonb",
    "latest_invoice" "text",
    "livemode" boolean,
    "metadata" "jsonb",
    "plan" "jsonb",
    "status" "text",
    "trial_end" timestamp with time zone,
    "trial_start" timestamp with time zone
)
SERVER "stripe_server"
OPTIONS (
    "object" 'subscriptions'
);


ALTER FOREIGN TABLE "stripe"."subscriptions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "private"."admin_stripe_overview" AS
 SELECT 'customers'::"text" AS "entity_type",
    "count"(*) AS "total_count"
   FROM "stripe"."customers"
UNION ALL
 SELECT 'charges'::"text" AS "entity_type",
    "count"(*) AS "total_count"
   FROM "stripe"."charges"
UNION ALL
 SELECT 'subscriptions'::"text" AS "entity_type",
    "count"(*) AS "total_count"
   FROM "stripe"."subscriptions"
UNION ALL
 SELECT 'payment_intents'::"text" AS "entity_type",
    "count"(*) AS "total_count"
   FROM "stripe"."payment_intents";


ALTER TABLE "private"."admin_stripe_overview" OWNER TO "postgres";


CREATE FOREIGN TABLE "stripe"."prices" (
    "id" "text",
    "object" "text",
    "active" boolean,
    "billing_scheme" "text",
    "created" timestamp with time zone,
    "currency" "text",
    "custom_unit_amount" bigint,
    "livemode" boolean,
    "lookup_key" "text",
    "metadata" "jsonb",
    "nickname" "text",
    "product" "text",
    "recurring" "jsonb",
    "tax_behavior" "text",
    "tiers" "jsonb",
    "tiers_mode" "text",
    "transform_quantity" "jsonb",
    "type" "text",
    "unit_amount" bigint,
    "unit_amount_decimal" numeric
)
SERVER "stripe_server"
OPTIONS (
    "object" 'prices'
);


ALTER FOREIGN TABLE "stripe"."prices" OWNER TO "postgres";


CREATE FOREIGN TABLE "stripe"."products" (
    "id" "text",
    "object" "text",
    "active" boolean,
    "created" timestamp with time zone,
    "description" "text",
    "images" "text"[],
    "livemode" boolean,
    "metadata" "jsonb",
    "name" "text",
    "package_dimensions" "jsonb",
    "shippable" boolean,
    "statement_descriptor" "text",
    "tax_code" "text",
    "type" "text",
    "unit_label" "text",
    "updated" timestamp with time zone
)
SERVER "stripe_server"
OPTIONS (
    "object" 'products'
);


ALTER FOREIGN TABLE "stripe"."products" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE MATERIALIZED VIEW "private"."stripe_prices" AS
 SELECT "p"."id",
    "p"."object",
    "p"."active",
    "p"."billing_scheme",
    "p"."created",
    "p"."currency",
    "p"."livemode",
    "p"."lookup_key",
    "p"."nickname",
    "p"."product",
    "p"."recurring",
    "p"."tax_behavior",
    "p"."type",
    "p"."unit_amount",
    "p"."unit_amount_decimal",
    "p"."metadata",
    "pr"."name" AS "product_name",
    "pr"."description" AS "product_description"
   FROM ("stripe"."prices" "p"
     LEFT JOIN "stripe"."products" "pr" ON (("p"."product" = "pr"."id")))
  WHERE ("p"."active" = true)
  WITH NO DATA;


ALTER TABLE "private"."stripe_prices" OWNER TO "postgres";


CREATE MATERIALIZED VIEW "private"."stripe_products" AS
 SELECT "products"."id",
    "products"."object",
    "products"."active",
    "products"."created",
    "products"."description",
    "products"."images",
    "products"."name",
    "products"."statement_descriptor",
    "products"."type",
    "products"."updated",
    "products"."metadata"
   FROM "stripe"."products"
  WHERE ("products"."active" = true)
  WITH NO DATA;


ALTER TABLE "private"."stripe_products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'admin'::"text" NOT NULL,
    "granted_by" "uuid",
    "granted_at" timestamp with time zone DEFAULT "now"(),
    "is_active" boolean DEFAULT true,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "admin_users_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'super_admin'::"text"])))
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "event_name" "text" NOT NULL,
    "event_type" "text" DEFAULT 'user_behavior'::"text" NOT NULL,
    "properties" "jsonb" DEFAULT '{}'::"jsonb",
    "session_id" "text",
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."analytics_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_config" (
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "level" "text" NOT NULL,
    "message" "text" NOT NULL,
    "context" "jsonb",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "metric_name" "text" NOT NULL,
    "metric_value" numeric(18,8) NOT NULL,
    "metric_type" "text" NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blockchain_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "transaction_hash" character varying(66) NOT NULL,
    "transaction_type" "text" NOT NULL,
    "from_address" "text",
    "to_address" "text",
    "amount" bigint,
    "gas_used" bigint,
    "gas_price" bigint,
    "block_number" bigint,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "network" "text" DEFAULT 'mumbai'::"text" NOT NULL,
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "confirmed_at" timestamp with time zone,
    CONSTRAINT "blockchain_transactions_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."blockchain_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."career_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "position" "text" NOT NULL,
    "cover_letter" "text",
    "resume_url" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid"
);


ALTER TABLE "public"."career_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "room_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_rooms" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user1_id" "uuid" NOT NULL,
    "user2_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chat_rooms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_summaries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chat_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "content" "text" NOT NULL,
    "summary" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "sentiment" "text",
    "topics" "jsonb",
    "message_count" integer DEFAULT 0,
    "method" "text"
);


ALTER TABLE "public"."chat_summaries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."club_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "owner_name" "text" NOT NULL,
    "owner_age" integer NOT NULL,
    "owner_gender" "text" NOT NULL,
    "owner_rfc" "text" NOT NULL,
    "rep_name" "text",
    "rep_position" "text",
    "rep_phone" "text",
    "rep_email" "text",
    "club_name" "text" NOT NULL,
    "address" "text" NOT NULL,
    "city" "text" NOT NULL,
    "state" "text" NOT NULL,
    "zip_code" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "whatsapp" "text",
    "website" "text",
    "use_app_as_website" boolean DEFAULT false,
    "email" "text" NOT NULL,
    "description" "text" NOT NULL,
    "club_type" "text" NOT NULL,
    "hours" "text" NOT NULL,
    "capacity" integer NOT NULL,
    "documents_url" "text" NOT NULL,
    "company_rfc" "text",
    "license" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "rejection_reason" "text",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "club_applications_email_format" CHECK (("email" ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::"text")),
    CONSTRAINT "club_applications_owner_gender_check" CHECK (("owner_gender" = ANY (ARRAY['M'::"text", 'F'::"text"]))),
    CONSTRAINT "club_applications_owner_rfc_format" CHECK (("owner_rfc" ~ '^[A-Z&Ñ]{3,4}[0-9]{2}[0-9]{2}[0-9]{2}[0-9]{3}$'::"text")),
    CONSTRAINT "club_applications_phone_format" CHECK (("phone" ~ '^\+?[0-9\s\-\(\)]+$'::"text")),
    CONSTRAINT "club_applications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'review'::"text"])))
);


ALTER TABLE "public"."club_applications" OWNER TO "postgres";


COMMENT ON TABLE "public"."club_applications" IS 'Solicitudes de registro de clubs de terceros para verificación';



COMMENT ON COLUMN "public"."club_applications"."use_app_as_website" IS 'Si el club usará la app como su sitio web oficial';



COMMENT ON COLUMN "public"."club_applications"."documents_url" IS 'URL de documentos legales en Google Drive, Dropbox o similar';



COMMENT ON COLUMN "public"."club_applications"."status" IS 'Estado de la solicitud: pending, approved, rejected, review';



CREATE TABLE IF NOT EXISTS "public"."club_flyers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "club_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "is_active" boolean DEFAULT true NOT NULL,
    "ai_processing_status" "text",
    "watermark_applied" boolean DEFAULT false,
    "blur_applied" boolean DEFAULT false,
    "event_date" timestamp with time zone,
    "event_end_date" timestamp with time zone,
    "is_featured" boolean DEFAULT false
);


ALTER TABLE "public"."club_flyers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."club_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "club_id" "uuid" NOT NULL,
    "user_id" "uuid",
    "verified_by" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "submitted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "verified_at" timestamp with time zone,
    "notes" "text",
    "documents" "jsonb",
    "verification_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."club_verifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clubs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" character varying(255) NOT NULL,
    "description" "text",
    "address" "text" NOT NULL,
    "city" "text" NOT NULL,
    "state" "text",
    "country" "text",
    "latitude" numeric NOT NULL,
    "longitude" numeric NOT NULL,
    "phone" "text",
    "email" "text",
    "website" "text",
    "logo_url" "text",
    "cover_image_url" "text",
    "check_in_radius_meters" integer DEFAULT 50,
    "check_in_count" integer DEFAULT 0,
    "rating_average" numeric(3,2),
    "rating_count" integer DEFAULT 0,
    "review_count" integer DEFAULT 0,
    "total_reviews" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "is_featured" boolean DEFAULT false,
    "verified_at" timestamp with time zone,
    "verified_by" "uuid",
    "created_by" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."clubs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cmpx_purchases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "package_id" "uuid" NOT NULL,
    "cmpx_amount" numeric(18,8) NOT NULL,
    "bonus_cmpx" numeric(18,8) DEFAULT 0,
    "total_cmpx" numeric(18,8) NOT NULL,
    "price_mxn" numeric(18,2) NOT NULL,
    "price_usd" numeric(18,2),
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "payment_status" character varying(50) DEFAULT 'pending'::character varying,
    "stripe_payment_intent_id" character varying(255),
    "stripe_customer_id" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cmpx_purchases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."cmpx_shop_packages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "cmpx_amount" numeric(18,8) NOT NULL,
    "bonus_cmpx" numeric(18,8) DEFAULT 0,
    "price_mxn" numeric(18,2) NOT NULL,
    "price_usd" numeric(18,2),
    "is_popular" boolean DEFAULT false,
    "display_order" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."cmpx_shop_packages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consent_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "consent_type" "text" NOT NULL,
    "is_granted" boolean DEFAULT false NOT NULL,
    "is_paused" boolean DEFAULT false NOT NULL,
    "pause_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "consent_score" numeric(5,2),
    "confidence" numeric(5,2),
    "status" "text",
    "reasoning" "text",
    "message_count" integer,
    "chat_id" "uuid",
    "user_id1" "uuid",
    "user_id2" "uuid",
    "recipient_id" "uuid",
    "consent_level" "text",
    "explanation" "text",
    "suggested_action" "text"
);


ALTER TABLE "public"."consent_verifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."couple_agreements" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "couple_id" "uuid" NOT NULL,
    "partner_1_id" "uuid" NOT NULL,
    "partner_2_id" "uuid" NOT NULL,
    "partner_1_signature" boolean DEFAULT false NOT NULL,
    "partner_2_signature" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'PENDING'::"text" NOT NULL,
    "agreement_hash" "text" NOT NULL,
    "signed_at" timestamp with time zone,
    "dispute_deadline" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "couple_agreements_status_check" CHECK (("status" = ANY (ARRAY['PENDING'::"text", 'ACTIVE'::"text", 'DISPUTED'::"text", 'DISSOLVED'::"text", 'FORFEITED'::"text"])))
);


ALTER TABLE "public"."couple_agreements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."couple_disputes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "couple_agreement_id" "uuid" NOT NULL,
    "couple_id" "uuid",
    "initiated_by" "uuid" NOT NULL,
    "dispute_reason" "text" NOT NULL,
    "tokens_in_dispute" "jsonb",
    "nfts_in_dispute" "jsonb",
    "resolution_type" "text",
    "deadline_at" timestamp with time zone DEFAULT ("now"() + '72:00:00'::interval) NOT NULL,
    "status" "text" DEFAULT 'PENDING_AGREEMENT'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "couple_disputes_resolution_type_check" CHECK (("resolution_type" = ANY (ARRAY['AGREEMENT'::"text", 'ADMIN_FORFEIT'::"text", 'MANUAL'::"text"]))),
    CONSTRAINT "couple_disputes_status_check" CHECK (("status" = ANY (ARRAY['PENDING_AGREEMENT'::"text", 'RESOLVED_TRANSFERRED'::"text", 'EXPIRED_FORFEITED'::"text"])))
);


ALTER TABLE "public"."couple_disputes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."couple_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "couple_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "event_type" "text" NOT NULL,
    "location" "text",
    "date" timestamp with time zone NOT NULL,
    "max_participants" integer,
    "current_participants" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."couple_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."couple_nft_requests" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "token_id" bigint NOT NULL,
    "partner1_address" "text" NOT NULL,
    "partner2_address" "text" NOT NULL,
    "initiator_address" "text" NOT NULL,
    "metadata_uri" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "consent1_timestamp" timestamp with time zone,
    "consent2_timestamp" timestamp with time zone,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '24:00:00'::interval) NOT NULL,
    "blockchain_status" "text" DEFAULT 'pending'::"text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "couple_nft_requests_blockchain_status_check" CHECK (("blockchain_status" = ANY (ARRAY['pending'::"text", 'minting'::"text", 'minted'::"text", 'failed'::"text"]))),
    CONSTRAINT "couple_nft_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'minted'::"text", 'cancelled'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."couple_nft_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."couple_profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "partner_1_id" "uuid",
    "partner_2_id" "uuid",
    "status" "text" DEFAULT 'ACTIVE'::"text" NOT NULL,
    "is_demo" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "looking_for" character varying(50) DEFAULT 'friendship'::character varying,
    "experience_level" character varying(50) DEFAULT 'beginner'::character varying,
    "swinger_experience" character varying(50) DEFAULT 'beginner'::character varying,
    "interested_in" character varying(50) DEFAULT 'couples'::character varying,
    "max_distance" integer DEFAULT 50,
    "age_range_min" integer DEFAULT 18,
    "age_range_max" integer DEFAULT 65,
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "city" character varying(100),
    "state" character varying(100),
    "country" character varying(100),
    "location" character varying(200),
    "display_name" character varying(200),
    "preferred_theme" character varying(20) DEFAULT 'dark'::character varying,
    "is_public" boolean DEFAULT true,
    "privacy_settings" "jsonb" DEFAULT '{}'::"jsonb",
    "verification_level" integer DEFAULT 0,
    "last_active" timestamp with time zone DEFAULT "now"(),
    "profile_completed_at" timestamp with time zone,
    "total_views" integer DEFAULT 0,
    "total_likes" integer DEFAULT 0,
    "total_matches" integer DEFAULT 0,
    "profile_completeness" integer DEFAULT 0,
    "couple_interests" "text"[],
    "activities_interested" "text"[],
    "event_types" "text"[],
    "communication_preference" character varying(20) DEFAULT 'both'::character varying,
    "couple_age_range" character varying(20) DEFAULT '25-45'::character varying,
    "couple_height_range" character varying(20),
    "couple_body_type" character varying(50),
    "couple_lifestyle" character varying(50),
    "couple_availability" character varying(50),
    "age" integer,
    "is_verified" boolean DEFAULT false NOT NULL,
    "couple_images" "jsonb",
    CONSTRAINT "couple_profiles_communication_preference_check" CHECK ((("communication_preference")::"text" = ANY ((ARRAY['both'::character varying, 'male_only'::character varying, 'female_only'::character varying])::"text"[]))),
    CONSTRAINT "couple_profiles_experience_level_check" CHECK ((("experience_level")::"text" = ANY ((ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying, 'expert'::character varying])::"text"[]))),
    CONSTRAINT "couple_profiles_interested_in_check" CHECK ((("interested_in")::"text" = ANY ((ARRAY['singles'::character varying, 'couples'::character varying, 'both'::character varying, 'groups'::character varying])::"text"[]))),
    CONSTRAINT "couple_profiles_looking_for_check" CHECK ((("looking_for")::"text" = ANY ((ARRAY['friendship'::character varying, 'dating'::character varying, 'casual'::character varying, 'serious'::character varying, 'swinger'::character varying, 'threesome'::character varying, 'group'::character varying])::"text"[]))),
    CONSTRAINT "couple_profiles_preferred_theme_check" CHECK ((("preferred_theme")::"text" = ANY ((ARRAY['light'::character varying, 'dark'::character varying, 'auto'::character varying])::"text"[]))),
    CONSTRAINT "couple_profiles_profile_completeness_check" CHECK ((("profile_completeness" >= 0) AND ("profile_completeness" <= 100))),
    CONSTRAINT "couple_profiles_swinger_experience_check" CHECK ((("swinger_experience")::"text" = ANY ((ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying, 'expert'::character varying])::"text"[]))),
    CONSTRAINT "couple_profiles_verification_level_check" CHECK ((("verification_level" >= 0) AND ("verification_level" <= 3)))
);


ALTER TABLE "public"."couple_profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."couple_profiles"."is_demo" IS 'Indica si es un perfil de pareja de demostración';



COMMENT ON COLUMN "public"."couple_profiles"."looking_for" IS 'Qué está buscando la pareja (friendship, dating, casual, serious, swinger, threesome, group)';



COMMENT ON COLUMN "public"."couple_profiles"."experience_level" IS 'Nivel de experiencia general de la pareja en la plataforma';



COMMENT ON COLUMN "public"."couple_profiles"."swinger_experience" IS 'Nivel de experiencia específico en el lifestyle swinger';



COMMENT ON COLUMN "public"."couple_profiles"."interested_in" IS 'Tipo de personas que les interesan (singles, couples, both, groups)';



COMMENT ON COLUMN "public"."couple_profiles"."max_distance" IS 'Distancia máxima en kilómetros para matches';



COMMENT ON COLUMN "public"."couple_profiles"."age_range_min" IS 'Edad mínima para matches';



COMMENT ON COLUMN "public"."couple_profiles"."age_range_max" IS 'Edad máxima para matches';



COMMENT ON COLUMN "public"."couple_profiles"."latitude" IS 'Latitud de ubicación de la pareja';



COMMENT ON COLUMN "public"."couple_profiles"."longitude" IS 'Longitud de ubicación de la pareja';



COMMENT ON COLUMN "public"."couple_profiles"."display_name" IS 'Nombre para mostrar de la pareja';



COMMENT ON COLUMN "public"."couple_profiles"."is_public" IS 'Si el perfil de pareja es público o privado';



COMMENT ON COLUMN "public"."couple_profiles"."privacy_settings" IS 'Configuraciones de privacidad en formato JSON';



COMMENT ON COLUMN "public"."couple_profiles"."verification_level" IS 'Nivel de verificación de la pareja (0-3)';



COMMENT ON COLUMN "public"."couple_profiles"."couple_interests" IS 'Intereses específicos de la pareja';



COMMENT ON COLUMN "public"."couple_profiles"."activities_interested" IS 'Actividades que les interesan';



COMMENT ON COLUMN "public"."couple_profiles"."event_types" IS 'Tipos de eventos que prefieren';



COMMENT ON COLUMN "public"."couple_profiles"."communication_preference" IS 'Preferencia de comunicación (both, male_only, female_only)';



COMMENT ON COLUMN "public"."couple_profiles"."couple_age_range" IS 'Rango de edad de la pareja';



COMMENT ON COLUMN "public"."couple_profiles"."couple_lifestyle" IS 'Estilo de vida de la pareja';



CREATE TABLE IF NOT EXISTS "public"."daily_token_claims" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "claim_date" "date" NOT NULL,
    "amount_claimed" bigint DEFAULT 0 NOT NULL,
    "wallet_address" "text",
    "transaction_hash" character varying(66),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "token_type" "text" DEFAULT 'CMPX'::"text"
);


ALTER TABLE "public"."daily_token_claims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."digital_fingerprints" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "fingerprint_hash" "text" NOT NULL,
    "device_info" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_banned" boolean DEFAULT false NOT NULL,
    "canvas_hash" "text",
    "canvas_data" "text",
    "browser_fingerprint" "text",
    "worldid_nullifier_hash" "text",
    "combined_hash" "text",
    "ip_address" "text",
    "last_seen_at" timestamp with time zone
);


ALTER TABLE "public"."digital_fingerprints" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."error_alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "error_type" "text" NOT NULL,
    "error_message" "text" NOT NULL,
    "stack_trace" "text",
    "url" "text",
    "user_id" "uuid",
    "severity" "text" DEFAULT 'error'::"text" NOT NULL,
    "resolved" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."error_alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_participations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'confirmed'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."event_participations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."frozen_assets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "dispute_id" "uuid" NOT NULL,
    "asset_type" "text" NOT NULL,
    "asset_id" "text",
    "amount" numeric,
    "is_frozen" boolean DEFAULT true NOT NULL,
    "frozen_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "unfrozen_at" timestamp with time zone,
    "original_owner_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."frozen_assets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gallery_commissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "gallery_id" "uuid" NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "transaction_type" "text" NOT NULL,
    "amount_cmpx" numeric(18,8) NOT NULL,
    "creator_amount_cmpx" numeric(18,8) NOT NULL,
    "commission_amount_cmpx" numeric(18,8) NOT NULL,
    "creator_paid" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."gallery_commissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gallery_permissions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "profile_id" "uuid",
    "gallery_owner_id" "uuid",
    "status" "text" DEFAULT 'active'::"text",
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."gallery_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gallery_unlocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "gallery_item_id" "uuid" NOT NULL,
    "unlocked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "profile_id" "uuid"
);


ALTER TABLE "public"."gallery_unlocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."investment_tiers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "tier_key" character varying(50) NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "amount_mxn" numeric(18,2) NOT NULL,
    "return_percentage" numeric(5,2) DEFAULT 10.0 NOT NULL,
    "return_type" character varying(50) DEFAULT 'annual'::character varying,
    "cmpx_tokens_rewarded" numeric(18,8) DEFAULT 0 NOT NULL,
    "equity_percentage" numeric(5,2),
    "includes_equity" boolean DEFAULT false,
    "includes_vip_dinner" boolean DEFAULT false,
    "benefits" "jsonb" DEFAULT '[]'::"jsonb",
    "display_order" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."investment_tiers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."investments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "tier" character varying(50) NOT NULL,
    "amount_mxn" numeric(18,2) NOT NULL,
    "amount_usd" numeric(18,2),
    "return_percentage" numeric(5,2) NOT NULL,
    "return_type" character varying(50),
    "cmpx_tokens_rewarded" numeric(18,8),
    "equity_percentage" numeric(5,2),
    "includes_equity" boolean DEFAULT false,
    "includes_vip_dinner" boolean DEFAULT false,
    "benefits" "jsonb" DEFAULT '[]'::"jsonb",
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "payment_status" character varying(50) DEFAULT 'pending'::character varying,
    "payment_method" character varying(50),
    "stripe_payment_intent_id" character varying(255),
    "stripe_customer_id" character varying(255),
    "contract_signed" boolean DEFAULT false,
    "contract_signed_at" timestamp with time zone,
    "safte_contract_url" "text",
    "activated_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."investments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitation_statistics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "period_start" timestamp with time zone NOT NULL,
    "period_end" timestamp with time zone NOT NULL,
    "total_invitations" integer DEFAULT 0 NOT NULL,
    "pending_invitations" integer DEFAULT 0 NOT NULL,
    "accepted_invitations" integer DEFAULT 0 NOT NULL,
    "declined_invitations" integer DEFAULT 0 NOT NULL,
    "expired_invitations" integer DEFAULT 0 NOT NULL,
    "acceptance_rate" numeric(5,2),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."invitation_statistics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitation_templates" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "template_name" "text",
    "template_content" "text",
    "invitation_type" "text",
    "name" "text",
    "content" "text",
    "type" "text" DEFAULT 'default'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invitation_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "from_profile" "uuid",
    "to_profile" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "type" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "message" "text"
);


ALTER TABLE "public"."invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user1_id" "uuid" NOT NULL,
    "user2_id" "uuid" NOT NULL,
    "match_score" numeric(5,2) DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."media" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "profile_id" "uuid",
    "url" "text" NOT NULL,
    "type" "text" NOT NULL,
    "caption" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_public" boolean DEFAULT false,
    "file_name" "text",
    "file_path" "text",
    "file_url" "text",
    "file_type" "text",
    "mime_type" "text"
);


ALTER TABLE "public"."media" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text" NOT NULL,
    "sender_id" "uuid",
    "receiver_id" "uuid",
    "room_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moderation_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moderator_id" "uuid",
    "action" "text" NOT NULL,
    "target_type" "text" NOT NULL,
    "target_id" "uuid" NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."moderation_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moderator_payments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moderator_id" "uuid" NOT NULL,
    "payment_period_start" timestamp with time zone NOT NULL,
    "payment_period_end" timestamp with time zone NOT NULL,
    "total_minutes_worked" integer DEFAULT 0,
    "reports_reviewed" integer DEFAULT 0,
    "actions_taken" integer DEFAULT 0,
    "quality_score" numeric(5,2),
    "moderator_level" character varying(50),
    "total_revenue_mxn" numeric(18,2) NOT NULL,
    "revenue_percentage" numeric(5,2) NOT NULL,
    "payment_amount_mxn" numeric(18,2) NOT NULL,
    "payment_status" character varying(50) DEFAULT 'pending'::character varying,
    "payment_method" character varying(50),
    "payment_date" timestamp with time zone,
    "stripe_payout_id" character varying(255),
    "notes" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."moderator_payments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moderator_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reviewed_at" timestamp with time zone,
    "reviewed_by" "uuid",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "reason" "text"
);


ALTER TABLE "public"."moderator_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moderator_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "moderator_id" "uuid" NOT NULL,
    "session_start" timestamp with time zone DEFAULT "now"() NOT NULL,
    "session_end" timestamp with time zone,
    "is_active" boolean DEFAULT true NOT NULL,
    "total_minutes" integer DEFAULT 0 NOT NULL,
    "reports_reviewed" integer DEFAULT 0 NOT NULL,
    "actions_taken" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."moderator_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."moderators" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "moderator_id" character varying(255),
    "level" character varying(50) DEFAULT 'junior'::character varying,
    "role" character varying(50) DEFAULT 'moderator'::character varying,
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "is_active" boolean DEFAULT false,
    "permissions" "jsonb" DEFAULT '{}'::"jsonb",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "activated_at" timestamp with time zone,
    "suspended_at" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."moderators" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monitoring_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "user_id" "uuid",
    "start_time" timestamp with time zone DEFAULT "now"() NOT NULL,
    "end_time" timestamp with time zone,
    "url" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."monitoring_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nft_galleries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "is_private" boolean DEFAULT true NOT NULL,
    "is_verified" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "profile_id" "uuid",
    "nft_contract_address" "text",
    "gallery_name" "text",
    "nft_network" "text",
    "is_public" boolean DEFAULT false NOT NULL,
    "metadata" "jsonb"
);


ALTER TABLE "public"."nft_galleries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nft_gallery_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "gallery_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "title" "text",
    "description" "text",
    "is_verified" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "nft_network" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "metadata" "jsonb"
);


ALTER TABLE "public"."nft_gallery_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nft_staking" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_address" "text" NOT NULL,
    "nft_token_id" bigint NOT NULL,
    "staking_contract" "text" NOT NULL,
    "staked_at" timestamp with time zone DEFAULT "now"(),
    "vesting_period_days" integer NOT NULL,
    "rarity_multiplier" integer DEFAULT 100 NOT NULL,
    "last_claim_at" timestamp with time zone,
    "total_rewards_claimed" bigint DEFAULT 0,
    "is_active" boolean DEFAULT true NOT NULL,
    "network" "text" DEFAULT 'mumbai'::"text" NOT NULL,
    "is_staked" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."nft_staking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nft_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "nft_contract_address" "text" NOT NULL,
    "nft_token_id" "text" NOT NULL,
    "network" "text" NOT NULL,
    "minted_with_gtk" numeric(18,8) DEFAULT 0 NOT NULL,
    "staking_record_id" "uuid",
    "verified_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."nft_verifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "read" boolean DEFAULT false,
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."performance_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "metric_name" "text" NOT NULL,
    "metric_value" numeric(18,8) NOT NULL,
    "metric_type" "text" NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."performance_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permanent_bans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "reason" "text" NOT NULL,
    "banned_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fingerprint_ids" "text"[],
    "ban_reason" "text" DEFAULT 'violation'::"text" NOT NULL,
    "banned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "combined_hash" "text",
    "canvas_hash" "text",
    "worldid_nullifier_hash" "text",
    "severity" "text" DEFAULT 'high'::"text" NOT NULL,
    "evidence" "jsonb"
);


ALTER TABLE "public"."permanent_bans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "profile_id" "uuid",
    "content" "text" NOT NULL,
    "post_type" character varying(50) DEFAULT 'text'::character varying,
    "image_url" "text",
    "video_url" "text",
    "location" "text",
    "is_public" boolean DEFAULT true,
    "is_premium" boolean DEFAULT false,
    "likes_count" integer DEFAULT 0,
    "comments_count" integer DEFAULT 0,
    "shares_count" integer DEFAULT 0,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "display_name" "text",
    "is_demo" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_premium" boolean DEFAULT false,
    "name" "text",
    "age" integer,
    "gender" "text",
    "location" "text",
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "nft_contract_address" "text",
    "nft_token_id" "text",
    "network" "text",
    "minted_with_gtk" numeric(18,8) DEFAULT 0 NOT NULL,
    "staking_record_id" "uuid",
    "verified_at" timestamp with time zone,
    "is_active" boolean DEFAULT true NOT NULL,
    "is_blocked" boolean DEFAULT false NOT NULL,
    "bio" "text",
    "avatar_url" "text",
    "interests" "text"[],
    "is_verified" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rate_limits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "ip_address" "text",
    "endpoint" "text",
    "request_count" integer DEFAULT 0,
    "window_start" timestamp with time zone DEFAULT "now"(),
    "window_end" timestamp with time zone DEFAULT ("now"() + '00:01:00'::interval),
    "is_blocked" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."rate_limits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referral_statistics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "total_conversions" integer DEFAULT 0 NOT NULL,
    "conversion_rate" numeric(5,2) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."referral_statistics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referral_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "referrer_id" "uuid" NOT NULL,
    "amount" numeric(18,8) NOT NULL,
    "transaction_type" "text" DEFAULT 'reward'::"text" NOT NULL,
    "wallet_address" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "balance_before" numeric(18,8) DEFAULT 0 NOT NULL,
    "balance_after" numeric(18,8) DEFAULT 0 NOT NULL,
    "description" "text",
    "metadata" "jsonb"
);


ALTER TABLE "public"."referral_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."report_ai_classification" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "report_id" "uuid" NOT NULL,
    "ai_confidence" numeric(5,2),
    "ai_severity" "text" NOT NULL,
    "ai_category" "text" NOT NULL,
    "ai_reasoning" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ai_tags" "text"[],
    "ai_summary" "text",
    "detected_toxicity" integer,
    "detected_spam" integer,
    "detected_explicit" integer,
    "detected_harassment" integer,
    "suggested_priority" "text",
    "suggested_action" "text",
    "ai_model_version" "text"
);


ALTER TABLE "public"."report_ai_classification" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reporter_user_id" "uuid",
    "reported_user_id" "uuid",
    "content_type" "text" NOT NULL,
    "report_type" "text" DEFAULT 'profile'::"text" NOT NULL,
    "reported_content_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "description" "text",
    "severity" "text" DEFAULT 'medium'::"text",
    "status" "text" DEFAULT 'pending'::"text",
    "resolution_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    CONSTRAINT "reports_severity_check" CHECK (("severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "reports_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'investigating'::"text", 'resolved'::"text", 'dismissed'::"text"])))
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "event_type" "text" NOT NULL,
    "description" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ip_address" "text",
    "fingerprint_ids" "text"[],
    "details" "jsonb",
    "nullifier_hash" "text"
);


ALTER TABLE "public"."security" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "ip_address" "text",
    "action" "text",
    "resource" "text",
    "details" "jsonb",
    "severity" "text" DEFAULT 'info'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."security_audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "action" character varying(255) NOT NULL,
    "resource" character varying(255) NOT NULL,
    "session_id" character varying(255),
    "ip_address" "inet",
    "user_agent" "text",
    "risk_score" numeric(5,2),
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."security_audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staking_records" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount" numeric(18,8) NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "rewards_earned" numeric(18,8) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."staking_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "description" "text",
    "content_type" "text" DEFAULT 'text'::"text" NOT NULL,
    "content_url" "text",
    "location" "text",
    "is_public" boolean DEFAULT true NOT NULL,
    "views_count" bigint DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."stories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_comments" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "story_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "parent_comment_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."story_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_likes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "story_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."story_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."story_shares" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "story_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "shared_to" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."story_shares" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."stripe_prices_view" AS
 SELECT "stripe_prices"."id",
    "stripe_prices"."object",
    "stripe_prices"."active",
    "stripe_prices"."billing_scheme",
    "stripe_prices"."created",
    "stripe_prices"."currency",
    "stripe_prices"."livemode",
    "stripe_prices"."lookup_key",
    "stripe_prices"."nickname",
    "stripe_prices"."product",
    "stripe_prices"."recurring",
    "stripe_prices"."tax_behavior",
    "stripe_prices"."type",
    "stripe_prices"."unit_amount",
    "stripe_prices"."unit_amount_decimal",
    "stripe_prices"."metadata",
    "stripe_prices"."product_name",
    "stripe_prices"."product_description"
   FROM "private"."stripe_prices"
  WHERE ("stripe_prices"."active" = true);


ALTER TABLE "public"."stripe_prices_view" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."stripe_products_view" AS
 SELECT "stripe_products"."id",
    "stripe_products"."object",
    "stripe_products"."active",
    "stripe_products"."created",
    "stripe_products"."description",
    "stripe_products"."images",
    "stripe_products"."name",
    "stripe_products"."statement_descriptor",
    "stripe_products"."type",
    "stripe_products"."updated",
    "stripe_products"."metadata"
   FROM "private"."stripe_products"
  WHERE ("stripe_products"."active" = true);


ALTER TABLE "public"."stripe_products_view" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."summary_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "summary_id" "uuid",
    "user_id" "uuid",
    "rating" integer NOT NULL,
    "feedback" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_helpful" boolean,
    CONSTRAINT "summary_feedback_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."summary_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."summary_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "content" "text",
    "summary" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    "chat_id" "uuid",
    "sentiment" "text"
);


ALTER TABLE "public"."summary_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."swinger_interests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."swinger_interests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."testnet_token_claims" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "amount_claimed" bigint DEFAULT 0 NOT NULL,
    "claimed_at" timestamp with time zone DEFAULT "now"(),
    "transaction_hash" character varying(66),
    "wallet_address" "text",
    "network" "text" DEFAULT 'mumbai'::"text",
    "token_type" "text" DEFAULT 'CMPX'::"text"
);


ALTER TABLE "public"."testnet_token_claims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."token_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "period_type" character varying(50) NOT NULL,
    "period_start" timestamp with time zone NOT NULL,
    "period_end" timestamp with time zone NOT NULL,
    "total_cmpx_supply" numeric(18,8) NOT NULL,
    "total_gtk_supply" numeric(18,8) NOT NULL,
    "circulating_cmpx" numeric(18,8) NOT NULL,
    "circulating_gtk" numeric(18,8) NOT NULL,
    "transaction_count" integer DEFAULT 0,
    "transaction_volume_cmpx" numeric(18,8) DEFAULT 0,
    "transaction_volume_gtk" numeric(18,8) DEFAULT 0,
    "total_staked_cmpx" numeric(18,8) DEFAULT 0,
    "active_stakers" integer DEFAULT 0,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."token_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."token_staking" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_address" "text" NOT NULL,
    "amount_staked" bigint NOT NULL,
    "staking_contract" "text" NOT NULL,
    "staked_at" timestamp with time zone DEFAULT "now"(),
    "vesting_period_days" integer NOT NULL,
    "last_claim_at" timestamp with time zone,
    "total_rewards_claimed" bigint DEFAULT 0,
    "is_active" boolean DEFAULT true NOT NULL,
    "network" "text" DEFAULT 'mumbai'::"text" NOT NULL,
    "is_staked" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."token_staking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."token_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token_type" "text" NOT NULL,
    "transaction_type" "text" NOT NULL,
    "amount" numeric(18,8) NOT NULL,
    "balance_after" numeric(18,8) NOT NULL,
    "description" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."token_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_consents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "document_path" "text" NOT NULL,
    "consent_type" "text" NOT NULL,
    "ip_address" "inet" NOT NULL,
    "user_agent" "text",
    "consent_text_hash" "text" NOT NULL,
    "consented_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true NOT NULL,
    "revoked_at" timestamp with time zone,
    "version" "text" DEFAULT '1.0'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_consents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_device_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "device_token" "text" NOT NULL,
    "platform" "text" DEFAULT 'web'::"text" NOT NULL,
    "provider" "text" DEFAULT 'onesignal'::"text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_device_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_interests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "interest_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_interests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_nfts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "token_id" bigint NOT NULL,
    "owner_address" "text" NOT NULL,
    "metadata_uri" "text" NOT NULL,
    "rarity" "text" DEFAULT 'common'::"text" NOT NULL,
    "is_couple" boolean DEFAULT false NOT NULL,
    "partner_address" "text",
    "contract_address" "text" DEFAULT '0x0000000000000000000000000000000000000000'::"text",
    "network" "text" DEFAULT 'mumbai'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_staked" boolean DEFAULT false,
    "staked_at" timestamp with time zone,
    CONSTRAINT "user_nfts_rarity_check" CHECK (("rarity" = ANY (ARRAY['common'::"text", 'rare'::"text", 'epic'::"text", 'legendary'::"text"])))
);


ALTER TABLE "public"."user_nfts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_referral_balances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "referral_code" "text" NOT NULL,
    "total_referrals" integer DEFAULT 0 NOT NULL,
    "total_earned" numeric(18,8) DEFAULT 0 NOT NULL,
    "monthly_earned" numeric(18,8) DEFAULT 0 NOT NULL,
    "cmpx_balance" numeric(18,8) DEFAULT 0 NOT NULL,
    "gtk_balance" numeric(18,8) DEFAULT 0 NOT NULL,
    "last_reset_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_referral_balances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_referral_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "total_referrals" integer DEFAULT 0 NOT NULL,
    "total_earned" numeric(18,8) DEFAULT 0 NOT NULL,
    "monthly_earned" numeric(18,8) DEFAULT 0 NOT NULL,
    "cmpx_balance" numeric(18,8) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_referral_stats" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "assigned_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_roles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'moderator'::"text", 'support'::"text"])))
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_stripe_customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stripe_customer_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."user_stripe_customers" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_stripe_customers" IS 'Mapeo entre usuarios de Supabase Auth y customers de Stripe';



CREATE TABLE IF NOT EXISTS "public"."user_suspensions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "suspended_by" "uuid",
    "reason" "text" NOT NULL,
    "suspended_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expires_at" timestamp with time zone,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."user_suspensions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_token_balances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "cmpx_balance" numeric(18,8) DEFAULT 0 NOT NULL,
    "gtk_balance" numeric(18,8) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_token_balances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_wallets" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "address" character varying(42) NOT NULL,
    "encrypted_private_key" "text" NOT NULL,
    "network" character varying(20) DEFAULT 'mumbai'::character varying NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_wallets" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."users_safe" AS
 SELECT "users"."id",
    "users"."created_at",
    "users"."updated_at",
    "users"."last_sign_in_at",
    "users"."email_confirmed_at",
    "users"."raw_app_meta_data",
    "users"."raw_user_meta_data"
   FROM "auth"."users";


ALTER TABLE "public"."users_safe" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."virtual_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "event_type" character varying(50) NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "location" "text",
    "max_participants" integer,
    "status" character varying(50) DEFAULT 'scheduled'::character varying,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."virtual_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."web_vitals_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "metric_name" "text" NOT NULL,
    "metric_value" numeric(18,8) NOT NULL,
    "metric_type" "text" NOT NULL,
    "user_id" "uuid",
    "url" "text",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."web_vitals_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."worldid_rewards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "amount" numeric(18,8) NOT NULL,
    "reward_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."worldid_rewards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."worldid_statistics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "period_start" timestamp with time zone NOT NULL,
    "period_end" timestamp with time zone NOT NULL,
    "total_verifications" integer DEFAULT 0 NOT NULL,
    "total_rewards" numeric(18,8) DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."worldid_statistics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."worldid_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "nullifier_hash" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "verified_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "verification_level" "text",
    "expires_at" timestamp with time zone
);


ALTER TABLE "public"."worldid_verifications" OWNER TO "postgres";


CREATE OR REPLACE VIEW "security"."security_dashboard" AS
 SELECT 'tables_without_rls'::"text" AS "check_type",
    "count"(*) AS "issues",
    "max"("check_tables_without_rls"."severity") AS "max_severity"
   FROM "security"."check_tables_without_rls"() "check_tables_without_rls"("schemaname", "tablename", "rowsecurity", "severity")
  WHERE ("check_tables_without_rls"."rowsecurity" = false)
UNION ALL
 SELECT 'exposed_credentials'::"text" AS "check_type",
    "count"(*) AS "issues",
    "max"("check_exposed_credentials"."severity") AS "max_severity"
   FROM "security"."check_exposed_credentials"() "check_exposed_credentials"("server_name", "has_credentials", "severity", "recommendation")
  WHERE ("check_exposed_credentials"."has_credentials" = true)
UNION ALL
 SELECT 'schema_permissions'::"text" AS "check_type",
    "count"(*) AS "issues",
    "max"("check_schema_permissions"."severity") AS "max_severity"
   FROM "security"."check_schema_permissions"() "check_schema_permissions"("schemaname", "nspowner", "public_access", "severity", "recommendation")
  WHERE ("check_schema_permissions"."public_access" = true);


ALTER TABLE "security"."security_dashboard" OWNER TO "postgres";


CREATE FOREIGN TABLE "stripe"."balance_transactions" (
    "id" "text",
    "object" "text",
    "amount" bigint,
    "currency" "text",
    "net" bigint,
    "gross" bigint,
    "fee" bigint,
    "created" timestamp with time zone,
    "available_on" timestamp with time zone,
    "reporting_category" "text",
    "description" "text",
    "source" "text",
    "type" "text",
    "metadata" "jsonb",
    "exchange_rate" numeric
)
SERVER "stripe_server"
OPTIONS (
    "object" 'balance_transactions'
);


ALTER FOREIGN TABLE "stripe"."balance_transactions" OWNER TO "postgres";


CREATE FOREIGN TABLE "stripe"."invoices" (
    "id" "text",
    "object" "text",
    "account_country" "text",
    "account_name" "text",
    "amount_due" bigint,
    "amount_paid" bigint,
    "amount_remaining" bigint,
    "currency" "text",
    "created" timestamp with time zone,
    "customer" "text",
    "description" "text",
    "hosted_invoice_url" "text",
    "invoice_pdf" "text",
    "paid" boolean,
    "status" "text",
    "subscription" "text",
    "total" bigint,
    "metadata" "jsonb",
    "livemode" boolean
)
SERVER "stripe_server"
OPTIONS (
    "object" 'invoices'
);


ALTER FOREIGN TABLE "stripe"."invoices" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_config"
    ADD CONSTRAINT "app_config_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."app_logs"
    ADD CONSTRAINT "app_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_metrics"
    ADD CONSTRAINT "app_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blockchain_transactions"
    ADD CONSTRAINT "blockchain_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blockchain_transactions"
    ADD CONSTRAINT "blockchain_transactions_transaction_hash_key" UNIQUE ("transaction_hash");



ALTER TABLE ONLY "public"."career_applications"
    ADD CONSTRAINT "career_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_rooms"
    ADD CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_rooms"
    ADD CONSTRAINT "chat_rooms_user1_id_user2_id_key" UNIQUE ("user1_id", "user2_id");



ALTER TABLE ONLY "public"."chat_summaries"
    ADD CONSTRAINT "chat_summaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."club_applications"
    ADD CONSTRAINT "club_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."club_flyers"
    ADD CONSTRAINT "club_flyers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."club_verifications"
    ADD CONSTRAINT "club_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clubs"
    ADD CONSTRAINT "clubs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clubs"
    ADD CONSTRAINT "clubs_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."cmpx_purchases"
    ADD CONSTRAINT "cmpx_purchases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."cmpx_shop_packages"
    ADD CONSTRAINT "cmpx_shop_packages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consent_verifications"
    ADD CONSTRAINT "consent_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."couple_agreements"
    ADD CONSTRAINT "couple_agreements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."couple_disputes"
    ADD CONSTRAINT "couple_disputes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."couple_events"
    ADD CONSTRAINT "couple_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."couple_nft_requests"
    ADD CONSTRAINT "couple_nft_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."couple_profiles"
    ADD CONSTRAINT "couple_profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_token_claims"
    ADD CONSTRAINT "daily_token_claims_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."digital_fingerprints"
    ADD CONSTRAINT "digital_fingerprints_fingerprint_hash_key" UNIQUE ("fingerprint_hash");



ALTER TABLE ONLY "public"."digital_fingerprints"
    ADD CONSTRAINT "digital_fingerprints_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."error_alerts"
    ADD CONSTRAINT "error_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_participations"
    ADD CONSTRAINT "event_participations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."frozen_assets"
    ADD CONSTRAINT "frozen_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gallery_commissions"
    ADD CONSTRAINT "gallery_commissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gallery_permissions"
    ADD CONSTRAINT "gallery_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gallery_unlocks"
    ADD CONSTRAINT "gallery_unlocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."investment_tiers"
    ADD CONSTRAINT "investment_tiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."investment_tiers"
    ADD CONSTRAINT "investment_tiers_tier_key_key" UNIQUE ("tier_key");



ALTER TABLE ONLY "public"."investments"
    ADD CONSTRAINT "investments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitation_statistics"
    ADD CONSTRAINT "invitation_statistics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitation_templates"
    ADD CONSTRAINT "invitation_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_user1_id_user2_id_key" UNIQUE ("user1_id", "user2_id");



ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moderation_logs"
    ADD CONSTRAINT "moderation_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moderator_payments"
    ADD CONSTRAINT "moderator_payments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moderator_requests"
    ADD CONSTRAINT "moderator_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moderator_sessions"
    ADD CONSTRAINT "moderator_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moderators"
    ADD CONSTRAINT "moderators_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monitoring_sessions"
    ADD CONSTRAINT "monitoring_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monitoring_sessions"
    ADD CONSTRAINT "monitoring_sessions_session_id_key" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."nft_galleries"
    ADD CONSTRAINT "nft_galleries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nft_gallery_images"
    ADD CONSTRAINT "nft_gallery_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nft_staking"
    ADD CONSTRAINT "nft_staking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nft_verifications"
    ADD CONSTRAINT "nft_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."performance_metrics"
    ADD CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permanent_bans"
    ADD CONSTRAINT "permanent_bans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."rate_limits"
    ADD CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_statistics"
    ADD CONSTRAINT "referral_statistics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_transactions"
    ADD CONSTRAINT "referral_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."report_ai_classification"
    ADD CONSTRAINT "report_ai_classification_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_audit_log"
    ADD CONSTRAINT "security_audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_audit_logs"
    ADD CONSTRAINT "security_audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security"
    ADD CONSTRAINT "security_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staking_records"
    ADD CONSTRAINT "staking_records_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stories"
    ADD CONSTRAINT "stories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."story_comments"
    ADD CONSTRAINT "story_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."story_likes"
    ADD CONSTRAINT "story_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."story_likes"
    ADD CONSTRAINT "story_likes_story_id_user_id_key" UNIQUE ("story_id", "user_id");



ALTER TABLE ONLY "public"."story_shares"
    ADD CONSTRAINT "story_shares_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."summary_feedback"
    ADD CONSTRAINT "summary_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."summary_requests"
    ADD CONSTRAINT "summary_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."swinger_interests"
    ADD CONSTRAINT "swinger_interests_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."swinger_interests"
    ADD CONSTRAINT "swinger_interests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."testnet_token_claims"
    ADD CONSTRAINT "testnet_token_claims_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."token_analytics"
    ADD CONSTRAINT "token_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."token_staking"
    ADD CONSTRAINT "token_staking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."token_transactions"
    ADD CONSTRAINT "token_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_token_claims"
    ADD CONSTRAINT "unique_user_daily_claim" UNIQUE ("user_id", "claim_date");



ALTER TABLE ONLY "public"."user_wallets"
    ADD CONSTRAINT "unique_user_wallet" UNIQUE ("user_id", "network");



ALTER TABLE ONLY "public"."user_consents"
    ADD CONSTRAINT "user_consents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_device_tokens"
    ADD CONSTRAINT "user_device_tokens_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_device_tokens"
    ADD CONSTRAINT "user_device_tokens_user_id_device_token_key" UNIQUE ("user_id", "device_token");



ALTER TABLE ONLY "public"."user_interests"
    ADD CONSTRAINT "user_interests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_interests"
    ADD CONSTRAINT "user_interests_user_id_interest_id_key" UNIQUE ("user_id", "interest_id");



ALTER TABLE ONLY "public"."user_nfts"
    ADD CONSTRAINT "user_nfts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_referral_balances"
    ADD CONSTRAINT "user_referral_balances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_referral_balances"
    ADD CONSTRAINT "user_referral_balances_referral_code_key" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."user_referral_stats"
    ADD CONSTRAINT "user_referral_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_stripe_customers"
    ADD CONSTRAINT "user_stripe_customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_stripe_customers"
    ADD CONSTRAINT "user_stripe_customers_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "public"."user_suspensions"
    ADD CONSTRAINT "user_suspensions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_token_balances"
    ADD CONSTRAINT "user_token_balances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_token_balances"
    ADD CONSTRAINT "user_token_balances_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_wallets"
    ADD CONSTRAINT "user_wallets_address_key" UNIQUE ("address");



ALTER TABLE ONLY "public"."user_wallets"
    ADD CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."virtual_events"
    ADD CONSTRAINT "virtual_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."web_vitals_history"
    ADD CONSTRAINT "web_vitals_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."worldid_rewards"
    ADD CONSTRAINT "worldid_rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."worldid_statistics"
    ADD CONSTRAINT "worldid_statistics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."worldid_verifications"
    ADD CONSTRAINT "worldid_verifications_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_admin_users_is_active" ON "public"."admin_users" USING "btree" ("is_active");



CREATE INDEX "idx_admin_users_user_id" ON "public"."admin_users" USING "btree" ("user_id");



CREATE INDEX "idx_analytics_events_user" ON "public"."analytics_events" USING "btree" ("user_id");



CREATE INDEX "idx_app_logs_created_at" ON "public"."app_logs" USING "btree" ("created_at");



CREATE INDEX "idx_app_logs_level" ON "public"."app_logs" USING "btree" ("level");



CREATE INDEX "idx_app_logs_user_id" ON "public"."app_logs" USING "btree" ("user_id");



CREATE INDEX "idx_app_metrics_metric_name" ON "public"."app_metrics" USING "btree" ("metric_name");



CREATE INDEX "idx_app_metrics_user_id" ON "public"."app_metrics" USING "btree" ("user_id");



CREATE INDEX "idx_career_applications_user_id" ON "public"."career_applications" USING "btree" ("user_id");



CREATE INDEX "idx_chat_messages_room_id" ON "public"."chat_messages" USING "btree" ("room_id");



CREATE INDEX "idx_chat_messages_sender_id" ON "public"."chat_messages" USING "btree" ("sender_id");



CREATE INDEX "idx_chat_rooms_user1_id" ON "public"."chat_rooms" USING "btree" ("user1_id");



CREATE INDEX "idx_chat_rooms_user2_id" ON "public"."chat_rooms" USING "btree" ("user2_id");



CREATE INDEX "idx_chat_summaries_chat_id" ON "public"."chat_summaries" USING "btree" ("chat_id");



CREATE INDEX "idx_chat_summaries_user_id" ON "public"."chat_summaries" USING "btree" ("user_id");



CREATE INDEX "idx_club_applications_city" ON "public"."club_applications" USING "btree" ("city");



CREATE INDEX "idx_club_applications_created_at" ON "public"."club_applications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_club_applications_state" ON "public"."club_applications" USING "btree" ("state");



CREATE INDEX "idx_club_applications_status" ON "public"."club_applications" USING "btree" ("status");



CREATE INDEX "idx_club_flyers_club_id" ON "public"."club_flyers" USING "btree" ("club_id");



CREATE INDEX "idx_club_verifications_club_id" ON "public"."club_verifications" USING "btree" ("club_id");



CREATE INDEX "idx_clubs_city" ON "public"."clubs" USING "btree" ("city");



CREATE INDEX "idx_clubs_created_at" ON "public"."clubs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_clubs_is_active" ON "public"."clubs" USING "btree" ("is_active");



CREATE INDEX "idx_clubs_is_featured" ON "public"."clubs" USING "btree" ("is_featured");



CREATE INDEX "idx_clubs_slug" ON "public"."clubs" USING "btree" ("slug");



CREATE INDEX "idx_cmpx_purchases_created_at" ON "public"."cmpx_purchases" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_cmpx_purchases_status" ON "public"."cmpx_purchases" USING "btree" ("status");



CREATE INDEX "idx_cmpx_purchases_user_id" ON "public"."cmpx_purchases" USING "btree" ("user_id");



CREATE INDEX "idx_cmpx_shop_packages_display_order" ON "public"."cmpx_shop_packages" USING "btree" ("display_order");



CREATE INDEX "idx_cmpx_shop_packages_is_active" ON "public"."cmpx_shop_packages" USING "btree" ("is_active");



CREATE INDEX "idx_consent_verifications_user_id" ON "public"."consent_verifications" USING "btree" ("user_id");



CREATE INDEX "idx_couple_agreements_status" ON "public"."couple_agreements" USING "btree" ("status", "dispute_deadline");



CREATE INDEX "idx_couple_disputes_couple" ON "public"."couple_disputes" USING "btree" ("couple_id", "status");



CREATE INDEX "idx_couple_disputes_deadline" ON "public"."couple_disputes" USING "btree" ("deadline_at", "status");



CREATE INDEX "idx_couple_events_couple_id" ON "public"."couple_events" USING "btree" ("couple_id");



CREATE INDEX "idx_couple_profiles_age_range" ON "public"."couple_profiles" USING "btree" ("age_range_min", "age_range_max");



CREATE INDEX "idx_couple_profiles_experience_level" ON "public"."couple_profiles" USING "btree" ("experience_level");



CREATE INDEX "idx_couple_profiles_interested_in" ON "public"."couple_profiles" USING "btree" ("interested_in");



CREATE INDEX "idx_couple_profiles_is_public" ON "public"."couple_profiles" USING "btree" ("is_public");



CREATE INDEX "idx_couple_profiles_last_active" ON "public"."couple_profiles" USING "btree" ("last_active");



CREATE INDEX "idx_couple_profiles_location" ON "public"."couple_profiles" USING "btree" ("latitude", "longitude");



CREATE INDEX "idx_couple_profiles_looking_for" ON "public"."couple_profiles" USING "btree" ("looking_for");



CREATE INDEX "idx_couple_profiles_swinger_experience" ON "public"."couple_profiles" USING "btree" ("swinger_experience");



CREATE INDEX "idx_daily_token_claims_token_type" ON "public"."daily_token_claims" USING "btree" ("token_type");



CREATE INDEX "idx_daily_token_claims_user_date" ON "public"."daily_token_claims" USING "btree" ("user_id", "claim_date");



CREATE INDEX "idx_daily_token_claims_wallet" ON "public"."daily_token_claims" USING "btree" ("wallet_address");



CREATE INDEX "idx_digital_fingerprints_hash" ON "public"."digital_fingerprints" USING "btree" ("fingerprint_hash");



CREATE INDEX "idx_digital_fingerprints_user_id" ON "public"."digital_fingerprints" USING "btree" ("user_id");



CREATE INDEX "idx_error_alerts_severity" ON "public"."error_alerts" USING "btree" ("severity");



CREATE INDEX "idx_error_alerts_user_id" ON "public"."error_alerts" USING "btree" ("user_id");



CREATE INDEX "idx_event_participations_event_id" ON "public"."event_participations" USING "btree" ("event_id");



CREATE INDEX "idx_event_participations_user_id" ON "public"."event_participations" USING "btree" ("user_id");



CREATE INDEX "idx_frozen_assets_owner" ON "public"."frozen_assets" USING "btree" ("original_owner_id", "asset_type");



CREATE INDEX "idx_gallery_commissions_creator_id" ON "public"."gallery_commissions" USING "btree" ("creator_id");



CREATE INDEX "idx_gallery_commissions_gallery_id" ON "public"."gallery_commissions" USING "btree" ("gallery_id");



CREATE INDEX "idx_gallery_permissions_gallery_owner_id" ON "public"."gallery_permissions" USING "btree" ("gallery_owner_id");



CREATE INDEX "idx_gallery_permissions_owner" ON "public"."gallery_permissions" USING "btree" ("gallery_owner_id");



CREATE INDEX "idx_gallery_permissions_status" ON "public"."gallery_permissions" USING "btree" ("status");



CREATE INDEX "idx_gallery_unlocks_gallery_item_id" ON "public"."gallery_unlocks" USING "btree" ("gallery_item_id");



CREATE INDEX "idx_gallery_unlocks_user_id" ON "public"."gallery_unlocks" USING "btree" ("user_id");



CREATE INDEX "idx_investment_tiers_is_active" ON "public"."investment_tiers" USING "btree" ("is_active");



CREATE INDEX "idx_investment_tiers_tier_key" ON "public"."investment_tiers" USING "btree" ("tier_key");



CREATE INDEX "idx_investments_created_at" ON "public"."investments" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_investments_payment_status" ON "public"."investments" USING "btree" ("payment_status");



CREATE INDEX "idx_investments_status" ON "public"."investments" USING "btree" ("status");



CREATE INDEX "idx_investments_user_id" ON "public"."investments" USING "btree" ("user_id");



CREATE INDEX "idx_matches_status" ON "public"."matches" USING "btree" ("status");



CREATE INDEX "idx_matches_user1_id" ON "public"."matches" USING "btree" ("user1_id");



CREATE INDEX "idx_matches_user2_id" ON "public"."matches" USING "btree" ("user2_id");



CREATE INDEX "idx_media_profile_id" ON "public"."media" USING "btree" ("profile_id");



CREATE INDEX "idx_media_user_id" ON "public"."media" USING "btree" ("user_id");



CREATE INDEX "idx_messages_receiver_id" ON "public"."messages" USING "btree" ("receiver_id");



CREATE INDEX "idx_messages_room_id" ON "public"."messages" USING "btree" ("room_id");



CREATE INDEX "idx_messages_sender_id" ON "public"."messages" USING "btree" ("sender_id");



CREATE INDEX "idx_moderation_logs_moderator_id" ON "public"."moderation_logs" USING "btree" ("moderator_id");



CREATE INDEX "idx_moderation_logs_target_id" ON "public"."moderation_logs" USING "btree" ("target_id");



CREATE INDEX "idx_moderator_payments_created_at" ON "public"."moderator_payments" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_moderator_payments_moderator_id" ON "public"."moderator_payments" USING "btree" ("moderator_id");



CREATE INDEX "idx_moderator_payments_payment_status" ON "public"."moderator_payments" USING "btree" ("payment_status");



CREATE INDEX "idx_moderator_requests_user_id" ON "public"."moderator_requests" USING "btree" ("user_id");



CREATE INDEX "idx_moderators_is_active" ON "public"."moderators" USING "btree" ("is_active");



CREATE INDEX "idx_moderators_status" ON "public"."moderators" USING "btree" ("status");



CREATE INDEX "idx_moderators_user_id" ON "public"."moderators" USING "btree" ("user_id");



CREATE INDEX "idx_monitoring_sessions_session_id" ON "public"."monitoring_sessions" USING "btree" ("session_id");



CREATE INDEX "idx_monitoring_sessions_user_id" ON "public"."monitoring_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_nft_galleries_user_id" ON "public"."nft_galleries" USING "btree" ("user_id");



CREATE INDEX "idx_nft_gallery_images_gallery_id" ON "public"."nft_gallery_images" USING "btree" ("gallery_id");



CREATE INDEX "idx_nft_gallery_images_user_id" ON "public"."nft_gallery_images" USING "btree" ("user_id");



CREATE INDEX "idx_nft_verifications_is_active" ON "public"."nft_verifications" USING "btree" ("is_active");



CREATE INDEX "idx_nft_verifications_user_id" ON "public"."nft_verifications" USING "btree" ("user_id");



CREATE INDEX "idx_performance_metrics_metric_name" ON "public"."performance_metrics" USING "btree" ("metric_name");



CREATE INDEX "idx_performance_metrics_user_id" ON "public"."performance_metrics" USING "btree" ("user_id");



CREATE INDEX "idx_permanent_bans_user_id" ON "public"."permanent_bans" USING "btree" ("user_id");



CREATE INDEX "idx_posts_created_at" ON "public"."posts" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_posts_is_public" ON "public"."posts" USING "btree" ("is_public");



CREATE INDEX "idx_posts_profile_id" ON "public"."posts" USING "btree" ("profile_id");



CREATE INDEX "idx_posts_user_id" ON "public"."posts" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_is_demo" ON "public"."profiles" USING "btree" ("is_demo");



CREATE INDEX "idx_profiles_is_premium" ON "public"."profiles" USING "btree" ("is_premium");



CREATE INDEX "idx_rate_limits_endpoint" ON "public"."rate_limits" USING "btree" ("endpoint");



CREATE INDEX "idx_rate_limits_ip_address" ON "public"."rate_limits" USING "btree" ("ip_address");



CREATE INDEX "idx_rate_limits_user_id" ON "public"."rate_limits" USING "btree" ("user_id");



CREATE INDEX "idx_rate_limits_window_end" ON "public"."rate_limits" USING "btree" ("window_end");



CREATE INDEX "idx_referral_statistics_user_id" ON "public"."referral_statistics" USING "btree" ("user_id");



CREATE INDEX "idx_referral_transactions_referrer_id" ON "public"."referral_transactions" USING "btree" ("referrer_id");



CREATE INDEX "idx_referral_transactions_user_id" ON "public"."referral_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_report_ai_classification_report_id" ON "public"."report_ai_classification" USING "btree" ("report_id");



CREATE INDEX "idx_security_audit_log_action" ON "public"."security_audit_log" USING "btree" ("action");



CREATE INDEX "idx_security_audit_log_created_at" ON "public"."security_audit_log" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_security_audit_log_user_id" ON "public"."security_audit_log" USING "btree" ("user_id");



CREATE INDEX "idx_security_audit_logs_action" ON "public"."security_audit_logs" USING "btree" ("action");



CREATE INDEX "idx_security_audit_logs_created_at" ON "public"."security_audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_security_audit_logs_user_id" ON "public"."security_audit_logs" USING "btree" ("user_id");



CREATE INDEX "idx_security_user_id" ON "public"."security" USING "btree" ("user_id");



CREATE INDEX "idx_staking_records_status" ON "public"."staking_records" USING "btree" ("status");



CREATE INDEX "idx_staking_records_user_id" ON "public"."staking_records" USING "btree" ("user_id");



CREATE INDEX "idx_summary_feedback_summary_id" ON "public"."summary_feedback" USING "btree" ("summary_id");



CREATE INDEX "idx_summary_feedback_user_id" ON "public"."summary_feedback" USING "btree" ("user_id");



CREATE INDEX "idx_summary_requests_user_id" ON "public"."summary_requests" USING "btree" ("user_id");



CREATE INDEX "idx_swinger_interests_name" ON "public"."swinger_interests" USING "btree" ("name");



CREATE INDEX "idx_testnet_token_claims_user" ON "public"."testnet_token_claims" USING "btree" ("user_id");



CREATE INDEX "idx_testnet_token_claims_wallet" ON "public"."testnet_token_claims" USING "btree" ("wallet_address");



CREATE INDEX "idx_token_analytics_created_at" ON "public"."token_analytics" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_token_analytics_period_type" ON "public"."token_analytics" USING "btree" ("period_type");



CREATE INDEX "idx_user_consents_user_type" ON "public"."user_consents" USING "btree" ("user_id", "consent_type") WHERE ("is_active" = true);



CREATE INDEX "idx_user_interests_user_id" ON "public"."user_interests" USING "btree" ("user_id");



CREATE INDEX "idx_user_referral_balances_referral_code" ON "public"."user_referral_balances" USING "btree" ("referral_code");



CREATE INDEX "idx_user_referral_balances_user_id" ON "public"."user_referral_balances" USING "btree" ("user_id");



CREATE INDEX "idx_user_referral_stats_user_id" ON "public"."user_referral_stats" USING "btree" ("user_id");



CREATE INDEX "idx_user_roles_user" ON "public"."user_roles" USING "btree" ("user_id");



CREATE INDEX "idx_user_stripe_customers_stripe_id" ON "public"."user_stripe_customers" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_user_stripe_customers_user_id" ON "public"."user_stripe_customers" USING "btree" ("user_id");



CREATE INDEX "idx_user_suspensions_is_active" ON "public"."user_suspensions" USING "btree" ("is_active");



CREATE INDEX "idx_user_suspensions_user_id" ON "public"."user_suspensions" USING "btree" ("user_id");



CREATE INDEX "idx_user_wallets_address" ON "public"."user_wallets" USING "btree" ("address");



CREATE INDEX "idx_user_wallets_network" ON "public"."user_wallets" USING "btree" ("network");



CREATE INDEX "idx_user_wallets_user_id" ON "public"."user_wallets" USING "btree" ("user_id");



CREATE INDEX "idx_virtual_events_event_type" ON "public"."virtual_events" USING "btree" ("event_type");



CREATE INDEX "idx_virtual_events_start_time" ON "public"."virtual_events" USING "btree" ("start_time");



CREATE INDEX "idx_virtual_events_status" ON "public"."virtual_events" USING "btree" ("status");



CREATE INDEX "idx_web_vitals_history_session_id" ON "public"."web_vitals_history" USING "btree" ("session_id");



CREATE INDEX "idx_web_vitals_history_user_id" ON "public"."web_vitals_history" USING "btree" ("user_id");



CREATE INDEX "idx_worldid_rewards_user_id" ON "public"."worldid_rewards" USING "btree" ("user_id");



CREATE INDEX "idx_worldid_statistics_period_start" ON "public"."worldid_statistics" USING "btree" ("period_start");



CREATE INDEX "idx_worldid_verifications_nullifier_hash" ON "public"."worldid_verifications" USING "btree" ("nullifier_hash");



CREATE INDEX "idx_worldid_verifications_user_id" ON "public"."worldid_verifications" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "audit_profile_changes_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."audit_profile_changes"();



CREATE OR REPLACE TRIGGER "club_applications_updated_at" BEFORE UPDATE ON "public"."club_applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_club_applications_updated_at"();



CREATE OR REPLACE TRIGGER "gallery_permissions_updated_at" BEFORE UPDATE ON "public"."gallery_permissions" FOR EACH ROW EXECUTE FUNCTION "public"."update_gallery_permissions_updated_at"();



CREATE OR REPLACE TRIGGER "invitations_updated_at" BEFORE UPDATE ON "public"."invitations" FOR EACH ROW EXECUTE FUNCTION "public"."update_invitations_updated_at"();



CREATE OR REPLACE TRIGGER "sanitize_profile_inputs_trigger" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."sanitize_profile_inputs"();



CREATE OR REPLACE TRIGGER "update_couple_profiles_updated_at" BEFORE UPDATE ON "public"."couple_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_couple_profiles_updated_at"();



CREATE OR REPLACE TRIGGER "validate_profile_email_trigger" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."validate_profile_email"();



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_logs"
    ADD CONSTRAINT "app_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_metrics"
    ADD CONSTRAINT "app_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blockchain_transactions"
    ADD CONSTRAINT "blockchain_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."career_applications"
    ADD CONSTRAINT "career_applications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."career_applications"
    ADD CONSTRAINT "career_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_rooms"
    ADD CONSTRAINT "chat_rooms_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_rooms"
    ADD CONSTRAINT "chat_rooms_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_summaries"
    ADD CONSTRAINT "chat_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."club_applications"
    ADD CONSTRAINT "club_applications_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."club_flyers"
    ADD CONSTRAINT "club_flyers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."club_verifications"
    ADD CONSTRAINT "club_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."club_verifications"
    ADD CONSTRAINT "club_verifications_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."clubs"
    ADD CONSTRAINT "clubs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."clubs"
    ADD CONSTRAINT "clubs_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."cmpx_purchases"
    ADD CONSTRAINT "cmpx_purchases_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."cmpx_shop_packages"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."cmpx_purchases"
    ADD CONSTRAINT "cmpx_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consent_verifications"
    ADD CONSTRAINT "consent_verifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."consent_verifications"
    ADD CONSTRAINT "consent_verifications_user_id1_fkey" FOREIGN KEY ("user_id1") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."consent_verifications"
    ADD CONSTRAINT "consent_verifications_user_id2_fkey" FOREIGN KEY ("user_id2") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."consent_verifications"
    ADD CONSTRAINT "consent_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."couple_agreements"
    ADD CONSTRAINT "couple_agreements_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."couple_agreements"
    ADD CONSTRAINT "couple_agreements_partner_1_id_fkey" FOREIGN KEY ("partner_1_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."couple_agreements"
    ADD CONSTRAINT "couple_agreements_partner_2_id_fkey" FOREIGN KEY ("partner_2_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."couple_disputes"
    ADD CONSTRAINT "couple_disputes_couple_agreement_id_fkey" FOREIGN KEY ("couple_agreement_id") REFERENCES "public"."couple_agreements"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."couple_disputes"
    ADD CONSTRAINT "couple_disputes_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."couple_disputes"
    ADD CONSTRAINT "couple_disputes_initiated_by_fkey" FOREIGN KEY ("initiated_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."couple_profiles"
    ADD CONSTRAINT "couple_profiles_partner_1_id_fkey" FOREIGN KEY ("partner_1_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."couple_profiles"
    ADD CONSTRAINT "couple_profiles_partner_2_id_fkey" FOREIGN KEY ("partner_2_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."couple_profiles"
    ADD CONSTRAINT "couple_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."daily_token_claims"
    ADD CONSTRAINT "daily_token_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."digital_fingerprints"
    ADD CONSTRAINT "digital_fingerprints_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."error_alerts"
    ADD CONSTRAINT "error_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_participations"
    ADD CONSTRAINT "event_participations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."frozen_assets"
    ADD CONSTRAINT "frozen_assets_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "public"."couple_disputes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."frozen_assets"
    ADD CONSTRAINT "frozen_assets_original_owner_id_fkey" FOREIGN KEY ("original_owner_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."gallery_commissions"
    ADD CONSTRAINT "gallery_commissions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gallery_unlocks"
    ADD CONSTRAINT "gallery_unlocks_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gallery_unlocks"
    ADD CONSTRAINT "gallery_unlocks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."investments"
    ADD CONSTRAINT "investments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."invitation_statistics"
    ADD CONSTRAINT "invitation_statistics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."media"
    ADD CONSTRAINT "media_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moderation_logs"
    ADD CONSTRAINT "moderation_logs_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."moderator_payments"
    ADD CONSTRAINT "moderator_payments_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moderator_requests"
    ADD CONSTRAINT "moderator_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."moderator_requests"
    ADD CONSTRAINT "moderator_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moderator_sessions"
    ADD CONSTRAINT "moderator_sessions_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moderators"
    ADD CONSTRAINT "moderators_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."moderators"
    ADD CONSTRAINT "moderators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."monitoring_sessions"
    ADD CONSTRAINT "monitoring_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nft_galleries"
    ADD CONSTRAINT "nft_galleries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nft_gallery_images"
    ADD CONSTRAINT "nft_gallery_images_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nft_verifications"
    ADD CONSTRAINT "nft_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."performance_metrics"
    ADD CONSTRAINT "performance_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."permanent_bans"
    ADD CONSTRAINT "permanent_bans_banned_by_fkey" FOREIGN KEY ("banned_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."permanent_bans"
    ADD CONSTRAINT "permanent_bans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_statistics"
    ADD CONSTRAINT "referral_statistics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_transactions"
    ADD CONSTRAINT "referral_transactions_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_transactions"
    ADD CONSTRAINT "referral_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."security_audit_logs"
    ADD CONSTRAINT "security_audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."security"
    ADD CONSTRAINT "security_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staking_records"
    ADD CONSTRAINT "staking_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stories"
    ADD CONSTRAINT "stories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_comments"
    ADD CONSTRAINT "story_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."story_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_comments"
    ADD CONSTRAINT "story_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_likes"
    ADD CONSTRAINT "story_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_shares"
    ADD CONSTRAINT "story_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."summary_feedback"
    ADD CONSTRAINT "summary_feedback_summary_id_fkey" FOREIGN KEY ("summary_id") REFERENCES "public"."chat_summaries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."summary_feedback"
    ADD CONSTRAINT "summary_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."summary_requests"
    ADD CONSTRAINT "summary_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."testnet_token_claims"
    ADD CONSTRAINT "testnet_token_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."token_transactions"
    ADD CONSTRAINT "token_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_consents"
    ADD CONSTRAINT "user_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_device_tokens"
    ADD CONSTRAINT "user_device_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_interests"
    ADD CONSTRAINT "user_interests_interest_id_fkey" FOREIGN KEY ("interest_id") REFERENCES "public"."swinger_interests"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_interests"
    ADD CONSTRAINT "user_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_referral_balances"
    ADD CONSTRAINT "user_referral_balances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_referral_stats"
    ADD CONSTRAINT "user_referral_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_stripe_customers"
    ADD CONSTRAINT "user_stripe_customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_suspensions"
    ADD CONSTRAINT "user_suspensions_suspended_by_fkey" FOREIGN KEY ("suspended_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_suspensions"
    ADD CONSTRAINT "user_suspensions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_token_balances"
    ADD CONSTRAINT "user_token_balances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_wallets"
    ADD CONSTRAINT "user_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."virtual_events"
    ADD CONSTRAINT "virtual_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."web_vitals_history"
    ADD CONSTRAINT "web_vitals_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."worldid_rewards"
    ADD CONSTRAINT "worldid_rewards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."worldid_verifications"
    ADD CONSTRAINT "worldid_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can manage invitation templates" ON "public"."invitation_templates" USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'admin'::"text")))));



CREATE POLICY "Admin can view all roles" ON "public"."user_roles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles" "user_roles_1"
  WHERE (("user_roles_1"."user_id" = "auth"."uid"()) AND ("user_roles_1"."role" = 'admin'::"text")))));



CREATE POLICY "Admin can view invitation templates" ON "public"."invitation_templates" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can update applications" ON "public"."club_applications" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."email")::"text" = 'complicesconectasw@outlook.es'::"text")))));



CREATE POLICY "Admins can update reports" ON "public"."reports" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE (("admin_users"."user_id" = "auth"."uid"()) AND ("admin_users"."is_active" = true)))));



CREATE POLICY "Admins can view admin_users" ON "public"."admin_users" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "admin_users_1"
  WHERE (("admin_users_1"."user_id" = "auth"."uid"()) AND ("admin_users_1"."is_active" = true)))));



CREATE POLICY "Admins can view all applications" ON "public"."club_applications" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "auth"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND (("users"."email")::"text" = 'complicesconectasw@outlook.es'::"text")))));



CREATE POLICY "Anyone can create application" ON "public"."club_applications" FOR INSERT WITH CHECK (true);



CREATE POLICY "Authenticated users can read app config" ON "public"."app_config" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Service role can manage app config" ON "public"."app_config" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage user roles" ON "public"."user_roles" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Super admins can delete admin_users" ON "public"."admin_users" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "admin_users_1"
  WHERE (("admin_users_1"."user_id" = "auth"."uid"()) AND ("admin_users_1"."role" = 'super_admin'::"text") AND ("admin_users_1"."is_active" = true)))));



CREATE POLICY "Super admins can insert admin_users" ON "public"."admin_users" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "admin_users_1"
  WHERE (("admin_users_1"."user_id" = "auth"."uid"()) AND ("admin_users_1"."role" = 'super_admin'::"text") AND ("admin_users_1"."is_active" = true)))));



CREATE POLICY "Super admins can update admin_users" ON "public"."admin_users" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "admin_users_1"
  WHERE (("admin_users_1"."user_id" = "auth"."uid"()) AND ("admin_users_1"."role" = 'super_admin'::"text") AND ("admin_users_1"."is_active" = true)))));



CREATE POLICY "System can insert analytics events" ON "public"."analytics_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert audit logs" ON "public"."security_audit_log" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert blockchain transactions" ON "public"."blockchain_transactions" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert notifications" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can manage rate limits" ON "public"."rate_limits" USING (true);



CREATE POLICY "Users can create reports" ON "public"."reports" FOR INSERT WITH CHECK ((("auth"."uid"() = "reporter_user_id") AND (( SELECT "count"(*) AS "count"
   FROM "public"."reports" "reports_1"
  WHERE (("reports_1"."reporter_user_id" = "auth"."uid"()) AND ("reports_1"."created_at" > ("now"() - '24:00:00'::interval)))) < 5)));



CREATE POLICY "Users can insert own consents" ON "public"."user_consents" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can insert their own stripe customer" ON "public"."user_stripe_customers" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own wallets" ON "public"."user_wallets" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own consents" ON "public"."user_consents" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update their own stripe customer" ON "public"."user_stripe_customers" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own wallets" ON "public"."user_wallets" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE (("admin_users"."user_id" = "auth"."uid"()) AND ("admin_users"."is_active" = true))))));



CREATE POLICY "Users can view own audit logs" ON "public"."security_audit_log" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE (("admin_users"."user_id" = "auth"."uid"()) AND ("admin_users"."is_active" = true))))));



CREATE POLICY "Users can view own blockchain transactions" ON "public"."blockchain_transactions" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE (("admin_users"."user_id" = "auth"."uid"()) AND ("admin_users"."is_active" = true))))));



CREATE POLICY "Users can view own consents" ON "public"."user_consents" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE (("admin_users"."user_id" = "auth"."uid"()) AND ("admin_users"."is_active" = true))))));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view public and own profiles" ON "public"."profiles" FOR SELECT USING ((("id" = "auth"."uid"()) OR ("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE (("admin_users"."user_id" = "auth"."uid"()) AND ("admin_users"."is_active" = true))))));



CREATE POLICY "Users can view their own reports" ON "public"."reports" FOR SELECT USING (("auth"."uid"() = "reporter_user_id"));



CREATE POLICY "Users can view their own roles" ON "public"."user_roles" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their own stripe customer" ON "public"."user_stripe_customers" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own wallets" ON "public"."user_wallets" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE (("admin_users"."user_id" = "auth"."uid"()) AND ("admin_users"."is_active" = true))))));



ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blockchain_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."club_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clubs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clubs_insert" ON "public"."clubs" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text"))));



CREATE POLICY "clubs_read" ON "public"."clubs" FOR SELECT USING ((("is_active" = true) OR ("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "clubs_update" ON "public"."clubs" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text"))));



ALTER TABLE "public"."cmpx_purchases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cmpx_purchases_insert" ON "public"."cmpx_purchases" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "cmpx_purchases_read" ON "public"."cmpx_purchases" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



ALTER TABLE "public"."cmpx_shop_packages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "cmpx_shop_packages_read" ON "public"."cmpx_shop_packages" FOR SELECT USING ((("is_active" = true) OR ("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "cmpx_shop_packages_write" ON "public"."cmpx_shop_packages" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text"))));



ALTER TABLE "public"."couple_agreements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."couple_disputes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."couple_nft_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."couple_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_token_claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."frozen_assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gallery_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."investment_tiers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "investment_tiers_read" ON "public"."investment_tiers" FOR SELECT USING ((("is_active" = true) OR ("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "investment_tiers_update" ON "public"."investment_tiers" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text"))));



CREATE POLICY "investment_tiers_write" ON "public"."investment_tiers" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text"))));



ALTER TABLE "public"."investments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "investments_insert" ON "public"."investments" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "investments_read" ON "public"."investments" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "investments_update" ON "public"."investments" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



ALTER TABLE "public"."invitation_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."moderator_payments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "moderator_payments_read" ON "public"."moderator_payments" FOR SELECT USING ((("moderator_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



ALTER TABLE "public"."moderators" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "moderators_insert" ON "public"."moderators" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text"))));



CREATE POLICY "moderators_read" ON "public"."moderators" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



ALTER TABLE "public"."nft_staking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "own_analytics_events" ON "public"."analytics_events" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "own_blockchain_transactions" ON "public"."blockchain_transactions" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "own_couple_agreements" ON "public"."couple_agreements" USING ((("partner_1_id" = "auth"."uid"()) OR ("partner_2_id" = "auth"."uid"()))) WITH CHECK ((("partner_1_id" = "auth"."uid"()) OR ("partner_2_id" = "auth"."uid"())));



CREATE POLICY "own_couple_disputes" ON "public"."couple_disputes" USING ((EXISTS ( SELECT 1
   FROM "public"."couple_agreements" "ca"
  WHERE (("ca"."id" = "couple_disputes"."couple_agreement_id") AND (("ca"."partner_1_id" = "auth"."uid"()) OR ("ca"."partner_2_id" = "auth"."uid"()))))));



CREATE POLICY "own_couple_nft_requests" ON "public"."couple_nft_requests" USING ((("initiator_address" IN ( SELECT "user_wallets"."address"
   FROM "public"."user_wallets"
  WHERE ("user_wallets"."user_id" = "auth"."uid"()))) OR ("partner1_address" IN ( SELECT "user_wallets"."address"
   FROM "public"."user_wallets"
  WHERE ("user_wallets"."user_id" = "auth"."uid"()))) OR ("partner2_address" IN ( SELECT "user_wallets"."address"
   FROM "public"."user_wallets"
  WHERE ("user_wallets"."user_id" = "auth"."uid"()))))) WITH CHECK ((("initiator_address" IN ( SELECT "user_wallets"."address"
   FROM "public"."user_wallets"
  WHERE ("user_wallets"."user_id" = "auth"."uid"()))) OR ("partner1_address" IN ( SELECT "user_wallets"."address"
   FROM "public"."user_wallets"
  WHERE ("user_wallets"."user_id" = "auth"."uid"()))) OR ("partner2_address" IN ( SELECT "user_wallets"."address"
   FROM "public"."user_wallets"
  WHERE ("user_wallets"."user_id" = "auth"."uid"())))));



CREATE POLICY "own_daily_token_claims" ON "public"."daily_token_claims" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "own_frozen_assets" ON "public"."frozen_assets" USING (("original_owner_id" = "auth"."uid"())) WITH CHECK (("original_owner_id" = "auth"."uid"()));



CREATE POLICY "own_gallery_permissions" ON "public"."gallery_permissions" USING (("gallery_owner_id" = "auth"."uid"())) WITH CHECK (("gallery_owner_id" = "auth"."uid"()));



CREATE POLICY "own_nft_staking" ON "public"."nft_staking" USING (("user_address" IN ( SELECT "user_wallets"."address"
   FROM "public"."user_wallets"
  WHERE ("user_wallets"."user_id" = "auth"."uid"())))) WITH CHECK (("user_address" IN ( SELECT "user_wallets"."address"
   FROM "public"."user_wallets"
  WHERE ("user_wallets"."user_id" = "auth"."uid"()))));



CREATE POLICY "own_testnet_token_claims" ON "public"."testnet_token_claims" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "own_token_staking" ON "public"."token_staking" USING (("user_address" IN ( SELECT "user_wallets"."address"
   FROM "public"."user_wallets"
  WHERE ("user_wallets"."user_id" = "auth"."uid"())))) WITH CHECK (("user_address" IN ( SELECT "user_wallets"."address"
   FROM "public"."user_wallets"
  WHERE ("user_wallets"."user_id" = "auth"."uid"()))));



CREATE POLICY "own_user_consents" ON "public"."user_consents" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "own_user_nfts" ON "public"."user_nfts" USING (("owner_address" IN ( SELECT "user_wallets"."address"
   FROM "public"."user_wallets"
  WHERE ("user_wallets"."user_id" = "auth"."uid"())))) WITH CHECK (("owner_address" IN ( SELECT "user_wallets"."address"
   FROM "public"."user_wallets"
  WHERE ("user_wallets"."user_id" = "auth"."uid"()))));



CREATE POLICY "own_user_wallets" ON "public"."user_wallets" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "posts_insert" ON "public"."posts" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "posts_read" ON "public"."posts" FOR SELECT USING ((("is_public" = true) OR ("user_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "posts_update" ON "public"."posts" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rate_limits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_audit_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "security_audit_logs_insert" ON "public"."security_audit_logs" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "security_audit_logs_read" ON "public"."security_audit_logs" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text")))));



CREATE POLICY "staff_couple_disputes" ON "public"."couple_disputes" USING ("public"."is_admin_or_moderator"()) WITH CHECK ("public"."is_admin_or_moderator"());



CREATE POLICY "staff_frozen_assets" ON "public"."frozen_assets" USING ("public"."is_admin_or_moderator"()) WITH CHECK ("public"."is_admin_or_moderator"());



CREATE POLICY "staff_full_analytics_events" ON "public"."analytics_events" USING ("public"."is_admin_or_moderator"()) WITH CHECK ("public"."is_admin_or_moderator"());



CREATE POLICY "staff_full_blockchain_transactions" ON "public"."blockchain_transactions" USING ("public"."is_admin_or_moderator"()) WITH CHECK ("public"."is_admin_or_moderator"());



CREATE POLICY "staff_full_couple_agreements" ON "public"."couple_agreements" USING ("public"."is_admin_or_moderator"()) WITH CHECK ("public"."is_admin_or_moderator"());



CREATE POLICY "staff_full_couple_disputes" ON "public"."couple_disputes" USING ("public"."is_admin_or_moderator"()) WITH CHECK ("public"."is_admin_or_moderator"());



CREATE POLICY "staff_full_couple_nft_requests" ON "public"."couple_nft_requests" USING ("public"."is_admin_or_moderator"()) WITH CHECK ("public"."is_admin_or_moderator"());



CREATE POLICY "staff_full_frozen_assets" ON "public"."frozen_assets" USING ("public"."is_admin_or_moderator"()) WITH CHECK ("public"."is_admin_or_moderator"());



CREATE POLICY "staff_full_user_consents" ON "public"."user_consents" USING ("public"."is_admin_or_moderator"()) WITH CHECK ("public"."is_admin_or_moderator"());



CREATE POLICY "staff_full_user_nfts" ON "public"."user_nfts" USING ("public"."is_admin_or_moderator"()) WITH CHECK ("public"."is_admin_or_moderator"());



CREATE POLICY "staff_full_user_wallets" ON "public"."user_wallets" USING ("public"."is_admin_or_moderator"()) WITH CHECK ("public"."is_admin_or_moderator"());



ALTER TABLE "public"."story_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "story_comments_access" ON "public"."story_comments" USING (true) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."story_likes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "story_likes_access" ON "public"."story_likes" USING (true) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."story_shares" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "story_shares_access" ON "public"."story_shares" USING (true) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."testnet_token_claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."token_analytics" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "token_analytics_insert" ON "public"."token_analytics" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text"))));



CREATE POLICY "token_analytics_read" ON "public"."token_analytics" FOR SELECT USING (true);



ALTER TABLE "public"."token_staking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_consents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_nfts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_stripe_customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_wallets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."virtual_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "virtual_events_insert" ON "public"."virtual_events" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "users"."id"
   FROM "auth"."users"
  WHERE (("users"."raw_user_meta_data" ->> 'role'::"text") = 'admin'::"text"))));



CREATE POLICY "virtual_events_read" ON "public"."virtual_events" FOR SELECT USING (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT ALL ON SCHEMA "private" TO "service_role";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextin"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextout"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextrecv"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citextsend"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"(boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"(character) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "anon";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"(character) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext"("inet") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "anon";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext"("inet") TO "service_role";






































































































































































































































































































GRANT ALL ON FUNCTION "public"."audit_profile_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."audit_profile_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."audit_profile_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."block_ip"("p_ip_address" "text", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."block_ip"("p_ip_address" "text", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."block_ip"("p_ip_address" "text", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_user_id" "uuid", "p_ip_address" "text", "p_endpoint" "text", "p_max_requests" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_user_id" "uuid", "p_ip_address" "text", "p_endpoint" "text", "p_max_requests" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_rate_limit"("p_user_id" "uuid", "p_ip_address" "text", "p_endpoint" "text", "p_max_requests" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_cmp"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_eq"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_ge"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_gt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_hash"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_hash_extended"("public"."citext", bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_larger"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_le"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_lt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_ne"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_cmp"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_ge"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_gt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_le"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_pattern_lt"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."citext_smaller"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_stripe_customer"("p_user_id" "uuid", "p_email" "text", "p_name" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."create_stripe_customer"("p_user_id" "uuid", "p_email" "text", "p_name" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_stripe_customer"("p_user_id" "uuid", "p_email" "text", "p_name" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."detect_suspicious_activity"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."detect_suspicious_activity"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."detect_suspicious_activity"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."escape_html"("text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."escape_html"("text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."escape_html"("text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."has_access_to_sensitive_data"("p_target_user_id" "uuid", "p_data_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_access_to_sensitive_data"("p_target_user_id" "uuid", "p_data_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_access_to_sensitive_data"("p_target_user_id" "uuid", "p_data_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_or_moderator"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_or_moderator"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_or_moderator"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_ip_blocked"("p_ip_address" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_ip_blocked"("p_ip_address" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_ip_blocked"("p_ip_address" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_valid_email"("email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_valid_email"("email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_valid_email"("email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_valid_uuid"("uuid" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."is_valid_uuid"("uuid" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_valid_uuid"("uuid" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_security_event"("p_user_id" "uuid", "p_ip_address" "text", "p_action" "text", "p_resource" "text", "p_details" "jsonb", "p_severity" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."log_security_event"("p_user_id" "uuid", "p_ip_address" "text", "p_action" "text", "p_resource" "text", "p_details" "jsonb", "p_severity" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_security_event"("p_user_id" "uuid", "p_ip_address" "text", "p_action" "text", "p_resource" "text", "p_details" "jsonb", "p_severity" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."mask_email"("email" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mask_email"("email" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mask_email"("email" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."mask_sensitive_data"("data" "text", "data_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."mask_sensitive_data"("data" "text", "data_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."mask_sensitive_data"("data" "text", "data_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_match"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_matches"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_replace"("public"."citext", "public"."citext", "text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_array"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."regexp_split_to_table"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."replace"("public"."citext", "public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."sanitize_input"("input_text" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."sanitize_input"("input_text" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sanitize_input"("input_text" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sanitize_profile_inputs"() TO "anon";
GRANT ALL ON FUNCTION "public"."sanitize_profile_inputs"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sanitize_profile_inputs"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sanitize_user_content"("content" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."sanitize_user_content"("content" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sanitize_user_content"("content" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticlike"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticnlike"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexeq"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."texticregexne"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."translate"("public"."citext", "public"."citext", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_club_applications_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_club_applications_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_club_applications_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_couple_profiles_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_couple_profiles_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_couple_profiles_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_gallery_permissions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_gallery_permissions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_gallery_permissions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_invitations_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_invitations_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_invitations_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_profile_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_profile_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_profile_email"() TO "service_role";












GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "service_role";












GRANT SELECT ON TABLE "private"."admin_stripe_overview" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_events" TO "service_role";



GRANT ALL ON TABLE "public"."app_config" TO "anon";
GRANT ALL ON TABLE "public"."app_config" TO "authenticated";
GRANT ALL ON TABLE "public"."app_config" TO "service_role";



GRANT ALL ON TABLE "public"."app_logs" TO "anon";
GRANT ALL ON TABLE "public"."app_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."app_logs" TO "service_role";



GRANT ALL ON TABLE "public"."app_metrics" TO "anon";
GRANT ALL ON TABLE "public"."app_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."app_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."blockchain_transactions" TO "anon";
GRANT ALL ON TABLE "public"."blockchain_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."blockchain_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."career_applications" TO "anon";
GRANT ALL ON TABLE "public"."career_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."career_applications" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."chat_rooms" TO "anon";
GRANT ALL ON TABLE "public"."chat_rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_rooms" TO "service_role";



GRANT ALL ON TABLE "public"."chat_summaries" TO "anon";
GRANT ALL ON TABLE "public"."chat_summaries" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_summaries" TO "service_role";



GRANT ALL ON TABLE "public"."club_applications" TO "anon";
GRANT ALL ON TABLE "public"."club_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."club_applications" TO "service_role";



GRANT ALL ON TABLE "public"."club_flyers" TO "anon";
GRANT ALL ON TABLE "public"."club_flyers" TO "authenticated";
GRANT ALL ON TABLE "public"."club_flyers" TO "service_role";



GRANT ALL ON TABLE "public"."club_verifications" TO "anon";
GRANT ALL ON TABLE "public"."club_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."club_verifications" TO "service_role";



GRANT ALL ON TABLE "public"."clubs" TO "anon";
GRANT ALL ON TABLE "public"."clubs" TO "authenticated";
GRANT ALL ON TABLE "public"."clubs" TO "service_role";



GRANT ALL ON TABLE "public"."cmpx_purchases" TO "anon";
GRANT ALL ON TABLE "public"."cmpx_purchases" TO "authenticated";
GRANT ALL ON TABLE "public"."cmpx_purchases" TO "service_role";



GRANT ALL ON TABLE "public"."cmpx_shop_packages" TO "anon";
GRANT ALL ON TABLE "public"."cmpx_shop_packages" TO "authenticated";
GRANT ALL ON TABLE "public"."cmpx_shop_packages" TO "service_role";



GRANT ALL ON TABLE "public"."consent_verifications" TO "anon";
GRANT ALL ON TABLE "public"."consent_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."consent_verifications" TO "service_role";



GRANT ALL ON TABLE "public"."couple_agreements" TO "anon";
GRANT ALL ON TABLE "public"."couple_agreements" TO "authenticated";
GRANT ALL ON TABLE "public"."couple_agreements" TO "service_role";



GRANT ALL ON TABLE "public"."couple_disputes" TO "anon";
GRANT ALL ON TABLE "public"."couple_disputes" TO "authenticated";
GRANT ALL ON TABLE "public"."couple_disputes" TO "service_role";



GRANT ALL ON TABLE "public"."couple_events" TO "anon";
GRANT ALL ON TABLE "public"."couple_events" TO "authenticated";
GRANT ALL ON TABLE "public"."couple_events" TO "service_role";



GRANT ALL ON TABLE "public"."couple_nft_requests" TO "anon";
GRANT ALL ON TABLE "public"."couple_nft_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."couple_nft_requests" TO "service_role";



GRANT ALL ON TABLE "public"."couple_profiles" TO "anon";
GRANT ALL ON TABLE "public"."couple_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."couple_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."daily_token_claims" TO "anon";
GRANT ALL ON TABLE "public"."daily_token_claims" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_token_claims" TO "service_role";



GRANT ALL ON TABLE "public"."digital_fingerprints" TO "anon";
GRANT ALL ON TABLE "public"."digital_fingerprints" TO "authenticated";
GRANT ALL ON TABLE "public"."digital_fingerprints" TO "service_role";



GRANT ALL ON TABLE "public"."error_alerts" TO "anon";
GRANT ALL ON TABLE "public"."error_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."error_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."event_participations" TO "anon";
GRANT ALL ON TABLE "public"."event_participations" TO "authenticated";
GRANT ALL ON TABLE "public"."event_participations" TO "service_role";



GRANT ALL ON TABLE "public"."frozen_assets" TO "anon";
GRANT ALL ON TABLE "public"."frozen_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."frozen_assets" TO "service_role";



GRANT ALL ON TABLE "public"."gallery_commissions" TO "anon";
GRANT ALL ON TABLE "public"."gallery_commissions" TO "authenticated";
GRANT ALL ON TABLE "public"."gallery_commissions" TO "service_role";



GRANT ALL ON TABLE "public"."gallery_permissions" TO "anon";
GRANT ALL ON TABLE "public"."gallery_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."gallery_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."gallery_unlocks" TO "anon";
GRANT ALL ON TABLE "public"."gallery_unlocks" TO "authenticated";
GRANT ALL ON TABLE "public"."gallery_unlocks" TO "service_role";



GRANT ALL ON TABLE "public"."investment_tiers" TO "anon";
GRANT ALL ON TABLE "public"."investment_tiers" TO "authenticated";
GRANT ALL ON TABLE "public"."investment_tiers" TO "service_role";



GRANT ALL ON TABLE "public"."investments" TO "anon";
GRANT ALL ON TABLE "public"."investments" TO "authenticated";
GRANT ALL ON TABLE "public"."investments" TO "service_role";



GRANT ALL ON TABLE "public"."invitation_statistics" TO "anon";
GRANT ALL ON TABLE "public"."invitation_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."invitation_statistics" TO "service_role";



GRANT ALL ON TABLE "public"."invitation_templates" TO "anon";
GRANT ALL ON TABLE "public"."invitation_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."invitation_templates" TO "service_role";



GRANT ALL ON TABLE "public"."invitations" TO "anon";
GRANT ALL ON TABLE "public"."invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."invitations" TO "service_role";



GRANT ALL ON TABLE "public"."matches" TO "anon";
GRANT ALL ON TABLE "public"."matches" TO "authenticated";
GRANT ALL ON TABLE "public"."matches" TO "service_role";



GRANT ALL ON TABLE "public"."media" TO "anon";
GRANT ALL ON TABLE "public"."media" TO "authenticated";
GRANT ALL ON TABLE "public"."media" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."moderation_logs" TO "anon";
GRANT ALL ON TABLE "public"."moderation_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."moderation_logs" TO "service_role";



GRANT ALL ON TABLE "public"."moderator_payments" TO "anon";
GRANT ALL ON TABLE "public"."moderator_payments" TO "authenticated";
GRANT ALL ON TABLE "public"."moderator_payments" TO "service_role";



GRANT ALL ON TABLE "public"."moderator_requests" TO "anon";
GRANT ALL ON TABLE "public"."moderator_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."moderator_requests" TO "service_role";



GRANT ALL ON TABLE "public"."moderator_sessions" TO "anon";
GRANT ALL ON TABLE "public"."moderator_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."moderator_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."moderators" TO "anon";
GRANT ALL ON TABLE "public"."moderators" TO "authenticated";
GRANT ALL ON TABLE "public"."moderators" TO "service_role";



GRANT ALL ON TABLE "public"."monitoring_sessions" TO "anon";
GRANT ALL ON TABLE "public"."monitoring_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."monitoring_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."nft_galleries" TO "anon";
GRANT ALL ON TABLE "public"."nft_galleries" TO "authenticated";
GRANT ALL ON TABLE "public"."nft_galleries" TO "service_role";



GRANT ALL ON TABLE "public"."nft_gallery_images" TO "anon";
GRANT ALL ON TABLE "public"."nft_gallery_images" TO "authenticated";
GRANT ALL ON TABLE "public"."nft_gallery_images" TO "service_role";



GRANT ALL ON TABLE "public"."nft_staking" TO "anon";
GRANT ALL ON TABLE "public"."nft_staking" TO "authenticated";
GRANT ALL ON TABLE "public"."nft_staking" TO "service_role";



GRANT ALL ON TABLE "public"."nft_verifications" TO "anon";
GRANT ALL ON TABLE "public"."nft_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."nft_verifications" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."performance_metrics" TO "anon";
GRANT ALL ON TABLE "public"."performance_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."performance_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."permanent_bans" TO "anon";
GRANT ALL ON TABLE "public"."permanent_bans" TO "authenticated";
GRANT ALL ON TABLE "public"."permanent_bans" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."rate_limits" TO "anon";
GRANT ALL ON TABLE "public"."rate_limits" TO "authenticated";
GRANT ALL ON TABLE "public"."rate_limits" TO "service_role";



GRANT ALL ON TABLE "public"."referral_statistics" TO "anon";
GRANT ALL ON TABLE "public"."referral_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_statistics" TO "service_role";



GRANT ALL ON TABLE "public"."referral_transactions" TO "anon";
GRANT ALL ON TABLE "public"."referral_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."report_ai_classification" TO "anon";
GRANT ALL ON TABLE "public"."report_ai_classification" TO "authenticated";
GRANT ALL ON TABLE "public"."report_ai_classification" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."security" TO "anon";
GRANT ALL ON TABLE "public"."security" TO "authenticated";
GRANT ALL ON TABLE "public"."security" TO "service_role";



GRANT ALL ON TABLE "public"."security_audit_log" TO "anon";
GRANT ALL ON TABLE "public"."security_audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."security_audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."security_audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."security_audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."security_audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."staking_records" TO "anon";
GRANT ALL ON TABLE "public"."staking_records" TO "authenticated";
GRANT ALL ON TABLE "public"."staking_records" TO "service_role";



GRANT ALL ON TABLE "public"."stories" TO "anon";
GRANT ALL ON TABLE "public"."stories" TO "authenticated";
GRANT ALL ON TABLE "public"."stories" TO "service_role";



GRANT ALL ON TABLE "public"."story_comments" TO "anon";
GRANT ALL ON TABLE "public"."story_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."story_comments" TO "service_role";



GRANT ALL ON TABLE "public"."story_likes" TO "anon";
GRANT ALL ON TABLE "public"."story_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."story_likes" TO "service_role";



GRANT ALL ON TABLE "public"."story_shares" TO "anon";
GRANT ALL ON TABLE "public"."story_shares" TO "authenticated";
GRANT ALL ON TABLE "public"."story_shares" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_prices_view" TO "anon";
GRANT ALL ON TABLE "public"."stripe_prices_view" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_prices_view" TO "service_role";



GRANT ALL ON TABLE "public"."stripe_products_view" TO "anon";
GRANT ALL ON TABLE "public"."stripe_products_view" TO "authenticated";
GRANT ALL ON TABLE "public"."stripe_products_view" TO "service_role";



GRANT ALL ON TABLE "public"."summary_feedback" TO "anon";
GRANT ALL ON TABLE "public"."summary_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."summary_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."summary_requests" TO "anon";
GRANT ALL ON TABLE "public"."summary_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."summary_requests" TO "service_role";



GRANT ALL ON TABLE "public"."swinger_interests" TO "anon";
GRANT ALL ON TABLE "public"."swinger_interests" TO "authenticated";
GRANT ALL ON TABLE "public"."swinger_interests" TO "service_role";



GRANT ALL ON TABLE "public"."testnet_token_claims" TO "anon";
GRANT ALL ON TABLE "public"."testnet_token_claims" TO "authenticated";
GRANT ALL ON TABLE "public"."testnet_token_claims" TO "service_role";



GRANT ALL ON TABLE "public"."token_analytics" TO "anon";
GRANT ALL ON TABLE "public"."token_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."token_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."token_staking" TO "anon";
GRANT ALL ON TABLE "public"."token_staking" TO "authenticated";
GRANT ALL ON TABLE "public"."token_staking" TO "service_role";



GRANT ALL ON TABLE "public"."token_transactions" TO "anon";
GRANT ALL ON TABLE "public"."token_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."token_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."user_consents" TO "anon";
GRANT ALL ON TABLE "public"."user_consents" TO "authenticated";
GRANT ALL ON TABLE "public"."user_consents" TO "service_role";



GRANT ALL ON TABLE "public"."user_device_tokens" TO "anon";
GRANT ALL ON TABLE "public"."user_device_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."user_device_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."user_interests" TO "anon";
GRANT ALL ON TABLE "public"."user_interests" TO "authenticated";
GRANT ALL ON TABLE "public"."user_interests" TO "service_role";



GRANT ALL ON TABLE "public"."user_nfts" TO "anon";
GRANT ALL ON TABLE "public"."user_nfts" TO "authenticated";
GRANT ALL ON TABLE "public"."user_nfts" TO "service_role";



GRANT ALL ON TABLE "public"."user_referral_balances" TO "anon";
GRANT ALL ON TABLE "public"."user_referral_balances" TO "authenticated";
GRANT ALL ON TABLE "public"."user_referral_balances" TO "service_role";



GRANT ALL ON TABLE "public"."user_referral_stats" TO "anon";
GRANT ALL ON TABLE "public"."user_referral_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."user_referral_stats" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_stripe_customers" TO "anon";
GRANT ALL ON TABLE "public"."user_stripe_customers" TO "authenticated";
GRANT ALL ON TABLE "public"."user_stripe_customers" TO "service_role";



GRANT ALL ON TABLE "public"."user_suspensions" TO "anon";
GRANT ALL ON TABLE "public"."user_suspensions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_suspensions" TO "service_role";



GRANT ALL ON TABLE "public"."user_token_balances" TO "anon";
GRANT ALL ON TABLE "public"."user_token_balances" TO "authenticated";
GRANT ALL ON TABLE "public"."user_token_balances" TO "service_role";



GRANT ALL ON TABLE "public"."user_wallets" TO "anon";
GRANT ALL ON TABLE "public"."user_wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."user_wallets" TO "service_role";



GRANT ALL ON TABLE "public"."users_safe" TO "anon";
GRANT ALL ON TABLE "public"."users_safe" TO "authenticated";
GRANT ALL ON TABLE "public"."users_safe" TO "service_role";



GRANT ALL ON TABLE "public"."virtual_events" TO "anon";
GRANT ALL ON TABLE "public"."virtual_events" TO "authenticated";
GRANT ALL ON TABLE "public"."virtual_events" TO "service_role";



GRANT ALL ON TABLE "public"."web_vitals_history" TO "anon";
GRANT ALL ON TABLE "public"."web_vitals_history" TO "authenticated";
GRANT ALL ON TABLE "public"."web_vitals_history" TO "service_role";



GRANT ALL ON TABLE "public"."worldid_rewards" TO "anon";
GRANT ALL ON TABLE "public"."worldid_rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."worldid_rewards" TO "service_role";



GRANT ALL ON TABLE "public"."worldid_statistics" TO "anon";
GRANT ALL ON TABLE "public"."worldid_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."worldid_statistics" TO "service_role";



GRANT ALL ON TABLE "public"."worldid_verifications" TO "anon";
GRANT ALL ON TABLE "public"."worldid_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."worldid_verifications" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























