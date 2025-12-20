# 🛡️ Política de Seguridad - ComplicesConecta

## Versiones Soportadas

ComplicesConecta es un proyecto en evolución continua. Actualmente solo se brindan parches de seguridad sobre la rama principal.

| Versión / Rama            | Soporte de Seguridad       |
| ------------------------- | -------------------------- |
| `master` (v3.8.x)        | ✅ Soportada               |
| `backup/*`               | ✅ Copias de seguridad     |
| `feature/*`, `lab/*`     | ⚠️ Solo uso interno (sin SLA)
| Versiones < v3.5.0       | ❌ No soportadas           |

> Nota: Cualquier rama marcada como `backup/...` es un snapshot de trabajo y **no** debe usarse como base para despliegues de producción.

## Cómo Reportar Vulnerabilidades

Si detectas una vulnerabilidad de seguridad en ComplicesConecta, sigue estos pasos:

1. **No abras un issue público.**
2. Envía un correo con la mayor cantidad de detalles posibles a:
   - **Seguridad / Cumplimiento:** `compliance@complicesconecta.com`
   - **Legal:** `legal@complicesconecta.com`
3. Incluye en tu reporte:
   - Descripción clara de la vulnerabilidad.
   - Pasos para reproducir el problema.
   - Impacto potencial (filtración de datos, elevación de privilegios, etc.).
   - Entorno donde se detectó (versión, navegador, sistema operativo).

### Tiempos de Respuesta Estimados

- **Confirmación de recepción:** dentro de las primeras **48 horas hábiles**.
- **Análisis inicial:** entre **3 y 7 días hábiles**, dependiendo de la criticidad.
- **Plan de mitigación / parche:** se compartirá un estimado de tiempos una vez validado el impacto.

### Qué Puedes Esperar

- Tu reporte será tratado con **confidencialidad**.
- Si la vulnerabilidad es confirmada, trabajaremos en un **parche** y, de ser necesario, en un **procedimiento de divulgación responsable**.
- Agradeceremos públicamente tu contribución (si así lo deseas) una vez que el problema haya sido resuelto y desplegado.

## Alcance de la Política

Esta política aplica a:

- Código fuente en este repositorio (`src/`, `supabase/`, `server.js`, etc.).
- Configuraciones de despliegue (Vercel, Docker, Android).
- Integraciones con **Supabase**, **Neo4j**, **Stripe**, **New Relic** y servicios de terceros utilizados oficialmente por el proyecto.

No aplica a:

- Forks de terceros no mantenidos por el equipo de ComplicesConecta.
- Modificaciones locales que no formen parte de una rama oficial.

---

**© 2025 ComplicesConecta Software. Todos los derechos reservados.**
