import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, AlertCircle, RefreshCw, Database } from 'lucide-react';
import { products } from '@/data/products';
import { useToast } from '@/hooks/use-toast';

export default function SyncProducts() {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSync = async () => {
    try {
      setSyncing(true);
      setResult(null);

      const { data, error } = await supabase.functions.invoke('sync-products-to-db', {
        body: { products },
      });

      if (error) throw error;

      setResult(data);
      toast({
        title: '✅ Sincronización exitosa',
        description: data.message,
      });
    } catch (error) {
      console.error('Error syncing products:', error);
      toast({
        title: '❌ Error',
        description: 'No se pudo sincronizar los productos',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Sincronización de Productos</h1>
          <p className="text-muted-foreground mt-2">
            Sincroniza los productos estáticos con la base de datos
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Migrar Productos a Base de Datos
            </CardTitle>
            <CardDescription>
              Esta herramienta migrará todos los productos definidos en el código a la base de datos Supabase.
              Los productos existentes serán actualizados, los nuevos serán creados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Se encontraron <strong>{products.length} productos</strong> en el código estático.
                Esta operación actualizará la base de datos con esta información.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleSync} 
              disabled={syncing}
              size="lg"
              className="w-full"
            >
              {syncing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Sincronizar Productos
                </>
              )}
            </Button>

            {result && (
              <Alert className={result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold">{result.message}</p>
                    {result.results && (
                      <div className="text-sm space-y-1">
                        <p>✅ Creados: {result.results.created}</p>
                        <p>🔄 Actualizados: {result.results.updated}</p>
                        {result.results.errors.length > 0 && (
                          <div className="mt-2">
                            <p className="font-semibold text-red-600">Errores:</p>
                            <ul className="list-disc list-inside">
                              {result.results.errors.map((error: string, idx: number) => (
                                <li key={idx} className="text-red-600">{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información Importante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Arquitectura Unificada</p>
                <p className="text-muted-foreground">
                  Después de la sincronización, todos los componentes públicos (catálogo, detalles) 
                  usarán los datos de la base de datos en tiempo real.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Sincronización Automática</p>
                <p className="text-muted-foreground">
                  Los cambios que hagas en el panel de administración se reflejarán 
                  inmediatamente en el catálogo público.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Control de Stock</p>
                <p className="text-muted-foreground">
                  Solo los productos con stock disponible aparecerán en el catálogo público.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
