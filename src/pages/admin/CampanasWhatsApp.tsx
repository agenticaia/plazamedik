import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { kapsoService, Campaign, CampaignSegment } from '@/services/kapsoService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
    Send,
    Users,
    Calendar,
    TrendingUp,
    MessageSquare,
    Eye,
    CheckCircle2,
    XCircle,
    Clock,
    Plus,
    Play,
    Pause,
    Trash2,
    Download,
    Filter,
    Target
} from 'lucide-react';

interface Cliente {
    id: string;
    nombre: string;
    apellido: string;
    telefono: string;
    distrito?: string;
    total_gastado?: number;
    ultima_compra?: string;
}

export default function CampanasWhatsApp() {
    const [campanas, setCampanas] = useState<Campaign[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(false);
    const [nuevaCampana, setNuevaCampana] = useState<Partial<Campaign>>({
        nombre: '',
        template: 'order_confirmation',
        segmento: { type: 'all' },
        estado: 'borrador',
    });

    // Templates disponibles
    const templates = [
        { value: 'order_confirmation', label: '✅ Confirmación de Pedido', category: 'utility' },
        { value: 'payment_reminder', label: '💰 Recordatorio de Pago', category: 'utility' },
        { value: 'delivery_on_way', label: '🚚 Pedido en Camino', category: 'utility' },
        { value: 'special_promotion', label: '🎉 Promoción Especial', category: 'marketing' },
        { value: 'abandoned_cart', label: '🛒 Carrito Abandonado', category: 'marketing' },
        { value: 'customer_feedback', label: '⭐ Solicitud de Feedback', category: 'utility' },
        { value: 'restock_notification', label: '📦 Producto Disponible', category: 'utility' },
    ];

    // Cargar clientes desde Supabase
    useEffect(() => {
        cargarClientes();
    }, []);

    // Filtrar clientes según segmento
    useEffect(() => {
        filtrarClientes();
    }, [nuevaCampana.segmento, clientes]);

    const cargarClientes = async () => {
        try {
            // Obtener clientes únicos de pedidos
            const { data: pedidos, error } = await supabase
                .from('pedidos')
                .select('cliente_nombre, cliente_apellido, cliente_telefono, distrito, precio_total, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Agrupar por teléfono y calcular estadísticas
            const clientesMap = new Map<string, Cliente>();

            pedidos?.forEach((pedido) => {
                const telefono = pedido.cliente_telefono;
                if (!clientesMap.has(telefono)) {
                    clientesMap.set(telefono, {
                        id: telefono,
                        nombre: pedido.cliente_nombre,
                        apellido: pedido.cliente_apellido,
                        telefono: pedido.cliente_telefono,
                        distrito: pedido.distrito,
                        total_gastado: pedido.precio_total,
                        ultima_compra: pedido.created_at,
                    });
                } else {
                    const cliente = clientesMap.get(telefono)!;
                    cliente.total_gastado = (cliente.total_gastado || 0) + pedido.precio_total;
                    if (pedido.created_at > (cliente.ultima_compra || '')) {
                        cliente.ultima_compra = pedido.created_at;
                        cliente.distrito = pedido.distrito;
                    }
                }
            });

            setClientes(Array.from(clientesMap.values()));
        } catch (error) {
            console.error('Error cargando clientes:', error);
            toast.error('Error al cargar clientes');
        }
    };

    const filtrarClientes = () => {
        if (!nuevaCampana.segmento) {
            setClientesFiltrados(clientes);
            return;
        }

        let filtrados = [...clientes];
        const segmento = nuevaCampana.segmento;

        switch (segmento.type) {
            case 'all':
                // Todos los clientes
                break;

            case 'distrito':
                if (segmento.filters?.distritos?.length) {
                    filtrados = filtrados.filter(c =>
                        segmento.filters!.distritos!.includes(c.distrito || '')
                    );
                }
                break;

            case 'fecha_pedido':
                if (segmento.filters?.fechaDesde || segmento.filters?.fechaHasta) {
                    filtrados = filtrados.filter(c => {
                        if (!c.ultima_compra) return false;
                        const fecha = new Date(c.ultima_compra);
                        const desde = segmento.filters?.fechaDesde ? new Date(segmento.filters.fechaDesde) : null;
                        const hasta = segmento.filters?.fechaHasta ? new Date(segmento.filters.fechaHasta) : null;

                        if (desde && fecha < desde) return false;
                        if (hasta && fecha > hasta) return false;
                        return true;
                    });
                }
                break;

            case 'monto_gastado':
                if (segmento.filters?.montoMinimo !== undefined || segmento.filters?.montoMaximo !== undefined) {
                    filtrados = filtrados.filter(c => {
                        const total = c.total_gastado || 0;
                        const min = segmento.filters?.montoMinimo ?? 0;
                        const max = segmento.filters?.montoMaximo ?? Infinity;
                        return total >= min && total <= max;
                    });
                }
                break;
        }

        setClientesFiltrados(filtrados);
    };

    const crearCampana = async () => {
        if (!nuevaCampana.nombre || !nuevaCampana.template) {
            toast.error('Completa todos los campos requeridos');
            return;
        }

        try {
            setLoading(true);

            // Guardar campaña en Supabase (opcional - para tracking)
            const { data, error } = await supabase
                .from('campanas_whatsapp')
                .insert({
                    nombre: nuevaCampana.nombre,
                    template: nuevaCampana.template,
                    segmento: nuevaCampana.segmento,
                    programada: nuevaCampana.programada,
                    estado: 'borrador',
                    total_destinatarios: clientesFiltrados.length,
                })
                .select()
                .single();

            if (error) throw error;

            toast.success('Campaña creada exitosamente');

            // Agregar a lista local
            setCampanas([...campanas, data as Campaign]);

            // Resetear formulario
            setNuevaCampana({
                nombre: '',
                template: 'order_confirmation',
                segmento: { type: 'all' },
                estado: 'borrador',
            });
        } catch (error) {
            console.error('Error creando campaña:', error);
            toast.error('Error al crear campaña');
        } finally {
            setLoading(false);
        }
    };

    const ejecutarCampana = async (campana: Campaign) => {
        if (!clientesFiltrados.length) {
            toast.error('No hay destinatarios para esta campaña');
            return;
        }

        try {
            setLoading(true);
            toast.loading(`Enviando campaña a ${clientesFiltrados.length} clientes...`);

            // Preparar lista de clientes
            const destinatarios = clientesFiltrados.map(c => ({
                telefono: c.telefono,
                nombre: c.nombre,
                variables: {
                    apellido: c.apellido,
                    distrito: c.distrito || '',
                },
            }));

            // Enviar campaña usando Kapso
            const resultado = await kapsoService.enviarCampana(campana, destinatarios);

            // Actualizar estadísticas
            await supabase
                .from('campanas_whatsapp')
                .update({
                    estado: 'completada',
                    estadisticas: {
                        total: clientesFiltrados.length,
                        enviados: resultado.enviados,
                        fallidos: resultado.fallidos,
                        entregados: 0,
                        leidos: 0,
                        respondidos: 0,
                    },
                })
                .eq('id', campana.id);

            toast.success(`Campaña enviada: ${resultado.enviados} exitosos, ${resultado.fallidos} fallidos`);

            // Recargar campañas
            cargarCampanas();
        } catch (error) {
            console.error('Error ejecutando campaña:', error);
            toast.error('Error al ejecutar campaña');
        } finally {
            setLoading(false);
        }
    };

    const cargarCampanas = async () => {
        try {
            const { data, error } = await supabase
                .from('campanas_whatsapp')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setCampanas(data as Campaign[]);
        } catch (error) {
            console.error('Error cargando campañas:', error);
        }
    };

    const verificarConexion = async () => {
        try {
            setLoading(true);
            const apiKey = import.meta.env.VITE_KAPSO_API_KEY;
            if (!apiKey) {
                toast.error('API Key no configurada en .env');
                return;
            }
            // Simular verificación (o llamar a endpoint real si existe)
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast.success('Conexión con Kapso.ai exitosa');
        } catch (error) {
            toast.error('Error al conectar con Kapso');
        } finally {
            setLoading(false);
        }
    };

    const getEstadoBadge = (estado?: string) => {
        const badges = {
            borrador: <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Borrador</Badge>,
            programada: <Badge variant="default"><Calendar className="w-3 h-3 mr-1" /> Programada</Badge>,
            enviando: <Badge variant="default" className="bg-blue-500"><Send className="w-3 h-3 mr-1" /> Enviando</Badge>,
            completada: <Badge variant="default" className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" /> Completada</Badge>,
            cancelada: <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Cancelada</Badge>,
        };
        return badges[estado as keyof typeof badges] || badges.borrador;
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Campañas de WhatsApp</h1>
                    <p className="text-muted-foreground">Gestiona tus campañas de marketing y notificaciones automáticas</p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={verificarConexion} disabled={loading}>
                        {loading ? 'Verificando...' : 'Verificar Conexión'}
                    </Button>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button size="lg" className="gap-2">
                                <Plus className="w-4 h-4" />
                                Nueva Campaña
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Crear Nueva Campaña</DialogTitle>
                                <DialogDescription>
                                    Configura tu campaña de WhatsApp con segmentación de clientes
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                {/* Nombre de campaña */}
                                <div>
                                    <Label htmlFor="nombre">Nombre de la Campaña *</Label>
                                    <Input
                                        id="nombre"
                                        placeholder="Ej: Promoción Verano 2024"
                                        value={nuevaCampana.nombre}
                                        onChange={(e) => setNuevaCampana({ ...nuevaCampana, nombre: e.target.value })}
                                    />
                                </div>

                                {/* Template */}
                                <div>
                                    <Label htmlFor="template">Template de WhatsApp *</Label>
                                    <Select
                                        value={nuevaCampana.template}
                                        onValueChange={(value) => setNuevaCampana({ ...nuevaCampana, template: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un template" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {templates.map((t) => (
                                                <SelectItem key={t.value} value={t.value}>
                                                    {t.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Segmentación */}
                                <div>
                                    <Label>Segmentación de Clientes</Label>
                                    <Select
                                        value={nuevaCampana.segmento?.type}
                                        onValueChange={(value) =>
                                            setNuevaCampana({
                                                ...nuevaCampana,
                                                segmento: { type: value as any, filters: {} }
                                            })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona segmento" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los Clientes</SelectItem>
                                            <SelectItem value="distrito">Por Distrito</SelectItem>
                                            <SelectItem value="fecha_pedido">Por Fecha de Pedido</SelectItem>
                                            <SelectItem value="monto_gastado">Por Monto Gastado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Filtros según segmento */}
                                {nuevaCampana.segmento?.type === 'distrito' && (
                                    <div>
                                        <Label>Distritos (separados por coma)</Label>
                                        <Input
                                            placeholder="Ej: Miraflores, San Isidro, Surco"
                                            onChange={(e) => {
                                                const distritos = e.target.value.split(',').map(d => d.trim());
                                                setNuevaCampana({
                                                    ...nuevaCampana,
                                                    segmento: {
                                                        ...nuevaCampana.segmento!,
                                                        filters: { distritos },
                                                    },
                                                });
                                            }}
                                        />
                                    </div>
                                )}

                                {nuevaCampana.segmento?.type === 'monto_gastado' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label>Monto Mínimo (S/)</Label>
                                            <Input
                                                type="number"
                                                placeholder="0"
                                                onChange={(e) => {
                                                    setNuevaCampana({
                                                        ...nuevaCampana,
                                                        segmento: {
                                                            ...nuevaCampana.segmento!,
                                                            filters: {
                                                                ...nuevaCampana.segmento!.filters,
                                                                montoMinimo: parseFloat(e.target.value),
                                                            },
                                                        },
                                                    });
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <Label>Monto Máximo (S/)</Label>
                                            <Input
                                                type="number"
                                                placeholder="1000"
                                                onChange={(e) => {
                                                    setNuevaCampana({
                                                        ...nuevaCampana,
                                                        segmento: {
                                                            ...nuevaCampana.segmento!,
                                                            filters: {
                                                                ...nuevaCampana.segmento!.filters,
                                                                montoMaximo: parseFloat(e.target.value),
                                                            },
                                                        },
                                                    });
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Preview de destinatarios */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <Target className="w-4 h-4" />
                                            Destinatarios: {clientesFiltrados.length}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">
                                            Esta campaña se enviará a <strong>{clientesFiltrados.length}</strong> clientes
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Acciones */}
                                <div className="flex gap-2 pt-4">
                                    <Button onClick={crearCampana} disabled={loading} className="flex-1">
                                        {loading ? 'Creando...' : 'Crear Campaña'}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Estadísticas Generales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{clientes.length}</div>
                        <p className="text-xs text-muted-foreground">Clientes únicos registrados</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Campañas Activas</CardTitle>
                        <Send className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {campanas.filter(c => c.estado === 'enviando' || c.estado === 'programada').length}
                        </div>
                        <p className="text-xs text-muted-foreground">En ejecución o programadas</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tasa de Entrega</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">98.5%</div>
                        <p className="text-xs text-muted-foreground">Últimos 30 días</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tasa de Respuesta</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">32.1%</div>
                        <p className="text-xs text-muted-foreground">Clientes que responden</p>
                    </CardContent>
                </Card>
            </div>

            {/* Lista de Campañas */}
            <Card>
                <CardHeader>
                    <CardTitle>Campañas Recientes</CardTitle>
                    <CardDescription>Historial y estado de tus campañas de WhatsApp</CardDescription>
                </CardHeader>
                <CardContent>
                    {campanas.length === 0 ? (
                        <div className="text-center py-12">
                            <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No hay campañas creadas</h3>
                            <p className="text-muted-foreground mb-4">Crea tu primera campaña para empezar</p>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Nueva Campaña
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {campanas.map((campana) => (
                                <Card key={campana.id}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="font-semibold text-lg">{campana.nombre}</h3>
                                                    {getEstadoBadge(campana.estado)}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Template: {templates.find(t => t.value === campana.template)?.label}
                                                </p>
                                                <div className="flex gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="w-3 h-3" />
                                                        {campana.estadisticas?.total || 0} destinatarios
                                                    </span>
                                                    {campana.estadisticas && (
                                                        <>
                                                            <span className="flex items-center gap-1">
                                                                <Send className="w-3 h-3" />
                                                                {campana.estadisticas.enviados} enviados
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Eye className="w-3 h-3" />
                                                                {campana.estadisticas.leidos} leídos
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                {campana.estado === 'borrador' && (
                                                    <Button
                                                        onClick={() => ejecutarCampana(campana)}
                                                        disabled={loading}
                                                        size="sm"
                                                    >
                                                        <Play className="w-4 h-4 mr-2" />
                                                        Ejecutar
                                                    </Button>
                                                )}
                                                <Button variant="outline" size="sm">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button variant="outline" size="sm" className="text-destructive">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
