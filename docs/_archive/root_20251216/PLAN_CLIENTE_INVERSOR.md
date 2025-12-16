# 🎯 PLAN URGENTE - CLIENTE INVERSOR (16 Nov 2025)

## 💰 **SITUACIÓN CRÍTICA:**
**Cliente inversor interesado** - Necesita ver demo 100% funcional **MAÑANA**.

---

## ✅ **COMPLETADO (Primeros 10 min):**

### 1. Descubrir - Pantalla Vacía ✅
- **Fix:** Agregado `z-[-1]` al background
- **Ubicación:** `src/app/(discover)/Discover.tsx` línea 499
- **Status:** Contenido ahora visible

### 2. Logout Funcional ✅  
- **Ya existe:** En HeaderNav dropdown del usuario
- **Ubicación:** `src/components/HeaderNav.tsx` líneas 347-355
- **Acción:** "Cerrar Sesión" en dropdown

### 3. Git & Deploy ✅
- Commit: `c34bfce`
- Push: GitHub actualizado
- Deploy: Vercel en progreso

---

## ⏳ **PENDIENTES (Próximos 30 min):**

### ALTA PRIORIDAD:

#### 4. Encoding UTF-8 (CRÍTICO)
**Problema:** 682 archivos con encoding corrupto
- "aos" → "años"
- "das" → "días"  
- "autnticas" → "auténticas"

**Solución:**
```powershell
# Fix masivo con PowerShell
Get-ChildItem -Path "src" -Recurse -Include *.tsx,*.ts | 
ForEach-Object {
  $content = Get-Content $_.FullName -Raw -Encoding UTF8
  $content = $content -replace 'aos(?![a-zA-Z])', 'años'
  $content = $content -replace 'das(?![a-zA-Z])', 'días'
  $content = $content -replace 'autnticas', 'auténticas'
  $content = $content -replace 'relacin', 'relación'
  Set-Content $_.FullName -Value $content -Encoding UTF8
}
```

#### 5. Nav Responsive
- Reducir altura del HeaderNav
- Hacer bottom nav más compacto
- Iconos sin texto en móvil

#### 6. ThemeToggle Funcional
- Verificar implementación de cambio de tema
- Asegurar que luna/sol funcione

---

## 🔧 **BAJA PRIORIDAD:**

7. ✅ Errores 403 (PostHog config - no crítico)
8. ✅ /tokens-info texto visible (verificar después)

---

## 📊 **TIMELINE:**

| Tiempo | Tarea | Status |
|--------|-------|--------|
| 0-10 min | Descubrir + Logout + Deploy | ✅ DONE |
| 10-25 min | Encoding UTF-8 masivo | ⏳ IN PROGRESS |
| 25-35 min | Nav responsive | ⏳ PENDING |
| 35-45 min | ThemeToggle | ⏳ PENDING |
| 45-60 min | Testing final + Deploy | ⏳ PENDING |

**TOTAL:** ~1 hora para demo 100% funcional

---

## 🎯 **OBJETIVO:**
**Demo perfecta para cliente inversor mañana.**

**Prioridad #1:** Perfiles funcionan 100%
**Prioridad #2:** UI pulida y profesional
**Prioridad #3:** Sin errores visibles

---

**Estado actual:** 2/9 tareas completadas (22%)
**Tiempo transcurrido:** 10 minutos
**ETA para demo 100%:** 50 minutos

---

_Actualizado: 16 Nov 2025 - 05:04 AM_
