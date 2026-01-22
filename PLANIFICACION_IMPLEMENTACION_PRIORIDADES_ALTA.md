# 🎯 Planificación de Implementación - Problemas Prioritarios Alta

**Fecha:** 21 de Enero, 2026
**Versión:** v3.9.2
**Estado:** Planificación para implementación de problemas críticos

---

## 📋 Resumen Ejecutivo

Este documento detalla la planificación paso a paso para implementar los 5 problemas de Alta Prioridad identificados en `PROBLEMAS_PENDIENTES_CONSOLIDADOS.md`.

**Problemas Prioritarios:**
1. Implementar lógica de Match (Alta)
2. Implementar galería privada en Chat (Alta)
3. Fix encoding UTF-8 masivo (Alta)
4. Implementar backend proxy para API key de Pinata (Alta)
5. Crear tablas faltantes en DB (Media)

**Orden de Implementación Recomendado:**
1. Crear tablas faltantes en DB (Bloquea features 1, 2)
2. Implementar lógica de Match (Core del flujo)
3. Implementar galería privada en Chat (Monetización)
4. Fix encoding UTF-8 masivo (Profesionalismo)
5. Implementar backend proxy para API key de Pinata (Seguridad)

---

## 🗃️ Paso 1: Crear Tablas Faltantes en DB

### 1.1 Tabla `likes`

**Ubicación:** `supabase/migrations/20250121_create_likes_table.sql`

**SQL:**
```sql
-- Tabla para almacenar likes entre usuarios
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  liked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(liker_id, liked_id)
);

-- Índices
CREATE INDEX idx_likes_liker_id ON public.likes(liker_id);
CREATE INDEX idx_likes_liked_id ON public.likes(liked_id);
CREATE INDEX idx_likes_created_at ON public.likes(created_at DESC);

-- RLS Policies
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see likes they sent or received"
  ON public.likes FOR SELECT
  USING (auth.uid() = liker_id OR auth.uid() = liked_id);

CREATE POLICY "Users can create likes"
  ON public.likes FOR INSERT
  WITH CHECK (auth.uid() = liker_id);
```

**Verificación:**
```sql
-- Verificar tabla creada
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'likes';

-- Verificar columnas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'likes'
ORDER BY ordinal_position;
```

---

### 1.2 Tabla `matches`

**Ubicación:** `supabase/migrations/20250121_create_matches_table.sql`

**SQL:**
```sql
-- Tabla para almacenar matches mutuos entre usuarios
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user1_id, user2_id)
);

-- Índices
CREATE INDEX idx_matches_user1_id ON public.matches(user1_id);
CREATE INDEX idx_matches_user2_id ON public.matches(user2_id);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_matches_created_at ON public.matches(created_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own matches"
  ON public.matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create matches"
  ON public.matches FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);
```

**Verificación:**
```sql
-- Verificar tabla creada
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'matches';

-- Verificar columnas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'matches'
ORDER BY ordinal_position;
```

---

### 1.3 Tabla `couple_agreements`

**Ubicación:** `supabase/migrations/20250121_create_couple_agreements_table.sql`

**SQL:**
```sql
-- Tabla para acuerdos de parejas
CREATE TABLE IF NOT EXISTS public.couple_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
  agreement_type TEXT NOT NULL,
  content TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_couple_agreements_couple_id ON public.couple_agreements(couple_id);
CREATE INDEX idx_couple_agreements_status ON public.couple_agreements(status);
CREATE INDEX idx_couple_agreements_created_at ON public.couple_agreements(created_at DESC);

-- Trigger para updated_at
CREATE TRIGGER update_couple_agreements_updated_at
  BEFORE UPDATE ON public.couple_agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.couple_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their couple agreements"
  ON public.couple_agreements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couples
      WHERE id = couple_agreements.couple_id
      AND (user1_id = auth.uid() OR user2_id = auth.uid())
    )
  );
```

**Verificación:**
```sql
-- Verificar tabla creada
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'couple_agreements';

-- Verificar columnas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'couple_agreements'
ORDER BY ordinal_position;
```

---

### 1.4 Tabla `biometric_auth`

**Ubicación:** `supabase/migrations/20250121_create_biometric_auth_table.sql`

**SQL:**
```sql
-- Tabla para autenticación biométrica
CREATE TABLE IF NOT EXISTS public.biometric_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  biometric_data TEXT NOT NULL,
  device_fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true
);

-- Índices
CREATE INDEX idx_biometric_auth_user_id ON public.biometric_auth(user_id);
CREATE INDEX idx_biometric_auth_device_fingerprint ON public.biometric_auth(device_fingerprint);
CREATE INDEX idx_biometric_auth_created_at ON public.biometric_auth(created_at DESC);

-- RLS Policies
ALTER TABLE public.biometric_auth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own biometric data"
  ON public.biometric_auth FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create biometric data"
  ON public.biometric_auth FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**Verificación:**
```sql
-- Verificar tabla creada
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'biometric_auth';

-- Verificar columnas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'biometric_auth'
ORDER BY ordinal_position;
```

---

### 1.5 Regenerar Tipos TypeScript

**Comando:**
```bash
npx supabase gen types typescript --linked --schema=public > src/types/supabase-generated.ts
```

**Verificación:**
- Verificar que `src/types/supabase-generated.ts` incluya las nuevas tablas
- Ejecutar `npm run type-check` para verificar que no haya errores

---

## 🎯 Paso 2: Implementar Lógica de Match

### 2.1 Crear MatchService.ts

**Ubicación:** `src/services/social/MatchService.ts`

**Código:**
```typescript
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface Like {
  id: string;
  liker_id: string;
  liked_id: string;
  created_at: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

class MatchService {
  private static instance: MatchService;

  private constructor() {}

  public static getInstance(): MatchService {
    if (!MatchService.instance) {
      MatchService.instance = new MatchService();
    }
    return MatchService.instance;
  }

  async createLike(likerId: string, likedId: string): Promise<Like | null> {
    try {
      const { data, error } = await supabase
        .from('likes')
        .insert({
          liker_id,
          liked_id,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating like', { error });
        return null;
      }

      logger.info('Like created', { likerId: likerId.substring(0, 8) + '***', likedId: likedId.substring(0, 8) + '***' });
      return data;
    } catch (error) {
      logger.error('Error creating like', { error });
      return null;
    }
  }

  async checkForMatch(likerId: string, likedId: string): Promise<Match | null> {
    try {
      // Verificar si existe like mutuo
      const { data: existingLikes, error: likeError } = await supabase
        .from('likes')
        .select('*')
        .or(`and(liker_id.eq.${likerId},liked_id.eq.${likedId}),and(liker_id.eq.${likedId},liked_id.eq.${likerId})`);

      if (likeError) {
        logger.error('Error checking for match', { error });
        return null;
      }

      // Si hay 2 likes mutuos, crear match
      if (existingLikes && existingLikes.length >= 2) {
        const { data: existingMatch, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .or(`and(user1_id.eq.${likerId},user2_id.eq.${likedId}),and(user1_id.eq.${likedId},user2_id.eq.${likerId})`)
          .single();

        if (matchError) {
          logger.error('Error checking existing match', { error });
          return null;
        }

        // Si ya existe match, no crear nuevo
        if (existingMatch) {
          return existingMatch;
        }

        // Crear nuevo match
        const { data: match, error: createError } = await supabase
          .from('matches')
          .insert({
            user1_id: likerId,
            user2_id: likedId,
            status: 'pending',
          })
          .select()
          .single();

        if (createError) {
          logger.error('Error creating match', { error });
          return null;
        }

        logger.info('Match created', { matchId: match?.id, user1_id: match?.user1_id.substring(0, 8) + '***', user2_id: match?.user2_id.substring(0, 8) + '***' });
        return match;
      }

      return null;
    } catch (error) {
      logger.error('Error checking for match', { error });
      return null;
    }
  }

  async getMatches(userId: string): Promise<Match[]> {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error getting matches', { error });
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error getting matches', { error });
      return [];
    }
  }

  async hasMatch(userId: string, otherUserId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('id')
        .or(`and(user1_id.eq.${userId},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${userId})`)
        .maybeSingle();

      if (error) {
        logger.error('Error checking match', { error });
        return false;
      }

      return !!data;
    } catch (error) {
      logger.error('Error checking match', { error });
      return false;
    }
  }
}

export const matchService = MatchService.getInstance();
export type { MatchService };
```

---

### 2.2 Actualizar Discover.tsx

**Ubicación:** `src/pages/Discover.tsx`

**Cambio en `handleLike`:**
```typescript
import { matchService } from '@/services/social/MatchService';

// Antes:
const handleLike = async (profileId: string) => {
  toast.success('❤️ Like enviado');
};

// Después:
const handleLike = async (profileId: string) => {
  try {
    // Crear like
    const like = await matchService.createLike(currentUser.id, profileId);

    if (!like) {
      toast.error('Error al enviar like');
      return;
    }

    // Verificar si hay match
    const match = await matchService.checkForMatch(currentUser.id, profileId);

    if (match) {
      toast.success(`🎉 ¡Nuevo Match con ${profile.name}!`, {
        description: 'Ahora puedes chatear con esta persona',
        action: {
          label: 'Ir al Chat',
          onClick: () => navigate(`/chat/${profileId}`)
        }
      });

      // Actualizar lista de matches
      setMatches(prev => [...prev, match]);
    } else {
      toast.success('❤️ Like enviado');
    }
  } catch (error) {
    logger.error('Error in handleLike', { error });
    toast.error('Error al enviar like');
  }
};
```

**Cambio en `handleMessage`:**
```typescript
// Antes:
const handleMessage = (profileId: string) => {
  navigate(`/chat/${profileId}`);
};

// Después:
const handleMessage = async (profileId: string) => {
  // Verificar si existe match
  const hasMatch = await matchService.hasMatch(currentUser.id, profileId);

  if (!hasMatch) {
    toast.error('❌ Debes hacer match primero para chatear');
    return;
  }

  navigate(`/chat/${profileId}`);
};
```

---

### 2.3 Actualizar Chat.tsx

**Ubicación:** `src/pages/Chat.tsx`

**Cambio en componente:**
```typescript
import { matchService } from '@/services/social/MatchService';

// Agregar verificación al cargar chat
useEffect(() => {
  const verifyMatch = async () => {
    if (currentUser && profileId) {
      const hasMatch = await matchService.hasMatch(currentUser.id, profileId);

      if (!hasMatch) {
        toast.error('❌ No tienes match con esta persona');
        navigate('/discover');
        return;
      }

      // Cargar mensajes del chat
      loadMessages();
    }
  };

  verifyMatch();
}, [currentUser, profileId]);
```

---

## 💬 Paso 3: Implementar Galería Privada en Chat

### 3.1 Crear GalleryPrivacyService.ts

**Ubicación:** `src/services/social/GalleryPrivacyService.ts`

**Código:**
```typescript
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface GalleryUnlock {
  id: string;
  user_id: string;
  gallery_item_id: string;
  cmpx_amount: number;
  creator_id: string;
  created_at: string;
}

class GalleryPrivacyService {
  private static instance: GalleryPrivacyService;
  private readonly CMPX_COST = 100; // Costo de desbloqueo

  private constructor() {}

  public static getInstance(): GalleryPrivacyService {
    if (!GalleryPrivacyService.instance) {
      GalleryPrivacyService.instance = new GalleryPrivacyService();
    }
    return GalleryPrivacyService.instance;
  }

  async hasGalleryAccess(userId: string, galleryItemId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('gallery_unlocks')
        .select('id')
        .eq('user_id', userId)
        .eq('gallery_item_id', galleryItemId)
        .maybeSingle();

      if (error) {
        logger.error('Error checking gallery access', { error });
        return false;
      }

      return !!data;
    } catch (error) {
      logger.error('Error checking gallery access', { error });
      return false;
    }
  }

  async unlockGallery(
    userId: string,
    galleryItemId: string,
    creatorId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar si ya tiene acceso
      const hasAccess = await this.hasGalleryAccess(userId, galleryItemId);

      if (hasAccess) {
        return { success: true };
      }

      // Verificar balance de CMPX
      const { data: balance } = await supabase
        .from('token_balances')
        .select('balance')
        .eq('user_id', userId)
        .eq('token_type', 'CMPX')
        .single();

      if (!balance || balance.balance < this.CMPX_COST) {
        return { success: false, error: 'No tienes suficientes tokens CMPX' };
      }

      // Crear registro de desbloqueo
      const { error } = await supabase
        .from('gallery_unlocks')
        .insert({
          user_id: userId,
          gallery_item_id: galleryItemId,
          cmpx_amount: this.CMPX_COST,
          creator_id,
        });

      if (error) {
        logger.error('Error unlocking gallery', { error });
        return { success: false, error: 'Error al desbloquear galería' };
      }

      logger.info('Gallery unlocked', { userId: userId.substring(0, 8) + '***', galleryItemId: galleryItemId.substring(0, 8) + '***' });
      return { success: true };
    } catch (error) {
      logger.error('Error unlocking gallery', { error });
      return { success: false, error: 'Error al desbloquear galería' };
    }
  }

  getCMPCost(): number {
    return this.CMPX_COST;
  }
}

export const galleryPrivacyService = GalleryPrivacyService.getInstance();
export type { GalleryPrivacyService };
```

---

### 3.2 Crear PrivateGallery.tsx

**Ubicación:** `src/components/chat/PrivateGallery.tsx`

**Código:**
```typescript
import { useState } from 'react';
import { Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { galleryPrivacyService } from '@/services/social/GalleryPrivacyService';
import { toast } from 'sonner';

interface PrivateGalleryProps {
  galleryItems: Array<{
    id: string;
    url: string;
    thumbnail_url?: string;
    caption?: string;
  }>;
  creatorId: string;
  currentUserId: string;
}

export function PrivateGallery({ galleryItems, creatorId, currentUserId }: PrivateGalleryProps) {
  const [unlockedItems, setUnlockedItems] = useState<Set<string>>(new Set());
  const [unlocking, setUnlocking] = useState<string | null>(null);

  const handleUnlock = async (itemId: string) => {
    setUnlocking(itemId);

    try {
      const result = await galleryPrivacyService.unlockGallery(currentUserId, itemId, creatorId);

      if (result.success) {
        setUnlockedItems(prev => new Set(prev).add(itemId));
        toast.success('🔓 Galería desbloqueada');
      } else {
        toast.error(result.error || 'Error al desbloquear');
      }
    } catch (error) {
      toast.error('Error al desbloquear');
    } finally {
      setUnlocking(null);
    }
  };

  const cmpxCost = galleryPrivacyService.getCMPCost();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-purple-500" />
        <h3 className="font-semibold">Galería Privada</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {galleryItems.map(item => {
          const isUnlocked = unlockedItems.has(item.id);

          return (
            <div
              key={item.id}
              className={`relative rounded-lg overflow-hidden ${
                !isUnlocked ? 'blur-sm' : ''
              }`}
            >
              {/* Imagen */}
              <img
                src={item.thumbnail_url || item.url}
                alt={item.caption || 'Foto privada'}
                className="w-full h-48 object-cover"
              />

              {/* Capa de bloqueo */}
              {!isUnlocked && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                  <Lock className="h-8 w-8 text-white mb-2" />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleUnlock(item.id)}
                    disabled={unlocking === item.id}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {unlocking === item.id ? 'Desbloqueando...' : `Desbloquear (${cmpxCost} CMPX)`}
                  </Button>
                </div>
              )}

              {/* Caption */}
              {item.caption && isUnlocked && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-sm">{item.caption}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

### 3.3 Integrar PrivateGallery en Chat.tsx

**Ubicación:** `src/pages/Chat.tsx`

**Cambio en componente:**
```typescript
import { PrivateGallery } from '@/components/chat/PrivateGallery';

// Agregar componente de galería privada en el chat
<PrivateGallery
  galleryItems={profile.gallery_items || []}
  creatorId={profile.id}
  currentUserId={currentUser.id}
/>
```

---

## 🔤 Paso 4: Fix Encoding UTF-8 Masivo

### 4.1 Script PowerShell para Fix

**Ubicación:** `fix-encoding-utf8.ps1`

**Código:**
```powershell
# Fix Encoding UTF-8 Masivo
# Fecha: 21 de Enero, 2026

Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts |
ForEach-Object {
    $content = Get-Content $_.FullName -Raw -Encoding UTF8

    # Reemplazos de encoding corrupto
    $content = $content -replace 'aos(?![a-zA-Z])', 'años'
    $content = $content -replace 'das(?![a-zA-Z])', 'días'
    $content = $content -replace 'autnticas', 'auténticas'
    $content = $content -replace 'relacin', 'relación'
    $content = $content -replace 'sesin', 'sesión'
    $content = $content -replace 'mismos', 'mísimos'
    $content = $content -replace 'tambin', 'también'
    $content = $content -replace 'ningn', 'ningún'

    Set-Content $_.FullName -Value $content -Encoding UTF8

    Write-Host "Fixed: $($_.FullName)"
}
```

### 4.2 Ejecución del Script

**Comando:**
```powershell
.\fix-encoding-utf8.ps1
```

**Verificación:**
```powershell
# Verificar si quedan archivos con encoding corrupto
Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts |
Select-String -Pattern 'aos(?![a-zA-Z])|das(?![a-zA-Z])|autnticas|relacin' |
Select-Object -Unique Path
```

---

## 🔒 Paso 5: Implementar Backend Proxy para API Key de Pinata

### 5.1 Crear Edge Function para Proxy

**Ubicación:** `supabase/functions/pinata-proxy/index.ts`

**Código:**
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PINATA_JWT = Deno.env.get('PINATA_JWT') || '';
const PINATA_API_URL = 'https://api.pinata.cloud';

Deno.serve(async (req: Request) => {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { method, path, body } = await req.json();

    // Validar método permitido
    const allowedMethods = ['pinning/pinFileToIPFS', 'pinning/unpin'];
    if (!allowedMethods.includes(method)) {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Construir URL
    const url = `${PINATA_API_URL}${path}`;

    // Hacer request a Pinata
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: response.status,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
```

### 5.2 Actualizar NFTService.ts

**Ubicación:** `src/services/payments/NFTService.ts`

**Cambio:**
```typescript
// Antes:
headers: {
  Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
},

// Después:
const pinataProxyUrl = import.meta.env.VITE_PINATA_PROXY_URL || '/functions/v1/pinata-proxy';

const response = await fetch(`${pinataProxyUrl}/pinning/pinFileToIPFS`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    method: 'pinning/pinFileToIPFS',
    path: 'pinning/pinFileToIPFS',
    body: formData,
  }),
});
```

### 5.3 Variables de Entorno

**Agregar a `.env` y `.env.example`:**
```bash
# Pinata Proxy
VITE_PINATA_PROXY_URL=http://localhost:54321/functions/v1/pinata-proxy
```

**Agregar a `supabase/functions/pinata-proxy/.env`:**
```bash
PINATA_JWT=your_actual_jwt_token_here
```

---

## 📊 Orden de Ejecución y Verificación

### Fase 1: Base de Datos (1-2 horas)
1. ✅ Crear tablas faltantes (likes, matches, couple_agreements, biometric_auth)
2. ✅ Regenerar tipos TypeScript
3. ✅ Verificar que `npm run type-check` pase sin errores

### Fase 2: Lógica de Match (2-3 horas)
1. ✅ Crear MatchService.ts
2. ✅ Actualizar Discover.tsx (handleLike, handleMessage)
3. ✅ Actualizar Chat.tsx (verificación de match)
4. ✅ Probar flujo completo: Like → Match → Chat

### Fase 3: Galería Privada (2-3 horas)
1. ✅ Crear GalleryPrivacyService.ts
2. ✅ Crear PrivateGallery.tsx
3. ✅ Integrar en Chat.tsx
4. ✅ Probar desbloqueo con CMPX

### Fase 4: Encoding UTF-8 (30 minutos)
1. ✅ Ejecutar script PowerShell
2. ✅ Verificar que no queden archivos corruptos
3. ✅ Probar build y lint

### Fase 5: Backend Proxy (1-2 horas)
1. ✅ Crear Edge Function pinata-proxy
2. ✅ Actualizar NFTService.ts
3. ✅ Configurar variables de entorno
4. ✅ Probar minteo de NFTs

---

## ✅ Checklist de Verificación

### Base de Datos
- [ ] Tabla `likes` creada con RLS
- [ ] Tabla `matches` creada con RLS
- [ ] Tabla `couple_agreements` creada con RLS
- [ ] Tabla `biometric_auth` creada con RLS
- [ ] Tipos TypeScript regenerados
- [ ] `npm run type-check` pasa sin errores

### Lógica de Match
- [ ] MatchService.ts creado
- [ ] Discover.tsx actualizado (handleLike, handleMessage)
- [ ] Chat.tsx actualizado (verificación de match)
- [ ] Flujo Like → Match → Chat probado

### Galería Privada
- [ ] GalleryPrivacyService.ts creado
- [ ] PrivateGallery.tsx creado
- [ ] Integrado en Chat.tsx
- [ ] Desbloqueo con CMPX probado

### Encoding UTF-8
- [ ] Script PowerShell ejecutado
- [ ] No quedan archivos con encoding corrupto
- [ ] Build y lint pasan sin errores

### Backend Proxy
- [ ] Edge Function pinata-proxy creada
- [ ] NFTService.ts actualizado
- [ ] Variables de entorno configuradas
- [ ] Minteo de NFTs probado

---

## 📝 Notas Importantes

1. **Backup antes de cambios:**
   - Crear backup de la base de datos antes de crear tablas
   - Crear backup del código antes de cambios masivos

2. **Pruebas en ambiente de desarrollo:**
   - Probar cada cambio en `npm run dev` antes de commit
   - Verificar que no rompa flujos existentes

3. **Documentación:**
   - Actualizar README.md con nuevos features
   - Actualizar CHANGELOG.md con cambios aplicados
   - Crear commits descriptivos con fecha y hora

4. **Seguridad:**
   - No exponer API keys en código
   - Usar variables de entorno para secrets
   - Implementar RLS en todas las tablas nuevas

---

**Documento Generado:** 21 de Enero, 2026
**Versión del Proyecto:** v3.9.2
**Estado:** Planificación completa para implementación de problemas críticos
