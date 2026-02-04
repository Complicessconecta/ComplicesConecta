# 🤝 Guía de Contribución - ComplicesConecta v3.9.6

**Última Actualización:** 4 de Febrero, 2026
**Versión:** 3.9.6
**Estado:** ✅ ACTUALIZADO - AI Integration Complete - TypeScript Clean - Production Ready - Demo Fixes - Security Patched

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
>
> - **NO crear ramas paralelas** para el mismo flujo de desarrollo.
> - Trabajar exclusivamente en la rama activa asignada (ej: `refact-inteligente-Tra-[FECHA]`).
> - Si existe una rama obsoleta, fusionar cambios y eliminarla inmediatamente.
> - Mantener un historial lineal y limpio siempre que sea posible.

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
- Mantener sincronizados los documentos raíz (`CHANGELOG.md`, `RELEASE_NOTES_v4.0.0.md`, `README.md`, `COMPLICESCONECTA_PRESENTACION_PUBLICA.md`, `Project-Structure-Tree-files.md`) cuando se apliquen cambios en UI global (fondos, navegación, SideMenu, rutas públicas como `/tokens` y `/nfts`).
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

---

## 🔒 Consideraciones de Seguridad

### **Medidas de Seguridad Implementadas (v3.8.0)**

ComplicesConecta implementa múltiples capas de seguridad para proteger datos sensibles y prevenir ataques:

#### **Protección de Datos**
- **Encriptación AES-256**: Datos en reposo y tránsito protegidos con encriptación de nivel bancario
- **TLS 1.3**: Todas las conexiones seguras con protocolo TLS 1.3
- **Row Level Security (RLS)**: 65+ políticas RLS activas protegiendo acceso a datos sensibles
- **Enmascaramiento de Datos**: Emails enmascarados en logs (ab***@domain.com), datos sensibles protegidos

#### **Protección contra Ataques**
- **Protección Anti-DDoS**: Rate limiting de 100 requests/minuto, bloqueo automático de IPs maliciosas
- **Protección XSS**: Escapado de HTML en todos los outputs, Content Security Policy configurada
- **Protección Anti-Inyección SQL**: Sanitización de inputs, validación de formatos, triggers automáticos

#### **Autenticación y Autorización**
- **Autenticación Biométrica**: Huella digital y Face ID, MFA opcional para usuarios premium
- **JWT Tokens**: Expiración configurable (1 hora por defecto) con firma RS256
- **Gestión de Administradores**: Tabla `admin_users` con RLS estricto, auditoría completa de cambios

#### **Auditoría y Monitoreo**
- **Monitoreo 24/7**: Detección de actividad sospechosa, alertas automáticas
- **Auditoría Forense**: Tabla `security_audit_log` con logging de eventos de seguridad
- **Detección de Actividad Sospechosa**: Múltiples IPs en corto tiempo, alta tasa de requests

#### **Cumplimiento Legal**
- **GDPR/LFPDPPP + Ley Olimpia**: Cumplimiento completo con regulaciones de protección de datos
- **ISO 27001 Ready**: Preparado para certificación ISO 27001
- **SOC 2 Type II Ready**: Preparado para auditoría SOC 2 Type II
- **Verificador IA de Consentimiento**: Implementado para cumplimiento de Ley Olimpia

### **Directrices de Seguridad para Contribuidores**

#### **Nunca exponer datos sensibles**
- ❌ No incluir emails, contraseñas, tokens o API keys en el código
- ❌ No loggear datos sensibles en producción
- ❌ No hardcodear credenciales en archivos de configuración

#### **Usar variables de entorno**
```typescript
// ✅ CORRECTO
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ❌ INCORRECTO
const supabaseUrl = 'https://xxx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

#### **Validar y sanitizar inputs**
```typescript
// ✅ CORRECTO
import { sanitizeInput, is_valid_email } from '@/lib/security';

const email = sanitizeInput(userInput);
if (!is_valid_email(email)) {
  throw new Error('Email inválido');
}

// ❌ INCORRECTO
const email = userInput; // Sin validación ni sanitización
```

#### **Usar políticas RLS en Supabase**
```sql
-- ✅ CORRECTO
CREATE POLICY "Users can view own data" ON sensitive_table
    FOR SELECT
    USING (user_id = auth.uid());

-- ❌ INCORRECTO
CREATE POLICY "All users can view all data" ON sensitive_table
    FOR SELECT
    USING (TRUE);
```

#### **Reportar vulnerabilidades de seguridad**
Si encuentras una vulnerabilidad de seguridad, por favor repórtala de manera responsable:
- 📧 Email: security@complicesconecta.com
- 📋 Incluye: Descripción detallada, pasos para reproducir, impacto sugerido
- ⏱️ Respuesta: Dentro de 48 horas
- 🎁 Recompensa: Bug bounty para vulnerabilidades críticas

### **Documentación de Seguridad**
- [Medidas de Seguridad v3.8.0](docs/legal/SECURITY_MEASURES_V3.8.0.md) - Documentación completa de seguridad
- [Auditoría de Seguridad](AUDITORIA_SRC_COMPLETA.md) - Auditoría exhaustiva de código y base de datos
- [Política de Proveedores](docs/legal/SUPPLIER_SECURITY_POLICY.md) - Política de seguridad para proveedores

---

**¡Gracias por contribuir a ComplicesConecta!** 🎉
