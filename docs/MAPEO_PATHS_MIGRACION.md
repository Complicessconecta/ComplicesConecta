# Mapeo de Paths: feature/desarrollo → master

## 📍 BACKGROUNDS Y PARTÍCULAS

### GlobalBackground.tsx

```
feature/desarrollo:  src/backgrounds/GlobalBackground.tsx
master (NUEVO):      src/components/ui/GlobalBackground.tsx

Imports dentro del archivo:
  @/backgrounds/ParticlesBackground → @/components/ui/ParticlesBackground
  @/components/ui/GlobalBackground  → @/components/ui/GlobalBackground (sin cambios)
```

### ParticlesBackground.tsx

```
feature/desarrollo:  src/backgrounds/ParticlesBackground.tsx
master (NUEVO):      src/components/ui/ParticlesBackground.tsx

Imports dentro del archivo:
  (revisar qué importa y actualizar paths)
```

### index.ts (Backgrounds)

```
feature/desarrollo:  src/backgrounds/index.ts
master (NUEVO):      src/components/ui/index.ts (agregar exports)

Exports a agregar:
  export { GlobalBackground } from './GlobalBackground';
  export { ParticlesBackground } from './ParticlesBackground';
```

---

## 🎨 TEMAS

### ThemeProvider.tsx

```
feature/desarrollo:  src/themes/ThemeProvider.tsx
master (ACTUAL):     src/components/ui/ThemeProvider.tsx

Imports dentro del archivo:
  @/themes/... → @/components/ui/...
```

### ThemeSelector.tsx

```
feature/desarrollo:  src/themes/ThemeSelector.tsx
master (ACTUAL):     src/components/ui/ThemeSelector.tsx

Imports dentro del archivo:
  @/themes/... → @/components/ui/...
```

### index.ts (Themes)

```
feature/desarrollo:  src/themes/index.ts
master (ACTUAL):     src/components/ui/index.ts (ya existe)

Exports a verificar/agregar:
  export { ThemeProvider } from './ThemeProvider';
  export { ThemeSelector } from './ThemeSelector';
```

---

## ✨ ANIMACIONES

### AnimationProvider.tsx

```
feature/desarrollo:  src/animations/AnimationProvider.tsx
master (NUEVO):      src/components/ui/animations/AnimationProvider.tsx

Imports dentro del archivo:
  @/animations/... → @/components/ui/animations/...
```

### Otros componentes de animación

```
feature/desarrollo:  src/animations/*.tsx
master (NUEVO):      src/components/ui/animations/*.tsx

Imports dentro de cada archivo:
  @/animations/... → @/components/ui/animations/...
```

### index.ts (Animations)

```
feature/desarrollo:  src/animations/index.ts
master (NUEVO):      src/components/ui/animations/index.ts

Exports a crear:
  export { AnimationProvider } from './AnimationProvider';
  export { ... } from './...';
```

---

## 🔗 IMPORTS EN ARCHIVOS PRINCIPALES

### App.tsx

```typescript
// CAMBIAR DE:
import { GlobalBackground } from "@/backgrounds/GlobalBackground";
import { AnimationProvider } from "@/animations/AnimationProvider";
import { ThemeProvider } from "@/themes/ThemeProvider";

// A:
import { GlobalBackground } from "@/components/ui/GlobalBackground";
import { AnimationProvider } from "@/components/ui/animations/AnimationProvider";
import { ThemeProvider } from "@/components/ui/ThemeProvider";
```

### Otros archivos que usen backgrounds

```typescript
// CAMBIAR DE:
import { ParticlesBackground } from "@/backgrounds/ParticlesBackground";

// A:
import { ParticlesBackground } from "@/components/ui/ParticlesBackground";
```

### Otros archivos que usen temas

```typescript
// CAMBIAR DE:
import { ThemeSelector } from "@/themes/ThemeSelector";

// A:
import { ThemeSelector } from "@/components/ui/ThemeSelector";
```

### Otros archivos que usen animaciones

```typescript
// CAMBIAR DE:
import { useAnimation } from "@/animations/AnimationProvider";

// A:
import { useAnimation } from "@/components/ui/animations/AnimationProvider";
```

---

## 🔍 BÚSQUEDA Y REEMPLAZO

### Comando para encontrar todos los imports a cambiar

```bash
# Buscar imports de backgrounds
grep -r "@/backgrounds" src/

# Buscar imports de themes
grep -r "@/themes" src/

# Buscar imports de animations
grep -r "@/animations" src/
```

### Reemplazos necesarios

```bash
# Reemplazar backgrounds
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|@/backgrounds/|@/components/ui/|g'

# Reemplazar themes
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|@/themes/|@/components/ui/|g'

# Reemplazar animations
find src -name "*.tsx" -o -name "*.ts" | xargs sed -i 's|@/animations/|@/components/ui/animations/|g'
```

---

## 📋 CHECKLIST DE PATHS

### Backgrounds

- [ ] GlobalBackground.tsx copiado a src/components/ui/
- [ ] ParticlesBackground.tsx copiado a src/components/ui/
- [ ] Imports en GlobalBackground.tsx actualizados
- [ ] Imports en ParticlesBackground.tsx actualizados
- [ ] Exports en src/components/ui/index.ts agregados

### Temas

- [ ] ThemeProvider.tsx verificado en src/components/ui/
- [ ] ThemeSelector.tsx verificado en src/components/ui/
- [ ] Imports en ThemeProvider.tsx actualizados
- [ ] Imports en ThemeSelector.tsx actualizados
- [ ] Exports en src/components/ui/index.ts verificados

### Animaciones

- [ ] AnimationProvider.tsx copiado a src/components/ui/animations/
- [ ] Otros componentes de animación copiados
- [ ] Imports en cada archivo actualizado
- [ ] src/components/ui/animations/index.ts creado
- [ ] Exports en src/components/ui/animations/index.ts agregados

### Archivos principales

- [ ] App.tsx imports actualizados
- [ ] Otros archivos que usen backgrounds actualizados
- [ ] Otros archivos que usen temas actualizados
- [ ] Otros archivos que usen animaciones actualizados

### Validación

- [ ] Build completa sin errores
- [ ] TypeScript type-check: 0 errores
- [ ] Dev server inicia sin errores
- [ ] App carga en navegador
- [ ] Backgrounds visibles
- [ ] Partículas funcionan
- [ ] Temas funcionan
- [ ] Animaciones funcionan

---

## 🎯 RESUMEN RÁPIDO

| Directorio  | feature/desarrollo | master                        | Acción                      |
| ----------- | ------------------ | ----------------------------- | --------------------------- |
| backgrounds | src/backgrounds/   | src/components/ui/            | Copiar + actualizar imports |
| themes      | src/themes/        | src/components/ui/            | Copiar + actualizar imports |
| animations  | src/animations/    | src/components/ui/animations/ | Copiar + actualizar imports |

---

**Documento creado:** 9 Diciembre 2025
**Propósito:** Referencia rápida de paths para migración
**Estado:** LISTO PARA USAR
