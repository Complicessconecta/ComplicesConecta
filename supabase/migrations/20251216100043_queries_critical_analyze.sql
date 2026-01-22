-- =====================================================
-- QUERIES CRÍTICAS PARA EXPLAIN ANALYZE
-- Versión: 3.5.0
-- Fecha: 02 de Noviembre, 2025
-- =====================================================
--
-- Este archivo contiene las queries críticas que deben
-- analizarse con EXPLAIN ANALYZE para validar performance
-- antes y después de aplicar índices.
--
-- USO:
--   1. Ejecutar EXPLAIN ANALYZE en cada query antes de aplicar índices
--   2. Documentar resultados (tiempo, plan de ejecución, índices usados)
--   3. Aplicar índices (supabase/migrations/20251102000000_optimize_queries_indexes.sql)
--   4. Re-ejecutar EXPLAIN ANALYZE después de aplicar índices
--   5. Comparar resultados y documentar mejoras
--
-- =====================================================

-- =====================================================
-- 1. QUERIES DE FEED/POSTS
-- =====================================================

-- Query 1.1: Feed público ordenado por fecha
-- Prioridad: ALTA (query más frecuente)
-- Usa media_url (compatible con ambos entornos: local y remoto)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stories')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stories' AND column_name = 'description')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stories' AND column_name = 'content_type')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stories' AND column_name = 'media_url')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stories' AND column_name = 'is_public')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stories' AND column_name = 'created_at')
  THEN
    EXECUTE 'EXPLAIN ANALYZE
      SELECT id, user_id, description as content, content_type as post_type, media_url, views_count, created_at, updated_at
      FROM stories
      WHERE is_public = true
      ORDER BY created_at DESC
      LIMIT 20';
  END IF;
END $$;

-- Query 1.2: Feed con contadores (likes, comments, shares)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stories')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stories' AND column_name = 'description')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stories' AND column_name = 'content_type')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stories' AND column_name = 'media_url')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stories' AND column_name = 'is_public')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'story_likes')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'story_comments')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'story_shares')
  THEN
    EXECUTE 'EXPLAIN ANALYZE
      SELECT s.id, s.user_id, s.description as content, s.content_type as post_type, s.media_url, s.views_count, s.created_at, s.updated_at,
        (SELECT COUNT(*) FROM story_likes WHERE story_id = s.id) as likes_count,
        (SELECT COUNT(*) FROM story_comments WHERE story_id = s.id) as comments_count,
        (SELECT COUNT(*) FROM story_shares WHERE story_id = s.id) as shares_count
      FROM stories s
      WHERE s.is_public = true
      ORDER BY s.created_at DESC
      LIMIT 20';
  END IF;
END $$;

-- Query 1.3: Feed con datos de perfil
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stories')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stories' AND column_name = 'description')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stories' AND column_name = 'content_type')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stories' AND column_name = 'media_url')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stories' AND column_name = 'is_public')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'name')
  THEN
    EXECUTE 'EXPLAIN ANALYZE
      SELECT s.id, s.user_id, s.description as content, s.content_type as post_type, s.media_url, s.views_count, s.created_at, s.updated_at,
        p.name as profile_name, p.avatar_url as profile_avatar, p.is_verified as profile_verified
      FROM stories s
      LEFT JOIN profiles p ON s.user_id = p.id
      WHERE s.is_public = true
      ORDER BY s.created_at DESC
      LIMIT 20';
  END IF;
END $$;
-- =====================================================
-- 2. QUERIES DE PERFILES CON FILTROS
-- =====================================================

-- Query 2.1: Perfiles con filtros básicos (edad, género)
-- Prioridad: ALTA (query de búsqueda principal)
-- NOTA: Si is_online no existe, aplicar migración 20251103000001_fix_profiles_online_column.sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'age')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'gender')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_verified')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at')
  THEN
    EXECUTE 'EXPLAIN ANALYZE
      SELECT *
      FROM profiles
      WHERE age >= 18
        AND age <= 35
        AND gender = ''male''
        AND is_verified = true
      ORDER BY updated_at DESC
      LIMIT 20';
  END IF;
END $$;

-- Query 2.2: Perfiles con filtros múltiples (intereses)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'age')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'gender')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_verified')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'interests')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at')
  THEN
    EXECUTE 'EXPLAIN ANALYZE
      SELECT *
      FROM profiles
      WHERE age >= 25
        AND age <= 40
        AND gender = ''female''
        AND is_verified = true
        AND interests && ARRAY[''Intercambio de Parejas'', ''Fiestas Privadas'']
      ORDER BY updated_at DESC
      LIMIT 20';
  END IF;
END $$;

-- Query 2.3: Perfiles con geolocalización (S2)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 's2_cell_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'age')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_verified')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at')
  THEN
    EXECUTE 'EXPLAIN ANALYZE
      SELECT *
      FROM profiles
      WHERE s2_cell_id = ''89c259c040001''
        AND age >= 18
        AND age <= 50
        AND is_verified = true
      ORDER BY updated_at DESC
      LIMIT 20';
  END IF;
END $$;

-- Query 2.4: Perfiles con múltiples filtros compuestos
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'age')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'gender')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_verified')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'account_type')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'interests')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at')
  THEN
    EXECUTE 'EXPLAIN ANALYZE
      SELECT *
      FROM profiles
      WHERE age >= 18
        AND age <= 50
        AND gender = ''male''
        AND is_verified = true
        AND (account_type = ''single'' OR account_type IS NULL)
        AND interests && ARRAY[''Intercambio de Parejas'']
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 20';
  END IF;
END $$;
-- =====================================================
-- 3. QUERIES DE CHAT/MENSAJES
-- =====================================================

-- Query 3.1: Mensajes por chat ordenados por fecha
-- Prioridad: ALTA (query de chat principal)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'room_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'created_at')
  THEN
    EXECUTE 'EXPLAIN ANALYZE
      SELECT id, room_id, sender_id, content, created_at
      FROM messages
      WHERE room_id = ''00000000-0000-0000-0000-000000000001''
      ORDER BY created_at DESC
      LIMIT 50';
  END IF;
END $$;

-- Query 3.2: Mensajes recientes por usuario (por room)
-- Nota: La tabla 'messages' no tiene columna 'is_read'
-- Para mensajes no leídos, usar tabla 'chat_messages' que sí tiene 'is_read'
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_members')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'room_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_members' AND column_name = 'room_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_members' AND column_name = 'profile_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'messages' AND column_name = 'created_at')
  THEN
    EXECUTE 'EXPLAIN ANALYZE
      SELECT id, room_id, sender_id, content, created_at
      FROM messages
      WHERE room_id IN (
        SELECT room_id FROM chat_members WHERE profile_id = ''00000000-0000-0000-0000-000000000001''
      )
      ORDER BY created_at DESC';
  END IF;
END $$;

-- Query 3.3: Chat rooms con último mensaje
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_rooms')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_members')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'chat_rooms' AND column_name = 'created_by')
  THEN
    EXECUTE 'EXPLAIN ANALYZE
      SELECT cr.id, cr.created_by, cr.name, cr.created_at,
        (SELECT content FROM messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT created_at FROM messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message_at
      FROM chat_rooms cr
      WHERE cr.created_by = ''00000000-0000-0000-0000-000000000001''
         OR cr.id IN (SELECT room_id FROM chat_members WHERE profile_id = ''00000000-0000-0000-0000-000000000001'')
      ORDER BY (SELECT created_at FROM messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) DESC NULLS LAST
      LIMIT 20';
  END IF;
END $$;
-- =====================================================
-- 4. QUERIES DE MATCHES
-- =====================================================

-- Query 4.1: Matches mutuos
-- Prioridad: MEDIA (query de matching)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'matches')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'user1_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'user2_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'created_at')
  THEN
    EXECUTE 'EXPLAIN ANALYZE
      SELECT m1.id, m1.user1_id, m1.user2_id, m1.created_at,
        p.name as match_name
      FROM matches m1
      INNER JOIN matches m2 ON m1.user1_id = m2.user2_id AND m1.user2_id = m2.user1_id
      LEFT JOIN profiles p ON m1.user2_id = p.id
      WHERE m1.user1_id = ''00000000-0000-0000-0000-000000000001''
      ORDER BY m1.created_at DESC
      LIMIT 20';
  END IF;
END $$;
-- Query 4.2: Matches con filtros
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'matches')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'user1_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'created_at')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'compatibility_score')
  THEN
    EXECUTE 'EXPLAIN ANALYZE
      SELECT m.id, m.user1_id, m.user2_id, m.compatibility_score, m.created_at,
        p.name as match_name
      FROM matches m
      LEFT JOIN profiles p ON m.user2_id = p.id
      WHERE m.user1_id = ''00000000-0000-0000-0000-000000000001''
        AND m.compatibility_score >= 0.7
      ORDER BY m.compatibility_score DESC, m.created_at DESC
      LIMIT 20';
  END IF;
END $$;
-- =====================================================
-- 5. QUERIES DE ANALYTICS
-- =====================================================

-- Query 5.1: Analytics de perfiles (creados recientemente)
-- Prioridad: MEDIA (query de analytics)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'created_at')
  THEN
    EXECUTE 'EXPLAIN ANALYZE
      SELECT id, created_at
      FROM profiles
      ORDER BY created_at DESC';
  END IF;
END $$;
-- Query 5.2: Analytics de tokens (transacciones recientes)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'token_transactions')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'token_transactions' AND column_name = 'created_at')
  THEN
    EXECUTE 'EXPLAIN ANALYZE
      SELECT id, user_id, transaction_type, amount, created_at
      FROM token_transactions
      WHERE created_at >= NOW() - INTERVAL ''24 hours''
      ORDER BY created_at DESC';
  END IF;
END $$;
-- Query 5.3: Analytics de token analytics (agregado)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'token_analytics')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'token_analytics' AND column_name = 'created_at')
  THEN
    EXECUTE 'EXPLAIN ANALYZE
      SELECT id, transaction_count, total_staked_cmpx, active_stakers, created_at
      FROM token_analytics
      WHERE created_at >= NOW() - INTERVAL ''7 days''
      ORDER BY created_at DESC';
  END IF;
END $$;
-- =====================================================
-- 6. QUERIES DE REPORTS/MODERATION
-- =====================================================

-- Query 6.1: Reports pendientes
-- Prioridad: MEDIA (query de moderación)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'status')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'created_at')
  THEN
    EXECUTE 'EXPLAIN ANALYZE
      SELECT id, reported_user_id, reporter_user_id, content_type, reason, status, created_at
      FROM reports
      WHERE status = ''pending''
      ORDER BY created_at ASC
      LIMIT 50';
  END IF;
END $$;
-- Query 6.2: Reports por tipo y estado
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'reason')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'status')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'created_at')
  THEN
    EXECUTE 'EXPLAIN ANALYZE
      SELECT id, reported_user_id, content_type, reason, status, created_at
      FROM reports
      WHERE reason = ''inappropriate_content''
        AND status = ''pending''
      ORDER BY created_at ASC
      LIMIT 50';
  END IF;
END $$;
-- =====================================================
-- 7. QUERIES DE S2 GEOLOCALIZACIÓN
-- =====================================================

-- Query 7.1: Usuarios en S2 cell
-- Prioridad: ALTA (query de geolocalización)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 's2_cell_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at')
  THEN
    EXECUTE 'EXPLAIN ANALYZE
      SELECT *
      FROM profiles
      WHERE s2_cell_id = ''89c259c040001''
      ORDER BY updated_at DESC
      LIMIT 20';
  END IF;
END $$;
-- Query 7.2: Usuarios en múltiples S2 cells
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 's2_cell_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at')
  THEN
    EXECUTE 'EXPLAIN ANALYZE
      SELECT *
      FROM profiles
      WHERE s2_cell_id = ANY(ARRAY[''89c259c040001'', ''89c259c040002'', ''89c259c040003''])
      ORDER BY updated_at DESC
      LIMIT 50';
  END IF;
END $$;
-- Query 7.3: Función get_users_in_s2_cell
DO $$
BEGIN
  IF EXISTS (
      SELECT 1
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = 'get_profiles_in_cells'
  ) THEN
    EXECUTE 'EXPLAIN ANALYZE
      SELECT * FROM get_profiles_in_cells(
        ARRAY[''89c259c040001'', ''89c259c040002''],
        20
      )';
  END IF;
END $$;
-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
--
-- 1. Reemplazar IDs de ejemplo con IDs reales antes de ejecutar
-- 2. Ejecutar en Supabase SQL Editor con EXPLAIN ANALYZE
-- 3. Documentar resultados (tiempo, plan de ejecución)
-- 4. Comparar antes/después de aplicar índices
-- 5. Las queries con más tiempo de ejecución tienen mayor prioridad
--
-- =====================================================;
