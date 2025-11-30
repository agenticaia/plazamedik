// Tabla maestra de pedidos - Componente principal

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Eye, Edit2, Trash2, MessageCircle, MoreHorizontal, MapPin, Phone } from 'lucide-react';
import { Pedido, ESTADOS_PEDIDO, RUTAS_PEDIDO } from '@/types/pedidos';
import { formatCurrency, formatDate } from '@/lib/formatters';

interface PedidosTableProps {
  pedidos: Pedido[];
  isLoading: boolean;
  onView?: (pedido: Pedido) => void;
  onEdit?: (pedido: Pedido) => void;
  onDelete?: (pedidoId: string) => void;
  onStateChange?: (pedidoId: string, nuevoEstado: string) => void;
  onAssignVendor?: (pedidoId: string, vendedorId: string, vendedorNombre: string) => void;
  onSendWhatsApp?: (pedido: Pedido) => void;
  vendedores?: { id: string; nombre: string; email: string }[];
}

export function PedidosTable({
  pedidos,
  isLoading,
  onView,
  onEdit,
  onDelete,
  onStateChange,
  onAssignVendor,
  onSendWhatsApp,
  vendedores = [],
}: PedidosTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Cargando pedidos...</p>
        </div>
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No hay pedidos para mostrar</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-32">Código</TableHead>
            <TableHead className="w-24">Origen</TableHead>
            <TableHead className="w-40">Cliente</TableHead>
            <TableHead className="w-32">Teléfono</TableHead>
            <TableHead className="w-28">Producto</TableHead>
            <TableHead className="w-24">Precio</TableHead>
            <TableHead className="w-28">Estado</TableHead>
            <TableHead className="w-32">Vendedor</TableHead>
            <TableHead className="w-20">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pedidos.map((pedido) => (
            <React.Fragment key={pedido.id}>
              <TableRow className="hover:bg-muted/50">
                {/* Código */}
                <TableCell className="font-mono font-semibold">
                  <button
                    onClick={() => onView?.(pedido)}
                    className="text-blue-600 hover:underline"
                  >
                    {pedido.codigo}
                  </button>
                  {RUTAS_PEDIDO[pedido.ruta as any]?.icon && (
                    <span className="ml-2 text-xs">
                      {RUTAS_PEDIDO[pedido.ruta as any].icon}
                    </span>
                  )}
                </TableCell>

                {/* Origen */}
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {pedido.ruta === 'web_form' ? '🌐 Web' : '📱 WA'}
                  </Badge>
                </TableCell>

                {/* Cliente */}
                <TableCell>
                  <div className="font-medium text-sm">
                    {pedido.cliente_nombre}
                  </div>
                  {pedido.cliente_email && (
                    <div className="text-xs text-muted-foreground">
                      {pedido.cliente_email}
                    </div>
                  )}
                </TableCell>

                {/* Teléfono */}
                <TableCell>
                  <a
                    href={`https://wa.me/${pedido.cliente_telefono.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Phone className="w-4 h-4" />
                    {pedido.cliente_telefono}
                  </a>
                </TableCell>

                {/* Producto */}
                <TableCell>
                  <div className="text-sm truncate max-w-xs">
                    {pedido.productos[0]?.nombre && (
                      <span title={pedido.productos[0].nombre}>
                        {pedido.productos[0].nombre.substring(0, 20)}...
                      </span>
                    )}
                    {pedido.productos.length > 1 && (
                      <Badge variant="secondary" className="ml-2">
                        +{pedido.productos.length - 1}
                      </Badge>
                    )}
                  </div>
                </TableCell>

                {/* Precio */}
                <TableCell className="font-semibold">
                  {formatCurrency(pedido.precio_total)}
                </TableCell>

                {/* Estado */}
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`${ESTADOS_PEDIDO[pedido.estado]?.color}`}
                  >
                    {ESTADOS_PEDIDO[pedido.estado]?.label}
                  </Badge>
                </TableCell>

                {/* Vendedor */}
                <TableCell>
                  <Select
                    value={pedido.asignado_a_vendedor_id || 'sin-asignar'}
                    onValueChange={(value) => {
                      if (value !== 'sin-asignar' && onAssignVendor) {
                        const vendedor = vendedores.find((v) => v.id === value);
                        if (vendedor) {
                          onAssignVendor(pedido.id, value, vendedor.nombre);
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="w-full text-xs">
                      <SelectValue placeholder="Asignar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sin-asignar">Sin Asignar</SelectItem>
                      {vendedores.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>

                {/* Acciones */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView?.(pedido)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit?.(pedido)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onSendWhatsApp?.(pedido)}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WA
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete?.(pedido.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>

              {/* Fila expandida (para móviles) */}
              {expandedRow === pedido.id && (
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={9}>
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">
                            Dirección
                          </p>
                          <p className="text-sm flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{pedido.direccion_completa}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">
                            Distrito
                          </p>
                          <p className="text-sm">{pedido.distrito}</p>
                        </div>
                      </div>
                      {pedido.latitud && pedido.longitud && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground">
                            Coordenadas
                          </p>
                          <p className="text-sm font-mono">
                            {pedido.latitud}, {pedido.longitud}
                          </p>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
