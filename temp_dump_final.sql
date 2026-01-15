

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






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "btree_gin" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "citext" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."event_type" AS ENUM (
    'meetup',
    'party',
    'dinner',
    'travel',
    'other'
);


ALTER TYPE "public"."event_type" OWNER TO "postgres";


CREATE TYPE "public"."match_status" AS ENUM (
    'pending',
    'accepted',
    'rejected',
    'blocked'
);


ALTER TYPE "public"."match_status" OWNER TO "postgres";


CREATE TYPE "public"."report_status" AS ENUM (
    'pending',
    'reviewing',
    'resolved',
    'dismissed'
);


ALTER TYPE "public"."report_status" OWNER TO "postgres";


CREATE TYPE "public"."transaction_type" AS ENUM (
    'referral_bonus',
    'withdrawal',
    'adjustment',
    'earn',
    'spend',
    'transfer'
);


ALTER TYPE "public"."transaction_type" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'user',
    'moderator',
    'admin'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_couple_agreement_signatures"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.partner_1_signature = TRUE AND NEW.partner_2_signature = TRUE THEN
        NEW.status = 'ACTIVE';
        NEW.dispute_deadline = NOW() + INTERVAL '30 days';
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_couple_agreement_signatures"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_couple_requests"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE couple_nft_requests 
    SET status = 'expired'
    WHERE status = 'pending' 
      AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_couple_requests"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_users_per_cell"() RETURNS TABLE("s2_cell_id" character varying, "user_count" bigint, "level" smallint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.s2_cell_id,
    COUNT(*)::BIGINT AS user_count,
    p.s2_level
  FROM profiles p
  WHERE p.s2_cell_id IS NOT NULL
  GROUP BY p.s2_cell_id, p.s2_level
  ORDER BY user_count DESC;
END;
$$;


ALTER FUNCTION "public"."count_users_per_cell"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."count_users_per_cell"() IS 'Estadísticas de usuarios por celda S2. Útil para analytics de densidad geográfica.';



CREATE OR REPLACE FUNCTION "public"."get_profiles_in_cells"("cell_ids" "text"[], "limit_count" integer DEFAULT 100) RETURNS TABLE("id" "uuid", "s2_cell_id" character varying, "latitude" double precision, "longitude" double precision, "name" "text", "age" integer, "account_type" "text", "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.s2_cell_id,
    p.latitude::DOUBLE PRECISION,
    p.longitude::DOUBLE PRECISION,
    p.name::TEXT,
    p.age,
    p.account_type::TEXT,
    p.updated_at
  FROM profiles p
  WHERE p.s2_cell_id = ANY(cell_ids)
  ORDER BY p.updated_at DESC
  LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."get_profiles_in_cells"("cell_ids" "text"[], "limit_count" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_profiles_in_cells"("cell_ids" "text"[], "limit_count" integer) IS 'Busca perfiles en un array de celdas S2. Útil para queries nearby optimizadas.';



CREATE OR REPLACE FUNCTION "public"."get_user_daily_claims"("p_user_id" "uuid", "p_date" "date" DEFAULT CURRENT_DATE) RETURNS TABLE("token_type" "text", "amount_claimed" numeric, "remaining_limit" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    daily_limit CONSTANT DECIMAL(20,8) := 2500000.0; -- 2.5M tokens (1% del pool)
BEGIN
    RETURN QUERY
    SELECT 
        dtc.token_type,
        COALESCE(SUM(dtc.amount_claimed), 0) as amount_claimed,
        daily_limit - COALESCE(SUM(dtc.amount_claimed), 0) as remaining_limit
    FROM daily_token_claims dtc
    WHERE dtc.user_id = p_user_id 
      AND dtc.claim_date = p_date
    GROUP BY dtc.token_type
    
    UNION ALL
    
    -- Incluir tipos de token que no han sido reclamados
    SELECT 
        token_types.token_type,
        0::DECIMAL(20,8) as amount_claimed,
        daily_limit as remaining_limit
    FROM (VALUES ('CMPX'), ('GTK')) AS token_types(token_type)
    WHERE token_types.token_type NOT IN (
        SELECT DISTINCT dtc2.token_type 
        FROM daily_token_claims dtc2 
        WHERE dtc2.user_id = p_user_id 
          AND dtc2.claim_date = p_date
    );
END;
$$;


ALTER FUNCTION "public"."get_user_daily_claims"("p_user_id" "uuid", "p_date" "date") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."sync_reports_content_type"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Si se actualiza report_type, actualizar content_type
    IF NEW.report_type IS NOT NULL THEN
        NEW.content_type := NEW.report_type;
    END IF;
    
    -- Si se actualiza content_type, actualizar report_type
    IF NEW.content_type IS NOT NULL THEN
        NEW.report_type := NEW.content_type;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_reports_content_type"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_stories_media_url"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Si media_urls tiene valores y media_url está vacío, usar el primero
    IF NEW.media_urls IS NOT NULL AND array_length(NEW.media_urls, 1) > 0 AND 
       (NEW.media_url IS NULL OR NEW.media_url = '') THEN
        NEW.media_url := NEW.media_urls[1];
    END IF;
    
    -- Si media_url tiene valor y media_urls está vacío, crear array
    IF NEW.media_url IS NOT NULL AND NEW.media_url != '' AND 
       (NEW.media_urls IS NULL OR array_length(NEW.media_urls, 1) = 0) THEN
        NEW.media_urls := ARRAY[NEW.media_url];
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_stories_media_url"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_club_ratings"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Verificar si la tabla clubs tiene las columnas necesarias
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'average_rating') THEN
        UPDATE clubs 
        SET 
            average_rating = (
                SELECT COALESCE(AVG(rating), 0) 
                FROM club_reviews 
                WHERE club_id = COALESCE(NEW.club_id, OLD.club_id) 
                  AND verified = true
            ),
            total_reviews = (
                SELECT COUNT(*) 
                FROM club_reviews 
                WHERE club_id = COALESCE(NEW.club_id, OLD.club_id) 
                  AND verified = true
            ),
            updated_at = NOW()
        WHERE id = COALESCE(NEW.club_id, OLD.club_id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."update_club_ratings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_couple_agreements_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_couple_agreements_timestamp"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."update_nft_verifications_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_nft_verifications_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_predictive_match_scores_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_predictive_match_scores_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_profiles_full_name"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.full_name := TRIM(CONCAT(COALESCE(NEW.first_name, ''), ' ', COALESCE(NEW.last_name, '')));
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_profiles_full_name"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Actualizar last_active_date
  UPDATE user_points
  SET last_active_date = CURRENT_DATE,
      updated_at = NOW()
  WHERE user_id = NEW.user_id;
  
  -- Actualizar racha si es necesario
  -- (La lógica de racha se manejará en el servicio)
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_consents_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_consents_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_level"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_level VARCHAR(20);
  calculated_points INTEGER;
BEGIN
  -- Calcular total_points manualmente (porque es columna generada)
  calculated_points := NEW.daily_activity_points + NEW.referral_points + 
                       NEW.content_points + NEW.engagement_points + NEW.mission_points;
  
  -- Determinar nivel según puntos totales
  IF calculated_points >= 10000 THEN
    new_level := 'diamond';
  ELSIF calculated_points >= 3000 THEN
    new_level := 'gold';
  ELSIF calculated_points >= 1000 THEN
    new_level := 'silver';
  ELSE
    new_level := 'bronze';
  END IF;
  
  -- Actualizar solo si cambió
  IF NEW.level != new_level THEN
    NEW.level := new_level;
    NEW.updated_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_level"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_user_wallets_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_user_wallets_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_s2_cell"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Si hay lat/lng pero no s2_cell_id, avisar
  IF NEW.latitude IS NOT NULL 
     AND NEW.longitude IS NOT NULL 
     AND NEW.s2_cell_id IS NULL THEN
    RAISE NOTICE 'Profile % has lat/lng but no S2 cell ID. Should be calculated from backend.', NEW.id;
  END IF;
  
  -- Si hay s2_cell_id, validar formato (token de 1-20 caracteres)
  IF NEW.s2_cell_id IS NOT NULL THEN
    IF LENGTH(NEW.s2_cell_id) < 1 OR LENGTH(NEW.s2_cell_id) > 20 THEN
      RAISE EXCEPTION 'Invalid S2 cell ID format: %. Length must be between 1 and 20.', NEW.s2_cell_id;
    END IF;
  END IF;
  
  -- Validar nivel
  IF NEW.s2_level IS NOT NULL THEN
    IF NEW.s2_level < 10 OR NEW.s2_level > 20 THEN
      RAISE EXCEPTION 'Invalid S2 level: %. Must be between 10 and 20.', NEW.s2_level;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_s2_cell"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


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


CREATE TABLE IF NOT EXISTS "public"."anti_cheat_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "suspicious_patterns" "jsonb" NOT NULL,
    "risk_score" integer NOT NULL,
    "actions_taken" "jsonb" DEFAULT '[]'::"jsonb",
    "resolved" boolean DEFAULT false,
    "resolved_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."anti_cheat_log" OWNER TO "postgres";


COMMENT ON TABLE "public"."anti_cheat_log" IS 'Log de detección de actividades sospechosas';



CREATE TABLE IF NOT EXISTS "public"."app_config" (
    "key" "text" NOT NULL,
    "value" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."app_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."app_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "message" "text" NOT NULL,
    "level" "text" NOT NULL,
    "user_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."app_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."banner_config" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "banner_type" character varying(50) NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "show_close_button" boolean DEFAULT true,
    "background_color" character varying(100) DEFAULT 'from-purple-600 to-blue-600'::character varying,
    "text_color" character varying(50) DEFAULT 'text-white'::character varying,
    "icon_type" character varying(50),
    "cta_text" character varying(100),
    "cta_link" character varying(255),
    "storage_key" character varying(100),
    "priority" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "updated_by" "uuid"
);


ALTER TABLE "public"."banner_config" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."beta_rewards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "final_level" character varying(20) NOT NULL,
    "final_points" integer NOT NULL,
    "cmpx_tokens" integer NOT NULL,
    "premium_months" integer DEFAULT 0,
    "vip_months" integer DEFAULT 0,
    "lifetime_discount" numeric(3,2) DEFAULT 0,
    "badge" character varying(100) NOT NULL,
    "special_perks" "jsonb" DEFAULT '[]'::"jsonb",
    "rewards_claimed" boolean DEFAULT false,
    "claimed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "beta_rewards_final_level_check" CHECK ((("final_level")::"text" = ANY ((ARRAY['bronze'::character varying, 'silver'::character varying, 'gold'::character varying, 'diamond'::character varying])::"text"[])))
);


ALTER TABLE "public"."beta_rewards" OWNER TO "postgres";


COMMENT ON TABLE "public"."beta_rewards" IS 'Recompensas finales otorgadas al terminar la beta';



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


CREATE TABLE IF NOT EXISTS "public"."chat_rooms" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text",
    "description" "text",
    "created_by" "uuid" NOT NULL,
    "is_private" boolean DEFAULT false,
    "participants" "uuid"[] DEFAULT '{}'::"uuid"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_rooms" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_summaries" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "chat_room_id" "uuid" NOT NULL,
    "summary" "text",
    "key_points" "text"[] DEFAULT '{}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_summaries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consent_evidence" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "consent_id" "uuid" NOT NULL,
    "evidence_type" "text" NOT NULL,
    "evidence_data" "jsonb",
    "evidence_hash" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."consent_evidence" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content_type" character varying(20) NOT NULL,
    "content_id" "uuid",
    "likes_count" integer DEFAULT 0,
    "comments_count" integer DEFAULT 0,
    "shares_count" integer DEFAULT 0,
    "base_points" integer DEFAULT 0,
    "viral_bonus" integer DEFAULT 0,
    "total_points" integer GENERATED ALWAYS AS (("base_points" + "viral_bonus")) STORED,
    "is_viral" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "content_activities_content_type_check" CHECK ((("content_type")::"text" = ANY ((ARRAY['post'::character varying, 'photo'::character varying, 'video'::character varying, 'bio'::character varying, 'comment'::character varying])::"text"[])))
);


ALTER TABLE "public"."content_activities" OWNER TO "postgres";


COMMENT ON TABLE "public"."content_activities" IS 'Contenido creado por el usuario (posts, fotos, videos)';



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
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "couple_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "event_name" "text",
    "description" "text",
    "event_type" "public"."event_type" DEFAULT 'meetup'::"public"."event_type",
    "location" "text",
    "date" timestamp with time zone,
    "event_date" timestamp with time zone,
    "max_participants" integer,
    "participants" "text"[] DEFAULT '{}'::"text"[],
    "is_public" boolean DEFAULT false,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
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
    "preferences" "jsonb" DEFAULT '{}'::"jsonb",
    "agreement_id" "uuid",
    "dispute_status" "text" DEFAULT 'NONE'::"text",
    CONSTRAINT "couple_profiles_communication_preference_check" CHECK ((("communication_preference")::"text" = ANY ((ARRAY['both'::character varying, 'male_only'::character varying, 'female_only'::character varying])::"text"[]))),
    CONSTRAINT "couple_profiles_dispute_status_check" CHECK (("dispute_status" = ANY (ARRAY['NONE'::"text", 'ACTIVE'::"text", 'RESOLVED'::"text"]))),
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



COMMENT ON COLUMN "public"."couple_profiles"."preferences" IS 'Preferencias de la pareja (género, orientación sexual, etc.) almacenadas como JSON';



CREATE TABLE IF NOT EXISTS "public"."daily_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "activity_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "minutes_active" integer DEFAULT 0,
    "login_count" integer DEFAULT 1,
    "points_earned" integer DEFAULT 0,
    "streak_bonus" integer DEFAULT 0,
    "first_login_time" timestamp with time zone DEFAULT "now"(),
    "last_activity_time" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."daily_activities" OWNER TO "postgres";


COMMENT ON TABLE "public"."daily_activities" IS 'Registro de actividad diaria del usuario';



CREATE TABLE IF NOT EXISTS "public"."daily_token_claims" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "claim_date" "date" NOT NULL,
    "amount_claimed" bigint DEFAULT 0 NOT NULL,
    "wallet_address" "text",
    "transaction_hash" character varying(66),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "token_type" "text" DEFAULT 'CMPX'::"text",
    "network" "text" DEFAULT 'mumbai'::"text",
    CONSTRAINT "daily_token_claims_token_type_check" CHECK (("token_type" = ANY (ARRAY['CMPX'::"text", 'GTK'::"text"])))
);


ALTER TABLE "public"."daily_token_claims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."digital_fingerprints" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid",
    "canvas_hash" "text" NOT NULL,
    "combined_hash" "text" NOT NULL,
    "is_banned" boolean DEFAULT false,
    "ban_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."digital_fingerprints" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."engagement_activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "activity_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "likes_given" integer DEFAULT 0,
    "comments_made" integer DEFAULT 0,
    "shares_made" integer DEFAULT 0,
    "messages_sent" integer DEFAULT 0,
    "public_room_participation" boolean DEFAULT false,
    "points_earned" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."engagement_activities" OWNER TO "postgres";


COMMENT ON TABLE "public"."engagement_activities" IS 'Interacciones del usuario (likes, comentarios, shares)';



CREATE TABLE IF NOT EXISTS "public"."error_alerts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "error_message" "text" NOT NULL,
    "error_stack" "text",
    "category" "text" NOT NULL,
    "severity" "text" NOT NULL,
    "resolved" boolean DEFAULT false,
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    "user_id" "uuid",
    "url" "text",
    "user_agent" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."error_alerts" OWNER TO "postgres";


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
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "gallery_id" "uuid" NOT NULL,
    "creator_id" "uuid" NOT NULL,
    "transaction_type" "text" NOT NULL,
    "amount_cmpx" numeric(18,8) NOT NULL,
    "commission_amount_cmpx" numeric(18,8) NOT NULL,
    "creator_amount_cmpx" numeric(18,8) NOT NULL,
    "creator_paid" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
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


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "display_name" "text",
    "is_demo" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_premium" boolean DEFAULT false,
    "name" character varying(200),
    "latitude" double precision,
    "longitude" double precision,
    "account_type" "text",
    "age" integer,
    "s2_cell_id" character varying(20),
    "s2_level" smallint DEFAULT 15,
    "is_online" boolean DEFAULT false,
    "first_name" character varying(100),
    "last_name" character varying(100),
    "full_name" "text",
    "email_verified_at" timestamp with time zone,
    "phone_verified_at" timestamp with time zone,
    "role" "public"."user_role" DEFAULT 'user'::"public"."user_role",
    "agreement_id" "uuid",
    "dispute_id" "uuid",
    "consent_status" "text" DEFAULT 'PENDING'::"text",
    CONSTRAINT "profiles_consent_status_check" CHECK (("consent_status" = ANY (ARRAY['PENDING'::"text", 'ACCEPTED'::"text", 'REJECTED'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."name" IS 'Nombre completo del usuario (combinación de first_name y last_name)';



COMMENT ON COLUMN "public"."profiles"."s2_cell_id" IS 'S2 Geometry cell ID (token) calculado desde latitude/longitude. Nivel default 15 (~1km²)';



COMMENT ON COLUMN "public"."profiles"."s2_level" IS 'Nivel de precisión de la celda S2 (10-20). 15=~1km², 13=~10km², 17=~250m²';



COMMENT ON COLUMN "public"."profiles"."first_name" IS 'Nombre del usuario (requerido para registro)';



COMMENT ON COLUMN "public"."profiles"."last_name" IS 'Apellido del usuario (requerido para registro)';



COMMENT ON COLUMN "public"."profiles"."full_name" IS 'Nombre completo calculado desde first_name y last_name';



CREATE OR REPLACE VIEW "public"."geographic_hotspots" AS
 SELECT "profiles"."s2_cell_id",
    "count"(*) AS "active_users",
    "profiles"."s2_level",
    "round"("avg"("profiles"."age"), 1) AS "avg_age",
    "max"("profiles"."updated_at") AS "last_activity"
   FROM "public"."profiles"
  WHERE (("profiles"."s2_cell_id" IS NOT NULL) AND ("profiles"."updated_at" > ("now"() - '7 days'::interval)))
  GROUP BY "profiles"."s2_cell_id", "profiles"."s2_level"
 HAVING ("count"(*) >= 5)
  ORDER BY ("count"(*)) DESC;


ALTER TABLE "public"."geographic_hotspots" OWNER TO "postgres";


COMMENT ON VIEW "public"."geographic_hotspots" IS 'Celdas S2 con alta actividad (5+ usuarios activos en última semana)';



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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."invitations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user1_id" "uuid" NOT NULL,
    "user2_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "chat_room_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "message_type" "text" DEFAULT 'text'::"text",
    "media_url" "text",
    "is_edited" boolean DEFAULT false,
    "edited_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."missions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "mission_code" character varying(50) NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "mission_type" character varying(20) DEFAULT 'weekly'::character varying,
    "week_number" integer,
    "requirements" "jsonb" NOT NULL,
    "points_reward" integer NOT NULL,
    "token_reward" integer DEFAULT 0,
    "special_reward" "text",
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "missions_mission_type_check" CHECK ((("mission_type")::"text" = ANY ((ARRAY['daily'::character varying, 'weekly'::character varying, 'monthly'::character varying, 'special'::character varying])::"text"[])))
);


ALTER TABLE "public"."missions" OWNER TO "postgres";


COMMENT ON TABLE "public"."missions" IS 'Misiones y desafíos disponibles';



CREATE TABLE IF NOT EXISTS "public"."moderator_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "moderator_id" "uuid" NOT NULL,
    "session_start" timestamp with time zone DEFAULT "now"(),
    "session_end" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "total_minutes" integer DEFAULT 0,
    "reports_reviewed" integer DEFAULT 0,
    "actions_taken" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."moderator_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."monitoring_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_type" "text" NOT NULL,
    "start_time" timestamp with time zone DEFAULT "now"(),
    "end_time" timestamp with time zone,
    "duration_ms" integer,
    "metrics" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."monitoring_sessions" OWNER TO "postgres";


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
    "minted_with_gtk" integer NOT NULL,
    "staking_record_id" "uuid",
    "verified_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "nft_verifications_minted_with_gtk_check" CHECK (("minted_with_gtk" >= 100)),
    CONSTRAINT "nft_verifications_network_check" CHECK (("network" = ANY (ARRAY['polygon'::"text", 'ethereum'::"text"])))
);


ALTER TABLE "public"."nft_verifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."nft_verifications" IS 'Verificaciones NFT con GTK staking (mínimo 100 GTK)';



COMMENT ON COLUMN "public"."nft_verifications"."minted_with_gtk" IS 'Cantidad de GTK usada para mint (mínimo 100)';



COMMENT ON COLUMN "public"."nft_verifications"."staking_record_id" IS 'ID del staking record asociado';



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
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "text" NOT NULL,
    "metric_name" "text" NOT NULL,
    "value" numeric NOT NULL,
    "unit" "text" NOT NULL,
    "user_id" "uuid",
    "url" "text",
    "user_agent" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."performance_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."permanent_bans" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "ban_reason" "text" NOT NULL,
    "banned_at" timestamp with time zone DEFAULT "now"(),
    "banned_by" "uuid",
    "is_active" boolean DEFAULT true,
    "fingerprint_ids" "uuid"[] DEFAULT '{}'::"uuid"[],
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."permanent_bans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."points_transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "transaction_type" character varying(50) NOT NULL,
    "points_change" integer NOT NULL,
    "points_before" integer NOT NULL,
    "points_after" integer NOT NULL,
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."points_transactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."points_transactions" IS 'Historial completo de cambios en puntos';



CREATE TABLE IF NOT EXISTS "public"."predictive_match_scores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "matched_user_id" "uuid" NOT NULL,
    "total_score" numeric(5,2) NOT NULL,
    "compatibility_score" numeric(5,2) NOT NULL,
    "emotional_score" numeric(5,2) NOT NULL,
    "social_score" numeric(5,2) NOT NULL,
    "graph_score" numeric(5,2) NOT NULL,
    "confidence" numeric(3,2) NOT NULL,
    "reasons" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."predictive_match_scores" OWNER TO "postgres";


COMMENT ON TABLE "public"."predictive_match_scores" IS 'Scores de matching predictivo con Neo4j + IA Emocional';



CREATE TABLE IF NOT EXISTS "public"."referral_rewards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "verification_method" "text",
    "worldid_proof" "jsonb"
);


ALTER TABLE "public"."referral_rewards" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referral_statistics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "total_clicks" integer DEFAULT 0,
    "total_conversions" integer DEFAULT 0,
    "conversion_rate" numeric(5,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."referral_statistics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referral_transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "referred_user_id" "uuid",
    "amount" numeric(18,8) NOT NULL,
    "transaction_type" "public"."transaction_type" NOT NULL,
    "status" "text" DEFAULT 'completed'::"text",
    "balance_before" numeric(18,8),
    "balance_after" numeric(18,8),
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."referral_transactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "referrer_id" "uuid" NOT NULL,
    "referred_id" "uuid" NOT NULL,
    "status" character varying(20) DEFAULT 'invited'::character varying,
    "referral_code" character varying(50) NOT NULL,
    "points_earned" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "registered_at" timestamp with time zone,
    "verified_at" timestamp with time zone,
    "activated_at" timestamp with time zone,
    CONSTRAINT "referrals_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['invited'::character varying, 'registered'::character varying, 'verified'::character varying, 'active'::character varying])::"text"[])))
);


ALTER TABLE "public"."referrals" OWNER TO "postgres";


COMMENT ON TABLE "public"."referrals" IS 'Sistema de referidos y códigos de invitación';



CREATE TABLE IF NOT EXISTS "public"."report_ai_classification" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "report_id" "uuid" NOT NULL,
    "ai_confidence" numeric(5,2) NOT NULL,
    "ai_severity" "text" NOT NULL,
    "ai_category" "text",
    "ai_tags" "text"[] DEFAULT '{}'::"text"[],
    "ai_summary" "text",
    "detected_toxicity" numeric(5,2) DEFAULT 0,
    "detected_spam" numeric(5,2) DEFAULT 0,
    "detected_explicit" numeric(5,2) DEFAULT 0,
    "detected_harassment" numeric(5,2) DEFAULT 0,
    "suggested_priority" "text",
    "suggested_action" "text",
    "ai_model_version" character varying(50) DEFAULT 'v1.0'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
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
    "action_taken" "text",
    "is_false_positive" boolean,
    CONSTRAINT "reports_severity_check" CHECK (("severity" = ANY (ARRAY['low'::"text", 'medium'::"text", 'high'::"text", 'critical'::"text"]))),
    CONSTRAINT "reports_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'investigating'::"text", 'resolved'::"text", 'dismissed'::"text"])))
);


ALTER TABLE "public"."reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "ip_address" "inet",
    "user_agent" "text",
    "status" "text" DEFAULT 'logged'::"text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."security_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staking_records" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "token_type" "text" NOT NULL,
    "amount" numeric(18,8) NOT NULL,
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone,
    "reward_percentage" numeric(5,2),
    "apy" numeric(5,2),
    "reward_claimed" boolean DEFAULT false,
    "status" "text" DEFAULT 'active'::"text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."staking_records" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "media_url" "text" NOT NULL,
    "media_type" "text" DEFAULT 'image'::"text",
    "caption" "text",
    "duration" integer,
    "is_public" boolean DEFAULT true,
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
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
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "transaction_type" "text" NOT NULL,
    "token_type" "text" NOT NULL,
    "amount" numeric(18,8) NOT NULL,
    "balance_after" numeric(18,8),
    "description" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
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


CREATE TABLE IF NOT EXISTS "public"."user_identifiers" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "unique_id" character varying(255) NOT NULL,
    "user_id" "uuid" NOT NULL,
    "profile_type" "text" NOT NULL,
    "prefix" character varying(10),
    "numeric_id" integer,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_identifiers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_interests" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "interest_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_interests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_missions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "mission_id" "uuid" NOT NULL,
    "status" character varying(20) DEFAULT 'in_progress'::character varying,
    "progress" "jsonb" DEFAULT '{}'::"jsonb",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "claimed_at" timestamp with time zone,
    "points_received" integer DEFAULT 0,
    "tokens_received" integer DEFAULT 0,
    CONSTRAINT "user_missions_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['in_progress'::character varying, 'completed'::character varying, 'claimed'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_missions" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_missions" IS 'Progreso de misiones por usuario';



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
    "attributes" "jsonb" DEFAULT '[]'::"jsonb",
    CONSTRAINT "user_nfts_rarity_check" CHECK (("rarity" = ANY (ARRAY['common'::"text", 'rare'::"text", 'epic'::"text", 'legendary'::"text"])))
);


ALTER TABLE "public"."user_nfts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_points" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "daily_activity_points" integer DEFAULT 0,
    "referral_points" integer DEFAULT 0,
    "content_points" integer DEFAULT 0,
    "engagement_points" integer DEFAULT 0,
    "mission_points" integer DEFAULT 0,
    "total_points" integer GENERATED ALWAYS AS ((((("daily_activity_points" + "referral_points") + "content_points") + "engagement_points") + "mission_points")) STORED,
    "level" character varying(20) DEFAULT 'bronze'::character varying,
    "current_streak" integer DEFAULT 0,
    "longest_streak" integer DEFAULT 0,
    "last_active_date" "date" DEFAULT CURRENT_DATE,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_points_level_check" CHECK ((("level")::"text" = ANY ((ARRAY['bronze'::character varying, 'silver'::character varying, 'gold'::character varying, 'diamond'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_points" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_points" IS 'Puntos acumulados por usuario en el sistema de recompensas beta';



CREATE TABLE IF NOT EXISTS "public"."user_referral_balances" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "referral_code" character varying(20) NOT NULL,
    "total_referrals" integer DEFAULT 0,
    "total_earned" numeric(18,8) DEFAULT 0,
    "monthly_earned" numeric(18,8) DEFAULT 0,
    "cmpx_balance" numeric(18,8) DEFAULT 0,
    "last_reset_date" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_referral_balances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "assigned_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_roles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text", 'moderator'::"text", 'support'::"text"])))
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_token_balances" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "cmpx_balance" numeric(18,8) DEFAULT 0,
    "gtk_balance" numeric(18,8) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
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


CREATE TABLE IF NOT EXISTS "public"."web_vitals_history" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "lcp" numeric,
    "fcp" numeric,
    "fid" numeric,
    "cls" numeric,
    "ttfb" numeric,
    "url" "text",
    "user_agent" "text",
    "user_id" "uuid",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."web_vitals_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."worldid_verifications" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "world_id" character varying(255),
    "verification_level" "text",
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."worldid_verifications" OWNER TO "postgres";


ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."anti_cheat_log"
    ADD CONSTRAINT "anti_cheat_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."app_config"
    ADD CONSTRAINT "app_config_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."app_logs"
    ADD CONSTRAINT "app_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."banner_config"
    ADD CONSTRAINT "banner_config_banner_type_key" UNIQUE ("banner_type");



ALTER TABLE ONLY "public"."banner_config"
    ADD CONSTRAINT "banner_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."beta_rewards"
    ADD CONSTRAINT "beta_rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."beta_rewards"
    ADD CONSTRAINT "beta_rewards_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."blockchain_transactions"
    ADD CONSTRAINT "blockchain_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blockchain_transactions"
    ADD CONSTRAINT "blockchain_transactions_transaction_hash_key" UNIQUE ("transaction_hash");



ALTER TABLE ONLY "public"."chat_rooms"
    ADD CONSTRAINT "chat_rooms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_summaries"
    ADD CONSTRAINT "chat_summaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consent_evidence"
    ADD CONSTRAINT "consent_evidence_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content_activities"
    ADD CONSTRAINT "content_activities_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."daily_activities"
    ADD CONSTRAINT "daily_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_activities"
    ADD CONSTRAINT "daily_activities_user_id_activity_date_key" UNIQUE ("user_id", "activity_date");



ALTER TABLE ONLY "public"."daily_token_claims"
    ADD CONSTRAINT "daily_token_claims_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."daily_token_claims"
    ADD CONSTRAINT "daily_token_claims_unique_user_date_type" UNIQUE ("user_id", "claim_date", "token_type");



ALTER TABLE ONLY "public"."digital_fingerprints"
    ADD CONSTRAINT "digital_fingerprints_combined_hash_key" UNIQUE ("combined_hash");



ALTER TABLE ONLY "public"."digital_fingerprints"
    ADD CONSTRAINT "digital_fingerprints_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."engagement_activities"
    ADD CONSTRAINT "engagement_activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."engagement_activities"
    ADD CONSTRAINT "engagement_activities_user_id_activity_date_key" UNIQUE ("user_id", "activity_date");



ALTER TABLE ONLY "public"."error_alerts"
    ADD CONSTRAINT "error_alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."frozen_assets"
    ADD CONSTRAINT "frozen_assets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gallery_commissions"
    ADD CONSTRAINT "gallery_commissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gallery_permissions"
    ADD CONSTRAINT "gallery_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitation_templates"
    ADD CONSTRAINT "invitation_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitations"
    ADD CONSTRAINT "invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."missions"
    ADD CONSTRAINT "missions_mission_code_key" UNIQUE ("mission_code");



ALTER TABLE ONLY "public"."missions"
    ADD CONSTRAINT "missions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."moderator_sessions"
    ADD CONSTRAINT "moderator_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."monitoring_sessions"
    ADD CONSTRAINT "monitoring_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nft_staking"
    ADD CONSTRAINT "nft_staking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nft_verifications"
    ADD CONSTRAINT "nft_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nft_verifications"
    ADD CONSTRAINT "nft_verifications_user_id_nft_token_id_key" UNIQUE ("user_id", "nft_token_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."performance_metrics"
    ADD CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."permanent_bans"
    ADD CONSTRAINT "permanent_bans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."points_transactions"
    ADD CONSTRAINT "points_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predictive_match_scores"
    ADD CONSTRAINT "predictive_match_scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."predictive_match_scores"
    ADD CONSTRAINT "predictive_match_scores_user_id_matched_user_id_key" UNIQUE ("user_id", "matched_user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."referral_rewards"
    ADD CONSTRAINT "referral_rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_statistics"
    ADD CONSTRAINT "referral_statistics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referral_transactions"
    ADD CONSTRAINT "referral_transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referred_id_key" UNIQUE ("referred_id");



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referrer_id_referred_id_key" UNIQUE ("referrer_id", "referred_id");



ALTER TABLE ONLY "public"."report_ai_classification"
    ADD CONSTRAINT "report_ai_classification_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_events"
    ADD CONSTRAINT "security_events_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."testnet_token_claims"
    ADD CONSTRAINT "testnet_token_claims_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."user_identifiers"
    ADD CONSTRAINT "user_identifiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_identifiers"
    ADD CONSTRAINT "user_identifiers_unique_id_key" UNIQUE ("unique_id");



ALTER TABLE ONLY "public"."user_interests"
    ADD CONSTRAINT "user_interests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_missions"
    ADD CONSTRAINT "user_missions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_missions"
    ADD CONSTRAINT "user_missions_user_id_mission_id_key" UNIQUE ("user_id", "mission_id");



ALTER TABLE ONLY "public"."user_nfts"
    ADD CONSTRAINT "user_nfts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_points"
    ADD CONSTRAINT "user_points_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_points"
    ADD CONSTRAINT "user_points_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_referral_balances"
    ADD CONSTRAINT "user_referral_balances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_referral_balances"
    ADD CONSTRAINT "user_referral_balances_referral_code_key" UNIQUE ("referral_code");



ALTER TABLE ONLY "public"."user_referral_balances"
    ADD CONSTRAINT "user_referral_balances_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_token_balances"
    ADD CONSTRAINT "user_token_balances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_token_balances"
    ADD CONSTRAINT "user_token_balances_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_wallets"
    ADD CONSTRAINT "user_wallets_address_key" UNIQUE ("address");



ALTER TABLE ONLY "public"."user_wallets"
    ADD CONSTRAINT "user_wallets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."web_vitals_history"
    ADD CONSTRAINT "web_vitals_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."worldid_verifications"
    ADD CONSTRAINT "worldid_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."worldid_verifications"
    ADD CONSTRAINT "worldid_verifications_world_id_key" UNIQUE ("world_id");



CREATE INDEX "idx_analytics_events_event_name" ON "public"."analytics_events" USING "btree" ("event_name");



CREATE INDEX "idx_analytics_events_event_type" ON "public"."analytics_events" USING "btree" ("event_type");



CREATE INDEX "idx_analytics_events_session_id" ON "public"."analytics_events" USING "btree" ("session_id");



CREATE INDEX "idx_analytics_events_timestamp" ON "public"."analytics_events" USING "btree" ("timestamp");



CREATE INDEX "idx_analytics_events_user" ON "public"."analytics_events" USING "btree" ("user_id");



CREATE INDEX "idx_analytics_events_user_id" ON "public"."analytics_events" USING "btree" ("user_id");



CREATE INDEX "idx_anti_cheat_resolved" ON "public"."anti_cheat_log" USING "btree" ("resolved");



CREATE INDEX "idx_anti_cheat_risk" ON "public"."anti_cheat_log" USING "btree" ("risk_score" DESC);



CREATE INDEX "idx_anti_cheat_user" ON "public"."anti_cheat_log" USING "btree" ("user_id");



CREATE INDEX "idx_app_logs_created_at" ON "public"."app_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_app_logs_level" ON "public"."app_logs" USING "btree" ("level");



CREATE INDEX "idx_app_logs_user_id" ON "public"."app_logs" USING "btree" ("user_id");



CREATE INDEX "idx_banner_config_active" ON "public"."banner_config" USING "btree" ("is_active");



CREATE INDEX "idx_banner_config_priority" ON "public"."banner_config" USING "btree" ("priority" DESC);



CREATE INDEX "idx_banner_config_type" ON "public"."banner_config" USING "btree" ("banner_type");



CREATE INDEX "idx_banner_config_updated_at" ON "public"."banner_config" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_beta_rewards_level" ON "public"."beta_rewards" USING "btree" ("final_level");



CREATE INDEX "idx_beta_rewards_user" ON "public"."beta_rewards" USING "btree" ("user_id");



CREATE INDEX "idx_consent_evidence_consent_id" ON "public"."consent_evidence" USING "btree" ("consent_id");



CREATE INDEX "idx_consent_evidence_evidence_type" ON "public"."consent_evidence" USING "btree" ("evidence_type");



CREATE INDEX "idx_content_activities_type" ON "public"."content_activities" USING "btree" ("content_type");



CREATE INDEX "idx_content_activities_user" ON "public"."content_activities" USING "btree" ("user_id");



CREATE INDEX "idx_content_activities_viral" ON "public"."content_activities" USING "btree" ("is_viral");



CREATE INDEX "idx_couple_agreements_couple_id" ON "public"."couple_agreements" USING "btree" ("couple_id");



CREATE INDEX "idx_couple_agreements_dispute_deadline" ON "public"."couple_agreements" USING "btree" ("dispute_deadline");



CREATE INDEX "idx_couple_agreements_partner_1" ON "public"."couple_agreements" USING "btree" ("partner_1_id");



CREATE INDEX "idx_couple_agreements_partner_2" ON "public"."couple_agreements" USING "btree" ("partner_2_id");



CREATE INDEX "idx_couple_agreements_status" ON "public"."couple_agreements" USING "btree" ("status", "dispute_deadline");



CREATE INDEX "idx_couple_disputes_agreement_id" ON "public"."couple_disputes" USING "btree" ("couple_agreement_id");



CREATE INDEX "idx_couple_disputes_couple" ON "public"."couple_disputes" USING "btree" ("couple_id", "status");



CREATE INDEX "idx_couple_disputes_couple_id" ON "public"."couple_disputes" USING "btree" ("couple_id");



CREATE INDEX "idx_couple_disputes_created_at" ON "public"."couple_disputes" USING "btree" ("deadline_at", "status");



CREATE INDEX "idx_couple_disputes_deadline" ON "public"."couple_disputes" USING "btree" ("deadline_at", "status");



CREATE INDEX "idx_couple_disputes_initiated_by" ON "public"."couple_disputes" USING "btree" ("initiated_by");



CREATE INDEX "idx_couple_disputes_status" ON "public"."couple_disputes" USING "btree" ("status");



CREATE INDEX "idx_couple_nft_requests_expires" ON "public"."couple_nft_requests" USING "btree" ("expires_at");



CREATE INDEX "idx_couple_nft_requests_partner1" ON "public"."couple_nft_requests" USING "btree" ("partner1_address");



CREATE INDEX "idx_couple_nft_requests_partner2" ON "public"."couple_nft_requests" USING "btree" ("partner2_address");



CREATE INDEX "idx_couple_nft_requests_status" ON "public"."couple_nft_requests" USING "btree" ("status");



CREATE INDEX "idx_couple_profiles_age_range" ON "public"."couple_profiles" USING "btree" ("age_range_min", "age_range_max");



CREATE INDEX "idx_couple_profiles_agreement_id" ON "public"."couple_profiles" USING "btree" ("agreement_id");



CREATE INDEX "idx_couple_profiles_dispute_status" ON "public"."couple_profiles" USING "btree" ("dispute_status");



CREATE INDEX "idx_couple_profiles_experience_level" ON "public"."couple_profiles" USING "btree" ("experience_level");



CREATE INDEX "idx_couple_profiles_interested_in" ON "public"."couple_profiles" USING "btree" ("interested_in");



CREATE INDEX "idx_couple_profiles_is_demo" ON "public"."couple_profiles" USING "btree" ("is_demo");



CREATE INDEX "idx_couple_profiles_is_public" ON "public"."couple_profiles" USING "btree" ("is_public");



CREATE INDEX "idx_couple_profiles_last_active" ON "public"."couple_profiles" USING "btree" ("last_active");



CREATE INDEX "idx_couple_profiles_location" ON "public"."couple_profiles" USING "btree" ("latitude", "longitude");



CREATE INDEX "idx_couple_profiles_looking_for" ON "public"."couple_profiles" USING "btree" ("looking_for");



CREATE INDEX "idx_couple_profiles_partner_1_id" ON "public"."couple_profiles" USING "btree" ("partner_1_id");



CREATE INDEX "idx_couple_profiles_partner_2_id" ON "public"."couple_profiles" USING "btree" ("partner_2_id");



CREATE INDEX "idx_couple_profiles_preferences" ON "public"."couple_profiles" USING "gin" ("preferences");



CREATE INDEX "idx_couple_profiles_status" ON "public"."couple_profiles" USING "btree" ("status");



CREATE INDEX "idx_couple_profiles_swinger_experience" ON "public"."couple_profiles" USING "btree" ("swinger_experience");



CREATE INDEX "idx_couple_profiles_user_id" ON "public"."couple_profiles" USING "btree" ("user_id");



CREATE INDEX "idx_daily_activities_date" ON "public"."daily_activities" USING "btree" ("activity_date" DESC);



CREATE INDEX "idx_daily_activities_user_date" ON "public"."daily_activities" USING "btree" ("user_id", "activity_date" DESC);



CREATE INDEX "idx_daily_token_claims_date" ON "public"."daily_token_claims" USING "btree" ("claim_date" DESC);



CREATE INDEX "idx_daily_token_claims_token_type" ON "public"."daily_token_claims" USING "btree" ("token_type");



CREATE INDEX "idx_daily_token_claims_user_date" ON "public"."daily_token_claims" USING "btree" ("user_id", "claim_date");



CREATE INDEX "idx_daily_token_claims_wallet" ON "public"."daily_token_claims" USING "btree" ("wallet_address");



CREATE INDEX "idx_engagement_user_date" ON "public"."engagement_activities" USING "btree" ("user_id", "activity_date" DESC);



CREATE INDEX "idx_frozen_assets_asset_type" ON "public"."frozen_assets" USING "btree" ("asset_type");



CREATE INDEX "idx_frozen_assets_dispute_id" ON "public"."frozen_assets" USING "btree" ("dispute_id");



CREATE INDEX "idx_frozen_assets_owner" ON "public"."frozen_assets" USING "btree" ("original_owner_id", "asset_type");



CREATE INDEX "idx_gallery_permissions_gallery_owner_id" ON "public"."gallery_permissions" USING "btree" ("gallery_owner_id");



CREATE INDEX "idx_gallery_permissions_owner" ON "public"."gallery_permissions" USING "btree" ("gallery_owner_id");



CREATE INDEX "idx_gallery_permissions_status" ON "public"."gallery_permissions" USING "btree" ("status");



CREATE INDEX "idx_missions_active" ON "public"."missions" USING "btree" ("is_active", "start_date", "end_date");



CREATE INDEX "idx_missions_type" ON "public"."missions" USING "btree" ("mission_type");



CREATE INDEX "idx_nft_verifications_is_active" ON "public"."nft_verifications" USING "btree" ("is_active");



CREATE INDEX "idx_nft_verifications_staking_record_id" ON "public"."nft_verifications" USING "btree" ("staking_record_id");



CREATE INDEX "idx_nft_verifications_user_id" ON "public"."nft_verifications" USING "btree" ("user_id");



CREATE INDEX "idx_points_transactions_type" ON "public"."points_transactions" USING "btree" ("transaction_type");



CREATE INDEX "idx_points_transactions_user" ON "public"."points_transactions" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_predictive_match_scores_created_at" ON "public"."predictive_match_scores" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_predictive_match_scores_total_score" ON "public"."predictive_match_scores" USING "btree" ("total_score" DESC);



CREATE INDEX "idx_predictive_match_scores_user_id" ON "public"."predictive_match_scores" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_age" ON "public"."profiles" USING "btree" ("age") WHERE ("age" IS NOT NULL);



CREATE INDEX "idx_profiles_agreement_id" ON "public"."profiles" USING "btree" ("agreement_id");



CREATE INDEX "idx_profiles_analytics" ON "public"."profiles" USING "btree" ("created_at" DESC, "is_premium");



CREATE INDEX "idx_profiles_consent_status" ON "public"."profiles" USING "btree" ("consent_status");



CREATE INDEX "idx_profiles_created_at" ON "public"."profiles" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_profiles_dispute_id" ON "public"."profiles" USING "btree" ("dispute_id");



CREATE INDEX "idx_profiles_first_name" ON "public"."profiles" USING "btree" ("first_name");



CREATE INDEX "idx_profiles_full_name" ON "public"."profiles" USING "btree" ("full_name");



CREATE INDEX "idx_profiles_is_demo" ON "public"."profiles" USING "btree" ("is_demo");



CREATE INDEX "idx_profiles_is_premium" ON "public"."profiles" USING "btree" ("is_premium");



CREATE INDEX "idx_profiles_last_name" ON "public"."profiles" USING "btree" ("last_name");



CREATE INDEX "idx_profiles_name" ON "public"."profiles" USING "btree" ("name");



CREATE INDEX "idx_profiles_recent" ON "public"."profiles" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_profiles_s2_active" ON "public"."profiles" USING "btree" ("s2_cell_id", "updated_at" DESC) WHERE ("s2_cell_id" IS NOT NULL);



CREATE INDEX "idx_profiles_s2_cell" ON "public"."profiles" USING "btree" ("s2_cell_id") WHERE ("s2_cell_id" IS NOT NULL);



CREATE INDEX "idx_profiles_s2_level" ON "public"."profiles" USING "btree" ("s2_level", "s2_cell_id") WHERE ("s2_cell_id" IS NOT NULL);



CREATE INDEX "idx_profiles_user_id" ON "public"."profiles" USING "btree" ("user_id");



CREATE INDEX "idx_profiles_user_id_is_demo" ON "public"."profiles" USING "btree" ("user_id", "is_demo");



CREATE INDEX "idx_referral_rewards_verification_method" ON "public"."referral_rewards" USING "btree" ("verification_method");



CREATE INDEX "idx_referrals_code" ON "public"."referrals" USING "btree" ("referral_code");



CREATE INDEX "idx_referrals_referred" ON "public"."referrals" USING "btree" ("referred_id");



CREATE INDEX "idx_referrals_referrer" ON "public"."referrals" USING "btree" ("referrer_id");



CREATE INDEX "idx_referrals_status" ON "public"."referrals" USING "btree" ("status");



CREATE INDEX "idx_reports_content_type" ON "public"."reports" USING "btree" ("content_type", "created_at" DESC);



CREATE INDEX "idx_reports_created_at" ON "public"."reports" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_reports_status" ON "public"."reports" USING "btree" ("status", "created_at" DESC);



CREATE INDEX "idx_staking_records_status" ON "public"."staking_records" USING "btree" ("status");



CREATE INDEX "idx_staking_records_user_id" ON "public"."staking_records" USING "btree" ("user_id");



CREATE INDEX "idx_story_comments_story_id" ON "public"."story_comments" USING "btree" ("story_id");



CREATE INDEX "idx_story_comments_user_id" ON "public"."story_comments" USING "btree" ("user_id");



CREATE INDEX "idx_story_likes_story_id" ON "public"."story_likes" USING "btree" ("story_id");



CREATE INDEX "idx_story_likes_user_id" ON "public"."story_likes" USING "btree" ("user_id");



CREATE INDEX "idx_story_shares_story_id" ON "public"."story_shares" USING "btree" ("story_id");



CREATE INDEX "idx_story_shares_user_id" ON "public"."story_shares" USING "btree" ("user_id");



CREATE INDEX "idx_testnet_token_claims_claimed" ON "public"."testnet_token_claims" USING "btree" ("claimed_at" DESC);



CREATE INDEX "idx_testnet_token_claims_user" ON "public"."testnet_token_claims" USING "btree" ("user_id");



CREATE INDEX "idx_testnet_token_claims_wallet" ON "public"."testnet_token_claims" USING "btree" ("wallet_address");



CREATE INDEX "idx_token_transactions_created_at" ON "public"."token_transactions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_token_transactions_user_id" ON "public"."token_transactions" USING "btree" ("user_id");



CREATE INDEX "idx_user_consents_consent_type" ON "public"."user_consents" USING "btree" ("consent_type");



CREATE INDEX "idx_user_consents_created_at" ON "public"."user_consents" USING "btree" ("created_at");



CREATE INDEX "idx_user_consents_is_active" ON "public"."user_consents" USING "btree" ("is_active");



CREATE INDEX "idx_user_consents_user_id" ON "public"."user_consents" USING "btree" ("user_id");



CREATE INDEX "idx_user_consents_user_type" ON "public"."user_consents" USING "btree" ("user_id", "consent_type") WHERE ("is_active" = true);



CREATE INDEX "idx_user_identifiers_unique_id" ON "public"."user_identifiers" USING "btree" ("unique_id");



CREATE INDEX "idx_user_identifiers_user_id" ON "public"."user_identifiers" USING "btree" ("user_id");



CREATE INDEX "idx_user_missions_status" ON "public"."user_missions" USING "btree" ("status");



CREATE INDEX "idx_user_missions_user" ON "public"."user_missions" USING "btree" ("user_id");



CREATE INDEX "idx_user_nfts_couple" ON "public"."user_nfts" USING "btree" ("is_couple");



CREATE INDEX "idx_user_nfts_owner" ON "public"."user_nfts" USING "btree" ("owner_address");



CREATE INDEX "idx_user_nfts_rarity" ON "public"."user_nfts" USING "btree" ("rarity");



CREATE INDEX "idx_user_nfts_staked" ON "public"."user_nfts" USING "btree" ("is_staked");



CREATE INDEX "idx_user_nfts_token_id" ON "public"."user_nfts" USING "btree" ("token_id");



CREATE INDEX "idx_user_points_level" ON "public"."user_points" USING "btree" ("level");



CREATE INDEX "idx_user_points_total" ON "public"."user_points" USING "btree" ("total_points" DESC);



CREATE INDEX "idx_user_points_user_id" ON "public"."user_points" USING "btree" ("user_id");



CREATE INDEX "idx_user_roles_user" ON "public"."user_roles" USING "btree" ("user_id");



CREATE INDEX "idx_user_token_balances_user_id" ON "public"."user_token_balances" USING "btree" ("user_id");



CREATE INDEX "idx_user_wallets_address" ON "public"."user_wallets" USING "btree" ("address");



CREATE INDEX "idx_user_wallets_network" ON "public"."user_wallets" USING "btree" ("network");



CREATE INDEX "idx_user_wallets_user_id" ON "public"."user_wallets" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "gallery_permissions_updated_at" BEFORE UPDATE ON "public"."gallery_permissions" FOR EACH ROW EXECUTE FUNCTION "public"."update_gallery_permissions_updated_at"();



CREATE OR REPLACE TRIGGER "invitations_updated_at" BEFORE UPDATE ON "public"."invitations" FOR EACH ROW EXECUTE FUNCTION "public"."update_invitations_updated_at"();



CREATE OR REPLACE TRIGGER "sync_reports_content_type_trigger" BEFORE INSERT OR UPDATE ON "public"."reports" FOR EACH ROW EXECUTE FUNCTION "public"."sync_reports_content_type"();



CREATE OR REPLACE TRIGGER "trigger_check_couple_agreement_signatures" BEFORE UPDATE ON "public"."couple_agreements" FOR EACH ROW EXECUTE FUNCTION "public"."check_couple_agreement_signatures"();



CREATE OR REPLACE TRIGGER "trigger_couple_nft_requests_updated_at" BEFORE UPDATE ON "public"."couple_nft_requests" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_update_couple_agreements_timestamp" BEFORE UPDATE ON "public"."couple_agreements" FOR EACH ROW EXECUTE FUNCTION "public"."update_couple_agreements_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_nft_verifications_updated_at" BEFORE UPDATE ON "public"."nft_verifications" FOR EACH ROW EXECUTE FUNCTION "public"."update_nft_verifications_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_predictive_match_scores_updated_at" BEFORE UPDATE ON "public"."predictive_match_scores" FOR EACH ROW EXECUTE FUNCTION "public"."update_predictive_match_scores_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_user_activity" AFTER INSERT OR UPDATE ON "public"."daily_activities" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_activity"();



CREATE OR REPLACE TRIGGER "trigger_update_user_consents_timestamp" BEFORE UPDATE ON "public"."user_consents" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_consents_timestamp"();



CREATE OR REPLACE TRIGGER "trigger_update_user_level" BEFORE UPDATE ON "public"."user_points" FOR EACH ROW EXECUTE FUNCTION "public"."update_user_level"();



CREATE OR REPLACE TRIGGER "trigger_user_nfts_updated_at" BEFORE UPDATE ON "public"."user_nfts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_user_wallets_updated_at" BEFORE UPDATE ON "public"."user_wallets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "trigger_validate_s2_cell" BEFORE INSERT OR UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."validate_s2_cell"();



CREATE OR REPLACE TRIGGER "update_banner_config_updated_at" BEFORE UPDATE ON "public"."banner_config" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_couple_profiles_updated_at" BEFORE UPDATE ON "public"."couple_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_full_name_trigger" BEFORE INSERT OR UPDATE OF "first_name", "last_name" ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_profiles_full_name"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_referral_transactions_updated_at" BEFORE UPDATE ON "public"."referral_transactions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_reports_updated_at" BEFORE UPDATE ON "public"."reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_staking_records_updated_at" BEFORE UPDATE ON "public"."staking_records" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_story_comments_updated_at" BEFORE UPDATE ON "public"."story_comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_referral_balances_updated_at" BEFORE UPDATE ON "public"."user_referral_balances" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_token_balances_updated_at" BEFORE UPDATE ON "public"."user_token_balances" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_wallets_updated_at" BEFORE UPDATE ON "public"."user_wallets" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."anti_cheat_log"
    ADD CONSTRAINT "anti_cheat_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."app_logs"
    ADD CONSTRAINT "app_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."banner_config"
    ADD CONSTRAINT "banner_config_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."banner_config"
    ADD CONSTRAINT "banner_config_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."beta_rewards"
    ADD CONSTRAINT "beta_rewards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blockchain_transactions"
    ADD CONSTRAINT "blockchain_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chat_rooms"
    ADD CONSTRAINT "chat_rooms_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_summaries"
    ADD CONSTRAINT "chat_summaries_chat_room_id_fkey" FOREIGN KEY ("chat_room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content_activities"
    ADD CONSTRAINT "content_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."couple_events"
    ADD CONSTRAINT "couple_events_couple_id_fkey" FOREIGN KEY ("couple_id") REFERENCES "public"."couple_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."couple_events"
    ADD CONSTRAINT "couple_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."couple_profiles"
    ADD CONSTRAINT "couple_profiles_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "public"."couple_agreements"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."couple_profiles"
    ADD CONSTRAINT "couple_profiles_partner_1_id_fkey" FOREIGN KEY ("partner_1_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."couple_profiles"
    ADD CONSTRAINT "couple_profiles_partner_2_id_fkey" FOREIGN KEY ("partner_2_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."couple_profiles"
    ADD CONSTRAINT "couple_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."daily_activities"
    ADD CONSTRAINT "daily_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."daily_token_claims"
    ADD CONSTRAINT "daily_token_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."digital_fingerprints"
    ADD CONSTRAINT "digital_fingerprints_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."engagement_activities"
    ADD CONSTRAINT "engagement_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."error_alerts"
    ADD CONSTRAINT "error_alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."error_alerts"
    ADD CONSTRAINT "error_alerts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."consent_evidence"
    ADD CONSTRAINT "fk_consent" FOREIGN KEY ("consent_id") REFERENCES "public"."user_consents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."frozen_assets"
    ADD CONSTRAINT "frozen_assets_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "public"."couple_disputes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."frozen_assets"
    ADD CONSTRAINT "frozen_assets_original_owner_id_fkey" FOREIGN KEY ("original_owner_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."gallery_commissions"
    ADD CONSTRAINT "gallery_commissions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_chat_room_id_fkey" FOREIGN KEY ("chat_room_id") REFERENCES "public"."chat_rooms"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."moderator_sessions"
    ADD CONSTRAINT "moderator_sessions_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."monitoring_sessions"
    ADD CONSTRAINT "monitoring_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."points_transactions"
    ADD CONSTRAINT "points_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."predictive_match_scores"
    ADD CONSTRAINT "predictive_match_scores_matched_user_id_fkey" FOREIGN KEY ("matched_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."predictive_match_scores"
    ADD CONSTRAINT "predictive_match_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_agreement_id_fkey" FOREIGN KEY ("agreement_id") REFERENCES "public"."couple_agreements"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_dispute_id_fkey" FOREIGN KEY ("dispute_id") REFERENCES "public"."couple_disputes"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_statistics"
    ADD CONSTRAINT "referral_statistics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referral_transactions"
    ADD CONSTRAINT "referral_transactions_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."referral_transactions"
    ADD CONSTRAINT "referral_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referred_id_fkey" FOREIGN KEY ("referred_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."report_ai_classification"
    ADD CONSTRAINT "report_ai_classification_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reports"
    ADD CONSTRAINT "reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."security_events"
    ADD CONSTRAINT "security_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staking_records"
    ADD CONSTRAINT "staking_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stories"
    ADD CONSTRAINT "stories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_comments"
    ADD CONSTRAINT "story_comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."story_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_comments"
    ADD CONSTRAINT "story_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_likes"
    ADD CONSTRAINT "story_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."story_shares"
    ADD CONSTRAINT "story_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."testnet_token_claims"
    ADD CONSTRAINT "testnet_token_claims_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."token_transactions"
    ADD CONSTRAINT "token_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_consents"
    ADD CONSTRAINT "user_consents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_identifiers"
    ADD CONSTRAINT "user_identifiers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_interests"
    ADD CONSTRAINT "user_interests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_missions"
    ADD CONSTRAINT "user_missions_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_missions"
    ADD CONSTRAINT "user_missions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_points"
    ADD CONSTRAINT "user_points_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_referral_balances"
    ADD CONSTRAINT "user_referral_balances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_token_balances"
    ADD CONSTRAINT "user_token_balances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_wallets"
    ADD CONSTRAINT "user_wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."web_vitals_history"
    ADD CONSTRAINT "web_vitals_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."worldid_verifications"
    ADD CONSTRAINT "worldid_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage banners" ON "public"."banner_config" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."user_id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view all analytics events" ON "public"."analytics_events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_roles"
  WHERE (("user_roles"."user_id" = "auth"."uid"()) AND ("user_roles"."role" = ANY (ARRAY['admin'::"text", 'superadmin'::"text"]))))));



CREATE POLICY "Demo users only see demo profiles" ON "public"."profiles" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND ("is_demo" = true) AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "current_user_profile"
  WHERE (("current_user_profile"."user_id" = "auth"."uid"()) AND ("current_user_profile"."is_demo" = true))))));



COMMENT ON POLICY "Demo users only see demo profiles" ON "public"."profiles" IS 'Política de seguridad: Usuarios demo (is_demo=true) solo pueden ver otros perfiles demo. Mantiene aislamiento completo entre ecosistemas.';



CREATE POLICY "Everyone can view active banners" ON "public"."banner_config" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Real users only see real profiles" ON "public"."profiles" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND ("is_demo" = false) AND (EXISTS ( SELECT 1
   FROM "public"."profiles" "current_user_profile"
  WHERE (("current_user_profile"."user_id" = "auth"."uid"()) AND ("current_user_profile"."is_demo" = false))))));



COMMENT ON POLICY "Real users only see real profiles" ON "public"."profiles" IS 'Política de seguridad: Usuarios reales (is_demo=false) solo pueden ver otros perfiles reales. Previene que usuarios reales vean perfiles demo.';



CREATE POLICY "Service can insert activities" ON "public"."daily_activities" FOR INSERT WITH CHECK (true);



CREATE POLICY "Service can insert points" ON "public"."user_points" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert analytics events" ON "public"."analytics_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can create couple NFT requests" ON "public"."couple_nft_requests" FOR INSERT WITH CHECK ((("auth"."uid"())::"text" IN ( SELECT ("user_wallets"."user_id")::"text" AS "user_id"
   FROM "public"."user_wallets"
  WHERE (("user_wallets"."address")::"text" = "couple_nft_requests"."initiator_address"))));



CREATE POLICY "Users can create matches" ON "public"."matches" FOR INSERT WITH CHECK ((("auth"."uid"() = "user1_id") OR (EXISTS ( SELECT 1
   FROM "pg_roles"
  WHERE (("pg_roles"."rolname" = CURRENT_USER) AND ("pg_roles"."rolname" = ANY (ARRAY['postgres'::"name", 'service_role'::"name"])))))));



CREATE POLICY "Users can create own NFT verifications" ON "public"."nft_verifications" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own story comments" ON "public"."story_comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own story likes" ON "public"."story_likes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own story shares" ON "public"."story_shares" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create reports" ON "public"."reports" FOR INSERT WITH CHECK ((("auth"."uid"() = "reporter_user_id") AND (( SELECT "count"(*) AS "count"
   FROM "public"."reports" "reports_1"
  WHERE (("reports_1"."reporter_user_id" = "auth"."uid"()) AND ("reports_1"."created_at" > ("now"() - '24:00:00'::interval)))) < 5)));



CREATE POLICY "Users can create their daily claims" ON "public"."daily_token_claims" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own story comments" ON "public"."story_comments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own story likes" ON "public"."story_likes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own matches" ON "public"."matches" FOR DELETE USING ((("auth"."uid"() = "user1_id") OR ("auth"."uid"() = "user2_id")));



CREATE POLICY "Users can insert own profile" ON "public"."profiles" FOR INSERT WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can manage their own wallets" ON "public"."user_wallets" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "notifications"."user_id") AND ("profiles"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"()))) WITH CHECK ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can update own story comments" ON "public"."story_comments" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own token balance" ON "public"."user_token_balances" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own wallet" ON "public"."user_wallets" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own matches" ON "public"."matches" FOR UPDATE USING ((("auth"."uid"() = "user1_id") OR ("auth"."uid"() = "user2_id"))) WITH CHECK ((("auth"."uid"() = "user1_id") OR ("auth"."uid"() = "user2_id")));



CREATE POLICY "Users can view all profiles" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Users can view all story comments" ON "public"."story_comments" FOR SELECT USING (true);



CREATE POLICY "Users can view all story likes" ON "public"."story_likes" FOR SELECT USING (true);



CREATE POLICY "Users can view all story shares" ON "public"."story_shares" FOR SELECT USING (true);



CREATE POLICY "Users can view own NFT verifications" ON "public"."nft_verifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own activities" ON "public"."daily_activities" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own analytics events" ON "public"."analytics_events" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own content" ON "public"."content_activities" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own engagement" ON "public"."engagement_activities" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own missions" ON "public"."user_missions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "notifications"."user_id") AND ("profiles"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own points" ON "public"."user_points" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own predictive match scores" ON "public"."predictive_match_scores" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND ("user_id" = "auth"."uid"())));



COMMENT ON POLICY "Users can view own profile" ON "public"."profiles" IS 'Permite que cualquier usuario autenticado pueda ver su propio perfil, independientemente del tipo (demo/real).';



CREATE POLICY "Users can view own referrals" ON "public"."referrals" FOR SELECT USING ((("auth"."uid"() = "referrer_id") OR ("auth"."uid"() = "referred_id")));



CREATE POLICY "Users can view own rewards" ON "public"."beta_rewards" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own token balance" ON "public"."user_token_balances" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own transactions" ON "public"."points_transactions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own wallet" ON "public"."user_wallets" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their NFTs" ON "public"."user_nfts" FOR SELECT USING ((("auth"."uid"())::"text" IN ( SELECT ("user_wallets"."user_id")::"text" AS "user_id"
   FROM "public"."user_wallets"
  WHERE (("user_wallets"."address")::"text" = ANY ((ARRAY[("user_nfts"."owner_address")::character varying, ("user_nfts"."partner_address")::character varying])::"text"[])))));



CREATE POLICY "Users can view their couple NFT requests" ON "public"."couple_nft_requests" FOR SELECT USING ((("auth"."uid"())::"text" IN ( SELECT ("user_wallets"."user_id")::"text" AS "user_id"
   FROM "public"."user_wallets"
  WHERE (("user_wallets"."address")::"text" = ANY ((ARRAY[("couple_nft_requests"."partner1_address")::character varying, ("couple_nft_requests"."partner2_address")::character varying])::"text"[])))));



CREATE POLICY "Users can view their daily claims" ON "public"."daily_token_claims" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own matches" ON "public"."matches" FOR SELECT USING ((("auth"."uid"() = "user1_id") OR ("auth"."uid"() = "user2_id")));



CREATE POLICY "Users can view their own reports" ON "public"."reports" FOR SELECT USING (("auth"."uid"() = "reporter_user_id"));



CREATE POLICY "Users can view their testnet claims" ON "public"."testnet_token_claims" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."app_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."banner_config" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."beta_rewards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blockchain_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_rooms" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."couple_agreements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "couple_agreements_partner_access" ON "public"."couple_agreements" FOR SELECT USING ((("auth"."uid"() = "partner_1_id") OR ("auth"."uid"() = "partner_2_id")));



CREATE POLICY "couple_agreements_partner_update" ON "public"."couple_agreements" FOR UPDATE USING ((("auth"."uid"() = "partner_1_id") OR ("auth"."uid"() = "partner_2_id")));



ALTER TABLE "public"."couple_disputes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "couple_disputes_partner_access" ON "public"."couple_disputes" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."couple_agreements" "ca"
  WHERE (("ca"."id" = "couple_disputes"."couple_agreement_id") AND (("ca"."partner_1_id" = "auth"."uid"()) OR ("ca"."partner_2_id" = "auth"."uid"()))))));



ALTER TABLE "public"."couple_nft_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."couple_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."daily_token_claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."digital_fingerprints" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."engagement_activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."error_alerts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."frozen_assets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gallery_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."matches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."monitoring_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nft_staking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nft_verifications" ENABLE ROW LEVEL SECURITY;


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



ALTER TABLE "public"."performance_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."points_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."predictive_match_scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referral_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_events" ENABLE ROW LEVEL SECURITY;


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



ALTER TABLE "public"."staking_records" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."stories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."story_comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "story_comments_access" ON "public"."story_comments" USING (true) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."story_likes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "story_likes_access" ON "public"."story_likes" USING (true) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."story_shares" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "story_shares_access" ON "public"."story_shares" USING (true) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."testnet_token_claims" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."token_staking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."token_transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_consents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_consents_self_access" ON "public"."user_consents" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "user_consents_self_update" ON "public"."user_consents" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_identifiers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_missions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_nfts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_points" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_referral_balances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_token_balances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_wallets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."web_vitals_history" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





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































































































































































GRANT ALL ON FUNCTION "public"."check_couple_agreement_signatures"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_couple_agreement_signatures"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_couple_agreement_signatures"() TO "service_role";



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



GRANT ALL ON FUNCTION "public"."cleanup_expired_couple_requests"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_couple_requests"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_couple_requests"() TO "service_role";



GRANT ALL ON FUNCTION "public"."count_users_per_cell"() TO "anon";
GRANT ALL ON FUNCTION "public"."count_users_per_cell"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_users_per_cell"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_profiles_in_cells"("cell_ids" "text"[], "limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_profiles_in_cells"("cell_ids" "text"[], "limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_profiles_in_cells"("cell_ids" "text"[], "limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_daily_claims"("p_user_id" "uuid", "p_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_daily_claims"("p_user_id" "uuid", "p_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_daily_claims"("p_user_id" "uuid", "p_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_btree_consistent"("internal", smallint, "anyelement", integer, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_btree_consistent"("internal", smallint, "anyelement", integer, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_btree_consistent"("internal", smallint, "anyelement", integer, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_btree_consistent"("internal", smallint, "anyelement", integer, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_anyenum"("anyenum", "anyenum", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_anyenum"("anyenum", "anyenum", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_anyenum"("anyenum", "anyenum", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_anyenum"("anyenum", "anyenum", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bit"(bit, bit, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bit"(bit, bit, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bit"(bit, bit, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bit"(bit, bit, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bool"(boolean, boolean, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bool"(boolean, boolean, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bool"(boolean, boolean, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bool"(boolean, boolean, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bpchar"(character, character, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bpchar"(character, character, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bpchar"(character, character, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bpchar"(character, character, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bytea"("bytea", "bytea", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bytea"("bytea", "bytea", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bytea"("bytea", "bytea", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_bytea"("bytea", "bytea", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_char"("char", "char", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_char"("char", "char", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_char"("char", "char", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_char"("char", "char", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_cidr"("cidr", "cidr", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_cidr"("cidr", "cidr", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_cidr"("cidr", "cidr", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_cidr"("cidr", "cidr", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_date"("date", "date", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_date"("date", "date", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_date"("date", "date", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_date"("date", "date", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float4"(real, real, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float4"(real, real, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float4"(real, real, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float4"(real, real, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float8"(double precision, double precision, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float8"(double precision, double precision, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float8"(double precision, double precision, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_float8"(double precision, double precision, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_inet"("inet", "inet", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_inet"("inet", "inet", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_inet"("inet", "inet", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_inet"("inet", "inet", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int2"(smallint, smallint, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int2"(smallint, smallint, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int2"(smallint, smallint, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int2"(smallint, smallint, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int4"(integer, integer, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int4"(integer, integer, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int4"(integer, integer, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int4"(integer, integer, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int8"(bigint, bigint, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int8"(bigint, bigint, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int8"(bigint, bigint, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_int8"(bigint, bigint, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_interval"(interval, interval, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_interval"(interval, interval, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_interval"(interval, interval, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_interval"(interval, interval, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr"("macaddr", "macaddr", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr"("macaddr", "macaddr", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr"("macaddr", "macaddr", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr"("macaddr", "macaddr", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr8"("macaddr8", "macaddr8", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr8"("macaddr8", "macaddr8", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr8"("macaddr8", "macaddr8", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_macaddr8"("macaddr8", "macaddr8", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_money"("money", "money", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_money"("money", "money", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_money"("money", "money", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_money"("money", "money", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_name"("name", "name", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_name"("name", "name", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_name"("name", "name", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_name"("name", "name", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_numeric"(numeric, numeric, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_numeric"(numeric, numeric, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_numeric"(numeric, numeric, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_numeric"(numeric, numeric, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_oid"("oid", "oid", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_oid"("oid", "oid", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_oid"("oid", "oid", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_oid"("oid", "oid", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_text"("text", "text", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_text"("text", "text", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_text"("text", "text", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_text"("text", "text", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_time"(time without time zone, time without time zone, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_time"(time without time zone, time without time zone, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_time"(time without time zone, time without time zone, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_time"(time without time zone, time without time zone, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamp"(timestamp without time zone, timestamp without time zone, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamp"(timestamp without time zone, timestamp without time zone, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamp"(timestamp without time zone, timestamp without time zone, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamp"(timestamp without time zone, timestamp without time zone, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamptz"(timestamp with time zone, timestamp with time zone, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamptz"(timestamp with time zone, timestamp with time zone, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamptz"(timestamp with time zone, timestamp with time zone, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timestamptz"(timestamp with time zone, timestamp with time zone, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timetz"(time with time zone, time with time zone, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timetz"(time with time zone, time with time zone, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timetz"(time with time zone, time with time zone, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_timetz"(time with time zone, time with time zone, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_uuid"("uuid", "uuid", smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_uuid"("uuid", "uuid", smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_uuid"("uuid", "uuid", smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_uuid"("uuid", "uuid", smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_compare_prefix_varbit"(bit varying, bit varying, smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_varbit"(bit varying, bit varying, smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_varbit"(bit varying, bit varying, smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_compare_prefix_varbit"(bit varying, bit varying, smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_enum_cmp"("anyenum", "anyenum") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_enum_cmp"("anyenum", "anyenum") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_enum_cmp"("anyenum", "anyenum") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_enum_cmp"("anyenum", "anyenum") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_anyenum"("anyenum", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_anyenum"("anyenum", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_anyenum"("anyenum", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_anyenum"("anyenum", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_bit"(bit, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bit"(bit, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bit"(bit, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bit"(bit, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_bool"(boolean, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bool"(boolean, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bool"(boolean, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bool"(boolean, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_bpchar"(character, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bpchar"(character, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bpchar"(character, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bpchar"(character, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_bytea"("bytea", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bytea"("bytea", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bytea"("bytea", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_bytea"("bytea", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_char"("char", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_char"("char", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_char"("char", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_char"("char", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_cidr"("cidr", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_cidr"("cidr", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_cidr"("cidr", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_cidr"("cidr", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_date"("date", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_date"("date", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_date"("date", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_date"("date", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_float4"(real, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_float4"(real, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_float4"(real, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_float4"(real, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_float8"(double precision, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_float8"(double precision, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_float8"(double precision, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_float8"(double precision, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_inet"("inet", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_inet"("inet", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_inet"("inet", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_inet"("inet", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_int2"(smallint, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int2"(smallint, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int2"(smallint, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int2"(smallint, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_int4"(integer, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int4"(integer, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int4"(integer, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int4"(integer, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_int8"(bigint, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int8"(bigint, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int8"(bigint, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_int8"(bigint, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_interval"(interval, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_interval"(interval, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_interval"(interval, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_interval"(interval, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr"("macaddr", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr"("macaddr", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr"("macaddr", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr"("macaddr", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr8"("macaddr8", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr8"("macaddr8", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr8"("macaddr8", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_macaddr8"("macaddr8", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_money"("money", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_money"("money", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_money"("money", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_money"("money", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_name"("name", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_name"("name", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_name"("name", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_name"("name", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_numeric"(numeric, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_numeric"(numeric, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_numeric"(numeric, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_numeric"(numeric, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_oid"("oid", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_oid"("oid", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_oid"("oid", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_oid"("oid", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_text"("text", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_text"("text", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_text"("text", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_text"("text", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_time"(time without time zone, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_time"(time without time zone, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_time"(time without time zone, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_time"(time without time zone, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamp"(timestamp without time zone, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamp"(timestamp without time zone, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamp"(timestamp without time zone, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamp"(timestamp without time zone, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamptz"(timestamp with time zone, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamptz"(timestamp with time zone, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamptz"(timestamp with time zone, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timestamptz"(timestamp with time zone, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_timetz"(time with time zone, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timetz"(time with time zone, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timetz"(time with time zone, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_timetz"(time with time zone, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_uuid"("uuid", "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_uuid"("uuid", "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_uuid"("uuid", "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_uuid"("uuid", "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_varbit"(bit varying, "internal", smallint, "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_varbit"(bit varying, "internal", smallint, "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_varbit"(bit varying, "internal", smallint, "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_varbit"(bit varying, "internal", smallint, "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_anyenum"("anyenum", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_anyenum"("anyenum", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_anyenum"("anyenum", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_anyenum"("anyenum", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_bit"(bit, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bit"(bit, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bit"(bit, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bit"(bit, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_bool"(boolean, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bool"(boolean, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bool"(boolean, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bool"(boolean, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_bpchar"(character, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bpchar"(character, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bpchar"(character, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bpchar"(character, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_bytea"("bytea", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bytea"("bytea", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bytea"("bytea", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_bytea"("bytea", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_char"("char", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_char"("char", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_char"("char", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_char"("char", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_cidr"("cidr", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_cidr"("cidr", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_cidr"("cidr", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_cidr"("cidr", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_date"("date", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_date"("date", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_date"("date", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_date"("date", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_float4"(real, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_float4"(real, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_float4"(real, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_float4"(real, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_float8"(double precision, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_float8"(double precision, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_float8"(double precision, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_float8"(double precision, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_inet"("inet", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_inet"("inet", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_inet"("inet", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_inet"("inet", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_int2"(smallint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int2"(smallint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int2"(smallint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int2"(smallint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_int4"(integer, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int4"(integer, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int4"(integer, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int4"(integer, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_int8"(bigint, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int8"(bigint, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int8"(bigint, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_int8"(bigint, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_interval"(interval, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_interval"(interval, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_interval"(interval, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_interval"(interval, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr"("macaddr", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr"("macaddr", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr"("macaddr", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr"("macaddr", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr8"("macaddr8", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr8"("macaddr8", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr8"("macaddr8", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_macaddr8"("macaddr8", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_money"("money", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_money"("money", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_money"("money", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_money"("money", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_name"("name", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_name"("name", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_name"("name", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_name"("name", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_numeric"(numeric, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_numeric"(numeric, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_numeric"(numeric, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_numeric"(numeric, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_oid"("oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_oid"("oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_oid"("oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_oid"("oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_text"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_text"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_text"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_text"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_time"(time without time zone, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_time"(time without time zone, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_time"(time without time zone, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_time"(time without time zone, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamp"(timestamp without time zone, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamp"(timestamp without time zone, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamp"(timestamp without time zone, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamp"(timestamp without time zone, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamptz"(timestamp with time zone, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamptz"(timestamp with time zone, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamptz"(timestamp with time zone, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timestamptz"(timestamp with time zone, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_timetz"(time with time zone, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timetz"(time with time zone, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timetz"(time with time zone, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_timetz"(time with time zone, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_uuid"("uuid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_uuid"("uuid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_uuid"("uuid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_uuid"("uuid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_varbit"(bit varying, "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_varbit"(bit varying, "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_varbit"(bit varying, "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_varbit"(bit varying, "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_numeric_cmp"(numeric, numeric) TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_numeric_cmp"(numeric, numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."gin_numeric_cmp"(numeric, numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_numeric_cmp"(numeric, numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin_or_moderator"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin_or_moderator"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin_or_moderator"() TO "service_role";



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



GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "anon";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."split_part"("public"."citext", "public"."citext", integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strpos"("public"."citext", "public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_reports_content_type"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_reports_content_type"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_reports_content_type"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_stories_media_url"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_stories_media_url"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_stories_media_url"() TO "service_role";



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



GRANT ALL ON FUNCTION "public"."update_club_ratings"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_club_ratings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_club_ratings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_couple_agreements_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_couple_agreements_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_couple_agreements_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_couple_profiles_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_couple_profiles_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_couple_profiles_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_gallery_permissions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_gallery_permissions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_gallery_permissions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_invitations_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_invitations_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_invitations_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_nft_verifications_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_nft_verifications_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_nft_verifications_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_predictive_match_scores_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_predictive_match_scores_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_predictive_match_scores_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profiles_full_name"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_profiles_full_name"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profiles_full_name"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_consents_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_consents_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_consents_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_level"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_level"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_level"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_user_wallets_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_user_wallets_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_user_wallets_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_s2_cell"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_s2_cell"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_s2_cell"() TO "service_role";












GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."max"("public"."citext") TO "service_role";



GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "postgres";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "anon";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "authenticated";
GRANT ALL ON FUNCTION "public"."min"("public"."citext") TO "service_role";









GRANT ALL ON TABLE "public"."analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_events" TO "service_role";



GRANT ALL ON TABLE "public"."anti_cheat_log" TO "anon";
GRANT ALL ON TABLE "public"."anti_cheat_log" TO "authenticated";
GRANT ALL ON TABLE "public"."anti_cheat_log" TO "service_role";



GRANT ALL ON TABLE "public"."app_config" TO "anon";
GRANT ALL ON TABLE "public"."app_config" TO "authenticated";
GRANT ALL ON TABLE "public"."app_config" TO "service_role";



GRANT ALL ON TABLE "public"."app_logs" TO "anon";
GRANT ALL ON TABLE "public"."app_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."app_logs" TO "service_role";



GRANT ALL ON TABLE "public"."banner_config" TO "anon";
GRANT ALL ON TABLE "public"."banner_config" TO "authenticated";
GRANT ALL ON TABLE "public"."banner_config" TO "service_role";



GRANT ALL ON TABLE "public"."beta_rewards" TO "anon";
GRANT ALL ON TABLE "public"."beta_rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."beta_rewards" TO "service_role";



GRANT ALL ON TABLE "public"."blockchain_transactions" TO "anon";
GRANT ALL ON TABLE "public"."blockchain_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."blockchain_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."chat_rooms" TO "anon";
GRANT ALL ON TABLE "public"."chat_rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_rooms" TO "service_role";



GRANT ALL ON TABLE "public"."chat_summaries" TO "anon";
GRANT ALL ON TABLE "public"."chat_summaries" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_summaries" TO "service_role";



GRANT ALL ON TABLE "public"."consent_evidence" TO "anon";
GRANT ALL ON TABLE "public"."consent_evidence" TO "authenticated";
GRANT ALL ON TABLE "public"."consent_evidence" TO "service_role";



GRANT ALL ON TABLE "public"."content_activities" TO "anon";
GRANT ALL ON TABLE "public"."content_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."content_activities" TO "service_role";



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



GRANT ALL ON TABLE "public"."daily_activities" TO "anon";
GRANT ALL ON TABLE "public"."daily_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_activities" TO "service_role";



GRANT ALL ON TABLE "public"."daily_token_claims" TO "anon";
GRANT ALL ON TABLE "public"."daily_token_claims" TO "authenticated";
GRANT ALL ON TABLE "public"."daily_token_claims" TO "service_role";



GRANT ALL ON TABLE "public"."digital_fingerprints" TO "anon";
GRANT ALL ON TABLE "public"."digital_fingerprints" TO "authenticated";
GRANT ALL ON TABLE "public"."digital_fingerprints" TO "service_role";



GRANT ALL ON TABLE "public"."engagement_activities" TO "anon";
GRANT ALL ON TABLE "public"."engagement_activities" TO "authenticated";
GRANT ALL ON TABLE "public"."engagement_activities" TO "service_role";



GRANT ALL ON TABLE "public"."error_alerts" TO "anon";
GRANT ALL ON TABLE "public"."error_alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."error_alerts" TO "service_role";



GRANT ALL ON TABLE "public"."frozen_assets" TO "anon";
GRANT ALL ON TABLE "public"."frozen_assets" TO "authenticated";
GRANT ALL ON TABLE "public"."frozen_assets" TO "service_role";



GRANT ALL ON TABLE "public"."gallery_commissions" TO "anon";
GRANT ALL ON TABLE "public"."gallery_commissions" TO "authenticated";
GRANT ALL ON TABLE "public"."gallery_commissions" TO "service_role";



GRANT ALL ON TABLE "public"."gallery_permissions" TO "anon";
GRANT ALL ON TABLE "public"."gallery_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."gallery_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."geographic_hotspots" TO "anon";
GRANT ALL ON TABLE "public"."geographic_hotspots" TO "authenticated";
GRANT ALL ON TABLE "public"."geographic_hotspots" TO "service_role";



GRANT ALL ON TABLE "public"."invitation_templates" TO "anon";
GRANT ALL ON TABLE "public"."invitation_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."invitation_templates" TO "service_role";



GRANT ALL ON TABLE "public"."invitations" TO "anon";
GRANT ALL ON TABLE "public"."invitations" TO "authenticated";
GRANT ALL ON TABLE "public"."invitations" TO "service_role";



GRANT ALL ON TABLE "public"."matches" TO "anon";
GRANT ALL ON TABLE "public"."matches" TO "authenticated";
GRANT ALL ON TABLE "public"."matches" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."missions" TO "anon";
GRANT ALL ON TABLE "public"."missions" TO "authenticated";
GRANT ALL ON TABLE "public"."missions" TO "service_role";



GRANT ALL ON TABLE "public"."moderator_sessions" TO "anon";
GRANT ALL ON TABLE "public"."moderator_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."moderator_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."monitoring_sessions" TO "anon";
GRANT ALL ON TABLE "public"."monitoring_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."monitoring_sessions" TO "service_role";



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



GRANT ALL ON TABLE "public"."points_transactions" TO "anon";
GRANT ALL ON TABLE "public"."points_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."points_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."predictive_match_scores" TO "anon";
GRANT ALL ON TABLE "public"."predictive_match_scores" TO "authenticated";
GRANT ALL ON TABLE "public"."predictive_match_scores" TO "service_role";



GRANT ALL ON TABLE "public"."referral_rewards" TO "anon";
GRANT ALL ON TABLE "public"."referral_rewards" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_rewards" TO "service_role";



GRANT ALL ON TABLE "public"."referral_statistics" TO "anon";
GRANT ALL ON TABLE "public"."referral_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_statistics" TO "service_role";



GRANT ALL ON TABLE "public"."referral_transactions" TO "anon";
GRANT ALL ON TABLE "public"."referral_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."referral_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."referrals" TO "anon";
GRANT ALL ON TABLE "public"."referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."referrals" TO "service_role";



GRANT ALL ON TABLE "public"."report_ai_classification" TO "anon";
GRANT ALL ON TABLE "public"."report_ai_classification" TO "authenticated";
GRANT ALL ON TABLE "public"."report_ai_classification" TO "service_role";



GRANT ALL ON TABLE "public"."reports" TO "anon";
GRANT ALL ON TABLE "public"."reports" TO "authenticated";
GRANT ALL ON TABLE "public"."reports" TO "service_role";



GRANT ALL ON TABLE "public"."security_events" TO "anon";
GRANT ALL ON TABLE "public"."security_events" TO "authenticated";
GRANT ALL ON TABLE "public"."security_events" TO "service_role";



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



GRANT ALL ON TABLE "public"."testnet_token_claims" TO "anon";
GRANT ALL ON TABLE "public"."testnet_token_claims" TO "authenticated";
GRANT ALL ON TABLE "public"."testnet_token_claims" TO "service_role";



GRANT ALL ON TABLE "public"."token_staking" TO "anon";
GRANT ALL ON TABLE "public"."token_staking" TO "authenticated";
GRANT ALL ON TABLE "public"."token_staking" TO "service_role";



GRANT ALL ON TABLE "public"."token_transactions" TO "anon";
GRANT ALL ON TABLE "public"."token_transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."token_transactions" TO "service_role";



GRANT ALL ON TABLE "public"."user_consents" TO "anon";
GRANT ALL ON TABLE "public"."user_consents" TO "authenticated";
GRANT ALL ON TABLE "public"."user_consents" TO "service_role";



GRANT ALL ON TABLE "public"."user_identifiers" TO "anon";
GRANT ALL ON TABLE "public"."user_identifiers" TO "authenticated";
GRANT ALL ON TABLE "public"."user_identifiers" TO "service_role";



GRANT ALL ON TABLE "public"."user_interests" TO "anon";
GRANT ALL ON TABLE "public"."user_interests" TO "authenticated";
GRANT ALL ON TABLE "public"."user_interests" TO "service_role";



GRANT ALL ON TABLE "public"."user_missions" TO "anon";
GRANT ALL ON TABLE "public"."user_missions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_missions" TO "service_role";



GRANT ALL ON TABLE "public"."user_nfts" TO "anon";
GRANT ALL ON TABLE "public"."user_nfts" TO "authenticated";
GRANT ALL ON TABLE "public"."user_nfts" TO "service_role";



GRANT ALL ON TABLE "public"."user_points" TO "anon";
GRANT ALL ON TABLE "public"."user_points" TO "authenticated";
GRANT ALL ON TABLE "public"."user_points" TO "service_role";



GRANT ALL ON TABLE "public"."user_referral_balances" TO "anon";
GRANT ALL ON TABLE "public"."user_referral_balances" TO "authenticated";
GRANT ALL ON TABLE "public"."user_referral_balances" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."user_token_balances" TO "anon";
GRANT ALL ON TABLE "public"."user_token_balances" TO "authenticated";
GRANT ALL ON TABLE "public"."user_token_balances" TO "service_role";



GRANT ALL ON TABLE "public"."user_wallets" TO "anon";
GRANT ALL ON TABLE "public"."user_wallets" TO "authenticated";
GRANT ALL ON TABLE "public"."user_wallets" TO "service_role";



GRANT ALL ON TABLE "public"."web_vitals_history" TO "anon";
GRANT ALL ON TABLE "public"."web_vitals_history" TO "authenticated";
GRANT ALL ON TABLE "public"."web_vitals_history" TO "service_role";



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






























