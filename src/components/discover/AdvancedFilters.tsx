import { useMemo } from "react";
import { Sliders, Heart, MapPin, Briefcase, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/buttons/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/cards/Card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export interface FilterState {
  ageRange: [number, number];
  distance: [number];
  interests: string[];
  education: string;
  profession: string;
  relationshipType: string[];
  lifestyle: string[];
  bodyType: string;
  height: [number, number];
  smoking: string;
  drinking: string;
  children: string;
  religion: string;
  gender: string;
  experienceLevel: string;
  onlyVerified: boolean;
  onlyPremium: boolean;
  onlyOnline: boolean;
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
}

export const AdvancedFilters = ({
  filters,
  onFiltersChange,
  onReset,
}: AdvancedFiltersProps) => {
  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).reduce((acc, [k, v]) => {
      if (k === "ageRange" && (v?.[0] !== 18 || v?.[1] !== 65)) return acc + 1;
      if (k === "distance" && v?.[0] !== 25) return acc + 1;
      if (k === "height" && (v?.[0] !== 150 || v?.[1] !== 200)) return acc + 1;
      if (k === "interests" && Array.isArray(v) && v.length > 0) return acc + 1;
      if (k === "relationshipType" && Array.isArray(v) && v.length > 0)
        return acc + 1;
      if (k === "lifestyle" && Array.isArray(v) && v.length > 0) return acc + 1;
      if (typeof v === "string" && v !== "" && k !== "bodyType") return acc + 1;
      return acc;
    }, 0);
  }, [filters]);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onReset();
  };

  const availableInterests = [
    "Fiestas Privadas",
    "Intercambio de Parejas",
    "Eventos VIP",
    "Discreción Total",
    "Experiencias Nuevas",
    "Terceras Personas",
    "Intercambio Suave",
    "Clubs Exclusivos",
    "Parejas Verificadas",
    "Lifestyle Swinger",
    "Naturaleza",
    "Viajes",
    "Intercambio Completo",
    "Clubs Swinger México",
    "Eventos Exclusivos",
    "Mentalidad Abierta",
  ];

  const relationshipTypes = [
    "Parejas Swinger",
    "Encuentros Casuales",
    "Amistad con Beneficios",
    "Aventuras",
    "Experiencias Abiertas",
  ];

  const lifestyleOptions = [
    "Vida Nocturna",
    "Discreto",
    "Aventurero",
    "Experimentador",
    "Sociable",
    "Exclusivo",
  ];

  return (
    // Colores explícitos (no tokens bg-card/foreground): en Tailwind v4
    // esos tokens no resolvían y el panel quedaba con texto morado
    // oscuro sobre fondo morado oscuro, casi ilegible (full test).
    // RONDA 5 — NOTA: el texto ilegible que Wacko confirmó con captura
    // ("Mostrar perfiles sin verificar", "Tipo de Relacion",
    // "Solo se muestran perfiles verificados.", "(Demo/Produccin)") NO
    // vive en este componente: es el panel de filtros EN LÍNEA de
    // src/pages/Discover.tsx:896,924-927,963-984 (text-purple-800 sobre
    // fondo morado oscuro, sin acentos). Discover.tsx NO está en el
    // alcance de este stream; el fix va ahí con las mismas clases
    // explícitas de este archivo. Este componente ya trae todos sus
    // textos explícitos y sus acentos correctos ("Tipo de relación
    // buscada"); aquí solo se endurecieron los dos botones.
    <Card className="w-full max-w-md bg-white text-slate-900 border-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-slate-900 dark:text-white">
          <span className="flex items-center gap-2">
            <Sliders className="h-5 w-5" />
            Filtros Avanzados
          </span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">{activeFiltersCount}</Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Edad */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Heart className="h-4 w-4" />
            Edad: {filters.ageRange?.[0] ?? 18} - {filters.ageRange?.[1] ?? 65}{" "}
            años
          </Label>
          <Slider
            value={filters.ageRange}
            onValueChange={(value) =>
              updateFilter("ageRange", value as [number, number])
            }
            max={65}
            min={18}
            step={1}
            className="w-full"
          />
        </div>

        {/* Distancia */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <MapPin className="h-4 w-4" />
            Distancia: {filters.distance?.[0] ?? 25} km
          </Label>
          <Slider
            value={filters.distance}
            onValueChange={(value) =>
              updateFilter("distance", value as [number])
            }
            max={100}
            min={1}
            step={1}
            className="w-full"
          />
        </div>

        <Separator />

        {/* Intereses */}
        <div className="space-y-3">
          <Label className="text-slate-800 dark:text-slate-100">Intereses</Label>
          <div className="grid grid-cols-2 gap-2">
            {availableInterests.map((interest) => (
              <div key={interest} className="flex items-center space-x-2">
                <Checkbox
                  id={interest}
                  checked={(filters.interests || []).includes(interest)}
                  onCheckedChange={(checked) => {
                    const currentInterests = filters.interests || [];
                    const newInterests = checked
                      ? [...currentInterests, interest]
                      : currentInterests.filter((i) => i !== interest);
                    updateFilter("interests", newInterests);
                  }}
                />
                <Label htmlFor={interest} className="text-sm cursor-pointer text-slate-800 dark:text-slate-100">
                  {interest}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Educación */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <GraduationCap className="h-4 w-4" />
            Educación
          </Label>
          <Select
            value={filters.education}
            onValueChange={(value) => updateFilter("education", value)}
          >
            <SelectTrigger className="bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-600">
              <SelectValue placeholder="Selecciona nivel educativo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="secundaria">Educación Secundaria</SelectItem>
              <SelectItem value="formacion">Formación Profesional</SelectItem>
              <SelectItem value="universitaria">
                Educación Universitaria
              </SelectItem>
              <SelectItem value="postgrado">Postgrado/Máster</SelectItem>
              <SelectItem value="doctorado">Doctorado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Profesión */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <Briefcase className="h-4 w-4" />
            Área profesional
          </Label>
          <Select
            value={filters.profession}
            onValueChange={(value) => updateFilter("profession", value)}
          >
            <SelectTrigger className="bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-600">
              <SelectValue placeholder="Selecciona área profesional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tecnologia">Tecnología</SelectItem>
              <SelectItem value="salud">Salud</SelectItem>
              <SelectItem value="educacion">Educación</SelectItem>
              <SelectItem value="negocios">Negocios</SelectItem>
              <SelectItem value="arte">Arte y Creatividad</SelectItem>
              <SelectItem value="servicio">Servicio al Cliente</SelectItem>
              <SelectItem value="independiente">
                Trabajador Independiente
              </SelectItem>
              <SelectItem value="estudiante">Estudiante</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Tipo de relación */}
        <div className="space-y-3">
          <Label className="text-slate-800 dark:text-slate-100">Tipo de relación buscada</Label>
          <div className="space-y-2">
            {relationshipTypes.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={type}
                  checked={filters.relationshipType.includes(type)}
                  onCheckedChange={(checked) => {
                    const currentTypes = filters.relationshipType || [];
                    const newTypes = checked
                      ? [...currentTypes, type]
                      : currentTypes.filter((t) => t !== type);
                    updateFilter("relationshipType", newTypes);
                  }}
                />
                <Label htmlFor={type} className="text-sm cursor-pointer text-slate-800 dark:text-slate-100">
                  {type}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Estilo de vida */}
        <div className="space-y-3">
          <Label className="text-slate-800 dark:text-slate-100">Estilo de vida</Label>
          <div className="grid grid-cols-2 gap-2">
            {lifestyleOptions.map((lifestyle) => (
              <div key={lifestyle} className="flex items-center space-x-2">
                <Checkbox
                  id={lifestyle}
                  checked={filters.lifestyle.includes(lifestyle)}
                  onCheckedChange={(checked) => {
                    const currentLifestyle = filters.lifestyle || [];
                    const newLifestyle = checked
                      ? [...currentLifestyle, lifestyle]
                      : currentLifestyle.filter((l) => l !== lifestyle);
                    updateFilter("lifestyle", newLifestyle);
                  }}
                />
                <Label htmlFor={lifestyle} className="text-sm cursor-pointer text-slate-800 dark:text-slate-100">
                  {lifestyle}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Altura */}
        <div className="space-y-3">
          <Label className="text-slate-800 dark:text-slate-100">
            Altura: {filters.height?.[0] ?? 140}cm -{" "}
            {filters.height?.[1] ?? 220}cm
          </Label>
          <Slider
            value={filters.height}
            onValueChange={(value) =>
              updateFilter("height", value as [number, number])
            }
            max={220}
            min={140}
            step={5}
            className="w-full"
          />
        </div>

        {/* Otros filtros */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-slate-800 dark:text-slate-100">Fumar</Label>
            <Select
              value={filters.smoking}
              onValueChange={(value) => updateFilter("smoking", value)}
            >
              <SelectTrigger className="bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-600">
                <SelectValue placeholder="Fumar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nunca">Nunca</SelectItem>
                <SelectItem value="ocasional">Ocasionalmente</SelectItem>
                <SelectItem value="regular">Regularmente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-800 dark:text-slate-100">Beber</Label>
            <Select
              value={filters.drinking}
              onValueChange={(value) => updateFilter("drinking", value)}
            >
              <SelectTrigger className="bg-white text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-white dark:border-slate-600">
                <SelectValue placeholder="Beber" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nunca">Nunca</SelectItem>
                <SelectItem value="ocasional">Ocasionalmente</SelectItem>
                <SelectItem value="social">Socialmente</SelectItem>
                <SelectItem value="regular">Regularmente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-2 pt-4">
          {/* RONDA 5: colores explícitos en ambos temas. La variante
              "outline" del Button usa tokens (border-primary / bg-background)
              que en este panel quedaban poco legibles; con clases explícitas
              el contraste es real en claro y en oscuro. */}
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1 bg-white text-slate-900 border-slate-300 hover:bg-slate-100 dark:bg-slate-800 dark:text-white dark:border-slate-600 dark:hover:bg-slate-700"
          >
            Limpiar
          </Button>
          <Button
            variant="default"
            onClick={() => {}}
            className="flex-1 bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-500"
          >
            Aplicar Filtros
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

