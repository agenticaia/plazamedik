import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";

interface AddressSearchProps {
  value: string;
  onChange: (address: string, lat: number | null, lng: number | null) => void;
  placeholder?: string;
}

declare global {
  interface Window {
    initGoogleMaps?: () => void;
    google?: any;
  }
}

const AddressSearch = ({ value, onChange, placeholder = "Busca tu dirección..." }: AddressSearchProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setError("API key de Google Maps no configurada");
      setIsLoading(false);
      return;
    }

    const initAutocomplete = () => {
      if (!inputRef.current || !window.google) return;

      try {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ["address"],
          componentRestrictions: { country: "pe" },
          fields: ["formatted_address", "geometry", "name"]
        });

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current.getPlace();

          if (!place.geometry || !place.geometry.location) {
            setError("No se pudo obtener la ubicación de la dirección");
            return;
          }

          const address = place.formatted_address || place.name || "";
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          onChange(address, lat, lng);
          setError(null);
        });

        setIsLoading(false);
      } catch (err) {
        console.error("Error initializing autocomplete:", err);
        setError("Error al inicializar el buscador");
        setIsLoading(false);
      }
    };

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initAutocomplete();
    } else {
      // Load Google Maps script
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
      script.async = true;
      script.defer = true;

      window.initGoogleMaps = () => {
        initAutocomplete();
      };

      script.onerror = () => {
        setError("Error al cargar Google Maps");
        setIsLoading(false);
      };

      document.head.appendChild(script);

      return () => {
        // Cleanup
        if (window.initGoogleMaps) {
          delete window.initGoogleMaps;
        }
      };
    }
  }, [onChange]);

  return (
    <div className="space-y-2">
      <Label htmlFor="address" className="flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        Dirección *
      </Label>
      <Input
        ref={inputRef}
        id="address"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value, null, null)}
        placeholder={isLoading ? "Cargando mapa..." : placeholder}
        disabled={isLoading}
      />
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Escribe y selecciona tu dirección del menú desplegable
      </p>
    </div>
  );
};

export default AddressSearch;
