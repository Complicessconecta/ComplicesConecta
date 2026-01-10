# MAPA DE TIPOS (TYPES)

Este documento define la estructura de tipos TypeScript en el proyecto.

## 1. Tipos Globales (`src/types/`)
Definiciones generales utilizadas en toda la aplicación.

- **`index.ts`**: Punto de entrada principal.
- **`supabase.ts`**: Tipos generados automáticamente por Supabase (Database definitions).
- **`blockchain.ts`**: Tipos relacionados con Wallet, Tokens y NFTs.
- **`analytics.types.ts`**: Estructuras para eventos y métricas.
- **`security.types.ts`**: Tipos para servicios de seguridad y verificación.

## 2. Tipos de Entidades (`src/entities/`)
Modelos de dominio puro (DDD). Preferir estos tipos sobre interfaces ad-hoc.

*(Estructura pendiente de consolidación completa, actualmente en desarrollo)*

## 3. Convenciones
- **Sufijo `.types.ts`**: Para archivos que solo contienen definiciones de tipos.
- **Interfaces**: Prefijo `I` no obligatorio, pero usar `interface` sobre `type` para objetos extensibles.
- **Supabase**: Usar siempre `Database['public']['Tables']['TableName']['Row']` para tipos de base de datos, o los alias exportados en `src/types/supabase.ts`.

## 4. Estado de Archivos Supabase
Se han detectado múltiples versiones de tipos de Supabase. La versión canónica es:
- **`src/types/supabase.ts`** (Debe ser la fuente de verdad).

Los siguientes archivos son candidatos a deprecación/fusión:
- `supabase-generated.ts`
- `supabase-local.ts`
- `supabase-remote.ts`
