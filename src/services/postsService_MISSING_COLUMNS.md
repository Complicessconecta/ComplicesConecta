# Reporte de Columnas Faltantes

**Archivo:** `c:\Users\conej\Documents\conecta-social-comunidad-main\src\services\postsService.ts`

## Descripción
El servicio `postsService.ts` intenta consultar la tabla `stories` solicitando columnas que no existen en la definición de tipos actual (`types.ts`) ni en el esquema conocido.

## Columnas Faltantes en tabla `stories`

1. **description** (Se usa como alias `description as content`)
   - **Uso:** Contenido de texto del post/historia.
   - **Estado actual:** Existe `caption`, pero el servicio espera `description`.
   - **Justificación:** Necesaria para almacenar el texto principal de la publicación si `caption` no es suficiente o si se desea estandarizar con otros tipos de contenido.

2. **content_type** (Se usa como alias `content_type as post_type`)
   - **Uso:** Determina si es 'text', 'photo' o 'video'.
   - **Estado actual:** Existe `media_type`, pero el servicio espera `content_type`.
   - **Justificación:** Necesaria para clasificar explícitamente el tipo de publicación para el feed.

3. **media_urls** (Array de strings)
   - **Uso:** URLs de los medios adjuntos.
   - **Estado actual:** Existe `media_url` (singular, string), pero el servicio espera un array.
   - **Justificación:** Necesaria para soportar múltiples imágenes o medios en una sola historia/post (carrusel).

4. **location**
   - **Uso:** Ubicación geográfica o nombre del lugar.
   - **Estado actual:** No existe en `stories`.
   - **Justificación:** Requerida para mostrar la ubicación en el feed y permitir filtrado por geolocalización.

5. **views_count**
   - **Uso:** Contador de visualizaciones.
   - **Estado actual:** No existe en `stories`.
   - **Justificación:** Métrica clave para análisis de engagement y popularidad.

## Impacto Esperado
- **Sin corrección:** El servicio `postsService.ts` fallará al intentar seleccionar columnas inexistentes, rompiendo el feed de noticias.
- **Con corrección (Crear columnas):** Permitirá que el feed funcione correctamente con soporte para ubicaciones, múltiples medios y métricas de visualización.
