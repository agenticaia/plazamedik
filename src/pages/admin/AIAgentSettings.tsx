import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Bot, Zap, Globe, Webhook, Settings, CheckCircle, 
  XCircle, RefreshCw, ExternalLink, Shield, Database,
  MessageSquare, Package, TrendingUp, AlertTriangle,
  Link2, Server, Key, Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface MCPIntegration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: 'connected' | 'disconnected' | 'pending';
  category: 'automation' | 'database' | 'messaging' | 'analytics';
  webhookUrl?: string;
  apiKey?: string;
  lastSync?: string;
}

const mcpIntegrations: MCPIntegration[] = [
  {
    id: 'n8n',
    name: 'n8n Workflows',
    description: 'Automatiza flujos de trabajo con n8n para extender las capacidades del agente IA',
    icon: Zap,
    status: 'disconnected',
    category: 'automation',
  },
  {
    id: 'supabase',
    name: 'Supabase MCP',
    description: 'Conexión directa a la base de datos para consultas avanzadas y triggers',
    icon: Database,
    status: 'connected',
    category: 'database',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business API',
    description: 'Envío de notificaciones y respuestas automáticas por WhatsApp',
    icon: MessageSquare,
    status: 'connected',
    category: 'messaging',
  },
  {
    id: 'webhook',
    name: 'Webhooks Personalizados',
    description: 'Conecta cualquier servicio externo mediante webhooks HTTP',
    icon: Webhook,
    status: 'disconnected',
    category: 'automation',
  },
];

const agentCapabilities = [
  { 
    id: 'inventory', 
    name: 'Alertas de Inventario', 
    description: 'Notificaciones automáticas cuando el stock baja del ROP',
    icon: Package,
    enabled: true 
  },
  { 
    id: 'sales', 
    name: 'Análisis de Ventas', 
    description: 'Reportes diarios de ventas y tendencias',
    icon: TrendingUp,
    enabled: true 
  },
  { 
    id: 'orders', 
    name: 'Gestión de Pedidos', 
    description: 'Seguimiento y alertas de estados de pedidos',
    icon: Package,
    enabled: true 
  },
  { 
    id: 'critical', 
    name: 'Alertas Críticas', 
    description: 'Notificaciones push para situaciones urgentes',
    icon: AlertTriangle,
    enabled: true 
  },
];

const N8N_CHAT_STORAGE_KEY = 'n8n_webhook_url';
const N8N_EVENTS_STORAGE_KEY = 'n8n_events_webhook_url';
const DEFAULT_N8N_CHAT_URL = 'https://plazamedik.app.n8n.cloud/webhook/dfa2eb0e-64a7-47bf-9a0c-ef35458a675b';
const DEFAULT_N8N_EVENTS_URL = 'https://plazamedik.app.n8n.cloud/webhook-test/dfa2eb0e-64a7-47bf-9a0c-ef35458a675b';

export default function AIAgentSettings() {
  const [integrations, setIntegrations] = useState(mcpIntegrations);
  const [capabilities, setCapabilities] = useState(agentCapabilities);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [n8nChatWebhook, setN8nChatWebhook] = useState('');
  const [n8nEventsWebhook, setN8nEventsWebhook] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingEvents, setIsTestingEvents] = useState(false);
  
  // Load saved webhook URLs on mount
  useEffect(() => {
    const savedChatUrl = localStorage.getItem(N8N_CHAT_STORAGE_KEY);
    const savedEventsUrl = localStorage.getItem(N8N_EVENTS_STORAGE_KEY);
    
    setN8nChatWebhook(savedChatUrl || DEFAULT_N8N_CHAT_URL);
    setN8nEventsWebhook(savedEventsUrl || DEFAULT_N8N_EVENTS_URL);
    
    // Update n8n status if URL exists
    if (savedChatUrl) {
      setIntegrations(prev => 
        prev.map(int => 
          int.id === 'n8n' 
            ? { ...int, status: 'connected' as const, webhookUrl: savedChatUrl } 
            : int
        )
      );
    }
  }, []);

  const toggleCapability = (id: string) => {
    setCapabilities(prev => 
      prev.map(cap => 
        cap.id === id ? { ...cap, enabled: !cap.enabled } : cap
      )
    );
    toast.success('Configuración actualizada');
  };

  const testWebhook = async (url: string) => {
    if (!url) {
      toast.error('Ingresa una URL de webhook');
      return;
    }

    setIsTesting(true);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'test',
          timestamp: new Date().toISOString(),
          source: 'plazamedik-ai-agent',
          data: { message: 'Test de conexión exitoso' }
        }),
      });

      if (response.ok) {
        toast.success('Webhook conectado correctamente');
      } else {
        toast.error(`Error: ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      toast.error(`Error de conexión: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const saveN8nChatWebhook = () => {
    if (!n8nChatWebhook) {
      toast.error('Ingresa la URL del webhook de n8n');
      return;
    }

    localStorage.setItem(N8N_CHAT_STORAGE_KEY, n8nChatWebhook);
    setIntegrations(prev => 
      prev.map(int => 
        int.id === 'n8n' 
          ? { ...int, status: 'connected' as const, webhookUrl: n8nChatWebhook, lastSync: new Date().toISOString() } 
          : int
      )
    );
    toast.success('URL del chat de n8n guardada correctamente');
  };

  const saveN8nEventsWebhook = () => {
    if (!n8nEventsWebhook) {
      toast.error('Ingresa la URL del webhook de eventos');
      return;
    }

    localStorage.setItem(N8N_EVENTS_STORAGE_KEY, n8nEventsWebhook);
    toast.success('URL de eventos guardada correctamente');
  };

  const testEventsWebhook = async (eventType: string) => {
    if (!n8nEventsWebhook) {
      toast.error('Primero configura la URL del webhook de eventos');
      return;
    }

    setIsTestingEvents(true);
    try {
      const testPayload = {
        event: eventType,
        timestamp: new Date().toISOString(),
        source: 'plazamedik-ai-agent',
        data: {
          test: true,
          message: `Prueba de evento ${eventType}`,
          ...(eventType === 'stock_alert' ? { product_code: 'TEST-001', current_stock: 5, reorder_point: 20 } : {}),
          ...(eventType === 'order_created' ? { order_number: 'ORD-TEST-001', customer: 'Cliente Test' } : {}),
          ...(eventType === 'po_generated' ? { po_number: 'PO-TEST-001', total: 500 } : {}),
        }
      };

      const response = await fetch(n8nEventsWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload),
      });

      if (response.ok) {
        toast.success(`Evento ${eventType} enviado correctamente`, {
          description: 'Verifica la recepción en tu workflow de n8n'
        });
      } else {
        toast.error(`Error enviando ${eventType}: ${response.status}`);
      }
    } catch (error: any) {
      toast.error(`Error de conexión: ${error.message}`);
    } finally {
      setIsTestingEvents(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary" />
              Configuración del Agente IA
            </h1>
            <p className="text-muted-foreground mt-1">
              Administra las integraciones MCP y capacidades del asistente inteligente
            </p>
          </div>
          <Badge variant="outline" className="h-8 px-3 text-sm">
            <Shield className="h-4 w-4 mr-1" />
            Solo Administradores
          </Badge>
        </div>

        {/* Agent Status Card */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Agente IA de PlazaMedik</CardTitle>
                  <CardDescription>Estado: Activo y operativo</CardDescription>
                </div>
              </div>
              <Badge className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Online
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-primary">5</div>
                <div className="text-xs text-muted-foreground">Módulos Activos</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-green-600">2</div>
                <div className="text-xs text-muted-foreground">Integraciones</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-blue-600">24/7</div>
                <div className="text-xs text-muted-foreground">Monitoreo</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-orange-600">IA</div>
                <div className="text-xs text-muted-foreground">Gemini 2.5</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="capabilities" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="capabilities">Capacidades</TabsTrigger>
            <TabsTrigger value="integrations">Integraciones MCP</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          {/* Capabilities Tab */}
          <TabsContent value="capabilities" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Capacidades del Agente
                </CardTitle>
                <CardDescription>
                  Activa o desactiva las funcionalidades del asistente IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {capabilities.map((cap) => {
                  const Icon = cap.icon;
                  return (
                    <div 
                      key={cap.id}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{cap.name}</h4>
                          <p className="text-sm text-muted-foreground">{cap.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={cap.enabled}
                        onCheckedChange={() => toggleCapability(cap.id)}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Alert>
              <Bot className="h-4 w-4" />
              <AlertTitle>Base de Conocimiento</AlertTitle>
              <AlertDescription>
                El agente IA tiene acceso a toda la documentación de procesos: Gestión de Pedidos, 
                Cross-Docking, Órdenes de Compra, ROP, y Predicción de Inventario.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-4">
            <div className="grid gap-4">
              {integrations.map((integration) => {
                const Icon = integration.icon;
                return (
                  <Card key={integration.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                            integration.status === 'connected' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold flex items-center gap-2">
                              {integration.name}
                              {integration.status === 'connected' && (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground">{integration.description}</p>
                            {integration.lastSync && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                Última sincronización: {new Date(integration.lastSync).toLocaleString('es-PE')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={integration.status === 'connected' ? 'default' : 'secondary'}>
                            {integration.status === 'connected' ? 'Conectado' : 'Desconectado'}
                          </Badge>
                          {integration.status === 'connected' ? (
                            <Button variant="outline" size="sm">
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Sincronizar
                            </Button>
                          ) : (
                            <Button size="sm">
                              <Link2 className="h-4 w-4 mr-1" />
                              Conectar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* n8n Setup - Chat */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  Webhook del Chat (Agente IA Plaza)
                </CardTitle>
                <CardDescription>
                  URL del webhook para el chat del Agente IA - respuestas en tiempo real
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="n8n-chat-webhook">URL del Webhook Chat</Label>
                  <div className="flex gap-2">
                    <Input
                      id="n8n-chat-webhook"
                      placeholder="https://tu-instancia.n8n.cloud/webhook/..."
                      value={n8nChatWebhook}
                      onChange={(e) => setN8nChatWebhook(e.target.value)}
                    />
                    <Button variant="outline" onClick={() => testWebhook(n8nChatWebhook)} disabled={isTesting}>
                      {isTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Probar'}
                    </Button>
                    <Button onClick={saveN8nChatWebhook}>
                      Guardar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Esta URL recibe los mensajes del chat del Agente IA y devuelve respuestas.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* n8n Events Webhook */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5 text-blue-500" />
                  Webhook de Eventos Críticos
                </CardTitle>
                <CardDescription>
                  URL del webhook para recibir eventos automáticos del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="n8n-events-webhook">URL del Webhook Eventos</Label>
                  <div className="flex gap-2">
                    <Input
                      id="n8n-events-webhook"
                      placeholder="https://tu-instancia.n8n.cloud/webhook-test/..."
                      value={n8nEventsWebhook}
                      onChange={(e) => setN8nEventsWebhook(e.target.value)}
                    />
                    <Button onClick={saveN8nEventsWebhook}>
                      Guardar
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border p-4 bg-muted/50">
                  <h4 className="font-medium mb-3">Probar Eventos:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => testEventsWebhook('stock_alert')}
                      disabled={isTestingEvents}
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      stock_alert
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => testEventsWebhook('order_created')}
                      disabled={isTestingEvents}
                    >
                      <Package className="h-3 w-3 mr-1" />
                      order_created
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => testEventsWebhook('order_delivered')}
                      disabled={isTestingEvents}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      order_delivered
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => testEventsWebhook('po_generated')}
                      disabled={isTestingEvents}
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      po_generated
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => testEventsWebhook('rop_trigger')}
                      disabled={isTestingEvents}
                    >
                      <TrendingUp className="h-3 w-3 mr-1" />
                      rop_trigger
                    </Button>
                  </div>
                  {isTestingEvents && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin" />
                      Enviando evento de prueba...
                    </p>
                  )}
                </div>

                <Alert>
                  <ExternalLink className="h-4 w-4" />
                  <AlertTitle>Eventos disponibles</AlertTitle>
                  <AlertDescription className="text-xs">
                    <ul className="mt-2 space-y-1">
                      <li>• <code>stock_alert</code> - Alertas de stock bajo</li>
                      <li>• <code>order_created</code> - Nuevo pedido creado</li>
                      <li>• <code>order_delivered</code> - Pedido entregado</li>
                      <li>• <code>po_generated</code> - PO automática generada</li>
                      <li>• <code>rop_trigger</code> - Punto de reorden alcanzado</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Webhooks Personalizados
                </CardTitle>
                <CardDescription>
                  Configura webhooks para recibir eventos del agente IA en servicios externos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">URL del Webhook</Label>
                  <div className="flex gap-2">
                    <Input
                      id="webhook-url"
                      placeholder="https://tu-servicio.com/webhook"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => testWebhook(webhookUrl)}
                      disabled={isTesting}
                    >
                      {isTesting ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        'Probar'
                      )}
                    </Button>
                    <Button>Guardar</Button>
                  </div>
                </div>

                <div className="rounded-lg border p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">Eventos disponibles:</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• <code>stock_alert</code> - Alertas de stock bajo</li>
                    <li>• <code>order_created</code> - Nuevo pedido creado</li>
                    <li>• <code>order_delivered</code> - Pedido entregado</li>
                    <li>• <code>po_generated</code> - PO automática generada</li>
                    <li>• <code>rop_trigger</code> - Punto de reorden alcanzado</li>
                  </ul>
                </div>

                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-2">Ejemplo de payload:</h4>
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
{`{
  "event": "stock_alert",
  "timestamp": "2025-01-15T10:30:00Z",
  "source": "plazamedik-ai-agent",
  "data": {
    "product_code": "MED-001",
    "product_name": "Medias Antiembólicas",
    "current_stock": 5,
    "reorder_point": 20,
    "urgency": "CRITICAL"
  }
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Endpoints del Agente
                </CardTitle>
                <CardDescription>
                  URLs de las Edge Functions disponibles para integraciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <code className="text-sm">/functions/v1/inventory-ai-agent</code>
                      <p className="text-xs text-muted-foreground">Consultas al agente IA</p>
                    </div>
                    <Badge>POST</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <code className="text-sm">/functions/v1/notify-business-event</code>
                      <p className="text-xs text-muted-foreground">Notificaciones de eventos</p>
                    </div>
                    <Badge>POST</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <code className="text-sm">/functions/v1/calculate-reorder-points</code>
                      <p className="text-xs text-muted-foreground">Cálculo de ROP</p>
                    </div>
                    <Badge>POST</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
