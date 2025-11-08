// ...existing code...
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

// ...existing code...
-const corsHeaders = {
-  'Access-Control-Allow-Origin': '*',
-  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
-};
+// Generar headers CORS de forma restringida según ORIGINS_ALLOW (env) o NEXT_PUBLIC_SITE_URL.
+function getCorsHeaders(origin: string | null) {
+  const allowed = (Deno.env.get('ORIGINS_ALLOW') || Deno.env.get('NEXT_PUBLIC_SITE_URL') || '')
+    .split(',')
+    .map(s => s.trim())
+    .filter(Boolean);
+  const isAllowed = origin && allowed.includes(origin);
+  return {
+    'Access-Control-Allow-Origin': isAllowed ? origin! : 'null',
+    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-function-key',
+  };
+}
+
+// Simple rate limiter por IP (in-memory; mitigación básica).
+const RATE_WINDOW_MS = 60_000;
+const RATE_MAX = 15;
+const rateMap: Map<string, { count: number; windowStart: number }> = new Map();
// ...existing code...
 serve(async (req) => {
   if (req.method === 'OPTIONS') {
-    return new Response(null, { headers: corsHeaders });
+    return new Response(null, { headers: getCorsHeaders(req.headers.get('origin')) });
   }
 
   try {
+    // --- Auth guard: requerir FUNCTION_API_KEY para proteger endpoint público ---
+    const functionKey = Deno.env.get('FUNCTION_API_KEY');
+    if (!functionKey) {
+      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500 });
+    }
+    const authHeader = req.headers.get('authorization') || req.headers.get('x-function-key') || '';
+    const okAuth = authHeader === functionKey || authHeader === `Bearer ${functionKey}`;
+    if (!okAuth) {
+      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: getCorsHeaders(req.headers.get('origin')) });
+    }
+
+    // --- Rate limiting (basic, per client IP header) ---
+    const ip = (req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'anon').split(',')[0].trim();
+    const now = Date.now();
+    const state = rateMap.get(ip) || { count: 0, windowStart: now };
+    if (now - state.windowStart > RATE_WINDOW_MS) {
+      state.count = 0;
+      state.windowStart = now;
+    }
+    state.count += 1;
+    rateMap.set(ip, state);
+    if (state.count > RATE_MAX) {
+      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: getCorsHeaders(req.headers.get('origin')) });
+    }
+
     const {
       customer_name,
       customer_lastname,
       customer_phone,
       customer_district,
       product_code,
       product_name,
       product_color,
       product_price,
     } = await req.json();
 
     // Validar campos requeridos
-    if (!customer_name || !customer_lastname || !customer_phone || !customer_district ||
-        !product_code || !product_name || !product_color || !product_price) {
-      return new Response(
-        JSON.stringify({ error: 'Todos los campos son requeridos' }),
-        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
-      );
-    }
+    if (!customer_name || !customer_lastname || !customer_phone || !customer_district ||
+        !product_code || !product_name || !product_color || product_price === undefined || product_price === null) {
+      return new Response(JSON.stringify({ error: 'Todos los campos son requeridos' }), { status: 400, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } });
+    }
+
+    // Validaciones de tipo / formato
+    const priceNum = Number(product_price);
+    if (Number.isNaN(priceNum) || priceNum < 0) {
+      return new Response(JSON.stringify({ error: 'product_price debe ser un número válido' }), { status: 400, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } });
+    }
+    const phone = String(customer_phone).trim();
+    if (!/^[\d+\-() ]{6,25}$/.test(phone)) {
+      return new Response(JSON.stringify({ error: 'customer_phone formato inválido' }), { status: 400, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } });
+    }
+
     // Crear cliente de Supabase
-    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
-    const supabaseKey = Deno.env.get('MY_SERVICE_ROLE_KEY')!;
-    const supabase = createClient(supabaseUrl, supabaseKey);
+    const supabaseUrl = Deno.env.get('PROJECT_URL');
+    const supabaseKey = Deno.env.get('MY_SERVICE_ROLE_KEY'); // service role key must be server-side only
+    if (!supabaseUrl || !supabaseKey) {
+      return new Response(JSON.stringify({ error: 'Server misconfiguration' }), { status: 500, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } });
+    }
+    const supabase = createClient(supabaseUrl, supabaseKey);
 
     // Generar código de pedido
     const { data: codeData, error: codeError } = await supabase
       .rpc('generate_order_code');
 
     if (codeError) throw codeError;
 
     const order_code = codeData;
 
     // Insertar pedido
     const { data: order, error: orderError } = await supabase
       .from('orders')
       .insert([{
         order_code,
-        customer_name,
-        customer_lastname,
-        customer_phone,
-        customer_district,
-        product_code,
-        product_name,
-        product_color,
-        product_price,
+        customer_name: String(customer_name).slice(0,100),
+        customer_lastname: String(customer_lastname).slice(0,100),
+        customer_phone: phone,
+        customer_district: String(customer_district).slice(0,100),
+        product_code: String(product_code).slice(0,100),
+        product_name: String(product_name).slice(0,200),
+        product_color: String(product_color).slice(0,50),
+        product_price: priceNum,
         status: 'recibido',
       }])
       .select()
       .maybeSingle();
 
     if (orderError) throw orderError;
 
-    console.log('Pedido creado:', order_code);
-
-    return new Response(
-      JSON.stringify({ 
-        success: true, 
-        order_code,
-        order 
-      }),
-      { 
-        status: 200, 
-        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
-      }
-    );
+    // No loguear PII; loguear solo identificador mínimo
+    console.log('Pedido creado:', { order_code });
+
+    // Responder sin PII: exponer sólo campos mínimos necesarios
+    const safeOrder = {
+      order_code,
+      product_code: order?.product_code ?? null,
+      status: order?.status ?? 'recibido',
+      created_at: (order as any)?.created_at ?? null,
+    };
+
+    return new Response(JSON.stringify({ success: true, order: safeOrder }), { status: 200, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } });
 
   } catch (error) {
     console.error('Error al crear pedido:', error);
     return new Response(
-      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
-      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
+      JSON.stringify({ error: error instanceof Error ? error.message : 'Error desconocido' }),
+      { status: 500, headers: { ...getCorsHeaders((globalThis as any).lastOrigin || null), 'Content-Type': 'application/json' } }
     );
   }
 });
 // ...existing code...