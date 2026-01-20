-- Crear tabla nft_galleries
CREATE TABLE IF NOT EXISTS nft_galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  nft_network TEXT DEFAULT 'pending' CHECK (nft_network IN ('ethereum', 'polygon', 'pending')),
  nft_contract_address TEXT,
  nft_token_id TEXT,
  minted_with_gtk INTEGER,
  minted_at TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_nft_galleries_user_id ON nft_galleries(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_galleries_profile_id ON nft_galleries(profile_id);
CREATE INDEX IF NOT EXISTS idx_nft_galleries_is_public ON nft_galleries(is_public);
CREATE INDEX IF NOT EXISTS idx_nft_galleries_is_verified ON nft_galleries(is_verified);
CREATE INDEX IF NOT EXISTS idx_nft_galleries_minted_at ON nft_galleries(minted_at);

-- Crear trigger para updated_at
CREATE OR REPLACE FUNCTION update_nft_galleries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_nft_galleries_updated_at
  BEFORE UPDATE ON nft_galleries
  FOR EACH ROW
  EXECUTE FUNCTION update_nft_galleries_updated_at();

-- Crear políticas RLS
ALTER TABLE nft_galleries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_nft_galleries"
  ON nft_galleries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_view_public_nft_galleries"
  ON nft_galleries FOR SELECT
  USING (is_public = true);

CREATE POLICY "users_can_insert_own_nft_galleries"
  ON nft_galleries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_nft_galleries"
  ON nft_galleries FOR UPDATE
  USING (auth.uid() = user_id);

-- Crear tabla nft_gallery_images
CREATE TABLE IF NOT EXISTS nft_gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gallery_id UUID NOT NULL REFERENCES nft_galleries(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_hash TEXT,
  nft_network TEXT DEFAULT 'pending' CHECK (nft_network IN ('ethereum', 'polygon', 'pending')),
  nft_contract_address TEXT,
  nft_token_id TEXT,
  minted_with_gtk INTEGER,
  minted_at TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para nft_gallery_images
CREATE INDEX IF NOT EXISTS idx_nft_gallery_images_user_id ON nft_gallery_images(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_gallery_images_gallery_id ON nft_gallery_images(gallery_id);
CREATE INDEX IF NOT EXISTS idx_nft_gallery_images_sort_order ON nft_gallery_images(sort_order);

-- Crear trigger para updated_at en nft_gallery_images
CREATE TRIGGER trigger_update_nft_gallery_images_updated_at
  BEFORE UPDATE ON nft_gallery_images
  FOR EACH ROW
  EXECUTE FUNCTION update_nft_galleries_updated_at();

-- Crear políticas RLS para nft_gallery_images
ALTER TABLE nft_gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_nft_gallery_images"
  ON nft_gallery_images FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_insert_own_nft_gallery_images"
  ON nft_gallery_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_nft_gallery_images"
  ON nft_gallery_images FOR UPDATE
  USING (auth.uid() = user_id);
