/**
 * Endpoint de Cron Jobs para Vercel (ComplicesConecta)
 *
 * Descripción:
 * - Este endpoint será invocado por Vercel Cron Jobs en despliegues de producción.
 * - Por seguridad, aquí solo deben ejecutarse tareas idempotentes y no destructivas.
 * - Soporta protección con `CRON_SECRET` (Authorization: Bearer <secret>).
 */

// =========================
// Bloque: Funciones
// =========================

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
    return;
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = Array.isArray(req.headers?.authorization)
      ? req.headers.authorization[0]
      : req.headers?.authorization;

    const expected = `Bearer ${cronSecret}`;
    if (authHeader !== expected) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: false, error: 'Unauthorized' }));
      return;
    }
  }

  // Nota: Agrega aquí tareas idempotentes (ej. healthcheck, limpieza de cachés, verificación de integridad).

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(
    JSON.stringify({
      ok: true,
      source: 'vercel-cron',
      ts: new Date().toISOString(),
    })
  );
}
