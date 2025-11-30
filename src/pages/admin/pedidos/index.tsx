// Página principal: Gestión de Pedidos

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { usePedidos } from '@/hooks/usePedidos';
import { PedidoFiltros } from '@/components/admin/pedidos/PedidoFiltros';
import { PedidosTable } from '@/components/admin/pedidos/PedidosTable';
import { Pedido } from '@/types/pedidos';
import * as pedidosService from '@/services/pedidosService';

const vendedores_mock = [
  { id: '1', nombre: 'Juan', email: 'juan@example.com' },
  { id: '2', nombre: 'María', email: 'maria@example.com' },
  { id: '3', nombre: 'Carlos', email: 'carlos@example.com' },
];

export default function PedidosPage() {
  const navigate = useNavigate();
  const {
    pedidos,
    isLoading,
    error,
    filtros,
    setFiltros,
    stats,
    statsLoading,
    cambiarEstado,
    asignarVendedor,
    eliminarPedido,
  } = usePedidos();

  const [pedidosSinAsignar, setPedidosSinAsignar] = useState<Pedido[]>([]);

  // Verificar pedidos sin asignar hace >2 horas
  useEffect(() => {
    const verificar = async () => {
      try {
        const sin = await pedidosService.obtenerPedidosSinAsignar(120);
        setPedidosSinAsignar(sin);
      } catch (err) {
        console.error('Error verificando pedidos sin asignar:', err);
      }
    };

    verificar();
    const interval = setInterval(verificar, 60000); // Verificar cada minuto
    return () => clearInterval(interval);
  }, []);

  const handleVerPedido = (pedido: Pedido) => {
    navigate(`/admin/pedidos/${pedido.id}`);
  };

  const handleEditarPedido = (pedido: Pedido) => {
    navigate(`/admin/pedidos/${pedido.id}/edit`);
  };

  const handleNuevoPedido = () => {
    navigate('/admin/pedidos/create');
  };

  const handleExportar = () => {
    // TODO: Implementar exportación a Excel
    alert('Funcionalidad de exportación a Excel en desarrollo');
  };

  const handleEliminar = async (pedidoId: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este pedido?')) {
      await eliminarPedido(pedidoId);
    }
  };

  const handleSendWhatsApp = (pedido: Pedido) => {
    // TODO: Implementar envío de WhatsApp
    console.log('Enviando WhatsApp a', pedido.cliente_telefono);
    alert(`Enviando confirmación a ${pedido.cliente_telefono}`);
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Gestión de Pedidos</h1>
          <p className="text-muted-foreground">
            Ruta A (Web Form) + Ruta B (WhatsApp Manual)
          </p>
        </div>

        {/* Alertas */}
        {pedidosSinAsignar.length > 0 && (
          <Alert className="border-yellow-500 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>⚠️ {pedidosSinAsignar.length} pedidos sin asignar hace {'>'} 2 horas</strong>
              <p className="text-sm mt-1">
                Estos pedidos están pendientes de confirmación y no tienen vendedor asignado.
              </p>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tarjetas de Estadísticas */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Total Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_pedidos}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Todos los tiempos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pendientes}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Esperando confirmación
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.confirmados}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.total_pedidos > 0
                    ? `${((stats.confirmados / stats.total_pedidos) * 100).toFixed(1)}% tasa`
                    : 'N/A'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Ingresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-700">
                  S/ {stats.ingresos_totales.toFixed(0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Promedio: S/ {stats.promedio_ticket.toFixed(0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Entregados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.entregados}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Completados
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Búsqueda y Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <PedidoFiltros
              filtros={filtros}
              onFiltrosChange={setFiltros}
              onNuevoPedido={handleNuevoPedido}
              onExportar={handleExportar}
              vendedores={vendedores_mock}
            />
          </CardContent>
        </Card>

        {/* Tabla Principal */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <PedidosTable
              pedidos={pedidos}
              isLoading={isLoading}
              onView={handleVerPedido}
              onEdit={handleEditarPedido}
              onDelete={handleEliminar}
              onStateChange={cambiarEstado}
              onAssignVendor={asignarVendedor}
              onSendWhatsApp={handleSendWhatsApp}
              vendedores={vendedores_mock}
            />
          </CardContent>
        </Card>

        {/* Información */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Sistema en Producción:</strong> Todos los cambios se guardan
            automáticamente en la base de datos. Los vendedores reciben notificaciones
            cuando se les asigna un pedido.
          </AlertDescription>
        </Alert>
      </div>
    </AdminLayout>
  );
}
