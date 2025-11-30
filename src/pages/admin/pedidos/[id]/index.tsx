// Página: Detalle del pedido

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { usePedidoDetalle, usePedidos } from '@/hooks/usePedidos';
import { ArrowLeft, Loader, MapPin, Phone, Package, DollarSign, MessageCircle, Edit2 } from 'lucide-react';
import { ESTADOS_PEDIDO, METODOS_PAGO, RUTAS_PEDIDO } from '@/types/pedidos';
import { formatCurrency, formatDate } from '@/lib/formatters';

export default function DetallePedidoPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { pedido, isLoading: isLoadingPedido } = usePedidoDetalle(id || '');
  const { cambiarEstado } = usePedidos();
  const [isChangingState, setIsChangingState] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [nota, setNota] = useState('');

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

  const handleChangeState = async () => {
    if (selectedState && pedido) {
      setIsChangingState(true);
      try {
        await cambiarEstado(pedido.id, selectedState, nota);
        alert('✅ Estado actualizado');
        setSelectedState('');
        setNota('');
      } finally {
        setIsChangingState(false);
      }
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{pedido.codigo}</h1>
              <Badge>
                {RUTAS_PEDIDO[pedido.ruta as any]?.icon}{' '}
                {RUTAS_PEDIDO[pedido.ruta as any]?.label}
              </Badge>
              <Badge variant="outline"
                className={ESTADOS_PEDIDO[pedido.estado]?.color}
              >
                {ESTADOS_PEDIDO[pedido.estado]?.label}
              </Badge>
            </div>
          </div>
          <Button onClick={() => navigate(`/admin/pedidos/${pedido.id}/edit`)} className="gap-2">
            <Edit2 className="w-4 h-4" />
            Editar
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="resumen" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="ubicacion">Ubicación</TabsTrigger>
            <TabsTrigger value="productos">Productos</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          {/* TAB 1: RESUMEN */}
          <TabsContent value="resumen" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">👤 Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Nombre</p>
                    <p className="text-sm font-medium">
                      {pedido.cliente_nombre} {pedido.cliente_apellido}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Teléfono</p>
                    <a
                      href={`https://wa.me/${pedido.cliente_telefono.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Phone className="w-4 h-4" />
                      {pedido.cliente_telefono}
                    </a>
                  </div>
                  {pedido.cliente_email && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Email</p>
                      <p className="text-sm">{pedido.cliente_email}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pago */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">💰 Pago</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Método</p>
                    <p className="text-sm font-medium">
                      {METODOS_PAGO[pedido.metodo_pago]?.icon}{' '}
                      {METODOS_PAGO[pedido.metodo_pago]?.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(pedido.precio_total)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Confirmación</p>
                    <Badge variant={pedido.confirmacion_pago ? 'default' : 'outline'}>
                      {pedido.confirmacion_pago ? '✓ Confirmado' : 'Pendiente'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Estado */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estado del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {pedido.timestamp_registro && (
                    <div className="text-xs">
                      <p className="font-semibold text-muted-foreground">Creado</p>
                      <p>{formatDate(pedido.timestamp_registro)}</p>
                    </div>
                  )}
                  {pedido.timestamp_confirmacion_cliente && (
                    <div className="text-xs">
                      <p className="font-semibold text-muted-foreground">Confirmado</p>
                      <p>{formatDate(pedido.timestamp_confirmacion_cliente)}</p>
                    </div>
                  )}
                  {pedido.timestamp_en_ruta && (
                    <div className="text-xs">
                      <p className="font-semibold text-muted-foreground">En Ruta</p>
                      <p>{formatDate(pedido.timestamp_en_ruta)}</p>
                    </div>
                  )}
                  {pedido.timestamp_entregado && (
                    <div className="text-xs">
                      <p className="font-semibold text-muted-foreground">Entregado</p>
                      <p>{formatDate(pedido.timestamp_entregado)}</p>
                    </div>
                  )}
                  {pedido.codigo_seguimiento && (
                    <div className="text-xs">
                      <p className="font-semibold text-muted-foreground">Seguimiento</p>
                      <p className="font-mono">{pedido.codigo_seguimiento}</p>
                    </div>
                  )}
                </div>

                {/* Dialog para cambiar estado */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full">
                      Cambiar Estado
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cambiar Estado del Pedido</DialogTitle>
                      <DialogDescription>
                        Selecciona el nuevo estado y agrega una nota si es necesario.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold mb-2 block">
                          Nuevo Estado
                        </label>
                        <Select value={selectedState} onValueChange={setSelectedState}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona..." />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(ESTADOS_PEDIDO).map(([key, value]) => (
                              <SelectItem key={key} value={key}>
                                {value.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-semibold mb-2 block">
                          Nota (Opcional)
                        </label>
                        <Textarea
                          placeholder="Agrega detalles sobre el cambio de estado..."
                          value={nota}
                          onChange={(e) => setNota(e.target.value)}
                          className="min-h-20"
                        />
                      </div>
                      <Button
                        onClick={handleChangeState}
                        disabled={!selectedState || isChangingState}
                        className="w-full"
                      >
                        {isChangingState ? 'Actualizando...' : 'Confirmar Cambio'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: UBICACIÓN */}
          <TabsContent value="ubicacion">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Ubicación de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Distrito</p>
                    <p className="text-sm font-medium">{pedido.distrito}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Coordenadas</p>
                    {pedido.latitud && pedido.longitud ? (
                      <p className="text-sm font-mono">
                        {pedido.latitud.toFixed(4)}, {pedido.longitud.toFixed(4)}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No disponible</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Dirección Completa
                  </p>
                  <p className="text-sm bg-muted/50 p-3 rounded">
                    {pedido.direccion_completa}
                  </p>
                </div>

                {pedido.referencia_adicional && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Referencia Adicional
                    </p>
                    <p className="text-sm bg-muted/50 p-3 rounded">
                      {pedido.referencia_adicional}
                    </p>
                  </div>
                )}

                {pedido.url_google_maps && (
                  <div>
                    <a
                      href={pedido.url_google_maps}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      🗺️ Ver en Google Maps
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: PRODUCTOS */}
          <TabsContent value="productos">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Productos ({pedido.cantidad_items})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pedido.productos.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{p.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.color && <span>Color: {p.color} | </span>}
                          Cantidad: {p.cantidad}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">
                          {formatCurrency(p.precio * p.cantidad)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(p.precio)} c/u
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t font-semibold flex justify-between">
                    <span>Total:</span>
                    <span>{formatCurrency(pedido.precio_total)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: HISTORIAL */}
          <TabsContent value="historial">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📝 Historial de Cambios</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-muted-foreground">Creado</p>
                    <p>{new Date(pedido.created_at).toLocaleString('es-PE')}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-muted-foreground">Última actualización</p>
                    <p>{new Date(pedido.updated_at).toLocaleString('es-PE')}</p>
                  </div>
                  {pedido.notas_internas && (
                    <div>
                      <p className="font-semibold text-muted-foreground">Notas Internas</p>
                      <p className="bg-muted/50 p-2 rounded text-xs">{pedido.notas_internas}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
