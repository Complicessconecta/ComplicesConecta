# Sistema de Gestión de Banners - Guía de Implementación

## 📋 Descripción

Sistema completo para gestionar banners (BetaBanner, DismissibleBanner, etc.) desde el panel de administración en producción. Permite actualizar títulos, descripciones, estilos y visibilidad sin modificar código.

**Fecha**: 12 Dic 2025  
**Versión**: v3.8.0  
**Estado**: ✅ Listo para implementar

---

## 🚀 Componentes Creados

### 1. **BannerManagementService** (`src/services/BannerManagementService.ts`)
Servicio TypeScript para CRUD de banners:
- `getAllBanners()` - Obtener todas las configuraciones
- `getBannerByType(type)` - Obtener banner específico
- `getActiveBanners()` - Solo banners activos
- `createBanner(input)` - Crear nuevo banner
- `updateBanner(id, input)` - Actualizar banner
- `deleteBanner(id)` - Eliminar banner
- `toggleBannerVisibility(id, isActive)` - Activar/Desactivar

### 2. **AdminBannerPanel** (`src/components/admin/AdminBannerPanel.tsx`)
Componente React para gestionar banners:
- ✅ Lista de banners con estado
- ✅ Formulario de creación/edición
- ✅ Activar/Desactivar visibilidad
- ✅ Eliminar banners
- ✅ Personalización de estilos (gradientes, colores)
- ✅ Gestión de prioridades

### 3. **Migración SQL** (`supabase/migrations/create_banner_config_table.sql`)
Tabla `banner_config` con:
- ✅ RLS Policies (solo admins pueden editar)
- ✅ Índices optimizados
- ✅ Trigger para `updated_at`
- ✅ Datos iniciales (Beta, News)

### 4. **BetaBanner Actualizado** (`src/components/BetaBanner.tsx`)
Integración con BannerManagementService:
- ✅ Carga configuración desde BD
- ✅ Fallback a valores por defecto
- ✅ Estilos dinámicos desde admin

---

## 📦 Pasos de Implementación

### Paso 1: Aplicar Migración SQL

**Opción A: Via Supabase CLI**
```bash
supabase migration up
```

**Opción B: Via Supabase Dashboard**
1. Ir a SQL Editor
2. Copiar contenido de `supabase/migrations/create_banner_config_table.sql`
3. Ejecutar

**Opción C: Via psql**
```bash
psql -h db.yfvqxfqjxqbhwqzxkwkd.supabase.co -U postgres -d postgres -f supabase/migrations/create_banner_config_table.sql
```

### Paso 2: Integrar AdminBannerPanel en Admin

Agregar a `src/app/(admin)/AdminDashboard.tsx` o similar:

```tsx
import { AdminBannerPanel } from '@/components/admin/AdminBannerPanel';

export const AdminDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Otros paneles */}
      <AdminBannerPanel />
    </div>
  );
};
```

### Paso 3: Verificar Integración

1. **BetaBanner** - Ya integrado ✅
2. **DismissibleBanner** - Listo para integrar (similar a BetaBanner)
3. **Otros banners** - Crear nuevos tipos en admin

---

## 🎨 Uso en Componentes

### Integrar en DismissibleBanner (Ejemplo)

```tsx
import { BannerManagementService } from '@/services/BannerManagementService';

export const DismissibleBanner = () => {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    const loadConfig = async () => {
      const cfg = await BannerManagementService.getBannerByType('news');
      setConfig(cfg);
    };
    loadConfig();
  }, []);

  if (!config?.is_active) return null;

  return (
    <div className={`bg-gradient-to-r ${config.background_color}`}>
      <h3 className={config.text_color}>{config.title}</h3>
      <p>{config.description}</p>
    </div>
  );
};
```

---

## 🔐 Seguridad

- ✅ **RLS Policies**: Solo admins pueden ver/editar banners
- ✅ **Validación de Roles**: Verificación en BD (tabla `profiles.role = 'admin'`)
- ✅ **Auditoría**: Campos `created_by`, `updated_by`, `updated_at`
- ✅ **Producción Only**: No afecta demo (datos en BD, no localStorage)

---

## 📊 Tipos de Banners Predefinidos

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `beta` | Acceso Beta | "¡Acceso Exclusivo Beta!" |
| `news` | Noticias | "Últimas Noticias" |
| `announcement` | Anuncios | "Mantenimiento Programado" |
| `maintenance` | Mantenimiento | "Sistema en Mantenimiento" |
| `custom` | Personalizado | Cualquier otro |

---

## 🎯 Funcionalidades Principales

### Desde Admin Panel
- ✅ Crear/Editar/Eliminar banners
- ✅ Activar/Desactivar sin eliminar
- ✅ Cambiar título y descripción
- ✅ Personalizar gradientes y colores
- ✅ Configurar CTA (Call-to-Action)
- ✅ Establecer prioridades
- ✅ Ver historial (created_at, updated_at)

### Desde Componentes
- ✅ Carga automática de configuración
- ✅ Fallback a valores por defecto
- ✅ Estilos dinámicos
- ✅ Persistencia de cierre (localStorage)

---

## 🧪 Testing

### Verificar Tabla
```sql
SELECT * FROM public.banner_config;
```

### Verificar RLS
```sql
-- Como admin
SELECT * FROM public.banner_config;

-- Como usuario normal
SELECT * FROM public.banner_config WHERE is_active = true;
```

### Verificar Trigger
```sql
UPDATE public.banner_config 
SET title = 'Test' 
WHERE banner_type = 'beta';

SELECT updated_at, updated_by FROM public.banner_config WHERE banner_type = 'beta';
```

---

## 📝 Notas

- **Producción Only**: El sistema usa BD, no afecta demo
- **Fallback Seguro**: Si BD no responde, usa valores por defecto
- **Type-Safe**: 100% TypeScript con interfaces
- **Logging**: Todos los eventos registrados en logger
- **Performance**: Índices optimizados para queries rápidas

---

## 🔄 Próximos Pasos

1. ✅ Aplicar migración SQL
2. ✅ Integrar AdminBannerPanel en admin
3. ⏳ Integrar en DismissibleBanner (similar a BetaBanner)
4. ⏳ Crear edge function para resetear dismissals globales
5. ⏳ Agregar webhooks para notificaciones de cambios

---

## 📞 Soporte

Para preguntas o issues:
- Revisar logs en `logger.info()` / `logger.error()`
- Verificar RLS policies en Supabase Dashboard
- Confirmar que usuario tiene rol `admin` en tabla `profiles`

---

**Creado**: 12 Dic 2025  
**Versión**: v3.8.0  
**Estado**: ✅ Listo para Producción
