// Componente de filtros para tabla de pedidos

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { PedidoFiltros } from '@/types/pedidos';
import { Download, Plus, FilterX } from 'lucide-react';

interface PedidoFiltrosProps {
  filtros: PedidoFiltros;
  onFiltrosChange: (filtros: PedidoFiltros) => void;
  onNuevoPedido?: () => void;
  onExportar?: () => void;
  vendedores?: { id: string; nombre: string }[];
}

export function PedidoFiltros({
  filtros,
  onFiltrosChange,
  onNuevoPedido,
  onExportar,
  vendedores = [],
}: PedidoFiltrosProps) {
  const handleEstadoChange = (estado: string) => {
    onFiltrosChange({
      ...filtros,
      estado: estado === 'todos' ? undefined : (estado as any),
      page: 1,
    });
  };

  const handleRutaChange = (ruta: string) => {
    onFiltrosChange({
      ...filtros,
      ruta: ruta === 'todos' ? undefined : (ruta as any),
      page: 1,
    });
  };

  const handleVendedorChange = (vendedor: string) => {
    onFiltrosChange({
      ...filtros,
      vendedor_id: vendedor === 'todos' ? undefined : vendedor,
      page: 1,
    });
  };

  const handleDistritoChange = (distrito: string) => {
    onFiltrosChange({
      ...filtros,
      distrito: distrito === 'todos' ? undefined : distrito,
      page: 1,
    });
  };

  const handleBusqueda = (search: string) => {
    onFiltrosChange({
      ...filtros,
      search: search || undefined,
      page: 1,
    });
  };

  const limpiarFiltros = () => {
    onFiltrosChange({
      page: 1,
      limit: 20,
    });
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
    <div className="space-y-4">
      {/* Barra de acciones superior */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filtros</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={limpiarFiltros}
            className="gap-2"
          >
            <FilterX className="w-4 h-4" />
            Limpiar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportar}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Excel
          </Button>
          <Button
            onClick={onNuevoPedido}
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Pedido
          </Button>
        </div>
      </div>

      {/* Grid de filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Búsqueda */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Buscar
          </label>
          <Input
            placeholder="Código, cliente, teléfono..."
            value={filtros.search || ''}
            onChange={(e) => handleBusqueda(e.target.value)}
            className="text-sm"
          />
        </div>

        {/* Estado */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Estado
          </label>
          <Select
            value={filtros.estado || 'todos'}
            onValueChange={handleEstadoChange}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="borrador">Borrador</SelectItem>
              <SelectItem value="pendiente_confirmacion">Pendiente Confirmación</SelectItem>
              <SelectItem value="confirmado">Confirmado</SelectItem>
              <SelectItem value="en_ruta">En Ruta</SelectItem>
              <SelectItem value="entregado">Entregado</SelectItem>
              <SelectItem value="cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ruta */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Ruta
          </label>
          <Select
            value={filtros.ruta || 'todos'}
            onValueChange={handleRutaChange}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="web_form">🌐 Web Form</SelectItem>
              <SelectItem value="whatsapp_manual">📱 WhatsApp Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vendedor */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Vendedor
          </label>
          <Select
            value={filtros.vendedor_id || 'todos'}
            onValueChange={handleVendedorChange}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {vendedores.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Distrito */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">
            Distrito
          </label>
          <Select
            value={filtros.distrito || 'todos'}
            onValueChange={handleDistritoChange}
          >
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {distritos.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resumen de filtros activos */}
      {(filtros.estado ||
        filtros.ruta ||
        filtros.vendedor_id ||
        filtros.distrito ||
        filtros.search) && (
        <div className="bg-muted/50 p-2 rounded text-xs text-muted-foreground">
          Filtros aplicados: {[
            filtros.search && `búsqueda "${filtros.search}"`,
            filtros.estado && `estado: ${filtros.estado}`,
            filtros.ruta && `ruta: ${filtros.ruta}`,
            filtros.vendedor_id && `vendedor: ${filtros.vendedor_id}`,
            filtros.distrito && `distrito: ${filtros.distrito}`,
          ]
            .filter(Boolean)
            .join(', ')}
        </div>
      )}
    </div>
  );
}
