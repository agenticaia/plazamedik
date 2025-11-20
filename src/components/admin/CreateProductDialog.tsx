import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus } from 'lucide-react';
import { z } from 'zod';
import { ImageUpload } from './ImageUpload';

const CATEGORIAS = [
  { value: 'dolor-pies', label: '🦶 Dolor de Pies' },
  { value: 'dolor-piernas', label: '🦵 Dolor de Piernas' },
  { value: 'dolor-lumbar', label: '🪑 Dolor Lumbar' },
  { value: 'medias-compresion', label: '🧦 Medias de Compresión' },
  { value: 'accesorios', label: '✨ Accesorios' },
];

const productSchema = z.object({
  product_code: z.string().trim().min(1, 'Código requerido').max(20, 'Máximo 20 caracteres'),
  nombre_producto: z.string().trim().min(1, 'Nombre requerido').max(200, 'Máximo 200 caracteres'),
  categoria: z.string().min(1, 'Categoría requerida'),
  precio: z.number().min(0, 'Precio debe ser positivo').max(9999, 'Precio demasiado alto'),
  cantidad_stock: z.number().int().min(0, 'Stock debe ser 0 o mayor'),
  imagen_url: z.string().optional(),
});

interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateProductDialog({ open, onOpenChange, onSuccess }: CreateProductDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    product_code: '',
    nombre_producto: '',
    categoria: 'medias-compresion',
    precio: 0,
    cantidad_stock: 0,
    imagen_url: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setErrors({});

      // Validar datos
      const validatedData = productSchema.parse({
        ...formData,
        precio: Number(formData.precio),
        cantidad_stock: Number(formData.cantidad_stock),
      });

      // Verificar que el código no exista
      const { data: existingProduct } = await supabase
        .from('products')
        .select('product_code')
        .eq('product_code', validatedData.product_code)
        .maybeSingle();

      if (existingProduct) {
        setErrors({ product_code: 'Este código ya existe' });
        return;
      }

      // Crear producto en Supabase
      const { error } = await supabase
        .from('products')
        .insert({
          product_code: validatedData.product_code,
          nombre_producto: validatedData.nombre_producto,
          categoria: validatedData.categoria,
          precio: validatedData.precio,
          cantidad_stock: validatedData.cantidad_stock,
          imagen_url: validatedData.imagen_url || null,
          total_vendido: 0,
          total_views: 0,
          total_recommendations: 0,
        });

      if (error) throw error;

      toast({
        title: '✅ Producto creado',
        description: `${validatedData.nombre_producto} se creó correctamente`,
      });

      // Resetear formulario
      setFormData({
        product_code: '',
        nombre_producto: '',
        categoria: 'medias-compresion',
        precio: 0,
        cantidad_stock: 0,
        imagen_url: '',
      });

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          if (issue.path[0]) {
            newErrors[issue.path[0].toString()] = issue.message;
          }
        });
        setErrors(newErrors);
      } else {
        toast({
          title: '❌ Error',
          description: 'No se pudo crear el producto',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Producto</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_code">Código del Producto *</Label>
              <Input
                id="product_code"
                value={formData.product_code}
                onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                placeholder="Ej: MC-001"
                maxLength={20}
              />
              {errors.product_code && (
                <p className="text-sm text-destructive">{errors.product_code}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría *</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoria && (
                <p className="text-sm text-destructive">{errors.categoria}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre_producto">Nombre del Producto *</Label>
            <Input
              id="nombre_producto"
              value={formData.nombre_producto}
              onChange={(e) => setFormData({ ...formData, nombre_producto: e.target.value })}
              placeholder="Ej: Medias de Compresión 20-30 mmHg"
              maxLength={200}
            />
            {errors.nombre_producto && (
              <p className="text-sm text-destructive">{errors.nombre_producto}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precio">Precio (S/) *</Label>
              <Input
                id="precio"
                type="number"
                step="0.01"
                min="0"
                max="9999"
                value={formData.precio}
                onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
              />
              {errors.precio && (
                <p className="text-sm text-destructive">{errors.precio}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cantidad_stock">Stock Inicial *</Label>
              <Input
                id="cantidad_stock"
                type="number"
                min="0"
                value={formData.cantidad_stock}
                onChange={(e) => setFormData({ ...formData, cantidad_stock: parseInt(e.target.value) || 0 })}
              />
              {errors.cantidad_stock && (
                <p className="text-sm text-destructive">{errors.cantidad_stock}</p>
              )}
            </div>
          </div>

          <ImageUpload
            currentImageUrl={formData.imagen_url}
            onImageUrlChange={(url) => setFormData({ ...formData, imagen_url: url })}
            productCode={formData.product_code}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Producto
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
