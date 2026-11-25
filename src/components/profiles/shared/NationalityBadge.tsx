/**
 * Insignia de nacionalidad (punto 1): bandera + nombre del país.
 * No renderiza nada si no hay país válido.
 */
import { formatNationality, getCountryByCode } from "@/lib/countries";

interface NationalityBadgeProps {
  countryCode?: string | null;
  className?: string;
}

export function NationalityBadge({
  countryCode,
  className = "",
}: NationalityBadgeProps) {
  const country = getCountryByCode(countryCode);
  if (!country) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-white/10 text-white/90 border border-white/20 px-2.5 py-1 text-[11px] shadow-lg backdrop-blur-md ${className}`}
      title={`Nacionalidad: ${country.name}`}
    >
      <span aria-hidden="true">{country.flag}</span>
      <span>{country.name}</span>
      <span className="sr-only">{formatNationality(country.code)}</span>
    </span>
  );
}
