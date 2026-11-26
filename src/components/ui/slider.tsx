import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/shared/lib/cn";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  // Ronda 11, stream C (ii): un Thumb por valor. Antes se renderizaba
  // UN solo Thumb aunque el valor fuera un rango de dos (`ageRange`:
  // [18, 65] en Discover y en el resto de filtros): el extremo
  // máximo no tenía perilla y Radix solo anclaba la primera. Con
  // `value`/`defaultValue` de un elemento, un Thumb como siempre.
  const values = props.value ?? props.defaultValue;
  const thumbCount = Array.isArray(values) ? Math.max(values.length, 1) : 1;
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className,
      )}
      {...props}
    >
      {/* Ronda 11, stream C (ii): colores EXPLÍCITOS, sin tokens.
          Causa raíz del "thumb desplazado debajo de la etiqueta": el
          thumb NO estaba desplazado (medido en vivo a 886 px: su
          centro coincide con el centro del track, offset 0), sino que
          la pista y la perilla eran INVISIBLES. El track usaba
          `bg-secondary`, el rango `bg-primary` y la perilla
          `border-primary bg-background`, y en este repo esos tokens
          son canales HSL sueltos (`--secondary: 25 90% 85%` en
          index.css, sin `hsl()`), así que en Tailwind v4 no resuelven
          a ningún color: pista `rgba(0,0,0,0)`, perilla transparente
          con borde casi blanco sobre fondo claro. Solo quedaba un
          circulito pálido flotando bajo la etiqueta, sin pista. Es la
          misma clase de bug que ya se documentó en el Switch de
          SinglePrivacySection. Con grises/morados explícitos la pista
          y la perilla se ven en tema claro y oscuro. */}
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-slate-300 dark:bg-white/25">
        <SliderPrimitive.Range className="absolute h-full bg-purple-600 dark:bg-fuchsia-400" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }).map((_, index) => (
        <SliderPrimitive.Thumb
          key={index}
          // El color del borde va en `style`, no en clase: index.css
          // tiene `* { @apply border-border; }` SIN capa, y las reglas
          // sin capa ganan a todas las utilidades `border-<color>` de
          // Tailwind (por eso `border-primary` tampoco se veía nunca:
          // el borde salía del `--border` global, casi blanco). Un
          // estilo en línea sí gana a esa regla.
          style={{ borderColor: "#9333ea" }}
          className="block h-5 w-5 rounded-full border-2 bg-white shadow-md ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-900"
        />
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
