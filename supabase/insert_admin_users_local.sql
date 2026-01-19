-- ============================================================================
-- Script para insertar 2 administradores con exclusión de rastreo (LOCAL)
-- Fecha: 18 Ene 2026 22:35
-- Adaptado para estructura de base de datos local de Supabase
-- ============================================================================

-- ============================================================================
-- PASO 1: Insertar administradores en auth.users
-- ============================================================================

-- Administrador 1: complicesconectasw@outlook.es
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'complicesconectasw@outlook.es',
    '$2a$10$placeholder_hash_will_be_replaced_by_supabase',
    now(),
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"display_name": "Administrador Principal", "role": "admin", "tracking_disabled": true}',
    now(),
    now(),
    '',
    '',
    '',
    ''
);

-- Administrador 2: djwacko28@gmail.com
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'djwacko28@gmail.com',
    '$2a$10$placeholder_hash_will_be_replaced_by_supabase',
    now(),
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"display_name": "Administrador Secundario", "role": "admin", "tracking_disabled": true}',
    now(),
    now(),
    '',
    '',
    '',
    ''
);

-- ============================================================================
-- PASO 2: Insertar perfiles en public.profiles
-- ============================================================================

-- Perfil del Administrador 1
INSERT INTO public.profiles (
    id,
    user_id,
    name,
    full_name,
    first_name,
    last_name,
    age,
    gender,
    location,
    interests,
    avatar_url,
    is_verified,
    is_premium,
    is_demo,
    consent_status,
    created_at,
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Administrador Principal',
    'Administrador Principal',
    'Admin',
    'Principal',
    30,
    'other',
    'Mexico',
    ARRAY['admin', 'moderation'],
    NULL,
    true,
    true,
    false,
    'ACCEPTED',
    now(),
    now()
);

-- Perfil del Administrador 2
INSERT INTO public.profiles (
    id,
    user_id,
    name,
    full_name,
    first_name,
    last_name,
    age,
    gender,
    location,
    interests,
    avatar_url,
    is_verified,
    is_premium,
    is_demo,
    consent_status,
    created_at,
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'Administrador Secundario',
    'Administrador Secundario',
    'Admin',
    'Secundario',
    30,
    'other',
    'Mexico',
    ARRAY['admin', 'moderation'],
    NULL,
    true,
    true,
    false,
    'ACCEPTED',
    now(),
    now()
);

-- ============================================================================
-- PASO 3: Verificar inserción
-- ============================================================================

SELECT 
    p.id,
    p.user_id,
    p.name,
    p.full_name,
    p.is_verified,
    p.is_premium,
    p.is_demo,
    p.created_at
FROM public.profiles p
WHERE p.name LIKE 'Administrador%'
ORDER BY p.created_at;

-- ============================================================================
-- NOTA IMPORTANTE
-- ============================================================================
-- 1. Este script está adaptado para la estructura local de Supabase
-- 2. Los hashes de contraseña serán reemplazados por Supabase automáticamente
-- 3. Los administradores están configurados en raw_user_meta_data con role: "admin"
-- 4. Los administradores NO son usuarios demo (is_demo = false)
-- 5. Ambos administradores tienen is_verified = true y is_premium = true
-- ============================================================================
