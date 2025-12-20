# Guía para Iniciar Supabase Local

## Error Actual
```
failed to connect to postgres: failed to connect to `host=127.0.0.1 user=postgres database=postgres`:
dial error (dial tcp 127.0.0.1:54322: connectex: No connection could be made because the target machine actively refused it.)
```

**Causa**: PostgreSQL no está corriendo en el puerto 54322. Supabase reporta estar "listo" pero la BD aún no está disponible.

---

## Solución: Iniciar Supabase Correctamente

### Paso 1: Verificar Docker Desktop
1. Abre **Docker Desktop**
2. Verifica que esté corriendo (deberías ver el ícono en la bandeja)
3. Si no está corriendo, inicia Docker Desktop

### Paso 2: Detener Supabase (si está corriendo)
```powershell
supabase stop
```

Espera a que termine completamente (5-10 segundos).

### Paso 3: Iniciar Supabase
```powershell
supabase start
```

**IMPORTANTE**: Espera a que veas este mensaje:
```
Started supabase local development server.

API URL: http://localhost:54321
GraphQL URL: http://localhost:54321/graphql/v1
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Inbucket URL: http://localhost:54324
```

### Paso 4: Verificar que PostgreSQL está listo
```powershell
supabase status
```

Deberías ver algo como:
```
PostgreSQL: running
Realtime: running
Storage: running
Auth: running
Vector: running
```

### Paso 5: Ejecutar la migración
Una vez que veas que PostgreSQL está corriendo:
```powershell
.\apply-migration.ps1
```

---

## Tiempo de Espera Esperado

- **Docker inicia**: 10-15 segundos
- **Supabase inicia**: 30-60 segundos
- **PostgreSQL está listo**: 60-90 segundos total

**Total esperado**: 2-3 minutos desde que ejecutas `supabase start`

---

## Solución de Problemas

### Si sigue fallando después de esperar:

```powershell
# Detener completamente
supabase stop

# Esperar 10 segundos
Start-Sleep -Seconds 10

# Iniciar nuevamente
supabase start

# Esperar 90 segundos
Start-Sleep -Seconds 90

# Verificar estado
supabase status

# Ejecutar migración
.\apply-migration.ps1
```

### Si Docker Desktop no responde:

1. Cierra Docker Desktop completamente
2. Abre Docker Desktop nuevamente
3. Espera a que esté completamente listo (2-3 minutos)
4. Luego ejecuta `supabase start`

---

## Verificación Manual de Conexión

Para verificar que PostgreSQL está realmente disponible:

```powershell
# Intenta conectarte a PostgreSQL
psql -h localhost -U postgres -d postgres -c "SELECT 1;"
```

Si ves `1`, PostgreSQL está listo.

---

## Próximos Pasos

Una vez que `supabase status` muestre que PostgreSQL está corriendo:

```powershell
.\apply-migration.ps1
```

El script:
1. Pedirá tu token de Supabase (opcional)
2. Esperará a que PostgreSQL esté listo
3. Aplicará la migración `banner_config`
4. Regenerará tipos TypeScript

---

**Fecha**: 12 Dic 2025  
**Versión**: v3.8.0
