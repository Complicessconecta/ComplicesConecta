# ✅ CHECKLIST DE EJECUCIÓN - PLAN DE REHABILITACIÓN

**Fecha de inicio:** 14 de Diciembre, 2025  
**Duración estimada:** 3 semanas  
**Estado:** 📋 PENDIENTE DE EJECUCIÓN

---

## FASE 1: LIMPIEZA DE COMPONENTES UI (2-3 horas)

### Preparación
- [ ] Crear rama `feature/cleanup-ui-components`
- [ ] Crear carpeta `src/components/ui/_unused`
- [ ] Hacer backup de `src/components/ui/index.ts`

### Mover Componentes Zombies (44 archivos)
- [ ] AdaptiveBackground.tsx
- [ ] AnimatedCard.tsx
- [ ] AnimatedLoader.tsx
- [ ] AnimatedTabs.tsx
- [ ] FeatureCards.tsx
- [ ] GlassContainer.tsx
- [ ] ImageWithFallback.tsx
- [ ] InfoCard.tsx
- [ ] LazyImage.tsx
- [ ] LogoutButton.tsx
- [ ] MicroInteractions.tsx
- [ ] OptimizedImage.tsx
- [ ] ParticlesBackground.tsx
- [ ] RandomBackground.tsx
- [ ] ResponsiveGrid.tsx
- [ ] SkeletonComponents.tsx
- [ ] TermsModal.tsx
- [ ] UnifiedModal.tsx
- [ ] VisualHierarchy.tsx
- [ ] WhyChooseSection.tsx
- [ ] aspect-ratio.tsx
- [ ] calendar.tsx
- [ ] card-hover-effect.tsx
- [ ] carousel.tsx
- [ ] chart.tsx
- [ ] collapsible.tsx
- [ ] command.tsx
- [ ] compliance-signup-form.tsx
- [ ] context-menu.tsx
- [ ] drawer.tsx
- [ ] events-carousel.tsx
- [ ] file-upload.tsx
- [ ] form.tsx
- [ ] hover-card.tsx
- [ ] input-otp.tsx
- [ ] menubar.tsx
- [ ] navigation-menu.tsx
- [ ] pagination.tsx
- [ ] popover.tsx
- [ ] resizable.tsx
- [ ] sonner.tsx
- [ ] table.tsx
- [ ] toggle-group.tsx
- [ ] vip-booking-modal.tsx

### Actualizar Exports
- [ ] Remover exports de `src/components/ui/index.ts`
- [ ] Verificar que no hay imports rotos: `npm run lint`
- [ ] Ejecutar tests: `npm run test`

### Finalizar
- [ ] Commit: `refactor: move unused UI components to _unused folder`
- [ ] Push a rama feature
- [ ] Crear PR para revisión

---

## FASE 2.1: MIGRACIÓN DE TOKENS.TS (1-2 horas)

### Paso 1: Exportar TOKEN_CONFIG desde TokenService
- [ ] Abrir `src/services/TokenService.ts`
- [ ] Agregar export de `TOKEN_CONFIG` al inicio del archivo
- [ ] Verificar que está bien exportado

### Paso 2: Actualizar Imports
- [ ] `src/pages/TokensInfo.tsx`
  - [ ] Cambiar: `from '@/lib/tokens'` → `from '@/services/TokenService'`
  - [ ] Verificar que TOKEN_CONFIG se importa correctamente

- [ ] `src/lib/tokenPremium.ts`
  - [ ] Cambiar import de TOKEN_CONFIG
  - [ ] Verificar que funciona correctamente

### Paso 3: Sincronizar Edge Functions
- [ ] `supabase/functions/process-referral/index.ts`
  - [ ] Opción A: Importar TOKEN_CONFIG desde archivo compartido
  - [ ] Opción B: Mantener definición local (duplicada pero aislada)
  - [ ] Documentar decisión

### Paso 4: Eliminar Archivo Deprecated
- [ ] Eliminar `src/lib/tokens.ts`
- [ ] Verificar que no hay referencias rotas: `npm run lint`
- [ ] Ejecutar tests: `npm run test`

### Paso 5: Finalizar
- [ ] Commit: `refactor: migrate tokens.ts to TokenService - 14 Dec 2025`
- [ ] Push a rama feature
- [ ] Crear PR para revisión

---

## FASE 2.2: MIGRACIÓN DE SIMPLECHATSERVICE.TS (3-4 horas)

### Paso 1: Extender useRealtimeChat Hook
- [ ] Abrir `src/features/chat/useRealtimeChat.ts`
- [ ] Agregar método `getRooms(userId: string): Promise<SimpleChatRoom[]>`
  - [ ] Implementar lógica de `getUserChatRooms()` del servicio antiguo
  - [ ] Retornar salas públicas y privadas
  
- [ ] Agregar método `getHistory(roomId: string, limit?: number): Promise<SimpleChatMessage[]>`
  - [ ] Implementar lógica de `getRoomMessages()` del servicio antiguo
  - [ ] Incluir información de remitentes

- [ ] Exportar tipos `SimpleChatRoom` y `SimpleChatMessage`

### Paso 2: Refactorizar Chat.tsx
- [ ] Abrir `src/pages/Chat.tsx`
- [ ] Reemplazar import de `simpleChatService`
  - [ ] FROM: `import { simpleChatService } from '@/lib/simpleChatService'`
  - [ ] TO: `import { useRealtimeChat } from '@/features/chat/useRealtimeChat'`

- [ ] Reemplazar uso de servicio
  - [ ] `simpleChatService.getUserChatRooms()` → `getRooms(userId)`
  - [ ] `simpleChatService.getRoomMessages()` → `getHistory(roomId)`
  - [ ] `simpleChatService.sendMessage()` → método existente del hook
  - [ ] `simpleChatService.subscribeToRoomMessages()` → método existente del hook

- [ ] Verificar que la lógica funciona igual

### Paso 3: Actualizar Tests
- [ ] Abrir `src/tests/Chat.test.tsx`
- [ ] Reemplazar mocks de `simpleChatService`
- [ ] Usar mocks de `useRealtimeChat` en su lugar
- [ ] Ejecutar tests: `npm run test`

### Paso 4: Eliminar Archivo Deprecated
- [ ] Eliminar `src/lib/simpleChatService.ts`
- [ ] Verificar que no hay referencias rotas: `npm run lint`
- [ ] Ejecutar tests: `npm run test`

### Paso 5: Finalizar
- [ ] Commit: `refactor: migrate simpleChatService to useRealtimeChat - 14 Dec 2025`
- [ ] Push a rama feature
- [ ] Crear PR para revisión

---

## FASE 3: CORRECCIÓN DE LINT ERRORS (2-3 horas)

### Error 1: useVideoCall.ts - Exhaustive Dependencies
**Archivo:** `src/hooks/useVideoCall.ts` (línea 278-329)

- [ ] Abrir archivo
- [ ] Localizar función `endCall`
- [ ] Revisar dependencias de `useCallback`
- [ ] Corregir para incluir todas las variables usadas
- [ ] Ejecutar lint: `npm run lint`
- [ ] Verificar que error desaparece

### Error 2: usePerformanceOptimization.ts - useCallback Anti-pattern
**Archivo:** `src/hooks/usePerformanceOptimization.ts` (línea 121-127)

- [ ] Abrir archivo
- [ ] Localizar `useCallback` con arrow function anidada
- [ ] Refactorizar para usar función directa
- [ ] Ejecutar lint: `npm run lint`
- [ ] Verificar que error desaparece

### Error 3: useAdvancedAnalytics.ts - Impure Functions
**Archivo:** `src/hooks/useAdvancedAnalytics.ts` (línea 54)

- [ ] Abrir archivo
- [ ] Localizar `useRef` con `Date.now()` y `Math.random()`
- [ ] Mover inicialización a `useEffect`
- [ ] Ejecutar lint: `npm run lint`
- [ ] Verificar que error desaparece

### Error 4: usePerformanceOptimization.ts - Date.now()
**Archivo:** `src/hooks/usePerformanceOptimization.ts` (línea 40)

- [ ] Abrir archivo
- [ ] Localizar `useRef(Date.now())`
- [ ] Mover inicialización a `useEffect`
- [ ] Ejecutar lint: `npm run lint`
- [ ] Verificar que error desaparece

### Error 5: useBackgroundPreferences.ts - setState en Effect
**Archivo:** `src/hooks/useBackgroundPreferences.ts` (línea 78)

- [ ] Abrir archivo
- [ ] Localizar `setIsLoaded(true)` en efecto
- [ ] Envolver en `setTimeout` para hacerlo asincrónico
- [ ] Ejecutar lint: `npm run lint`
- [ ] Verificar que error desaparece

### Error 6: Chat.tsx - Unused Eslint Directive
**Archivo:** `src/pages/Chat.tsx` (línea 392)

- [ ] Abrir archivo
- [ ] Localizar `eslint-disable-next-line react-hooks/purity`
- [ ] Remover directiva (ya no hay problemas)
- [ ] Ejecutar lint: `npm run lint`
- [ ] Verificar que warning desaparece

### Finalizar Fase 3
- [ ] Ejecutar lint completo: `npm run lint`
- [ ] Verificar que todos los errores desaparecen
- [ ] Ejecutar tests: `npm run test`
- [ ] Commit: `fix: resolve React hooks linting errors - 14 Dec 2025`
- [ ] Push a rama feature
- [ ] Crear PR para revisión

---

## FASE 4: TESTING Y VALIDACIÓN (1-2 horas)

- [ ] Ejecutar suite completa de tests: `npm run test`
- [ ] Verificar que todos los tests pasan
- [ ] Ejecutar lint: `npm run lint`
- [ ] Verificar que no hay errores
- [ ] Hacer build: `npm run build`
- [ ] Verificar que build es exitoso
- [ ] Probar manualmente en navegador (dev server)
- [ ] Verificar que no hay errores en consola

---

## FASE 5: MERGE Y DEPLOYMENT

### Merge a Master
- [ ] Asegurar que master está actualizado
- [ ] Mergear rama feature a master
- [ ] Ejecutar tests en master
- [ ] Ejecutar lint en master
- [ ] Hacer build en master

### Deployment
- [ ] Verificar que Vercel detecta cambios
- [ ] Esperar a que build en Vercel sea exitoso
- [ ] Verificar que deployment es exitoso
- [ ] Hacer smoke tests en producción

### Documentación
- [ ] Actualizar CHANGELOG.md
- [ ] Actualizar README.md si es necesario
- [ ] Crear tag de versión: `v3.8.1-cleanup`
- [ ] Documentar cambios en RELEASE_NOTES

---

## NOTAS IMPORTANTES

### Seguridad
- ✅ NO ELIMINAR ARCHIVOS DEPRECATED AÚN
  - Mantener en carpeta `_unused` por 2 semanas
  - Permitir auditoría de seguridad
  - Facilitar rollback si es necesario

### Testing
- ✅ TESTS ANTES DE ELIMINAR
  - Cada eliminación debe ir precedida de tests verdes
  - Ejecutar tests después de cada cambio
  - Mantener cobertura > 90%

### Branching
- ✅ USAR RAMA FEATURE
  - Rama: `feature/cleanup-ui-components` (Fase 1)
  - Rama: `feature/migrate-deprecated-services` (Fase 2)
  - Rama: `feature/fix-lint-errors` (Fase 3)
  - O consolidar en una sola rama si es pequeño

### Backup
- ✅ BACKUP DE MASTER EXISTE
  - Rama: `backup/master-12dic2025-2230`
  - Usar para rollback si es necesario

---

## TIMELINE RECOMENDADO

### Semana 1 (Dic 14-20)
- **Lunes-Martes:** Fase 1 (Limpieza UI)
- **Miércoles-Jueves:** Fase 2.1 (Migración tokens.ts)
- **Viernes:** Fase 3 (Corrección lint errors)

### Semana 2 (Dic 21-27)
- **Lunes-Miércoles:** Fase 2.2 (Migración simpleChatService.ts)
- **Jueves-Viernes:** Fase 4 (Testing y validación)

### Semana 3 (Dic 28-31)
- **Lunes-Martes:** Fase 5 (Merge y deployment)
- **Miércoles-Viernes:** QA y monitoreo en producción

---

## MÉTRICAS DE ÉXITO

Al completar este plan:

| Métrica | Antes | Después | Meta |
|---------|-------|---------|------|
| Componentes UI Zombies | 44 | 0 | ✅ |
| Servicios Deprecated | 2 | 0 | ✅ |
| Lint Errors | 36 | 0 | ✅ |
| React Hooks Issues | 5 | 0 | ✅ |
| Tests Pasados | 261/282 | 261/282+ | ✅ |
| Build Success | ✅ | ✅ | ✅ |

---

## CONTACTOS Y ESCALACIÓN

Si encuentras problemas:

1. **Lint errors no se resuelven:** Revisar si hay dependencias circulares
2. **Tests fallan después de cambios:** Verificar que los mocks están actualizados
3. **Build falla:** Ejecutar `npm install` y `npm run build` nuevamente
4. **Merge conflicts:** Resolver manualmente o pedir ayuda

---

**Generado por:** Cascade AI - Lead Architect  
**Fecha:** 14 de Diciembre, 2025  
**Versión:** 1.0

---
