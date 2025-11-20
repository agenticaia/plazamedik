import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/lib/sessionId';

interface Recommendation {
  product_code: string;
  nombre_producto: string;
  precio: number;
  imagen_url: string;
  similarity_score: number;
  categoria: string;
}

export function useHomeRecommendations(limit: number = 8) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const sessionId = getSessionId();

      // 1. Obtener historial reciente del usuario (últimos 5 productos vistos)
      const { data: userHistory } = await supabase
        .from('user_interactions')
        .select('product_code')
        .eq('session_id', sessionId)
        .in('action', ['view', 'click_recommendation'])
        .order('created_at', { ascending: false })
        .limit(5);

      if (!userHistory || userHistory.length === 0) {
        // Si no hay historial, mostrar productos más vendidos
        const { data: popularProducts } = await supabase
          .from('products')
          .select('product_code, nombre_producto, precio, imagen_url, categoria')
          .order('total_vendido', { ascending: false })
          .limit(limit);

        setRecommendations(popularProducts?.map(p => ({
          ...p,
          similarity_score: 0.5
        })) || []);
        setLoading(false);
        return;
      }

      // 2. Obtener productos similares para cada producto del historial
      const viewedProductCodes = [...new Set(userHistory.map(h => h.product_code))];
      const allSimilarProducts = [];

      for (const productCode of viewedProductCodes) {
        const { data: similar } = await supabase
          .from('product_similarity')
          .select('product_id_2, similarity_score')
          .eq('product_id_1', productCode)
          .order('similarity_score', { ascending: false })
          .limit(3);

        if (similar) {
          allSimilarProducts.push(...similar);
        }
      }

      // 3. Filtrar duplicados y productos ya vistos
      const uniqueSimilar = allSimilarProducts
        .filter((item, index, self) => 
          index === self.findIndex(t => t.product_id_2 === item.product_id_2)
        )
        .filter(s => !viewedProductCodes.includes(s.product_id_2))
        .sort((a, b) => b.similarity_score - a.similarity_score)
        .slice(0, limit);

      if (uniqueSimilar.length === 0) {
        // Si no hay productos similares, mostrar más vendidos
        const { data: popularProducts } = await supabase
          .from('products')
          .select('product_code, nombre_producto, precio, imagen_url, categoria')
          .order('total_vendido', { ascending: false })
          .limit(limit);

        setRecommendations(popularProducts?.map(p => ({
          ...p,
          similarity_score: 0.5
        })) || []);
        setLoading(false);
        return;
      }

      // 4. Obtener detalles de productos
      const productCodes = uniqueSimilar.map(s => s.product_id_2);
      const { data: productDetails } = await supabase
        .from('products')
        .select('product_code, nombre_producto, precio, imagen_url, categoria')
        .in('product_code', productCodes);

      // 5. Combinar con scores de similitud
      const finalRecommendations = uniqueSimilar.map(similar => {
        const product = productDetails?.find(p => p.product_code === similar.product_id_2);
        return product ? {
          ...product,
          similarity_score: similar.similarity_score
        } : null;
      }).filter(Boolean) as Recommendation[];

      setRecommendations(finalRecommendations);

    } catch (err) {
      console.error('Error fetching home recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  return { recommendations, loading };
}
