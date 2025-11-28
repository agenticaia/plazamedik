# Sugerencias de configuración de seguridad y deployment

## 🔐 .gitignore - Líneas a agregar

```gitignore
# Environment variables - NUNCA comitear credenciales reales
.env
.env.local
.env.*.local

# Sitemap compilado (opcional, regenerar en cada build)
# public/sitemap.xml

# Logs
*.log
npm-debug.log
```

**Importante**: El archivo `.env.example` NUNCA debe contener credenciales reales.

---

## 🚀 GitHub Actions Workflow

Crear `.github/workflows/deploy.yml`:

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Generate Sitemap
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          SITEMAP_BASE_URL: https://plazamedik.net.pe
        run: npm run generate-sitemap

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Secrets a configurar en GitHub:
1. `SUPABASE_URL` - URL del proyecto Supabase
2. `SUPABASE_SERVICE_KEY` - Service Role Key (cuidado: no es la publishable key)
3. `VERCEL_TOKEN` - Token de Vercel
4. `VERCEL_ORG_ID` - ID de organización en Vercel
5. `VERCEL_PROJECT_ID` - ID del proyecto en Vercel

---

## 📦 Vercel Configuration

Si usas Vercel, en Project Settings > Environment Variables:

```
SUPABASE_URL = https://lqeevfvrtifsidfghtwz.supabase.co
SUPABASE_SERVICE_KEY = eyJhbGciOi...
SITEMAP_BASE_URL = https://plazamedik.net.pe
```

Asegúrate de marcar "Encrypt" para variables sensibles.

### Actualizar build command:
```
npm run generate-sitemap && npm run build
```

---

## 🔑 Cómo obtener Service Role Key

1. Ir a Supabase → Tu Proyecto
2. Settings → API → JWT Secret / Service Role (o similar)
3. Copiar el token (es diferente de la Publishable Key)

**⚠️ Nunca compartir esta clave en público**

---

## ✅ Checklist Pre-Producción

- [ ] Verificar que sitemap.xml se genera correctamente
- [ ] Probar URLs amigables localmente: `npm run dev`
- [ ] Validar que URLs antiguas siguen funcionando
- [ ] Configurar secrets en GitHub/Vercel
- [ ] Ejecutar `npm run build` y verificar que sitemap se genera
- [ ] Subir `sitemap.xml` a Google Search Console
- [ ] Verificar indexación en Google
- [ ] Monitorear tráfico orgánico

---

## 🧪 Test Local

```bash
# Clonar el proyecto
git clone <repo>
cd plazamedik

# Instalar dependencias
npm install

# Generar sitemap (solo rutas estáticas)
npm run generate-sitemap

# Ver resultado
cat public/sitemap.xml

# Generar sitemap con ejemplo
npm run generate-sitemap:example
cat public/sitemap.example.xml

# Desarrollar
npm run dev

# Navegar a una URL de producto amigable
# http://localhost:5173/producto/medias-para-varices/media-compresiva-hasta-muslo-22-27-mmhg
```

---

## 📊 Monitoreo

### Google Search Console
1. Agregar propiedad (https://plazamedik.net.pe)
2. Sitemaps → Agregar nuevo → `/sitemap.xml`
3. Monitorear "Cobertura"

### Google Analytics
1. Ir a Analytics → Reporting → Organic Search
2. Filtrar por "landing page" que contenga `/producto/`
3. Comparar CTR y posición antes/después

---

## 🚨 Troubleshooting

### Sitemap no se genera
```bash
# Verificar que el script existe
ls -la scripts/generate-sitemap.mjs

# Verificar sintaxis
node -c scripts/generate-sitemap.mjs

# Ejecutar directamente
node scripts/generate-sitemap.mjs
```

### Productos no aparecen en sitemap
```bash
# Verificar credenciales
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_KEY

# Probar conexión con curl
curl -X GET "https://lqeevfvrtifsidfghtwz.supabase.co/rest/v1/products?select=product_code&limit=1" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json"
```

---

## 📞 Soporte

Para más detalles, consultar:
- `SEO_IMPLEMENTATION.md`
- `SITEMAP_SETUP.md`
- `QUICKSTART_SEO.md`
