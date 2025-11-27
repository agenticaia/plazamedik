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
      // First product of this type - use colores_disponibles as source of truth
      const availableColors = product.colors && product.colors.length > 0 
        ? product.colors 
        : [extractColorFromCode(product)];
      
      // Create variants for all available colors using imagesByColor if available
      const variants: ProductVariant[] = availableColors.map(color => ({
        color,
        image: product.imagesByColor?.[color] || product.image,
        productCode: product.code,
      }));
      
      grouped.set(baseName, {
        ...product,
        variants,
        allColors: availableColors,
        colors: availableColors,
      });
    } else {
      // Product already exists - merge variants from this instance
      const existing = grouped.get(baseName)!;
      const currentColor = extractColorFromCode(product);
      
      // Check if we need to add this variant (if it has a different image)
      const variantExists = existing.variants.some(v => 
        v.color === currentColor && v.productCode === product.code
      );
      
      if (!variantExists && product.image !== existing.image) {
        // Add variant with specific image if it's different
        existing.variants.push({
          color: currentColor,
          image: product.imagesByColor?.[currentColor] || product.image,
          productCode: product.code,
        });
      } else if (!variantExists) {
        // Update existing variant with actual image if available
        const variantIndex = existing.variants.findIndex(v => v.color === currentColor);
        if (variantIndex >= 0) {
          existing.variants[variantIndex].image = product.imagesByColor?.[currentColor] || product.image;
          existing.variants[variantIndex].productCode = product.code;
        }
      }
      
      // Update imagesByColor if product has it
      if (product.imagesByColor && Object.keys(product.imagesByColor).length > 0) {
        existing.imagesByColor = { ...existing.imagesByColor, ...product.imagesByColor };
      }
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
