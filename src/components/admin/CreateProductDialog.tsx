import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { ImageUpload } from './ImageUpload';
import { DynamicListInput } from './DynamicListInput';
import { MultiSelectChips } from './MultiSelectChips';

const CATEGORIAS = [
  { value: 'dolor-pies', label: '🦶 Dolor de Pies' },
  { value: 'dolor-piernas', label: '🦵 Dolor de Piernas' },
  { value: 'dolor-lumbar', label: '🪑 Dolor Lumbar' },
  { value: 'medias-compresion', label: '🧦 Medias de Compresión' },
  { value: 'accesorios', label: '✨ Accesorios' },
];

const TALLAS_SUGERENCIAS = ['S', 'M', 'L', 'XL', '2XL', '3XL'];
const COLORES_SUGERENCIAS = ['Piel', 'Negro', 'Blanco', 'Beige'];

const productSchema = z.object({
  product_code: z.string().trim().min(1, 'Código requerido').max(20, 'Máximo 20 caracteres'),
  nombre_producto: z.string().trim().min(1, 'Nombre requerido').max(200, 'Máximo 200 caracteres'),
  categoria: z.string().min(1, 'Categoría requerida'),
  precio: z.number().min(0, 'Precio debe ser positivo').max(9999, 'Precio demasiado alto'),
  cantidad_stock: z.number().int().min(0, 'Stock debe ser 0 o mayor'),
  imagen_url: z.string().optional(),
  descripcion_corta: z.string().optional(),
  precio_anterior: z.number().optional(),
  ideal_para: z.string().optional(),
});

interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateProductDialog({ open, onOpenChange, onSuccess }: CreateProductDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [codeExists, setCodeExists] = useState(false);
  const [formData, setFormData] = useState({
    product_code: '',
    nombre_producto: '',
    categoria: 'medias-compresion',
    precio: 0,
    cantidad_stock: 0,
    imagen_url: '',
    descripcion_corta: '',
    precio_anterior: 0,
    tallas_disponibles: [] as string[],
    colores_disponibles: [] as string[],
    ideal_para: '',
    beneficios: [] as string[],
    especificaciones: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Verificar si el código de producto ya existe
  useEffect(() => {
    const checkProductCode = async () => {
      if (!formData.product_code) {
        setCodeExists(false);
        return;
      }

      const { data } = await supabase
        .from('products')
        .select('product_code')
        .eq('product_code', formData.product_code)
        .maybeSingle();

      setCodeExists(!!data);
    };

    const debounce = setTimeout(checkProductCode, 500);
    return () => clearTimeout(debounce);
  }, [formData.product_code]);

  const handleGenerateWithAI = async () => {
    if (!formData.nombre_producto) {
      toast({
        title: '❌ Error',
        description: 'Debes ingresar el nombre del producto primero',
        variant: 'destructive',
      });
      return;
    }

    try {
      setGeneratingAI(true);
      const { data, error } = await supabase.functions.invoke('generate-product-content', {
        body: {
          productName: formData.nombre_producto,
          categoria: formData.categoria,
          currentDescription: formData.descripcion_corta,
        },
      });

      if (error) throw error;

      setFormData(prev => ({
        ...prev,
        descripcion_corta: data.descripcion_corta,
        ideal_para: data.ideal_para,
        beneficios: data.beneficios,
        especificaciones: data.especificaciones,
      }));

      toast({
        title: '✨ Contenido generado',
        description: 'El contenido ha sido generado exitosamente',
      });
    } catch (error) {
      console.error('Error generating content:', error);
      toast({
        title: '❌ Error',
        description: 'No se pudo generar el contenido con IA',
        variant: 'destructive',
      });
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (codeExists) {
      toast({
        title: '❌ Error',
        description: 'Este código de producto ya existe',
        variant: 'destructive',
      });
      return;
    }
    
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
          descripcion_corta: formData.descripcion_corta || null,
          precio_anterior: formData.precio_anterior || null,
          tallas_disponibles: formData.tallas_disponibles,
          colores_disponibles: formData.colores_disponibles,
          ideal_para: formData.ideal_para || null,
          beneficios: formData.beneficios,
          especificaciones: formData.especificaciones,
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
        descripcion_corta: '',
        precio_anterior: 0,
        tallas_disponibles: [],
        colores_disponibles: [],
        ideal_para: '',
        beneficios: [],
        especificaciones: [],
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
          <div className="flex items-center justify-between">
            <DialogTitle>Crear Nuevo Producto</DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleGenerateWithAI}
              disabled={generatingAI || !formData.nombre_producto}
            >
              {generatingAI ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generar con IA
                </>
              )}
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product_code">Código del Producto *</Label>
              <Input
                id="product_code"
                value={formData.product_code}
                onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                placeholder="Ej: 750, 850, 870a"
                maxLength={20}
                className={codeExists ? 'border-destructive' : ''}
              />
              {codeExists && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Este código ya existe en la base de datos
                  </AlertDescription>
                </Alert>
              )}
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

          <div className="space-y-2">
            <Label htmlFor="descripcion_corta">Descripción Corta</Label>
            <Textarea
              id="descripcion_corta"
              value={formData.descripcion_corta}
              onChange={(e) => setFormData({ ...formData, descripcion_corta: e.target.value })}
              placeholder="Ej: Compresión ligera ideal para prevención"
              rows={2}
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precio">Precio Actual (S/) *</Label>
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
              <Label htmlFor="precio_anterior">Precio Anterior (S/)</Label>
              <Input
                id="precio_anterior"
                type="number"
                step="0.01"
                min="0"
                max="9999"
                value={formData.precio_anterior}
                onChange={(e) => setFormData({ ...formData, precio_anterior: parseFloat(e.target.value) || 0 })}
                placeholder="Ej: 69.68"
              />
              <p className="text-xs text-muted-foreground">Para mostrar descuento</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          <MultiSelectChips
            label="Tallas Disponibles"
            items={formData.tallas_disponibles}
            onChange={(items) => setFormData({ ...formData, tallas_disponibles: items })}
            placeholder="Ej: S, M, L, XL"
            suggestions={TALLAS_SUGERENCIAS}
          />

          <MultiSelectChips
            label="Colores Disponibles"
            items={formData.colores_disponibles}
            onChange={(items) => setFormData({ ...formData, colores_disponibles: items })}
            placeholder="Ej: Piel, Negro"
            suggestions={COLORES_SUGERENCIAS}
          />

          <div className="space-y-2">
            <Label htmlFor="ideal_para">Ideal Para</Label>
            <Textarea
              id="ideal_para"
              value={formData.ideal_para}
              onChange={(e) => setFormData({ ...formData, ideal_para: e.target.value })}
              placeholder="Ej: Personas que trabajan de pie y buscan prevenir problemas circulatorios"
              rows={2}
              maxLength={300}
            />
          </div>

          <DynamicListInput
            label="Beneficios"
            items={formData.beneficios}
            onChange={(items) => setFormData({ ...formData, beneficios: items })}
            placeholder="Ej: Previene várices por estar muchas horas de pie"
          />

          <DynamicListInput
            label="Especificaciones"
            items={formData.especificaciones}
            onChange={(items) => setFormData({ ...formData, especificaciones: items })}
            placeholder="Ej: Compresión: 12-17 mmHg (Ligera)"
          />

          <ImageUpload
            currentImageUrl={formData.imagen_url}
            onImageUrlChange={(url) => setFormData({ ...formData, imagen_url: url })}
            productCode={formData.product_code}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || codeExists}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Producto'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
