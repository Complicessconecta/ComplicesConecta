/**
 * Protección de multimedia ajena en galerías.
 *
 * - Sin botón de descarga en contenido ajeno: este wrapper no renderiza
 *   ningún control de descarga y bloquea el menú contextual, el arrastre
 *   y la selección sobre el contenido cuando NO eres el dueño.
 * - Marca de agua: si `watermark` está activo, dibuja el texto del dueño
 *   en diagonal sobre la imagen (solo visual, con `pointer-events-none`).
 * - El dueño sí puede agregar/eliminar (los botones de gestión viven
 *   fuera de este wrapper, en cada galería).
 *
 * HONESTO: esto disuade la descarga casual, NO es protección absoluta.
 * Un usuario determinado aún puede hacer captura de pantalla, abrir las
 * herramientas del navegador o fotografiar la pantalla. No prometas
 * lo contrario en la UI.
 */
import type { ReactNode } from "react";

interface ProtectedMediaProps {
  children: ReactNode;
  /** true cuando quien mira es el dueño del perfil. */
  isOwner?: boolean;
  /** Mostrar la marca de agua (toggle de Privacidad del dueño). */
  watermark?: boolean;
  /** Texto de la marca de agua (alias del dueño). */
  watermarkText?: string;
  className?: string;
}

export function ProtectedMedia({
  children,
  isOwner = false,
  watermark = false,
  watermarkText = "ComplicesConecta",
  className,
}: ProtectedMediaProps) {
  const blockDownload = !isOwner;
  return (
    <div
      className={className}
      style={blockDownload ? { userSelect: "none" } : undefined}
      onContextMenu={blockDownload ? (e) => e.preventDefault() : undefined}
      onDragStart={blockDownload ? (e) => e.preventDefault() : undefined}
      // Los hijos <img> heredan la protección de arrastre.
      onCopy={blockDownload ? (e) => e.preventDefault() : undefined}
    >
      <div className="relative">
        {children}
        {watermark && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden"
          >
            <span className="rotate-[-24deg] whitespace-nowrap text-[11px] font-bold tracking-wide text-white/35 select-none">
              {watermarkText} • {watermarkText} • {watermarkText}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Props para bloquear descarga en un <img> suelto (sin wrapper). */
export function noDownloadProps(isOwner: boolean): {
  draggable: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDragStart?: (e: React.DragEvent) => void;
} {
  if (isOwner) return { draggable: true };
  return {
    draggable: false,
    onContextMenu: (e) => e.preventDefault(),
    onDragStart: (e) => e.preventDefault(),
  };
}
