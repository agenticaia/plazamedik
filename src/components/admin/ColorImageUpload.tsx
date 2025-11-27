import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ImageUpload } from './ImageUpload';
import { X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ColorImageUploadProps {
  colors: string[];
  imagesByColor: Record<string, string>;
  onImagesChange: (images: Record<string, string>) => void;
  productCode?: string;
}

export function ColorImageUpload({ 
  colors, 
  imagesByColor, 
  onImagesChange,
  productCode 
}: ColorImageUploadProps) {
  const [expandedColor, setExpandedColor] = useState<string | null>(null);

  const handleImageChange = (color: string, url: string) => {
    const updated = { ...imagesByColor };
    if (url) {
      updated[color] = url;
    } else {
      delete updated[color];
    }
    onImagesChange(updated);
  };

  if (colors.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          Primero agrega colores disponibles para poder subir imágenes por color
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Label>Imágenes por Color</Label>
      <p className="text-sm text-muted-foreground">
        Sube una imagen específica para cada color disponible
      </p>
      
      <div className="space-y-3">
        {colors.map((color) => (
          <div key={color} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full border-2"
                  style={{
                    backgroundColor: 
                      color.toLowerCase() === 'piel' ? '#f5d7c4' :
                      color.toLowerCase() === 'negro' ? '#1a1a1a' :
                      color.toLowerCase() === 'blanco' ? '#ffffff' :
                      color.toLowerCase() === 'beige' ? '#f5f5dc' :
                      '#e5e7eb'
                  }}
                />
                <span className="font-medium">{color}</span>
                {imagesByColor[color] && (
                  <span className="text-xs text-green-600">✓ Imagen cargada</span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setExpandedColor(expandedColor === color ? null : color)}
              >
                {expandedColor === color ? 'Ocultar' : 'Gestionar imagen'}
              </Button>
            </div>

            {expandedColor === color && (
              <ImageUpload
                currentImageUrl={imagesByColor[color] || ''}
                onImageUrlChange={(url) => handleImageChange(color, url)}
                productCode={`${productCode}_${color.toLowerCase()}`}
              />
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        💡 Tip: Si no subes una imagen para un color, se usará la imagen principal del producto
      </p>
    </div>
  );
}