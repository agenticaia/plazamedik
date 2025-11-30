/* eslint-disable @typescript-eslint/no-explicit-any */
// @ts-nocheck
// Servicio para gestión de pedidos - API calls
// Fallback a sales_orders si tabla pedidos no existe

import { supabase } from '@/integrations/supabase/client';
import {
  Pedido,
  PedidoFormData,
  PedidoResponse,
  PedidoFiltros,
  PedidosPaginadas,
  PedidoStats,
} from '@/types/pedidos';

// ============================================
// OPERACIONES CRUD
// ============================================

/**
 * Obtener todos los pedidos con filtros y paginación
 * Usa fallback a sales_orders si tabla pedidos no existe
 */
export async function obtenerPedidos(
  filtros?: PedidoFiltros
): Promise<PedidosPaginadas> {
  try {
    console.log('📦 Intentando obtener pedidos...');
    
    // Paginación
    const page = filtros?.page || 1;
    const limit = filtros?.limit || 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Intentar con tabla pedidos
    let query = supabase
      .from('pedidos')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    // Si falla con pedidos, intentar con sales_orders
    if (error?.message?.includes('does not exist') || error?.message?.includes('pedidos')) {
      console.log('⚠️ Tabla pedidos no encontrada, usando sales_orders...');
      
      let salesQuery = supabase
        .from('sales_orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data: salesData, error: salesError, count: salesCount } = await salesQuery;

      if (salesError) {
        console.error('❌ Error en sales_orders:', salesError);
        throw salesError;
      }

      // Mapear datos de sales_orders al formato Pedido
      const mappedData = (salesData || []).map((so: any) => ({
        id: so.id,
        codigo: so.order_number || `ORD-${so.id.slice(0, 8)}`,
        cliente_nombre: so.customer_name || '',
        cliente_apellido: so.customer_lastname || '',
        cliente_telefono: so.customer_phone || '',
        cliente_email: '',
        distrito: so.customer_district || '',
        direccion_completa: '',
        referencia_adicional: null,
        latitud: null,
        longitud: null,
        url_google_maps: null,
        productos: [],
        precio_total: so.total || 0,
        cantidad_items: 0,
        metodo_pago: 'cod',
        comprobante_prepago_url: null,
        ruta: 'web_form',
        origen_pagina: so.source || null,
        estado: 'borrador',
        estado_confirmacion: 'pendiente',
        asignado_a_vendedor_id: null,
        asignado_a_vendedor_nombre: null,
        timestamp_registro: so.created_at,
        timestamp_envio_wa: null,
        timestamp_confirmacion_cliente: null,
        timestamp_en_ruta: null,
        timestamp_entregado: null,
        codigo_seguimiento: null,
        created_at: so.created_at,
        updated_at: so.updated_at,
        created_by: null,
        updated_by: null,
        notas_internas: null,
      }));

      return {
        datos: mappedData,
        total: salesCount || 0,
        pagina: page,
        limite: limit,
        total_paginas: Math.ceil((salesCount || 0) / limit),
      };
    }

    if (error) {
      console.error('❌ Error obteniendo pedidos:', error);
      throw error;
    }

    return {
      datos: data || [],
      total: count || 0,
      pagina: page,
      limite: limit,
      total_paginas: Math.ceil((count || 0) / limit),
    };
  } catch (error) {
    console.error('❌ Error obteniendo pedidos:', error);
    throw error;
  }
}

/**
 * Obtener un pedido por ID
 */
export async function obtenerPedido(id: string): Promise<Pedido | null> {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error?.message?.includes('does not exist')) {
      // Intentar en sales_orders
      const { data: soData, error: soError } = await supabase
        .from('sales_orders')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (soError) throw soError;
      return soData ? mapSalesOrderToPedido(soData) : null;
    }

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('❌ Error obteniendo pedido:', error);
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

    console.log('📝 Creando pedido con datos:', formData);

    const nuevoProducto = {
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
      productos: formData.productos,
      precio_total: formData.precio_total,
      cantidad_items: formData.productos.reduce((sum, p) => sum + p.cantidad, 0),
      metodo_pago: formData.metodo_pago,
      comprobante_prepago_url: formData.comprobante_prepago_url || null,
      ruta: formData.ruta,
      origen_pagina: formData.origen_pagina || null,
      estado: 'borrador',
      estado_confirmacion: 'pendiente',
      created_by: user.id,
      updated_by: user.id,
    };

    // Intentar insertar en tabla 'pedidos'
    let { data, error } = await supabase
      .from('pedidos')
      .insert([nuevoProducto])
      .select()
      .single();

    // Si la tabla 'pedidos' no existe, usar 'sales_orders' como fallback
    if (error && (error.message.includes('does not exist') || error.message.includes('pedidos'))) {
      console.log('⚠️ Tabla pedidos no existe, guardando en sales_orders...');
      
      const fallbackData = {
        customer_name: formData.cliente_nombre,
        customer_lastname: formData.cliente_apellido || '',
        customer_phone: formData.cliente_telefono,
        customer_district: formData.distrito,
        total: formData.precio_total,
        source: 'ruta_' + formData.ruta,
      };
      
      const { data: fallbackResult, error: fallbackError } = await supabase
        .from('sales_orders')
        .insert([fallbackData])
        .select()
        .single();
      
      if (fallbackError) {
        console.error('❌ Error al usar fallback en sales_orders:', fallbackError);
        return {
          success: false,
          error: 'Error al guardar pedido: ' + fallbackError.message,
        };
      }
      
      console.log('✅ Pedido guardado exitosamente en sales_orders:', fallbackResult);
      return {
        success: true,
        data: mapSalesOrderToPedido(fallbackResult) as Pedido,
        message: 'Pedido creado exitosamente',
      };
    }

    if (error) {
      console.error('❌ Error de Supabase al insertar pedido:', error);
      return {
        success: false,
        error: error.message || 'Error al crear pedido',
      };
    }

    console.log('✅ Pedido creado exitosamente:', data);
    return {
      success: true,
      data: data as Pedido,
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
 * Mapear sales_order a formato Pedido
 */
function mapSalesOrderToPedido(so: any): Pedido {
  return {
    id: so.id,
    codigo: so.order_number || `ORD-${so.id.slice(0, 8)}`,
    cliente_nombre: so.customer_name || '',
    cliente_apellido: so.customer_lastname || '',
    cliente_telefono: so.customer_phone || '',
    cliente_email: '',
    distrito: so.customer_district || '',
    direccion_completa: '',
    referencia_adicional: null,
    latitud: null,
    longitud: null,
    url_google_maps: null,
    productos: [],
    precio_total: so.total || 0,
    cantidad_items: 0,
    metodo_pago: 'cod',
    comprobante_prepago_url: null,
    ruta: 'web_form',
    origen_pagina: so.source || null,
    estado: 'borrador',
    estado_confirmacion: 'pendiente',
    asignado_a_vendedor_id: null,
    asignado_a_vendedor_nombre: null,
    timestamp_registro: so.created_at,
    timestamp_envio_wa: null,
    timestamp_confirmacion_cliente: null,
    timestamp_en_ruta: null,
    timestamp_entregado: null,
    codigo_seguimiento: null,
    created_at: so.created_at,
    updated_at: so.updated_at,
    created_by: null,
    updated_by: null,
    notas_internas: null,
  };
}

/**
 * Actualizar pedido
 */
export async function actualizarPedido(
  id: string,
  updates: Partial<PedidoFormData>
): Promise<PedidoResponse> {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data as Pedido,
      message: 'Pedido actualizado exitosamente',
    };
  } catch (error) {
    console.error('❌ Error actualizando pedido:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar pedido',
    };
  }
}

/**
 * Cambiar estado del pedido
 */
export async function cambiarEstadoPedido(
  id: string,
  nuevoEstado: string,
  notas?: string
): Promise<PedidoResponse> {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .update({ estado: nuevoEstado, notas_internas: notas })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data as Pedido,
      message: 'Estado actualizado exitosamente',
    };
  } catch (error) {
    console.error('❌ Error cambiando estado:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al cambiar estado',
    };
  }
}

/**
 * Asignar vendedor
 */
export async function asignarVendedor(
  pedidoId: string,
  vendedorId: string,
  vendedorNombre: string
): Promise<PedidoResponse> {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .update({
        asignado_a_vendedor_id: vendedorId,
        asignado_a_vendedor_nombre: vendedorNombre,
      })
      .eq('id', pedidoId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data: data as Pedido,
      message: 'Vendedor asignado exitosamente',
    };
  } catch (error) {
    console.error('❌ Error asignando vendedor:', error);
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
    const { error } = await supabase
      .from('pedidos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return {
      success: true,
      message: 'Pedido eliminado exitosamente',
    };
  } catch (error) {
    console.error('❌ Error eliminando pedido:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al eliminar pedido',
    };
  }
}

/**
 * Obtener estadísticas de pedidos
 */
export async function obtenerEstadisticas(): Promise<PedidoStats> {
  try {
    const { data, error } = await supabase
      .from('pedidos')
      .select('estado', { count: 'exact' });

    if (error) throw error;

    const total = data?.length || 0;
    const pendientes = data?.filter((p: any) => p.estado === 'pendiente_confirmacion').length || 0;
    const confirmados = data?.filter((p: any) => p.estado === 'confirmado').length || 0;
    const entregados = data?.filter((p: any) => p.estado === 'entregado').length || 0;

    return {
      total_pedidos: total,
      pendientes,
      confirmados,
      en_ruta: 0,
      entregados,
      cancelados: 0,
      ingresos_totales: 0,
      promedio_ticket: 0,
      tasa_confirmacion: 0,
    };
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    return {
      total_pedidos: 0,
      pendientes: 0,
      confirmados: 0,
      en_ruta: 0,
      entregados: 0,
      cancelados: 0,
      ingresos_totales: 0,
      promedio_ticket: 0,
      tasa_confirmacion: 0,
    };
  }
}

/**
 * Obtener pedidos sin asignar
 */
export async function obtenerPedidosSinAsignar(
  minutosDesdecreacion: number = 120
): Promise<Pedido[]> {
  try {
    const fechaLimite = new Date(
      Date.now() - minutosDesdecreacion * 60 * 1000
    ).toISOString();

    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .is('asignado_a_vendedor_id', null)
      .lt('created_at', fechaLimite)
      .eq('estado', 'pendiente_confirmacion');

    if (error?.message?.includes('does not exist')) {
      // Si tabla no existe, retornar array vacío
      console.log('⚠️ Tabla pedidos no existe, retornando array vacío');
      return [];
    }

    if (error) throw error;
    return (data || []) as Pedido[];
  } catch (error) {
    console.error('❌ Error obteniendo pedidos sin asignar:', error);
    return [];
  }
}
