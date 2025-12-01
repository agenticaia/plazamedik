import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Manejar preflight request (CORS)
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { endpoint, method, body } = await req.json()

        // Obtener credenciales de variables de entorno de la Edge Function
        const KAPSO_API_KEY = Deno.env.get('KAPSO_API_KEY')
        const BASE_URL = 'https://api.kapso.ai/v1'

        if (!KAPSO_API_KEY) {
            throw new Error('KAPSO_API_KEY no configurada en Edge Function')
        }

        console.log(`Enviando petición a Kapso: ${method} ${endpoint}`)

        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: method || 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${KAPSO_API_KEY}`,
            },
            body: body ? JSON.stringify(body) : undefined,
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Error de Kapso:', data)
            return new Response(JSON.stringify({ error: data.message || 'Error en Kapso API', details: data }), {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('Error interno:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
