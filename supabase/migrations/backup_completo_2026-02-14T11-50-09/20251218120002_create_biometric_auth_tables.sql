-- MIGRACIÓN PARA CREAR TABLAS DE AUTENTICACIÓN BIOMÉTRICA (WEBAUTHN) y PIN
-- Fecha: 2025-12-18

-- 1. Crear la tabla 'biometric_credentials'
CREATE TABLE public.biometric_credentials (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    credential_id text NOT NULL, -- ID de la credencial, en Base64URL
    public_key bytea NOT NULL, -- La clave pública en formato COSE
    sign_count bigint NOT NULL, -- Contador de firmas para detectar clones
    transports text[], -- Por ejemplo: "internal", "usb", "nfc", "ble"
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    last_used_at timestamp with time zone,

    CONSTRAINT biometric_credentials_pkey PRIMARY KEY (id),
    CONSTRAINT biometric_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT biometric_credentials_credential_id_key UNIQUE (credential_id)
);

-- 2. Crear la tabla 'biometric_challenges'
CREATE TABLE public.biometric_challenges (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    challenge text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),

    CONSTRAINT biometric_challenges_pkey PRIMARY KEY (id)
);

-- 3. Habilitar Row Level Security (RLS) en ambas tablas
ALTER TABLE public.biometric_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_challenges ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas de RLS para 'biometric_credentials'
-- POLÍTICA: Un usuario puede ver y eliminar sus propias credenciales.
CREATE POLICY "Users can manage their own biometric credentials"
ON public.biometric_credentials
FOR ALL USING (
    auth.uid() = user_id
);

-- 5. Crear políticas de RLS para 'biometric_challenges'
-- POLÍTICA: Cualquier usuario autenticado puede crear un desafío (necesario para iniciar sesión).
CREATE POLICY "Authenticated users can create challenges"
ON public.biometric_challenges
FOR INSERT TO authenticated WITH CHECK (true);
-- Nota: La lectura y eliminación de desafíos debe ser manejada por el backend con rol de servicio para evitar que un usuario vea desafíos de otros.

-- 6. Añadir comentarios para claridad
COMMENT ON TABLE public.biometric_credentials IS 'Almacena las credenciales WebAuthn (claves públicas) de los usuarios para autenticación biométrica.';
COMMENT ON COLUMN public.biometric_credentials.credential_id IS 'El ID único de la credencial, codificado en Base64URL, proporcionado por el navegador.';
COMMENT ON COLUMN public.biometric_credentials.sign_count IS 'Contador de firmas para prevenir el clonado de autenticadores.';
COMMENT ON TABLE public.biometric_challenges IS 'Almacena desafíos criptográficos de corta duración para prevenir ataques de repetición en el flujo de WebAuthn.';

-- 7. Modificación a la tabla 'profiles' para el PIN
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS pin_hash text;

-- 8. Añadir política de RLS para que el usuario pueda gestionar su propio PIN
DROP POLICY IF EXISTS "Users can update their own PIN" ON public.profiles;
CREATE POLICY "Users can update their own PIN"
ON public.profiles
FOR UPDATE USING (
    auth.uid() = id
) WITH CHECK (
    auth.uid() = id
);

COMMENT ON COLUMN public.profiles.pin_hash IS 'Hash del PIN de 6 dígitos del usuario para autenticación de respaldo.';
