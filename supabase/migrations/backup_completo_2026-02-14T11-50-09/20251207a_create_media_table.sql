/* Create media table for gallery images and files */

CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  file_type VARCHAR(50) NOT NULL DEFAULT 'image',
  mime_type VARCHAR(100) NOT NULL,
  file_size BIGINT,
  is_public BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE
);

/* Create indexes for media table */
CREATE INDEX IF NOT EXISTS idx_media_user_id ON public.media(user_id);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON public.media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_is_public ON public.media(is_public);
CREATE INDEX IF NOT EXISTS idx_media_file_type ON public.media(file_type);

/* Enable RLS on media table */
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

/* RLS Policy: Users can view their own media */
CREATE POLICY "Users can view own media"
  ON public.media
  FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

/* RLS Policy: Users can insert their own media */
CREATE POLICY "Users can insert own media"
  ON public.media
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

/* RLS Policy: Users can update their own media */
CREATE POLICY "Users can update own media"
  ON public.media
  FOR UPDATE
  USING (auth.uid() = user_id);

/* RLS Policy: Users can delete their own media */
CREATE POLICY "Users can delete own media"
  ON public.media
  FOR DELETE
  USING (auth.uid() = user_id);

/* Create trigger to update updated_at */
CREATE OR REPLACE FUNCTION public.update_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER media_updated_at_trigger
  BEFORE UPDATE ON public.media
  FOR EACH ROW
  EXECUTE FUNCTION public.update_media_updated_at();
