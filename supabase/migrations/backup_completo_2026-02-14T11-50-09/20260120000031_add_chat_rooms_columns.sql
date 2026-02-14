-- Migración: Agregar columnas a chat_rooms para gestión de tokens y accesos
-- Fecha: 19 Ene 2026
-- Descripción: Agregar columnas para token_cost, is_active, max_members

-- Agregar columnas a chat_rooms si no existen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_rooms'
    AND column_name = 'token_cost'
  ) THEN
    ALTER TABLE public.chat_rooms ADD COLUMN token_cost INTEGER DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_rooms'
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.chat_rooms ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_rooms'
    AND column_name = 'max_members'
  ) THEN
    ALTER TABLE public.chat_rooms ADD COLUMN max_members INTEGER DEFAULT 100;
  END IF;
END $$;

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_chat_rooms_is_active ON public.chat_rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_is_private ON public.chat_rooms(is_private);

-- Comentarios
COMMENT ON COLUMN public.chat_rooms.token_cost IS 'Costo en tokens para acceder a la sala privada';
COMMENT ON COLUMN public.chat_rooms.is_active IS 'Estado de la sala (activa/inactiva)';
COMMENT ON COLUMN public.chat_rooms.max_members IS 'Número máximo de miembros permitidos';
