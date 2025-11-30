// Página: Crear nuevo pedido

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PedidoForm } from '@/components/admin/pedidos/PedidoForm';
import { PedidoFormData } from '@/types/pedidos';
import { usePedidos } from '@/hooks/usePedidos';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CrearPedidoPage() {
  const navigate = useNavigate();
  const { crearPedido } = usePedidos();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (formData: PedidoFormData) => {
    setIsLoading(true);
    try {
      const success = await crearPedido(formData);
      if (success) {
        alert('✅ Pedido creado exitosamente');
        navigate('/admin/pedidos');
      }
    } catch (error) {
      console.error('Error al crear pedido:', error);
      alert('❌ Error al crear el pedido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header con botón atrás */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/pedidos')}
                className="gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Button>
            </div>
            <h1 className="text-3xl font-bold">Crear Nuevo Pedido</h1>
            <p className="text-muted-foreground">
              Ingresa los datos del cliente y producto. Se enviará confirmación por WhatsApp.
            </p>
          </div>
        </div>

        {/* Información importante */}
        <Alert className="border-blue-500 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Ruta B - WhatsApp Manual:</strong> Este formulario es para cuando el
            vendedor ingresa datos de un cliente que pidió por WhatsApp. Al guardar y enviar
            confirmación, se generará un código de pedido único (ORD-2025-XXXX) y se enviará
            un mensaje automático al cliente.
          </AlertDescription>
        </Alert>

        {/* Formulario */}
        <Card>
          <CardContent className="pt-6">
            <PedidoForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Guía rápida */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-base">📋 Checklist antes de guardar</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li>✓ Teléfono con código +51 (Perú)</li>
              <li>✓ Nombre completo del cliente</li>
              <li>✓ Dirección exacta y detallada</li>
              <li>✓ Coordenadas de Google Maps (crítico para courier)</li>
              <li>✓ Al menos 1 producto agregado</li>
              <li>✓ Método de pago acordado con cliente</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
