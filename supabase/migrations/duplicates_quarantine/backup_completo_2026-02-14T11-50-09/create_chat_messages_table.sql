-- Crear tabla chat_messages para almacenar mensajes de chat
-- Esta tabla es necesaria para el funcionamiento de ChatRoom.tsx

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_room_id ON public.chat_messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- Comentarios sobre las columnas
COMMENT ON TABLE public.chat_messages IS 'Mensajes de chat entre usuarios';
COMMENT ON COLUMN public.chat_messages.chat_room_id IS 'ID de la sala de chat';
COMMENT ON COLUMN public.chat_messages.sender_id IS 'ID del usuario que envió el mensaje';
COMMENT ON COLUMN public.chat_messages.content IS 'Contenido del mensaje';
COMMENT ON COLUMN public.chat_messages.is_deleted IS 'Indica si el mensaje fue eliminado';
COMMENT ON COLUMN public.chat_messages.metadata IS 'Metadatos adicionales del mensaje';

-- Habilitar RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Usuarios pueden ver mensajes de sus salas de chat"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE chat_rooms.id = chat_messages.chat_room_id
      AND auth.uid() = ANY(chat_rooms.participants)
    )
  );

CREATE POLICY "Usuarios pueden crear mensajes en sus salas de chat"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_rooms
      WHERE chat_rooms.id = chat_messages.chat_room_id
      AND auth.uid() = ANY(chat_rooms.participants)
    )
    AND sender_id = auth.uid()
  );

CREATE POLICY "Usuarios pueden actualizar sus propios mensajes"
  ON public.chat_messages FOR UPDATE
  USING (sender_id = auth.uid());

CREATE POLICY "Usuarios pueden eliminar sus propios mensajes"
  ON public.chat_messages FOR DELETE
  USING (sender_id = auth.uid());
