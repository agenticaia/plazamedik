import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Download, CheckCircle2, AlertCircle, FileSpreadsheet } from 'lucide-react';

interface ImportProductsCSVProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ImportResult {
  success: number;
  errors: { row: number; error: string }[];
  skipped: number;
}

export function ImportProductsCSV({ open, onOpenChange, onSuccess }: ImportProductsCSVProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const template = `product_code,nombre_producto,categoria,precio,precio_anterior,cantidad_stock,descripcion_corta,ideal_para,tallas_disponibles,colores_disponibles,beneficios,especificaciones
750,Media Compresiva Hasta Rodilla 12-17 mmHg - Piel,trabajo-pie,55.74,69.68,50,Compresión ligera ideal para prevención,Personas que trabajan de pie,"S,M,L,XL",Piel,"Previene várices|Elimina hinchazón|Transpirable","Compresión: 12-17 mmHg|Material: 83% Poliamida"
850,Media Compresiva Hasta Rodilla 18-22 mmHg - Piel,varices,58.63,73.29,45,Compresión media para alivio efectivo,Personas con várices moderadas,"S,M,L,XL",Piel,"Alivia dolor|Reduce fatiga|Compresión graduada","Compresión: 18-22 mmHg|Material: 75% Poliamida"`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plantilla_productos.csv';
    link.click();
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    return lines.slice(1).map((line, index) => {
      const values = line.split(',');
      const row: any = { rowNumber: index + 2 };
      
      headers.forEach((header, i) => {
        let value = values[i]?.trim() || '';
        
        // Procesar arrays (separados por comas dentro de comillas o por pipe |)
        if (header === 'tallas_disponibles' || header === 'colores_disponibles' || 
            header === 'beneficios' || header === 'especificaciones') {
          if (value.includes('|')) {
            row[header] = value.split('|').map(v => v.trim()).filter(v => v);
          } else if (value.includes(',')) {
            row[header] = value.split(',').map(v => v.trim()).filter(v => v);
          } else {
            row[header] = value ? [value] : [];
          }
        } 
        // Procesar números
        else if (header === 'precio' || header === 'precio_anterior') {
          row[header] = value ? parseFloat(value) : null;
        } else if (header === 'cantidad_stock') {
          row[header] = value ? parseInt(value) : 50;
        }
        // Texto normal
        else {
          row[header] = value;
        }
      });
      
      return row;
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setResult(null);

      const text = await file.text();
      const products = parseCSV(text);

      const results: ImportResult = {
        success: 0,
        errors: [],
        skipped: 0,
      };

      for (const product of products) {
        try {
          // Validar campos requeridos
          if (!product.product_code || !product.nombre_producto || !product.categoria) {
            results.errors.push({
              row: product.rowNumber,
              error: 'Faltan campos requeridos (product_code, nombre_producto, categoria)',
            });
            continue;
          }

          // Verificar si el producto ya existe
          const { data: existing } = await supabase
            .from('products')
            .select('product_code')
            .eq('product_code', product.product_code)
            .single();

          if (existing) {
            results.skipped++;
            continue;
          }

          // Insertar producto
          const { error } = await supabase.from('products').insert({
            product_code: product.product_code,
            nombre_producto: product.nombre_producto,
            categoria: product.categoria,
            precio: product.precio || 0,
            precio_anterior: product.precio_anterior,
            cantidad_stock: product.cantidad_stock || 50,
            descripcion_corta: product.descripcion_corta,
            ideal_para: product.ideal_para,
            tallas_disponibles: product.tallas_disponibles || [],
            colores_disponibles: product.colores_disponibles || [],
            beneficios: product.beneficios || [],
            especificaciones: product.especificaciones || [],
          });

          if (error) throw error;
          results.success++;
        } catch (error) {
          results.errors.push({
            row: product.rowNumber,
            error: error instanceof Error ? error.message : 'Error desconocido',
          });
        }
      }

      setResult(results);

      if (results.success > 0) {
        toast({
          title: '✅ Importación completada',
          description: `${results.success} productos importados exitosamente`,
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast({
        title: '❌ Error',
        description: 'No se pudo procesar el archivo CSV',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Productos desde CSV</DialogTitle>
          <DialogDescription>
            Carga un archivo CSV con los productos para importarlos masivamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-2">Formato del CSV:</p>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>Usa comas (,) como separador de columnas</li>
                <li>Para arrays múltiples, usa pipe (|) o comas dentro del campo</li>
                <li>Campos requeridos: product_code, nombre_producto, categoria</li>
                <li>Los productos con códigos duplicados serán omitidos</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={downloadTemplate}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              Descargar Plantilla
            </Button>

            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Seleccionar Archivo
                </>
              )}
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {result && (
            <Alert className={result.success > 0 ? 'border-green-500 bg-green-50' : 'border-amber-500 bg-amber-50'}>
              {result.success > 0 ? (
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-600" />
              )}
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold">Resultado de la importación:</p>
                  <div className="text-sm space-y-1">
                    <p>✅ Importados: {result.success}</p>
                    <p>⏭️ Omitidos (duplicados): {result.skipped}</p>
                    <p>❌ Errores: {result.errors.length}</p>
                  </div>
                  {result.errors.length > 0 && (
                    <div className="mt-2 max-h-32 overflow-y-auto">
                      <p className="font-semibold text-red-600 text-sm">Errores encontrados:</p>
                      <ul className="text-xs list-disc list-inside space-y-1">
                        {result.errors.slice(0, 5).map((err, idx) => (
                          <li key={idx} className="text-red-600">
                            Fila {err.row}: {err.error}
                          </li>
                        ))}
                        {result.errors.length > 5 && (
                          <li className="text-red-600">... y {result.errors.length - 5} errores más</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
