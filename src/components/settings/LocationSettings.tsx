import { useEffect, useState } from "react";
import { Button } from "@/components/ui/buttons/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/cards/Card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { MapPin, Navigation, AlertCircle } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { logger } from "@/lib/logger";
import { useAuth } from "@/features/auth/useAuth";
import { useToast } from "@/hooks/useToast";
import {
  loadSettingsStateRemote,
  saveSettingsState,
} from "@/components/settings/settingsStorage";

const DEFAULT_LOCATION = {
  search_radius: 25,
  auto_detect_location: false,
  show_distance: true,
  precise_location: true,
  location_history: false,
  s2_level: 15,
  geolocation_enabled: true,
};

export const LocationSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loaded, setLoaded] = useState(false);
  const [searchRadius, setSearchRadius] = useState([
    DEFAULT_LOCATION.search_radius,
  ]);
  const [autoDetectLocation, setAutoDetectLocation] = useState(
    DEFAULT_LOCATION.auto_detect_location,
  );
  const [showDistance, setShowDistance] = useState(
    DEFAULT_LOCATION.show_distance,
  );
  const [preciseLocation, setPreciseLocation] = useState(
    DEFAULT_LOCATION.precise_location,
  );
  const [locationHistory, setLocationHistory] = useState(
    DEFAULT_LOCATION.location_history,
  );
  const [s2Level, setS2Level] = useState([DEFAULT_LOCATION.s2_level]); // Nivel de precisión S2 (10-20)
  const [geolocationEnabled, setGeolocationEnabled] = useState(
    DEFAULT_LOCATION.geolocation_enabled,
  );
  const { location, error, isLoading, getCurrentLocation } = useGeolocation();

  // Cargar los valores guardados (localStorage en demo, BD en real).
  // Antes el estado siempre arrancaba en los defaults y Guardar solo
  // hacía log: "Mostrar distancia" no persistía tras Guardar.
  useEffect(() => {
    if (!user?.id || loaded) return;
    let cancelled = false;
    void loadSettingsStateRemote(user.id, DEFAULT_LOCATION).then((stored) => {
      if (cancelled) return;
      setSearchRadius([stored.search_radius]);
      setAutoDetectLocation(stored.auto_detect_location);
      setShowDistance(stored.show_distance);
      setPreciseLocation(stored.precise_location);
      setLocationHistory(stored.location_history);
      setS2Level([stored.s2_level]);
      setGeolocationEnabled(stored.geolocation_enabled);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id, loaded]);

  const s2LevelValue = s2Level[0] ?? 15;

  const handleLocationPermission = async () => {
    setAutoDetectLocation(true);
    await getCurrentLocation();
  };

  const handleSave = async () => {
    const patch = {
      search_radius: searchRadius[0],
      auto_detect_location: autoDetectLocation,
      show_distance: showDistance,
      precise_location: preciseLocation,
      location_history: locationHistory,
      s2_level: s2Level[0],
      geolocation_enabled: geolocationEnabled,
    };
    try {
      logger.info("Guardando configuración de ubicación:", patch);
      await saveSettingsState(user?.id, patch);
      logger.info("✅ Configuración de ubicación guardada");
      toast({
        title: "Configuración guardada",
        description: "Tus preferencias de ubicación han sido guardadas",
      });
    } catch (error) {
      logger.error("Error guardando configuración:", { error });
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración de ubicación",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Location */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ubicación Actual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {location ? (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Navigation className="h-4 w-4 text-primary" />
                <span className="font-medium">Ubicación detectada</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Latitud: {location.latitude.toFixed(6)}
                <br />
                Longitud: {location.longitude.toFixed(6)}
              </p>
            </div>
          ) : (
            <div className="text-center py-6">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">
                Ubicación no detectada
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Permite el acceso a tu ubicación para encontrar personas cerca
                de ti
              </p>
              <Button
                variant="love"
                onClick={handleLocationPermission}
                disabled={isLoading}
                className="gap-2"
              >
                <Navigation className="h-4 w-4" />
                {isLoading ? "Detectando..." : "Detectar Ubicación"}
              </Button>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Error de ubicación</span>
              </div>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-detect">Detección automática</Label>
              <p className="text-sm text-muted-foreground">
                Actualizar ubicación automáticamente
              </p>
            </div>
            <Switch
              id="auto-detect"
              checked={autoDetectLocation}
              onCheckedChange={setAutoDetectLocation}
            />
          </div>
        </CardContent>
      </Card>

      {/* Search Preferences */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Preferencias de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Radio de búsqueda: {searchRadius[0]} km
            </Label>
            <Slider
              value={searchRadius}
              onValueChange={setSearchRadius}
              max={100}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 km</span>
              <span>100 km</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-distance">Mostrar distancia</Label>
              <p className="text-sm text-muted-foreground">
                Mostrar la distancia en los perfiles
              </p>
            </div>
            <Switch
              id="show-distance"
              checked={showDistance}
              onCheckedChange={setShowDistance}
            />
          </div>
        </CardContent>
      </Card>

      {/* Location Privacy */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Privacidad de Ubicación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground mb-1">
                  Tu privacidad es importante
                </h4>
                <p className="text-sm text-muted-foreground">
                  Tu ubicación exacta nunca se comparte. Solo mostramos la
                  distancia aproximada a otros usuarios para mejorar las
                  conexiones.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="geolocation-enabled">
                  Activar geolocalización
                </Label>
                <p className="text-sm text-muted-foreground">
                  Permitir que la app use tu ubicación
                </p>
              </div>
              <Switch
                id="geolocation-enabled"
                checked={geolocationEnabled}
                onCheckedChange={(enabled) => {
                  setGeolocationEnabled(enabled);
                  if (!enabled) {
                    logger.info("Geolocalización desactivada por usuario");
                  }
                }}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="s2-level">
                    Precisión de ubicación: Nivel {s2LevelValue}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Nivel {s2LevelValue}: ~
                    {s2LevelValue <= 12
                      ? "100+"
                      : s2LevelValue <= 15
                        ? "1"
                        : "0.1"}
                    km² (más bajo = más privacidad)
                  </p>
                </div>
              </div>
              <Slider
                value={s2Level}
                onValueChange={(value) => {
                  setS2Level(value);
                  logger.info("S2 Level ajustado", { level: value[0] });
                }}
                max={20}
                min={10}
                step={1}
                className="w-full"
                disabled={!geolocationEnabled}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Nivel 10 (Bajo - ~100km²)</span>
                <span>Nivel 20 (Alto - ~0.01km²)</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="precise-location">Ubicación precisa</Label>
                <p className="text-sm text-muted-foreground">
                  Usar GPS para ubicación más exacta
                </p>
              </div>
              <Switch
                id="precise-location"
                checked={preciseLocation}
                onCheckedChange={setPreciseLocation}
                disabled={!geolocationEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="location-history">
                  Historial de ubicaciones
                </Label>
                <p className="text-sm text-muted-foreground">
                  Recordar ubicaciones visitadas
                </p>
              </div>
              <Switch
                id="location-history"
                checked={locationHistory}
                onCheckedChange={setLocationHistory}
                disabled={!geolocationEnabled}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button variant="love" size="lg" onClick={handleSave}>
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
};
