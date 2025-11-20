import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, categoria, currentDescription } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const prompt = `Eres un experto en redacción de contenido para productos médicos y de salud, especialmente medias de compresión y productos ortopédicos.

Producto: ${productName}
Categoría: ${categoria}
${currentDescription ? `Descripción actual: ${currentDescription}` : ''}

Genera contenido profesional y atractivo en español para este producto. Devuelve un JSON con:
1. descripcion_corta: Una descripción breve y atractiva (máx 200 caracteres)
2. ideal_para: Descripción detallada del perfil de usuario ideal (máx 300 caracteres)
3. beneficios: Array de 4-6 beneficios clave (cada uno máx 100 caracteres)
4. especificaciones: Array de 4-6 especificaciones técnicas relevantes (cada uno máx 100 caracteres)

Asegúrate de que el contenido sea:
- Profesional y confiable
- Enfocado en beneficios para el usuario
- Claro y fácil de entender
- Específico para el tipo de producto y categoría`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Eres un experto en redacción de contenido para productos médicos. Siempre respondes en formato JSON válido." },
          { role: "user", content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_product_content",
              description: "Genera contenido optimizado para un producto",
              parameters: {
                type: "object",
                properties: {
                  descripcion_corta: { type: "string" },
                  ideal_para: { type: "string" },
                  beneficios: {
                    type: "array",
                    items: { type: "string" }
                  },
                  especificaciones: {
                    type: "array",
                    items: { type: "string" }
                  }
                },
                required: ["descripcion_corta", "ideal_para", "beneficios", "especificaciones"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_product_content" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Por favor, intenta más tarde." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Se requiere agregar fondos a tu cuenta de Lovable AI." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Error al generar contenido" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error("No se recibió respuesta de la IA");
    }

    const generatedContent = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify(generatedContent),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-product-content function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
