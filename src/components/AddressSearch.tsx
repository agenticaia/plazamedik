import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, AlertCircle, Wifi } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [gmapsAvailable, setGmapsAvailable] = useState(false);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_MAPS_CLIENT_ID;
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    // Usar Client ID si está disponible (recomendado), sino API Key
    const credential = clientId || apiKey;
    
    if (!credential) {
      setError("Credenciales de Google Maps no configuradas");
      setGmapsAvailable(false);
      setIsLoading(false);
      return;
    }

    const initAutocomplete = () => {
      if (!inputRef.current || !window.google) {
        return;
      }

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

        setGmapsAvailable(true);
        setIsLoading(false);
      } catch (err) {
        console.warn("Error initializing Google Maps autocomplete:", err);
        setError(null); // No mostrar error, solo usar entrada manual
        setGmapsAvailable(false);
        setIsLoading(false);
      }
    };

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initAutocomplete();
    } else {
      // Load Google Maps script
      const script = document.createElement("script");
      
      // Construir URL según credencial disponible
      let scriptUrl: string;
      if (clientId) {
        // Usar OAuth Client ID (recomendado)
        scriptUrl = `https://maps.googleapis.com/maps/api/js?client=${clientId}&libraries=places&callback=initGoogleMaps`;
      } else {
        // Fallback a API Key
        scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
      }
      
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;

      window.initGoogleMaps = () => {
        initAutocomplete();
      };

      script.onerror = () => {
        console.warn("Error loading Google Maps, allowing manual entry");
        setGmapsAvailable(false);
        setIsLoading(false);
      };

      document.head.appendChild(script);

      // Set timeout para evitar espera infinita
      const timeout = setTimeout(() => {
        setIsLoading(false);
        if (!gmapsAvailable) {
          setGmapsAvailable(false);
        }
      }, 5000);

      return () => {
        clearTimeout(timeout);
        if (window.initGoogleMaps) {
          delete window.initGoogleMaps;
        }
      };
    }
  }, [onChange, gmapsAvailable]);

  const handleManualAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    // Cuando el usuario ingresa manualmente, usar coordenadas genéricas de Lima
    // Esto permite que el formulario continúe, aunque sin GPS exacto
    if (gmapsAvailable) {
      // Si Google Maps está disponible, no permitir cambios manuales
      onChange(address, null, null);
    } else {
      // Si Google Maps no disponible, usar coordenadas de Lima como fallback
      const limaLat = -12.0462;
      const limaLng = -77.0371;
      onChange(address, limaLat, limaLng);
    }
  };

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
        onChange={handleManualAddressChange}
        placeholder={isLoading ? "Cargando..." : placeholder}
        disabled={isLoading}
        className={!gmapsAvailable ? "text-amber-900" : ""}
      />
      {error && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 text-xs">
            {error}
          </AlertDescription>
        </Alert>
      )}
      {!gmapsAvailable && !isLoading && (
        <Alert className="bg-blue-50 border-blue-200">
          <Wifi className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-xs">
            Ingresa tu dirección completa (calle, número, piso). Se usarán coordenadas de Lima.
          </AlertDescription>
        </Alert>
      )}
      {gmapsAvailable && (
        <p className="text-xs text-muted-foreground">
          Escribe y selecciona tu dirección del menú desplegable
        </p>
      )}
    </div>
  );
};

export default AddressSearch;
