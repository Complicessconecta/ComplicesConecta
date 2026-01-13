# 🏢 Plan de Desarrollo - Perfiles de Clubs en ComplicesConecta

**Fecha:** 12 de Enero, 2026  
**Versión:** 1.0  
**Estado:** Planificación

---

## 📋 Índice

1. [Objetivo General](#objetivo-general)
2. [Ventajas de Vinculación con ComplicesConecta](#ventajas-de-vinculación-con-complicesconecta)
3. [Sección Próximamente](#sección-próximamente)
4. [Perfil Demo para Clubs](#perfil-demo-para-clubs)
5. [Sistema de Descuentos Premium](#sistema-de-descuentos-premium)
6. [Estructura de Base de Datos](#estructura-de-base-de-datos)
7. [Roadmap de Implementación](#roadmap-de-implementación)

---

## 🎯 Objetivo General

Crear un sistema de perfiles exclusivos para clubs verificados en ComplicesConecta, similar a los perfiles de usuarios (single/couple), pero adaptado para negocios de entretenimiento nocturno, con funcionalidades de publicidad, NFTs y tokens.

---

## ✨ Ventajas de Vinculación con ComplicesConecta

### Para los Clubs

1. **Página Pública Profesional**
   - URL única: `/clubs/{slug}`
   - Diseño personalizable con branding del club
   - Galería de fotos y videos
   - Calendario de eventos
   - Sistema de check-ins geolocalizados

2. **Sistema de Reseñas Verificadas**
   - Solo usuarios con check-in real pueden reseñar
   - Reseñas auténticas y verificadas
   - Rating promedio visible públicamente

3. **Publicidad Premium**
   - Destacado en Discover
   - Banners promocionales
   - Promoción de eventos VIP
   - Paquetes publicitarios personalizados

4. **Integración con Tokens CMPX/GTK**
   - Aceptación de tokens como pago
   - Sistema de recompensas para usuarios
   - Descuentos exclusivos para holders

5. **Flyers Editables con IA**
   - Watermark automático
   - Blur en imágenes sensibles
   - Moderación antes de publicar

6. **Analytics y Estadísticas**
   - Visitas a la página del club
   - Check-ins por día/semana/mes
   - Engagement de usuarios
   - Demografía de visitantes

### Para los Usuarios

1. **Descuentos Exclusivos**
   - Descuentos en entrada con CMPX
   - Beneficios premium para holders de GTK
   - Promociones especiales para usuarios verificados

2. **Check-ins Verificados**
   - Sistema geolocalizado (radio 50m)
   - WorldID para verificación
   - Historial de visitas

3. **Reseñas Auténticas**
   - Solo usuarios reales pueden reseñar
   - Sistema de likes en reseñas
   - Reporte de reseñas falsas

4. **Eventos VIP**
   - Acceso anticipado a eventos
   - Entradas exclusivas con tokens
   - Meet & greets

---

## 🚀 Sección Próximamente

### Contenido de la Sección

**En la página de Clubs:**
```
🚀 Próximamente en ComplicesConecta

✅ Clubs en Perfiles
   - Los clubs verificados podrán tener su propio perfil profesional
   - Similar a los perfiles de usuarios (single/couple)
   - Galería de fotos, videos, eventos
   - Sistema de check-ins y reseñas

✅ Sistema de Descuentos Premium
   - Descuentos en entrada con CMPX
   - Beneficios exclusivos para holders de GTK
   - Promociones especiales para usuarios premium

✅ NFTs de Clubs
   - Perfiles verificados como NFTs
   - Coleccionables exclusivos de clubs
   - Mercado secundario de NFTs

✅ Integración con Tokens
   - Aceptación de CMPX como pago
   - Sistema de recompensas
   - Staking de tokens en clubs

📅 Lanzamiento estimado: Q2 2026
```

**En los perfiles de usuarios:**
- Sección de "Clubs Favoritos"
- Historial de check-ins
- Reseñas escritas
- Descuentos disponibles

---

## 🏢 Perfil Demo para Clubs

### Estructura del Perfil

Basado en `ProfileSingle.tsx` y `ProfileCouple.tsx`, pero adaptado para clubs:

#### Componentes Principales

1. **Header del Club**
   - Logo del club
   - Nombre del club
   - Badge de verificado
   - Rating promedio
   - Número de check-ins
   - Botón de "Seguir Club"

2. **Hero Section**
   - Imagen de portada (cover)
   - Información básica del club
   - Ubicación con mapa
   - Horarios de operación
   - Capacidad

3. **Galería Multimedia**
   - Fotos del club
   - Videos promocionales
   - Flyers de eventos
   - Watermark automático con IA

4. **Información del Club**
   - Descripción detallada
   - Tipo de club (bar, lounge, antro, etc.)
   - Música/ambiente
   - Dress code
   - Edad mínima

5. **Eventos y Promociones**
   - Calendario de eventos
   - Eventos VIP
   - Promociones actuales
   - Descuentos con tokens

6. **Sistema de Check-ins**
   - Botón de check-in geolocalizado
   - Historial de check-ins
   - Usuarios que han hecho check-in recientemente

7. **Reseñas**
   - Lista de reseñas verificadas
   - Sistema de likes en reseñas
   - Promedio de ratings
   - Filtros por fecha/rating

8. **NFTs del Club**
   - NFTs exclusivos del club
   - Coleccionables
   - Mercado secundario
   - Staking de NFTs

9. **Tokens y Descuentos**
   - Aceptación de CMPX
   - Descuentos con GTK
   - Promociones premium
   - Sistema de recompensas

10. **Panel de Administración (Solo Dueño)**
    - Editar perfil
    - Subir fotos/videos
    - Crear eventos
    - Gestionar promociones
    - Ver analytics
    - Responder reseñas

### Permisos del Dueño

- Edición completa del perfil
- Subida de contenido multimedia
- Creación de eventos
- Gestión de promociones
- Respuesta a reseñas
- Acceso a analytics
- Configuración de NFTs/tokens

### Template de Perfil

```
/src/pages/clubs/ClubProfile.tsx
/src/components/clubs/ClubProfileHeader.tsx
/src/components/clubs/ClubProfileGallery.tsx
/src/components/clubs/ClubProfileEvents.tsx
/src/components/clubs/ClubProfileReviews.tsx
/src/components/clubs/ClubProfileAdmin.tsx
```

---

## 💰 Sistema de Descuentos Premium

### Tipos de Descuentos

1. **Descuentos con CMPX**
   - 10% de descuento en entrada
   - 20% en bebidas
   - 15% en eventos VIP

2. **Descuentos con GTK (Holders)**
   - 25% de descuento en entrada
   - 30% en bebidas
   - 50% en eventos VIP
   - Acceso prioritario

3. **Descuentos Premium (Suscriptores)**
   - 30% de descuento en entrada
   - 40% en bebidas
   - 60% en eventos VIP
   - Mesa reservada gratuita

### Implementación

```typescript
interface ClubDiscount {
  id: string;
  clubId: string;
  type: 'cmpx' | 'gtk' | 'premium';
  discountPercentage: number;
  appliesTo: 'entry' | 'drinks' | 'vip' | 'all';
  minTokens: number;
  maxDiscount: number;
  expiresAt?: Date;
  isActive: boolean;
}
```

### Validación de Descuentos

- Verificar balance de tokens del usuario
- Validar que el club acepte el tipo de token
- Aplicar descuento al momento del pago
- Registrar transacción en blockchain

---

## 🗄️ Estructura de Base de Datos

### Tablas Nuevas

1. **club_profiles**
   - Información del perfil del club
   - Similar a profiles pero para clubs

2. **club_events**
   - Eventos del club
   - Fechas, precios, capacidad

3. **club_discounts**
   - Descuentos ofrecidos por el club
   - Tipo de token, porcentaje, condiciones

4. **club_check_ins**
   - Check-ins de usuarios en clubs
   - Geolocalización, timestamp

5. **club_reviews**
   - Reseñas de clubs
   - Solo usuarios con check-in

6. **club_nfts**
   - NFTs creados por clubs
   - Metadata, precio, owner

7. **club_followers**
   - Usuarios que siguen clubs
   - Notificaciones de eventos

### Tablas Existentes a Modificar

- **profiles**: Agregar campo `favorite_clubs`
- **transactions**: Agregar campo `club_id` para pagos en clubs
- **nfts**: Agregar campo `club_id` para NFTs de clubs

---

## 📅 Roadmap de Implementación

### Fase 1: Preparación (Semana 1-2)
- [x] Crear tabla `club_applications`
- [x] Implementar formulario de registro
- [x] Sistema de envío de emails
- [ ] Crear tabla `club_profiles`
- [ ] Crear tablas relacionadas (events, discounts, etc.)
- [ ] Regenerar tipos de Supabase

### Fase 2: Perfil Demo (Semana 3-4)
- [ ] Crear `ClubProfile.tsx` base
- [ ] Implementar header del club
- [ ] Crear galería multimedia
- [ ] Agregar sección de información
- [ ] Implementar check-ins geolocalizados
- [ ] Sistema de reseñas verificadas

### Fase 3: Panel de Administración (Semana 5-6)
- [ ] Crear `ClubProfileAdmin.tsx`
- [ ] Edición de perfil
- [ ] Subida de contenido
- [ ] Creación de eventos
- [ ] Gestión de descuentos
- [ ] Analytics dashboard

### Fase 4: Tokens y NFTs (Semana 7-8)
- [ ] Integración con CMPX
- [ ] Sistema de descuentos
- [ ] Creación de NFTs de clubs
- [ ] Mercado secundario
- [ ] Staking de NFTs

### Fase 5: Testing y Lanzamiento (Semana 9-10)
- [ ] Testing completo
- [ ] Corrección de bugs
- [ ] Documentación
- [ ] Lanzamiento beta
- [ ] Feedback y mejoras

---

## 📝 Notas Importantes

1. **Permisos de Edición**
   - Solo el dueño del club puede editar
   - Validación de identidad antes de permitir edición
   - Log de cambios en el perfil

2. **Moderación de Contenido**
   - Fotos/videos moderados por IA
   - Watermark automático
   - Blur en imágenes sensibles
   - Aprobación manual si es necesario

3. **Cumplimiento Legal**
   - Verificación de licencias
   - Cumplimiento con regulaciones locales
   - Términos y condiciones
   - Política de privacidad

4. **Integración con Tokens**
   - Verificación de balance en blockchain
   - Transacciones seguras
   - Registro de todas las operaciones
   - Sistema de reversiones si es necesario

---

**Última actualización:** 12 de Enero, 2026  
**Versión:** 1.0  
**Estado:** Planificación
