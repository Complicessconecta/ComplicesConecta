-- Crear tabla moderator_requests
CREATE TABLE IF NOT EXISTS moderator_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  reason TEXT NOT NULL,
  experience TEXT,
  availability TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_moderator_requests_user_id ON moderator_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_moderator_requests_status ON moderator_requests(status);
CREATE INDEX IF NOT EXISTS idx_moderator_requests_created_at ON moderator_requests(created_at);

-- Habilitar RLS
ALTER TABLE moderator_requests ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own requests" ON moderator_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own requests" ON moderator_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own requests" ON moderator_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all requests" ON moderator_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins can update request status" ON moderator_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_moderator_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER moderator_requests_updated_at
  BEFORE UPDATE ON moderator_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_moderator_requests_updated_at();
