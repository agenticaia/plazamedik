import product750_1 from "@/assets/product-750-1.jpg";
import product750_2 from "@/assets/product-750-2.jpg";
import product870 from "@/assets/product-870.jpg";
import product870a_1 from "@/assets/product-870a-1.jpg";
import product870a_2 from "@/assets/product-870a-2.jpg";
import product880 from "@/assets/product-880.jpg";
import product950a from "@/assets/product-950a.jpg";

const IMAGE_MAP: Record<string, string> = {
  "/images/product-750-1.jpg": product750_1,
  "/images/product-750-2.jpg": product750_2,
  "/images/product-870.jpg": product870,
  "/images/product-870a-1.jpg": product870a_1,
  "/images/product-870a-2.jpg": product870a_2,
  "/images/product-880.jpg": product880,
  "/images/product-950a.jpg": product950a,
};

export const fallbackProductImage = product750_1;

export function resolveProductImage(path?: string | null) {
  if (!path) return fallbackProductImage;
  return IMAGE_MAP[path] ?? fallbackProductImage;
}
