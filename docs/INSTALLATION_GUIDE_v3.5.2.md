# 📖 GUÍA DE INSTALACIÓN - ComplicesConecta v3.5.2

**Fecha:** 7 Diciembre 2025  
**Versión:** 3.5.2  
**Status:** ✅ GUÍA COMPLETA

---

## 📋 REQUISITOS PREVIOS

### Sistema Operativo

- Windows 10+ / macOS 10.15+ / Linux (Ubuntu 20.04+)

### Software Requerido

- Node.js 18.x o superior
- npm 9.x o superior
- Git 2.30+
- Docker (opcional, para desarrollo local)

### Recursos

- 4GB RAM mínimo
- 2GB espacio en disco
- Conexión a internet

---

## 🚀 INSTALACIÓN RÁPIDA

### 1. Clonar Repositorio

```bash
git clone https://github.com/ComplicesConectaSw/ComplicesConecta.git
cd ComplicesConecta
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

```bash
cp .env.example .env.local
```

Editar `.env.local` con tus credenciales:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_API_URL=http://localhost:3000
```

### 4. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

Acceder a `http://localhost:5173`

---

## 🔧 CONFIGURACIÓN AVANZADA

### Base de Datos

```bash
# Aplicar migraciones
npx supabase db push

# Reset de base de datos
npx supabase db reset
```

### Variables de Entorno Completas

```env
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# API
VITE_API_URL=http://localhost:3000
VITE_API_TIMEOUT=30000

# Seguridad
VITE_CSP_ENABLED=true
VITE_RATE_LIMIT_ENABLED=true

# Monitoreo
VITE_SENTRY_DSN=
VITE_LOG_LEVEL=info
```

---

## 📦 BUILD PARA PRODUCCIÓN

### Build Web

```bash
npm run build
```

### Build Android

```bash
npm run build:android
```

### Build iOS

```bash
npm run build:ios
```

---

## ✅ VERIFICACIÓN DE INSTALACIÓN

```bash
# Type-check
npm run type-check

# Lint
npm run lint

# Tests
npm run test

# Build
npm run build
```

---

## 🐛 TROUBLESHOOTING

### Error: "Module not found"

```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: "Port 5173 already in use"

```bash
npm run dev -- --port 3000
```

### Error: "Supabase connection failed"

- Verificar variables de entorno
- Verificar conexión a internet
- Verificar credenciales de Supabase

---

## 📞 SOPORTE

Para problemas de instalación:

1. Consulta [TROUBLESHOOTING_v3.5.2.md](./TROUBLESHOOTING_v3.5.2.md)
2. Revisa [GitHub Issues](https://github.com/ComplicesConectaSw/ComplicesConecta/issues)
3. Contacta al equipo de desarrollo

---

**Guía creada por:** Cascade AI  
**Proyecto:** ComplicesConecta  
**Versión:** v3.5.2  
**Fecha:** 7 Diciembre 2025

---

## ✅ INSTALACIÓN COMPLETADA
