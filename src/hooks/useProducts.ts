import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  image: string;
  benefits: string[];
  specs: string[];
  idealFor: string;
  category: string[];
  type: string;
  sizes: string[];
  colors: string[];
  priceOriginal: number;
  priceSale: number;
  compression: string;
  brand: string;
  model: string;
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
        .order('nombre_producto');

      if (fetchError) throw fetchError;

      // Transformar datos de Supabase al formato Product
      const transformedProducts: Product[] = (data || []).map((dbProduct) => {
        // Extraer marca y modelo del nombre del producto
        const nameParts = dbProduct.nombre_producto.split(' ');
        const brand = 'RelaxSan'; // Default brand
        
        // Determinar tipo basado en el nombre
        let type = 'rodilla';
        if (dbProduct.nombre_producto.toLowerCase().includes('panty')) {
          type = 'panty';
        } else if (dbProduct.nombre_producto.toLowerCase().includes('muslo')) {
          type = 'muslo';
        }

        // Extraer compresión del nombre
        const compressionMatch = dbProduct.nombre_producto.match(/(\d+-\d+\s*mmHg)/i);
        const compression = compressionMatch ? compressionMatch[1] : '20-30 mmHg';

        return {
          id: `${dbProduct.product_code}-${(dbProduct.colores_disponibles?.[0] || 'piel').toLowerCase()}`,
          code: dbProduct.product_code,
          name: dbProduct.nombre_producto,
          subtitle: dbProduct.descripcion_corta || 'Compresión médica certificada',
          image: dbProduct.imagen_url || '/images/product-750-1.jpg',
          benefits: dbProduct.beneficios || [],
          specs: dbProduct.especificaciones || [],
          idealFor: dbProduct.ideal_para || 'Uso terapéutico y preventivo',
          category: [dbProduct.categoria],
          type,
          sizes: dbProduct.tallas_disponibles || [],
          colors: dbProduct.colores_disponibles || [],
          priceOriginal: dbProduct.precio_anterior || (dbProduct.precio * 1.25),
          priceSale: dbProduct.precio,
          compression,
          brand,
          model: type === 'panty' ? 'Panty' : 'Básico',
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

    // Suscripción a cambios en tiempo real
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
