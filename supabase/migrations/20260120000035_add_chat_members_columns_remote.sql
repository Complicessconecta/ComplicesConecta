-- Agregar columnas faltantes a la tabla chat_members para sistema de salas de chat
-- Fecha: 19 Ene 2026

-- Agregar columna is_owner
ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS is_owner BOOLEAN DEFAULT false;

-- Agregar columna is_muted
ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT false;

-- Agregar columna is_hidden
ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;

-- Agregar columna last_seen
ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE;

-- Agregar columna is_online
ALTER TABLE chat_members ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- Crear índice para is_online
CREATE INDEX IF NOT EXISTS idx_chat_members_is_online ON chat_members(is_online);

-- Crear índice para last_seen
CREATE INDEX IF NOT EXISTS idx_chat_members_last_seen ON chat_members(last_seen);

-- Crear índice para is_owner
CREATE INDEX IF NOT EXISTS idx_chat_members_is_owner ON chat_members(is_owner);

-- Crear índice compuesto para room_id y profile_id
CREATE INDEX IF NOT EXISTS idx_chat_members_room_profile ON chat_members(room_id, profile_id);

-- Comentarios
COMMENT ON COLUMN chat_members.is_owner IS 'Indica si el miembro es el propietario de la sala';
COMMENT ON COLUMN chat_members.is_muted IS 'Indica si el miembro ha silenciado la sala';
COMMENT ON COLUMN chat_members.is_hidden IS 'Indica si el miembro ha ocultado la sala';
COMMENT ON COLUMN chat_members.last_seen IS 'Última vez que el miembro estuvo activo en la sala';
COMMENT ON COLUMN chat_members.is_online IS 'Indica si el miembro está actualmente online en la sala';
