# Bitácora de Debug y Compilación APK - Complices Conecta v4.0.0

## 📌 Ubicación de Artefactos Compilados (APKs)

- **APK Debug (Versión 4.0.0)**:
  - Ruta Raíz: `apks/complicesconecta-debug-4.0.0.apk`
  - Ruta Gradle: `android/app/build/outputs/apk/debug/complicesconecta-debug-4.0.0.apk`
  - *Estado*: Pausada/deshabilitada la protección de pantalla (`FLAG_SECURE`) para permitir captura/grabación durante desarrollo y pruebas locales.

- **APK Release (Versión 4.0.0)**:
  - Ruta Raíz: `apks/ComplicesConecta-Release-4.0.0.apk`
  - Ruta Gradle: `android/app/build/outputs/apk/release/ComplicesConecta-Release-4.0.0.apk`
  - *Estado*: Protección de pantalla (`FLAG_SECURE`) siempre aplicada y activa sin excepción para cumplimiento legal (Ley Olimpia).

---

## 🛠️ Archivos Creados, Modificados y Reemplazados

### 1. `[CREADO]` [debug -apk.md](file:///D:/complices%20conecta/debug%20-apk.md)
- **Acción**: Creado nuevo archivo de documentación.
- **Justificación**: Registro obligatorio en la raíz del proyecto para documentar la ruta de las APKs compiladas, la justificación de cada cambio de archivo, código agregado/modificado/eliminado y control de versiones.

### 2. `[MODIFICADO]` [RELEASE_NOTES_v4.0.0.md](file:///D:/complices%20conecta/RELEASE_NOTES_v4.0.0.md)
- **Acción**: Modificado para agregar las bitácoras de cambios de la versión v4.0.0.
- **Justificación**: Cumplir con la regla de documentación continua de release notes con la fecha, hora, justificación técnica y lista de cambios realizados.

### 3. `[MODIFICADO]` [src/main.tsx](file:///D:/complices%20conecta/src/main.tsx)
- **Acción**: Modificado. Se reemplazó el `throw new Error` fatal en la validación temprana de variables de entorno por un `console.warn`.
- **Justificación**: Corregir la causa raíz por la cual la app se quedaba congelada en el degradado de la pantalla de inicio. Al compilar para producción sin variables de Supabase en el build, el `throw` no atrapado detenía la ejecución del script principal a nivel superior de JS antes de montar React, dejando la pantalla en blanco/fondo CSS. Al usar `console.warn`, el renderizado continúa normalmente y entra en modo demo/stub sin bloquear la app.

### 4. `[MODIFICADO]` [vite.config.ts](file:///D:/complices%20conecta/vite.config.ts)
- **Acción**: Modificado. Cambiado el `target` de compilación de `"esnext"` a `"es2020"`.
- **Justificación**: Garantizar la máxima compatibilidad del bundle de JavaScript generado para todos los motores Android WebView (Android 10 hasta Android 16/17), evitando fallos por sintaxis JS avanzada no soportada en versiones de WebView.

### 5. `[MODIFICADO]` [index.html](file:///D:/complices%20conecta/index.html)
- **Acción**: Modificado. Removido el tag `<link rel="modulepreload" href="/src/main.tsx" />`.
- **Justificación**: Evitar la generación de enlaces preload rotos hacia archivos `.tsx` en el archivo `dist/index.html` compilado final.

### 6. `[MODIFICADO]` [android/variables.gradle](file:///D:/complices%20conecta/android/variables.gradle)
- **Acción**: Modificado. Actualizado `targetSdkVersion = 36` (anteriormente `35`).
- **Justificación**: Garantizar compatibilidad directa con Android 16 (API 36 / Baklava) y Android 17 sin advertencias de compatibilidad del sistema.

### 7. `[MODIFICADO]` [android/app/build.gradle](file:///D:/complices%20conecta/android/app/build.gradle)
- **Acción**: Modificado.
  - Actualizados `versionCode = 400` y `versionName = "4.0.0"`.
  - Añadido `buildFeatures { buildConfig = true }`.
  - Configurado el bloque `androidComponents` para nombrar las APKs compiladas:
    - Debug: `complicesconecta-debug-4.0.0.apk`
    - Release: `ComplicesConecta-Release-4.0.0.apk`
- **Justificación**: Paridad de versión v4.0.0 en ambos artefactos, generación automática de `BuildConfig.DEBUG` para Java y estandarización de nombres de salida de las APKs.

### 8. `[MODIFICADO]` [android/app/src/main/java/com/complicesconecta/app/MainActivity.java](file:///D:/complices%20conecta/android/app/src/main/java/com/complicesconecta/app/MainActivity.java)
- **Acción**: Modificado.
  - Condicionada la bandera `FLAG_SECURE` con `BuildConfig.DEBUG`. En modo Debug ejecuta `getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE)` y en Release aplica `setFlags(FLAG_SECURE)`.
- **Justificación**: Deshabilitar/pausar la protección de capturas de pantalla y grabación en modo Debug para facilitar pruebas de desarrollo, manteniéndola siempre activa en Release para cumplimiento legal (Ley Olimpia).

### 9. `[MODIFICADO]` [android/app/src/main/java/com/complicesconecta/app/ContentProtectionPlugin.java](file:///D:/complices%20conecta/android/app/src/main/java/com/complicesconecta/app/ContentProtectionPlugin.java)
- **Acción**: Modificado.
  - Actualizada la función `@PluginMethod enableScreenProtection` para verificar `BuildConfig.DEBUG`. En Debug desactiva `FLAG_SECURE` y en Release lo habilita.
- **Justificación**: Coherencia entre el plugin nativo de protección de pantalla y el comportamiento global de la app según el variant de compilación (Debug vs Release).

### 10. `[MODIFICADO]` [package.json](file:///D:/complices%20conecta/package.json)
- **Acción**: Modificado. Agregado el script de comandos `"build:apks": "node scripts/build-apks.cjs"`.
- **Justificación**: Facilitar el proceso automatizado de limpieza de APKs obsoletas y re-compilación de ambas versiones en un solo comando npm.
