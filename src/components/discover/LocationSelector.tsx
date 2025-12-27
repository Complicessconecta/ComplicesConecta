import { useState, useEffect } from "react";
import { MapPin, Navigation, Search } from "lucide-react";
import { Button } from '@/components/ui/buttons/Button';
import { Input } from '@/components/ui/forms/Input';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useToast } from "@/hooks/useToast";

interface LocationSelectorProps {
  onLocationChange: (location: { lat: number; lng: number; address: string; radius: number }) => void;
  initialRadius?: number;
}

export const LocationSelector = ({ onLocationChange, initialRadius = 10 }: LocationSelectorProps) => {
  const [address, setAddress] = useState("");
  const [radius, setRadius] = useState([initialRadius]);
  const [selectedCity, setSelectedCity] = useState("");
  const { location, error, isLoading, getCurrentLocation } = useGeolocation();
  const { toast } = useToast();

  // Ciudades populares de MÃ©xico
  const popularCities = [
    { name: "Ciudad de MÃ©xico", lat: 19.4326, lng: -99.1332 },
    { name: "Guadalajara", lat: 20.6597, lng: -103.3496 },
    { name: "Monterrey", lat: 25.6866, lng: -100.3161 },
    { name: "Puebla", lat: 19.0414, lng: -98.2063 },
    { name: "Tijuana", lat: 32.5149, lng: -117.0382 },
    { name: "CancÃºn", lat: 21.1619, lng: -86.8515 },
    { name: "MÃ©rida", lat: 20.9674, lng: -89.5926 },
    { name: "LeÃ³n", lat: 21.1619, lng: -101.6921 }
  ];

  useEffect(() => {
    if (location) {
      setAddress(`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
    }
  }, [location]);

  useEffect(() => {
    if (location) {
      onLocationChange({
        lat: location.latitude,
        lng: location.longitude,
        address: address || "UbicaciÃ³n actual",
        radius: radius[0]
      });
    }
    }, [location, radius, address, onLocationChange]);

  const handleUseCurrentLocation = async () => {
    try {
      await getCurrentLocation();
      toast({
        title: "UbicaciÃ³n obtenida",
        description: "Se ha detectado tu ubicaciÃ³n actual"
      });
    } catch {
      toast({
        title: "Error de ubicaciÃ³n",
        description: "No se pudo obtener tu ubicaciÃ³n. Verifica los permisos del navegador.",
        variant: "destructive"
      });
    }
  };

  const handleCitySelect = (cityName: string) => {
    const city = popularCities.find(c => c.name === cityName);
    if (city) {
      setSelectedCity(cityName);
      setAddress(cityName);
      onLocationChange({
        lat: city.lat,
        lng: city.lng,
        address: cityName,
        radius: radius[0]
      });
    }
  };

  const handleAddressSearch = async () => {
    if (!address.trim()) return;

    // SimulaciÃ³n de geocoding (en producciÃ³n usarÃ­as Google Maps API)
    // Por ahora, usamos Ciudad de MÃ©xico como fallback
    const fallbackLocation = { lat: 19.4326, lng: -99.1332 };
    
    onLocationChange({
      lat: fallbackLocation.lat,
      lng: fallbackLocation.lng,
      address: address,
      radius: radius[0]
    });

    toast({
      title: "UbicaciÃ³n establecida",
      description: `BÃºsqueda centrada en: ${address}`
    });
  };

  return (
    <div className="space-y-6 p-4 bg-card rounded-lg border">
      <div className="space-y-2">
        <Label className="text-base font-semibold flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          UbicaciÃ³n de bÃºsqueda
        </Label>
        <p className="text-sm text-muted-foreground">
          Define dÃ³nde quieres buscar personas cerca de ti
        </p>
      </div>

      {/* UbicaciÃ³n actual */}
      <div className="space-y-3">
        <Button
          variant="outline"
          onClick={handleUseCurrentLocation}
          disabled={isLoading}
          className="w-full flex items-center gap-2"
        >
          <Navigation className="h-4 w-4" />
          {isLoading ? "Obteniendo ubicaciÃ³n..." : "Usar mi ubicaciÃ³n actual"}
        </Button>
        
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      {/* Ciudades populares */}
      <div className="space-y-3">
        <Label>Ciudades populares</Label>
        <Select value={selectedCity} onValueChange={handleCitySelect}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una ciudad" />
          </SelectTrigger>
          <SelectContent>
            {popularCities.map((city) => (
              <SelectItem key={city.name} value={city.name}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* BÃºsqueda personalizada */}
      <div className="space-y-3">
        <Label htmlFor="address">DirecciÃ³n personalizada</Label>
        <div className="flex gap-2">
          <Input
            id="address"
            placeholder="Escribe una direcciÃ³n o ciudad..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleAddressSearch()}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleAddressSearch}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Radio de bÃºsqueda */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Radio de bÃºsqueda</Label>
          <span className="text-sm font-medium">{radius[0]} km</span>
        </div>
        
        <Slider
          value={radius}
          onValueChange={(value) => {
            setRadius(value);
            // Actualizamos inmediatamente el radio
            if (location || selectedCity || address) {
                            const cityLocation = popularCities.find(c => c.name === selectedCity);
              const currentLat = location?.latitude ?? cityLocation?.lat ?? 19.4326;
              const currentLng = location?.longitude ?? cityLocation?.lng ?? -99.1332;
              
              onLocationChange({
                lat: currentLat,
                lng: currentLng,
                address: address || selectedCity || "UbicaciÃ³n actual",
                radius: value[0]
              });
            }
          }}
          max={100}
          min={1}
          step={1}
          className="w-full"
        />
        
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 km</span>
          <span>50 km</span>
          <span>100 km</span>
        </div>
      </div>

      {/* InformaciÃ³n actual */}
      {(location || selectedCity) && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm">
            <span className="font-medium">BÃºsqueda activa:</span>
            <br />
            ðŸ“ {address || selectedCity || "UbicaciÃ³n actual"}
            <br />
            ðŸ“ Radio: {radius[0]} km
          </p>
        </div>
      )}
    </div>
  );
};
