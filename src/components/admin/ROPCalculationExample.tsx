import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Calculator, TrendingUp, AlertTriangle, CheckCircle2, Package } from "lucide-react";

export const ROPCalculationExample = () => {
  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Calculator className="h-6 w-6 text-primary" />
          Ejemplo de Cálculo: ROP para "Media Compresiva"
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Demostración práctica del algoritmo de punto de reorden con datos reales
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Paso 1: Datos Base */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            📊 Paso 1: Recopilación de Datos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-muted-foreground mb-2">Demanda Promedio Diaria (ADS)</p>
              <p className="text-3xl font-bold text-blue-600">5 <span className="text-lg">unidades/día</span></p>
              <p className="text-xs text-muted-foreground mt-1">
                Calculado sobre últimos 90 días de ventas
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-muted-foreground mb-2">Lead Time Normal (LT)</p>
              <p className="text-3xl font-bold text-purple-600">10 <span className="text-lg">días</span></p>
              <p className="text-xs text-muted-foreground mt-1">
                Proveedor: Atao Group
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-muted-foreground mb-2">Venta Máxima en 1 Día (MDS)</p>
              <p className="text-3xl font-bold text-amber-600">8 <span className="text-lg">unidades</span></p>
              <p className="text-xs text-muted-foreground mt-1">
                Pico histórico de demanda
              </p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-muted-foreground mb-2">Lead Time Máximo</p>
              <p className="text-3xl font-bold text-red-600">12 <span className="text-lg">días</span></p>
              <p className="text-xs text-muted-foreground mt-1">
                Peor caso registrado (retraso)
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Paso 2: Cálculo Base */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            🧮 Paso 2: Demanda Durante Lead Time
          </h3>
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Fórmula: ADS × Lead Time</p>
                <div className="bg-white dark:bg-gray-900 p-4 rounded border font-mono text-sm">
                  <p>5 unidades/día × 10 días = <span className="text-blue-600 font-bold text-lg">50 unidades</span></p>
                </div>
                <p className="text-xs text-muted-foreground">
                  ⚠️ Problema: Si pides cuando tienes 50, llegarás a cero justo cuando llegue el proveedor. 
                  Sin margen de error para retrasos o picos de demanda.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <Separator />

        {/* Paso 3: Stock de Seguridad */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            🛡️ Paso 3: Cálculo del Stock de Seguridad
          </h3>
          <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  El "Factor Miedo" - Protección contra variabilidad
                </p>
                <div className="bg-white dark:bg-gray-900 p-4 rounded border space-y-2">
                  <p className="font-semibold">Fórmula de Stock de Seguridad:</p>
                  <p className="font-mono text-sm">
                    (MDS × Max LT) - (ADS × Normal LT)
                  </p>
                  <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded">
                    <p className="font-mono">(8 × 12) - (5 × 10)</p>
                    <p className="font-mono">= 96 - 50</p>
                    <p className="font-mono text-lg">= <span className="text-amber-600 font-bold">46 unidades</span></p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  💡 Este colchón protege contra el peor escenario: demanda alta durante un retraso del proveedor.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <Separator />

        {/* Paso 4: ROP Final */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            ✅ Paso 4: Reorder Point (ROP) Final
          </h3>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-6 rounded-lg border-2 border-green-300 dark:border-green-700">
            <div className="text-center space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Fórmula Final:</p>
                <p className="font-mono text-lg">ROP = Demanda Base + Stock Seguridad</p>
                <p className="font-mono text-xl mt-2">ROP = 50 + 46</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border-2 border-green-500 shadow-lg">
                <p className="text-5xl font-bold text-green-600">96</p>
                <p className="text-lg text-muted-foreground mt-2">unidades</p>
              </div>
              <Badge className="text-lg px-4 py-2" variant="default">
                🎯 Punto de Reorden Automático
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Conclusión */}
        <Alert className="border-primary bg-primary/5">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-lg">🤖 Acción Automática del Sistema:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    Cuando el inventario de <strong>"Media Compresiva"</strong> baje a <strong>96 unidades</strong>, 
                    el sistema creará automáticamente un borrador de Orden de Compra.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    La PO sugerirá pedir <strong>104 unidades</strong> (para volver al objetivo de 200 stock).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    Proveedor asignado: <strong>Atao Group</strong> (Lead time: 10 días).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>
                    Se enviará una <strong>notificación crítica</strong> si el stock cae por debajo de 48 unidades (50% del ROP).
                  </span>
                </li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Métricas del Producto Real */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-sm font-semibold mb-3">📈 Estado Actual del Producto:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Stock Actual:</span>
              <p className="font-bold text-lg">100 unid.</p>
            </div>
            <div>
              <span className="text-muted-foreground">ROP Configurado:</span>
              <p className="font-bold text-lg text-amber-600">96 unid.</p>
            </div>
            <div>
              <span className="text-muted-foreground">Días de Cobertura:</span>
              <p className="font-bold text-lg text-blue-600">20 días</p>
            </div>
            <div>
              <span className="text-muted-foreground">Estado:</span>
              <Badge variant="default" className="mt-1">✅ OK</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
