import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getSessionId } from '@/lib/sessionId';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();

  useEffect(() => {
    fetchRecommendations();
  }, [user]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const sessionId = getSessionId();

      // 1. Si el usuario está autenticado, priorizar favoritos
      let favoriteProducts: string[] = [];
      if (user) {
        const { data: favorites } = await supabase
          .from('user_favorites')
          .select('product_code')
          .eq('user_id', user.id)
          .limit(3);
        
        favoriteProducts = favorites?.map(f => f.product_code) || [];
      }

      // 2. Obtener historial reciente del usuario (últimos 5 productos vistos)
      const { data: userHistory } = await supabase
        .from('user_interactions')
        .select('product_code')
        .eq('session_id', sessionId)
        .in('action', ['view', 'click_recommendation'])
        .order('created_at', { ascending: false })
        .limit(5);

      // Combinar favoritos con historial, priorizando favoritos
      const sourceProducts = [...favoriteProducts, ...(userHistory?.map(h => h.product_code) || [])];
      const uniqueSourceProducts = [...new Set(sourceProducts)];

      if (uniqueSourceProducts.length === 0) {
        // Si no hay historial ni favoritos, mostrar productos más vendidos
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

      // 3. Obtener productos similares para cada producto
      const allSimilarProducts = [];

      for (const productCode of uniqueSourceProducts) {
        const { data: similar } = await supabase
          .from('product_similarity')
          .select('product_id_2, similarity_score')
          .eq('product_id_1', productCode)
          .order('similarity_score', { ascending: false })
          .limit(3);

        if (similar) {
          // Dar peso extra a recomendaciones basadas en favoritos
          const isFavorite = favoriteProducts.includes(productCode);
          const weightedSimilar = similar.map(s => ({
            ...s,
            similarity_score: isFavorite ? s.similarity_score * 1.2 : s.similarity_score
          }));
          allSimilarProducts.push(...weightedSimilar);
        }
      }

      // 4. Filtrar duplicados y productos ya vistos/favoritos
      const uniqueSimilar = allSimilarProducts
        .filter((item, index, self) => 
          index === self.findIndex(t => t.product_id_2 === item.product_id_2)
        )
        .filter(s => !uniqueSourceProducts.includes(s.product_id_2))
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

      // 5. Obtener detalles de productos
      const productCodes = uniqueSimilar.map(s => s.product_id_2);
      const { data: productDetails } = await supabase
        .from('products')
        .select('product_code, nombre_producto, precio, imagen_url, categoria')
        .in('product_code', productCodes);

      // 6. Combinar con scores de similitud
      const finalRecommendations = uniqueSimilar.map(similar => {
        const product = productDetails?.find(p => p.product_code === similar.product_id_2);
        return product ? {
          ...product,
          similarity_score: Math.min(similar.similarity_score, 1) // Cap at 1.0
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
