# 📋 Problemas Pendientes - ComplicesConecta v3.9.2

**Fecha:** 21 de Enero, 2026
**Versión:** v3.9.2
**Estado:** Consolidación de problemas pendientes

---

## 🎯 Resumen Ejecutivo

Este documento consolida todos los problemas pendientes identificados en las auditorías previas que aún requieren solución. Los problemas ya resueltos han sido movidos a `docs-unified/auditorias/`.

**Total de Problemas Pendientes:** 15
**Prioridad Alta:** 5
**Prioridad Media:** 7
**Prioridad Baja:** 3

---

## 🚨 Prioridad Alta - Problemas Críticos

### 1. Lógica de Match Ausente - CRÍTICO
- **Fuente:** REPORTE_DISCREPANCIAS_FLUJOS.md
- **Descripción:** El flujo de "Match" es fundamental pero la lógica para crear un match no está implementada
- **Síntoma:** `handleLike` en `src/pages/Discover.tsx` solo emite un toast sin interactuar con backend
- **Solución Propuesta:**
  1. Crear `MatchService.ts` en `src/services/social/`
  2. Implementar `createLike(likerId, likedId)` que inserta en tabla `likes`
  3. Implementar `checkForMatch(likerId, likedId)` que verifica like mutuo
  4. Crear registro en tabla `matches` si hay like mutuo
  5. Modificar `handleLike` en Discover.tsx para usar MatchService
  6. Notificación de match en tiempo real a ambos usuarios
- **Impacto:** Alto - Rompe el flujo "Discover → Match → Chat"
- **Estado:** ⏳ Pendiente

### 2. Acceso a Chat sin Match Previo - CRÍTICO
- **Fuente:** REPORTE_DISCREPANCIAS_FLUJOS.md
- **Descripción:** Código permite iniciar chat directamente desde Discover sin match mutuo
- **Síntoma:** `handleMessage` en Discover.tsx navega directamente a `/chat/:profileId`
- **Solución Propuesta:**
  1. Proteger ruta en Chat.tsx o ProtectedRoute
  2. Verificar si existe registro en tabla `matches` antes de renderizar chat
  3. Deshabilitar botón de mensaje en Discover.tsx para perfiles sin match
- **Impacto:** Medio - Permite comunicación no solicitada
- **Estado:** ⏳ Pendiente

### 3. Funcionalidad de Galería Privada en Chat - CRÍTICO
- **Fuente:** REPORTE_DISCREPANCIAS_FLUJOS.md
- **Descripción:** Flujo de galería privada con pago CMPX no implementado en chat
- **Síntoma:** Chat.tsx no contiene UI ni lógica para solicitar pagos o desbloquear contenido
- **Solución Propuesta:**
  1. Crear componente de galería en Chat.tsx
  2. Integrar lógica de pago con tokens CMPX
  3. Crear servicio para gestionar permisos de acceso a galerías privadas
  4. Implementar blur CSS si no pagado
  5. Cobro 90% a creador
- **Impacto:** Alto - Mecánica principal de monetización
- **Estado:** ⏳ Pendiente

### 4. API Key de Pinata en Variables de Entorno - CRÍTICO
- **Fuente:** AUDITORIA_SEGURIDAD_SRC_v3_9_2.md
- **Descripción:** API key de Pinata expuesta en variables de entorno
- **Síntoma:** `src/services/payments/NFTService.ts:193` usa `import.meta.env.VITE_PINATA_JWT`
- **Solución Propuesta:**
  1. Implementar backend proxy para ocultar API key
  2. Implementar rotación de API keys
  3. Verificar que `.env` está en `.gitignore` (ya está)
- **Impacto:** Alto - Riesgo de uso no autorizado
- **Estado:** ⏳ Pendiente

### 5. Encoding UTF-8 Masivo - CRÍTICO
- **Fuente:** PLAN_CLIENTE_INVERSOR.md
- **Descripción:** 682 archivos con encoding corrupto
- **Síntoma:** "aos" → "años", "das" → "días", "autnticas" → "auténticas"
- **Solución Propuesta:**
  ```powershell
  Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts |
  ForEach-Object {
    $content = Get-Content $_.FullName -Raw -Encoding UTF8
    $content = $content -replace 'aos(?![a-zA-Z])', 'años'
    $content = $content -replace 'das(?![a-zA-Z])', 'días'
    $content = $content -replace 'autnticas', 'auténticas'
    $content = $content -replace 'relacin', 'relación'
    Set-Content $_.FullName -Value $content -Encoding UTF8
  }
  ```
- **Impacto:** Alto - Afecta legibilidad y profesionalismo
- **Estado:** ⏳ Pendiente

---

## ⚠️ Prioridad Media - Problemas Importantes

### 6. Nav Responsive - MEDIA
- **Fuente:** PLAN_CLIENTE_INVERSOR.md
- **Descripción:** Navegación no optimizada para móvil
- **Solución Propuesta:**
  1. Reducir altura del HeaderNav
  2. Hacer bottom nav más compacto
  3. Iconos sin texto en móvil
- **Impacto:** Medio - Afecta UX móvil
- **Estado:** ⏳ Pendiente

### 7. ThemeToggle Funcional - MEDIA
- **Fuente:** PLAN_CLIENTE_INVERSOR.md
- **Descripción:** Verificar implementación de cambio de tema
- **Solución Propuesta:**
  1. Verificar que luna/sol funcione correctamente
  2. Asegurar persistencia de tema
- **Impacto:** Medio - Afecta UX
- **Estado:** ⏳ Pendiente

### 8. Directorios Monolíticos - MEDIA
- **Fuente:** audit-report.md
- **Descripción:** `src/lib/` y `src/services/` son demasiado grandes
- **Solución Propuesta:**
  1. Refactor `src/lib/` en módulos (utils/, validation/, config/)
  2. Refactor `src/services/` en subcarpetas por dominio
- **Impacto:** Medio - Dificulta mantenibilidad
- **Estado:** ⏳ Pendiente

### 9. Archivos Huérfanos - MEDIA
- **Fuente:** audit-report.md
- **Descripción:** Archivos no usados en producción
- **Archivos:**
  - `src/EnvDebug.tsx` - Componente de debug huérfano
  - `src/pages/TokensInfoLazy.tsx` - Duplicado funcional
  - `src/pages/landing/index.tsx` - Landing alternativa huérfana
  - `src/lib/test-debugger.ts` - Utilidad de debug
- **Solución Propuesta:** Eliminar o documentar como herramientas de debug
- **Impacto:** Medio - Ruido en código
- **Estado:** ⏳ Pendiente

### 10. setInterval Sin Teardown Explícito - MEDIA
- **Fuente:** audit-report.md
- **Descripción:** Servicios usan setInterval sin cleanup explícito
- **Archivos:**
  - `src/services/auth/mfa/MFAService.ts` - Cleanup cada 5 min
  - `src/services/auth/security/SecurityMonitor.ts` - 2 intervalos globales
- **Solución Propuesta:** Exponer `startCleanupScheduler/stopCleanupScheduler`
- **Impacto:** Medio - Riesgo teórico en hot-reload
- **Estado:** ⏳ Pendiente

### 11. Botón/Flujo de Billetera y Creación de NFT - MEDIA
- **Fuente:** Eres_un_experto_en_desarrollo.md
- **Descripción:** Faltan botones/flujos en diagramas
- **Solución Propuesta:**
  1. Crear componente WalletButton.tsx
  2. Integrar con blockchain para mint NFT desde galería
  3. Actualizar diagramas Mermaid
- **Impacto:** Medio - Incompleto en diagramas
- **Estado:** ⏳ Pendiente

### 12. Tablas Faltantes en DB - MEDIA
- **Fuente:** Eres_un_experto_en_desarrollo.md
- **Descripción:** Faltan tablas/columnas en DB
- **Tablas:**
  - `likes` - Para lógica de match
  - `matches` - Para registro de matches
  - `couple_agreements` - Para acuerdos de parejas
  - `biometric_auth` - Para autenticación biométrica
- **Solución Propuesta:** Crear migraciones SQL para tablas faltantes
- **Impacto:** Medio - Bloquea implementación de features
- **Estado:** ⏳ Pendiente

---

## 📝 Prioridad Baja - Mejoras

### 13. Errores Tipográficos - BAJA
- **Fuente:** AUDITORIA_SEGURIDAD_SRC_v3_9_2.md
- **Descripción:** Errores tipográficos en mensajes de usuario
- **Estado:** ✅ SOLUCIONADO (17 Ene 2026)

### 14. Auditoría Periódica de Vistas - BAJA
- **Fuente:** AUDITORIA_SEGURIDAD_SUPABASE_v3_9_2.md
- **Descripción:** Revisar periódicamente vistas con SECURITY DEFINER
- **Solución Propuesta:** Implementar proceso de aprobación para cambios
- **Impacto:** Bajo - Mantenimiento preventivo
- **Estado:** ⏳ Pendiente

### 15. Consolidación de Tipos Supabase - BAJA
- **Fuente:** audit-report.md
- **Descripción:** Múltiples archivos con tipos similares
- **Solución Propuesta:** Generación automática centralizada
- **Impacto:** Bajo - Complejidad cognitiva
- **Estado:** ⏳ Pendiente

---

## ✅ Problemas Solucionados (Movidos a docs-unified/)

Los siguientes problemas han sido solucionados y sus archivos han sido movidos a `docs-unified/auditorias/`:

1. **Auditoría Estructural v3.9.2** - reporte-final-auditoria.md
   - ✅ Eliminados duplicados (AppLayout.tsx, ChatPrivacyService.ts)
   - ✅ Corregidos index.ts (auth/index.ts, lib/index.ts)
   - ✅ Creado index.ts faltante (clubs/index.ts)
   - ✅ Actualizado imports en ChatRoom.tsx

2. **Auditoría de Seguridad Supabase v3.9.2** - AUDITORIA_SEGURIDAD_SUPABASE_v3_9_2.md
   - ✅ 15 vistas SECURITY DEFINER cambiadas a SECURITY INVOKER
   - ✅ Verificación completada

3. **Auditoría de Seguridad SRC v3.9.2** - AUDITORIA_SEGURIDAD_SRC_v3_9_2.md
   - ✅ Credenciales demo hardcoded corregidas
   - ✅ Uso directo de localStorage reemplazado
   - ✅ Validación de email con Zod implementada
   - ✅ MFA implementado
   - ✅ Segregación de datos implementada
   - ✅ Principio de menor privilegio implementado

4. **Diagnóstico de Íconos y Visibilidad** - DIAGNOSTICO_ICONOS_Y_VISIBILIDAD.md
   - ✅ Quick Actions visibles en mobile
   - ✅ Stack global con fuentes emoji
   - ✅ Consolidación de Button re-export

5. **Eliminaciones Propuestas** - ELIMINACIONES_PROPUESTAS.md
   - ✅ ~25 errores TypeScript corregidos
   - ✅ Variables/funciones no usadas eliminadas
   - ✅ Errores de tipos corregidos

---

## 📊 Estadísticas

| Categoría | Total | Solucionados | Pendientes |
|-----------|-------|--------------|------------|
| Seguridad | 20 | 19 | 1 |
| Estructural | 8 | 8 | 0 |
| Funcionalidad | 7 | 0 | 7 |
| UX/UI | 3 | 3 | 0 |
| **TOTAL** | **38** | **30** | **8** |

---

## 🎯 Próximos Pasos Prioritarios

1. **Implementar lógica de Match** (Alta) - Core del flujo principal
2. **Implementar galería privada en Chat** (Alta) - Mecánica de monetización
3. **Fix encoding UTF-8 masivo** (Alta) - Profesionalismo
4. **Implementar backend proxy para API key de Pinata** (Alta) - Seguridad
5. **Crear tablas faltantes en DB** (Media) - Bloquea features

---

**Documento Generado:** 21 de Enero, 2026
**Versión del Proyecto:** v3.9.2
**Estado:** Consolidación de problemas pendientes
