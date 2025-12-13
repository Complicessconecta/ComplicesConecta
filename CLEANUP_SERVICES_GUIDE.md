# 🧹 Guía de Limpieza de Servicios - ComplicesConecta v3.8.0

## Objetivo
Eliminar dependencias circulares y mejorar la arquitectura de servicios separando concerns (servicios ≠ componentes).

## Problemas Identificados

### 1. Dependencia Servicio → Componente (CRÍTICA)
**Archivo**: `src/services/SustainableEventsService.ts` (línea 17)
```typescript
import { AdvancedCoupleService } from '@/components/profiles/couple/AdvancedCoupleService';
```

**Problema**: Los servicios NO deben importar desde componentes. Esto crea acoplamiento y dificulta el testing.

**Solución**:
- Mover `AdvancedCoupleService.ts` de `src/components/profiles/couple/` a `src/services/couple/`
- Actualizar import en `SustainableEventsService.ts`
- Verificar que no hay otros servicios con esta dependencia

### 2. Servicios Exportados desde index.ts
**Archivo**: `src/services/index.ts`

**Estado Actual** (BUENO):
```typescript
export { default as securityService } from './SecurityService';
export { walletService } from './WalletService';
export { nftService } from './NFTService';
export const SERVICES_CONFIG = { ... };
```

**Análisis**: El archivo es minimalista y no causa dependencias circulares. ✅ No requiere cambios.

### 3. Dependencias Entre Servicios
**Servicios que importan otros servicios**:
- `TokenService.ts` (2 imports internos)
- `PredictiveGraphMatchingService.ts` (2 imports internos)
- `AdvancedAnalyticsService.ts` (1 import interno)
- `VirtualEventsService.ts` (1 import interno)
- `permanentBan.ts` (1 import interno)

**Estado**: Estas dependencias son **controladas** y no forman ciclos. ✅ Aceptables.

## Plan de Acción

### PASO 1: Mover AdvancedCoupleService a servicios
```powershell
# Crear directorio para servicios de parejas
New-Item -ItemType Directory -Path "src/services/couple" -Force

# Copiar AdvancedCoupleService
Copy-Item "src/components/profiles/couple/AdvancedCoupleService.ts" "src/services/couple/AdvancedCoupleService.ts" -Force
```

### PASO 2: Actualizar imports en SustainableEventsService
**De**:
```typescript
import { AdvancedCoupleService } from '@/components/profiles/couple/AdvancedCoupleService';
```

**A**:
```typescript
import { AdvancedCoupleService } from '@/services/couple/AdvancedCoupleService';
```

### PASO 3: Verificar otros imports de AdvancedCoupleService
```powershell
# Buscar todos los imports de AdvancedCoupleService
Get-ChildItem -Path "src" -Recurse -Include "*.tsx", "*.ts" | 
  ForEach-Object {
    if ((Get-Content $_.FullName) -match 'AdvancedCoupleService') {
      Write-Host "$($_.FullName)"
    }
  }
```

### PASO 4: Actualizar imports globales
Reemplazar en todos los archivos:
- `@/components/profiles/couple/AdvancedCoupleService` → `@/services/couple/AdvancedCoupleService`

### PASO 5: Eliminar archivo antiguo
```powershell
Remove-Item "src/components/profiles/couple/AdvancedCoupleService.ts" -Force
```

### PASO 6: Verificar tipos
```powershell
pnpm run type-check
```

## Checklist de Verificación

- [ ] Directorio `src/services/couple/` creado
- [ ] `AdvancedCoupleService.ts` copiado a `src/services/couple/`
- [ ] Imports en `SustainableEventsService.ts` actualizados
- [ ] Todos los imports globales actualizados
- [ ] Archivo antiguo eliminado
- [ ] `pnpm run type-check` pasa sin errores
- [ ] Build local funciona: `pnpm run build`

## Notas Arquitectónicas

### Estructura Recomendada Post-Refactor
```
src/
├── services/
│   ├── index.ts                    (Exporta servicios principales)
│   ├── SecurityService.ts
│   ├── WalletService.ts
│   ├── NFTService.ts
│   ├── TokenService.ts
│   ├── couple/                     (Servicios de parejas)
│   │   └── AdvancedCoupleService.ts
│   ├── legal/                      (Servicios legales)
│   │   ├── ConsentService.ts
│   │   └── CoupleDissolutionService.ts
│   ├── ai/                         (Servicios de IA)
│   ├── events/                     (Servicios de eventos)
│   └── ... (otros servicios)
├── components/
│   ├── profiles/
│   │   ├── couple/                 (Componentes de parejas, NO servicios)
│   │   ├── single/
│   │   └── shared/
│   └── ... (otros componentes)
└── ... (otros directorios)
```

### Regla de Oro
**Servicios NO deben importar desde Componentes**
- ✅ Componentes pueden importar servicios
- ✅ Servicios pueden importar otros servicios
- ❌ Servicios NO pueden importar componentes
- ❌ Servicios NO pueden importar desde `@/components/`

## Impacto Esperado

- **Reducción de acoplamiento**: Servicios independientes de UI
- **Mejor testabilidad**: Servicios sin dependencias de componentes
- **Claridad arquitectónica**: Separación clara de concerns
- **Facilita refactoring futuro**: Cambios en componentes no afectan servicios

---

**Ejecutar este refactor después de que el usuario lo autorice.**
