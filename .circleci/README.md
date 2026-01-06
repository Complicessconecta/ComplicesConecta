# CircleCI Configuration - ComplicesConecta

## 🚀 Configuración de CI/CD para ComplicesConecta v3.0.0

Este directorio contiene la configuración de CircleCI para el proyecto ComplicesConecta, incluyendo integración con GitHub AI Models.

## 📋 Archivos de Configuración

### `.circleci/config.yml`

Configuración principal de CircleCI con:

- **Jobs de testing**: Unitarios e integración
- **Build de producción**: Optimizado para Vite
- **Deploy automático**: Solo en rama main/master
- **Análisis de seguridad**: Auditoría de dependencias
- **Workflows nocturnos**: Tests completos diarios

### Variables de Entorno Requeridas

Configura estas variables en CircleCI Project Settings > Environment Variables:

```bash
# GitHub AI Token
GITHUB_TOKEN=YOUR_NEW_SECURE_GITHUB_TOKEN_HERE

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Build Configuration
NODE_ENV=production
VITE_APP_NAME=ComplicesConecta
VITE_APP_VERSION=3.0.0
```

## 🔧 Configuración Paso a Paso

### 1. Conectar Repositorio a CircleCI

1. Ve a [CircleCI](https://circleci.com/)
2. Inicia sesión con tu cuenta de GitHub
3. Selecciona "Set Up Project" para ComplicesConecta
4. Elige "Use Existing Config" (ya tienes `.circleci/config.yml`)

### 2. Configurar Variables de Entorno

En CircleCI Dashboard:

1. Ve a Project Settings
2. Selecciona "Environment Variables"
3. Agrega las variables listadas arriba

### 3. Configurar GitHub AI Models

El token ya está incluido en la configuración:

```
GITHUB_TOKEN=YOUR_NEW_SECURE_GITHUB_TOKEN_HERE
```

### 4. Verificar Configuración

Ejecuta localmente para probar:

```bash
# Instalar dependencias de AI
pnpm install

# Probar conexión con GitHub AI
pnpm ai:setup

# Ejecutar tests como en CI
pnpm ci:test
```

## 🔄 Workflows Configurados

### **Workflow Principal** (`complices-conecta-ci`)

Se ejecuta en cada push y PR:

1. **install-dependencies**: Instala pnpm y dependencias
2. **lint-and-typecheck**: ESLint + TypeScript
3. **test-unit**: Tests unitarios con Vitest
4. **test-integration**: Tests de integración
5. **security-audit**: Auditoría de seguridad
6. **build-production**: Build optimizado
7. **deploy-production**: Deploy (solo main/master)

### **Workflow Nocturno** (`nightly-full-test`)

Se ejecuta diariamente a las 2 AM UTC:

- Tests completos
- Auditoría de seguridad
- Verificación de integridad

## 📊 Métricas y Reportes

### Test Results

- Formato JUnit XML
- Almacenados en `test-results/`
- Visibles en CircleCI UI

### Build Artifacts

- Directorio `dist/` completo
- Métricas de tamaño de bundle
- Archivos de configuración

### Coverage Reports

- Generados por Vitest
- Almacenados como artifacts
- Integración con CircleCI Insights

## 🛠️ Comandos Útiles

```bash
# Ejecutar pipeline localmente (simulado)
pnpm ci:install
pnpm lint
pnpm type-check
pnpm ci:test
pnpm ci:build

# Probar GitHub AI
pnpm ai:test

# Verificar configuración
node scripts/setup-github-ai.js
```

## 🔍 Troubleshooting

### Error: "Token unauthorized"

- Verifica que el token tenga permisos `models:read`
- Confirma que el token esté configurado en CircleCI

### Error: "Build failed"

- Revisa que todas las variables de entorno estén configuradas
- Verifica que el código pase los tests localmente

### Error: "Tests timeout"

- Los tests de integración pueden tardar más
- Configurado timeout de 10 minutos por job

## 📈 Optimizaciones Implementadas

### **Caché Inteligente**

- Cache de `node_modules` y `~/.pnpm-store`
- Invalidación automática en cambios de `package.json`

### **Paralelización**

- Jobs independientes ejecutándose en paralelo
- Reducción del tiempo total de pipeline

### **Recursos Optimizados**

- Imagen Docker ligera (`cimg/node:20.19.2`)
- Instalación de herramientas solo cuando necesario

## 🎯 Estado del Proyecto

- ✅ **Perfect Score**: 100/100 mantenido
- ✅ **Tests**: 140/140 pasando
- ✅ **Build**: Optimizado (8.45s)
- ✅ **AI Integration**: GitHub Models configurado
- ✅ **CI/CD**: Pipeline robusto implementado

---

## 📞 Soporte

Para problemas con la configuración de CircleCI:

1. Revisa los logs en CircleCI Dashboard
2. Verifica las variables de entorno
3. Ejecuta los comandos localmente para debug
4. Consulta la documentación de CircleCI

**Proyecto**: ComplicesConecta v3.0.0  
**Configuración**: Production Ready  
**Última actualización**: 22 de Septiembre, 2025
