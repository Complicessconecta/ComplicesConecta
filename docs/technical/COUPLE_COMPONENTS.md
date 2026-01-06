# Documentación de Componentes de Pareja (Couple Components)

## Introducción

Este documento detalla la implementación y especificaciones técnicas de los componentes críticos para la gestión legal y de activos de parejas en la plataforma.

## Componentes

### 1. CouplePreNuptialAgreement.tsx

Gestor del Acuerdo Prenupcial Digital.

**Funcionalidades:**

- Generación dinámica del texto del contrato.
- Firma digital dual (ambos partners).
- Registro de hash en blockchain (simulado/preparado).
- Cláusula de Muerte Súbita.
- Inventario de Activos Protegidos (Visualización en Tabla).

**Estructura de Datos (Activos):**
El componente ahora visualiza una tabla de activos protegidos con la siguiente estructura (Mock/Real):

```typescript
interface ProtectedAsset {
  id: number;
  type: string; // Token, NFT, Wallet, etc.
  name: string;
  value: string;
  distribution: string; // e.g., "50/50", "Joint Custody"
}
```

**Integración:**
Se integra en `ProfileCouple.tsx` y requiere `coupleId`, `partner1Id`, y `partner2Id`.

### 2. CoupleDisputeManager.tsx

Gestor de Disolución y Disputas ("Zona de Peligro").

**Funcionalidades:**

- Congelamiento de activos (72 horas).
- Visualización de activos congelados en formato tabular.
- Propuesta y aceptación de resolución de conflictos.
- Ejecución de cláusula de muerte súbita (30 días).

**Tabla de Activos Congelados:**
Se ha implementado una tabla comparativa para mostrar los balances de cada partner durante el congelamiento:

- Columnas: Activo, Partner 1, Partner 2.
- Filas: Tokens CMPX, Tokens GTK, NFTs.

## Requisitos de Implementación

### Dependencias

- `lucide-react`: Iconos.
- `supabase-js`: Backend.
- `Tailwind CSS`: Estilos y Grid System.

### Guía de Estilos

- **Android Grid:** Se debe respetar el grid de 4 columnas (móvil) / 8 columnas (tablet) con margen y gutter de 16px.
- **Tablas:** Usar `min-w-full divide-y divide-gray-200` para consistencia.

## Historial de Cambios (v3.7.2)

- **Grid:** Implementación de `android-grid.css` para cumplimiento de guías visuales.
- **Prenupcial:** Adición de tabla de inventario de activos.
- **Disputas:** Cambio de grid a tabla para visualización de activos congelados.
