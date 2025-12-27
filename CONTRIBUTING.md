# 🤝 Guía de Contribución - ComplicesConecta v3.8.0

**Última Actualización:** 20 de Diciembre, 2025
**Versión:** 3.8.0
**Estado:** ✅ ACTUALIZADO - Privacy First - UI Polished - Code Cleanup

¡Gracias por tu interés en contribuir a ComplicesConecta! Esta guía te ayudará a entender cómo puedes participar en el desarrollo de la plataforma swinger más exclusiva de México.

---

## 📋 Tabla de Contenidos

- [🎯 Código de Conducta](#-código-de-conducta)
- [🚀 Cómo Empezar](#-cómo-empezar)
- [🔧 Configuración del Entorno](#-configuración-del-entorno)
- [📝 Tipos de Contribuciones](#-tipos-de-contribuciones)
- [🌟 Proceso de Desarrollo](#-proceso-de-desarrollo)
- [✅ Estándares de Código](#-estándares-de-código)
- [🧪 Testing](#-testing)
- [📚 Documentación](#-documentación)
- [🐛 Reporte de Bugs](#-reporte-de-bugs)
- [💡 Solicitud de Features](#-solicitud-de-features)
- [🔒 Consideraciones de Seguridad](#-consideraciones-de-seguridad)

---

## 🎯 Código de Conducta

### **Nuestros Valores**
ComplicesConecta es una plataforma para adultos que promueve:
- **Respeto mutuo** entre todos los contribuidores
- **Inclusividad** sin discriminación por orientación, género o experiencia
- **Profesionalismo** en todas las interacciones
- **Privacidad y discreción** como pilares fundamentales
- **Calidad técnica** en cada línea de código

### **Comportamientos Esperados**
- ✅ Usar lenguaje inclusivo y respetuoso
- ✅ Respetar diferentes puntos de vista y experiencias
- ✅ Aceptar críticas constructivas de manera profesional
- ✅ Enfocarse en lo mejor para la comunidad
- ✅ Mostrar empatía hacia otros miembros

### **Comportamientos Inaceptables**
- ❌ Lenguaje o imágenes sexualizadas fuera del contexto del proyecto
- ❌ Comentarios despectivos, insultos o ataques personales
- ❌ Acoso público o privado
- ❌ Publicar información privada sin consentimiento
- ❌ Cualquier conducta inapropiada en un entorno profesional

---

## 🚀 Cómo Empezar

### **1. Fork del Repositorio**
```bash
# Hacer fork en GitHub y luego clonar
git clone https://github.com/TU-USERNAME/ComplicesConecta.git
cd ComplicesConecta
```

### **2. Configurar Remotes**
```bash
# Agregar el repositorio original como upstream
git remote add upstream https://github.com/ComplicesConectaSw/ComplicesConecta.git
git remote -v
```

### **3. Crear Rama de Feature**
```bash
# Crear rama desde develop
git checkout develop
git pull upstream develop
git checkout -b feature/nombre-descriptivo
```

> ⚠️ **POLÍTICA DE RAMAS IMPORTANTE:**
> *   **NO crear ramas paralelas** para el mismo flujo de desarrollo.
> *   Trabajar exclusivamente en la rama activa asignada (ej: `refact-inteligente-Tra-[FECHA]`).
> *   Si existe una rama obsoleta, fusionar cambios y eliminarla inmediatamente.
> *   Mantener un historial lineal y limpio siempre que sea posible.

---

## 🔧 Configuración del Entorno

### **📋 Prerrequisitos**
- **Node.js** 18+ (recomendado: 20.x)
- **Bun** (preferido) o npm/pnpm/yarn
- **Git** con configuración de usuario
- **Android Studio** (para desarrollo móvil)
- **Supabase CLI** (para backend)

### **⚡ Instalación Rápida**
> **📚 Para guía completa de instalación y configuración, consulta [INSTALACION_SETUP_v3.5.0.md](./INSTALACION_SETUP_v3.5.0.md)**

```bash
# 1. Instalar dependencias
bun install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 3. Iniciar desarrollo
bun run dev

# 4. Ejecutar tests
bun run test
```

### **🗄️ Base de Datos Local**
```bash
# Inicializar Supabase local
supabase start

# Aplicar migraciones
supabase db reset

# Generar tipos TypeScript
supabase gen types typescript --local > src/types/supabase.ts
```

---

## 📝 Tipos de Contribuciones

### **🐛 Bug Fixes**
- Corrección de errores en funcionalidades existentes
- Mejoras de performance
- Correcciones de UI/UX
- Fixes de compatibilidad móvil

### **✨ Nuevas Features**
- Funcionalidades de matching y descubrimiento
- Mejoras en chat y mensajería
- Nuevos tipos de eventos VIP
- Integraciones con APIs externas

### **🎨 Mejoras de UI/UX**
- Nuevos componentes de interfaz
- Mejoras en responsividad
- Animaciones y transiciones
- Temas y personalización visual

### **🔒 Seguridad**
- Implementación de medidas de seguridad
- Auditorías de código
- Mejoras en autenticación
- Protección de datos sensibles

### **📚 Documentación**
- Guías de usuario
- Documentación técnica
- Comentarios en código
- Ejemplos y tutoriales
- Mantener sincronizados los documentos raíz (`CHANGES.md`, `RELEASE_NOTES_v3.8.0.md`, `README.md`, `COMPLICESCONECTA_PRESENTACION_PUBLICA.md`, `project-structure-tree.md`) cuando se apliquen cambios en UI global (fondos, navegación, SideMenu, rutas públicas como `/tokens` y `/nfts`).
- Para cambios en la **IA Local y sistema legal** (Libro Maestro `app-master-context.md`, `src/ai/AIWorker.ts`, `src/ai/useLocalAI.ts`, `src/components/ai/LegalChatBox.tsx`, `src/pages/AIControlCenter.tsx`, `src/pages/TokensLegal.tsx`), actualizar siempre la documentación asociada y las notas de versión.

### **🧪 Testing**
- Tests unitarios
- Tests de integración
- Tests E2E
- Tests de performance

---

## 🌟 Proceso de Desarrollo

### **1. Planificación**
```bash
# Crear issue describiendo la feature/bug
# Discutir el enfoque con el equipo
# Asignar labels apropiados: feature, bug, enhancement, etc.
```

### **2. Desarrollo**
```bash
# Crear rama de feature
git checkout -b feature/descripcion-clara

# Desarrollo iterativo con commits frecuentes
git add .
git commit -m "feat: descripción clara del cambio"

# Push regular para backup
git push origin feature/descripcion-clara
```

### **3. Testing**
```bash
# Ejecutar tests unitarios
bun run test

# Ejecutar tests E2E
bun run test:e2e

# Verificar linting
bun run lint

# Verificar tipos TypeScript
bun run type-check
```

#### Alternativa usando pnpm

```bash
pnpm test
pnpm test:e2e
pnpm lint
pnpm type-check
```

### **4. Pull Request**
```markdown
## 📋 Descripción
Descripción clara de los cambios realizados.
```
