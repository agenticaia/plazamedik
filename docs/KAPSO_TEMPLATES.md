# Templates de WhatsApp para Kapso.ai

## 📋 Instrucciones de Configuración

Para usar estos templates, debes:

1. **Ir a Meta Business Manager** → WhatsApp → Message Templates
2. **Crear cada template** con el nombre exacto indicado
3. **Esperar aprobación** de Meta (24-48 horas)
4. **Configurar variables** en Kapso.ai

---

## 🎯 Templates Requeridos

### 1. **order_confirmation** - Confirmación de Pedido

**Nombre del Template:** `order_confirmation`  
**Categoría:** UTILITY  
**Idioma:** Español (es)

**Header:** Ninguno

**Body:**
```
¡Hola {{1}}! 👋

Recibimos tu pedido: *{{2}}*

📦 *RESUMEN DE TU PEDIDO*
Total a pagar: {{3}}

📍 *DIRECCIÓN DE ENTREGA*
{{4}}

⏱️ *TIEMPO DE ENTREGA*
24-48 horas en tu domicilio

💳 *FORMA DE PAGO*
Pago contra entrega (efectivo o POS)

👉 *CONFIRMA TU PEDIDO* respondiendo este mensaje para proceder con la entrega.

¡Gracias por confiar en PlazaMedik! 🏥
```

**Footer:** PlazaMedik - Medias de Compresión

**Buttons:**
- Quick Reply: "✅ Confirmar Pedido"
- Quick Reply: "❌ Cancelar"
- Quick Reply: "📞 Hablar con Asesor"

**Variables:**
1. `{{1}}` - Nombre del cliente
2. `{{2}}` - Código de pedido
3. `{{3}}` - Total (formato moneda)
4. `{{4}}` - Dirección completa

---

### 2. **payment_reminder** - Recordatorio de Pago

**Nombre del Template:** `payment_reminder`  
**Categoría:** UTILITY  
**Idioma:** Español (es)

**Header:** Ninguno

**Body:**
```
Hola {{1}}, 👋

Te recordamos que tu pedido *{{2}}* está pendiente de pago.

💰 *MONTO TOTAL:* {{3}}

Puedes pagar de las siguientes formas:
• 💵 Efectivo contra entrega
• 📱 Yape / Plin
• 💳 Transferencia bancaria

Para confirmar tu pedido y coordinar la entrega, responde este mensaje.

¿Necesitas ayuda? Estamos aquí para ti 😊
```

**Footer:** PlazaMedik

**Buttons:**
- URL: "Ver Mi Pedido" → `https://plazamedik.net.pe/seguimiento?codigo={{1}}`
- Quick Reply: "Ya Pagué"
- Quick Reply: "Necesito Ayuda"

**Variables:**
1. `{{1}}` - Nombre del cliente
2. `{{2}}` - Código de pedido
3. `{{3}}` - Total (formato moneda)

---

### 3. **delivery_on_way** - Pedido en Camino

**Nombre del Template:** `delivery_on_way`  
**Categoría:** UTILITY  
**Idioma:** Español (es)

**Header:** Ninguno

**Body:**
```
¡Buenas noticias {{1}}! 🚚

Tu pedido *{{2}}* está en camino.

📦 Llegará hoy entre las 9am - 5pm
📍 Asegúrate de estar en la dirección registrada

💡 *TIPS PARA LA ENTREGA:*
• Ten el monto exacto listo (si pagas en efectivo)
• Verifica el producto antes de firmar
• Guarda tu comprobante

¿Alguna duda? Responde este mensaje.
```

**Footer:** PlazaMedik

**Buttons:**
- Quick Reply: "¿Dónde está mi pedido?"
- Quick Reply: "Cambiar dirección"

**Variables:**
1. `{{1}}` - Nombre del cliente
2. `{{2}}` - Código de pedido

---

### 4. **special_promotion** - Promoción Especial

**Nombre del Template:** `special_promotion`  
**Categoría:** MARKETING  
**Idioma:** Español (es)

**Header:** 
- Tipo: IMAGE
- URL: `https://plazamedik.net.pe/images/promo-banner.jpg`

**Body:**
```
¡Hola {{1}}! 🎉

Tenemos una *OFERTA EXCLUSIVA* para ti:

🎁 *{{2}} DE DESCUENTO*
Código: *{{3}}*

✨ Válido hasta: {{4}}

Aplica en todas nuestras medias de compresión. ¡No dejes pasar esta oportunidad!

Usa tu código al hacer tu pedido.
```

**Footer:** PlazaMedik - Ofertas Exclusivas

**Buttons:**
- URL: "Ver Productos" → `https://plazamedik.net.pe/productos`
- Quick Reply: "Usar Ahora"

**Variables:**
1. `{{1}}` - Nombre del cliente
2. `{{2}}` - Porcentaje de descuento (ej: "20%")
3. `{{3}}` - Código de descuento
4. `{{4}}` - Fecha de vencimiento

---

### 5. **abandoned_cart** - Carrito Abandonado

**Nombre del Template:** `abandoned_cart`  
**Categoría:** MARKETING  
**Idioma:** Español (es)

**Header:** Ninguno

**Body:**
```
Hola {{1}}, 👋

Notamos que dejaste productos en tu carrito:

🛒 {{2}}

¿Necesitas ayuda para completar tu compra?

💡 *BENEFICIOS DE COMPRAR HOY:*
• ✅ Envío en 24-48 horas
• ✅ Pago contra entrega
• ✅ Asesoría gratuita de tallas

Responde este mensaje y te ayudamos a finalizar tu pedido.
```

**Footer:** PlazaMedik

**Buttons:**
- URL: "Completar Compra" → `https://plazamedik.net.pe/carrito`
- Quick Reply: "Necesito Ayuda"
- Quick Reply: "No me interesa"

**Variables:**
1. `{{1}}` - Nombre del cliente
2. `{{2}}` - Productos en carrito

---

### 6. **customer_feedback** - Solicitud de Feedback

**Nombre del Template:** `customer_feedback`  
**Categoría:** UTILITY  
**Idioma:** Español (es)

**Header:** Ninguno

**Body:**
```
Hola {{1}}, 😊

Esperamos que estés disfrutando de tu compra.

¿Nos ayudarías con tu opinión?

Tu feedback nos ayuda a mejorar y servir mejor a nuestros clientes.

¡Solo tomará 1 minuto! 🙏
```

**Footer:** PlazaMedik

**Buttons:**
- URL: "Dejar Reseña" → `https://plazamedik.net.pe/resenas`
- Quick Reply: "⭐⭐⭐⭐⭐ Excelente"
- Quick Reply: "⭐⭐⭐⭐ Muy Bueno"
- Quick Reply: "⭐⭐⭐ Bueno"

**Variables:**
1. `{{1}}` - Nombre del cliente

---

### 7. **restock_notification** - Producto Disponible

**Nombre del Template:** `restock_notification`  
**Categoría:** UTILITY  
**Idioma:** Español (es)

**Header:** Ninguno

**Body:**
```
¡Buenas noticias {{1}}! 🎉

El producto que buscabas ya está disponible:

📦 *{{2}}*
💰 Precio: {{3}}

¡Aprovecha antes de que se agote nuevamente!

¿Quieres hacer tu pedido ahora?
```

**Footer:** PlazaMedik

**Buttons:**
- URL: "Ver Producto" → `https://plazamedik.net.pe/productos/{{1}}`
- Quick Reply: "Hacer Pedido"
- Quick Reply: "Más Información"

**Variables:**
1. `{{1}}` - Nombre del cliente
2. `{{2}}` - Nombre del producto
3. `{{3}}` - Precio

---

## 🔧 Configuración en Kapso.ai

### Paso 1: Conectar WhatsApp Business

1. Ve a [Kapso.ai Dashboard](https://app.kapso.ai)
2. Conecta tu cuenta de WhatsApp Business
3. Verifica tu número de teléfono
4. Obtén tu **API Key** y **Phone Number ID**

### Paso 2: Importar Templates

1. En Kapso → Templates
2. Sincronizar con Meta Business Manager
3. Verificar que todos los templates estén aprobados

### Paso 3: Configurar Variables de Entorno

Agrega en tu archivo `.env`:

```env
VITE_KAPSO_API_KEY=tu_api_key_aqui
VITE_KAPSO_PHONE_NUMBER_ID=tu_phone_number_id
VITE_KAPSO_BUSINESS_ACCOUNT_ID=tu_business_account_id
```

---

## 📊 Mejores Prácticas

### ✅ DO's

- **Personaliza siempre** con el nombre del cliente
- **Usa emojis** para hacer mensajes más amigables
- **Incluye CTAs claros** (Call To Action)
- **Respeta horarios** (9am - 8pm)
- **Segmenta tu audiencia** para mensajes relevantes

### ❌ DON'Ts

- **No envíes spam** - Máximo 1 mensaje promocional por semana
- **No uses MAYÚSCULAS** excesivamente
- **No envíes a números no verificados**
- **No ignores las respuestas** - Responde en menos de 1 hora
- **No uses lenguaje agresivo** en ventas

---

## 🎯 Estrategias de Uso

### Flujo de Pedido Completo

1. **Cliente hace pedido** → Enviar `order_confirmation`
2. **24 horas después sin pago** → Enviar `payment_reminder`
3. **Pedido confirmado** → Enviar `delivery_on_way`
4. **3 días después de entrega** → Enviar `customer_feedback`

### Campañas de Marketing

- **Lunes:** Promociones especiales (`special_promotion`)
- **Miércoles:** Recordatorio de carritos abandonados (`abandoned_cart`)
- **Viernes:** Nuevos productos / Restock (`restock_notification`)

### Segmentación Recomendada

- **Clientes nuevos:** Bienvenida + Descuento primera compra
- **Clientes recurrentes:** Ofertas exclusivas + Early access
- **Clientes inactivos (>60 días):** Campaña de reactivación
- **Carritos abandonados:** Recordatorio + Incentivo

---

## 📞 Soporte

Para problemas con templates o Kapso.ai:
- **Documentación Kapso:** https://docs.kapso.ai
- **Soporte Meta:** https://business.facebook.com/support
- **Email:** soporte@plazamedik.net.pe

---

## 📈 Métricas a Monitorear

- **Tasa de Entrega:** >95%
- **Tasa de Lectura:** >80%
- **Tasa de Respuesta:** >30%
- **Tasa de Conversión:** >10%
- **Tiempo de Respuesta:** <1 hora

¡Usa estos templates para automatizar y profesionalizar tu comunicación por WhatsApp! 🚀
