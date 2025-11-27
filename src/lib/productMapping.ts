import type { Tables } from "@/integrations/supabase/types";

// Tipo base de producto utilizado en todo el catálogo
export interface BaseProduct {
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
  zona_pierna?: string; // Nueva: Zona de la pierna donde actúa la prenda
  sizes: string[];
  colors: string[];
  priceOriginal: number; // Precio tachado (referencia)
  priceSale: number;     // Precio actual de venta
  compression: string;
  brand: string;
  model: string;
  imagesByColor?: Record<string, string>; // Nuevo: Mapeo de color a URL de imagen
}

// Mapea una fila de BD (tabla products) al modelo de producto que usa el frontend
export function mapDbProductToBase(dbProduct: Tables<"products">): BaseProduct {
  // Extract color from name before removing it
  const rawName = dbProduct.nombre_producto;
  const colorMatch = rawName.match(/\s*-\s*(Piel|Negro|piel|negro)\s*$/i);
  const extractedColor = colorMatch ? colorMatch[1].charAt(0).toUpperCase() + colorMatch[1].slice(1).toLowerCase() : "Piel";
  
  // Remove color suffix from name
  const name = rawName.replace(/\s*-\s*(Piel|Negro|piel|negro)\s*$/i, '').trim();
  const lowerName = name.toLowerCase();

  // Marca por defecto (podemos hacerla dinámica más adelante)
  const brand = "RelaxSan";

  // Tipo por nombre
  let type: BaseProduct["type"] = "rodilla";
  if (lowerName.includes("panty")) {
    type = "panty";
  } else if (lowerName.includes("muslo")) {
    type = "muslo";
  }

  // Compresión por regex en el nombre
  const compressionMatch = name.match(/(\d+-\d+\s*mmHg)/i);
  const compression = compressionMatch ? compressionMatch[1] : "20-30 mmHg";

  // Use extracted color or fallback to colores_disponibles array
  const colorsArray = dbProduct.colores_disponibles && dbProduct.colores_disponibles.length > 0 
    ? dbProduct.colores_disponibles 
    : [extractedColor];

  return {
    id: `${dbProduct.product_code}-${extractedColor.toLowerCase()}`,
    code: dbProduct.product_code,
    name,
    subtitle: dbProduct.descripcion_corta || "Compresión médica certificada",
    image: dbProduct.imagen_url || "/images/product-750-1.jpg",
    benefits: dbProduct.beneficios || [],
    specs: dbProduct.especificaciones || [],
    idealFor: dbProduct.ideal_para || "Uso terapéutico y preventivo",
    category: [dbProduct.categoria],
    type,
    zona_pierna: (dbProduct as any).zona_pierna || type, // Usar zona_pierna de BD o type como fallback
    sizes: dbProduct.tallas_disponibles || [],
    colors: colorsArray,
    priceOriginal: Number(dbProduct.precio_anterior) || Number(dbProduct.precio) * 1.25,
    priceSale: Number(dbProduct.precio),
    compression,
    brand,
    model: type === "panty" ? "Panty" : "Básico",
    imagesByColor: (dbProduct as any).imagenes_por_color || {},
  };
}
