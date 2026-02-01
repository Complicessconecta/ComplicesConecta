-- Create users in auth.users
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
) VALUES
(
    '00000000-0000-0000-0000-000000000000',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'authenticated',
    'authenticated',
    'complicesconectasw@outlook.es', 
    'djwacko28@gmail.com',
    '$2a$10$abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef', -- Dummy hash
    now(),
    NULL,
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"display_name": "Administrador del Sistema", "role": "admin"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
),
(
    '00000000-0000-0000-0000-000000000000',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    'authenticated',
    'authenticated',
    'user1@example.com',
    '$2a$10$abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
    now(),
    NULL,
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"display_name": "Juan Pérez", "profile_type": "single"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
),
(
    '00000000-0000-0000-0000-000000000000',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
    'authenticated',
    'authenticated',
    'pareja@example.com',
    '$2a$10$abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdef',
    now(),
    NULL,
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"display_name": "Pareja Aventurera", "profile_type": "couple"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
)
ON CONFLICT (id) DO NOTHING;

-- Upsert profiles
-- Note: We use ON CONFLICT to update if they exist (e.g. created by triggers)
INSERT INTO public.profiles (
    id,
    user_id,
    name,
    display_name,
    email,
    role,
    is_verified,
    is_premium,
    suspended,
    created_at,
    updated_at
) VALUES
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Administrador del Sistema',
    'Administrador del Sistema',
    'admin',
    true,
    true,
    false,
    now(),
    now()
),
(
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    'Juan Pérez',
    'Juan Pérez',
    'juan.perez@conecta-social.com',
    'user',
    true,
    false,
    false,
    now(),
    now()
),
(
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
    'Pareja Aventurera',
    'Pareja Aventurera',
    'pareja.aventurera@conecta-social.com',
    'user',
    false,
    true,
    false,
    now(),
    now()
)
ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    name = EXCLUDED.name,
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_verified = EXCLUDED.is_verified,
    is_premium = EXCLUDED.is_premium,
    suspended = EXCLUDED.suspended;

-- Insert an auth identity for the admin user (optional but good for completeness)
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES
(
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '{"sub": "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", "email": "admin@conecta-social.com"}',
    'email',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    now(),
    now(),
    now()
)
ON CONFLICT (id) DO NOTHING;
