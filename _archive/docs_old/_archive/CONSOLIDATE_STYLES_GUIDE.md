# 🎨 Guía de Consolidación de Estilos - ComplicesConecta v3.8.0

## Objetivo
Eliminar archivos CSS duplicados y consolidar estilos en ubicaciones lógicas.

## Análisis de Estilos Duplicados

### Archivos Encontrados
1. **`src/styles/couple.css`** (22 bytes)
2. **`src/styles/profiles/couple.css`** (22 bytes)

### Contenido Actual
Ambos archivos son **idénticos** y contienen solo:
```css
/* Estilos para perfiles de parejas */
@layer components {
  .profile-couple { @apply container mx-auto px-4 py-8; }
  .profile-couple-header { @apply mb-8 text-center; }
  .profile-couple-content { @apply grid grid-cols-1 md:grid-cols-2 gap-6; }
}
```

**Nota**: El comentario indica que estos estilos están consolidados en `index.css`.

## Recomendación

### Opción 1: Mantener en src/styles/profiles/couple.css (RECOMENDADO)
- Eliminar `src/styles/couple.css`
- Mantener `src/styles/profiles/couple.css` como referencia
- Verificar que `index.css` importa este archivo

### Opción 2: Usar Tailwind Inline (MODERNO)
- Eliminar ambos archivos CSS
- Usar clases Tailwind directamente en componentes
- Ejemplo: `<div className="container mx-auto px-4 py-8">`

### Opción 3: Usar CSS Modules
- Crear `ProfileCouple.module.css` junto al componente
- Importar en `ProfileCouple.tsx`
- Mejor encapsulación y mantenibilidad

## Plan de Acción (Opción 1 - Recomendada)

### PASO 1: Verificar imports de couple.css
```powershell
Get-ChildItem -Path "src" -Recurse -Include "*.tsx", "*.ts", "*.css" | 
  ForEach-Object {
    if ((Get-Content $_.FullName) -match 'couple\.css') {
      Write-Host "$($_.FullName)"
    }
  }
```

### PASO 2: Verificar que index.css importa profiles/couple.css
```bash
grep -n "couple.css" src/index.css
```

### PASO 3: Eliminar archivo duplicado
```powershell
Remove-Item "src/styles/couple.css" -Force
```

### PASO 4: Verificar build
```bash
pnpm run build
```

## Checklist de Verificación

- [ ] Verificar que no hay imports de `src/styles/couple.css`
- [ ] Confirmar que `src/index.css` importa `src/styles/profiles/couple.css`
- [ ] Eliminar `src/styles/couple.css`
- [ ] Build local funciona: `pnpm run build`
- [ ] Estilos de parejas se aplican correctamente en UI

## Notas

- Los estilos son muy básicos (solo layout Tailwind)
- Considerar migrar a Tailwind inline para simplificar
- No hay estilos complejos que requieran CSS puro

---

**Ejecutar este refactor después de que el usuario lo autorice.**
