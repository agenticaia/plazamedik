export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_consumption_logs: {
        Row: {
          api_calls: number | null
          cost_usd: number | null
          created_at: string | null
          feature: string
          id: string
          metadata: Json | null
          operation_type: string
          tokens_used: number | null
        }
        Insert: {
          api_calls?: number | null
          cost_usd?: number | null
          created_at?: string | null
          feature: string
          id?: string
          metadata?: Json | null
          operation_type: string
          tokens_used?: number | null
        }
        Update: {
          api_calls?: number | null
          cost_usd?: number | null
          created_at?: string | null
          feature?: string
          id?: string
          metadata?: Json | null
          operation_type?: string
          tokens_used?: number | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          ai_notes: string | null
          created_at: string | null
          customer_type: string | null
          district: string | null
          email: string | null
          id: string
          lastname: string | null
          name: string
          phone: string
          referral_code: string
          referral_credits: number | null
          referred_by_code: string | null
          total_orders: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          ai_notes?: string | null
          created_at?: string | null
          customer_type?: string | null
          district?: string | null
          email?: string | null
          id?: string
          lastname?: string | null
          name: string
          phone: string
          referral_code: string
          referral_credits?: number | null
          referred_by_code?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          ai_notes?: string | null
          created_at?: string | null
          customer_type?: string | null
          district?: string | null
          email?: string | null
          id?: string
          lastname?: string | null
          name?: string
          phone?: string
          referral_code?: string
          referral_credits?: number | null
          referred_by_code?: string | null
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_forecast: {
        Row: {
          calculated_at: string | null
          confidence_level: string
          current_stock: number
          days_until_stockout: number | null
          forecast_date: string
          id: string
          predicted_demand: number
          product_code: string
          reorder_alert: boolean | null
          suggested_reorder_qty: number | null
        }
        Insert: {
          calculated_at?: string | null
          confidence_level: string
          current_stock: number
          days_until_stockout?: number | null
          forecast_date: string
          id?: string
          predicted_demand: number
          product_code: string
          reorder_alert?: boolean | null
          suggested_reorder_qty?: number | null
        }
        Update: {
          calculated_at?: string | null
          confidence_level?: string
          current_stock?: number
          days_until_stockout?: number | null
          forecast_date?: string
          id?: string
          predicted_demand?: number
          product_code?: string
          reorder_alert?: boolean | null
          suggested_reorder_qty?: number | null
        }
        Relationships: []
      }
      order_rate_limit: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          id: string
          ip_address: string
          last_attempt_at: string | null
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          id?: string
          ip_address: string
          last_attempt_at?: string | null
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          id?: string
          ip_address?: string
          last_attempt_at?: string | null
        }
        Relationships: []
      }
      order_state_log: {
        Row: {
          automated: boolean | null
          changed_at: string
          changed_by: string | null
          from_state: string | null
          id: string
          notes: string | null
          sales_order_id: string
          to_state: string
        }
        Insert: {
          automated?: boolean | null
          changed_at?: string
          changed_by?: string | null
          from_state?: string | null
          id?: string
          notes?: string | null
          sales_order_id: string
          to_state: string
        }
        Update: {
          automated?: boolean | null
          changed_at?: string
          changed_by?: string | null
          from_state?: string | null
          id?: string
          notes?: string | null
          sales_order_id?: string
          to_state?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_state_log_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_district: string
          customer_lastname: string
          customer_name: string
          customer_phone: string
          id: string
          order_code: string
          product_code: string
          product_color: string
          product_name: string
          product_price: number
          recommended_by: string | null
          source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_district: string
          customer_lastname: string
          customer_name: string
          customer_phone: string
          id?: string
          order_code: string
          product_code: string
          product_color: string
          product_name: string
          product_price: number
          recommended_by?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_district?: string
          customer_lastname?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          order_code?: string
          product_code?: string
          product_color?: string
          product_name?: string
          product_price?: number
          recommended_by?: string | null
          source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          asignado_a_vendedor_id: string | null
          asignado_a_vendedor_nombre: string | null
          cantidad_items: number
          cliente_apellido: string | null
          cliente_email: string | null
          cliente_id: string | null
          cliente_nombre: string
          cliente_telefono: string
          codigo: string
          codigo_seguimiento: string | null
          comprobante_prepago_url: string | null
          confirmacion_pago: boolean | null
          created_at: string | null
          created_by: string | null
          direccion_completa: string
          distrito: string
          estado: Database["public"]["Enums"]["pedido_estado"] | null
          estado_confirmacion:
            | Database["public"]["Enums"]["pedido_confirmacion"]
            | null
          id: string
          latitud: number | null
          longitud: number | null
          metodo_pago: Database["public"]["Enums"]["pedido_metodo_pago"] | null
          notas_internas: string | null
          origen_pagina: string | null
          precio_total: number
          productos: Json
          referencia_adicional: string | null
          ruta: Database["public"]["Enums"]["pedido_ruta"] | null
          timestamp_confirmacion_cliente: string | null
          timestamp_en_ruta: string | null
          timestamp_entregado: string | null
          timestamp_envio_wa: string | null
          timestamp_registro: string | null
          updated_at: string | null
          updated_by: string | null
          url_google_maps: string | null
        }
        Insert: {
          asignado_a_vendedor_id?: string | null
          asignado_a_vendedor_nombre?: string | null
          cantidad_items?: number
          cliente_apellido?: string | null
          cliente_email?: string | null
          cliente_id?: string | null
          cliente_nombre: string
          cliente_telefono: string
          codigo: string
          codigo_seguimiento?: string | null
          comprobante_prepago_url?: string | null
          confirmacion_pago?: boolean | null
          created_at?: string | null
          created_by?: string | null
          direccion_completa: string
          distrito: string
          estado?: Database["public"]["Enums"]["pedido_estado"] | null
          estado_confirmacion?:
            | Database["public"]["Enums"]["pedido_confirmacion"]
            | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          metodo_pago?: Database["public"]["Enums"]["pedido_metodo_pago"] | null
          notas_internas?: string | null
          origen_pagina?: string | null
          precio_total: number
          productos?: Json
          referencia_adicional?: string | null
          ruta?: Database["public"]["Enums"]["pedido_ruta"] | null
          timestamp_confirmacion_cliente?: string | null
          timestamp_en_ruta?: string | null
          timestamp_entregado?: string | null
          timestamp_envio_wa?: string | null
          timestamp_registro?: string | null
          updated_at?: string | null
          updated_by?: string | null
          url_google_maps?: string | null
        }
        Update: {
          asignado_a_vendedor_id?: string | null
          asignado_a_vendedor_nombre?: string | null
          cantidad_items?: number
          cliente_apellido?: string | null
          cliente_email?: string | null
          cliente_id?: string | null
          cliente_nombre?: string
          cliente_telefono?: string
          codigo?: string
          codigo_seguimiento?: string | null
          comprobante_prepago_url?: string | null
          confirmacion_pago?: boolean | null
          created_at?: string | null
          created_by?: string | null
          direccion_completa?: string
          distrito?: string
          estado?: Database["public"]["Enums"]["pedido_estado"] | null
          estado_confirmacion?:
            | Database["public"]["Enums"]["pedido_confirmacion"]
            | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          metodo_pago?: Database["public"]["Enums"]["pedido_metodo_pago"] | null
          notas_internas?: string | null
          origen_pagina?: string | null
          precio_total?: number
          productos?: Json
          referencia_adicional?: string | null
          ruta?: Database["public"]["Enums"]["pedido_ruta"] | null
          timestamp_confirmacion_cliente?: string | null
          timestamp_en_ruta?: string | null
          timestamp_entregado?: string | null
          timestamp_envio_wa?: string | null
          timestamp_registro?: string | null
          updated_at?: string | null
          updated_by?: string | null
          url_google_maps?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_auditoria: {
        Row: {
          campo_modificado: string | null
          id: string
          pedido_id: string
          timestamp: string | null
          usuario_email: string | null
          usuario_id: string | null
          valor_anterior: string | null
          valor_nuevo: string | null
        }
        Insert: {
          campo_modificado?: string | null
          id?: string
          pedido_id: string
          timestamp?: string | null
          usuario_email?: string | null
          usuario_id?: string | null
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Update: {
          campo_modificado?: string | null
          id?: string
          pedido_id?: string
          timestamp?: string | null
          usuario_email?: string | null
          usuario_id?: string | null
          valor_anterior?: string | null
          valor_nuevo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_auditoria_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_eventos: {
        Row: {
          descripcion: string | null
          id: string
          pedido_id: string
          timestamp: string | null
          tipo_evento: string
        }
        Insert: {
          descripcion?: string | null
          id?: string
          pedido_id: string
          timestamp?: string | null
          tipo_evento: string
        }
        Update: {
          descripcion?: string | null
          id?: string
          pedido_id?: string
          timestamp?: string | null
          tipo_evento?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_eventos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_kpis: {
        Row: {
          created_at: string | null
          id: string
          pedido_id: string
          tasa_conversion: boolean | null
          tiempo_confirmacion_vendedor: number | null
          tiempo_entrega_total: number | null
          tiempo_respuesta_cliente: number | null
          valor_ticket: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          pedido_id: string
          tasa_conversion?: boolean | null
          tiempo_confirmacion_vendedor?: number | null
          tiempo_entrega_total?: number | null
          tiempo_respuesta_cliente?: number | null
          valor_ticket?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          pedido_id?: string
          tasa_conversion?: boolean | null
          tiempo_confirmacion_vendedor?: number | null
          tiempo_entrega_total?: number | null
          tiempo_respuesta_cliente?: number | null
          valor_ticket?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_kpis_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_vendedor_stats: {
        Row: {
          fecha_stats: string | null
          id: string
          ingreso_diario: number | null
          promedio_ticket: number | null
          tiempo_promedio_confirmacion: number | null
          total_cancelados_hoy: number | null
          total_confirmados_hoy: number | null
          total_entregados_hoy: number | null
          total_pedidos_hoy: number | null
          updated_at: string | null
          vendedor_id: string
        }
        Insert: {
          fecha_stats?: string | null
          id?: string
          ingreso_diario?: number | null
          promedio_ticket?: number | null
          tiempo_promedio_confirmacion?: number | null
          total_cancelados_hoy?: number | null
          total_confirmados_hoy?: number | null
          total_entregados_hoy?: number | null
          total_pedidos_hoy?: number | null
          updated_at?: string | null
          vendedor_id: string
        }
        Update: {
          fecha_stats?: string | null
          id?: string
          ingreso_diario?: number | null
          promedio_ticket?: number | null
          tiempo_promedio_confirmacion?: number | null
          total_cancelados_hoy?: number | null
          total_confirmados_hoy?: number | null
          total_entregados_hoy?: number | null
          total_pedidos_hoy?: number | null
          updated_at?: string | null
          vendedor_id?: string
        }
        Relationships: []
      }
      product_similarity: {
        Row: {
          calculated_at: string | null
          id: string
          product_id_1: string
          product_id_2: string
          similarity_score: number
        }
        Insert: {
          calculated_at?: string | null
          id?: string
          product_id_1: string
          product_id_2: string
          similarity_score: number
        }
        Update: {
          calculated_at?: string | null
          id?: string
          product_id_1?: string
          product_id_2?: string
          similarity_score?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          ai_churn_risk: number | null
          ai_reorder_point: number | null
          avg_days_to_restock: number | null
          beneficios: string[] | null
          cantidad_stock: number | null
          categoria: string
          colores_disponibles: string[] | null
          cost: number | null
          created_at: string | null
          descripcion_corta: string | null
          discontinue_reason: string | null
          discontinued_at: string | null
          especificaciones: string[] | null
          id: string
          ideal_para: string | null
          imagen_url: string | null
          imagenes_por_color: Json | null
          is_discontinued: boolean | null
          lead_time_days_override: number | null
          max_stock_level: number | null
          min_stock_level: number | null
          nombre_producto: string
          precio: number
          precio_anterior: number | null
          preferred_supplier_id: string | null
          product_code: string
          reorder_point: number | null
          sales_velocity_7d: number | null
          tallas_disponibles: string[] | null
          total_recommendations: number | null
          total_vendido: number | null
          total_views: number | null
          updated_at: string | null
          vendor_id: string | null
          zona_pierna: string | null
        }
        Insert: {
          ai_churn_risk?: number | null
          ai_reorder_point?: number | null
          avg_days_to_restock?: number | null
          beneficios?: string[] | null
          cantidad_stock?: number | null
          categoria: string
          colores_disponibles?: string[] | null
          cost?: number | null
          created_at?: string | null
          descripcion_corta?: string | null
          discontinue_reason?: string | null
          discontinued_at?: string | null
          especificaciones?: string[] | null
          id?: string
          ideal_para?: string | null
          imagen_url?: string | null
          imagenes_por_color?: Json | null
          is_discontinued?: boolean | null
          lead_time_days_override?: number | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          nombre_producto: string
          precio: number
          precio_anterior?: number | null
          preferred_supplier_id?: string | null
          product_code: string
          reorder_point?: number | null
          sales_velocity_7d?: number | null
          tallas_disponibles?: string[] | null
          total_recommendations?: number | null
          total_vendido?: number | null
          total_views?: number | null
          updated_at?: string | null
          vendor_id?: string | null
          zona_pierna?: string | null
        }
        Update: {
          ai_churn_risk?: number | null
          ai_reorder_point?: number | null
          avg_days_to_restock?: number | null
          beneficios?: string[] | null
          cantidad_stock?: number | null
          categoria?: string
          colores_disponibles?: string[] | null
          cost?: number | null
          created_at?: string | null
          descripcion_corta?: string | null
          discontinue_reason?: string | null
          discontinued_at?: string | null
          especificaciones?: string[] | null
          id?: string
          ideal_para?: string | null
          imagen_url?: string | null
          imagenes_por_color?: Json | null
          is_discontinued?: boolean | null
          lead_time_days_override?: number | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          nombre_producto?: string
          precio?: number
          precio_anterior?: number | null
          preferred_supplier_id?: string | null
          product_code?: string
          reorder_point?: number | null
          sales_velocity_7d?: number | null
          tallas_disponibles?: string[] | null
          total_recommendations?: number | null
          total_vendido?: number | null
          total_views?: number | null
          updated_at?: string | null
          vendor_id?: string | null
          zona_pierna?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_preferred_supplier_id_fkey"
            columns: ["preferred_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          cost_per_unit: number
          created_at: string | null
          id: string
          product_code: string
          product_name: string
          purchase_order_id: string
          qty_ordered: number
          qty_received: number | null
          updated_at: string | null
        }
        Insert: {
          cost_per_unit: number
          created_at?: string | null
          id?: string
          product_code: string
          product_name: string
          purchase_order_id: string
          qty_ordered: number
          qty_received?: number | null
          updated_at?: string | null
        }
        Update: {
          cost_per_unit?: number
          created_at?: string | null
          id?: string
          product_code?: string
          product_name?: string
          purchase_order_id?: string
          qty_ordered?: number
          qty_received?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "v_purchase_orders_payment_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          actual_delivery_date: string | null
          advance_payment_amount: number | null
          ai_recommendation: Json | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          expected_delivery_date: string | null
          id: string
          linked_sales_order_id: string | null
          notes: string | null
          order_number: string
          order_type: string | null
          payment_method: string | null
          payment_status: string | null
          payment_terms: string | null
          po_type: string | null
          priority: string | null
          product_code: string
          product_name: string
          quantity: number
          status: string | null
          supplier_id: string
          total_amount: number
          total_cost: number | null
          tracking_number: string | null
          unit_price: number
          updated_at: string | null
          vendor_id: string | null
          vendor_invoice_number: string | null
          vendor_reference_number: string | null
          warehouse_destination: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          advance_payment_amount?: number | null
          ai_recommendation?: Json | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          expected_delivery_date?: string | null
          id?: string
          linked_sales_order_id?: string | null
          notes?: string | null
          order_number: string
          order_type?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_terms?: string | null
          po_type?: string | null
          priority?: string | null
          product_code: string
          product_name: string
          quantity: number
          status?: string | null
          supplier_id: string
          total_amount: number
          total_cost?: number | null
          tracking_number?: string | null
          unit_price: number
          updated_at?: string | null
          vendor_id?: string | null
          vendor_invoice_number?: string | null
          vendor_reference_number?: string | null
          warehouse_destination?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          advance_payment_amount?: number | null
          ai_recommendation?: Json | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          expected_delivery_date?: string | null
          id?: string
          linked_sales_order_id?: string | null
          notes?: string | null
          order_number?: string
          order_type?: string | null
          payment_method?: string | null
          payment_status?: string | null
          payment_terms?: string | null
          po_type?: string | null
          priority?: string | null
          product_code?: string
          product_name?: string
          quantity?: number
          status?: string | null
          supplier_id?: string
          total_amount?: number
          total_cost?: number | null
          tracking_number?: string | null
          unit_price?: number
          updated_at?: string | null
          vendor_id?: string | null
          vendor_invoice_number?: string | null
          vendor_reference_number?: string | null
          warehouse_destination?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_linked_sales_order_id_fkey"
            columns: ["linked_sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          credit_amount: number | null
          id: string
          order_id: string | null
          referral_code_used: string
          referred_customer_id: string | null
          referrer_customer_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          credit_amount?: number | null
          id?: string
          order_id?: string | null
          referral_code_used: string
          referred_customer_id?: string | null
          referrer_customer_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          credit_amount?: number | null
          id?: string
          order_id?: string | null
          referral_code_used?: string
          referred_customer_id?: string | null
          referrer_customer_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_customer_id_fkey"
            columns: ["referred_customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_customer_id_fkey"
            columns: ["referrer_customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_items: {
        Row: {
          created_at: string | null
          id: string
          is_backorder: boolean | null
          linked_purchase_order_id: string | null
          product_code: string
          product_color: string | null
          product_name: string
          quantity: number
          sales_order_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_backorder?: boolean | null
          linked_purchase_order_id?: string | null
          product_code: string
          product_color?: string | null
          product_name: string
          quantity?: number
          sales_order_id: string
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          is_backorder?: boolean | null
          linked_purchase_order_id?: string | null
          product_code?: string
          product_color?: string | null
          product_name?: string
          quantity?: number
          sales_order_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_items_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_orders: {
        Row: {
          courier: string | null
          created_at: string | null
          customer_address: string | null
          customer_district: string | null
          customer_id: string | null
          customer_lastname: string | null
          customer_lat: number | null
          customer_lng: number | null
          customer_name: string
          customer_phone: string | null
          customer_type: string | null
          delivered_at: string | null
          fulfillment_status: string | null
          id: string
          notes: string | null
          order_number: string
          packed_at: string | null
          payment_method: string | null
          payment_status: string | null
          picking_started_at: string | null
          priority: string | null
          recommended_by: string | null
          referral_code_used: string | null
          shipped_at: string | null
          source: string | null
          total: number
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          courier?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_district?: string | null
          customer_id?: string | null
          customer_lastname?: string | null
          customer_lat?: number | null
          customer_lng?: number | null
          customer_name: string
          customer_phone?: string | null
          customer_type?: string | null
          delivered_at?: string | null
          fulfillment_status?: string | null
          id?: string
          notes?: string | null
          order_number: string
          packed_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          picking_started_at?: string | null
          priority?: string | null
          recommended_by?: string | null
          referral_code_used?: string | null
          shipped_at?: string | null
          source?: string | null
          total: number
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          courier?: string | null
          created_at?: string | null
          customer_address?: string | null
          customer_district?: string | null
          customer_id?: string | null
          customer_lastname?: string | null
          customer_lat?: number | null
          customer_lng?: number | null
          customer_name?: string
          customer_phone?: string | null
          customer_type?: string | null
          delivered_at?: string | null
          fulfillment_status?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          packed_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          picking_started_at?: string | null
          priority?: string | null
          recommended_by?: string | null
          referral_code_used?: string | null
          shipped_at?: string | null
          source?: string | null
          total?: number
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          lead_time_days: number | null
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          rating: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          lead_time_days?: number | null
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          lead_time_days?: number | null
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          rating?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          product_code: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_code: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_code?: string
          user_id?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          action: string
          created_at: string | null
          id: string
          product_code: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          product_code: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          product_code?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendors: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          lead_time_days: number | null
          name: string
          notes: string | null
          payment_terms: string | null
          performance_rating: number | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          lead_time_days?: number | null
          name: string
          notes?: string | null
          payment_terms?: string | null
          performance_rating?: number | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          lead_time_days?: number | null
          name?: string
          notes?: string | null
          payment_terms?: string | null
          performance_rating?: number | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_purchase_orders_payment_summary: {
        Row: {
          actual_delivery_date: string | null
          advance_payment_amount: number | null
          balance_due: number | null
          created_at: string | null
          days_overdue: number | null
          expected_delivery_date: string | null
          id: string | null
          order_number: string | null
          payment_status: string | null
          payment_terms: string | null
          status: string | null
          supplier_id: string | null
          supplier_name: string | null
          total_cost: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_po_total: { Args: { po_id: string }; Returns: number }
      calculate_reorder_points: {
        Args: never
        Returns: {
          avg_daily_sales: number
          calculated_rop: number
          max_daily_sales: number
          message: string
          product_code: string
          safety_stock: number
        }[]
      }
      check_order_rate_limit: {
        Args: {
          client_ip: string
          max_attempts?: number
          window_hours?: number
        }
        Returns: boolean
      }
      duplicate_purchase_order: {
        Args: { new_notes?: string; source_po_id: string }
        Returns: string
      }
      generate_order_code: { Args: never; Returns: string }
      generate_po_number_sequential: { Args: never; Returns: string }
      generate_purchase_order_number: { Args: never; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      generate_sales_order_number: { Args: never; Returns: string }
      get_dashboard_metrics: { Args: never; Returns: Json }
      get_low_stock_products: {
        Args: { p_threshold?: number }
        Returns: {
          cantidad_stock: number
          demanda_diaria: number
          dias_restantes: number
          nombre_producto: string
          product_code: string
          total_vendido: number
        }[]
      }
      get_order_by_code: {
        Args: { lookup_code: string }
        Returns: {
          created_at: string
          customer_district: string
          customer_lastname: string
          customer_name: string
          customer_phone: string
          id: string
          order_code: string
          product_code: string
          product_color: string
          product_name: string
          product_price: number
          recommended_by: string
          source: string
          status: string
          updated_at: string
        }[]
      }
      get_po_items_summary: { Args: { po_id: string }; Returns: Json }
      get_product_conversion_metrics: {
        Args: { p_product_code: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_product_recommendations: {
        Args: { p_product_code: string }
        Returns: undefined
      }
      increment_product_views: {
        Args: { p_product_code: string }
        Returns: undefined
      }
      predict_restock_date: { Args: { p_product_code: string }; Returns: Json }
      process_po_reception: {
        Args: {
          p_is_complete?: boolean
          p_po_id: string
          p_qty_received?: number
        }
        Returns: Json
      }
      process_purchase_order_received: {
        Args: { p_order_id: string }
        Returns: Json
      }
      register_product_sale: {
        Args: { p_product_code: string; p_quantity?: number }
        Returns: Json
      }
      run_reorder_calculation: { Args: never; Returns: Json }
      update_product_stock: {
        Args: { p_new_stock: number; p_product_code: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      pedido_confirmacion:
        | "pendiente"
        | "confirmado_cliente"
        | "rechazado"
        | "sin_respuesta"
      pedido_estado:
        | "borrador"
        | "pendiente_confirmacion"
        | "confirmado"
        | "en_ruta"
        | "entregado"
        | "cancelado"
      pedido_metodo_pago: "cod" | "yape" | "plin" | "transferencia" | "tarjeta"
      pedido_ruta: "web_form" | "whatsapp_manual"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      pedido_confirmacion: [
        "pendiente",
        "confirmado_cliente",
        "rechazado",
        "sin_respuesta",
      ],
      pedido_estado: [
        "borrador",
        "pendiente_confirmacion",
        "confirmado",
        "en_ruta",
        "entregado",
        "cancelado",
      ],
      pedido_metodo_pago: ["cod", "yape", "plin", "transferencia", "tarjeta"],
      pedido_ruta: ["web_form", "whatsapp_manual"],
    },
  },
} as const
