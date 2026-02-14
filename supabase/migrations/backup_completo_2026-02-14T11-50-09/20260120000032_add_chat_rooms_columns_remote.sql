-- Agregar columnas faltantes a la tabla chat_rooms para sistema de salas de chat
-- Fecha: 19 Ene 2026

-- Agregar columna is_private
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Agregar columna participants (array de strings)
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS participants TEXT[] DEFAULT '{}';

-- Agregar columna token_cost
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS token_cost INTEGER DEFAULT 0;

-- Agregar columna max_members
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 100;

-- Crear índice para is_private
CREATE INDEX IF NOT EXISTS idx_chat_rooms_is_private ON chat_rooms(is_private);

-- Crear índice para token_cost
CREATE INDEX IF NOT EXISTS idx_chat_rooms_token_cost ON chat_rooms(token_cost);

-- Crear índice para max_members
CREATE INDEX IF NOT EXISTS idx_chat_rooms_max_members ON chat_rooms(max_members);

-- Comentarios
COMMENT ON COLUMN chat_rooms.is_private IS 'Indica si la sala es privada (requiere invitación)';
COMMENT ON COLUMN chat_rooms.participants IS 'Lista de IDs de participantes invitados a la sala';
COMMENT ON COLUMN chat_rooms.token_cost IS 'Costo en tokens CMPX para acceder a la sala privada';
COMMENT ON COLUMN chat_rooms.max_members IS 'Número máximo de miembros permitidos en la sala';
