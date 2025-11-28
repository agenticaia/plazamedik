# Configuración de Google Maps OAuth Client

## ✅ Client ID Configurado

Tu Client ID OAuth está configurado en `.env`:
```
VITE_GOOGLE_MAPS_CLIENT_ID=770417152946-ut2ofal8q36advnsqfa9qkvbqh9apoqf.apps.googleusercontent.com
```

## ⚠️ IMPORTANTE: Agregar Dominios de Desarrollo

Tu configuración actual tiene solo `https://plazamedik.net.pe` como origen JavaScript.

Para desarrollo local, necesitas agregar estos dominios en Google Cloud Console:

### Pasos:

1. Ve a https://console.cloud.google.com
2. Selecciona el proyecto: **plazamedik**
3. Ve a **APIs y servicios** → **Credenciales**
4. Busca tu OAuth Client ID: `770417152946-ut2ofal8q36advnsqfa9qkvbqh9apoqf`
5. Haz clic para editar
6. En **"Orígenes de JavaScript autorizados"**, agrega:
   ```
   http://localhost
   http://localhost:5173
   http://localhost:8080
   http://localhost:8084
   ```
7. En **"URIs de redirección autorizados"**, agrega:
   ```
   http://localhost:5173
   http://localhost:8080
   http://localhost:8084
   https://plazamedik.net.pe
   ```
8. Haz clic en **"Guardar"**

## 🧪 Probar Localmente

```bash
npm run dev
```

Luego accede a: http://localhost:8084/producto/medias-para-varices/media-compresiva-hasta-muslo-22-27-mmhg

## 📝 Resumen de Configuración

| Parámetro | Valor |
|-----------|-------|
| **Project ID** | plazamedik |
| **Client ID** | 770417152946-ut2ofal8q36advnsqfa9qkvbqh9apoqf.apps.googleusercontent.com |
| **API Habilitadas** | Maps JavaScript, Places, Geocoding |
| **Dominio Producción** | https://plazamedik.net.pe |
| **Dominio Desarrollo** | http://localhost:8084 (agregar manualmente) |

## ✨ Una vez actualizado, el formulario de pedidos debería:

- ✅ Cargar Google Maps sin errores
- ✅ Mostrar autocomplete al escribir dirección
- ✅ Obtener coordenadas GPS precisas
- ✅ Permitir completar pedidos sin bloqueos
