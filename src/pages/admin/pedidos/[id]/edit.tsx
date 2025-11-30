// Página: Editar pedido

import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PedidoForm } from '@/components/admin/pedidos/PedidoForm';
import { PedidoFormData } from '@/types/pedidos';
import { usePedidoDetalle } from '@/hooks/usePedidos';
import { AlertTriangle, ArrowLeft, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePedidos } from '@/hooks/usePedidos';

export default function EditarPedidoPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { pedido, isLoading: isLoadingPedido } = usePedidoDetalle(id || '');
  const { actualizarPedido } = usePedidos();
  const [isLoading, setIsLoading] = React.useState(false);

  if (isLoadingPedido) {
    return (
      <AdminLayout>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-center space-y-2">
            <Loader className="w-8 h-8 animate-spin mx-auto" />
            <p>Cargando pedido...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!pedido) {
    return (
      <AdminLayout>
        <div className="p-6 space-y-6">
          <Alert variant="destructive">
            <AlertDescription>Pedido no encontrado</AlertDescription>
          </Alert>
          <Button onClick={() => navigate('/admin/pedidos')}>
            Volver a Pedidos
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const handleSubmit = async (formData: PedidoFormData) => {
    setIsLoading(true);
    try {
      const success = await actualizarPedido(pedido.id, formData);
      if (success) {
        alert('✅ Pedido actualizado exitosamente');
        navigate(`/admin/pedidos`);
      }
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
            <h1 className="text-3xl font-bold">Editar Pedido</h1>
            <p className="text-muted-foreground">
              Código: <span className="font-mono font-semibold">{pedido.codigo}</span>
            </p>
          </div>
        </div>

        {/* Información importante */}
        <Alert className="border-blue-500 bg-blue-50">
          <AlertTriangle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Estado actual:</strong> {pedido.estado}
            <p className="text-sm mt-1">
              Los cambios se guardarán automáticamente. Si cambias datos críticos
              (dirección, teléfono), considera enviar un mensaje de confirmación al cliente.
            </p>
          </AlertDescription>
        </Alert>

        {/* Formulario */}
        <Card>
          <CardContent className="pt-6">
            <PedidoForm
              pedidoEditar={pedido}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Historial de cambios */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-base">📝 Historial</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div>
              <p className="font-semibold text-muted-foreground">Creado:</p>
              <p>{new Date(pedido.created_at).toLocaleString('es-PE')}</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground">Última actualización:</p>
              <p>{new Date(pedido.updated_at).toLocaleString('es-PE')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
