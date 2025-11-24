import type { Product } from "@/hooks/useProducts";

// Interface for grouped product with color variants
export interface ProductVariant {
  color: string;
  image: string;
  productCode: string;
}

export interface GroupedProduct extends Product {
  variants: ProductVariant[];
  allColors: string[];
}

// Group products by base name (without color suffix)
export function groupProductsByName(products: Product[]): GroupedProduct[] {
  const grouped = new Map<string, GroupedProduct>();

  products.forEach((product) => {
    const baseName = product.name;
    
    if (!grouped.has(baseName)) {
      // First product of this type
      grouped.set(baseName, {
        ...product,
        variants: [{
          color: extractColorFromCode(product),
          image: product.image,
          productCode: product.code,
        }],
        allColors: [extractColorFromCode(product)],
      });
    } else {
      // Add variant to existing product
      const existing = grouped.get(baseName)!;
      const color = extractColorFromCode(product);
      
      existing.variants.push({
        color,
        image: product.image,
        productCode: product.code,
      });
      
      if (!existing.allColors.includes(color)) {
        existing.allColors.push(color);
      }
      
      // Update colors array to include all variants
      existing.colors = existing.allColors;
    }
  });

  return Array.from(grouped.values());
}

// Extract color from product (from colors array or default based on name)
function extractColorFromCode(product: Product): string {
  // First check the colors array
  if (product.colors && product.colors.length > 0) {
    return product.colors[0];
  }
  
  // Otherwise, infer from product name in database
  // This handles legacy products where color isn't in the array
  const nameLower = product.name.toLowerCase();
  if (nameLower.includes('negro')) return 'Negro';
  
  return "Piel"; // Default
}
