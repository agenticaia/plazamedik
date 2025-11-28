# ✅ SOLUCIÓN: Error InvalidClientId

## 🔴 El Problema

```
Google Maps JavaScript API warning: InvalidClientId
https://developers.google.com/maps/documentation/javascript/error-messages#invalid-client-id
```

**Causa**: Tu Client ID OAuth solo tiene `https://plazamedik.net.pe` autorizado, pero estás usando `http://localhost:8084`

---

## ✅ LA SOLUCIÓN (3 pasos simples)

### **Paso 1: Ve a Google Cloud Console**

Abre: https://console.cloud.google.com/apis/credentials

### **Paso 2: Edita tu Client ID**

1. En la lista de credenciales, busca y haz clic en: **`770417152946-ut2ofal8q36advnsqfa9qkvbqh9apoqf.apps.googleusercontent.com`**

2. Se abrirá una página de edición

### **Paso 3: Agrega los dominios de desarrollo**

Busca la sección **"Orígenes de JavaScript autorizados"** (JavaScript origins)

Verás que probablemente solo tiene:
```
https://plazamedik.net.pe
```

**Haz clic en "Agregar un elemento"** (Add an item / + Add URI) y agrega CADA UNO de estos:

```
http://localhost
http://localhost:5173
http://localhost:8080
http://localhost:8084
```

**Resultado final** (debería verse así):
```
https://plazamedik.net.pe
http://localhost
http://localhost:5173
http://localhost:8080
http://localhost:8084
```

### **Paso 4: Guarda**

Haz clic en el botón **"GUARDAR"** (SAVE) en la parte inferior

---

## ⏱️ Espera 5-10 minutos

Google tarda en propagar los cambios en sus servidores.

---

## 🧪 Prueba de Nuevo

1. **Espera 5-10 minutos**
2. **Recarga la página en el navegador** (Ctrl+R o Cmd+R)
3. Abre la consola (F12 → Console)
4. **El error `InvalidClientId` debería desaparecer**
5. El autocomplete de direcciones debería funcionar

---

## 📋 Resumen Visual

| Antes | Después |
|-------|---------|
| ❌ Solo: `https://plazamedik.net.pe` | ✅ Incluye: `http://localhost:8084` |
| ❌ Error: InvalidClientId | ✅ Sin errores |
| ❌ Autocomplete no funciona | ✅ Autocomplete funciona |

---

## 🆘 Si Sigue Sin Funcionar

Después de esperar 10 minutos:

1. **Recarga la página varias veces** (a veces la caché del navegador interfiere)
2. **Limpia el caché** del navegador (Ctrl+Shift+Delete)
3. Abre la consola nuevamente
4. **Copia y comparte** cualquier error que veas en rojo

---

## ✨ Cuando Funcione

Deberías ver en la consola:

```
✅ Autocomplete creado exitosamente
✅ place_changed event disparado
✅ Dirección obtenida: { address: "...", lat: ..., lng: ... }
```

Sin advertencias en amarillo/rojo. ✅
