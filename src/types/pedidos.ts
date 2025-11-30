// Tipos para gestión de pedidos

export type PedidoRuta = 'web_form' | 'whatsapp_manual';
export type PedidoEstado = 'borrador' | 'pendiente_confirmacion' | 'confirmado' | 'en_ruta' | 'entregado' | 'cancelado';
export type PedidoConfirmacion = 'pendiente' | 'confirmado_cliente' | 'rechazado' | 'sin_respuesta';
export type PedidoMetodoPago = 'cod' | 'yape' | 'plin' | 'transferencia' | 'tarjeta';

// Producto en pedido
export interface ProductoPedido {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  color?: string;
  imagen_url?: string;
  codigo?: string;
}

// Interfaz principal de Pedido
export interface Pedido {
  id: string;
  codigo: string;
  
  // Cliente
  cliente_nombre: string;
  cliente_apellido?: string;
  cliente_telefono: string;
  cliente_email?: string;
  cliente_id?: string;
  
  // Origen y Ruta
  ruta: PedidoRuta;
  origen_pagina?: string;
  timestamp_registro: string;
  
  // Ubicación
  distrito: string;
  direccion_completa: string;
  referencia_adicional?: string;
  latitud?: number;
  longitud?: number;
  url_google_maps?: string;
  
  // Productos
  productos: ProductoPedido[];
  precio_total: number;
  cantidad_items: number;
  
  // Pago
  metodo_pago: PedidoMetodoPago;
  comprobante_prepago_url?: string;
  confirmacion_pago: boolean;
  
  // Estado
  estado: PedidoEstado;
  estado_confirmacion: PedidoConfirmacion;
  
  // Asignación
  asignado_a_vendedor_id?: string;
  asignado_a_vendedor_nombre?: string;
  
  // Tracking
  timestamp_envio_wa?: string;
  timestamp_confirmacion_cliente?: string;
  timestamp_en_ruta?: string;
  timestamp_entregado?: string;
  codigo_seguimiento?: string;
  
  // Auditoría
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  notas_internas?: string;
}

// Form de creación/edición
export interface PedidoFormData {
  cliente_nombre: string;
  cliente_apellido?: string;
  cliente_telefono: string;
  cliente_email?: string;
  distrito: string;
  direccion_completa: string;
  referencia_adicional?: string;
  latitud?: number;
  longitud?: number;
  url_google_maps?: string;
  productos: ProductoPedido[];
  precio_total: number;
  metodo_pago: PedidoMetodoPago;
  comprobante_prepago_url?: string;
  ruta: PedidoRuta;
  origen_pagina?: string;
}

// Respuesta de API
export interface PedidoResponse {
  success: boolean;
  data?: Pedido;
  error?: string;
  message?: string;
}

// Filtros para tabla
export interface PedidoFiltros {
  estado?: PedidoEstado;
  ruta?: PedidoRuta;
  vendedor_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  distrito?: string;
  telefono?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Respuesta paginada
export interface PedidosPaginadas {
  datos: Pedido[];
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
}

// Estadísticas
export interface PedidoStats {
  total_pedidos: number;
  pendientes: number;
  confirmados: number;
  en_ruta: number;
  entregados: number;
  cancelados: number;
  ingresos_totales: number;
  promedio_ticket: number;
  tasa_confirmacion: number;
}

// Auditoría
export interface PedidoAuditoria {
  id: string;
  pedido_id: string;
  campo_modificado: string;
  valor_anterior?: string;
  valor_nuevo?: string;
  usuario_id?: string;
  usuario_email?: string;
  timestamp: string;
}

// KPIs
export interface PedidoKPI {
  id: string;
  pedido_id: string;
  tiempo_respuesta_cliente?: number; // segundos
  tiempo_confirmacion_vendedor?: number; // segundos
  tiempo_entrega_total?: number; // segundos
  tasa_conversion: boolean;
  valor_ticket: number;
  created_at: string;
}

// Estadísticas por vendedor
export interface VendedorStats {
  id: string;
  vendedor_id: string;
  fecha_stats: string;
  total_pedidos_hoy: number;
  total_confirmados_hoy: number;
  total_entregados_hoy: number;
  total_cancelados_hoy: number;
  ingreso_diario: number;
  promedio_ticket: number;
  tiempo_promedio_confirmacion: number;
  updated_at: string;
}

// Eventos de pedido
export interface PedidoEvento {
  id: string;
  pedido_id: string;
  tipo_evento: 'creado' | 'confirmado' | 'enviado_wa' | 'en_ruta' | 'entregado' | 'cancelado';
  descripcion?: string;
  timestamp: string;
}

// Opciones para selectores
export interface OpcionSelecto {
  label: string;
  value: string;
  icon?: string;
  color?: string;
}

export const ESTADOS_PEDIDO: Record<PedidoEstado, { label: string; color: string; icon: string }> = {
  borrador: { label: 'Borrador', color: 'bg-gray-100', icon: '✏️' },
  pendiente_confirmacion: { label: 'Pendiente Confirmación', color: 'bg-yellow-100', icon: '⏳' },
  confirmado: { label: 'Confirmado', color: 'bg-green-100', icon: '✓' },
  en_ruta: { label: 'En Ruta', color: 'bg-blue-100', icon: '🚗' },
  entregado: { label: 'Entregado', color: 'bg-emerald-100', icon: '✓✓' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100', icon: '✕' },
};

export const RUTAS_PEDIDO: Record<PedidoRuta, { label: string; icon: string; descripcion: string }> = {
  web_form: { label: 'Web Form', icon: '🌐', descripcion: 'Cliente llena formulario en web' },
  whatsapp_manual: { label: 'WhatsApp Manual', icon: '📱', descripcion: 'Vendedor ingresa desde WhatsApp' },
};

export const METODOS_PAGO: Record<PedidoMetodoPago, { label: string; icon: string }> = {
  cod: { label: 'Contraentrega', icon: '💵' },
  yape: { label: 'Yape', icon: '📱' },
  plin: { label: 'Plin', icon: '📱' },
  transferencia: { label: 'Transferencia', icon: '🏦' },
  tarjeta: { label: 'Tarjeta', icon: '💳' },
};
