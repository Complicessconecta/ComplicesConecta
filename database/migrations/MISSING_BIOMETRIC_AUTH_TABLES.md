# Especificación de Tablas Faltantes: Autenticación Biométrica (WebAuthn)

**Fecha:** 18 de diciembre de 2025
**Autor:** Lead Architect
**Estado:** **CRÍTICO** - Tablas no existen. Implementación requerida para la funcionalidad de autenticación biométrica.

## 1. Resumen del Problema

El hook `src/features/auth/useBiometricAuth.ts` implementa el flujo de registro de credenciales biométricas utilizando la API WebAuthn del navegador. Sin embargo, esta implementación está incompleta y es no funcional porque carece de la infraestructura de backend necesaria.

Específicamente, no existen las tablas en la base de datos para almacenar las credenciales públicas del usuario, lo que impide tanto el registro persistente como la autenticación real.

## 2. Especificaciones Técnicas

Se requieren dos tablas para una implementación robusta de WebAuthn:

1.  `biometric_credentials`: Para almacenar las credenciales de clave pública asociadas a cada usuario.
2.  `biometric_challenges`: Para almacenar temporalmente los desafíos generados por el servidor, previniendo ataques de repetición.

### 2.1. Script de Migración SQL

```sql
-- MIGRACIÓN PARA CREAR TABLAS DE AUTENTICACIÓN BIOMÉTRICA (WEBAUTHN)

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

```

### 2.2. Especificación del PIN de 6 Dígitos

La funcionalidad de PIN de respaldo no existe. Requiere añadir una columna a la tabla `profiles`.

**Modificación a la tabla `profiles`:**

```sql
-- Añadir columna para el hash del PIN en la tabla de perfiles
ALTER TABLE public.profiles
ADD COLUMN pin_hash text;

-- Añadir política de RLS para que el usuario pueda gestionar su propio PIN
CREATE POLICY "Users can update their own PIN"
ON public.profiles
FOR UPDATE USING (
    auth.uid() = id
) WITH CHECK (
    auth.uid() = id
);

COMMENT ON COLUMN public.profiles.pin_hash IS 'Hash del PIN de 6 dígitos del usuario para autenticación de respaldo.';
```

## 3. Guía de Integración

1.  **Crear y Aplicar Migraciones:** Guardar los scripts SQL anteriores en nuevos archivos de migración de Supabase y aplicarlos a la base de datos.
2.  **Desarrollar Edge Functions:** Crear las siguientes funciones de Supabase (o API endpoints):
    *   `get-biometric-register-challenge`: Genera y guarda un desafío en `biometric_challenges`.
    *   `verify-biometric-registration`: Recibe la respuesta del navegador, la verifica y guarda la nueva credencial en `biometric_credentials`.
    *   `get-biometric-auth-challenge`: Genera un desafío para iniciar sesión.
    *   `verify-biometric-authentication`: Verifica la respuesta de autenticación y, si es válida, genera una sesión de Supabase para el usuario.
    *   `set-user-pin`: Recibe un PIN, lo hashea (usando un método seguro como Argon2 o bcrypt en el servidor) y lo guarda en `profiles.pin_hash`.
    *   `verify-user-pin`: Recibe un PIN, lo hashea y lo compara con el hash almacenado para autenticar al usuario.
3.  **Actualizar Frontend:**
    *   Modificar `useBiometricAuth.ts` para que se comunique con las nuevas Edge Functions en lugar de simular respuestas.
    *   Crear un nuevo hook `usePinAuth.ts` y componentes de UI para la gestión del PIN.
    *   Integrar ambos flujos en las páginas de configuración y de inicio de sesión.
