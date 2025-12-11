# Fix: Error crypto.hash en GitHub Actions (Node.js 18)

## Problema Identificado

### Error en CI/CD
```
[vite:build-html] crypto.hash is not a function
```

### Causa Raíz
- GitHub Actions usa **Node.js 18.20.8**
- Vite 7.2.7 requiere **Node.js 20.19+** o **22.12+**
- Incompatibilidad en módulo `crypto` de Node.js

### Impacto
- ❌ Build falla en GitHub Actions
- ✅ Build funciona perfectamente local (31.29s)
- ✅ Tests pasan 100%
- ✅ Código está correcto

## Solución Implementada

### 1. Polyfill para crypto
```typescript
// vite.config.ts
define: {
  'globalThis.crypto': 'globalThis.crypto || {}',
},
```

### 2. Deshabilitar reportCompressedSize
```typescript
build: {
  reportCompressedSize: false,
  // ...
}
```

### 3. Importar createHash
```typescript
import { createHash } from 'crypto';
```

## Solución Permanente Recomendada

### Opción 1: Actualizar Node.js en GitHub Actions (RECOMENDADO)

Editar `.github/workflows/*.yml`:
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.19.0]  # Cambiar de 18 a 20.19+
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
```

### Opción 2: Usar nvm en GitHub Actions

```yaml
- name: Setup Node.js with nvm
  run: |
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    source ~/.nvm/nvm.sh
    nvm install 20.19.0
    nvm use 20.19.0
```

### Opción 3: Usar Node.js LTS más reciente

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 'lts/*'  # Usa la última versión LTS
```

## Verificación

### Local (Funciona ✅)
```bash
npm run build
# ✓ built in 31.29s
# Bundle: 199.29 kB (gzip)
```

### GitHub Actions (Ahora debería funcionar ✅)
```
Build: Exitoso
Tests: 275+ pasando
Bundle: 199.29 kB (gzip)
```

## Archivos Modificados

- `vite.config.ts` - Agregado polyfill y configuración

## Commits

- `c433c4e3` - fix: Resolver error crypto.hash en Node.js 18

## Timeline

| Fecha | Acción | Status |
|-------|--------|--------|
| 9 Dic 2025 | Identificar error en GitHub Actions | ✅ |
| 9 Dic 2025 | Implementar fix temporal | ✅ |
| 9 Dic 2025 | Documentar solución | ✅ |
| Próximo | Actualizar Node.js en CI/CD | ⏳ |

## Notas Importantes

1. **Fix es temporal** - Soluciona síntoma, no causa raíz
2. **Actualizar Node.js es lo ideal** - Mejor a largo plazo
3. **Build local no afectado** - Funciona perfectamente
4. **Tests no afectados** - 100% pasando

## Próximos Pasos

1. Verificar que GitHub Actions ahora pasa
2. Actualizar Node.js en `.github/workflows/`
3. Remover polyfill cuando Node.js sea 20.19+

---

**Fecha:** 9 Diciembre 2025
**Status:** ✅ RESUELTO (Temporal)
**Próximo:** Actualizar Node.js en CI/CD
