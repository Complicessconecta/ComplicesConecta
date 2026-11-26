import { useState } from "react";

interface ExpandableClubDescriptionProps {
  text: string;
  /** Clases del envoltorio (p. ej. `mb-4` cuando la descripción llevaba el margen). */
  className?: string;
  /** Clases del párrafo de la descripción. */
  textClassName?: string;
  /** Clases del botón Ver más / Ver menos (por defecto, legible en claro y oscuro). */
  buttonClassName?: string;
}

/**
 * Ronda 12 (stream B, 1a): descripción de club con expandir/contraer.
 *
 * Causa: la intro del club iba con `line-clamp-2` y sin ninguna vía
 * para leerla completa (en /clubs/eden-noir se veía
 * "…pista principal con iluminació…" y nada más). Ahora arranca
 * recortada a 2 líneas y el botón "Ver más" quita el recorte;
 * "Ver menos" lo restaura. El estado es local por tarjeta, así que
 * cada descripción se expande por separado.
 */
export const ExpandableClubDescription: React.FC<
  ExpandableClubDescriptionProps
> = ({
  text,
  className = "",
  textClassName = "",
  buttonClassName = "text-purple-700 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-200",
}) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={className}>
      <p className={`${textClassName} ${expanded ? "" : "line-clamp-2"}`}>
        {text}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className={`mt-1 text-sm font-medium ${buttonClassName}`}
      >
        {expanded ? "Ver menos" : "Ver más"}
      </button>
    </div>
  );
};

export default ExpandableClubDescription;
