# 📋 WORKPLAN - Administración de Clubs y Aspectos Legales

**Fecha:** 26 de Enero, 2026  
**Versión:** 1.0  
**Responsable:** Equipo CómplicesConecta  
**Estado:** En Progreso

---

## 🎯 OBJETIVO GENERAL

Desarrollar sistema completo de administración para clubs con robustez legal, incluyendo:

1. Investigación y solución de problemas de creación/eliminación de usuarios
2. Panel de administración para clubs con funcionalidades completas  
3. IDs únicos y nombres irrepetibles para clubs
4. Documentación legal integral para clubs y usuarios

---

## ✅ COMPLETADO - 26 Ene 2026

### 1. Auditoría Supabase y Migraciones
- **Estado:** ✅ COMPLETADO
- **Logros:**
  - Auditoría completa de referencias en src/
  - Creación de 7 tablas/views faltantes
  - Implementación de 20 políticas RLS robustas
  - Migraciones idempotentes y seguras
  - Base de datos local funcional

### 2. Documentación Legal para Clubs
- **Estado:** ✅ COMPLETADO
- **Documentos creados:**
  - `legal/CLUBS_TERMS_AND_CONSENTS.md` - Términos y consentimientos
  - `docs/legal/CLUBS_PRIVACY_POLICY.md` - Política de privacidad específica
  - `docs/Clubs/CLUBS_LEGAL_DISCLAIMER.md` - Deslinde de responsabilidad

### 3. Build y Verificaciones
- **Estado:** ✅ COMPLETADO
- **Logros:**
  - Build, lint, tests y Android sync pasando
  - Commit `0df11ce1` push a master
  - App.tsx imports verificados y correctos

---

## 🚧 PENDIENTES POR IMPLEMENTAR

### 🔍 1. Investigación de Problemas de Creación/Eliminación Usuarios
**Prioridad:** ALTA  
**Estado:** PENDIENTE  
**Descripción:**
- Investigar y solucionar problemas de creación/eliminación de usuarios desde dashboard Supabase
- Identificar causas raíz (políticas, RLS, triggers, constraints, functions)
- Implementar medidas preventivas

**Tareas específicas:**
- [ ] Analizar logs de errores de creación de usuarios en Supabase Dashboard
- [ ] Revisar políticas RLS de auth.users y tablas relacionadas
- [ ] Verificar triggers que se ejecutan al crear/eliminar usuarios
- [ ] Identificar constraints que bloquean operaciones
- [ ] Revisar functions que puedan interferir con user management
- [ ] Implementar solución robusta y preventiva
- [ ] Documentar causa raíz y solución aplicada
- [ ] Crear tests para prevenir regresiones

**Archivos a investigar:**
- `supabase/migrations/` - triggers y constraints
- `src/services/auth/` - lógica de autenticación
- `src/types/supabase-generated.ts` - referencias a usuarios

---

### 🛠️ 2. Panel de Administración de Clubs
**Prioridad:** ALTA  
**Estado:** PENDIENTE  
**Descripción:**
- Desarrollar panel completo en `src/components/admin/panels`
- Funcionalidades CRUD para clubs
- Distinción clara entre permisos de admin y propietario

**Tareas específicas:**
- [ ] Crear estructura de directorios `src/components/admin/panels/`
- [ ] Implementar componente principal `ClubAdminPanel.tsx`
- [ ] Funcionalidad de búsqueda y filtrado de clubs
- [ ] CRUD completo (Crear, Leer, Actualizar, Eliminar) clubs
- [ ] Vista detallada de club con toda la información
- [ ] Sistema de suspensión/activación de clubs
- [ ] Gestión de actividad y estadísticas del club
- [ ] Permisos diferenciados (admin vs owner)
- [ ] Integración con Supabase Realtime para actualizaciones
- [ ] Sistema de logs de acciones administrativas

**Componentes a crear:**
```
src/components/admin/panels/
├── ClubAdminPanel.tsx
├── ClubSearch.tsx
├── ClubForm.tsx
├── ClubDetails.tsx
├── ClubSuspension.tsx
└── ClubActivityLogs.tsx
```

---

### 🔐 3. IDs Únicos y Nombres Irrepetibles para Clubs
**Prioridad:** MEDIA  
**Estado:** PENDIENTE  
**Descripción:**
- Implementar constraints de base de datos
- Validación en UI para nombres únicos
- Sistema de IDs irrepetibles

**Tareas específicas:**
- [ ] Verificar constraint UNIQUE en clubs.name (ya existe)
- [ ] Implementar validación en tiempo real en UI
- [ ] Sistema de sugerencias de nombres alternativos
- [ ] Validación de IDs únicos generados
- [ ] Manejo elegante de conflictos de nombres
- [ ] Mensajes de error claros para usuarios
- [ ] Integración con formulario de creación de clubs

---

### 📄 4. Sistema de Consentimientos Legales
**Prioridad:** ALTA  
**Estado:** PARCIAL (documentos creados, falta UI)  
**Descripción:**
- Implementar checkboxes obligatorios en UI
- Sistema de registro de aceptaciones
- Integración con documentos legales creados

**Tareas específicas:**
- [ ] Crear componente `LegalConsentCheckbox.tsx`
- [ ] Implementar en formularios de registro de clubs
- [ ] Sistema de registro de aceptaciones en base de datos
- [ ] Timestamps de aceptación
- [ ] Versión de documentos aceptados
- [ ] Sistema de revocación de consentimientos
- [ ] Integración con perfiles de usuarios

---

### 🔧 5. Corrección App.tsx Imports
**Prioridad:** BAJA  
**Estado:** ✅ COMPLETADO  
**Logros:**
- Imports verificados y funcionales correctamente
- `import "@/styles/android-grid.css"` ✅
- `import { BrowserRouter as Router, Routes, Route } from "react-router-dom"` ✅

---

## 📋 CRONOGRAMA ESTIMADO

### Semana 1 (27 Ene - 2 Feb)
- [ ] Investigación problemas usuarios Supabase
- [ ] Inicio desarrollo panel administración

### Semana 2 (3 Feb - 9 Feb)  
- [ ] Completar panel administración clubs
- [ ] Implementar IDs únicos y validación

### Semana 3 (10 Feb - 16 Feb)
- [ ] Sistema de consentimientos legales
- [ ] Tests y documentación final

---

## 🎯 CRITERIOS DE ÉXITO

1. **Usuarios Supabase:** Creación/eliminación funciona sin errores
2. **Panel Admin:** CRUD completo funcional con permisos diferenciados
3. **IDs Únicos:** Sistema robusto sin conflictos
4. **Legal:** Consentimientos implementados y registrados
5. **Tests:** Cobertura completa para nuevas funcionalidades
6. **Documentación:** Guías de uso y mantenimiento actualizadas

---

## 📊 MÉTRICAS DE SEGUIMIENTO

- **Tiempo de respuesta panel admin:** < 2s
- **Tasa de error creación usuarios:** < 1%
- **Conflictos nombres clubs:** 0%
- **Adopción consentimientos:** 100%
- **Cobertura tests:** > 90%

---

## 🚀 PRÓXIMOS PASOS

1. **Inmediato:** Investigar logs Supabase para problemas usuarios
2. **Corto plazo:** Desarrollar MVP panel administración
3. **Mediano plazo:** Implementar sistema legal completo
4. **Largo plazo:** Optimización y escalabilidad

---

**Última actualización:** 26 Ene 2026  
**Próxima revisión:** 2 Feb 2026
