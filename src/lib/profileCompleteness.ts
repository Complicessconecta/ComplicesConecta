/**
 * % de perfil completo a partir de señales (true = campo/sección presente).
 * El perfil mostraba "0% Completo" aunque el demo tiene todos los datos,
 * porque el valor estaba hardcodeado a 0. Se calcula desde los datos reales
 * del perfil, igual en Single y en Pareja (regla espejo).
 */
export function computeProfileCompleteness(signals: boolean[]): number {
  if (signals.length === 0) return 0;
  const filled = signals.filter(Boolean).length;
  return Math.round((filled / signals.length) * 100);
}
