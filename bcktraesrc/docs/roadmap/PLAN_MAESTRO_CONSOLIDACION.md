# ­ƒÜÇ PLAN MAESTRO: Consolidaci├│n Visual y Funcional v3.8.0

Este documento es la fuente de verdad para la sincronizaci├│n entre Diagramas y C├│digo.

## ­ƒö┤ FASE 1: Cirug├¡a Visual "Profile Single" (Prioridad Inmediata)
**Objetivo:** Que `ProfileSingle.tsx` sea gemelo id├®ntico en UX/UI de `ProfileCouple.tsx`.

- [ ] **1.1 Estandarizaci├│n de Estructura**
    - [ ] Reemplazar contenedor principal por `PageWrapper` con padding id├®ntico al de Pareja.
    - [ ] Importar e integrar componente `ProfileNavigation` (Tabs: Fotos, Info, Intereses).
    - [ ] Implementar `ProfileStats` debajo del header (mismas m├®tricas, misma visual).

- [ ] **1.2 Reconstrucci├│n del Header (Identity)**
    - [ ] Crear/Adaptar `SingleProfileHeader` basado en `CoupleProfileHeader`.
    - [ ] Incluir: Avatar circular con borde ne├│n, ID de usuario visible (`@usuario`), Badge de Verificado/Premium, Bot├│n de Configuraci├│n (engranaje).

- [ ] **1.3 Integraci├│n de Billetera y Galer├¡a**
    - [ ] Insertar `TokenDashboard` (versi├│n compacta) dentro del tab "Billetera" o en el sidebar derecho, igual que en Pareja.
    - [ ] Reemplazar grid de fotos actual por el componente `Gallery` compartido (con soporte para Drag&Drop y modales).

- [ ] **1.4 Funcionalidad de Botones**
    - [ ] Verificar que "Editar Perfil" abra el modal `EditProfileSingle`.
    - [ ] Verificar que "Compartir" dispare la API nativa o copie el link.

## ­ƒƒá FASE 2: Reactivaci├│n de Flujos "Muertos" (Backend/Logic)
**Objetivo:** Conectar los cables cortados detectados en la auditor├¡a.

- [ ] **2.1 Sistema de Pagos (Stripe)**
    - [ ] Implementar l├│gica real en `supabase/functions/stripe-webhook`.
    - [ ] Manejar evento `checkout.session.completed`.
    - [ ] Insertar registro en tabla `transactions`.
    - [ ] Actualizar saldo en tabla `profiles` (columna `tokens_balance`).

- [ ] **2.2 Sistema de Check-in (Clubs)**
    - [ ] En `Clubs.tsx`, implementar `navigator.geolocation.getCurrentPosition`.
    - [ ] Calcular distancia real usando f├│rmula Haversine (o librer├¡a `geolib`).
    - [ ] Crear RPC o Edge Function `check_in_club` en Supabase para registrar la visita.

- [ ] **2.3 Rutas de Autenticaci├│n**
    - [ ] Definir ruta `/onboarding` en `App.tsx`.
    - [ ] Crear p├ígina `src/pages/Onboarding.tsx` que orqueste: Validaci├│n Tel├®fono -> Intereses -> Foto Inicial.

## ­ƒƒó FASE 3: Limpieza y Calidad (Housekeeping)
- [ ] **3.1 Barrel Exports**
    - [ ] Crear `src/components/profile/index.ts` para exportar componentes atomicos.
    - [ ] Actualizar `src/components/profiles/shared/index.ts` para evitar imports profundos.
- [ ] **3.2 Eliminaci├│n de C├│digo Muerto**
    - [ ] Borrar componentes viejos de `src/components/ui/` que ya no se usen tras la refactorizaci├│n de Single.

---
**Estado Actual:** Ô¼£ Fase 1 Pendiente
**├Ültima Auditor├¡a:** 22/12/2025 (Modo Dios)
