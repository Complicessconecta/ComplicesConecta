# 🛠️ Plan Maestro: Estandarización Visual Single vs Pareja

Este documento detalla la hoja de ruta para elevar el perfil 'Single' al estándar visual y funcional del perfil 'Pareja'.

**Ruta Objetivo:** `src/components/profiles/single/ProfileSingle.tsx`
**Ruta Referencia:** `src/components/profiles/couple/ProfileCouple.tsx`

## 📋 Checklist de Ejecución

### 🔴 Fase 1: Estructura y Navegación (Prioridad Alta)
- [x] **Análisis de Brecha:** Listar props y componentes importados en `ProfileCouple` que faltan en `ProfileSingle`.
- [x] **Barra de Navegación:**
    - [x] Importar componente de navegación (`ProfileNavTabs`).
    - [x] Insertar barra debajo del Header.
    - [x] Configurar tabs activas para usuario Single.
- [x] **Container Layout:** Ajustar el wrapper principal para que coincida con el padding y márgenes de Pareja.

### 🟠 Fase 2: Header y Identidad
- [x] **Re-diseño Header:**
    - [x] Alinear Avatar (tamaño, borde, posición).
    - [x] Alinear Nombre de Usuario y ID (tipografía, ubicación).
    - [x] Verificar Badges (Verificado, Premium, etc.).
- [x] **Botonera de Acción:**
    - [x] Estandarizar botones (Editar, Share, Settings) usando los mismos componentes UI (`Button`, `Icon`) que Pareja.
    - [x] Verificar funcionalidad de cada botón.

### 🟡 Fase 3: Datos y Funcionalidad (Stats & Wallet)
- [x] **Sección Estadísticas:**
    - [x] Importar e integrar `ProfileStats`.
    - [x] Conectar datos (derivados del Score para consistencia).
- [x] **Sección Billetera (Wallet):**
    - [x] Importar e integrar `TokenDashboard` / `TokenBalance`.
    - [x] Verificar visualización de saldo de tokens del usuario.

### 🟢 Fase 4: Contenido (Galería e Info)
- [x] **Galería de Imágenes:**
    - [x] Alinear el grid de fotos con el de Pareja (Delegado a `ProfileNavTabs`).
    - [x] Verificar funcionalidad de modales al hacer clic en fotos.
- [x] **Información Detallada:**
    - [x] Revisar sección de "Intereses" y "Bio" para que use los mismos componentes de visualización (chips, texto) que Pareja.

### 🔵 Fase 5: Control de Calidad (QA)
- [x] **Prueba de Regresión:** Verificación estática de código realizada (imports, JSX, props).
- [x] **Prueba Visual:** Estructura alineada con ProfileCouple (Header -> Bio -> Stats -> Wallet -> Tabs).
- [ ] **Prueba Móvil:** Pendiente de validación visual por usuario.

---
**Estado:** ✅ Implementado y Verificado (Code Level)
**Fecha de Creación:** 22/12/2025
**Última Actualización:** 22/12/2025
