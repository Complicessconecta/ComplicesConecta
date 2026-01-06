# 📸 DEMO SCREENSHOTS & VIDEO - ComplicesConecta v3.5.2

**Fecha:** 7 Diciembre 2025  
**Status:** ✅ GUÍA DE CAPTURAS

---

## 📹 VIDEO DEMO (60 SEGUNDOS)

**Flujo:**

1. **0-10s:** Pantalla de login → Seleccionar "Modo Demo"
2. **10-20s:** Elegir "Single" → Cargar perfil demo
3. **20-35s:** Navegar a Chat → Mostrar conversación
4. **35-50s:** Ir a Tokens → Mostrar balance CMPX
5. **50-60s:** Logout → Volver a login

**Comando para grabar:**

```bash
npx playwright codegen http://localhost:5173 --output demo-video.spec.ts
```

---

## 📸 SCREENSHOTS PROFESIONALES

### 1. Login Screen

**Ubicación:** `/screenshots/1-login.png`

- Mostrar campo email y password
- Botón "Modo Demo" destacado
- Branding ComplicesConecta

### 2. Demo Selector

**Ubicación:** `/screenshots/2-demo-selector.png`

- Dos opciones: Single y Couple
- Descripciones claras
- Botones con hover effect

### 3. Profile Single

**Ubicación:** `/screenshots/3-profile-single.png`

- Foto de perfil
- Nombre: "Demo User"
- Intereses
- Botón "Editar Perfil"

### 4. Chat Screen

**Ubicación:** `/screenshots/4-chat.png`

- Lista de conversaciones
- Mensaje de bienvenida
- Input de mensaje
- Emoji picker

### 5. Tokens Dashboard

**Ubicación:** `/screenshots/5-tokens.png`

- Balance CMPX: 1000
- Historial de transacciones
- Gráfico de tendencia
- Botón "Comprar Tokens"

### 6. NFTs Gallery

**Ubicación:** `/screenshots/6-nfts.png`

- Grid de 3 NFTs
- Genesis (Legendary)
- Verified Badge (Rare)
- Early Adopter (Common)

---

## 🎬 CÓMO GENERAR SCREENSHOTS

### Opción 1: Manual (Recomendado)

```bash
# 1. Iniciar servidor
npm run dev

# 2. Abrir navegador
# http://localhost:5173

# 3. Tomar screenshots con DevTools (F12)
# Ctrl+Shift+P → "Screenshot"
```

### Opción 2: Playwright

```bash
# Crear script de screenshots
npx playwright codegen http://localhost:5173
```

### Opción 3: Puppeteer

```bash
# Script personalizado
node scripts/take-screenshots.js
```

---

## 📋 CHECKLIST FINAL

- [ ] Video demo grabado (60s)
- [ ] 6 screenshots capturados
- [ ] Imágenes optimizadas (< 500KB cada)
- [ ] Imágenes en `/public/screenshots/`
- [ ] README actualizado con imágenes
- [ ] Comprimidas con TinyPNG

---

**Guía creada por:** Cascade AI  
**Proyecto:** ComplicesConecta  
**Versión:** v3.5.2  
**Fecha:** 7 Diciembre 2025

---

## ✅ DEMO SCREENSHOTS DOCUMENTADO
