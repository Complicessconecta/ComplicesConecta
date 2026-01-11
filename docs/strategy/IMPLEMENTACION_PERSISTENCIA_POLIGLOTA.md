# 🏗️ IMPLEMENTACIÓN: Persistencia Políglota

## Patrón Hydration + Sincronización Automática

**Fecha:** 10 de Diciembre de 2025  
**Estado:** Código para revisión (NO APLICADO AÚN)

---

## PASO 2: Método getMatchesV2 en SmartMatchingService.ts

### Descripción

Implementa el patrón **Hydration** para optimizar queries:

1. Neo4j retorna lista de `userIds` compatibles + scores
2. Supabase retorna datos completos de esos usuarios
3. Fusión en memoria

### Código a Insertar

**Ubicación:** `src/services/SmartMatchingService.ts` (después del método `findMatches`)

```typescript
/**
 * 🚀 NUEVO MÉTODO V2: Patrón Hydration (Persistencia Políglota)
 *
 * Optimización: Separa queries por BD
 * - Neo4j: Obtiene IDs compatibles + scores (grafo social)
 * - Supabase: Obtiene datos completos de usuarios (perfil)
 * - Memoria: Fusiona resultados
 *
 * Ventajas:
 * ✅ Neo4j solo consulta relaciones (su especialidad)
 * ✅ Supabase solo consulta perfiles (su especialidad)
 * ✅ Reduce redundancia de datos
 * ✅ Mejor rendimiento en ambas BD
 *
 * @deprecated findMatches() - Usar getMatchesV2() en nuevas features
 */
async getMatchesV2(
  userId: string,
  options: MatchSearchOptions = {}
): Promise<MatchSearchResult> {
  try {
    logger.info('🚀 [V2] Buscando matches con patrón Hydration', {
      userId: userId.substring(0, 8) + '***'
    });

    // ============================================
    // PASO 1: Obtener perfil del usuario actual
    // ============================================
    const userProfile = await this.getUserProfile(userId);
    if (!userProfile) {
      logger.warn('Perfil de usuario no encontrado', { userId });
      return this.emptyResult();
    }

    // ============================================
    // PASO 2: QUERY A NEO4J - Obtener IDs compatibles
    // ============================================
    // Neo4j retorna: [{ userId: "...", score: 75, socialScore: 10 }, ...]
    const compatibleUserIds: Array<{ userId: string; score: number; socialScore?: number }> = [];

    const isNeo4jEnabled = typeof import.meta !== 'undefined' && import.meta.env
      ? import.meta.env.VITE_NEO4J_ENABLED === 'true'
      : process.env.VITE_NEO4J_ENABLED === 'true';

    if (isNeo4jEnabled && neo4jService) {
      try {
        // Obtener amigos mutuos y conexiones sociales desde Neo4j
        const mutualConnections = await neo4jService.getMutualConnections(userId);

        // Convertir a formato esperado
        mutualConnections.forEach(conn => {
          compatibleUserIds.push({
            userId: conn.userId,
            score: 0, // Score base, se calcula en Supabase
            socialScore: conn.mutualCount * 5 // Bonus por amigos mutuos
          });
        });

        logger.info('📊 Neo4j: Conexiones sociales encontradas', {
          count: compatibleUserIds.length
        });
      } catch (error) {
        logger.warn('⚠️ Error consultando Neo4j, continuando con Supabase solo', { error });
        // Continuar sin Neo4j si falla
      }
    }

    // ============================================
    // PASO 3: QUERY A SUPABASE - Obtener datos completos
    // ============================================
    let candidates: any[] = [];

    if (compatibleUserIds.length > 0) {
      // Opción A: Usar IDs de Neo4j
      const userIds = compatibleUserIds.map(c => c.userId);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds)
        .eq('is_public', true);

      if (error) {
        logger.error('Error obteniendo perfiles de Neo4j IDs:', error);
        candidates = [];
      } else {
        candidates = data || [];
      }

      logger.info('📦 Supabase: Perfiles obtenidos', { count: candidates.length });
    } else {
      // Opción B: Fallback a búsqueda completa en Supabase
      logger.info('⏭️ Neo4j deshabilitado o sin resultados, usando búsqueda Supabase completa');
      candidates = await this.getCandidates(userId, options);
    }

    // ============================================
    // PASO 4: FUSIÓN EN MEMORIA - Combinar datos
    // ============================================
    const userProfiles = candidates
      .map(c => this.mapToUserProfile(c))
      .filter(Boolean) as UserProfile[];

    // Calcular scores de compatibilidad
    const matches = smartMatchingEngine.findBestMatches(
      userProfile,
      userProfiles,
      options.limit || 20,
      options.context
    );

    // Enriquecer con social scores de Neo4j
    const enrichedMatches = matches.map(match => {
      const neoData = compatibleUserIds.find(c => c.userId === match.userId);
      return {
        ...match,
        socialScore: (neoData?.socialScore || 0),
        totalScore: match.totalScore + (neoData?.socialScore || 0)
      };
    });

    // ============================================
    // PASO 5: FILTRADO Y ORDENAMIENTO
    // ============================================
    const minScore = options.filters?.minScore || 30;
    const filteredMatches = enrichedMatches.filter(m => m.totalScore >= minScore);

    // Ordenar por score total (compatibilidad + social)
    filteredMatches.sort((a, b) => b.totalScore - a.totalScore);

    // ============================================
    // PASO 6: ESTADÍSTICAS
    // ============================================
    const stats = {
      totalCandidates: candidates.length,
      matchesFound: filteredMatches.length,
      averageScore: filteredMatches.length > 0
        ? Math.round(filteredMatches.reduce((sum, m) => sum + m.totalScore, 0) / filteredMatches.length)
        : 0,
      highQualityMatches: filteredMatches.filter(m => m.totalScore >= 70).length
    };

    logger.info('✅ [V2] Matches encontrados', {
      userId: userId.substring(0, 8) + '***',
      total: filteredMatches.length,
      avgScore: stats.averageScore,
      neo4jEnabled: isNeo4jEnabled
    });

    return {
      matches: filteredMatches,
      total: filteredMatches.length,
      stats
    };
  } catch (error) {
    logger.error('❌ [V2] Error en getMatchesV2:', {
      error: error instanceof Error ? error.message : String(error),
      userId: userId.substring(0, 8) + '***'
    });
    return this.emptyResult();
  }
}
```

---

## PASO 3: Correcciones en Neo4jService.ts

### 3.1 SEGURIDAD CRÍTICA: Eliminar Contraseña Hardcodeada

**Ubicación:** `src/services/graph/Neo4jService.ts` (Línea 79-85)

**ANTES:**

```typescript
constructor() {
  this.config = {
    uri: getViteEnv('NEO4J_URI') || 'bolt://localhost:7687',
    user: getViteEnv('NEO4J_USER') || 'neo4j',
    password: getViteEnv('NEO4J_PASSWORD') || 'complices2025',  // ⚠️ CRÍTICO
    database: getViteEnv('NEO4J_DATABASE') || 'neo4j',
  };
  // ...
}
```

**DESPUÉS:**

```typescript
constructor() {
  // Validar que todas las variables requeridas estén configuradas
  const neo4jUri = getViteEnv('NEO4J_URI');
  const neo4jUser = getViteEnv('NEO4J_USER');
  const neo4jPassword = getViteEnv('NEO4J_PASSWORD');
  const neo4jDatabase = getViteEnv('NEO4J_DATABASE');

  // En desarrollo, permitir valores por defecto (pero no contraseña)
  if (import.meta.env.DEV) {
    if (!neo4jPassword) {
      logger.warn('⚠️ NEO4J_PASSWORD no configurado. Neo4j estará deshabilitado en desarrollo.');
    }
  } else {
    // En producción, REQUERIR todas las variables
    if (!neo4jUri || !neo4jUser || !neo4jPassword || !neo4jDatabase) {
      throw new Error(
        '❌ CRÍTICO: Configuración de Neo4j incompleta en producción. ' +
        'Requerido: NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD, NEO4J_DATABASE'
      );
    }
  }

  this.config = {
    uri: neo4jUri || 'bolt://localhost:7687',
    user: neo4jUser || 'neo4j',
    password: neo4jPassword || '', // Vacío en desarrollo si no está configurado
    database: neo4jDatabase || 'neo4j',
  };

  this.isEnabled = getViteEnv('NEO4J_ENABLED') === 'true' && !!neo4jPassword;

  if (this.isEnabled && (typeof import.meta !== 'undefined' && import.meta.env)) {
    this.initializeDriver();
  }
}
```

### 3.2 DEPRECACIÓN: Marcar Métodos que Escriben Datos Pesados

**Ubicación:** `src/services/graph/Neo4jService.ts` (Métodos que guardan bio/fotos)

**Cambios:**

```typescript
/**
 * @deprecated Usar webhook de Supabase → Edge Function en su lugar
 *
 * Este método escribía datos pesados (bio, fotos) en Neo4j.
 * Ahora esa responsabilidad es de la Edge Function sync-neo4j.
 *
 * Neo4j solo debe almacenar:
 * ✅ Nodos de usuario (userId, gender, age, location)
 * ✅ Relaciones (MATCHED_WITH, LIKED, FOLLOWS, BLOCKED)
 *
 * ❌ NO almacenar:
 * - Bio/descripción
 * - URLs de fotos
 * - Nombres completos
 * - Otros datos pesados
 */
async createUser(userId: string, metadata: Partial<UserNode> = {}): Promise<void> {
  // ... código existente ...

  // ⚠️ IMPORTANTE: Solo guardar metadata mínima
  const flatMetadata: Record<string, unknown> = {
    id: userId,
  };

  // ✅ PERMITIDO: Datos mínimos
  if (metadata.metadata) {
    if (metadata.metadata.age !== undefined) flatMetadata.age = metadata.metadata.age;
    if (metadata.metadata.location) flatMetadata.location = metadata.metadata.location;
    if (metadata.metadata.gender) flatMetadata.gender = metadata.metadata.gender;
  }

  // ❌ PROHIBIDO: Datos pesados (ahora responsabilidad del webhook)
  // if (metadata.name) flatMetadata.name = metadata.name;  // Usar Supabase
  // if (metadata.bio) flatMetadata.bio = metadata.bio;      // Usar Supabase

  // ... resto del código ...
}
```

---

## 📊 Resumen de Cambios

| Paso | Archivo                                  | Cambio                             | Impacto                       |
| ---- | ---------------------------------------- | ---------------------------------- | ----------------------------- |
| 1    | `supabase/functions/sync-neo4j/index.ts` | ✅ Webhook automático              | Sincronización automática     |
| 2    | `src/services/SmartMatchingService.ts`   | ✅ Nuevo método `getMatchesV2()`   | Patrón Hydration              |
| 3a   | `src/services/graph/Neo4jService.ts`     | ✅ Eliminar contraseña hardcodeada | Seguridad crítica             |
| 3b   | `src/services/graph/Neo4jService.ts`     | ✅ Marcar métodos como @deprecated | Claridad de responsabilidades |

---

## 🔄 Flujo de Sincronización (Después de Implementar)

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO ACTUALIZA PERFIL                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │   Supabase (PostgreSQL)        │
        │   Tabla: profiles              │
        │   - bio, fotos, nombres        │
        │   - gender, age, location      │
        └────────────┬───────────────────┘
                     │
                     │ Webhook (INSERT/UPDATE)
                     ▼
        ┌────────────────────────────────┐
        │   Edge Function: sync-neo4j    │
        │   - Extrae datos mínimos       │
        │   - Sincroniza a Neo4j         │
        └────────────┬───────────────────┘
                     │
                     ▼
        ┌────────────────────────────────┐
        │   Neo4j (Graph DB)             │
        │   Nodo: User                   │
        │   - userId, gender, age, loc   │
        │   - Relaciones (MATCHED_WITH)  │
        └────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              USUARIO BUSCA MATCHES (getMatchesV2)            │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
   Neo4j Query                    Supabase Query
   - Amigos mutuos                - Perfiles completos
   - Relaciones sociales          - Datos pesados
   - Social scores                - Filtros avanzados
        │                                 │
        └────────────────┬────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │   Fusión en Memoria            │
        │   - Combinar datos             │
        │   - Calcular scores totales    │
        │   - Ordenar resultados         │
        └────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │   Retornar Matches             │
        │   - Perfiles completos         │
        │   - Scores de compatibilidad   │
        │   - Scores sociales            │
        └────────────────────────────────┘
```

---

## ✅ Checklist de Implementación

- [ ] **PASO 1:** Reemplazar `supabase/functions/sync-neo4j/index.ts` (YA HECHO)
- [ ] **PASO 2:** Agregar método `getMatchesV2()` a `SmartMatchingService.ts`
- [ ] **PASO 3a:** Eliminar contraseña hardcodeada en `Neo4jService.ts`
- [ ] **PASO 3b:** Marcar métodos como `@deprecated` en `Neo4jService.ts`
- [ ] Crear Webhook en Supabase Dashboard (tabla `profiles` → Edge Function)
- [ ] Probar sincronización automática
- [ ] Actualizar imports en componentes para usar `getMatchesV2()`
- [ ] Verificar que no hay datos redundantes en Neo4j
- [ ] Ejecutar tests de matching
- [ ] Commit y push

---

## 🚀 Próximos Pasos

1. **Revisión de código:** Verificar que el código es correcto
2. **Aplicar cambios:** Editar archivos según especificaciones
3. **Configurar Webhook:** En Supabase Dashboard
4. **Testing:** Verificar sincronización automática
5. **Monitoreo:** Verificar logs de Edge Function

---

**Generado por:** Cascade AI - Arquitecto de Backend y Seguridad  
**Fecha:** 10 de Diciembre de 2025 - 22:45 UTC-6  
**Estado:** CÓDIGO PARA REVISIÓN ✅
