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
    
    console.log("🔍 AddressSearch - Inicializando...");
    console.log("📍 Client ID disponible:", !!clientId);
    console.log("🔑 API Key disponible:", !!apiKey);
    console.log("✅ Credencial a usar:", credential ? "SÍ" : "NO");
    
    if (!credential) {
      const msg = "Credenciales de Google Maps no configuradas";
      console.error("❌", msg);
      setError(msg);
      setGmapsAvailable(false);
      setIsLoading(false);
      return;
    }

    const initAutocomplete = () => {
      console.log("🎯 initAutocomplete llamado");
      console.log("📌 inputRef.current:", !!inputRef.current);
      console.log("🗺️ window.google:", !!window.google);
      console.log("📍 window.google.maps:", window.google?.maps ? "SÍ" : "NO");
      console.log("🏪 window.google.maps.places:", window.google?.maps?.places ? "SÍ" : "NO");
      
      if (!inputRef.current || !window.google) {
        console.warn("⚠️ No se puede inicializar: falta inputRef o window.google");
        return;
      }

      try {
        console.log("🚀 Creando Autocomplete instance...");
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ["address"],
          componentRestrictions: { country: "pe" },
          fields: ["formatted_address", "geometry", "name"]
        });
        console.log("✅ Autocomplete creado exitosamente");

        autocompleteRef.current.addListener("place_changed", () => {
          console.log("📍 place_changed event disparado");
          const place = autocompleteRef.current.getPlace();
          
          console.log("📦 Place object:", place);
          console.log("🗺️ Geometry:", place.geometry);
          console.log("📍 Location:", place.geometry?.location);

          if (!place.geometry || !place.geometry.location) {
            const msg = "No se pudo obtener la ubicación de la dirección";
            console.error("❌", msg);
            setError(msg);
            return;
          }

          const address = place.formatted_address || place.name || "";
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          console.log("✅ Dirección obtenida:", { address, lat, lng });
          onChange(address, lat, lng);
          setError(null);
        });

        setGmapsAvailable(true);
        setIsLoading(false);
        console.log("✅ Autocomplete inicializado correctamente");
      } catch (err) {
        console.error("❌ Error en initAutocomplete:", err);
        setError(null); // No mostrar error, solo usar entrada manual
        setGmapsAvailable(false);
        setIsLoading(false);
      }
    };

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      console.log("✅ Google Maps ya cargado");
      initAutocomplete();
    } else {
      console.log("📥 Cargando script de Google Maps...");
      
      // Load Google Maps script
      const script = document.createElement("script");
      
      // Construir URL según credencial disponible
      let scriptUrl: string;
      if (clientId) {
        // Usar OAuth Client ID (recomendado)
        scriptUrl = `https://maps.googleapis.com/maps/api/js?client=${clientId}&libraries=places&callback=initGoogleMaps`;
        console.log("🔐 URL: OAuth Client ID");
      } else {
        // Fallback a API Key
        scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
        console.log("🔑 URL: API Key");
      }
      
      console.log("📍 Script URL:", scriptUrl.substring(0, 80) + "...");
      
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;

      window.initGoogleMaps = () => {
        console.log("🔔 Callback initGoogleMaps ejecutado");
        initAutocomplete();
      };

      script.onerror = (err) => {
        console.error("❌ Error cargando Google Maps script:", err);
        setGmapsAvailable(false);
        setIsLoading(false);
      };

      script.onload = () => {
        console.log("✅ Script de Google Maps cargado");
      };

      document.head.appendChild(script);
      console.log("📄 Script agregado al DOM");

      // Set timeout para evitar espera infinita
      const timeout = setTimeout(() => {
        console.warn("⏱️ Timeout: Google Maps tardó más de 5 segundos");
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
    console.log("✏️ Dirección manual ingresada:", address);
    
    // Cuando el usuario ingresa manualmente, usar coordenadas genéricas de Lima
    // Esto permite que el formulario continúe, aunque sin GPS exacto
    if (gmapsAvailable) {
      // Si Google Maps está disponible, no permitir cambios manuales
      console.log("📍 Google Maps disponible - esperando selección de dropdown");
      onChange(address, null, null);
    } else {
      // Si Google Maps no disponible, usar coordenadas de Lima como fallback
      const limaLat = -12.0462;
      const limaLng = -77.0371;
      console.log("📍 Usando fallback Lima:", { lat: limaLat, lng: limaLng });
      onChange(address, limaLat, limaLng);
    }
  };

  console.log("🎨 Renderizando AddressSearch:", { isLoading, gmapsAvailable, error });

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
        <Alert className="bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 text-xs">
            ❌ {error}
          </AlertDescription>
        </Alert>
      )}
      {!gmapsAvailable && !isLoading && (
        <Alert className="bg-blue-50 border-blue-200">
          <Wifi className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-xs">
            ℹ️ Ingresa tu dirección completa. Se usarán coordenadas de Lima como referencia.
          </AlertDescription>
        </Alert>
      )}
      {gmapsAvailable && (
        <p className="text-xs text-muted-foreground">
          ✅ Escribe y selecciona tu dirección del menú desplegable
        </p>
      )}
    </div>
  );
};

export default AddressSearch;
