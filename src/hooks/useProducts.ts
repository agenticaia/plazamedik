import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { mapDbProductToBase, type BaseProduct } from '@/lib/productMapping';
import type { Tables } from '@/integrations/supabase/types';

export interface Product extends BaseProduct {
  stock: number;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .gt('cantidad_stock', 0) // Solo productos con stock
        .or('is_discontinued.is.null,is_discontinued.eq.false') // Ocultar descontinuados
        .order('nombre_producto');

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
  }, []);

  return { products, loading, error, refetch: fetchProducts };
}

export function useProduct(code: string | null) {
  const { products, loading, error } = useProducts();
  const product = products.find((p) => p.code === code);
  
  return { product, loading, error };
}

export type { Product as CatalogProduct };
