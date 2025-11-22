import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp } from "lucide-react";

export const ROPSimulator = () => {
  const [ads, setAds] = useState(5); // Average Daily Sales
  const [leadTime, setLeadTime] = useState(7); // Lead Time in days
  const [mds, setMds] = useState(10); // Max Daily Sales

  // Cálculo del ROP en tiempo real
  const calculateROP = () => {
    const safetyLeadTime = Math.ceil(leadTime * 1.3); // +30% buffer
    const demandDuringLT = ads * safetyLeadTime;
    const safetyStock = (mds - ads) * safetyLeadTime;
    const rop = Math.ceil(demandDuringLT + safetyStock);
    
    return {
      rop,
      demandDuringLT: Math.ceil(demandDuringLT),
      safetyStock: Math.ceil(safetyStock),
      safetyLeadTime
    };
  };

  const result = calculateROP();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Simulador Interactivo de ROP
        </CardTitle>
        <CardDescription>
          Ajusta los valores y observa cómo cambia el punto de reorden en tiempo real
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Controles interactivos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* ADS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Ventas Promedio Diarias (ADS)
              </Label>
              <Badge variant="secondary" className="text-base font-bold">
                {ads} unidades
              </Badge>
            </div>
            <Slider
              value={[ads]}
              onValueChange={(value) => setAds(value[0])}
              min={1}
              max={50}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Promedio de unidades vendidas por día
            </p>
          </div>

          {/* Lead Time */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Lead Time (LT)
              </Label>
              <Badge variant="secondary" className="text-base font-bold">
                {leadTime} días
              </Badge>
            </div>
            <Slider
              value={[leadTime]}
              onValueChange={(value) => setLeadTime(value[0])}
              min={1}
              max={60}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Días que tarda en llegar el pedido
            </p>
          </div>

          {/* MDS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Venta Máxima Diaria (MDS)
              </Label>
              <Badge variant="secondary" className="text-base font-bold">
                {mds} unidades
              </Badge>
            </div>
            <Slider
              value={[mds]}
              onValueChange={(value) => setMds(value[0])}
              min={ads}
              max={100}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Máximo vendido en un solo día
            </p>
          </div>
        </div>

        {/* Resultado visual */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* ROP Final */}
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="pt-6 pb-4">
                <div className="text-center">
                  <TrendingUp className="h-6 w-6 mx-auto mb-2 opacity-80" />
                  <div className="text-3xl font-bold">{result.rop}</div>
                  <div className="text-xs opacity-80 mt-1">ROP Calculado</div>
                </div>
              </CardContent>
            </Card>

            {/* Demanda durante LT */}
            <Card>
              <CardContent className="pt-6 pb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{result.demandDuringLT}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Demanda Durante LT
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Safety Stock */}
            <Card>
              <CardContent className="pt-6 pb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">{result.safetyStock}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Stock de Seguridad
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* LT con buffer */}
            <Card>
              <CardContent className="pt-6 pb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{result.safetyLeadTime}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    LT con +30% Buffer
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Fórmula explicada */}
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <p className="text-sm font-semibold">📐 Fórmula Aplicada:</p>
          <div className="text-sm space-y-1 font-mono">
            <div>
              <strong>Lead Time Seguro:</strong> {leadTime} × 1.3 = {result.safetyLeadTime} días
            </div>
            <div>
              <strong>Demanda Durante LT:</strong> {ads} × {result.safetyLeadTime} = {result.demandDuringLT}
            </div>
            <div>
              <strong>Safety Stock:</strong> ({mds} - {ads}) × {result.safetyLeadTime} = {result.safetyStock}
            </div>
            <div className="pt-2 border-t border-border">
              <strong className="text-primary">ROP:</strong> {result.demandDuringLT} + {result.safetyStock} = <strong className="text-primary">{result.rop}</strong>
            </div>
          </div>
        </div>

        {/* Interpretación */}
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm">
            <strong>💡 Interpretación:</strong> Cuando tu stock llegue a <strong>{result.rop} unidades</strong>, 
            debes crear una orden de compra. Esto te garantiza que tendrás suficiente inventario 
            para cubrir las ventas durante los <strong>{result.safetyLeadTime} días</strong> que tarda en llegar 
            el pedido, incluso si hay picos de demanda.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};