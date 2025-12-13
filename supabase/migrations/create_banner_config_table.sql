-- Migración: Crear tabla banner_config para gestión de banners desde admin
-- Fecha: 12 Dic 2025
-- Descripción: Tabla para almacenar configuración de BetaBanner, DismissibleBanner y otros banners

-- ============================================================================
-- CREAR TABLA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.banner_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  banner_type VARCHAR(50) NOT NULL UNIQUE, -- 'beta', 'news', 'announcement', 'maintenance', 'custom'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  show_close_button BOOLEAN DEFAULT true,
  background_color VARCHAR(100) DEFAULT 'from-purple-600 to-blue-600', -- Tailwind gradient
  text_color VARCHAR(50) DEFAULT 'text-white',
  icon_type VARCHAR(50), -- 'rocket', 'bell', 'gift', etc
  cta_text VARCHAR(100),
  cta_link VARCHAR(255),
  storage_key VARCHAR(100),
  priority INTEGER DEFAULT 0, -- Mayor = más prioritario
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_banner_config_type ON public.banner_config(banner_type);
CREATE INDEX IF NOT EXISTS idx_banner_config_active ON public.banner_config(is_active);
CREATE INDEX IF NOT EXISTS idx_banner_config_priority ON public.banner_config(priority DESC);
CREATE INDEX IF NOT EXISTS idx_banner_config_updated_at ON public.banner_config(updated_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.banner_config ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden ver banners activos (para mostrar en UI)
CREATE POLICY "Anyone can view active banners" ON public.banner_config
  FOR SELECT USING (is_active = true);

-- Política: Solo admins pueden ver todos los banners
CREATE POLICY "Admins can view all banners" ON public.banner_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Solo admins pueden crear banners
CREATE POLICY "Admins can insert banners" ON public.banner_config
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Solo admins pueden actualizar banners
CREATE POLICY "Admins can update banners" ON public.banner_config
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Política: Solo admins pueden eliminar banners
CREATE POLICY "Admins can delete banners" ON public.banner_config
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- TRIGGER PARA ACTUALIZAR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_banner_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_banner_config_timestamp ON public.banner_config;
CREATE TRIGGER trigger_banner_config_timestamp
  BEFORE UPDATE ON public.banner_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_banner_config_timestamp();

-- ============================================================================
-- DATOS INICIALES
-- ============================================================================

-- Insertar configuración inicial del banner Beta
INSERT INTO public.banner_config (
  banner_type,
  title,
  description,
  is_active,
  show_close_button,
  background_color,
  text_color,
  icon_type,
  cta_text,
  cta_link,
  storage_key,
  priority
) VALUES (
  'beta',
  '¡Acceso Exclusivo Beta!',
  'Únete gratis y obtén beneficios premium de por vida 🎉',
  true,
  true,
  'from-purple-600 via-purple-700 to-blue-700',
  'text-white',
  'rocket',
  'Premium',
  '/premium',
  'beta_banner',
  10
) ON CONFLICT (banner_type) DO NOTHING;

-- Insertar configuración inicial del banner de Noticias
INSERT INTO public.banner_config (
  banner_type,
  title,
  description,
  is_active,
  show_close_button,
  background_color,
  text_color,
  icon_type,
  cta_text,
  cta_link,
  storage_key,
  priority
) VALUES (
  'news',
  'Últimas Noticias',
  'Mantente actualizado con las nuevas features de ComplicesConecta',
  false,
  true,
  'from-blue-600 to-cyan-600',
  'text-white',
  'bell',
  'Leer Más',
  '/news',
  'news_banner',
  5
) ON CONFLICT (banner_type) DO NOTHING;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON TABLE public.banner_config IS 'Configuración de banners para BetaBanner, DismissibleBanner y otros componentes. Gestionable desde el panel admin.';
COMMENT ON COLUMN public.banner_config.banner_type IS 'Tipo único de banner: beta, news, announcement, maintenance, custom';
COMMENT ON COLUMN public.banner_config.is_active IS 'Si el banner debe mostrarse en la UI';
COMMENT ON COLUMN public.banner_config.background_color IS 'Clase Tailwind CSS para el gradiente de fondo';
COMMENT ON COLUMN public.banner_config.priority IS 'Prioridad de visualización (mayor = más prioritario)';
