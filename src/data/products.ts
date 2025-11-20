// ⚠️ ARCHIVO DEPRECADO - NO USAR
// Este archivo contiene productos hardcodeados que ya no se utilizan.
// Todos los productos ahora se gestionan dinámicamente desde la base de datos.
// 
// Si necesitas:
// - Importar productos: Usa `useProducts()` desde @/hooks/useProducts
// - Obtener enlace de WhatsApp: Usa `getWhatsAppLink()` desde @/lib/productUtils
// - Filtrar por categoría: Aplica `.filter()` sobre los productos del hook
//
// Este archivo se mantiene temporalmente por si hay migración de datos pendiente,
// pero NO debe ser importado en ningún componente nuevo.

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
}

// Array de productos vacío - ya no se usa
export const products: Product[] = [];

// Funciones deprecadas - usar useProducts() en su lugar
export const getProductsByCategory = (category: string): Product[] => {
  console.warn('⚠️ getProductsByCategory está deprecado. Usa useProducts() y aplica .filter() en su lugar');
  return [];
};

export const getProductsByCompression = (compression: string): Product[] => {
  console.warn('⚠️ getProductsByCompression está deprecado. Usa useProducts() y aplica .filter() en su lugar');
  return [];
};

export const getFeaturedProducts = (): Product[] => {
  console.warn('⚠️ getFeaturedProducts está deprecado. Usa useProducts() y aplica .slice() en su lugar');
  return [];
};

// Esta función se movió a @/lib/productUtils
export const getWhatsAppLink = (productName: string, message?: string): string => {
  console.warn('⚠️ getWhatsAppLink se movió a @/lib/productUtils. Actualiza tu import');
  const phone = "51941941083";
  const text = message || `Hola, quiero información del producto: ${productName} - vengo de PlazaMedik.net.pe`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
};
