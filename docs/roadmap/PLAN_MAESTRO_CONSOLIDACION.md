# 🚀 PLAN MAESTRO: Consolidación Visual y Funcional v3.8.0

Este documento es la fuente de verdad para la sincronización entre Diagramas y Código.

## 🔴 FASE 1: Cirugía Visual "Profile Single" (Prioridad Inmediata)
**Objetivo:** Que `ProfileSingle.tsx` sea gemelo idéntico en UX/UI de `ProfileCouple.tsx`.

- [ ] **1.1 Estandarización de Estructura**
    - [ ] Reemplazar contenedor principal por `PageWrapper` con padding idéntico al de Pareja.
    - [ ] Importar e integrar componente `ProfileNavigation` (Tabs: Fotos, Info, Intereses).
    - [ ] Implementar `ProfileStats` debajo del header (mismas métricas, misma visual).

- [ ] **1.2 Reconstrucción del Header (Identity)**
    - [ ] Crear/Adaptar `SingleProfileHeader` basado en `CoupleProfileHeader`.
    - [ ] Incluir: Avatar circular con borde neón, ID de usuario visible (`@usuario`), Badge de Verificado/Premium, Botón de Configuración (engranaje).

- [ ] **1.3 Integración de Billetera y Galería**
    - [ ] Insertar `TokenDashboard` (versión compacta) dentro del tab "Billetera" o en el sidebar derecho, igual que en Pareja.
    - [ ] Reemplazar grid de fotos actual por el componente `Gallery` compartido (con soporte para Drag&Drop y modales).

- [ ] **1.4 Funcionalidad de Botones**
    - [ ] Verificar que "Editar Perfil" abra el modal `EditProfileSingle`.
    - [ ] Verificar que "Compartir" dispare la API nativa o copie el link.

## 🟠 FASE 2: Reactivación de Flujos "Muertos" (Backend/Logic)
**Objetivo:** Conectar los cables cortados detectados en la auditoría.

- [ ] **2.1 Sistema de Pagos (Stripe)**
    - [ ] Implementar lógica real en `supabase/functions/stripe-webhook`.
    - [ ] Manejar evento `checkout.session.completed`.
    - [ ] Insertar registro en tabla `transactions`.
    - [ ] Actualizar saldo en tabla `profiles` (columna `tokens_balance`).

- [ ] **2.2 Sistema de Check-in (Clubs)**
    - [ ] En `Clubs.tsx`, implementar `navigator.geolocation.getCurrentPosition`.
    - [ ] Calcular distancia real usando fórmula Haversine (o librería `geolib`).
    - [ ] Crear RPC o Edge Function `check_in_club` en Supabase para registrar la visita.

- [ ] **2.3 Rutas de Autenticación**
    - [ ] Definir ruta `/onboarding` en `App.tsx`.
    - [ ] Crear página `src/pages/Onboarding.tsx` que orqueste: Validación Teléfono -> Intereses -> Foto Inicial.

## 🟢 FASE 3: Limpieza y Calidad (Housekeeping)
- [ ] **3.1 Barrel Exports**
    - [ ] Crear `src/components/profile/index.ts` para exportar componentes atomicos.
    - [ ] Actualizar `src/components/profiles/shared/index.ts` para evitar imports profundos.
- [ ] **3.2 Eliminación de Código Muerto**
    - [ ] Borrar componentes viejos de `src/components/ui/` que ya no se usen tras la refactorización de Single.

---
**Estado Actual:** ⬜ Fase 1 Pendiente
**Última Auditoría:** 22/12/2025 (Modo Dios)