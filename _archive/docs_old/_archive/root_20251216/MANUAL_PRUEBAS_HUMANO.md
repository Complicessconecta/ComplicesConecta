# 🧪 MANUAL DE PRUEBAS HUMANAS - ComplicesConecta v3.8.0

**Fecha:** 14 de Diciembre, 2025  
**Versión:** v3.8.0 (Post-Rehabilitación)  
**Estado:** Build Validado ✅ - Listo para QA Manual

---

## 📋 Introducción

Este documento contiene **5 pruebas manuales críticas** que DEBEN ejecutarse después de que el build pase en CI/CD. Estas pruebas validan que la arquitectura Vite SPA funciona correctamente en escenarios reales de usuario.

**Duración estimada:** 15-20 minutos  
**Requisitos:** Navegador moderno (Chrome, Firefox, Safari), cuenta de prueba en Supabase

---

## ✅ PRUEBA 1: Login/Registro (Supabase Auth)

**Objetivo:** Validar que la autenticación funciona correctamente con Supabase.

### Pasos:

1. **Abrir la aplicación:**
   ```
   npm run dev
   # Acceder a http://localhost:8080
   ```

2. **Ir a la página de registro:**
   - Click en "Registrarse" o navegar a `/auth/register`
   - Verificar que el formulario carga correctamente

3. **Completar registro:**
   - Email: `test-user-$(date +%s)@test.com`
   - Contraseña: `TestPassword123!`
   - Aceptar términos y condiciones
   - Click en "Registrarse"

4. **Validaciones esperadas:**
   - ✅ No hay errores en la consola del navegador
   - ✅ Se envía email de confirmación (revisar spam)
   - ✅ Usuario se crea en Supabase (verificar en Dashboard)
   - ✅ Redirección a página de bienvenida o dashboard

5. **Prueba de Login:**
   - Logout (si es necesario)
   - Ir a `/auth/login`
   - Ingresar credenciales
   - Verificar que se redirige a dashboard

### ❌ Errores a reportar:
- Errores de TypeScript en consola
- Fallos en validación de formulario
- Errores de Supabase (401, 500, etc.)
- Redirecciones incorrectas

---

## ✅ PRUEBA 2: Navegación y Ruteo (React Router)

**Objetivo:** Validar que React Router funciona correctamente en Vite SPA.

### Pasos:

1. **Navegar entre páginas principales:**
   - `/` (Home)
   - `/discover` (Descubrir)
   - `/dashboard` (Dashboard)
   - `/profile` (Perfil)
   - `/chat` (Chat)

2. **Validaciones esperadas:**
   - ✅ Las URLs cambian correctamente
   - ✅ El contenido se carga sin recargar la página
   - ✅ Los estilos Tailwind se aplican correctamente
   - ✅ No hay errores en la consola

3. **Prueba de navegación hacia atrás:**
   - Navegar a 3 páginas diferentes
   - Click en botón "Atrás" del navegador
   - Verificar que la historia se mantiene

4. **Prueba de rutas protegidas:**
   - Logout
   - Intentar acceder a `/dashboard`
   - Verificar redirección a `/auth/login`

### ❌ Errores a reportar:
- Rutas que no cargan
- Errores 404 inesperados
- Pérdida de estado al navegar
- Estilos rotos en alguna página

---

## ✅ PRUEBA 3: Chat en Tiempo Real (Websockets)

**Objetivo:** Validar que Supabase Realtime funciona correctamente.

### Pasos:

1. **Abrir chat:**
   - Navegar a `/chat`
   - Seleccionar una conversación existente (o crear una nueva)

2. **Enviar mensaje:**
   - Escribir un mensaje de prueba
   - Click en "Enviar"
   - Verificar que el mensaje aparece inmediatamente

3. **Validaciones esperadas:**
   - ✅ El mensaje se envía sin errores
   - ✅ El mensaje aparece en la lista de mensajes
   - ✅ El timestamp se muestra correctamente
   - ✅ No hay errores de WebSocket en la consola

4. **Prueba de sincronización (opcional):**
   - Abrir el chat en otra pestaña/navegador
   - Enviar mensaje desde una pestaña
   - Verificar que aparece en la otra pestaña en tiempo real

### ❌ Errores a reportar:
- Mensajes no se envían
- Errores de conexión WebSocket
- Mensajes duplicados
- Timestamps incorrectos

---

## ✅ PRUEBA 4: Visualización de Perfil (Estilos Tailwind)

**Objetivo:** Validar que Tailwind CSS se aplica correctamente en toda la aplicación.

### Pasos:

1. **Navegar al perfil:**
   - Click en el avatar o ir a `/profile`

2. **Validaciones visuales:**
   - ✅ Los colores se aplican correctamente (gradientes, fondos)
   - ✅ El layout es responsive (probar en mobile, tablet, desktop)
   - ✅ Los iconos de Lucide se muestran correctamente
   - ✅ Las animaciones funcionan (hover, transiciones)

3. **Prueba de edición de perfil:**
   - Click en "Editar Perfil"
   - Cambiar información (nombre, bio, foto)
   - Guardar cambios
   - Verificar que los cambios se persisten

4. **Prueba de galería de imágenes:**
   - Subir una imagen
   - Verificar que se muestra correctamente
   - Verificar que se aplican estilos (bordes, sombras, etc.)

### ❌ Errores a reportar:
- Estilos rotos o no aplicados
- Layout roto en dispositivos móviles
- Imágenes no se cargan
- Animaciones no funcionan

---

## ✅ PRUEBA 5: Carga de Imágenes (Bucket Policies)

**Objetivo:** Validar que el almacenamiento de imágenes funciona correctamente.

### Pasos:

1. **Subir imagen a galería:**
   - Navegar a `/profile` o `/gallery`
   - Click en "Subir Imagen"
   - Seleccionar una imagen local (JPG, PNG)
   - Esperar a que se cargue

2. **Validaciones esperadas:**
   - ✅ La imagen se sube sin errores
   - ✅ La imagen aparece en la galería
   - ✅ La URL de la imagen es accesible
   - ✅ Se aplican transformaciones (resize, blur si es privada)

3. **Prueba de permisos:**
   - Imagen pública: Verificar que es accesible sin autenticación
   - Imagen privada: Verificar que requiere autenticación
   - Imagen de otro usuario: Verificar que no se puede acceder

4. **Prueba de eliminación:**
   - Click en "Eliminar" en una imagen
   - Verificar que se elimina de la galería
   - Verificar que se elimina del bucket de Supabase

### ❌ Errores a reportar:
- Errores al subir imagen
- Imagen no aparece después de subir
- Problemas de permisos (acceso incorrecto)
- Imágenes no se eliminan correctamente

---

## 📊 Checklist de Validación

Después de completar las 5 pruebas, marcar los siguientes puntos:

- [ ] **Prueba 1 (Auth):** PASADA ✅ / FALLIDA ❌
- [ ] **Prueba 2 (Ruteo):** PASADA ✅ / FALLIDA ❌
- [ ] **Prueba 3 (Chat):** PASADA ✅ / FALLIDA ❌
- [ ] **Prueba 4 (Estilos):** PASADA ✅ / FALLIDA ❌
- [ ] **Prueba 5 (Imágenes):** PASADA ✅ / FALLIDA ❌

**Resultado Final:**
- [ ] ✅ TODAS LAS PRUEBAS PASADAS - Listo para producción
- [ ] ⚠️ ALGUNAS PRUEBAS FALLIDAS - Reportar bugs

---

## 🐛 Reporte de Bugs

Si alguna prueba falla, completar esta sección:

### Bug #1
- **Prueba:** [Número de prueba]
- **Descripción:** [Qué salió mal]
- **Pasos para reproducir:** [Cómo repetir el error]
- **Resultado esperado:** [Qué debería pasar]
- **Resultado actual:** [Qué pasó en realidad]
- **Capturas de pantalla:** [Si es posible]
- **Consola del navegador:** [Errores de JavaScript]

---

## 📞 Contacto y Soporte

Si encuentras problemas durante las pruebas:

1. **Revisar la consola del navegador** (F12 → Console)
2. **Revisar logs de Supabase** (Dashboard → Logs)
3. **Revisar logs de Vercel** (si está deployado)
4. **Reportar en GitHub Issues** con detalles completos

---

## ✅ Checklist de Cierre

Después de completar todas las pruebas:

- [ ] Todas las pruebas pasadas
- [ ] No hay errores en consola
- [ ] Estilos Tailwind aplicados correctamente
- [ ] Supabase Auth funcionando
- [ ] Realtime Chat funcionando
- [ ] Carga de imágenes funcionando
- [ ] Documentación actualizada
- [ ] Commit y push a master

---

**Estado:** 🚀 **LISTO PARA PRODUCCIÓN**

*Documento generado: 14 de Diciembre, 2025*
