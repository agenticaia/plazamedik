# Integración de Pedidos desde WhatsApp

## 📱 Descripción

Este sistema permite que los clientes hagan pedidos directamente desde WhatsApp mediante enlaces especiales que auto-completan el formulario de pedido.

## 🔗 Formato del Enlace

El enlace debe seguir este formato:

```
https://plazamedik.net.pe/hacer-pedido-wa?producto=CODIGO&nombre_producto=NOMBRE&precio=PRECIO&nombre=NOMBRE&apellido=APELLIDO&telefono=TELEFONO&distrito=DISTRITO&color=COLOR
```

## 📋 Parámetros

### Requeridos:
- **producto**: Código del producto (ej: `750`, `880`, `950a`)
- **nombre_producto**: Nombre completo del producto (usar %20 para espacios)
- **precio**: Precio del producto en soles (ej: `200`, `150.50`)

### Opcionales (se pueden llenar después en el formulario):
- **nombre**: Nombre del cliente
- **apellido**: Apellido del cliente
- **telefono**: Teléfono/WhatsApp del cliente
- **distrito**: Distrito de entrega (Lima)
- **color**: Color del producto (por defecto: "Piel")

## 📝 Ejemplos de Enlaces

### Ejemplo 1: Con todos los datos
```
https://plazamedic.com/hacer-pedido-wa?producto=750&nombre_producto=Media%20Compresiva%20Punta%20Abierta%2018-22%20mmHg&precio=200&nombre=Juan&apellido=Perez&telefono=987654321&distrito=Miraflores&color=Piel
```

### Ejemplo 2: Solo datos del producto (cliente llena el resto)
```
https://plazamedic.com/hacer-pedido-wa?producto=750&nombre_producto=Media%20Compresiva%20Punta%20Abierta&precio=200
```

### Ejemplo 3: Datos del producto + nombre del cliente
```
https://plazamedic.com/hacer-pedido-wa?producto=880&nombre_producto=Media%20Antiembolica&precio=180&nombre=Maria&apellido=Garcia
```

## 🚀 Cómo Usarlo en WhatsApp

### Opción 1: Mensaje Directo con Enlace
Envía un mensaje al cliente con el enlace:

```
¡Hola! 👋

Gracias por tu interés en nuestras medias compresivas.

Para hacer tu pedido de forma rápida y segura, haz clic en este enlace:
https://plazamedic.com/hacer-pedido-wa?producto=750&nombre_producto=Media%20Compresiva&precio=200

✅ Pago contra entrega
🚚 Envío en 24-48 horas
📦 Garantía de calidad
```

### Opción 2: Respuesta Rápida Guardada
Crea respuestas rápidas en WhatsApp Business con enlaces pre-configurados para cada producto:

**Ejemplo de respuesta rápida para Media 750:**
```
/media750
```

**Contenido:**
```
Media Compresiva Punta Abierta 18-22 mmHg

💰 Precio: S/ 200.00
📦 Hace tu pedido aquí: https://plazamedic.com/hacer-pedido-wa?producto=750&nombre_producto=Media%20Compresiva%20Punta%20Abierta&precio=200

Pago contra entrega en Lima 🏠
```

### Opción 3: Catálogo de WhatsApp Business
Si usas el catálogo de productos de WhatsApp Business, puedes agregar el enlace en la descripción de cada producto.

## 🎯 Flujo del Cliente

1. **Cliente hace clic en el enlace** desde WhatsApp
2. Se abre la página `/hacer-pedido-wa` con datos pre-llenados
3. El cliente ve:
   - Información del producto
   - Condiciones de pago contra entrega
   - Formulario (pre-llenado si incluiste datos)
4. **Cliente completa datos faltantes** (si los hay)
5. **Confirma el pedido**
6. Recibe código de seguimiento
7. **Puede enviar confirmación directo a WhatsApp**

## 📊 Seguimiento de Pedidos

Todos los pedidos creados desde WhatsApp:
- Se registran automáticamente en `/admin/pedidos`
- Tienen `source: 'whatsapp'` para identificación
- Siguen el mismo flujo de gestión que pedidos web
- Se pueden rastrear con el código de seguimiento

## 🔧 Codificación de Caracteres

Para nombres de productos con espacios o caracteres especiales:

```javascript
// En JavaScript:
const enlace = `https://plazamedic.com/hacer-pedido-wa?producto=750&nombre_producto=${encodeURIComponent("Media Compresiva Punta Abierta 18-22 mmHg")}&precio=200`;

// Resultado:
// https://plazamedic.com/hacer-pedido-wa?producto=750&nombre_producto=Media%20Compresiva%20Punta%20Abierta%2018-22%20mmHg&precio=200
```

### Tabla de Codificación Común:
- Espacio → `%20`
- `/` → `%2F`
- `ñ` → `%C3%B1`
- `á` → `%C3%A1`
- `é` → `%C3%A9`
- `í` → `%C3%AD`
- `ó` → `%C3%B3`
- `ú` → `%C3%BA`

## 💡 Tips y Mejores Prácticas

1. **Usa UTM params** para tracking (opcional):
   ```
   &utm_source=whatsapp&utm_medium=direct&utm_campaign=spring_sale
   ```

2. **Acorta los enlaces** con bit.ly o similar para mejor apariencia en WhatsApp

3. **Crea plantillas por categoría** de producto para responder rápido

4. **Personaliza el mensaje** según el contexto de la conversación

5. **Incluye nombre del cliente** si ya lo conoces para mejor experiencia

## 🛠️ Generador de Enlaces Automático (Opcional)

Puedes crear una herramienta interna para tu equipo que genere estos enlaces:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Generador de Enlaces WhatsApp</title>
</head>
<body>
    <h2>Generador de Enlaces para Pedidos WhatsApp</h2>
    <form id="linkGenerator">
        <label>Código Producto:</label>
        <input type="text" id="producto" required><br>
        
        <label>Nombre Producto:</label>
        <input type="text" id="nombre_producto" required><br>
        
        <label>Precio:</label>
        <input type="number" id="precio" step="0.01" required><br>
        
        <button type="submit">Generar Enlace</button>
    </form>
    
    <div id="resultado"></div>
    
    <script>
        document.getElementById('linkGenerator').addEventListener('submit', (e) => {
            e.preventDefault();
            const base = 'https://plazamedic.com/hacer-pedido-wa';
            const params = new URLSearchParams({
                producto: document.getElementById('producto').value,
                nombre_producto: document.getElementById('nombre_producto').value,
                precio: document.getElementById('precio').value
            });
            const enlace = `${base}?${params.toString()}`;
            document.getElementById('resultado').innerHTML = `
                <p><strong>Enlace generado:</strong></p>
                <textarea rows="3" style="width:100%">${enlace}</textarea>
                <button onclick="navigator.clipboard.writeText('${enlace}')">Copiar</button>
            `;
        });
    </script>
</body>
</html>
```

## 📞 Soporte

Para cualquier problema o consulta sobre la integración:
- Revisar logs en `/admin/pedidos`
- Verificar que los parámetros estén correctamente codificados
- Asegurarse de que el producto existe en el sistema
