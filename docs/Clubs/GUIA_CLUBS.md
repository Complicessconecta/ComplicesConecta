# 🏢 GUÍA PARA CLUBS Y PARTNERS - ComplicesConecta v3.6.3

**Fecha:** 08 de Noviembre, 2025  
**Versión:** 3.6.3  
**Estado:** ✅ **DOCUMENTACIÓN OFICIAL**

---

## 🎯 Sistema de Clubs Verificados

**ComplicesConecta** cuenta con un sistema de clubs verificados con watermark automático en imágenes. Los check-ins geolocalizados y las reseñas verificadas son funcionalidad **planeada (próximamente)**, no implementada todavía: en beta/demo las reseñas están abiertas y el formulario publica sin verificación de check-in (ver "Check-ins Geolocalizados" abajo).

> **Ronda 15, stream D — decisión D2 (2026-11-26, por delegación de Wacko):** la regla "solo usuarios con check-in real verificado (50 m, WorldID) pueden reseñar" pasa a estado **PLANEADO**. La guía afirmaba el gate como implementado, pero el código no lo tiene: el formulario de reseñas (`ClubProfileReviews`) publica sin ninguna comprobación de check-in y el check-in (`handleCheckIn`, `Clubs.tsx`) es un stub sin verificación de distancia ni persistencia. El gate verificado se implementa en una release posterior, una vez integrado WorldID (depende de valores del Portal de World que aún no están). Hasta entonces, esta guía dice la verdad de hoy y el copy de la app no promete un gate que no existe.

---

## ✅ Proceso de Verificación

### Requisitos

1. **Club Real:** Club físico con ubicación verificable
2. **Documentación:** Documentos legales del club
3. **Verificación:** Proceso de verificación por el equipo
4. **Aprobación:** Aprobación y asignación de slug único

### Beneficios

- **Página Pública:** `/clubs/{slug}` con información del club
- **Check-ins:** Planeado (próximamente) — check-in geolocalizado verificado
- **Reseñas:** En beta/demo, abiertas a todos los usuarios (sin verificación de check-in); las reseñas verificadas con check-in real llegan con el gate planeado
- **Flyers:** Flyers editables con watermark automático
- **Publicidad:** Oportunidades de publicidad en la plataforma

---

## 📍 Check-ins Geolocalizados

> **Estado: PLANEADO (próximamente), no implementado.** Decisión D2, ronda 15 (2026-11-26). En beta/demo NO hay verificación de check-in: el formulario de reseñas publica sin comprobarlo y el botón de check-in no verifica distancia ni persiste ningún registro. El sistema verificado llega en una release posterior, una vez integrado WorldID.

### Sistema de Verificación (diseño planeado)

- **Radio:** 50 metros del club
- **Verificación:** Automática mediante geolocalización
- **WorldID:** Requerido para check-in verificado (integración pendiente)
- **Reseñas:** Cuando el gate esté implementado, solo usuarios con check-in real podrán reseñar; hoy las reseñas están abiertas en beta/demo

---

## 🎨 Flyers Editables

### Características

- **Edición:** Los clubs pueden editar sus flyers
- **Watermark:** Watermark automático con IA
- **Blur:** Blur automático en imágenes sensibles
- **Moderación:** Flyers moderados antes de publicar

---

## 📊 Publicidad para Clubs

### Oportunidades

- **Banners:** Banners publicitarios en la plataforma
- **Eventos:** Promoción de eventos VIP
- **Featured:** Clubs destacados en Discover
- **Paquetes:** Paquetes publicitarios personalizados

---

## 📞 Contacto para Partners/Clubs

**Email:** partners@complicesconecta.com  
**Aplicación:** `/clubs/apply`  
**Documentación:** [Documentación Maestra Unificada](./DOCUMENTACION_MAESTRA_UNIFICADA_v3.6.3.md)

---

## 📚 Documentación Relacionada

- **[Documentación Maestra Unificada](./DOCUMENTACION_MAESTRA_UNIFICADA_v3.6.3.md)** - Sección "Sistema de Clubs Verificados"
- **[Diagramas de Flujo](../DIAGRAMAS_FLUJOS_v3.5.0.md)** - Flujos de verificación y check-ins

---

**Última actualización:** 08 de Noviembre, 2025  
**Versión:** 3.6.3  
**Estado:** ✅ **DOCUMENTACIÓN OFICIAL**
