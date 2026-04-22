

## Mejorar Mi Cuenta: Favoritos, Pedidos WhatsApp y Código de Regalo

Análisis del estado actual de `/mi-cuenta`:

**Lo que ya funciona:**
- Muestra info del cliente, estadísticas (pedidos, gastado, créditos)
- Lista referidos exitosos (pagados) y créditos ganados
- Muestra el código de referido con botón copiar

**Lo que falta o no se muestra correctamente:**
1. **Favoritos** del usuario (tabla `user_favorites`) — no aparecen en Mi Cuenta
2. **Pedidos por WhatsApp** — el flujo `HacerPedidoWA` crea un `sales_order` con `customer_phone`, y el trigger `sync_customer_from_order` vincula por `phone`. Pero `useCurrentCustomer` busca por **email primero** y solo cae a phone si no hay email — un usuario registrado por email cuyo pedido WhatsApp tenía solo phone **no se vincula** y aparece "Completa tu perfil"
3. **Código de regalo** está visible pero falta destacarlo y permitir compartir directo por WhatsApp

---

### 1. Sección "Mis Favoritos" en Mi Cuenta

Nueva tarjeta dentro de `ReferralDashboard.tsx` (o componente nuevo `FavoritesSection.tsx`) entre Estadísticas y Programa de Referidos:

- Trae `user_favorites` filtrados por `user_id`
- Hace JOIN con `products` (por `product_code`) para mostrar imagen, nombre, precio
- Muestra grid responsive 2-3 columnas con tarjetas pequeñas (imagen, nombre, precio, botón "Ver")
- Botón corazón para quitar de favoritos (usa `useFavorites.toggleFavorite`)
- Estado vacío: "Aún no tienes favoritos" + botón "Explorar catálogo"
- Contador en el título: "Mis Favoritos (3)"

### 2. Vinculación robusta de cliente (resuelve pedidos WhatsApp)

Actualizar `useCurrentCustomer.ts` para buscar por email **O** teléfono (no exclusivo):
- Query: `.or("email.eq.{email},phone.eq.{phone}")` cuando ambos están presentes
- Esto vincula al cliente cuando el `sales_order` se creó con phone (caso WhatsApp) aunque el usuario se haya registrado con email

Adicionalmente: cuando el usuario completa registro y existe un `customer` con su mismo phone pero sin email, hacer `UPDATE customers SET email = user.email WHERE phone = user.phone AND email IS NULL` desde `MiCuenta` al cargar (one-time merge). Esto consolida el perfil.

Resultado: los pedidos por WhatsApp aparecerán automáticamente en "Historial de Pedidos" (ya implementado, solo no se cargaban porque el customer no se encontraba).

### 3. Sección "Tu Código de Regalo" mejorada

Rediseñar el bloque del código de referido para que sea **lo primero** que ve el cliente al entrar a Mi Cuenta (después del header):

- Tarjeta destacada con gradiente y icono `Gift`
- Código grande, monospace, fácil de leer
- 3 botones de acción claros:
  - **Copiar código** (ya existe)
  - **Copiar link** (ya existe)
  - **Compartir por WhatsApp** (nuevo) → abre `wa.me/?text={mensaje}` con mensaje preformateado:
    > "¡Hola! Te regalo S/. 15 de descuento en Plaza Medik. Usa mi código `15SO-XXXXXX` o entra a este link: https://plazamedik.com/invite/15SO-XXXXXX"
- Banner de créditos disponibles: "Tienes S/. {credits} en créditos para tu próximo pedido"
- Mini-explicación: "Ganas S/. 15 cuando un amigo usa tu código y paga su pedido"

### 4. Orden visual de la página Mi Cuenta

```text
┌─────────────────────────────────┐
│ Header (avatar, email, logout)  │
├─────────────────────────────────┤
│ 🎁 Tu Código de Regalo          │ ← destacado arriba
│   [Código] [Copiar][Link][WA]   │
│   Créditos: S/. XX              │
├─────────────────────────────────┤
│ Información General             │
├─────────────────────────────────┤
│ [Pedidos] [Gastado] [Créditos]  │
├─────────────────────────────────┤
│ ❤️ Mis Favoritos (N)            │ ← NUEVO
├─────────────────────────────────┤
│ 👥 Referidos Exitosos           │
├─────────────────────────────────┤
│ 📅 Historial de Pedidos         │ ← incluye WhatsApp
└─────────────────────────────────┘
```

---

### Detalles técnicos

**Archivos a modificar:**
- `src/hooks/useCurrentCustomer.ts` — query con `.or()` por email/phone
- `src/pages/MiCuenta.tsx` — agregar lógica de merge email→customer si phone coincide
- `src/components/ReferralDashboard.tsx` — reordenar bloques, agregar botón "Compartir WhatsApp", destacar código
- `src/components/FavoritesSection.tsx` (nuevo) — sección de favoritos con join a products

**Sin cambios de DB:** la tabla `user_favorites` y `sales_orders` ya tienen los datos necesarios. El trigger `sync_customer_from_order` ya vincula por phone; solo falta que el frontend resuelva al cliente correctamente.

**Sin cambios en edge functions:** el flujo de WhatsApp ya escribe en `sales_orders` y el trigger crea/actualiza el `customer`.

