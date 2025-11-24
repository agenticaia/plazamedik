import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mapDbProductToBase, type BaseProduct } from '@/lib/productMapping';
import { groupProductsByName, type GroupedProduct } from '@/lib/productGrouping';
import type { Tables } from '@/integrations/supabase/types';

export interface Product extends BaseProduct {
  stock: number;
}

export type { GroupedProduct };

export function useProducts(adminView: boolean = false, grouped: boolean = false) {
  const [products, setProducts] = useState<Product[]>([]);
  const [groupedProducts, setGroupedProducts] = useState<GroupedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('products')
        .select('*');
      
      // En vista de admin, mostrar todos los productos
      if (!adminView) {
        query = query
          .gt('cantidad_stock', 0) // Solo productos con stock
          .or('is_discontinued.is.null,is_discontinued.eq.false'); // Ocultar descontinuados
      }
      
      const { data, error: fetchError } = await query.order('nombre_producto');

      if (fetchError) throw fetchError;

      const rows = (data || []) as Tables<'products'>[];

      const transformedProducts: Product[] = rows.map((dbProduct) => {
        const base = mapDbProductToBase(dbProduct);

        return {
          ...base,
          stock: dbProduct.cantidad_stock || 0,
        };
      });

      setProducts(transformedProducts);
      
      // Group products if requested
      if (grouped) {
        const grouped = groupProductsByName(transformedProducts);
        setGroupedProducts(grouped);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [grouped]);

  return { 
    products: grouped ? groupedProducts as any : products, 
    loading, 
    error, 
    refetch: fetchProducts 
  };
}

export function useProduct(code: string | null) {
  const { products, loading, error } = useProducts();
  const product = products.find((p) => p.code === code);
  
  return { product, loading, error };
}

export type { Product as CatalogProduct };
