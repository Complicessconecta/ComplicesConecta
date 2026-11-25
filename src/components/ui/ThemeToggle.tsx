import { Moon, Sun, Monitor, Check } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import { useTheme } from "@/components/ui/ThemeProvider";
import { useToast } from "@/hooks/useToast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function ThemeToggle({
  // "onDark": el botón vive sobre cromo oscuro de marca (dock y header
  // morados), así que el gatillo es blanco siempre. "auto": el botón vive
  // sobre el fondo de la página y sus colores siguen al tema activo
  // (fila superior en flujo de MainLayout). Por defecto "onDark".
  tone = "onDark",
}: {
  tone?: "onDark" | "auto";
}) {
  // Manejo seguro de useTheme para evitar errores cuando no hay ThemeProvider
  let theme: "light" | "dark" | "system" = "system";
  let setTheme: (_theme: "light" | "dark" | "system") => void = () => {};

  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    setTheme = themeContext.setTheme;
  } catch (error) {
    // Si no hay ThemeProvider, usar valores por defecto
    console.warn("ThemeProvider no disponible, usando valores por defecto");
  }

  const { toast } = useToast();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={
            tone === "auto"
              ? "btn-animated hover:scale-105 active:scale-95 bg-slate-900/5 border-slate-300 text-slate-900 hover:bg-slate-900/10 dark:bg-white/10 dark:border-white/20 dark:text-white dark:hover:bg-white/20 transition-all duration-300"
              : "btn-animated hover:scale-105 active:scale-95 bg-white/10 border-white/20 text-white hover:bg-white/20 transition-all duration-300"
          }
        >
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        // RONDA 5: el menú era un gradiente fucsia con texto `text-foreground`
        // (oscuro en tema claro): contraste pobre. Ahora fondo explícito
        // claro/oscuro según tema, igual que el panel de filtros.
        className="bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-700 shadow-xl"
      >
        <DropdownMenuItem
          onClick={() => {
            setTheme("light");
            // Forzar actualización inmediata
            const root = document.documentElement;
            root.classList.remove("dark");
            root.classList.add("light");
            toast({ title: "Tema", description: "☀️ Tema CLARO activado" });
          }}
          className="cursor-pointer text-slate-900 hover:bg-purple-100 dark:text-white dark:hover:bg-purple-900/50 transition-colors"
        >
          <Sun className="mr-2 h-4 w-4 text-yellow-500" />
          <span className="font-medium drop-shadow-sm">Claro</span>
          {theme === "light" && (
            <span className="ml-auto text-purple-600 dark:text-purple-400 font-bold">
              <Check className="h-4 w-4" />
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setTheme("dark");
            // Forzar actualización inmediata
            const root = document.documentElement;
            root.classList.remove("light");
            root.classList.add("dark");
            toast({ title: "Tema", description: "🌙 Tema OSCURO activado" });
          }}
          className="cursor-pointer text-slate-900 hover:bg-purple-100 dark:text-white dark:hover:bg-purple-900/50 transition-colors"
        >
          <Moon className="mr-2 h-4 w-4 text-blue-400" />
          <span className="font-medium drop-shadow-sm">Oscuro</span>
          {theme === "dark" && (
            <span className="ml-auto text-purple-600 dark:text-purple-400 font-bold">
              <Check className="h-4 w-4" />
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setTheme("system");
            // Aplicar tema del sistema inmediatamente
            const prefersDark = window.matchMedia(
              "(prefers-color-scheme: dark)",
            ).matches;
            const root = document.documentElement;
            root.classList.remove("light", "dark");
            root.classList.add(prefersDark ? "dark" : "light");
            toast({
              title: "Tema",
              description: `💻 Tema SISTEMA activado (${prefersDark ? "Oscuro" : "Claro"})`,
            });
          }}
          className="cursor-pointer text-slate-900 hover:bg-purple-100 dark:text-white dark:hover:bg-purple-900/50 transition-colors"
        >
          <Monitor className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span className="font-medium drop-shadow-sm">Sistema</span>
          {theme === "system" && (
            <span className="ml-auto text-purple-600 dark:text-purple-400 font-bold">
              <Check className="h-4 w-4" />
            </span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
