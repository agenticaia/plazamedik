# 🚀 Guía de Activación: Kapso.ai & WhatsApp CRM

Has implementado exitosamente el sistema avanzado de CRM para WhatsApp. Sigue estos pasos para activarlo.

## 1. Base de Datos (Requerido)

Necesitas crear las tablas en Supabase.

1. Ve a tu Dashboard de Supabase → SQL Editor
2. Copia el contenido del archivo:
   `supabase/migrations/20241130_campanas_whatsapp.sql`
3. Ejecuta el script.

## 2. Configuración de Entorno

Edita tu archivo `.env` con tus credenciales de Kapso.ai:

```env
VITE_KAPSO_API_KEY=tu_api_key_aqui
VITE_KAPSO_PHONE_NUMBER_ID=tu_phone_number_id
VITE_KAPSO_BUSINESS_ACCOUNT_ID=tu_business_account_id
```

> Si no tienes cuenta, regístrate en [kapso.ai](https://kapso.ai)

## 3. Aprobar Templates en Meta

Para enviar mensajes automáticos, Meta requiere aprobar los templates.

1. Revisa el archivo `docs/KAPSO_TEMPLATES.md`
2. Copia cada template y créalo en Meta Business Manager
3. Espera la aprobación (usualmente < 24h)

## 4. Activar Registro de Mensajes

Una vez ejecutada la migración SQL:

1. Abre `src/services/whatsappService.ts`
2. Busca la función `registrarMensajeEnviado` (al final del archivo)
3. Descomenta el bloque de código que guarda en Supabase:

```typescript
// ANTES:
// await supabase.from('mensajes_whatsapp').insert({...});

// DESPUÉS:
await supabase.from('mensajes_whatsapp').insert({
  ...data,
  enviado_at: new Date().toISOString(),
});
```

## 5. ¡Listo! 🎉

Ahora puedes:
- Ver el nuevo menú **"Campañas WhatsApp"** en el admin
- Crear campañas segmentadas por distrito o monto de compra
- Los pedidos enviarán confirmaciones automáticas si configuras las API Keys
