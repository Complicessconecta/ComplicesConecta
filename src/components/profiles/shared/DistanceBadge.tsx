/**
 * Insignia de distancia aproximada (punto 3): "A ~12 km".
 * La cifra que se muestra NUNCA es la exacta: se aproxima con
 * `approximateDistanceKm` (mínimo 1 km). Si alguna de las dos partes
 * tiene la geolocalización desactivada, no se muestra nada.
 */
import { MapPin } from "lucide-react";
import { formatApproximateDistance } from "@/lib/geolocation";

interface DistanceBadgeProps {
  /** Distancia exacta en km (interna); se muestra aproximada. */
  distanceKm?: number | null;
  /** ¿El perfil listado comparte su ubicación? */
  profileSharesLocation?: boolean;
  /** ¿El espectador comparte su ubicación? */
  viewerSharesLocation?: boolean;
  className?: string;
}

export function DistanceBadge({
  distanceKm,
  profileSharesLocation = true,
  viewerSharesLocation = true,
  className = "",
}: DistanceBadgeProps) {
  if (!profileSharesLocation || !viewerSharesLocation) return null;
  const label = formatApproximateDistance(distanceKm);
  if (!label) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-800 border border-slate-300 dark:bg-white/10 dark:text-white/90 dark:border-white/20 px-2.5 py-1 text-[11px] ${className}`}
      title="Distancia aproximada para matching (nunca la exacta)"
    >
      <MapPin className="w-3 h-3" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
