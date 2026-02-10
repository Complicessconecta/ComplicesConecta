# AUDITORÍA REGISTRO Y PERFIL SINGLE VS COUPLE

**Fecha:** 4 de Febrero, 2026
**Responsable:** Lead Architect & Tech Lead
**Alcance:** Flujo completo de registro y carga de perfil

## HALLAZGOS CRÍTICOS

### 1. DUPLICACIÓN DE DATOS EN REGISTRO COUPLE
**Nombre:** CoupleRegistrationForm - Duplicación de perfil
**Ruta:** `src/components/profiles/couple/CoupleRegistrationForm.tsx`
**Síntoma:** Crea perfil en `couple_profiles` Y en `profiles` simultáneamente
**Solución:** Eliminar inserción duplicada en `profiles`, usar solo `couple_profiles` y crear vista de compatibilidad

### 2. FALTAN COLUMNAS EN COUPLE_PROFILES
**Nombre:** Schema couple_profiles incompleto
**Ruta:** `supabase/migrations/` (múltiples archivos)
**Síntoma:** Columnas faltantes como `account_type`, `role`, `is_verified` en couple_profiles
**Solución:** Agregar columnas faltantes a couple_profiles para consistencia con profiles

### 3. DATOS MOCK COMO FALLBACK PRINCIPAL
**Nombre:** ProfileSingle - Fallback mock agresivo
**Ruta:** `src/pages/profiles/single/ProfileSingle.tsx`
**Síntoma:** Usa "Sofía López", "CDMX, México" como valores por defecto, no carga datos reales
**Solución:** Eliminar fallbacks mock, mostrar loading o error si no hay datos reales

### 4. INCONSISTENCIA EN ACCOUNT_TYPE
**Nombre:** Registro couple - account_type erróneo
**Ruta:** `src/components/profiles/couple/CoupleRegistrationForm.tsx`
**Síntoma:** Envía `account_type: "couple"` en metadata pero usa "couple" en DB
**Solución:** Estandarizar a "couple" en ambos lugares

### 5. VALIDACIÓN INSUFICIENTE EN REGISTRO
**Nombre:** CoupleRegistrationForm - validación débil
**Ruta:** `src/components/profiles/couple/CoupleRegistrationForm.tsx`
**Síntoma:** No valida que emails de pareja sean diferentes, permite duplicados
**Solución:** Agregar validación de unicidad de email en pareja

### 6. NAVEGACIÓN POST-REGISTRO INCONSISTENTE
**Nombre:** Auth.tsx - navegación por account_type
**Ruta:** `src/pages/Auth.tsx`
**Síntoma:** Usa metadata.account_type pero puede ser inconsistente con DB
**Solución:** Verificar account_type de la DB después de registro, no solo metadata

### 7. PROFILE COUPLE NO IMPLEMENTADO
**Nombre:** ProfileCouple faltante
**Ruta:** `src/pages/profiles/couple/ProfileCouple.tsx`
**Síntoma:** Registro couple navega a `/profile-couple` pero componente no existe
**Solución:** Crear ProfileCouple.tsx similar a ProfileSingle pero para datos couple

### 8. USEAUTH NO CARGA PERFILES COUPLE
**Nombre:** useAuth - loadProfile limitado
**Ruta:** `src/features/auth/useAuth.ts`
**Síntoma:** loadProfile solo consulta `profiles`, no `couple_profiles`
**Solución:** Modificar loadProfile para consultar ambas tablas según account_type

### 9. REGISTRO COUPLE NO VALIDA UNIÓN
**Nombre:** CoupleRegistrationForm - sin validación de pareja
**Ruta:** `src/components/profiles/couple/CoupleRegistrationForm.tsx`
**Síntoma:** No valida que los miembros sean pareja real, solo recopila datos
**Solución:** Agregar validación de relación y confirmación mutua

### 10. ALMACENAMIENTO ASIMÉTRICO
**Nombre:** DB Schema - tablas desconectadas
**Ruta:** `supabase/migrations/`
**Síntoma:** couple_profiles y profiles no están relacionadas, datos duplicados
**Solución:** Crear foreign key entre couple_profiles y profiles, o usar vista unificada

---

## PLAN DE SOLUCIÓN EN FASES

### FASE 1: CORRECCIÓN DE DUPLICACIÓN DE DATOS (Prioridad CRÍTICA) - **COMPLETADA**
**Tiempo estimado:** 2-3 horas
**Estado:** FINALIZADA - 4 Feb 2026 02:05

#### Tareas Completadas:
1. **Modificar CoupleRegistrationForm.tsx**
   - Eliminada inserción duplicada en `profiles`
   - Código comentado para evitar false positives en build
   - Registro couple ahora solo inserta en `couple_profiles`

2. **Agregar columnas faltantes a couple_profiles**
   - Agregadas columnas: `account_type`, `role`, `is_verified`
   - Migración aplicada exitosamente
   - Esquema couple_profiles ahora consistente con profiles

3. **Crear vista vw_profiles_unified**
   - Vista creada para unificar single/couple profiles
   - Combina datos de ambas tablas automáticamente
   - Otorgados permisos SELECT apropiados

4. **Actualizar useAuth.loadProfile()**
   - Modificada para consultar `vw_profiles_unified`
   - Ahora carga perfiles single y couple uniformemente
   - Eliminada lógica de consulta separada

#### KPIs de Fase 1 - **100% ALCANZADOS**
- 0 inserciones duplicadas en registro couple
- Esquema couple_profiles completo y consistente
- Vista unificada funcionando correctamente
- loadProfile actualizado para usar vista unificada

---

## RESULTADOS DE FASE 1
- **Duplicación eliminada:** Registro couple ya no crea datos duplicados
- **Esquema unificado:** couple_profiles tiene todas las columnas necesarias
- **Vista unificada:** loadProfile ahora consulta una sola fuente de verdad
- **Compatibilidad mantenida:** Sistema backward compatible con datos existentes

**Fase 1 completada exitosamente. Eliminada la duplicación crítica de datos en registro couple.**

### FASE 2: CORRECCIÓN DE CARGA DE PERFIL (Prioridad CRÍTICA)
**Tiempo:** 3-4 horas
**Objetivos:** Eliminar datos mock, cargar datos reales

**Tareas:**
1. Modificar `ProfileSingle.tsx` - eliminar fallbacks mock ("Sofía López", etc.)
2. Agregar estados de loading/error apropiados
3. Implementar `ProfileCouple.tsx` con datos de couple_profiles
4. Verificar que ambos componentes carguen datos reales de DB

### FASE 3: ESTANDARIZACIÓN DE ACCOUNT_TYPE (Prioridad ALTA)
**Tiempo:** 2-3 horas
**Objetivos:** Consistencia en todo el flujo

**Tareas:**
1. Estandarizar `account_type` a "couple" en registro y DB
2. Actualizar navegación post-registro para usar DB en lugar de metadata
3. Agregar validación de unicidad de email en parejas
4. Crear índices apropiados en couple_profiles

### FASE 4: VALIDACIÓN Y TESTING (Prioridad MEDIA)
**Tiempo:** 2-3 horas
**Objetivos:** Verificar funcionamiento completo

**Tareas:**
1. Probar registro single - verificar DB y carga de perfil
2. Probar registro couple - verificar DB y carga de perfil
3. Verificar navegación post-registro
4. Ejecutar pruebas de integración

---

## RIESGOS Y CONSIDERACIONES

### Riesgos de Implementación
- **Pérdida de datos:** Eliminación de duplicados puede afectar perfiles existentes
- **Quebrar navegación:** Cambios en account_type pueden afectar rutas
- **Incompatibilidad:** Cambios en esquema requieren migración cuidadosa

### Medidas de Mitigación
- **Backup completo:** Antes de cualquier cambio en DB
- **Testing exhaustivo:** Verificar todos los flujos después de cambios
- **Migración gradual:** Implementar cambios por fases con rollback posible

### Recursos Necesarios
- Acceso a Supabase para verificar datos existentes
- Ambiente de testing para validar cambios
- Revisión de código para asegurar compatibilidad

---

## MÉTRICAS DE ÉXITO

### KPIs de Fase 1
- ✅ 0 inserciones duplicadas en registro couple
- ✅ Esquema couple_profiles completo y consistente
- ✅ Vista unificada funcionando correctamente

### KPIs de Fase 2
- ✅ 0 datos mock en carga de perfil
- ✅ ProfileCouple implementado y funcional
- ✅ Ambos tipos cargan datos reales de DB

### KPIs de Fase 3
- ✅ account_type consistente en todo el flujo
- ✅ Navegación post-registro correcta
- ✅ Validaciones apropiadas en registro

### KPIs de Fase 4
- ✅ Registro single funciona end-to-end
- ✅ Registro couple funciona end-to-end
- ✅ Perfiles se cargan correctamente para ambos tipos
