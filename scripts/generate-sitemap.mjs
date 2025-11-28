#!/usr/bin/env node
/**
 * Script para generar sitemap.xml con URLs amigables para SEO
 * 
 * Uso local (sin productos):
 *   npm run generate-sitemap
 * 
 * Uso con Supabase (incluir productos):
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_KEY=your_service_role_key \
 *   npm run generate-sitemap
 * 
 * En CI/CD (GitHub Actions, etc), agregar las variables de entorno como secrets.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde .env
dotenv.config();

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const OUT_FILE = path.join(PUBLIC_DIR, 'sitemap.xml');

const BASE_URL = process.env.SITEMAP_BASE_URL || 'https://plazamedik.net.pe';

// Mapeo de categorías a slugs amigables (debe coincidir con src/lib/slugUtils.ts)
const CATEGORY_SLUG_MAP = {
  'varices': 'medias-para-varices',
  'trabajo-pie': 'trabajo-de-pie',
  'piel-sensible': 'piel-sensible',
};

/**
 * Convierte una categoría a slug amigable
 */
function getCategorySlug(category) {
  return CATEGORY_SLUG_MAP[category] || category.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Genera un slug a partir del nombre del producto
 */
function generateProductSlug(productName) {
  return productName
    .trim()
    .split(/\s+/)
    .join('-')
    .replace(/[^\w\-]/g, '')
    .replace(/--+/g, '-')
    .toLowerCase();
}

/**
 * Genera la URL amigable completa para un producto
 */
function getProductUrl(productName, category, productCode) {
  const categorySlug = getCategorySlug(category);
  const productSlug = generateProductSlug(productName);
  return `/producto/${categorySlug}/${productSlug}`;
}

async function fetchProductsFromSupabase() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('⚠️  No hay credenciales de Supabase. Para incluir productos en el sitemap:');
    console.log('   Configura: SUPABASE_URL y SUPABASE_SERVICE_KEY');
    return [];
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { 
      global: { headers: {} }
    });

    console.log('📡 Consultando productos de Supabase...');
    const { data, error } = await supabase
      .from('products')
      .select('product_code, nombre_producto, categoria')
      .gt('cantidad_stock', 0)
      .or('is_discontinued.is.null,is_discontinued.eq.false')
      .order('nombre_producto');

    if (error) {
      console.error('❌ Error consultando productos:', error.message || error);
      return [];
    }

    const products = (data || []).filter(r => r.product_code && r.nombre_producto && r.categoria);
    console.log(`✅ ${products.length} productos encontrados`);
    return products;
  } catch (err) {
    console.error('❌ Error al inicializar Supabase:', err.message || err);
    return [];
  }
}

function buildStaticRoutes() {
  return [
    { path: '/', priority: '1.0' },
    { path: '/catalogo', priority: '0.9' },
    { path: '/blog', priority: '0.8' },
    { path: '/preguntas-frecuentes', priority: '0.8' },
    { path: '/hacer-pedido-wa', priority: '0.7' },
    { path: '/invitar', priority: '0.6' },
    { path: '/piel-sensible', priority: '0.8' },
    { path: '/seguimiento', priority: '0.7' },
    { path: '/trabajo-de-pie', priority: '0.8' },
    { path: '/medias-para-varices', priority: '0.8' },
    { path: '/auth', priority: '0.6' }
  ];
}

function sitemapXml(urlEntries) {
  const urls = urlEntries.map(({ loc, lastmod, changefreq, priority }) => {
    return [
      '  <url>',
      `    <loc>${loc}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : '',
      changefreq ? `    <changefreq>${changefreq}</changefreq>` : '',
      typeof priority !== 'undefined' ? `    <priority>${priority}</priority>` : '',
      '  </url>',
    ]
      .filter(Boolean)
      .join('\n');
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
}

async function main() {
  console.log('🔧 Generando sitemap.xml...\n');
  
  // Crear directorio si no existe
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  const staticRoutes = buildStaticRoutes();
  const products = await fetchProductsFromSupabase();
  const now = new Date().toISOString();

  const entries = [];

  // Agregar rutas estáticas
  console.log('📌 Agregando rutas estáticas...');
  for (const { path, priority } of staticRoutes) {
    entries.push({
      loc: `${BASE_URL}${path === '/' ? '' : path}`,
      lastmod: now,
      changefreq: 'weekly',
      priority
    });
  }

  // Agregar productos con URLs amigables
  if (products.length > 0) {
    console.log(`📦 Agregando ${products.length} productos...\n`);
    for (const product of products) {
      const url = getProductUrl(product.nombre_producto, product.categoria, product.product_code);
      entries.push({
        loc: `${BASE_URL}${url}`,
        lastmod: now,
        changefreq: 'weekly',
        priority: '0.7'
      });
    }
  }

  const xml = sitemapXml(entries);
  fs.writeFileSync(OUT_FILE, xml, 'utf8');
  
  console.log(`✨ Sitemap generado exitosamente!`);
  console.log(`📄 Archivo: ${OUT_FILE}`);
  console.log(`📊 Total de URLs: ${entries.length}`);
  console.log(`   - Estáticas: ${staticRoutes.length}`);
  console.log(`   - Productos: ${products.length}`);
}

main().catch((err) => {
  console.error('❌ Error generando sitemap:', err);
  process.exit(1);
});
