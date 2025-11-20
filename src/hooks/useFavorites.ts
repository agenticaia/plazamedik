import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setFavorites(new Set());
      setLoading(false);
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('product_code')
        .eq('user_id', user.id);

      if (error) throw error;

      const favSet = new Set(data?.map(f => f.product_code) || []);
      setFavorites(favSet);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (productCode: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión para guardar favoritos');
      return;
    }

    const isFavorite = favorites.has(productCode);

    try {
      if (isFavorite) {
        // Remove favorite
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_code', productCode);

        if (error) throw error;

        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(productCode);
          return newSet;
        });
        toast.success('Eliminado de favoritos');
      } else {
        // Add favorite
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            product_code: productCode
          });

        if (error) throw error;

        setFavorites(prev => new Set([...prev, productCode]));
        toast.success('Agregado a favoritos');
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      toast.error('Error al actualizar favoritos');
    }
  };

  const isFavorite = (productCode: string) => favorites.has(productCode);

  return {
    favorites: Array.from(favorites),
    isFavorite,
    toggleFavorite,
    loading
  };
}
