#!/usr/bin/env node
/**
 * Script de prueba para demostrar cómo se vería el sitemap.xml con productos
 * 
 * Este archivo muestra un ejemplo de salida con productos ficticios
 * para que puedas visualizar la estructura completa.
 * 
 * Para ver el sitemap real con productos, ejecuta:
 *   SUPABASE_URL=https://lqeevfvrtifsidfghtwz.supabase.co \
 *   SUPABASE_SERVICE_KEY=tu_service_key \
 *   npm run generate-sitemap
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const TEST_FILE = path.join(PUBLIC_DIR, 'sitemap.example.xml');

const BASE_URL = 'https://plazamedik.net.pe';

// Productos de ejemplo (simulados)
const EXAMPLE_PRODUCTS = [
  {
    product_code: '960',
    nombre_producto: 'Media Compresiva Hasta Muslo 22-27 mmHg',
    categoria: 'varices'
  },
  {
    product_code: '961',
    nombre_producto: 'Media Compresiva Pantorrilla 15-21 mmHg',
    categoria: 'varices'
  },
  {
    product_code: '962',
    nombre_producto: 'Panty Compresivo Embarazo 20-30 mmHg',
    categoria: 'varices'
  },
  {
    product_code: '1050',
    nombre_producto: 'Media Trabajo Pie Hombre L',
    categoria: 'trabajo-pie'
  },
  {
    product_code: '1051',
    nombre_producto: 'Calcetín Compresión Trabajo Mujer M',
    categoria: 'trabajo-pie'
  },
  {
    product_code: '1100',
    nombre_producto: 'Media Piel Sensible Hipoalergénica XL',
    categoria: 'piel-sensible'
  },
];

const CATEGORY_SLUG_MAP = {
  'varices': 'medias-para-varices',
  'trabajo-pie': 'trabajo-de-pie',
  'piel-sensible': 'piel-sensible',
};

function getCategorySlug(category) {
  return CATEGORY_SLUG_MAP[category] || category.toLowerCase().replace(/\s+/g, '-');
}

function generateProductSlug(productName) {
  return productName
    .trim()
    .split(/\s+/)
    .join('-')
    .replace(/[^\w\-]/g, '')
    .replace(/--+/g, '-')
    .toLowerCase();
}

function getProductUrl(productName, category) {
  const categorySlug = getCategorySlug(category);
  const productSlug = generateProductSlug(productName);
  return `/producto/${categorySlug}/${productSlug}`;
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
  console.log('📋 Generando sitemap.example.xml con productos ficticios...\n');
  
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  const staticRoutes = buildStaticRoutes();
  const now = new Date().toISOString();

  const entries = [];

  // Static routes
  console.log('📌 Rutas estáticas:');
  for (const { path, priority } of staticRoutes) {
    entries.push({
      loc: `${BASE_URL}${path === '/' ? '' : path}`,
      lastmod: now,
      changefreq: 'weekly',
      priority
    });
    console.log(`   ✓ ${path}`);
  }

  console.log('\n📦 Productos ficticios:');
  for (const product of EXAMPLE_PRODUCTS) {
    const url = getProductUrl(product.nombre_producto, product.categoria);
    entries.push({
      loc: `${BASE_URL}${url}`,
      lastmod: now,
      changefreq: 'weekly',
      priority: '0.7'
    });
    console.log(`   ✓ ${url}`);
  }

  const xml = sitemapXml(entries);
  fs.writeFileSync(TEST_FILE, xml, 'utf8');
  
  console.log(`\n✨ Sitemap de ejemplo generado!`);
  console.log(`📄 Archivo: ${TEST_FILE}`);
  console.log(`📊 Total de URLs: ${entries.length}`);
  console.log(`   - Estáticas: ${staticRoutes.length}`);
  console.log(`   - Productos (ejemplo): ${EXAMPLE_PRODUCTS.length}`);
  console.log(`\nℹ️  Para ver el sitemap real con tus productos de Supabase, ejecuta:`);
  console.log(`   npm run generate-sitemap`);
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
