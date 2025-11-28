/**
 * Utilidades para generar y procesar slugs amigables para SEO
 */

// Mapeo de categorías a slugs amigables
export const CATEGORY_SLUG_MAP: Record<string, string> = {
  'varices': 'medias-para-varices',
  'trabajo-pie': 'trabajo-de-pie',
  'piel-sensible': 'piel-sensible',
};

/**
 * Convierte una categoría a slug amigable
 */
export function getCategorySlug(category: string): string {
  return CATEGORY_SLUG_MAP[category] || category.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Genera un slug a partir del nombre del producto
 * Ejemplo: "Media Compresiva Hasta Muslo 22-27 mmHg" -> "Media-Compresiva-Hasta-Muslo-22-27-mmHg"
 */
export function generateProductSlug(productName: string): string {
  return productName
    .trim()
    .split(/\s+/)
    .join('-')
    .replace(/[^\w\-]/g, '') // Elimina caracteres especiales excepto guiones
    .replace(/--+/g, '-') // Elimina guiones múltiples
    .toLowerCase();
}

/**
 * Genera la URL amigable completa para un producto
 * Patrón: /producto/[category-slug]/[product-slug]
 */
export function getProductUrl(
  productName: string,
  category: string,
  productCode: string
): string {
  const categorySlug = getCategorySlug(category);
  const productSlug = generateProductSlug(productName);
  return `/producto/${categorySlug}/${productSlug}`;
}

/**
 * Decodifica un slug de producto para obtener datos
 * Retorna { categorySlug, productSlug } necesarios para búsqueda
 */
export function decodeProductUrlParams(
  categorySlug: string,
  productSlug: string
): { category: string; productSlug: string } {
  // Inverso del mapeo: buscar la categoría original
  const category = Object.entries(CATEGORY_SLUG_MAP).find(
    ([, slug]) => slug === categorySlug
  )?.[0];

  return {
    category: category || categorySlug,
    productSlug: productSlug.replace(/\-/g, ' '),
  };
}

/**
 * Normaliza un nombre de producto para búsqueda (sin color al final)
 */
export function normalizeProductName(name: string): string {
  // Elimina sufijo de color al final (ej: "- Piel", "- Negro")
  return name
    .replace(/\s*-\s*(Piel|Negro|piel|negro|Color\s+\w+)\s*$/i, '')
    .trim();
}
