# ­ƒøá´©Å Plan Maestro: Estandarizaci├│n Visual Single vs Pareja

Este documento detalla la hoja de ruta para elevar el perfil 'Single' al est├índar visual y funcional del perfil 'Pareja'.

**Ruta Objetivo:** `src/components/profiles/single/ProfileSingle.tsx`
**Ruta Referencia:** `src/components/profiles/couple/ProfileCouple.tsx`

## ­ƒôï Checklist de Ejecuci├│n

### ­ƒö┤ Fase 1: Estructura y Navegaci├│n (Prioridad Alta)
- [x] **An├ílisis de Brecha:** Listar props y componentes importados en `ProfileCouple` que faltan en `ProfileSingle`.
- [x] **Barra de Navegaci├│n:**
    - [x] Importar componente de navegaci├│n (`ProfileNavTabs`).
    - [x] Insertar barra debajo del Header.
    - [x] Configurar tabs activas para usuario Single.
- [x] **Container Layout:** Ajustar el wrapper principal para que coincida con el padding y m├írgenes de Pareja.

### ­ƒƒá Fase 2: Header y Identidad
- [x] **Re-dise├▒o Header:**
    - [x] Alinear Avatar (tama├▒o, borde, posici├│n).
    - [x] Alinear Nombre de Usuario y ID (tipograf├¡a, ubicaci├│n).
    - [x] Verificar Badges (Verificado, Premium, etc.).
- [x] **Botonera de Acci├│n:**
    - [x] Estandarizar botones (Editar, Share, Settings) usando los mismos componentes UI (`Button`, `Icon`) que Pareja.
    - [x] Verificar funcionalidad de cada bot├│n.

### ­ƒƒí Fase 3: Datos y Funcionalidad (Stats & Wallet)
- [x] **Secci├│n Estad├¡sticas:**
    - [x] Importar e integrar `ProfileStats`.
    - [x] Conectar datos (derivados del Score para consistencia).
- [x] **Secci├│n Billetera (Wallet):**
    - [x] Importar e integrar `TokenDashboard` / `TokenBalance`.
    - [x] Verificar visualizaci├│n de saldo de tokens del usuario.

### ­ƒƒó Fase 4: Contenido (Galer├¡a e Info)
- [x] **Galer├¡a de Im├ígenes:**
    - [x] Alinear el grid de fotos con el de Pareja (Delegado a `ProfileNavTabs`).
    - [x] Verificar funcionalidad de modales al hacer clic en fotos.
- [x] **Informaci├│n Detallada:**
    - [x] Revisar secci├│n de "Intereses" y "Bio" para que use los mismos componentes de visualizaci├│n (chips, texto) que Pareja.

### ­ƒöÁ Fase 5: Control de Calidad (QA)
- [x] **Prueba de Regresi├│n:** Verificaci├│n est├ítica de c├│digo realizada (imports, JSX, props).
- [x] **Prueba Visual:** Estructura alineada con ProfileCouple (Header -> Bio -> Stats -> Wallet -> Tabs).
- [ ] **Prueba M├│vil:** Pendiente de validaci├│n visual por usuario.

---
**Estado:** Ô£à Implementado y Verificado (Code Level)
**Fecha de Creaci├│n:** 22/12/2025
**├Ültima Actualizaci├│n:** 22/12/2025
