# Configuración de Google Maps OAuth Client

## ✅ Client ID Configurado

Tu Client ID OAuth está configurado en `.env`:
```
VITE_GOOGLE_MAPS_CLIENT_ID=770417152946-ut2ofal8q36advnsqfa9qkvbqh9apoqf.apps.googleusercontent.com
```

---

## 🔍 DIAGNÓSTICO: Si no funciona el autocomplete

### Paso 1: Abre la Consola del Navegador

1. Abre la página del formulario en `http://localhost:8084`
2. Presiona **F12** (o clic derecho → "Inspeccionar")
3. Ve a la pestaña **"Console"** (Consola)
4. Escribe en el campo "Dirección"
5. **Busca mensajes en rojo** - esos son los errores

### Paso 2: Interpreta los Errores

| Error en Consola | Significado | Solución |
|------------------|------------|----------|
| `ApiNotActivatedMapError` | Places API no está habilitada | Ve a Google Cloud → APIs → Habilitar "Places API" |
| `BillingNotEnabledMapError` | Falta configurar facturación | Ve a Google Cloud → Facturación → Agregar tarjeta de crédito |
| `RefererNotAllowedMapError` | El dominio no tiene permiso | Agrega `http://localhost:8084` a la whitelist |
| `InvalidClientIdMapError` | Client ID incorrecto | Copia el Client ID correcto desde Google Cloud |
| **Nada en consola** | Script no carga | Revisa que `libraries=places` esté en la URL |

### Paso 3: Busca los Logs de Diagnóstico

En la consola, verás mensajes como estos (busca los que digan ❌ o ⚠️):

```
🔍 AddressSearch - Inicializando...
📍 Client ID disponible: true/false
🔑 API Key disponible: true/false
📥 Cargando script de Google Maps...
✅ Script de Google Maps cargado
🔔 Callback initGoogleMaps ejecutado
🚀 Creando Autocomplete instance...
✅ Autocomplete creado exitosamente
```

---

## ⚙️ Checklist de Configuración en Google Cloud

- [ ] **Places API Habilitada**
  - https://console.cloud.google.com → APIs → Biblioteca → "Places API" → HABILITAR

- [ ] **Facturación Activa**
  - https://console.cloud.google.com → Facturación → Agregar cuenta de facturación → Tarjeta de crédito

- [ ] **Client ID OAuth Configurado**
  - https://console.cloud.google.com → APIs y servicios → Credenciales
  - Crear: OAuth Client ID → Aplicación web
  - Nombre: `Web Client - Plaza Medik`

- [ ] **Dominios de Desarrollo Agregados**
  - En el Client ID, editar y agregar en "Orígenes de JavaScript autorizados":
    ```
    http://localhost
    http://localhost:5173
    http://localhost:8080
    http://localhost:8084
    ```
  - En "URIs de redirección autorizados":
    ```
    http://localhost:5173
    http://localhost:8080
    http://localhost:8084
    https://plazamedik.net.pe
    ```
  - **Guardar**

- [ ] **Esperar 5-10 minutos**
  - Google tarda en propagar los cambios

---

## 🧪 Probar Localmente

```bash
# Terminal 1: Levantar dev server
npm run dev

# Luego abre en navegador:
# http://localhost:8084/producto/medias-para-varices/media-compresiva-hasta-muslo-22-27-mmhg
```

### En el Navegador:

1. Abre **Developer Tools** (F12)
2. Ve a **Console**
3. Recarga la página (Ctrl+R)
4. Busca los mensajes de diagnóstico (los que empiezan con emojis 🔍, 📍, ✅, ❌)
5. **Copia y comparte** cualquier mensaje en rojo

---

## 📋 Información de tu Cliente OAuth

```json
{
  "web": {
    "client_id": "770417152946-ut2ofal8q36advnsqfa9qkvbqh9apoqf.apps.googleusercontent.com",
    "project_id": "plazamedik",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "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",
    "javascript_origins": ["https://plazamedik.net.pe"]
  }
}
```

⚠️ **IMPORTANTE**: Agrega `http://localhost:8084` a `javascript_origins` para desarrollo local.

---

## 🆘 Si Aún No Funciona

1. **Abre la consola** (F12 → Console)
2. **Copia todos los mensajes de error** (especialmente los en rojo)
3. **Comparte esos mensajes** para que podamos debuggear

Los logs en consola te dirán exactamente qué está fallando. 🎯
