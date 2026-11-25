import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/shared/lib/cn";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // RONDA 10 (stream B, B2): la lista era `bg-muted p-1
      // text-white/90`: `bg-muted` no resuelve en Tailwind v4
      // (`--muted` es un triplete HSL crudo; el CSS compilado es
      // `background-color:var(--muted)`, inválido → transparente) y
      // el texto blanco incondicional quedaba blanco sobre lavanda en
      // claro (y sobre la imagen de fondo en oscuro). Fondo opaco
      // explícito en ambos temas.
      "items-center justify-center rounded-md bg-slate-200/70 dark:bg-white/10 p-1 text-slate-700 dark:text-white/85",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      // RONDA 8 (stream A): el inactivo era `text-white/60` incondicional:
      // en tema claro la etiqueta quedaba blanca sobre fondo claro
      // (invisible; en /requests solo se veía el badge "5" de Enviadas).
      // El `data-[state=inactive]:` tiene más especificidad que el
      // `text-slate-600` que pasan las páginas, así que el arreglo no
      // puede vivir en la página: va aquí, con el mismo blanco en oscuro.
      // RONDA 10 (stream B, B2): la pestaña activa era
      // `data-[state=active]:bg-background data-[state=active]:text-foreground`:
      // ambos tokens son tripletes HSL crudos que no resuelven en
      // Tailwind v4 (fondo transparente, color heredado) y la pestaña
      // quedaba blanca sobre lavanda / sobre la imagen de fondo.
      // Fondo y texto activos explícitos y opacos en ambos temas.
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-white/20 dark:data-[state=active]:text-white data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-900 dark:data-[state=inactive]:text-white/60 dark:data-[state=inactive]:hover:text-white",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
