# Mapeo Estructural Integral y Análisis de Conectividad (Auditoría Forense)

**Fecha de Generación:** 27 de diciembre de 2025

## Resumen Ejecutivo

Este documento reemplaza la versión anterior de `project-structure-tree.md`. El análisis revela una arquitectura de frontend monolítica potente pero con inconsistencias significativas. Aunque la aplicación es funcional, sufre de problemas estructurales que afectan la mantenibilidad y la claridad del código.

**Hallazgos Clave:**

1.  **Inconsistencia Arquitectónica Grave:** Componentes que funcionan como páginas completas están ubicados en `src/components` en lugar de `src/pages`.
2.  **Duplicación de Código:** Se encontraron componentes y hooks duplicados entre las carpetas `single` y `couple`.
3.  **Código Huérfano y Obsoleto:** Existen numerosos archivos (`.tsx`, `.ts`, `.md`) que no se utilizan en la aplicación activa, vestigios de refactorizaciones o debugging.
4.  **Organización de Pruebas:** Los archivos de prueba (`.test.tsx`) están mezclados con el código fuente en lugar de seguir una estructura de pruebas consistente.
5.  **Complejidad Anómala:** El punto de entrada `src/main.tsx` contiene lógica no estándar y de alto riesgo para la inicialización de React.

A continuación se detalla el árbol de estructura con la clasificación de estado de cada nodo.

---

## Árbol de Estructura y Estado

### Directorio Raíz

- ✅ `package.json`: (OPERATIVO) Define scripts, dependencias y el corazón del proyecto.
- ✅ `index.html`: (OPERATIVO) Punto de entrada HTML para la aplicación Vite.
- ✅ `vite.config.ts`: (OPERATIVO) Configuración principal de Vite.
- ✅ `tailwind.config.ts`: (OPERATIVO) Configuración de Tailwind CSS.
- ✅ `postcss.config.js`: (OPERATIVO) Configuración de PostCSS para Tailwind.
- ✅ `tsconfig.json`: (OPERATIVO) Configuración base de TypeScript.
- ✅ `vitest.config.ts`: (OPERATIVO) Configuración de Vitest para pruebas.
- ✅ `playwright.config.ts`: (OPERATIVO) Configuración de Playwright para pruebas E2E.
- ✅ `eslint.config.ts`: (OPERATIVO) Configuración de ESLint.
- ✅ `hardhat.config.cjs`: (OPERATIVO) Configuración de Hardhat para Smart Contracts.
- ✅ `capacitor.config.ts`: (OPERATIVO) Configuración de Capacitor para la app móvil.
- ✅ `.gitignore`: (OPERATIVO) Define archivos ignorados por Git.
- ❌ `CHANGES.md`: (OBSOLETO) Log de cambios manual, probablemente desactualizado.
- ❌ `CLEANUP_REPORT.md`: (OBSOLETO) Reporte de limpieza de una ejecución única.
- ❌ `FORENSIC_CLEANUP_LOG.md`: (OBSOLETO) Log de una limpieza pasada.
- 📂 `src`: **(NÚCLEO DE LA APLICACIÓN)** Contiene el código fuente de React. (Análisis detallado abajo).
- 📂 `public`: (OPERATIVO) Contiene assets estáticos. Se asume que los archivos aquí son referenciados correctamente.
- 📂 `contracts`: (OPERATIVO) Contiene el código fuente de los Smart Contracts de Solidity.
- 📂 `scripts`: (OPERATIVO) Contiene scripts de automatización importantes para el proyecto.
- 📂 `api`: (OPERATIVO) Contiene cron jobs y/o funciones serverless.
- 📂 `docs`: (OPERATIVO) Contiene la documentación del proyecto.

---

### Directorio `src`

#### Archivos Principales en `src`

- ⚠️ `main.tsx`: (ADVERTENCIA - Complejidad Anómala) Punto de entrada funcional, pero contiene lógica no estándar y riesgosa para la inyección global de React y manejo de errores.
- ⚠️ `App.tsx`: (ADVERTENCIA - Inconsistencia Arquitectónica) Define el enrutador principal pero mezcla importaciones de páginas desde `src/pages` y `src/components`, revelando fallos estructurales.
- ✅ `index.css`: (OPERATIVO) Hoja de estilos principal de la aplicación.
- ✅ `vite-env.d.ts`: (OPERATIVO) Archivo de declaración de tipos de entorno de Vite.
- ✅ `debug.tsx`: (OPERATIVO) Proveedor del componente `DebugInfo` usado en desarrollo.
- ❌ `EnvDebug.tsx`: (OBSOLETO - Huérfano) Archivo de debug no importado ni utilizado en la aplicación.

#### Directorios en `src`

- 📂 `assets`: (OPERATIVO) Contiene imágenes, fuentes y otros recursos estáticos importados por los componentes.
- 📂 `config`: (OPERATIVO) Almacena la configuración de servicios externos como Sentry y Datadog.
- 📂 `context`: (OPERATIVO) Define los proveedores de contexto de React para el estado global.
- 📂 `features`: (OPERATIVO) Contiene lógica de negocio y hooks específicos de funcionalidades. Sufre de inconsistencia, ya que parte de su lógica también reside en `hooks` y `services`.
- 📂 `layouts`: (OPERATIVO) Componentes de layout que envuelven las páginas (e.g., `ProfileLayout`).
- 📂 `types`: (OPERATIVO) Contiene las definiciones de tipos y interfaces de TypeScript.

- 📂 `pages`
  - ✅ `Index.tsx`, `Auth.tsx`, `Discover.tsx`, etc.: (OPERATIVO) La mayoría de los archivos aquí son páginas válidas y están correctamente enrutadas en `App.tsx`.
  - ❌ `Construction.tsx`: (OBSOLETO - Huérfano) Página no utilizada ni enrutada.
  - ❌ `LeyOlimpia.tsx`: (OBSOLETO - Huérfano) Página no utilizada ni enrutada.
  - ❌ `TokensInfoLazy.tsx`: (OBSOLETO - Duplicado) Versión antigua o de prueba de `TokensInfo.tsx`, no utilizada.
  - 📂 `landing`
    - ❌ `index.tsx`: (OBSOLETO - Huérfano) Una página de aterrizaje alternativa completa y visualmente rica que no está conectada a la aplicación.
  - 📂 `admin`
    - ✅ `Admin.tsx`, `AdminUsers.tsx`, etc.: (OPERATIVO) Páginas del panel de administración, correctamente enrutadas.
    - ❌ `AdminDashboard.tsx`: (OBSOLETO - Huérfano) Vestigio de una arquitectura anterior (estilo Next.js `app/`), no utilizado.
    - ❌ `useAdminDashboard.ts`: (OBSOLETO - Huérfano) Hook no utilizado e incorrectamente ubicado.

- 📂 `components`
  - ⚠️ **(Directorio con Inconsistencias)** Aunque muchos componentes son válidos, la estructura general es problemática.
  - 📂 `profiles`
    - ⚠️ `shared/Profiles.tsx`: (ADVERTENCIA - Discrepancia de Ubicación) Funciona como una página principal pero está en `components`.
    - ⚠️ `shared/ProfileDetail.tsx`: (ADVERTENCIA - Discrepancia de Ubicación) Funciona como una página de detalle pero está en `components`.
    - ⚠️ `single/ProfileSingle.tsx`: (ADVERTENCIA - Discrepancia de Ubicación) Página del perfil de soltero.
    - ⚠️ `single/EditProfileSingle.tsx`: (ADVERTENCIA - Discrepancia de Ubicación) Página de edición de perfil de soltero.
    - ⚠️ `couple/ProfileCouple.tsx`: (ADVERTENCIA - Discrepancia de Ubicación) Página del perfil de pareja.
    - ⚠️ `couple/EditProfileCouple.tsx`: (ADVERTENCIA - Discrepancia de Ubicación) Página de edición de perfil de pareja.
    - ⚠️ `couple/InterestsSelector.tsx`: (ADVERTENCIA - Duplicidad) Componente duplicado que también existe en la carpeta `single`. Debería estar en `shared`.
    - ⚠️ `shared/profiles.test.ts`: (ADVERTENCIA - Discrepancia de Ubicación) Archivo de prueba mezclado con el código fuente.
    - ❌ `couple/CoupleDashboard.tsx`: (OBSOLETO - Huérfano) Componente de dashboard no utilizado.
    - ✅ `shared/ProfileNavTabs.tsx`: (OPERATIVO) Componente clave para la navegación de perfiles, bien ubicado.
  - 📂 `ui`
    - ✅ `accordion.tsx`, `button.tsx`, etc.: (OPERATIVO) Componentes base del sistema de diseño, basados en `shadcn/ui`.
    - ⚠️ **(Directorio con Inconsistencias)** Presenta inconsistencia en la nomenclatura de archivos (PascalCase vs. kebab-case).
    - ⚠️ `table.stories.tsx`: (ADVERTENCIA - Discrepancia de Ubicación) Archivo de Storybook mezclado con componentes.
  - **(Resto de directorios en `components`)**: Contienen componentes reutilizables y en su mayoría están bien estructurados internamente, aunque el directorio `components` en su conjunto es demasiado grande y monolítico.

- 📂 `hooks`
  - ⚠️ **(Directorio con Inconsistencias)** Contiene hooks reutilizables, pero existe una inconsistencia arquitectónica al tener también hooks co-localizados dentro de `components` y `features`. No hay una regla clara.
  - ✅ `useGeolocation.ts`, `useTheme.ts`, etc.: (OPERATIVO) Hooks reutilizables para funcionalidades transversales.

- 📂 `services`
  - ⚠️ **(Directorio Monolítico)** Contiene una cantidad masiva de servicios, actuando como un "directorio dios". Debería ser refactorizado en dominios más pequeños.
  - ✅ `ContentModerationService.ts`, `TokenService.ts`, etc.: (OPERATIVO) Servicios críticos para la lógica de negocio.
  - ❌ `postsService_MISSING_COLUMNS.md`: (OBSOLETO) Nota de desarrollador, no es código.
  - ❌ `IntegrationTester.ts`: (OBSOLETO - Huérfano) Utilidad de prueba no utilizada.

- 📂 `lib`
  - ⚠️ **(Directorio Monolítico)** Similar a `services`, es un "cajón de sastre" para utilidades de todo tipo.
  - ✅ `utils.ts`, `logger.ts`, `errorHandling.ts`: (OPERATIVO) Utilidades transversales y críticas para la aplicación.
  - ✅ `wallet-silencer.ts`, `capture-console-errors.ts`: (OPERATIVO) Scripts críticos importados en `main.tsx`.
  - ❌ `test-debugger.ts`: (OBSOLETO - Huérfano) Utilidad de debug no utilizada.
