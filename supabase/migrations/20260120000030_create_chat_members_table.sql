-- Migración: Crear tabla chat_members para gestión de miembros en salas de chat
-- Fecha: 19 Ene 2026
-- Descripción: Tabla para gestionar miembros de salas de chat con estado online/offline

-- Crear tabla chat_members si no existe
CREATE TABLE IF NOT EXISTS public.chat_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_owner BOOLEAN DEFAULT FALSE,
  is_muted BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP WITH TIME ZONE,
  is_online BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chat_room_id, user_id)
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_chat_members_chat_room_id ON public.chat_members(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id ON public.chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_is_online ON public.chat_members(is_online);
CREATE INDEX IF NOT EXISTS idx_chat_members_last_seen ON public.chat_members(last_seen);

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_chat_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_chat_members_updated_at
  BEFORE UPDATE ON public.chat_members
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_members_updated_at();

-- Crear función para marcar usuario como offline automáticamente
CREATE OR REPLACE FUNCTION mark_user_offline()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_members
  SET is_online = FALSE,
      last_seen = NOW()
  WHERE user_id = OLD.user_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger para marcar offline al desconectar (se activará desde la app)
-- Nota: Este trigger se activará manualmente desde la app cuando el usuario se desconecte

-- Políticas RLS
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver miembros de salas a las que pertenecen
CREATE POLICY "Users can view chat members in their rooms"
  ON public.chat_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members cm
      WHERE cm.chat_room_id = public.chat_members.chat_room_id
      AND cm.user_id = auth.uid()
    )
    OR public.chat_members.user_id = auth.uid()
  );

-- Política: Los usuarios pueden insertarse en salas públicas o si son invitados
CREATE POLICY "Users can join public rooms or if invited"
  ON public.chat_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_rooms cr
      WHERE cr.id = public.chat_members.chat_room_id
      AND (cr.is_private = FALSE OR cr.created_by = auth.uid() OR auth.uid() = ANY(cr.participants))
    )
  );

-- Política: Los usuarios pueden actualizar su propio estado
CREATE POLICY "Users can update their own membership"
  ON public.chat_members FOR UPDATE
  USING (public.chat_members.user_id = auth.uid())
  WITH CHECK (public.chat_members.user_id = auth.uid());

-- Política: Los propietarios pueden eliminar miembros
CREATE POLICY "Owners can delete members"
  ON public.chat_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members cm
      WHERE cm.chat_room_id = public.chat_members.chat_room_id
      AND cm.user_id = auth.uid()
      AND cm.is_owner = TRUE
    )
  );

-- Política: Los usuarios pueden eliminarse a sí mismos
CREATE POLICY "Users can delete themselves"
  ON public.chat_members FOR DELETE
  USING (public.chat_members.user_id = auth.uid());

-- Comentario
COMMENT ON TABLE public.chat_members IS 'Tabla para gestionar miembros de salas de chat con estado online/offline';
