// Formulario de creación/edición de pedidos

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Pedido, PedidoFormData, ProductoPedido, METODOS_PAGO, RUTAS_PEDIDO } from '@/types/pedidos';
import { Save, Plus, Trash2, AlertTriangle, MapPin, Package } from 'lucide-react';

// Validación con Zod - Muy permisivo
const pedidoFormSchema = z.object({
  cliente_nombre: z.string().default(''),
  cliente_apellido: z.string().optional().or(z.literal('')).default(''),
  cliente_telefono: z.string().default(''),
  cliente_email: z.string().optional().or(z.literal('')).default(''),
  distrito: z.string().default(''),
  direccion_completa: z.string().default(''),
  referencia_adicional: z.string().optional().or(z.literal('')).default(''),
  latitud: z.number().optional(),
  longitud: z.number().optional(),
  url_google_maps: z.string().optional().or(z.literal('')).default(''),
  metodo_pago: z.enum(['cod', 'yape', 'plin', 'transferencia', 'tarjeta']).default('cod'),
  comprobante_prepago_url: z.string().optional().or(z.literal('')).default(''),
  ruta: z.enum(['web_form', 'whatsapp_manual']).default('whatsapp_manual'),
  origen_pagina: z.string().optional().or(z.literal('')).default(''),
});

type PedidoFormSchema = z.infer<typeof pedidoFormSchema>;

interface PedidoFormProps {
  pedidoEditar?: Pedido;
  onSubmit: (data: PedidoFormData) => Promise<void>;
  isLoading?: boolean;
  productos?: any[];
}

export function PedidoForm({
  pedidoEditar,
  onSubmit,
  isLoading = false,
  productos = [],
}: PedidoFormProps) {
  const [productosSeleccionados, setProductosSeleccionados] = useState<ProductoPedido[]>(
    pedidoEditar?.productos || []
  );
  const [productoTemp, setProductoTemp] = useState<Partial<ProductoPedido>>({});
  const [validacionError, setValidacionError] = useState<string | null>(null);

  const form = useForm<PedidoFormSchema>({
    resolver: zodResolver(pedidoFormSchema),
    mode: 'onChange',
    defaultValues: pedidoEditar ? {
      cliente_nombre: pedidoEditar.cliente_nombre,
      cliente_apellido: pedidoEditar.cliente_apellido || '',
      cliente_telefono: pedidoEditar.cliente_telefono,
      cliente_email: pedidoEditar.cliente_email || '',
      distrito: pedidoEditar.distrito,
      direccion_completa: pedidoEditar.direccion_completa,
      referencia_adicional: pedidoEditar.referencia_adicional || '',
      url_google_maps: pedidoEditar.url_google_maps || '',
      metodo_pago: pedidoEditar.metodo_pago as any,
      comprobante_prepago_url: pedidoEditar.comprobante_prepago_url || '',
      ruta: pedidoEditar.ruta,
      origen_pagina: pedidoEditar.origen_pagina || '',
    } : {
      cliente_nombre: '',
      cliente_apellido: '',
      cliente_telefono: '',
      cliente_email: '',
      distrito: '',
      direccion_completa: '',
      referencia_adicional: '',
      url_google_maps: '',
      metodo_pago: 'cod',
      comprobante_prepago_url: '',
      ruta: 'whatsapp_manual',
      origen_pagina: '',
    },
  });

  const agregarProducto = () => {
    if (!productoTemp.nombre || !productoTemp.precio || !productoTemp.cantidad) {
      setValidacionError('Completa nombre, precio y cantidad del producto');
      return;
    }

    const nuevoProducto: ProductoPedido = {
      id: Math.random().toString(),
      nombre: productoTemp.nombre,
      precio: productoTemp.precio as number,
      cantidad: productoTemp.cantidad as number,
      color: productoTemp.color || 'Piel',
      imagen_url: productoTemp.imagen_url,
      codigo: productoTemp.codigo,
    };

    setProductosSeleccionados([...productosSeleccionados, nuevoProducto]);
    setProductoTemp({});
    setValidacionError(null);
  };

  const eliminarProducto = (index: number) => {
    setProductosSeleccionados(
      productosSeleccionados.filter((_, i) => i !== index)
    );
  };

  const precioTotal = productosSeleccionados.reduce(
    (sum, p) => sum + p.precio * p.cantidad,
    0
  );

  const handleFormSubmit = async (values: PedidoFormSchema) => {
    if (productosSeleccionados.length === 0) {
      setValidacionError('Debe agregar al menos un producto');
      return;
    }

    const formData: PedidoFormData = {
      ...values,
      productos: productosSeleccionados,
      precio_total: precioTotal,
    };

    try {
      await onSubmit(formData);
    } catch (error) {
      setValidacionError(error instanceof Error ? error.message : 'Error al guardar');
    }
  };

  const distritos = [
    'Lima Centro',
    'Miraflores',
    'San Isidro',
    'Bellavista',
    'SJL',
    'Surco',
    'La Molina',
    'Breña',
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <Tabs defaultValue="cliente" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="cliente">👤 Cliente</TabsTrigger>
            <TabsTrigger value="ubicacion">📍 Ubicación</TabsTrigger>
            <TabsTrigger value="productos">📦 Productos</TabsTrigger>
            <TabsTrigger value="pago">💰 Pago</TabsTrigger>
          </TabsList>

        {/* TAB 1: CLIENTE */}
        <TabsContent value="cliente" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información del Cliente</CardTitle>
              <CardDescription>Datos personales y contacto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cliente_nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cliente_apellido"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input placeholder="Pérez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cliente_telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono/WhatsApp *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+51987654321"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cliente_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="cliente@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="ruta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origen del Pedido</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(RUTAS_PEDIDO).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value.icon} {value.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: UBICACIÓN */}
        <TabsContent value="ubicacion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Ubicación (Crítico para Courier)
              </CardTitle>
              <CardDescription>
                Ingresa dirección y coordenadas exactas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Las coordenadas de Google Maps son esenciales para que el courier
                  encuentre la dirección. Por favor verifica que sean correctas.
                </AlertDescription>
              </Alert>

              <FormField
                control={form.control}
                name="distrito"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Distrito *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {distritos.map((d) => (
                          <SelectItem key={d} value={d}>
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="direccion_completa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección Completa *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Calle, número, piso, departamento..."
                        className="min-h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referencia_adicional"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referencia Adicional</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Frente al parque, casa verde con puerta roja..."
                        className="min-h-16"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url_google_maps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link Google Maps</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://maps.app.goo.gl/..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: PRODUCTOS */}
        <TabsContent value="productos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5" />
                Productos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {validacionError && (
                <Alert variant="destructive">
                  <AlertDescription>{validacionError}</AlertDescription>
                </Alert>
              )}

              {/* Agregar producto */}
              <Card className="bg-muted/50 p-4 space-y-3">
                <h4 className="font-semibold text-sm">Agregar Producto</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    placeholder="Nombre del producto"
                    value={productoTemp.nombre || ''}
                    onChange={(e) =>
                      setProductoTemp({ ...productoTemp, nombre: e.target.value })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Precio (S/)"
                    value={productoTemp.precio || ''}
                    onChange={(e) =>
                      setProductoTemp({
                        ...productoTemp,
                        precio: parseFloat(e.target.value),
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Cantidad"
                    value={productoTemp.cantidad || ''}
                    onChange={(e) =>
                      setProductoTemp({
                        ...productoTemp,
                        cantidad: parseInt(e.target.value),
                      })
                    }
                  />
                  <Input
                    placeholder="Color (ej: Piel, Negro)"
                    value={productoTemp.color || ''}
                    onChange={(e) =>
                      setProductoTemp({ ...productoTemp, color: e.target.value })
                    }
                  />
                </div>
                <Button
                  type="button"
                  onClick={agregarProducto}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Agregar
                </Button>
              </Card>

              {/* Lista de productos */}
              {productosSeleccionados.length > 0 && (
                <div className="space-y-2">
                  {productosSeleccionados.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{p.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          S/ {p.precio.toFixed(2)} x {p.cantidad} = S/{' '}
                          {(p.precio * p.cantidad).toFixed(2)}
                          {p.color && <span className="ml-2">({p.color})</span>}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => eliminarProducto(idx)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  <div className="pt-2 border-t font-semibold flex justify-between">
                    <span>Total:</span>
                    <span>S/ {precioTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: PAGO */}
        <TabsContent value="pago" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Método de Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="metodo_pago"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pago Acordado con Cliente *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(METODOS_PAGO).map(([key, value]) => (
                          <SelectItem key={key} value={key}>
                            {value.icon} {value.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('metodo_pago') !== 'cod' && (
                <FormField
                  control={form.control}
                  name="comprobante_prepago_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL del Comprobante (Foto/PDF)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://drive.google.com/... o enlace de imagen"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Botones de acción */}
      <div className="flex gap-2 justify-end pt-4 border-t">
        <Button type="button" variant="outline" disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="button" variant="outline" disabled={isLoading}>
          Guardar Borrador
        </Button>
        <Button type="submit" disabled={isLoading} className="gap-2">
          <Save className="w-4 h-4" />
          {isLoading ? 'Guardando...' : 'Guardar y Enviar WA'}
        </Button>
      </div>
      </form>
    </Form>
  );
}
