# Tracker Optimización Fusión de Fondos

- [x] UNIFY-1: Documentar estado inicial de componentes de fondo
  - src/components/ui/backgrounds/RandomBackground.tsx (PageBackground / RandomBackground / MasterBackground)
  - src/components/ui/backgrounds/ParticlesBackground.tsx
  - src/components/ui/ParticlesNeonBackground.tsx
  - src/components/ui/GlobalBackground.tsx
  - src/components/ui/GlobalBackgroundWrapper.tsx
  - src/context/BackgroundContext.tsx
- [x] UNIFY-2: Crear componente unificado de fondo (UnifiedBackground) basado en RandomBackground
- [x] UNIFY-3: Integrar lógica de capacidades de dispositivo (useDeviceCapability)
- [x] UNIFY-4: Integrar preferencias de fondo del usuario (useBackgroundPreferences / useBgMode)
- [x] UNIFY-5: Implementar carga progresiva (fade-in) de imágenes de fondo
- [x] UNIFY-6: Implementar modo partículas híbrido
  - [x] High-End: tsparticles (modo nieve)
  - [x] Low-End: partículas CSS ligeras
  - [x] Modo sólido: solo color sólido si usuario lo prefiere
- [x] UNIFY-7: Reemplazar usos de PageBackground por UnifiedBackground en App.tsx
- [x] UNIFY-8: Verificar que no existan dobles fondos activos (ParticlesNeonBackground, ParticlesBackground, etc.)
- [x] UNIFY-9: Ajustar pruebas E2E/visuales si dependen de IDs/clases de fondo
- [x] UNIFY-10: Correcciones de textos en src/pages/Info.tsx (Información, Más, México, etc.)
- [x] UNIFY-11: Plan de rollback documentado (restaurar RandomBackground.tsx y ParticlesBackground.tsx originales si algo falla)

## Instrucciones de Rollback

1. Si el último commit corresponde solo a esta optimización de fondos:
   - Ejecutar `git revert HEAD` para crear un commit inverso.
2. Si necesitas restaurar únicamente los archivos de fondo:
   - `git checkout HEAD~1 -- src/components/ui/backgrounds/RandomBackground.tsx src/components/ui/backgrounds/ParticlesBackground.tsx src/components/ui/backgrounds/index.ts src/pages/Index.tsx`
3. Si el problema es únicamente visual en producción:
   - Crear una rama de hotfix desde `master`, aplicar el `git checkout` anterior y desplegar.
