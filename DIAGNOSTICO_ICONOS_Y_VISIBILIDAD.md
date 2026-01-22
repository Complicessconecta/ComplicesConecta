# Diagnóstico y Plan - Íconos/Emojis no visibles o renderizados como "."

## Contexto
En el proyecto se observaron casos donde:
- Íconos Lucide (SVG) están en el DOM pero no se ven (aunque el click sí funciona).
- Emojis/símbolos (🔒, ⚠️, ✅, etc.) se renderizan como "." en algunos entornos (especialmente Android WebView).

## Hallazgos principales (causa raíz)

### 1) Acciones rápidas (Quick Actions) ocultas por hover
- **Síntoma:** Botones/íconos existen en DOM pero no son visibles.
- **Causa:** Contenedor con `opacity-0` + `group-hover:opacity-100` en componentes de cards. En móvil/touch no hay hover.
- **Solución aplicada:** Mostrar Quick Actions en mobile y dejar hover-only en desktop con clases responsivas.

### 2) Emojis renderizados como "." (fuente sin soporte)
- **Síntoma:** Emojis/símbolos aparecen como "." o glifo incorrecto.
- **Causa probable:** Stack de `font-family` sin fuentes de emoji; el sistema cae a una fuente que no incluye los glifos.
- **Solución aplicada:** Definir un stack global con fuentes de emoji:
  - `Apple Color Emoji`, `Segoe UI Emoji`, `Segoe UI Symbol`, `Noto Color Emoji`.

### 3) Riesgo de divergencia por duplicados (monorepo)
- **Síntoma:** Estilos/comportamientos inconsistentes si distintos módulos importan diferentes wrappers.
- **Causa:** Existía `src/shared/ui/Button.tsx` además del botón oficial.
- **Solución aplicada:** Consolidación segura: `src/shared/ui/Button.tsx` ahora es re-export del botón oficial.

## Cambios por archivo (tabla)

| Archivo | Ruta | Síntoma | Causa | Solución |
|---|---|---|---|---|
| MainProfileCard | `src/components/profiles/shared/MainProfileCard.tsx` | Íconos/acciones invisibles en mobile | Hover-only (`opacity-0` + `group-hover`) | Quick Actions visibles en mobile, hover-only en desktop |
| CoupleProfileCard | `src/components/profiles/couple/CoupleProfileCard.tsx` | Íconos/acciones invisibles en mobile | Hover-only (`opacity-0` + `group-hover`) | Quick Actions visibles en mobile, hover-only en desktop |
| Global CSS | `src/styles/index.css` | Emojis como "." | Falta de fuentes emoji en `font-family` | Stack global con fuentes emoji |
| Button re-export | `src/shared/ui/Button.tsx` | Riesgo de conflicto/duplicado | Duplicidad de capa UI | Re-export del botón oficial |
| ParentalControl | `src/components/profiles/shared/ParentalControl.tsx` | Emojis podrían verse como "." | Fuente sin soporte | Restaurados emojis tras fix global |
| ProfileContent | `src/components/profiles/ProfileContent.tsx` | Emojis en comentarios demo podrían verse como "." | Fuente sin soporte | Restaurados emojis tras fix global |
| TokenDashboard | `src/components/tokens/TokenDashboard.tsx` | Emojis/labels podrían verse como "." | Fuente sin soporte | Restaurados emojis tras fix global |
| ThemeToggle | `src/components/ui/ThemeToggle.tsx` | Emojis en toast podrían verse como "." | Fuente sin soporte | Restaurados emojis tras fix global |
| ImageWithFallback | `src/components/ui/images/ImageWithFallback.tsx` | Emojis en títulos podrían verse como "." | Fuente sin soporte | Restaurados emojis tras fix global |
| DemoWallet | `src/components/wallet/DemoWallet.tsx` | Emojis de warning podrían verse como "." | Fuente sin soporte | Restaurados emojis tras fix global |

## Verificación recomendada
1) Validar visualmente en:
- Chrome, Edge, Firefox, Brave
- Android WebView (Capacitor)
- iOS Safari (si aplica)

2) Validar build:
- `npm run build:check`

## Notas
- Los warnings de compatibilidad CSS (`@layer`, scrollbar) vienen de Tailwind/CSS moderno; no se consideran causa directa de la invisibilidad de íconos.
