// Servicio de integración con Kapso.ai para WhatsApp Business API
// Documentación: https://docs.kapso.ai

import { Pedido } from '@/types/pedidos';

// ============================================================================
// TIPOS Y CONFIGURACIÓN
// ============================================================================

interface KapsoConfig {
    apiKey: string;
    phoneNumberId: string;
    businessAccountId: string;
    baseUrl?: string;
}

interface WhatsAppTemplate {
    name: string;
    language: string;
    components?: TemplateComponent[];
}

interface TemplateComponent {
    type: 'header' | 'body' | 'button';
    parameters?: TemplateParameter[];
    sub_type?: string;
    index?: number;
}

interface TemplateParameter {
    type: 'text' | 'currency' | 'date_time' | 'image' | 'document';
    text?: string;
    currency?: {
        fallback_value: string;
        code: string;
        amount_1000: number;
    };
    image?: {
        link: string;
    };
}

interface KapsoResponse {
    success: boolean;
    messageId?: string;
    error?: string;
    details?: any;
}

interface CampaignSegment {
    type: 'all' | 'distrito' | 'fecha_pedido' | 'monto_gastado' | 'custom';
    filters?: {
        distritos?: string[];
        fechaDesde?: string;
        fechaHasta?: string;
        montoMinimo?: number;
        montoMaximo?: number;
        customQuery?: string;
    };
}

interface Campaign {
    id?: string;
    nombre: string;
    template: string;
    segmento: CampaignSegment;
    programada?: Date;
    estado?: 'borrador' | 'programada' | 'enviando' | 'completada' | 'cancelada';
    estadisticas?: {
        total: number;
        enviados: number;
        entregados: number;
        leidos: number;
        respondidos: number;
        fallidos: number;
    };
}

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

class KapsoService {
    private config: KapsoConfig;
    private baseUrl: string;

    constructor(config?: Partial<KapsoConfig>) {
        this.config = {
            apiKey: config?.apiKey || import.meta.env.VITE_KAPSO_API_KEY || '',
            phoneNumberId: config?.phoneNumberId || import.meta.env.VITE_KAPSO_PHONE_NUMBER_ID || '',
            businessAccountId: config?.businessAccountId || import.meta.env.VITE_KAPSO_BUSINESS_ACCOUNT_ID || '',
            baseUrl: config?.baseUrl || 'https://api.kapso.ai/v1',
        };
        this.baseUrl = this.config.baseUrl!;
    }

    // ============================================================================
    // MÉTODOS PRIVADOS - HELPERS
    // ============================================================================

    private async makeRequest(
        endpoint: string,
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
        body?: any
    ): Promise<any> {
        try {
            // Usar Supabase Edge Function para evitar CORS
            const { data, error } = await import('@/integrations/supabase/client')
                .then(m => m.supabase.functions.invoke('send-whatsapp', {
                    body: {
                        endpoint,
                        method,
                        body
                    }
                }));

            if (error) {
                console.error('❌ Error invocando Edge Function:', error);
                throw new Error(error.message || 'Error al conectar con el servidor de envío');
            }

            return data;
        } catch (error) {
            console.error('❌ Kapso Service Error:', error);
            throw error;
        }
    }

    private formatPhoneNumber(phone: string): string {
        // Eliminar caracteres no numéricos
        let cleaned = phone.replace(/\D/g, '');

        // Si no empieza con 51 (Perú), agregarlo
        if (!cleaned.startsWith('51')) {
            cleaned = '51' + cleaned;
        }

        return cleaned;
    }

    private validateConfig(): void {
        if (!this.config.apiKey) {
            throw new Error('Kapso API Key no configurada. Agrega VITE_KAPSO_API_KEY en .env');
        }
        if (!this.config.phoneNumberId) {
            throw new Error('Phone Number ID no configurado. Agrega VITE_KAPSO_PHONE_NUMBER_ID en .env');
        }
    }

    // ============================================================================
    // TEMPLATES - Mensajes Aprobados por Meta
    // ============================================================================

    /**
     * Enviar template de confirmación de pedido
     */
    async enviarConfirmacionPedido(pedido: Pedido): Promise<KapsoResponse> {
        this.validateConfig();

        try {
            const phone = this.formatPhoneNumber(pedido.cliente_telefono);

            // Template: order_confirmation
            // Variables: {1} = nombre, {2} = código, {3} = total, {4} = dirección
            const template: WhatsAppTemplate = {
                name: 'order_confirmation',
                language: 'es',
                components: [
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: pedido.cliente_nombre },
                            { type: 'text', text: pedido.codigo },
                            {
                                type: 'currency',
                                currency: {
                                    fallback_value: `S/ ${pedido.precio_total.toFixed(2)}`,
                                    code: 'PEN',
                                    amount_1000: Math.round(pedido.precio_total * 1000),
                                }
                            },
                            { type: 'text', text: `${pedido.direccion_completa}, ${pedido.distrito}` },
                        ],
                    },
                    {
                        type: 'button',
                        sub_type: 'quick_reply',
                        index: 0,
                        parameters: [
                            { type: 'text', text: 'confirmar' }
                        ],
                    },
                ],
            };

            const response = await this.makeRequest('/messages', 'POST', {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: phone,
                type: 'template',
                template,
            });

            return {
                success: true,
                messageId: response.messages?.[0]?.id,
                details: response,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido',
            };
        }
    }

    /**
     * Enviar recordatorio de pago pendiente
     */
    async enviarRecordatorioPago(pedido: Pedido): Promise<KapsoResponse> {
        this.validateConfig();

        try {
            const phone = this.formatPhoneNumber(pedido.cliente_telefono);

            // Template: payment_reminder
            // Variables: {1} = nombre, {2} = código, {3} = total
            const template: WhatsAppTemplate = {
                name: 'payment_reminder',
                language: 'es',
                components: [
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: pedido.cliente_nombre },
                            { type: 'text', text: pedido.codigo },
                            {
                                type: 'currency',
                                currency: {
                                    fallback_value: `S/ ${pedido.precio_total.toFixed(2)}`,
                                    code: 'PEN',
                                    amount_1000: Math.round(pedido.precio_total * 1000),
                                }
                            },
                        ],
                    },
                    {
                        type: 'button',
                        sub_type: 'url',
                        index: 0,
                        parameters: [
                            { type: 'text', text: pedido.codigo } // Para URL dinámica
                        ],
                    },
                ],
            };

            const response = await this.makeRequest('/messages', 'POST', {
                messaging_product: 'whatsapp',
                to: phone,
                type: 'template',
                template,
            });

            return {
                success: true,
                messageId: response.messages?.[0]?.id,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido',
            };
        }
    }

    /**
     * Enviar notificación de envío en camino
     */
    async enviarNotificacionEnvio(pedido: Pedido, trackingUrl?: string): Promise<KapsoResponse> {
        this.validateConfig();

        try {
            const phone = this.formatPhoneNumber(pedido.cliente_telefono);

            // Template: delivery_on_way
            // Variables: {1} = nombre, {2} = código
            const template: WhatsAppTemplate = {
                name: 'delivery_on_way',
                language: 'es',
                components: [
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: pedido.cliente_nombre },
                            { type: 'text', text: pedido.codigo },
                        ],
                    },
                ],
            };

            // Si hay URL de tracking, agregar botón
            if (trackingUrl) {
                template.components?.push({
                    type: 'button',
                    sub_type: 'url',
                    index: 0,
                    parameters: [
                        { type: 'text', text: trackingUrl }
                    ],
                });
            }

            const response = await this.makeRequest('/messages', 'POST', {
                messaging_product: 'whatsapp',
                to: phone,
                type: 'template',
                template,
            });

            return {
                success: true,
                messageId: response.messages?.[0]?.id,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido',
            };
        }
    }

    // ============================================================================
    // CAMPAÑAS DE MARKETING
    // ============================================================================

    /**
     * Enviar campaña de marketing a segmento de clientes
     */
    async enviarCampana(campaign: Campaign, clientes: Array<{ telefono: string; nombre: string; variables?: Record<string, string> }>): Promise<{
        success: boolean;
        enviados: number;
        fallidos: number;
        detalles: Array<{ telefono: string; success: boolean; messageId?: string; error?: string }>;
    }> {
        this.validateConfig();

        const resultados = {
            success: true,
            enviados: 0,
            fallidos: 0,
            detalles: [] as Array<{ telefono: string; success: boolean; messageId?: string; error?: string }>,
        };

        for (const cliente of clientes) {
            try {
                const phone = this.formatPhoneNumber(cliente.telefono);

                // Template personalizable según la campaña
                const template: WhatsAppTemplate = {
                    name: campaign.template,
                    language: 'es',
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: cliente.nombre },
                                // Agregar más variables según el template
                                ...(cliente.variables ? Object.values(cliente.variables).map(v => ({ type: 'text' as const, text: v })) : []),
                            ],
                        },
                    ],
                };

                const response = await this.makeRequest('/messages', 'POST', {
                    messaging_product: 'whatsapp',
                    to: phone,
                    type: 'template',
                    template,
                });

                resultados.enviados++;
                resultados.detalles.push({
                    telefono: cliente.telefono,
                    success: true,
                    messageId: response.messages?.[0]?.id,
                });

                // Delay para evitar rate limiting (ajustar según límites de Kapso)
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                resultados.fallidos++;
                resultados.detalles.push({
                    telefono: cliente.telefono,
                    success: false,
                    error: error instanceof Error ? error.message : 'Error desconocido',
                });
            }
        }

        return resultados;
    }

    /**
     * Enviar promoción especial
     */
    async enviarPromocion(
        telefono: string,
        nombre: string,
        codigoDescuento: string,
        porcentajeDescuento: number,
        fechaVencimiento: string
    ): Promise<KapsoResponse> {
        this.validateConfig();

        try {
            const phone = this.formatPhoneNumber(telefono);

            // Template: special_promotion
            // Variables: {1} = nombre, {2} = descuento%, {3} = código, {4} = fecha vencimiento
            const template: WhatsAppTemplate = {
                name: 'special_promotion',
                language: 'es',
                components: [
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: nombre },
                            { type: 'text', text: `${porcentajeDescuento}%` },
                            { type: 'text', text: codigoDescuento },
                            { type: 'text', text: fechaVencimiento },
                        ],
                    },
                    {
                        type: 'button',
                        sub_type: 'quick_reply',
                        index: 0,
                        parameters: [
                            { type: 'text', text: 'usar_ahora' }
                        ],
                    },
                ],
            };

            const response = await this.makeRequest('/messages', 'POST', {
                messaging_product: 'whatsapp',
                to: phone,
                type: 'template',
                template,
            });

            return {
                success: true,
                messageId: response.messages?.[0]?.id,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido',
            };
        }
    }

    // ============================================================================
    // MENSAJES INTERACTIVOS
    // ============================================================================

    /**
     * Enviar mensaje con botones de acción
     */
    async enviarMensajeConBotones(
        telefono: string,
        mensaje: string,
        botones: Array<{ id: string; title: string }>
    ): Promise<KapsoResponse> {
        this.validateConfig();

        try {
            const phone = this.formatPhoneNumber(telefono);

            const response = await this.makeRequest('/messages', 'POST', {
                messaging_product: 'whatsapp',
                to: phone,
                type: 'interactive',
                interactive: {
                    type: 'button',
                    body: {
                        text: mensaje,
                    },
                    action: {
                        buttons: botones.map(btn => ({
                            type: 'reply',
                            reply: {
                                id: btn.id,
                                title: btn.title,
                            },
                        })),
                    },
                },
            });

            return {
                success: true,
                messageId: response.messages?.[0]?.id,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido',
            };
        }
    }

    /**
     * Enviar mensaje con lista de opciones
     */
    async enviarMensajeConLista(
        telefono: string,
        mensaje: string,
        tituloBoton: string,
        secciones: Array<{
            title: string;
            rows: Array<{ id: string; title: string; description?: string }>;
        }>
    ): Promise<KapsoResponse> {
        this.validateConfig();

        try {
            const phone = this.formatPhoneNumber(telefono);

            const response = await this.makeRequest('/messages', 'POST', {
                messaging_product: 'whatsapp',
                to: phone,
                type: 'interactive',
                interactive: {
                    type: 'list',
                    body: {
                        text: mensaje,
                    },
                    action: {
                        button: tituloBoton,
                        sections,
                    },
                },
            });

            return {
                success: true,
                messageId: response.messages?.[0]?.id,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido',
            };
        }
    }

    // ============================================================================
    // WEBHOOKS Y EVENTOS
    // ============================================================================

    /**
     * Procesar webhook de Kapso (para recibir respuestas de clientes)
     */
    processWebhook(payload: any): {
        type: 'message' | 'status' | 'unknown';
        data: any;
    } {
        try {
            const entry = payload.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;

            // Mensaje recibido
            if (value?.messages) {
                const message = value.messages[0];
                return {
                    type: 'message',
                    data: {
                        from: message.from,
                        messageId: message.id,
                        timestamp: message.timestamp,
                        type: message.type,
                        text: message.text?.body,
                        interactive: message.interactive,
                    },
                };
            }

            // Estado de mensaje
            if (value?.statuses) {
                const status = value.statuses[0];
                return {
                    type: 'status',
                    data: {
                        messageId: status.id,
                        status: status.status, // sent, delivered, read, failed
                        timestamp: status.timestamp,
                        recipientId: status.recipient_id,
                    },
                };
            }

            return { type: 'unknown', data: payload };
        } catch (error) {
            console.error('Error procesando webhook:', error);
            return { type: 'unknown', data: payload };
        }
    }

    // ============================================================================
    // UTILIDADES
    // ============================================================================

    /**
     * Obtener estadísticas de mensajes enviados
     */
    async obtenerEstadisticas(fechaDesde: string, fechaHasta: string): Promise<{
        enviados: number;
        entregados: number;
        leidos: number;
        fallidos: number;
    }> {
        // Implementar según API de Kapso para analytics
        // Por ahora retornar placeholder
        return {
            enviados: 0,
            entregados: 0,
            leidos: 0,
            fallidos: 0,
        };
    }

    /**
     * Verificar si un número de WhatsApp es válido
     */
    async verificarNumero(telefono: string): Promise<{ valido: boolean; registrado?: boolean }> {
        try {
            const phone = this.formatPhoneNumber(telefono);

            // Endpoint de verificación (si Kapso lo soporta)
            const response = await this.makeRequest('/phone/verify', 'POST', {
                phone,
            });

            return {
                valido: true,
                registrado: response.registered,
            };
        } catch (error) {
            return {
                valido: false,
            };
        }
    }
}

// ============================================================================
// EXPORTAR INSTANCIA SINGLETON
// ============================================================================

export const kapsoService = new KapsoService();

// Exportar tipos para uso en otros módulos
export type {
    KapsoConfig,
    WhatsAppTemplate,
    KapsoResponse,
    Campaign,
    CampaignSegment
};
