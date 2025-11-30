
-- Corregir Security Definer View - usar SECURITY INVOKER
DROP VIEW IF EXISTS v_pedidos_whatsapp_manual;

CREATE VIEW v_pedidos_whatsapp_manual 
WITH (security_invoker = true)
AS
SELECT 
  so.id,
  so.order_number as codigo_pedido,
  so.created_at as fecha_registro,
  so.customer_name,
  so.customer_phone,
  so.customer_district,
  so.latitud,
  so.longitud,
  so.url_google_maps,
  so.asignado_a_vendedor_nombre as vendedor,
  so.fulfillment_status as estado_logistica,
  so.payment_status as estado_pago,
  so.estado_confirmacion,
  so.total,
  so.timestamp_envio_wa,
  so.timestamp_confirmacion_cliente,
  so.delivered_at,
  CASE 
    WHEN so.timestamp_confirmacion_cliente IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (so.timestamp_confirmacion_cliente - so.created_at)) / 60 
    ELSE NULL 
  END as tiempo_respuesta_cliente_minutos,
  CASE 
    WHEN so.delivered_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (so.delivered_at - so.created_at)) / 1440 
    ELSE NULL 
  END as tiempo_entrega_dias,
  COUNT(soi.id) as cantidad_items
FROM sales_orders so
LEFT JOIN sales_order_items soi ON so.id = soi.sales_order_id
WHERE so.ruta = 'whatsapp_manual'
GROUP BY so.id;
