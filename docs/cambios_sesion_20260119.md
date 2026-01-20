# Cambios de Sesión - 19 Enero 2026

## Resumen
Corrección de interactividad en Auth, restricción de datos a administradores, corrección de NFTs y migración SQL para evitar recursión en policies RLS.

---

## 1. Descargar Mis Datos - Solo para Administradores

### Síntoma
- Botón "Descargar mis datos" visible para todos los usuarios en PrivacySettings
- Cualquier usuario podía exportar sus datos personales

### Causa
- No había verificación de rol de administrador antes de mostrar el botón
- Función `handleDownloadData()` no validaba permisos

### Solución
**Archivo:** `src/components/settings/PrivacySettings.tsx`

1. Obtener `isAdmin` desde `useAuth`:
```tsx
const { user, isAdmin } = useAuth();
```

2. Ocultar botón para usuarios normales:
```tsx
{isAdmin() && (
  <Button onClick={handleDownloadData} disabled={isExporting}>
    <Trash2 className="h-4 w-4 mr-2" />
    {isExporting ? "Exportando..." : "Descargar mis datos"}
  </Button>
)}
```

3. Validar en handler:
```tsx
const handleDownloadData = async () => {
  if (!isAdmin()) {
    toast({
      title: "Acceso denegado",
      description: "Solo los administradores pueden descargar datos.",
      variant: "destructive",
    });
    return;
  }
  // ... resto del código
};
```

### Estado
✅ Completado y desplegado a producción

---

## 2. Modal de NFT Demo - Interactividad

### Síntoma
- Click en NFTs demo no desplegaba información
- Modal no se mostraba al seleccionar NFT

### Causa
- Modal estaba mal posicionado dentro de `CardContent` del Wallet
- Estructura JSX rota impedía renderizado correcto

### Solución
**Archivo:** `src/components/wallet/DemoWallet.tsx`

1. Mover modal al final del componente (después de todos los Cards):
```tsx
{/* Modal Detalle NFT Demo */}
{selectedNft && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
    {/* contenido del modal */}
  </div>
)}

{/* Footer Info */}
<div className="text-center space-y-2">
  {/* footer */}
</div>
```

2. Agregar estado para NFT seleccionado:
```tsx
const [selectedNft, setSelectedNft] = useState<DemoNFT | null>(null);
```

3. Agregar eventos de click y teclado en NFTs:
```tsx
<div
  onClick={() => setSelectedNft(nft)}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelectedNft(nft);
    }
  }}
  role="button"
  tabIndex={0}
>
```

### Estado
✅ Completado y desplegado a producción

---

## 3. NFTService - Tabla Correcta y Validación de Entorno

### Síntoma
- Error `PGRST205` - tabla `nfts` no existe
- Datos demo aparecían en producción por flags persistidos en localStorage

### Causa
1. Consultaba tabla inexistente `nfts` en lugar de `user_nfts`
2. No validaba entorno (demo vs producción) antes de usar datos demo

### Solución
**Archivo:** `src/services/payments/NFTService.ts`

1. Cambiar tabla correcta:
```tsx
// Antes
const { data, error } = await supabase
  .from("nfts")
  .select("*");

// Después
const { data, error } = await supabase
  .from("user_nfts")
  .select("*")
  .eq("user_id", userId);
```

2. Validar entorno antes de usar datos demo:
```tsx
const isDemoEnvironment = 
  import.meta.env.VITE_APP_MODE === "demo" || 
  MODE === "development";

if (isDemoEnvironment && demoAuthenticated) {
  return demoNFTs;
}
```

### Estado
✅ Completado y desplegado a producción

---

## 4. Error TypeScript - Importación No Usada

### Síntoma
- Error TS6133: `'FadeIn' is declared but its value is never read`

### Causa
- Importación de `FadeIn` en `AnimatedHeroSection.tsx` no se utilizaba

### Solución
**Archivo:** `src/components/ui/examples/AnimatedHeroSection.tsx`

Eliminar importación no usada:
```tsx
// Antes
import { FadeInUp, FadeIn, ScaleIn } from "@/components/ui/animations/ScrollAnimations";

// Después
import { FadeInUp, ScaleIn } from "@/components/ui/animations/ScrollAnimations";
```

### Estado
✅ Completado

---

## 5. Migración SQL - Corrección de Recursión en admin_users

### Síntoma
- Error en consola: "infinite recursion detected in policy" en `admin_users`
- Consultas a `admin_users` fallaban en producción

### Causa
- Policies RLS de `admin_users` se auto-referenciaban:
```sql
EXISTS (
  SELECT 1 FROM public.admin_users
  WHERE user_id = auth.uid() AND is_active = TRUE
)
```
- Esto creaba recursión cuando Postgres evaluaba la policy

### Solución
**Archivo:** `supabase/migrations/20260120000010_fix_admin_users_rls_recursion.sql`

1. Crear funciones `SECURITY DEFINER` para evitar RLS:
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.user_id = auth.uid()
      AND au.is_active = TRUE
  );
END;
$$;
```

2. Reemplazar policies para usar funciones:
```sql
CREATE POLICY "Admins can view admin_users" ON public.admin_users
  FOR SELECT
  USING (public.is_admin());
```

### Estado
✅ Completado
- Respaldo SQL creado en `D:\01SQLComplicesConecta\respaldo_20260119_220811.sql`
- Migración aplicada localmente vía Docker
- Funciones `is_admin()` y `is_super_admin()` verificadas
- 4 policies de `admin_users` activas

### Notas
- Errores sobre `gallery_access_requests` y `couple_profile_likes` son esperados
- Esas tablas aún no existen en entorno local
- No afectan la corrección de recursión en `admin_users`

---

## Archivos Modificados

1. `src/components/settings/PrivacySettings.tsx`
2. `src/components/wallet/DemoWallet.tsx`
3. `src/services/payments/NFTService.ts`
4. `src/components/ui/examples/AnimatedHeroSection.tsx`
5. `supabase/migrations/20260120000010_fix_admin_users_rls_recursion.sql` (nuevo)

---

## Verificaciones Ejecutadas

- ✅ `npm run lint` - Sin errores
- ✅ `npx tsc` - Sin errores (después de corrección)
- ✅ `supabase migration up` - Migraciones aplicadas
- ✅ Verificación de funciones `is_admin()` y `is_super_admin()`
- ✅ Verificación de policies de `admin_users`
- ✅ Despliegue a producción (Vercel)

---

## Pendientes

1. Corregir warnings Tailwind (bg-gradient-to-* → bg-linear-to-*, flex-shrink-0 → shrink-0)
2. Aplicar migraciones pendientes para `gallery_access_requests` y `couple_profile_likes`
