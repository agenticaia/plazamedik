import { useMemo } from 'react';
import { useProducts, type Product } from './useProducts';

export interface GroupedProduct extends Product {
  allImages: { color: string; image: string }[];
}

/**
 * Agrupa productos por código base, eliminando duplicados por color.
 * Mantiene un solo producto por SKU con todas las variantes de color.
 */
export function useGroupedProducts(adminView: boolean = false) {
  const { products, loading, error, refetch } = useProducts(adminView);

  const groupedProducts = useMemo(() => {
    const productMap = new Map<string, GroupedProduct>();

    products.forEach((product) => {
      const baseCode = product.code;
      
      if (!productMap.has(baseCode)) {
        // Primer producto de este código - lo usamos como base
        productMap.set(baseCode, {
          ...product,
          allImages: [{ color: product.colors[0] || 'Piel', image: product.image }],
        });
      } else {
        // Ya existe este producto - solo agregamos la imagen del color si es diferente
        const existing = productMap.get(baseCode)!;
        const currentColor = product.colors[0] || 'Piel';
        
        // Verificar si ya tenemos una imagen para este color
        const colorExists = existing.allImages.some(img => img.color === currentColor);
        
        if (!colorExists) {
          existing.allImages.push({ color: currentColor, image: product.image });
        }
      }
    });

    return Array.from(productMap.values());
  }, [products]);

  return { products: groupedProducts, loading, error, refetch };
}
