# Guía de Migración con Docker Desktop

## 📋 Requisitos Previos

- ✅ Docker Desktop instalado y corriendo
- ✅ Supabase CLI instalado (`supabase --version`)
- ✅ Proyecto vinculado localmente

## 🚀 Pasos para Aplicar la Migración

### Opción 1: Usar Script Automático (Recomendado)

#### En PowerShell (Windows):
```powershell
# Navega al directorio del proyecto
cd C:\Users\conej\Documents\conecta-social-comunidad-main

# Ejecuta el script
.\apply-migration.ps1
```

#### En Bash (macOS/Linux o WSL):
```bash
# Navega al directorio del proyecto
cd ~/Documents/conecta-social-comunidad-main

# Dale permisos de ejecución
chmod +x apply-migration.sh

# Ejecuta el script
./apply-migration.sh
```

---

### Opción 2: Comandos Manuales

#### Paso 1: Verificar que Supabase está corriendo
```bash
supabase status
```

Si ves "not ready", espera 30-60 segundos y vuelve a intentar.

#### Paso 2: Aplicar la migración
```bash
supabase migration up
```

Esto aplicará `supabase/migrations/create_banner_config_table.sql` a la BD local.

#### Paso 3: Regenerar tipos TypeScript
```bash
supabase gen types typescript --local > src/integrations/supabase/types.ts
```

---

## ✅ Verificación

Después de ejecutar los comandos, verifica:

1. **Tabla creada**: Abre Supabase Studio (http://localhost:54323) y verifica que existe `banner_config`
2. **Tipos actualizados**: Abre `src/integrations/supabase/types.ts` y busca `banner_config`
3. **Sin errores TypeScript**: Los errores en `BannerManagementService.ts` deberían desaparecer

---

## 🔧 Solución de Problemas

### "Cannot find project ref"
```bash
# Asegúrate de que Supabase está corriendo
supabase start

# Espera 30-60 segundos
# Luego intenta de nuevo
supabase migration up
```

### "Container is not ready"
```bash
# Espera a que Docker inicie completamente
# Verifica en Docker Desktop que los contenedores están corriendo
# Intenta:
supabase stop
supabase start
```

### Errores de permisos en PowerShell
```powershell
# Ejecuta PowerShell como administrador
# Luego:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\apply-migration.ps1
```

---

## 📊 Resultado Esperado

Después de completar:

```
✅ Migracion aplicada exitosamente
✅ Tipos TypeScript regenerados
```

Y en `src/integrations/supabase/types.ts`:
```typescript
export type Tables<PublicTableNameOrOptions extends ...> = PublicTableNameOrOptions extends { schema: infer S }
  ? S extends "public"
    ? PublicTables[PublicTableNameOrOptions["table"]]
    : never
  : PublicTableNameOrOptions extends keyof PublicTables
    ? PublicTables[PublicTableNameOrOptions]
    : never

export interface PublicTables {
  banner_config: {
    Row: {
      id: string
      banner_type: 'beta' | 'news' | 'announcement' | 'maintenance' | 'custom'
      title: string
      // ... más campos
    }
    // ...
  }
  // ... otras tablas
}
```

---

## 🎯 Próximos Pasos

1. ✅ Aplicar migración (este documento)
2. ⏳ Integrar `AdminBannerPanel` en admin dashboard
3. ⏳ Probar sistema de gestión de banners
4. ⏳ Desplegar a producción

---

**Fecha**: 12 Dic 2025  
**Versión**: v3.8.0  
**Estado**: Listo para ejecutar
