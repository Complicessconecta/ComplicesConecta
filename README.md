
              Cómplices Conecta (v3.7.0 - Privacy & UI Polish) 🚀
✅ VERSIÓN ESTABLE: v3.7.0 - Privacy Enhanced, UI Polished, Assets Standardized (2025-12-18). Arquitectura consolidada y optimizada.

📋 Descripción
Plataforma social AI-Native diseñada para comunidades privadas, integrando verificación de identidad, economía de tokens (Web3) y algoritmos de matching social avanzados.
🛠️ Stack Tecnológico
Frontend: React, TypeScript, Vite, TailwindCSS.
Backend: Supabase (Auth, DB, Realtime), Edge Functions.
Data Science: Neo4j (Graph DB) para conexiones sociales y recomendaciones.


AI: Integración para moderación y resúmenes de chat.
Testing: Playwright (E2E) y Jest.
## 🚧 Estado del Proyecto
Actualmente estoy trabajando en:
[ ] Refactorización de la estructura de carpetas en /src.
[ ] Optimización de las consultas a Neo4j.
[X] Limpieza de código muerto y comentarios legacy.
[x] Implementación de Tests E2E críticos (Completado).
[x] Correcciones de UI y Privacidad (Completado v3.7.0).

### 📅 Bitácora 18 Dic 2025 (v3.7.0)
- **Privacidad**: Implementación de blur agresivo y validación parental.
- **UI**: Chat FAB global, corrección de partículas y visualización de tokens.
- **Limpieza**: Eliminación de código duplicado y estandarización de assets.

### 📅 Bitácora 26 Nov 2025
- **FloatingNav renovada**: Glassmorphism oscuro, jerarquía pública (Inicio, Explorar, NFTs, Tokens + menú "Más") y dropdown responsivo (w-[90%], max-w-sm), eliminando el botón duplicado de login y añadiendo `pb-24` global para evitar solapar el footer.
- **Páginas informativas**: `ChatInfo.tsx` y `StoriesInfo.tsx` adoptan el tema dark/glass, contenidos reorganizados y CTA directo a `/auth`, alineadas con el funnel público/documental.
- **Búsqueda global real**: Migración `20251126_create_global_search.sql` (pg_trgm + RPC `search_unified`) integrada a `GlobalSearchService`/`VanishSearchInput`; ejecutable vía `supabase db push / db reset` (CLI) o el script `scripts/aplicar-migraciones-remoto.ps1` cuando solo se dispone del Dashboard SQL.
- **Build + Sync**: `deploy-without-sentry.ps1` confirmó build Vite limpio y `npx cap sync android` exitoso para entregar la versión con la nueva navegación/documentación.
💡 Nota para Reclutadores / Reviewers


Este repositorio es un "laboratorio vivo" donde experimento con tecnologías complejas. Si bien la organización del código puede no ser perfecta en todos los módulos, la arquitectura demuestra la capacidad de integrar sistemas dispares (Grafos + SQL + Blockchain) en un producto funcional.

📆 Festimada para completar limpieza de código muerto y comentarios legacy. así como actualización de la documentación en la raíz

                    #"S.O.L.I.D"
S - Principio de Responsabilidad Única: Una clase debe tener una sola razón para cambiar, es decir, una única responsabilidad.
O - Principio Abierto/Cerrado: El software debe permitir añadir nuevas funcionalidades sin modificar el código existente.
L - Principio de Sustitución de Liskov: Las subclases deben poder reemplazar a sus clases base sin afectar el comportamiento del programa.
I - Principio de Segregación de Interfaces: Los clientes no deben depender de interfaces que no utilizan; es mejor tener interfaces más pequeñas y específicas.
D - Principio de Inversión de Dependencias: Los módulos de alto nivel no deben depender de los de bajo nivel; ambos deben depender de abstracciones
                  📅 18 de diciembre del 2025









# 🎯 ComplicesConecta - Plataforma Swinger Premium v3.7.0

<div align="center">

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)
[![Android](https://img.shields.io/badge/Android-Ready-brightgreen.svg)](android/)
[![+18](https://img.shields.io/badge/Contenido-+18-red.svg)](#aviso-legal)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](src/)
[![Production Ready](https://img.shields.io/badge/Production-Ready-brightgreen.svg)](#deployment)
[![AI Native](https://img.shields.io/badge/AI-Native-purple.svg)](#ai-native-layer)
[![Tests E2E](https://img.shields.io/badge/Tests_E2E-198_Passing-brightgreen.svg)](#testing)

### 📱 ¡Descarga la App Ahora!

<a href="https://github.com/ComplicesConectaSw/ComplicesConecta/releases/latest" target="_blank">
  <img src="https://img.shields.io/badge/📱_Descargar_APK-v3.7.0-3DDC84?style=for-the-badge&logo=android&logoColor=white&labelColor=1976D2" alt="Descargar APK" />
</a>

**SHA256:** `Verificado - Build v3.7.0 - Sistema Legal Enterprise + Protocolo de Disolución Ready`

*🔒 Aplicación segura y verificada para Android - Disponible en [GitHub Releases](https://github.com/ComplicesConectaSw/ComplicesConecta/releases/latest)*

</div>

---

## 📚 Tabla de Contenidos

1.  [**Estado de Auditoría v3.6.4**](#-estado-de-auditoría-v364)
2.  [**Índice de Documentación**](#-índice-de-documentación)
3.  [**AI-Native Platform**](#-ai-native-platform---production-ready-enterprise)
4.  [**Inicio Rápido**](#-inicio-rápido)
5.  [**Estructura del Proyecto**](#️-estructura-del-proyecto-resumen)
6.  [**Testing**](#-testing)
7.  [**Build & Deployment**](#-build--deployment)
8.  [**Estadísticas del Proyecto**](#-estadísticas-del-proyecto)
9.  [**Equipo y Contacto Legal**](#-equipo)
10. [**Licencia y Aviso Legal**](#️-licencia)

---

## 🏆 ESTADO DE AUDITORÍA v3.6.4

### 🎉 **NUEVO: Tests E2E Completos (15 Nov 2025)**
- **✅ 198 Tests E2E Funcionales** - Registro, Chat, Matches, Galerías, Tokens
- **✅ 273 Tests Unitarios** - 100% pasando
- **✅ 471 Tests Totales** - Cobertura exhaustiva
- **📚 Documentación Completa** - [TESTS_README.md](./TESTS_README.md)

## 🏆 ESTADO DE AUDITORÍA v3.6.3

### ✅ **PROYECTO 100% AUDITADO Y OPTIMIZADO**
- **📊 Análisis Completo**: [REPORTE_ANALISIS_COMPLETO_v3.6.3.md](./REPORTE_ANALISIS_COMPLETO_v3.6.3.md)
- **🎯 Auditoría Finalizada**: [AUDITORIA_FINALIZADA_v3.6.3.md](./AUDITORIA_FINALIZADA_v3.6.3.md)
- **📋 Plan de Optimización**: [PLAN_ACCION_OPTIMIZACION_v3.6.3.md](./PLAN_ACCION_OPTIMIZACION_v3.6.3.md)

### 📊 **Métricas de Calidad**
- **TypeScript**: ✅ 0 errores (100% tipado)
- **ESLint**: ✅ 0 errores críticos
- **Arquitectura**: ✅ 9/10 (Excelente)
- **Performance**: ✅ 8/10 (Optimizada)
- **Seguridad**: ✅ Validada y auditada
- **Puntuación General**: **8.5/10** 🏆

### 🔍 **Análisis Detallado**
- **Directorios analizados**: 213
- **Archivos de código**: 654
- **Líneas de código**: ~180,000
- **Estado**: **Enterprise Ready** 🚀

---

## 📚 Índice de Documentación

### **📋 Documentación Técnica**
- **[🔧 Guía de Instalación](./INSTALACION_SETUP_v3.5.0.md)** - Guía completa paso a paso de instalación y configuración
- **[🚀 Inicio Rápido Túnel](./QUICK_START_TUNNEL.md)** - Configuración rápida de túnel para desarrollo
- **[🏗️ Estructura del Proyecto](./project-structure-tree.md)** - Árbol detallado del monorepo
- **[📝 Notas de Lanzamiento](./RELEASE_NOTES_v3.4.1.md)** - Historial completo de versiones y cambios
- **[📋 Changelog](./CHANGELOG.md)** - Registro detallado de cambios por versión
- **[⚙️ DevOps Guide](./README_DEVOPS.md)** - Guía de operaciones y deployment
- **[🤖 IA Integration Guide](./README_IA.md)** - Estrategia de desarrollo con IA
- **[🔄 Diagramas de Flujos](./DIAGRAMAS_FLUJOS_v3.5.0.md)** - Diagramas técnicos y flujos de trabajo
- **[🤝 Guía de Contribución](./CONTRIBUTING.md)** - Cómo contribuir al proyecto
- **[📄 Presentación Pública](./COMPLICESCONECTA_PRESENTACION_PUBLICA.md)** - Presentación pública del proyecto

### **📖 Índice completo `docs/`**
#### Archivos en la raíz de `docs/`
- [ACTUALIZACION_PAGINAS_INVERSORES_v3.6.3.md](./docs/ACTUALIZACION_PAGINAS_INVERSORES_v3.6.3.md)
- [COMPONENTS.md](./docs/COMPONENTS.md)
- [GUIA_NFTS.md](./docs/GUIA_NFTS.md)
- [GUIA_TOKENS.md](./docs/GUIA_TOKENS.md)
- [INSTALACION_SETUP_v3.5.0.md](./docs/INSTALACION_SETUP_v3.5.0.md)
- [INTERESES_LIFESTYLE.md](./docs/INTERESES_LIFESTYLE.md)
- [MANUAL_USUARIO_v3.7.1.md](./docs/MANUAL_USUARIO_v3.7.1.md)
- [QUICK_START_TUNNEL.md](./docs/QUICK_START_TUNNEL.md)
- [README.md](./docs/README.md)
- [STAKING_COMPETITIVO_v3.7.0.md](./docs/STAKING_COMPETITIVO_v3.7.0.md)
- [📋 Checklist Legal para Complicie.md](./docs/%F0%9F%93%8B%20Checklist%20Legal%20para%20Complicie.md)

#### Directorio `archive/`
- [logs/VERCEL_ERRORS_NOV16.md](./docs/archive/logs/VERCEL_ERRORS_NOV16.md)
- [milestones/HITO_SABADO.md](./docs/archive/milestones/HITO_SABADO.md)
- [sessions/MEMORIA_SESION_19NOV2025.md](./docs/archive/sessions/MEMORIA_SESION_19NOV2025.md)
- [sessions/MEMORIA_SESION_21NOV2025.md](./docs/archive/sessions/MEMORIA_SESION_21NOV2025.md)

#### Directorio `audit/`
- [ANALISIS_COMPLETO.json](./docs/audit/ANALISIS_COMPLETO.json)
- [FINAL_AUDIT.json](./docs/audit/FINAL_AUDIT.json)

#### Directorio `Auditoria/`
- Archivos principales:
  - [ARCHIVOS_HUERFANOS_v3.6.3.md](./docs/Auditoria/ARCHIVOS_HUERFANOS_v3.6.3.md)
  - [AUDITORIA_COMPLETA_PROYECTO_FINAL.md](./docs/Auditoria/AUDITORIA_COMPLETA_PROYECTO_FINAL.md)
  - [AUDITORIA_NUEVA_COMPLETA_EXHAUSTIVA.md](./docs/Auditoria/AUDITORIA_NUEVA_COMPLETA_EXHAUSTIVA.md)
  - [AUDITORIA_PROFESIONAL_COMPLETA.md](./docs/Auditoria/AUDITORIA_PROFESIONAL_COMPLETA.md)
  - [AUDIT_202509.md](./docs/Auditoria/AUDIT_202509.md)
  - [LISTA_ARCHIVOS_HUERFANOS_v3.6.3.txt](./docs/Auditoria/LISTA_ARCHIVOS_HUERFANOS_v3.6.3.txt)
  - [LISTA_COMPLETA_ARCHIVOS_HUERFANOS_v3.6.3.md](./docs/Auditoria/LISTA_COMPLETA_ARCHIVOS_HUERFANOS_v3.6.3.md)
  - [PERFORMANCE_SCRIPT_MAESTRO_v3.6.3.md](./docs/Auditoria/PERFORMANCE_SCRIPT_MAESTRO_v3.6.3.md)
  - [PLAN_ACCION_AUDITORIA_v3.6.3.md](./docs/Auditoria/PLAN_ACCION_AUDITORIA_v3.6.3.md)
  - [PLAN_ACCION_CORRECCION_v3.6.3.md](./docs/Auditoria/PLAN_ACCION_CORRECCION_v3.6.3.md)
  - [README.md](./docs/Auditoria/README.md)
  - [REPORTE_CONSOLIDADO.md](./docs/Auditoria/REPORTE_CONSOLIDADO.md)
  - [REPORTE_ERRORES_SRC_v3.6.3.md](./docs/Auditoria/REPORTE_ERRORES_SRC_v3.6.3.md)
  - [REPORTE_FINAL_CONSOLIDADO_SCRIPT_MAESTRO_v3.6.3.md](./docs/Auditoria/REPORTE_FINAL_CONSOLIDADO_SCRIPT_MAESTRO_v3.6.3.md)
  - [REPORTE_SCRIPTS.md](./docs/Auditoria/REPORTE_SCRIPTS.md)
  - [SEGURIDAD_SCRIPT_MAESTRO_v3.6.3.md](./docs/Auditoria/SEGURIDAD_SCRIPT_MAESTRO_v3.6.3.md)
- Subdirectorios:
  - [analisis-codigo/ANALISIS_CODIGO_SCRIPT_MAESTRO_v3.6.3.md](./docs/Auditoria/analisis-codigo/ANALISIS_CODIGO_SCRIPT_MAESTRO_v3.6.3.md)
  - [analytics/REPORTE_ANALYTICS.md](./docs/Auditoria/analytics/REPORTE_ANALYTICS.md)
  - [autenticacion/REPORTE_AUTENTICACION.md](./docs/Auditoria/autenticacion/REPORTE_AUTENTICACION.md)
  - [base-datos/REPORTE_BASE_DATOS.md](./docs/Auditoria/base-datos/REPORTE_BASE_DATOS.md)
  - [cache/REPORTE_CACHE.md](./docs/Auditoria/cache/REPORTE_CACHE.md)
  - [chat/REPORTE_CHAT.md](./docs/Auditoria/chat/REPORTE_CHAT.md)
  - [componentes/REPORTE_COMPONENTES.md](./docs/Auditoria/componentes/REPORTE_COMPONENTES.md)
  - [couple/REPORTE_COUPLE.md](./docs/Auditoria/couple/REPORTE_COUPLE.md)
  - [directorios/README.md](./docs/Auditoria/directorios/README.md)
  - [errores/ERRORES_CRITICOS_SCRIPT_MAESTRO_v3.6.3.md](./docs/Auditoria/errores/ERRORES_CRITICOS_SCRIPT_MAESTRO_v3.6.3.md)
  - [final/REPORTE_UNIFICADO_COMPLETO_FINAL.md](./docs/Auditoria/final/REPORTE_UNIFICADO_COMPLETO_FINAL.md)
  - [matching/REPORTE_MATCHING.md](./docs/Auditoria/matching/REPORTE_MATCHING.md)
  - [mejores-practicas/MEJORES_PRACTICAS_SCRIPT_MAESTRO_v3.6.3.md](./docs/Auditoria/mejores-practicas/MEJORES_PRACTICAS_SCRIPT_MAESTRO_v3.6.3.md)
  - [moderation/REPORTE_MODERACION.md](./docs/Auditoria/moderation/REPORTE_MODERACION.md)
  - [notificaciones/REPORTE_NOTIFICACIONES.md](./docs/Auditoria/notificaciones/REPORTE_NOTIFICACIONES.md)
  - [optimizaciones/REPORTE_OPTIMIZACIONES.md](./docs/Auditoria/optimizaciones/REPORTE_OPTIMIZACIONES.md)
  - [public/REPORTE_PUBLIC.md](./docs/Auditoria/public/REPORTE_PUBLIC.md)
  - [seguridad/SECURITY_AUDIT_OVERVIEW.md](./docs/Auditoria/seguridad/SECURITY_AUDIT_OVERVIEW.md)
  - [servicios/REPORTE_SERVICIOS.md](./docs/Auditoria/servicios/REPORTE_SERVICIOS.md)
  - [vercel/REPORTE_VERCEL.md](./docs/Auditoria/vercel/REPORTE_VERCEL.md)
