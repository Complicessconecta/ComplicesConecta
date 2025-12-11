# 🚀 PLAN DE MIGRACIÓN SEGURA - SCHEMA MAESTRO A SUPABASE

**Fecha:** 9 Diciembre 2025  
**Rama:** integrate/lab-selective-safe  
**Objetivo:** Ejecutar schema maestro consolidado en Supabase de forma segura  
**Estado:** 📋 PLANIFICACIÓN

---

## 📊 FASES DE MIGRACIÓN

### FASE 1: PRE-MIGRACIÓN (VALIDACIÓN)
**Duración:** 10 minutos  
**Objetivo:** Verificar que todo está listo

- [ ] Verificar conexión a Supabase
- [ ] Validar que schema maestro es idempotente
- [ ] Crear backup de base de datos actual en Supabase
- [ ] Verificar que no hay migraciones pendientes

**Comandos:**
```bash
# Verificar estado de Supabase
supabase status

# Crear backup
supabase db pull

# Ver migraciones pendientes
supabase migration list
```

---

### FASE 2: EJECUCIÓN DE MIGRACIONES (APLICAR SCHEMA)
**Duración:** 5-10 minutos  
**Objetivo:** Aplicar el schema maestro consolidado

- [ ] Ejecutar migraciones
- [ ] Monitorear logs de ejecución
- [ ] Verificar que todas las tablas se crearon

**Comandos:**
```bash
# Ejecutar migraciones
supabase migration up

# O ejecutar manualmente en Supabase SQL Editor:
# Copiar contenido de: 20251209_SCHEMA_MAESTRO_CONSOLIDADO.sql
# Pegar en: Supabase Dashboard > SQL Editor > Ejecutar
```

---

### FASE 3: VALIDACIÓN POST-MIGRACIÓN
**Duración:** 10 minutos  
**Objetivo:** Verificar que todo se creó correctamente

- [ ] Verificar que existen 54 tablas
- [ ] Verificar que RLS está habilitado
- [ ] Verificar que índices se crearon
- [ ] Verificar que funciones y triggers existen

**Validaciones SQL:**
```sql
-- Contar tablas
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verificar RLS
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Verificar índices
SELECT COUNT(*) FROM pg_indexes 
WHERE schemaname = 'public';

-- Verificar funciones
SELECT COUNT(*) FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
```

---

### FASE 4: REGENERAR TIPOS TYPESCRIPT
**Duración:** 5 minutos  
**Objetivo:** Actualizar tipos TypeScript con nuevo schema

- [ ] Regenerar tipos desde Supabase
- [ ] Verificar que no hay errores de tipos
- [ ] Actualizar imports si es necesario

**Comandos:**
```bash
# Regenerar tipos
supabase gen types typescript --linked > src/types/supabase-generated.ts

# Validar TypeScript
npx tsc --noEmit --skipLibCheck

# Validar ESLint
npm run lint
```

---

### FASE 5: VALIDAR BUILD
**Duración:** 30 segundos  
**Objetivo:** Verificar que la aplicación compila

- [ ] Ejecutar build
- [ ] Verificar que no hay errores
- [ ] Verificar que bundle size es aceptable

**Comandos:**
```bash
# Build
npm run build

# Verificar tamaño
ls -lh dist/
```

---

### FASE 6: EJECUTAR TESTS
**Duración:** 5-10 minutos  
**Objetivo:** Verificar que tests pasan

- [ ] Ejecutar tests unitarios
- [ ] Ejecutar tests E2E
- [ ] Verificar que no hay fallos

**Comandos:**
```bash
# Tests unitarios
npm run test

# Tests E2E
npm run test:e2e

# Coverage
npm run test:coverage
```

---

### FASE 7: COMMIT Y PUSH
**Duración:** 2 minutos  
**Objetivo:** Guardar cambios en git

- [ ] Hacer commit de tipos regenerados
- [ ] Hacer push a rama de pruebas
- [ ] Crear pull request a master (opcional)

**Comandos:**
```bash
# Commit
git add src/types/supabase-generated.ts
git commit -m "feat: Regenerar tipos TypeScript con schema maestro"

# Push
git push origin integrate/lab-selective-safe
```

---

## ⚠️ ROLLBACK PLAN (SI ALGO FALLA)

Si algo falla durante la migración:

1. **Opción A: Restaurar desde backup**
   ```bash
   # Restaurar base de datos
   supabase db push --dry-run
   supabase db reset
   ```

2. **Opción B: Revertir migraciones**
   ```bash
   # Ver migraciones aplicadas
   supabase migration list
   
   # Revertir última migración
   supabase migration down
   ```

3. **Opción C: Restaurar desde backup de Supabase**
   - Ir a Supabase Dashboard
   - Database > Backups
   - Restaurar backup anterior

---

## 🎯 CHECKLIST DE MIGRACIÓN

### Pre-Migración
- [ ] Backup de base de datos actual
- [ ] Verificar conexión a Supabase
- [ ] Revisar schema maestro (idempotencia)
- [ ] Comunicar cambios al equipo

### Migración
- [ ] Ejecutar schema maestro
- [ ] Monitorear logs
- [ ] Verificar tablas creadas
- [ ] Verificar RLS habilitado

### Post-Migración
- [ ] Regenerar tipos TypeScript
- [ ] Validar TypeScript sin errores
- [ ] Ejecutar build
- [ ] Ejecutar tests
- [ ] Hacer commit y push

### Validación Final
- [ ] Aplicación compila sin errores
- [ ] Tests pasan
- [ ] Tipos TypeScript correctos
- [ ] RLS funciona correctamente

---

## 📈 MÉTRICAS DE ÉXITO

| Métrica | Esperado | Actual |
|---------|----------|--------|
| Tablas creadas | 54 | ⏳ |
| RLS habilitado | 100% | ⏳ |
| Índices creados | 50+ | ⏳ |
| Errores TypeScript | 0 | ⏳ |
| Build exitoso | ✅ | ⏳ |
| Tests pasando | ✅ | ⏳ |

---

## 🔄 TIMELINE ESTIMADO

| Fase | Duración | Acumulado |
|------|----------|-----------|
| 1. Pre-migración | 10 min | 10 min |
| 2. Ejecución | 5-10 min | 15-20 min |
| 3. Validación | 10 min | 25-30 min |
| 4. Tipos TypeScript | 5 min | 30-35 min |
| 5. Build | 1 min | 31-36 min |
| 6. Tests | 5-10 min | 36-46 min |
| 7. Commit/Push | 2 min | 38-48 min |
| **TOTAL** | | **~45 minutos** |

---

## 📝 NOTAS IMPORTANTES

1. **Idempotencia:** El schema maestro es 100% idempotente. Puede ejecutarse múltiples veces sin problemas.

2. **RLS:** Todas las tablas tienen RLS habilitado. Verificar que las políticas son correctas.

3. **Backup:** Siempre hacer backup antes de ejecutar migraciones.

4. **Rollback:** Si algo falla, usar el plan de rollback anterior.

5. **Comunicación:** Informar al equipo sobre cambios en el schema.

---

**Estado:** 📋 LISTO PARA EJECUTAR  
**Próximo paso:** Ejecutar FASE 1 (Pre-migración)

---

## 🚀 CÓMO EJECUTAR

1. Leer este plan completo
2. Ejecutar cada fase en orden
3. Verificar checklist después de cada fase
4. Si algo falla, usar rollback plan
5. Documentar cualquier problema encontrado

---

**Creado por:** Cascade AI  
**Rama:** integrate/lab-selective-safe  
**Fecha:** 9 Diciembre 2025
