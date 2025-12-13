# Comandos de Supabase para Alinear BD y Regenerar Tipos

## 📋 Pasos a Ejecutar en Terminal

### Paso 1: Vincular Proyecto (si no está vinculado)
```bash
supabase link --project-ref yfvqxfqjxqbhwqzxkwkd
```

### Paso 2: Empujar Migraciones a Supabase
```bash
supabase db push
```
Este comando aplicará la migración `create_banner_config_table.sql` a la BD remota.

### Paso 3: Regenerar Tipos TypeScript
```bash
supabase gen types typescript --project-ref yfvqxfqjxqbhwqzxkwkd > src/integrations/supabase/types.ts
```
O alternativamente:
```bash
supabase gen types typescript --linked > src/integrations/supabase/types.ts
```

### Paso 4: Verificar Migraciones Aplicadas
```bash
supabase migration list --linked
```

---

## ✅ Verificación

Después de ejecutar los comandos, verifica que:

1. ✅ La tabla `banner_config` existe en Supabase Dashboard
2. ✅ Los tipos en `src/integrations/supabase/types.ts` incluyen `banner_config`
3. ✅ No hay errores de TypeScript en `BannerManagementService.ts`

---

## 🔧 Alternativa: Supabase Dashboard SQL Editor

Si los comandos CLI no funcionan, puedes:

1. Ir a **Supabase Dashboard** → **SQL Editor**
2. Copiar el contenido de `supabase/migrations/create_banner_config_table.sql`
3. Ejecutar el SQL
4. Luego ejecutar solo el comando de regeneración de tipos:
   ```bash
   supabase gen types typescript --project-ref yfvqxfqjxqbhwqzxkwkd > src/integrations/supabase/types.ts
   ```

---

## 📝 Notas

- **Proyecto ID**: `yfvqxfqjxqbhwqzxkwkd`
- **Migración**: `create_banner_config_table.sql`
- **Tabla Nueva**: `banner_config`
- **Fecha**: 12 Dic 2025

---

## 🚀 Después de Alinear

Una vez completados estos pasos:

1. Los errores de tipo en `BannerManagementService.ts` desaparecerán
2. Podrás remover los casteos `as any` si lo deseas
3. El sistema de gestión de banners estará completamente funcional
