# FASE 4: MODALS - Plan de Ejecución

## 📋 Objetivo
Consolidar 25 archivos Modal en `src/components/modals/`

## 🔍 Análisis Previo

### Archivos a Mover (25 total)
```
Ubicación Actual:
├── src/components/ThemeModal.tsx ⚠️
├── src/components/WelcomeModal.tsx ⚠️
├── src/components/ai/ContentModerationModal.tsx
├── src/components/ai/SmartMatchingModal.tsx
├── src/components/auth/TermsModal.tsx
├── src/components/auth/ThemeInfoModal.tsx
├── src/components/blockchain/ConsentModal.tsx
├── src/components/chat/SummaryModal.tsx
├── src/components/modals/ (6 modals) ✅
│   ├── ActionButtonsModal.tsx
│   ├── ComingSoonModal.tsx
│   ├── CompatibilityModal.tsx
│   ├── EventsModal.tsx
│   ├── FeatureModal.tsx
│   ├── InstallAppModal.tsx
│   ├── PremiumModal.tsx
│   └── SuperLikesModal.tsx
├── src/components/tokens/StakingModal.tsx
├── src/components/ui/Modal.tsx ✅
├── src/components/ui/TermsModal.tsx
├── src/components/ui/UnifiedModal.tsx ✅
└── src/components/profiles/ (3 modals - MOVIDOS)
    ├── couple/TermsModal.tsx
    ├── shared/ImageModal.tsx
    └── single/TermsModal.tsx

Problema: DISPERSOS en múltiples directorios
Solución: Consolidar TODOS en src/components/modals/
```

---

## ✅ Plan de Ejecución

### Paso 1: Crear estructura de directorios
```bash
mkdir -p src/components/modals
```

### Paso 2: Mover archivos a src/components/modals/
```bash
# De src/components/
mv src/components/ThemeModal.tsx src/components/modals/
mv src/components/WelcomeModal.tsx src/components/modals/

# De src/components/ai/
mv src/components/ai/ContentModerationModal.tsx src/components/modals/
mv src/components/ai/SmartMatchingModal.tsx src/components/modals/

# De src/components/auth/
mv src/components/auth/TermsModal.tsx src/components/modals/TermsModalAuth.tsx
mv src/components/auth/ThemeInfoModal.tsx src/components/modals/

# De src/components/blockchain/
mv src/components/blockchain/ConsentModal.tsx src/components/modals/

# De src/components/chat/
mv src/components/chat/SummaryModal.tsx src/components/modals/

# De src/components/tokens/
mv src/components/tokens/StakingModal.tsx src/components/modals/

# De src/components/ui/
mv src/components/ui/TermsModal.tsx src/components/modals/TermsModalUI.tsx

# Mantener en src/components/modals/ (ya están ahí)
# ActionButtonsModal, ComingSoonModal, CompatibilityModal, etc.

# De src/components/profiles/
mv src/components/profiles/couple/TermsModal.tsx src/components/modals/TermsModalCouple.tsx
mv src/components/profiles/shared/ImageModal.tsx src/components/modals/
mv src/components/profiles/single/TermsModal.tsx src/components/modals/TermsModalSingle.tsx
```

### Paso 3: Crear barrel export
```typescript
// src/components/modals/index.ts
export { default as ActionButtonsModal } from './ActionButtonsModal'
export { default as ComingSoonModal } from './ComingSoonModal'
export { default as CompatibilityModal } from './CompatibilityModal'
export { default as ContentModerationModal } from './ContentModerationModal'
export { default as ConsentModal } from './ConsentModal'
export { default as EventsModal } from './EventsModal'
export { default as FeatureModal } from './FeatureModal'
export { default as ImageModal } from './ImageModal'
export { default as InstallAppModal } from './InstallAppModal'
export { default as PremiumModal } from './PremiumModal'
export { default as SmartMatchingModal } from './SmartMatchingModal'
export { default as StakingModal } from './StakingModal'
export { default as SummaryModal } from './SummaryModal'
export { default as SuperLikesModal } from './SuperLikesModal'
export { default as ThemeInfoModal } from './ThemeInfoModal'
export { default as ThemeModal } from './ThemeModal'
export { default as TermsModalAuth } from './TermsModalAuth'
export { default as TermsModalCouple } from './TermsModalCouple'
export { default as TermsModalSingle } from './TermsModalSingle'
export { default as TermsModalUI } from './TermsModalUI'
export { default as WelcomeModal } from './WelcomeModal'
export { Modal } from '@/components/ui/Modal'
export { UnifiedModal } from '@/components/ui/UnifiedModal'
```

### Paso 4: Actualizar imports
Buscar y reemplazar:
```
@/components/ThemeModal → @/components/modals/ThemeModal
@/components/WelcomeModal → @/components/modals/WelcomeModal
@/components/ai/ContentModerationModal → @/components/modals/ContentModerationModal
@/components/ai/SmartMatchingModal → @/components/modals/SmartMatchingModal
@/components/auth/TermsModal → @/components/modals/TermsModalAuth
@/components/auth/ThemeInfoModal → @/components/modals/ThemeInfoModal
@/components/blockchain/ConsentModal → @/components/modals/ConsentModal
@/components/chat/SummaryModal → @/components/modals/SummaryModal
@/components/tokens/StakingModal → @/components/modals/StakingModal
@/components/ui/TermsModal → @/components/modals/TermsModalUI
@/components/profiles/couple/TermsModal → @/components/modals/TermsModalCouple
@/components/profiles/shared/ImageModal → @/components/modals/ImageModal
@/components/profiles/single/TermsModal → @/components/modals/TermsModalSingle
```

### Paso 5: Compilar y verificar
```bash
pnpm run build
```

### Paso 6: Commit
```bash
git add src/components/modals/
git commit -m "refactor: FASE 4 - consolidate modals in components/modals (25 files)"
```

---

## 📊 Resumen FASE 4

| Métrica | Valor |
|---------|-------|
| Archivos a mover | 25 |
| Imports a actualizar | 15+ |
| Tiempo estimado | 1.5 horas |
| Riesgo | ALTO |
| Complejidad | ALTA |
| Estado | ⏳ PENDIENTE |

---

## 🎯 Próxima Fase
Ver: `FASE_5_DIALOGS.md`

---

## 📝 Notas Importantes

1. **TermsModal.tsx duplicado:** Existe en 4 ubicaciones diferentes
   - Renombrar para evitar conflictos:
     - `TermsModalAuth.tsx` (de auth/)
     - `TermsModalUI.tsx` (de ui/)
     - `TermsModalCouple.tsx` (de profiles/couple/)
     - `TermsModalSingle.tsx` (de profiles/single/)

2. **Modal.tsx y UnifiedModal.tsx:** Mantener en `src/components/ui/` pero re-exportar desde modals/

3. **ImageModal.tsx:** Ya está en profiles/shared/, mover a modals/

4. **Archivos ya en src/components/modals/:** No necesitan movimiento, solo actualizar imports

---

## ⚠️ Consideraciones Críticas

- **ALTO RIESGO:** Muchos imports a actualizar
- **DUPLICADOS:** TermsModal existe en 4 lugares
- **DEPENDENCIAS:** Verificar que no hay referencias circulares
- **TESTING:** Compilar después de cada paso importante
