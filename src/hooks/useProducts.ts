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
  const [products, setProducts] = useState<Product[] | Tables<'products'>[]>([]);
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

      // Si es admin view, retornar productos raw sin transformar
      if (adminView) {
        setProducts(rows);
        setError(null);
        return;
      }

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

export function useProductByName(name: string | null) {
  const { products, loading, error } = useProducts();
  const product = name ? products.find((p) => {
    // Normalizar nombre del producto para comparación
    const productName = p.name.toLowerCase().trim();
    const searchName = name.toLowerCase().trim();
    return productName === searchName || productName.includes(searchName);
  }) : undefined;
  
  return { product, loading, error };
}

export function useProductBySlug(slug: string | null) {
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setProduct(undefined);
      setError(null);
      return;
    }

    const searchProduct = async () => {
      try {
        setLoading(true);
        setError(null); // Limpiar error anterior
        
        // Decodificar el slug: convertir guiones a espacios
        // "media-compresiva-hasta-muslo-22-27-mmhg" -> "media compresiva hasta muslo 22 27 mmhg"
        const searchTerm = slug.replace(/\-/g, ' ').toLowerCase();
        console.log('🔍 Buscando producto por slug:', { slug, searchTerm });

        // Buscar en Supabase por nombre aproximado
        const { data, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .gt('cantidad_stock', 0)
          .or('is_discontinued.is.null,is_discontinued.eq.false')
          .order('nombre_producto')
          .limit(100); // Obtener productos para búsqueda local

        if (fetchError) throw fetchError;

        const rows = (data || []) as Tables<'products'>[];
        console.log('📦 Total productos encontrados:', rows.length);
        
        // Función para normalizar y comparar
        const normalize = (str: string) => 
          str.toLowerCase()
            .trim()
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s\d]/g, ''); // Elimina caracteres especiales
        
        const normalizedSearchTerm = normalize(searchTerm);
        console.log('📝 Search term normalizado:', normalizedSearchTerm);
        
        // Buscar coincidencia por nombre normalizado
        const foundProduct = rows.find((p) => {
          const productNameNormalized = normalize(p.nombre_producto);
          
          // Estrategia: buscar por palabras clave
          // El search term debe coincidir con la mayoría del nombre
          const searchWords = normalizedSearchTerm.split(' ').filter(w => w.length > 0);
          const productWords = productNameNormalized.split(' ').filter(w => w.length > 0);
          
          // Contar coincidencias de palabras
          const matchedWords = searchWords.filter(sw => 
            productWords.some(pw => pw.includes(sw) || sw.includes(pw))
          ).length;
          
          const matchPercentage = searchWords.length > 0 
            ? matchedWords / searchWords.length 
            : 0;
          
          const isMatch = matchPercentage >= 0.7; // Al menos 70% de coincidencia
          
          if (isMatch && matchedWords > 0) {
            console.log('✅ Coincidencia:', { 
              original: p.nombre_producto, 
              normalized: productNameNormalized, 
              matchedWords,
              percentage: (matchPercentage * 100).toFixed(0) + '%'
            });
          }
          
          return isMatch && matchedWords > 0;
        });

        if (foundProduct) {
          console.log('✅ Producto encontrado:', foundProduct.nombre_producto);
          const mapped = mapDbProductToBase(foundProduct);
          setProduct({
            ...mapped,
            stock: foundProduct.cantidad_stock || 0,
          });
          setError(null);
        } else {
          console.log('❌ Producto NO encontrado para:', searchTerm);
          console.log('📋 Primeros 5 productos:', rows.slice(0, 5).map(p => p.nombre_producto));
          setProduct(undefined);
          setError('Producto no encontrado');
        }
      } catch (err) {
        console.error('❌ Error buscando producto por slug:', err);
        setProduct(undefined);
        setError(err instanceof Error ? err.message : 'Error al cargar producto');
      } finally {
        setLoading(false);
      }
    };

    searchProduct();
  }, [slug]);

  return { product, loading, error };
}

export type { Product as CatalogProduct };
