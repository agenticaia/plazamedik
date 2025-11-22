import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardMetrics {
  total_productos: number;
  total_stock: number;
  total_vendido: number;
  total_ingresos: number;
  total_views: number;
  productos_bajo_stock: number;
  productos_agotados: number;
  conversion_rate_promedio: number;
  updated_at: string;
}

export interface LowStockProduct {
  product_code: string;
  nombre_producto: string;
  cantidad_stock: number;
  total_vendido: number;
  demanda_diaria: number;
  dias_restantes: number;
}

export interface ProductRestockPrediction {
  product_code: string;
  demanda_diaria: number;
  dias_restantes: number;
  fecha_reabastecimiento: string | null;
  recomendacion: string;
}

export interface ProductConversionMetrics {
  product_code: string;
  total_views: number;
  total_vendido: number;
  conversion_rate: number;
  ingresos_generados: number;
}

export const useExecutiveDashboard = () => {
  // Fetch dashboard metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["dashboard-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dashboard_metrics");
      if (error) throw error;
      return data as unknown as DashboardMetrics;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch low stock products for critical restock
  const { data: lowStockProducts, isLoading: lowStockLoading } = useQuery({
    queryKey: ["low-stock-products", 15],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_low_stock_products", {
        p_threshold: 15,
      });
      if (error) throw error;
      return data as LowStockProduct[];
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch all products for risk projection and scatter plot
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["products-executive"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("product_code, nombre_producto, precio, cantidad_stock, total_vendido, total_views, is_discontinued")
        .eq("is_discontinued", false);
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  // Calculate inventory value from metrics
  const inventoryValue = metrics
    ? (metrics.total_stock || 0) * 50 // Average unit price estimate
    : 0;

  return {
    metrics,
    lowStockProducts,
    products,
    inventoryValue,
    isLoading: metricsLoading || lowStockLoading || productsLoading,
  };
};
