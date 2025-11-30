// Hook para gestión de pedidos

import { useEffect, useState, useCallback } from 'react';
import {
  Pedido,
  PedidoFormData,
  PedidoFiltros,
  PedidosPaginadas,
  PedidoStats,
} from '@/types/pedidos';
import * as pedidosService from '@/services/pedidosService';

interface UsePedidosReturn {
  // Estado
  pedidos: Pedido[];
  isLoading: boolean;
  error: string | null;
  
  // Filtros y paginación
  filtros: PedidoFiltros;
  setFiltros: (filtros: PedidoFiltros) => void;
  totalPaginas: number;
  paginaActual: number;
  
  // Estadísticas
  stats: PedidoStats | null;
  statsLoading: boolean;
  
  // Acciones
  refetch: () => void;
  crearPedido: (data: PedidoFormData) => Promise<boolean>;
  actualizarPedido: (id: string, data: Partial<PedidoFormData>) => Promise<boolean>;
  cambiarEstado: (id: string, nuevoEstado: string, notas?: string) => Promise<boolean>;
  asignarVendedor: (pedidoId: string, vendedorId: string, vendedorNombre: string) => Promise<boolean>;
  eliminarPedido: (id: string) => Promise<boolean>;
}

export function usePedidos(): UsePedidosReturn {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PedidoStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [filtros, setFiltros] = useState<PedidoFiltros>({
    page: 1,
    limit: 20,
  });

  // Obtener pedidos
  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resultado = await pedidosService.obtenerPedidos(filtros);
      setPedidos(resultado.datos);
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al cargar pedidos';
      setError(mensaje);
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filtros]);

  // Obtener estadísticas
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const resultado = await pedidosService.obtenerEstadisticas();
      setStats(resultado);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Usar efectos
  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Actualizar cada 30s
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Acciones
  const crearPedidoHandler = async (data: PedidoFormData): Promise<boolean> => {
    try {
      const resultado = await pedidosService.crearPedido(data);
      if (resultado.success) {
        refetch();
        return true;
      } else {
        setError(resultado.error || 'Error al crear pedido');
        return false;
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al crear pedido';
      setError(mensaje);
      return false;
    }
  };

  const actualizarPedidoHandler = async (
    id: string,
    data: Partial<PedidoFormData>
  ): Promise<boolean> => {
    try {
      const resultado = await pedidosService.actualizarPedido(id, data);
      if (resultado.success) {
        refetch();
        return true;
      } else {
        setError(resultado.error || 'Error al actualizar pedido');
        return false;
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al actualizar pedido';
      setError(mensaje);
      return false;
    }
  };

  const cambiarEstadoHandler = async (
    id: string,
    nuevoEstado: string,
    notas?: string
  ): Promise<boolean> => {
    try {
      const resultado = await pedidosService.cambiarEstadoPedido(id, nuevoEstado, notas);
      if (resultado.success) {
        refetch();
        fetchStats();
        return true;
      } else {
        setError(resultado.error || 'Error al cambiar estado');
        return false;
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al cambiar estado';
      setError(mensaje);
      return false;
    }
  };

  const asignarVendedorHandler = async (
    pedidoId: string,
    vendedorId: string,
    vendedorNombre: string
  ): Promise<boolean> => {
    try {
      const resultado = await pedidosService.asignarVendedor(
        pedidoId,
        vendedorId,
        vendedorNombre
      );
      if (resultado.success) {
        refetch();
        return true;
      } else {
        setError(resultado.error || 'Error al asignar vendedor');
        return false;
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al asignar vendedor';
      setError(mensaje);
      return false;
    }
  };

  const eliminarPedidoHandler = async (id: string): Promise<boolean> => {
    try {
      const resultado = await pedidosService.eliminarPedido(id);
      if (resultado.success) {
        refetch();
        return true;
      } else {
        setError(resultado.error || 'Error al eliminar pedido');
        return false;
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Error al eliminar pedido';
      setError(mensaje);
      return false;
    }
  };

  return {
    pedidos,
    isLoading,
    error,
    filtros,
    setFiltros,
    totalPaginas: Math.ceil(pedidos.length / (filtros.limit || 20)),
    paginaActual: filtros.page || 1,
    stats,
    statsLoading,
    refetch,
    crearPedido: crearPedidoHandler,
    actualizarPedido: actualizarPedidoHandler,
    cambiarEstado: cambiarEstadoHandler,
    asignarVendedor: asignarVendedorHandler,
    eliminarPedido: eliminarPedidoHandler,
  };
}

// Hook específico para obtener un pedido
export function usePedidoDetalle(id: string) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      try {
        const datos = await pedidosService.obtenerPedido(id);
        setPedido(datos);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar pedido');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetch();
    }
  }, [id]);

  return { pedido, isLoading, error };
}
