-- Crear tabla de calificaciones de clubes con trigger para estadísticas
-- Fase 1: Fundamentos de Base de Datos

CREATE TABLE IF NOT EXISTS club_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(club_id, user_id)
);

-- Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_club_ratings_club_id ON club_ratings(club_id);
CREATE INDEX IF NOT EXISTS idx_club_ratings_user_id ON club_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_club_ratings_rating ON club_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_club_ratings_created_at ON club_ratings(created_at);

-- RLS
ALTER TABLE club_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all ratings"
  ON club_ratings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create ratings"
  ON club_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings"
  ON club_ratings FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para actualizar estadísticas del club
CREATE OR REPLACE FUNCTION update_club_rating_stats()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating FLOAT;
  total_reviews INTEGER;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    SELECT
      AVG(rating)::FLOAT,
      COUNT(*)
    INTO avg_rating, total_reviews
    FROM club_ratings
    WHERE club_id = NEW.club_id;

    UPDATE clubs
    SET
      average_rating = COALESCE(avg_rating, 0),
      total_reviews = total_reviews
    WHERE id = NEW.club_id;
  ELSIF TG_OP = 'DELETE' THEN
    SELECT
      AVG(rating)::FLOAT,
      COUNT(*)
    INTO avg_rating, total_reviews
    FROM club_ratings
    WHERE club_id = OLD.club_id;

    UPDATE clubs
    SET
      average_rating = COALESCE(avg_rating, 0),
      total_reviews = total_reviews
    WHERE id = OLD.club_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_club_rating_stats_trigger
  AFTER INSERT OR UPDATE OR DELETE ON club_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_club_rating_stats();

-- Comentario
COMMENT ON TABLE club_ratings IS 'Calificaciones de usuarios a club (1-5 estrellas)';
COMMENT ON COLUMN club_ratings.rating IS 'Calificación del 1 al 5';
COMMENT ON FUNCTION update_club_rating_stats() IS 'Trigger que actualiza automáticamente average_rating y total_reviews en la tabla clubs';
