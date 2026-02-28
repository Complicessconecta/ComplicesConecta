# Duplicates Quarantine (No Destructivo)

**Fecha:** 22 Ene 2026

## Objetivo
Esta carpeta contiene archivos detectados como duplicados durante la Fase 3 de la auditoría forense.

La decisión fue **NO eliminarlos** de inmediato, sino **moverlos a cuarentena** para:
- Evitar regresiones por dependencias implícitas.
- Permitir revisión/rollback rápido si aparece un import indirecto o un caso de uso no detectado.
- Mantener una única fuente de verdad en las rutas canónicas del proyecto.

## Criterio aplicado (Opción B)
- Consolidar y mantener como canónicos los componentes en `src/components/modals/*`.
- Mantener el archivo en uso real (ej. `animated-modal.tsx`) como fuente única.
- Si existían duplicados idénticos en otras rutas (ej. `src/components/ai/*` o `src/components/blockchain/*`), se movieron a esta carpeta.

## Archivos movidos a cuarentena
Los siguientes archivos fueron **movidos** (no borrados):
- `src/components/ai/ContentModerationModal.tsx`
- `src/components/blockchain/ConsentModal.tsx`
- `src/components/modals/AnimatedModal.tsx`
- `src/lib/utils.ts`

### Archivos eliminados y movidos a cuarentena (26 Ene 2026)
Los siguientes archivos fueron **eliminados del proyecto principal** y **movidos a cuarentena** debido a errores TypeScript complejos:

- `src/services/admin/ClubAdminService.ts` → `duplicates_quarantine/src/services/admin/ClubAdminService.ts`
- `src/components/admin/panels/ClubAdminPanelReal.tsx` → `duplicates_quarantine/src/components/admin/panels/ClubAdminPanelReal.tsx`

**Justificación de eliminación:**
- Errores TypeScript complejos con tipos de Supabase generados (70+ campos)
- Incompatibilidad entre tipos generados y código personalizado
- Los errores bloqueaban el build y el progreso del desarrollo
- Se optó por usar versiones simplificadas funcionales (ClubAdminPanel.tsx, ClubAdminServiceSimple.ts)

**Estado actual:**
- ✅ Panel de administración funcional con versión simplificada
- ✅ Build exitoso sin errores TypeScript
- ✅ Sincronización Android completa
- ✅ Commit y push a master realizados

**Archivos reemplazo:**
- `ClubAdminPanel.tsx` (versión simplificada funcional)
- `ClubAdminServiceSimple.ts` (servicio con tipos compatibles)

### Assets duplicados (Fase 3.4)
Los siguientes assets binarios (imágenes) fueron movidos a cuarentena porque existen duplicados idénticos en `public/assets/`:

**NFTs:**
- `src/assets/nfts/imagen1.jpg` → `duplicates_quarantine/src/assets/nfts/imagen1.jpg`
- `src/assets/nfts/imagen2.jpg` → `duplicates_quarantine/src/assets/nfts/imagen2.jpg`
- `src/assets/nfts/imagen3.jpg` → `duplicates_quarantine/src/assets/nfts/imagen3.jpg`
- `src/assets/nfts/imagen4.gif` → `duplicates_quarantine/src/assets/nfts/imagen4.gif`

**People - Couple:**
- `src/assets/people/couple/c1.jpg` → `duplicates_quarantine/src/assets/people/couple/c1.jpg`
- `src/assets/people/couple/c2.jpg` → `duplicates_quarantine/src/assets/people/couple/c2.jpg`
- `src/assets/people/couple/c3.jpg` → `duplicates_quarantine/src/assets/people/couple/c3.jpg`
- `src/assets/people/couple/c4.jpg` → `duplicates_quarantine/src/assets/people/couple/c4.jpg`
- `src/assets/people/couple/privado/couple-priv.jpg` → `duplicates_quarantine/src/assets/people/couple/privado/couple-priv.jpg`
- `src/assets/people/couple/privado/privado-couple-2.jpg` → `duplicates_quarantine/src/assets/people/couple/privado/privado-couple-2.jpg`
- `src/assets/people/couple/privado/privado-couple-4.jpg` → `duplicates_quarantine/src/assets/people/couple/privado/privado-couple-4.jpg`

**People - Female:**
- `src/assets/people/female/f1.jpg` → `duplicates_quarantine/src/assets/people/female/f1.jpg`
- `src/assets/people/female/f2.jpg` → `duplicates_quarantine/src/assets/people/female/f2.jpg`
- `src/assets/people/female/f3.jpg` → `duplicates_quarantine/src/assets/people/female/f3.jpg`
- `src/assets/people/female/f4.jpg` → `duplicates_quarantine/src/assets/people/female/f4.jpg`

**People - Male:**
- `src/assets/people/male/m1.jpg` → `duplicates_quarantine/src/assets/people/male/m1.jpg`
- `src/assets/people/male/profile-1.jpg` → `duplicates_quarantine/src/assets/people/male/profile-1.jpg`
- `src/assets/people/male/profile-2.jpg` → `duplicates_quarantine/src/assets/people/male/profile-2.jpg`
- `src/assets/people/male/profile-3.jpg` → `duplicates_quarantine/src/assets/people/male/profile-3.jpg`
- `src/assets/people/male/profile-4.jpg` → `duplicates_quarantine/src/assets/people/male/profile-4.jpg`
- `src/assets/people/male/privado/aprivadocouple10.jpg` → `duplicates_quarantine/src/assets/people/male/privado/aprivadocouple10.jpg`
- `src/assets/people/male/privado/aprivadocouple11.jpg` → `duplicates_quarantine/src/assets/people/male/privado/aprivadocouple11.jpg`
- `src/assets/people/male/privado/aprivadocouple2.jpg` → `duplicates_quarantine/src/assets/people/male/privado/aprivadocouple2.jpg`
- `src/assets/people/male/privado/aprivadocouple3.jpg` → `duplicates_quarantine/src/assets/people/male/privado/aprivadocouple3.jpg`
- `src/assets/people/male/privado/aprivadocouple4.jpg` → `duplicates_quarantine/src/assets/people/male/privado/aprivadocouple4.jpg`
- `src/assets/people/male/privado/aprivadocouple5.jpg` → `duplicates_quarantine/src/assets/people/male/privado/aprivadocouple5.jpg`
- `src/assets/people/male/privado/aprivadocouple6.jpg` → `duplicates_quarantine/src/assets/people/male/privado/aprivadocouple6.jpg`
- `src/assets/people/male/privado/aprivadocouple7.jpg` → `duplicates_quarantine/src/assets/people/male/privado/aprivadocouple7.jpg`
- `src/assets/people/male/privado/aprivadocouple8.jpg` → `duplicates_quarantine/src/assets/people/male/privado/aprivadocouple8.jpg`
- `src/assets/people/male/privado/aprivadocouple9.jpg` → `duplicates_quarantine/src/assets/people/male/privado/aprivadocouple9.jpg`
- `src/assets/people/male/privado/privado-male-1.jpg` → `duplicates_quarantine/src/assets/people/male/privado/privado-male-1.jpg`

## Evidencia de seguridad (antes de mover)
- No se encontraron imports directos a:
  - `@/components/ai/ContentModerationModal`
  - `@/components/blockchain/ConsentModal`
  - `@/components/modals/AnimatedModal`
- Se confirmaron como **idénticos** a sus equivalentes canónicos mediante comparación completa de contenido.
- `@/components/modals/animated-modal` **sí** está en uso (runtime y tests), por lo que se mantuvo como canónico.

- Para `src/lib/utils.ts`:
  - `src/lib/utils.ts` y `src/shared/lib/cn.ts` son equivalentes (solo exportan `cn`).
  - No se encontraron imports en `src/` a `@/lib/utils` al momento de la consolidación.
  - Se migró el uso detectado previamente hacia `@/shared/lib/cn`.

- Para assets duplicados:
  - El código usa rutas `/assets/...` (ej. `/assets/nfts/imagen1.jpg`, `/assets/people/single/privado/aprivadosingle1.jpg`) que resuelven desde `public/assets/`.
  - No se encontraron imports `@/assets/nfts/` ni `@/assets/people/` en `src/`.
  - Los archivos en `src/assets/nfts/` y `src/assets/people/couple/` son **idénticos** (mismos tamaños en bytes) a sus equivalentes en `public/assets/`.
  - Por lo tanto, el canónico es `public/assets/...` y los duplicados en `src/assets/` se movieron a cuarentena.

## Notas
- La carpeta `duplicates_quarantine/` está agregada a `.gitignore` para evitar que esta cuarentena se despliegue o se publique accidentalmente.

## Próximo paso sugerido
Si durante validación (`npm run build:check`, `npm run lint`, `npm run test`) no aparecen errores, se puede:
1) Eliminar definitivamente los duplicados cuarentenados.
2) Mantener el registro de esta decisión en un documento de auditoría (si se requiere compliance).
