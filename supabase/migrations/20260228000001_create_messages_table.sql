-- Crear tabla messages para ChatWithLocation
-- Fecha: 28 Feb 2026

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text',
    media_url TEXT,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    location_latitude DOUBLE PRECISION,
    location_longitude DOUBLE PRECISION,
    location_address TEXT
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_messages_chat_room_id ON messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Habilitar RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Crear políticas para RLS
DO $$
BEGIN
    -- Users can view messages in their chat rooms
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'messages' AND policyname = 'Users can view messages in their chat rooms'
    ) THEN
        CREATE POLICY "Users can view messages in their chat rooms"
        ON messages FOR SELECT
        USING (
            chat_room_id IN (
                SELECT id FROM chat_rooms 
                WHERE participants @> ARRAY[auth.uid()]
            )
        );
    END IF;
    
    -- Users can insert messages in their chat rooms
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'messages' AND policyname = 'Users can insert messages in their chat rooms'
    ) THEN
        CREATE POLICY "Users can insert messages in their chat rooms"
        ON messages FOR INSERT
        WITH CHECK (
            chat_room_id IN (
                SELECT id FROM chat_rooms 
                WHERE participants @> ARRAY[auth.uid()]
            ) AND
            sender_id = auth.uid()
        );
    END IF;
    
    -- Users can update their own messages
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'messages' AND policyname = 'Users can update their own messages'
    ) THEN
        CREATE POLICY "Users can update their own messages"
        ON messages FOR UPDATE
        USING (sender_id = auth.uid());
    END IF;
    
    -- Users can delete their own messages
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'messages' AND policyname = 'Users can delete their own messages'
    ) THEN
        CREATE POLICY "Users can delete their own messages"
        ON messages FOR DELETE
        USING (sender_id = auth.uid());
    END IF;
END $$;

-- Comentario para documentar el propósito de la tabla
COMMENT ON TABLE messages IS 'Tabla de mensajes de chat con soporte de ubicación';
COMMENT ON COLUMN messages.location_latitude IS 'Latitud de la ubicación del mensaje';
COMMENT ON COLUMN messages.location_longitude IS 'Longitud de la ubicación del mensaje';
COMMENT ON COLUMN messages.location_address IS 'Dirección de la ubicación del mensaje';
