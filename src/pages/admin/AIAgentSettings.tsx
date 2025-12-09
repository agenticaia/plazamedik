import { useState } from 'react';
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

export default function AIAgentSettings() {
  const [integrations, setIntegrations] = useState(mcpIntegrations);
  const [capabilities, setCapabilities] = useState(agentCapabilities);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [n8nWebhook, setN8nWebhook] = useState('');
  const [isTesting, setIsTesting] = useState(false);

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

  const connectN8n = () => {
    if (!n8nWebhook) {
      toast.error('Ingresa la URL del webhook de n8n');
      return;
    }

    setIntegrations(prev => 
      prev.map(int => 
        int.id === 'n8n' 
          ? { ...int, status: 'connected' as const, webhookUrl: n8nWebhook, lastSync: new Date().toISOString() } 
          : int
      )
    );
    toast.success('n8n conectado exitosamente');
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

            {/* n8n Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-500" />
                  Configurar n8n
                </CardTitle>
                <CardDescription>
                  Conecta tu instancia de n8n para automatizar flujos con el agente IA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="n8n-webhook">URL del Webhook n8n</Label>
                  <div className="flex gap-2">
                    <Input
                      id="n8n-webhook"
                      placeholder="https://tu-instancia.n8n.cloud/webhook/..."
                      value={n8nWebhook}
                      onChange={(e) => setN8nWebhook(e.target.value)}
                    />
                    <Button onClick={connectN8n}>
                      Conectar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ingresa la URL del webhook de tu workflow en n8n. Asegúrate de que esté activo.
                  </p>
                </div>

                <Alert>
                  <ExternalLink className="h-4 w-4" />
                  <AlertTitle>¿Cómo configurar n8n?</AlertTitle>
                  <AlertDescription>
                    1. Ve a Settings → MCP access en tu instancia n8n<br/>
                    2. Activa "Enable MCP access"<br/>
                    3. Copia la URL del MCP Server<br/>
                    4. En cada workflow, activa "Available in MCP" en Settings
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
