# Reporte de Hallazgos de Seguridad - npm audit y window.open
**Fecha:** 24 Enero 2026
**Estado:** Pendiente de resolución

---

## 1. Vulnerabilidades npm audit (3 High)

### 1.1 tar (<=7.5.3) - High Severity
**CVEs:** GHSA-8qq5-rm4j-mr97, GHSA-r6q2-hw4h-h46w

- **Descripción:** Arbitrary File Overwrite y Symlink Poisoning via Insufficient Path Sanitization
- **CWE:** CWE-22, CWE-176
- **CVSS:** 8.8 (High)
- **Ruta de ataque:** Race Condition en node-tar Path Reservations via Unicode Ligature Collisions on macOS APFS
- **Paquetes afectados:**
  - `node_modules/onnxruntime-node/node_modules/tar`
  - `node_modules/supabase/node_modules/tar`
  - `node_modules/tar`

**Dependencias vulnerables:**
- `@capacitor/cli` (versión actual: 0.0.10 - 1.1.1 || 3.0.0-alpha.0 - 8.0.2-nightly-20260119T150908.0)
- `supabase` (versión actual: >=1.1.6)

**Fix Available:**
- `@capacitor/cli` → 2.5.0 (breaking change)
- `supabase` → 0.5.0 (breaking change)

**Recomendación:**
- **NO actualizar** a versiones mayores breaking change sin pruebas exhaustivas
- **Mitigación temporal:** Usar `npm audit fix` para parches menores si están disponibles
- **Monitoreo:** Esperar parches de seguridad no-breaking en `@capacitor/cli` y `supabase`
- **Workaround:** Considerar usar `overrides` en package.json para forzar una versión segura de `tar` si es compatible

---

## 2. Usos de window.open - Análisis de Seguridad

### 2.1 Usos con `noopener,noreferrer` ✅ (Seguros)

```typescript
// lib/tiktok-share.ts:44
window.open(shareUrl.toString(), "_blank", "noopener,noreferrer");
```

### 2.2 Usos sin `noopener,noreferrer` ⚠️ (Requieren hardening)

#### Archivos afectados:

1. **src/pages/Legal.tsx:405**
   ```typescript
   window.open(`/docs/legal/${doc.file}`, "_blank")
   ```
   - **Riesgo:** Medio (URLs internas controladas)
   - **Acción:** Agregar `noopener,noreferrer`

2. **src/pages/Legal.tsx:496**
   ```typescript
   window.open("mailto:legal@complicesconecta.com")
   ```
   - **Riesgo:** Bajo (mailto no tiene contexto de ventana)
   - **Acción:** Agregar `noopener,noreferrer` por consistencia

3. **src/pages/ProjectInfo.tsx:367**
   ```typescript
   window.open(
     "https://github.com/complicesconecta/conecta-social-comunidad",
     "_blank",
   )
   ```
   - **Riesgo:** Alto (URL externa)
   - **Acción:** Agregar `noopener,noreferrer`

4. **src/pages/ProjectInfo.tsx:390**
   ```typescript
   window.open(
     "https://github.com/complicesconecta/conecta-social-comunidad/releases",
     "_blank",
   )
   ```
   - **Riesgo:** Alto (URL externa)
   - **Acción:** Agregar `noopener,noreferrer`

5. **src/pages/LeyOlimpia.tsx:177, 189, 217, 230, 239**
   ```typescript
   window.open("mailto:reportes@complicesconecta.com?subject=Reporte Ley Olimpia", "_blank")
   window.open("https://wa.me/5617184109?text=Reporte%20Ley%20Olimpia", "_blank")
   window.open("https://www.gob.mx/inmujeres/articulos/ley-olimpia", "_blank")
   window.open("https://www.gob.mx/conavim", "_blank")
   window.open("tel:911")
   ```
   - **Riesgo:** Alto (URLs externas)
   - **Acción:** Agregar `noopener,noreferrer` a todos

6. **src/components/wallet/DemoWallet.tsx:486**
   ```typescript
   window.open('https://polygonscan.com', '_blank');
   ```
   - **Riesgo:** Alto (URL externa)
   - **Acción:** Agregar `noopener,noreferrer`

7. **src/components/modals/TermsModalAuth.tsx:25**
   ```typescript
   window.open("/terms", "_blank");
   ```
   - **Riesgo:** Bajo (URL interna)
   - **Acción:** Agregar `noopener,noreferrer` por consistencia

8. **src/components/profiles/shared/DiscoverProfileCard.tsx:65, 67**
   ```typescript
   window.open("/profile-couple", "_blank");
   window.open("/profile-single", "_blank");
   ```
   - **Riesgo:** Bajo (URLs internas)
   - **Acción:** Agregar `noopener,noreferrer` por consistencia

9. **src/components/profiles/shared/ShareProfile.tsx:49, 54**
   ```typescript
   window.open(
     `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
   );
   window.open(
     `https://wa.me/?text=${encodeURIComponent(text + " " + profileUrl)}`,
   );
   ```
   - **Riesgo:** Alto (URLs externas)
   - **Acción:** Agregar `noopener,noreferrer`

10. **src/components/modals/InstallAppModal.tsx:291**
    ```typescript
    window.open(
      "https://github.com/ComplicesConectaSw/ComplicesConecta/releases/download/v.3.3.0/app-release.apk",
      "_blank",
    );
    ```
    - **Riesgo:** Alto (URL externa)
    - **Acción:** Agregar `noopener,noreferrer`

11. **src/components/Footer.tsx:38, 48, 61, 198**
    ```typescript
    window.open("https://facebook.com/complicesconecta", "_blank")
    window.open("https://instagram.com/complicesconecta", "_blank")
    window.open("https://twitter.com/complicesconecta", "_blank")
    window.open("https://wa.me/5617184109", "_blank")
    ```
    - **Riesgo:** Alto (URLs externas)
    - **Acción:** Agregar `noopener,noreferrer` a todos

12. **src/components/admin/UserManagementPanel.tsx:619**
    ```typescript
    window.open(`/profile/${user.id}`, "_blank")
    ```
    - **Riesgo:** Bajo (URL interna)
    - **Acción:** Agregar `noopener,noreferrer` por consistencia

---

## 3. Plan de Acción

### 3.1 Prioridad Alta - window.open hardening

**Objetivo:** Agregar `noopener,noreferrer` a todos los usos de `window.open` para prevenir:
- Tabnapping (la nueva ventana puede acceder a la ventana opener)
- Phishing (la nueva ventana puede manipular la URL de la ventana opener)
- XSS (la nueva ventana puede ejecutar código en el contexto de la ventana opener)

**Acciones:**
1. Crear helper function `safeOpenUrl` que siempre agregue `noopener,noreferrer`
2. Reemplazar todos los usos de `window.open` con el helper
3. Verificar que todos los usos estén cubiertos

### 3.2 Prioridad Media - npm audit mitigación

**Objetivo:** Mitigar vulnerabilidades de `tar` sin breaking changes

**Acciones:**
1. Verificar si hay parches menores disponibles: `npm audit fix`
2. Si no hay parches, considerar usar `overrides` en package.json
3. Documentar que las vulnerabilidades están mitigadas por:
   - Uso controlado de archivos en el código
   - No se descomprimen archivos externos no verificados
   - Validación de rutas de archivos

### 3.3 Prioridad Baja - Supabase MCP configuración

**Objetivo:** Configurar `SUPABASE_ACCESS_TOKEN` para habilitar auditoría de RLS

**Acciones:**
1. Solicitar al usuario que configure `SUPABASE_ACCESS_TOKEN` en variables de entorno
2. Verificar que el token tenga permisos necesarios para auditoría
3. Ejecutar auditoría de RLS en Supabase MCP

---

## 4. Recomendaciones de Seguridad

### 4.1 Para window.open
- **Siempre** usar `noopener,noreferrer` para URLs externas
- **Siempre** usar `noopener,noreferrer` para URLs internas por consistencia
- **Nunca** confiar en que URLs internas sean seguras sin validación
- Considerar usar `target="_self"` para navegación interna en lugar de `_blank`

### 4.2 Para npm audit
- **NO** actualizar a versiones mayores breaking change sin pruebas exhaustivas
- **MONITOREAR** parches de seguridad no-breaking
- **DOCUMENTAR** mitigaciones cuando no se pueden aplicar parches
- **USAR** `overrides` como último recurso

### 4.3 Para Supabase MCP
- **VERIFICAR** que el token tenga permisos mínimos necesarios
- **ROTAR** el token regularmente
- **REVOCAR** el token si se compromete
- **AUDITAR** el acceso al token regularmente

---

## 5. Estado Actual

- **Build:** ✅ `npm run build:check` pasa
- **TypeScript Errors:** 0
- **npm audit:** 3 High (tar, @capacitor/cli, supabase)
- **window.open:** 12 usos sin `noopener,noreferrer`
- **Supabase MCP:** Bloqueado por configuración de `SUPABASE_ACCESS_TOKEN`
