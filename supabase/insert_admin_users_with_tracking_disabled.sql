-- ============================================================================
-- Script para insertar 2 administradores con exclusión de rastreo
-- Fecha: 18 Ene 2026 22:12
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
    '$2a$10$placeholder_hash_will_be_replaced_by_supabase', -- Será reemplazado por Supabase
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
)
ON CONFLICT (email) DO NOTHING;

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
    '$2a$10$placeholder_hash_will_be_replaced_by_supabase', -- Será reemplazado por Supabase
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
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- PASO 2: Insertar perfiles en public.profiles
-- ============================================================================

-- Perfil del Administrador 1
INSERT INTO public.profiles (
    id,
    user_id,
    email,
    display_name,
    role,
    profile_type,
    is_verified,
    is_premium,
    suspended,
    created_at,
    updated_at,
    tracking_disabled,
    is_demo,
    account_type
)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'complicesconectasw@outlook.es',
    'Administrador Principal',
    'admin',
    'single',
    true,
    true,
    false,
    now(),
    now(),
    true,  -- Exclusión de rastreo
    false, -- No es usuario demo
    'single'
)
ON CONFLICT (email) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified,
    is_premium = EXCLUDED.is_premium,
    tracking_disabled = EXCLUDED.tracking_disabled,
    updated_at = NOW();

-- Perfil del Administrador 2
INSERT INTO public.profiles (
    id,
    user_id,
    email,
    display_name,
    role,
    profile_type,
    is_verified,
    is_premium,
    suspended,
    created_at,
    updated_at,
    tracking_disabled,
    is_demo,
    account_type
)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000002',
    'djwacko28@gmail.com',
    'Administrador Secundario',
    'admin',
    'single',
    true,
    true,
    false,
    now(),
    now(),
    true,  -- Exclusión de rastreo
    false, -- No es usuario demo
    'single'
)
ON CONFLICT (email) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified,
    is_premium = EXCLUDED.is_premium,
    tracking_disabled = EXCLUDED.tracking_disabled,
    updated_at = NOW();

-- ============================================================================
-- PASO 3: Verificar inserción
-- ============================================================================

SELECT 
    p.id,
    p.email,
    p.display_name,
    p.role,
    p.tracking_disabled,
    p.is_demo,
    p.created_at
FROM public.profiles p
WHERE p.role = 'admin'
ORDER BY p.created_at;

-- ============================================================================
-- NOTA IMPORTANTE
-- ============================================================================
-- 1. Este script debe ejecutarse en el SQL Editor de Supabase
-- 2. Los hashes de contraseña serán reemplazados por Supabase automáticamente
-- 3. Los administradores están configurados con tracking_disabled = true
-- 4. Los administradores NO son usuarios demo (is_demo = false)
-- 5. Ambos administradores tienen rol 'admin' y están verificados
-- ============================================================================
