# Generador de Sitemap SEO-Friendly

Este proyecto incluye un generador automático de `sitemap.xml` con URLs amigables para SEO.

## 📋 Estructura de URLs

### Antes (URLs sin SEO):
```
https://plazamedik.net.pe/producto?codigo=960
```

### Ahora (URLs SEO-friendly):
```
https://plazamedik.net.pe/producto/medias-para-varices/Media-Compresiva-Hasta-Muslo-22-27-mmHg
```

Patrón: `/producto/[categoria-slug]/[nombre-producto-slug]`

## 🚀 Uso Local

### Sin Productos (solo rutas estáticas):
```bash
npm run generate-sitemap
```

Esto genera un sitemap.xml con rutas estáticas únicamente.

### Con Productos (requiere Supabase):
```bash
SUPABASE_URL=https://tu-proyecto.supabase.co \
SUPABASE_SERVICE_KEY=tu_service_role_key \
npm run generate-sitemap
```

## 🔐 Configuración para CI/CD

### GitHub Actions
Agregar los siguientes secrets en tu repositorio:
- `SUPABASE_URL`: URL de tu proyecto Supabase (ej: `https://xxx.supabase.co`)
- `SUPABASE_SERVICE_KEY`: Service Role Key de Supabase

En tu workflow (`.github/workflows/deploy.yml`):
```yaml
- name: Generate Sitemap
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
    SITEMAP_BASE_URL: https://plazamedik.net.pe
  run: npm run generate-sitemap
  
- name: Build
  run: npm run build
```

### Vercel (si lo usas)
1. Ve a Settings > Environment Variables
2. Agrega:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `SITEMAP_BASE_URL`

3. Actualiza `package.json`:
```json
{
  "scripts": {
    "build": "npm run generate-sitemap && vite build"
  }
}
```

## 📁 Archivos Involucrados

- `scripts/generate-sitemap.mjs` - Script generador
- `src/lib/slugUtils.ts` - Utilidades para generar slugs
- `src/pages/ProductDetail.tsx` - Soporta ambas rutas (antigua y nueva)
- `src/hooks/useProducts.ts` - Nuevo hook `useProductByName`
- `src/components/ProductCard.tsx` - Usa URLs con slugs
- `src/components/RecommendationPanel.tsx` - Usa URLs con slugs
- `src/components/RecommendationsCarousel.tsx` - Usa URLs con slugs

## 🔄 Retrocompatibilidad

El proyecto mantiene compatibilidad con la ruta antigua:
- **Antigua**: `/producto?codigo=960` → Sigue funcionando
- **Nueva**: `/producto/medias-para-varices/Media-Compresiva-Hasta-Muslo-22-27-mmHg` → Mejor para SEO

## 📊 Sitemap Output

El sitemap generado incluye:
- ✅ Rutas estáticas (home, catálogo, blog, FAQ, etc.)
- ✅ Todas las URLs de productos con nombres legibles
- ✅ Metadata (lastmod, changefreq, priority)
- ✅ URLs en formato XML estándar

Ejemplo:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://plazamedik.net.pe/producto/medias-para-varices/Media-Compresiva-Hasta-Muslo</loc>
    <lastmod>2025-11-27T23:28:31.356Z</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>
```

## 🎯 Categorías Soportadas

```
- varices → medias-para-varices
- trabajo-pie → trabajo-de-pie
- piel-sensible → piel-sensible
```

Agregar nuevas categorías en:
1. `src/lib/slugUtils.ts` - `CATEGORY_SLUG_MAP`
2. `scripts/generate-sitemap.mjs` - `CATEGORY_SLUG_MAP`

## 🐛 Troubleshooting

### El sitemap no incluye productos
- ✓ Verifica que `SUPABASE_URL` y `SUPABASE_SERVICE_KEY` están configuradas
- ✓ El Service Role Key debe tener permisos de lectura en tabla `products`
- ✓ Ejecuta con: `SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npm run generate-sitemap`

### URLs de productos están vacías en sitemap.xml
- Asegúrate que los productos en Supabase tienen:
  - `product_code` ≠ null
  - `nombre_producto` ≠ null
  - `categoria` ≠ null
  - `cantidad_stock > 0` (opcional: `is_discontinued = false`)

## 🚀 Próximos Pasos

1. **Verificar localmente** con credenciales de Supabase
2. **Integrar en CI/CD** (GitHub Actions, Vercel, etc.)
3. **Enviar sitemap a Google Search Console** (`/sitemap.xml`)
4. **Monitorear** indexación de URLs en Google Analytics
