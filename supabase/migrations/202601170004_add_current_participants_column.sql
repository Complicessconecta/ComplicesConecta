-- Agregar columna current_participants a couple_events
ALTER TABLE couple_events ADD COLUMN IF NOT EXISTS current_participants INTEGER DEFAULT 0;
