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
        ]
      }
      purchase_orders: {
        Row: {
          actual_delivery_date: string | null
          ai_recommendation: Json | null
          approved_by: string | null
          created_at: string | null
          created_by: string | null
          expected_delivery_date: string | null
          id: string
          linked_sales_order_id: string | null
          notes: string | null
          order_number: string
          order_type: string | null
          po_type: string | null
          priority: string | null
          product_code: string
          product_name: string
          quantity: number
          status: string | null
          supplier_id: string
          total_amount: number
          tracking_number: string | null
          unit_price: number
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          ai_recommendation?: Json | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          linked_sales_order_id?: string | null
          notes?: string | null
          order_number: string
          order_type?: string | null
          po_type?: string | null
          priority?: string | null
          product_code: string
          product_name: string
          quantity: number
          status?: string | null
          supplier_id: string
          total_amount: number
          tracking_number?: string | null
          unit_price: number
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          ai_recommendation?: Json | null
          approved_by?: string | null
          created_at?: string | null
          created_by?: string | null
          expected_delivery_date?: string | null
          id?: string
          linked_sales_order_id?: string | null
          notes?: string | null
          order_number?: string
          order_type?: string | null
          po_type?: string | null
          priority?: string | null
          product_code?: string
          product_name?: string
          quantity?: number
          status?: string | null
          supplier_id?: string
          total_amount?: number
          tracking_number?: string | null
          unit_price?: number
          updated_at?: string | null
          vendor_id?: string | null
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
          customer_district: string | null
          customer_lastname: string | null
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
          shipped_at: string | null
          source: string | null
          total: number
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          courier?: string | null
          created_at?: string | null
          customer_district?: string | null
          customer_lastname?: string | null
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
          shipped_at?: string | null
          source?: string | null
          total: number
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          courier?: string | null
          created_at?: string | null
          customer_district?: string | null
          customer_lastname?: string | null
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
          shipped_at?: string | null
          source?: string | null
          total?: number
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      [_ in never]: never
    }
    Functions: {
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
      generate_order_code: { Args: never; Returns: string }
      generate_po_number_sequential: { Args: never; Returns: string }
      generate_purchase_order_number: { Args: never; Returns: string }
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
    },
  },
} as const
