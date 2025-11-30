import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import {
  Pedido,
  PedidoFormData,
  PedidoResponse,
  PedidoFiltros,
  PedidosPaginadas,
  PedidoStats,
  PedidoAuditoria,
  ProductoPedido,
} from '@/types/pedidos';

// Helper to convert DB row to Pedido type
function mapDbRowToPedido(row: Record<string, unknown>): Pedido {
  return {
    ...row,
    productos: (row.productos as unknown as ProductoPedido[]) || [],
  } as Pedido;
}

// ============================================
// OPERACIONES CRUD
// ============================================

/**
 * Obtener todos los pedidos con filtros y paginación
 */
export async function obtenerPedidos(
  filtros?: PedidoFiltros
): Promise<PedidosPaginadas> {
  try {
    let query = supabase.from(TABLA_PEDIDOS).select('*', { count: 'exact' });

    // Aplicar filtros
    if (filtros?.estado) {
      query = query.eq('estado', filtros.estado);
    }
    if (filtros?.ruta) {
      query = query.eq('ruta', filtros.ruta);
    }
    if (filtros?.vendedor_id) {
      query = query.eq('asignado_a_vendedor_id', filtros.vendedor_id);
    }
    if (filtros?.distrito) {
      query = query.eq('distrito', filtros.distrito);
    }
    if (filtros?.telefono) {
      query = query.ilike('cliente_telefono', `%${filtros.telefono}%`);
    }
    if (filtros?.search) {
      query = query.or(
        `cliente_nombre.ilike.%${filtros.search}%,codigo.ilike.%${filtros.search}%,cliente_telefono.ilike.%${filtros.search}%`
      );
    }
    if (filtros?.fecha_desde) {
      query = query.gte('timestamp_registro', filtros.fecha_desde);
    }
    if (filtros?.fecha_hasta) {
      query = query.lte('timestamp_registro', filtros.fecha_hasta);
    }

    // Paginación
    const page = filtros?.page || 1;
    const limit = filtros?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query
      .order('timestamp_registro', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error obteniendo pedidos:', error);
      throw error;
    }

    return {
      datos: (data || []).map(row => mapDbRowToPedido(row as Record<string, unknown>)),
      total: count || 0,
      pagina: page,
      limite: limit,
      total_paginas: Math.ceil((count || 0) / limit),
    };
  } catch (error) {
    console.error('Error obteniendo pedidos:', error);
    throw error;
  }
}

/**
 * Obtener un pedido por ID
 */
export async function obtenerPedido(id: string): Promise<Pedido | null> {
  try {
    const { data, error } = await supabase
      .from(TABLA_PEDIDOS)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data ? mapDbRowToPedido(data as Record<string, unknown>) : null;
  } catch (error) {
    console.error('Error obteniendo pedido:', error);
    throw error;
  }
}

/**
 * Crear nuevo pedido
 */
export async function crearPedido(
  formData: PedidoFormData
): Promise<PedidoResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    // Generar código único para el pedido
    const timestamp = Date.now().toString().slice(-5);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const codigo = `PED-${new Date().getFullYear()}-${timestamp}${random}`;

    const nuevoProducto = {
      codigo,
      cliente_nombre: formData.cliente_nombre,
      cliente_apellido: formData.cliente_apellido || null,
      cliente_telefono: formData.cliente_telefono,
      cliente_email: formData.cliente_email || null,
      distrito: formData.distrito,
      direccion_completa: formData.direccion_completa,
      referencia_adicional: formData.referencia_adicional || null,
      latitud: formData.latitud || null,
      longitud: formData.longitud || null,
      url_google_maps: formData.url_google_maps || null,
      productos: formData.productos as unknown as Json,
      precio_total: formData.precio_total,
      cantidad_items: formData.productos.reduce((sum, p) => sum + p.cantidad, 0),
      metodo_pago: formData.metodo_pago,
      comprobante_prepago_url: formData.comprobante_prepago_url || null,
      ruta: formData.ruta,
      origen_pagina: formData.origen_pagina || null,
      estado: 'borrador' as const,
      estado_confirmacion: 'pendiente' as const,
      created_by: user.id,
      updated_by: user.id,
    };

    const { data, error } = await supabase
      .from(TABLA_PEDIDOS)
      .insert([nuevoProducto])
      .select()
      .single();

    if (error) {
      console.error('❌ Error de Supabase al insertar pedido:', error);
      throw error;
    }

    console.log('✅ Pedido creado exitosamente:', data);
    return {
      success: true,
      data: mapDbRowToPedido(data as Record<string, unknown>),
      message: 'Pedido creado exitosamente',
    };
  } catch (error) {
    console.error('❌ Error creando pedido:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al crear pedido',
    };
  }
}

/**
 * Actualizar pedido
 */
export async function actualizarPedido(
  id: string,
  updates: Partial<PedidoFormData>
): Promise<PedidoResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }

    // Convert productos to Json if present
    const dbUpdates: Record<string, unknown> = {
      ...updates,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };
    if (updates.productos) {
      dbUpdates.productos = updates.productos as unknown as Json;
    }

    const { data, error } = await supabase
      .from(TABLA_PEDIDOS)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: mapDbRowToPedido(data as Record<string, unknown>),
      message: 'Pedido actualizado exitosamente',
    };
  } catch (error) {
    console.error('Error actualizando pedido:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar pedido',
    };
  }
}

/**
 * Cambiar estado de pedido
 */
export async function cambiarEstadoPedido(
  id: string,
  nuevoEstado: string,
  notas?: string
): Promise<PedidoResponse> {
  try {
    const { data, error } = await supabase
      .from(TABLA_PEDIDOS)
      .update({
        estado: nuevoEstado as 'borrador' | 'pendiente_confirmacion' | 'confirmado' | 'en_ruta' | 'entregado' | 'cancelado',
        notas_internas: notas || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Registrar evento
    await supabase.from('pedidos_eventos').insert({
      pedido_id: id,
      tipo_evento: nuevoEstado,
      descripcion: notas,
    });

    return {
      success: true,
      data: mapDbRowToPedido(data as Record<string, unknown>),
      message: `Estado actualizado a ${nuevoEstado}`,
    };
  } catch (error) {
    console.error('Error cambiando estado:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al cambiar estado',
    };
  }
}

/**
 * Asignar pedido a vendedor
 */
export async function asignarVendedor(
  pedidoId: string,
  vendedorId: string,
  vendedorNombre: string
): Promise<PedidoResponse> {
  try {
    const { data, error } = await supabase
      .from(TABLA_PEDIDOS)
      .update({
        asignado_a_vendedor_id: vendedorId,
        asignado_a_vendedor_nombre: vendedorNombre,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pedidoId)
      .select()
      .single();

    if (error) throw error;

    // Registrar evento
    await supabase.from('pedidos_eventos').insert({
      pedido_id: pedidoId,
      tipo_evento: 'asignado',
      descripcion: `Asignado a ${vendedorNombre}`,
    });

    return {
      success: true,
      data: mapDbRowToPedido(data as Record<string, unknown>),
      message: `Asignado a ${vendedorNombre}`,
    };
  } catch (error) {
    console.error('Error asignando vendedor:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al asignar vendedor',
    };
  }
}

/**
 * Eliminar pedido
 */
export async function eliminarPedido(id: string): Promise<PedidoResponse> {
  try {
    const { error } = await supabase.from(TABLA_PEDIDOS).delete().eq('id', id);

    if (error) throw error;

    return {
      success: true,
      message: 'Pedido eliminado exitosamente',
    };
  } catch (error) {
    console.error('Error eliminando pedido:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al eliminar pedido',
    };
  }
}

// ============================================
// ESTADÍSTICAS Y ANÁLISIS
// ============================================

/**
 * Obtener estadísticas generales de pedidos
 */
export async function obtenerEstadisticas(): Promise<PedidoStats> {
  try {
    const { data: pedidos, error } = await supabase
      .from(TABLA_PEDIDOS)
      .select('estado, precio_total');

    if (error) throw error;

    const stats: PedidoStats = {
      total_pedidos: pedidos?.length || 0,
      pendientes: 0,
      confirmados: 0,
      en_ruta: 0,
      entregados: 0,
      cancelados: 0,
      ingresos_totales: 0,
      promedio_ticket: 0,
      tasa_confirmacion: 0,
    };

    if (pedidos) {
      pedidos.forEach((p) => {
        stats.ingresos_totales += p.precio_total || 0;
        switch (p.estado) {
          case 'pendiente_confirmacion':
            stats.pendientes++;
            break;
          case 'confirmado':
            stats.confirmados++;
            break;
          case 'en_ruta':
            stats.en_ruta++;
            break;
          case 'entregado':
            stats.entregados++;
            break;
          case 'cancelado':
            stats.cancelados++;
            break;
        }
      });

      stats.promedio_ticket =
        stats.total_pedidos > 0
          ? stats.ingresos_totales / stats.total_pedidos
          : 0;
      stats.tasa_confirmacion =
        stats.total_pedidos > 0
          ? (stats.confirmados / stats.total_pedidos) * 100
          : 0;
    }

    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw error;
  }
}

/**
 * Obtener auditoria de pedido
 */
export async function obtenerAuditoriaPedido(
  pedidoId: string
): Promise<PedidoAuditoria[]> {
  try {
    const { data, error } = await supabase
      .from('pedidos_auditoria')
      .select('*')
      .eq('pedido_id', pedidoId)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return (data || []) as PedidoAuditoria[];
  } catch (error) {
    console.error('Error obteniendo auditoría:', error);
    throw error;
  }
}

/**
 * Obtener pedidos sin asignar hace más de X minutos
 */
export async function obtenerPedidosSinAsignar(
  minutosDesdecreacion: number = 120
): Promise<Pedido[]> {
  try {
    const fechaLimite = new Date(
      Date.now() - minutosDesdecreacion * 60 * 1000
    ).toISOString();

    const { data, error } = await supabase
      .from(TABLA_PEDIDOS)
      .select('*')
      .is('asignado_a_vendedor_id', null)
      .lt('timestamp_registro', fechaLimite)
      .eq('estado', 'pendiente_confirmacion');

    if (error) throw error;
    return (data || []).map(row => mapDbRowToPedido(row as Record<string, unknown>));
  } catch (error) {
    console.error('Error obteniendo pedidos sin asignar:', error);
    throw error;
  }
}

/**
 * Guardar como borrador
 */
export async function guardarBorrador(
  formData: PedidoFormData,
  pedidoId?: string
): Promise<PedidoResponse> {
  try {
    if (pedidoId) {
      return actualizarPedido(pedidoId, {
        ...formData,
      });
    } else {
      return crearPedido(formData);
    }
  } catch (error) {
    console.error('Error guardando borrador:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al guardar borrador',
    };
  }
}
