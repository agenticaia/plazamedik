import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle, Package, ShoppingCart, TrendingDown, Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CriticalAlert {
  id: string;
  type: 'stock_critico' | 'sin_stock' | 'rop_alerta' | 'po_urgente';
  title: string;
  message: string;
  productCode?: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: Date;
  dismissed: boolean;
}

export function InventoryAlertNotifications() {
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkCriticalAlerts = useCallback(async () => {
    if (isChecking) return;
    setIsChecking(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch products with critical stock issues
      const { data: products } = await supabase
        .from('products')
        .select('product_code, nombre_producto, cantidad_stock, ai_reorder_point, reorder_point, sales_velocity_7d')
        .or('is_discontinued.eq.false,is_discontinued.is.null');

      if (!products) return;

      const newAlerts: CriticalAlert[] = [];
      const now = new Date();

      // Check for out of stock
      const outOfStock = products.filter(p => p.cantidad_stock === 0);
      outOfStock.forEach(p => {
        newAlerts.push({
          id: `sin_stock_${p.product_code}`,
          type: 'sin_stock',
          title: 'Producto Agotado',
          message: `${p.nombre_producto} está sin stock.`,
          productCode: p.product_code,
          severity: 'critical',
          timestamp: now,
          dismissed: false
        });
      });

      // Check for critical stock (<=5 units)
      const criticalStock = products.filter(p => 
        p.cantidad_stock !== null && 
        p.cantidad_stock > 0 && 
        p.cantidad_stock <= 5
      );
      criticalStock.forEach(p => {
        newAlerts.push({
          id: `stock_critico_${p.product_code}`,
          type: 'stock_critico',
          title: 'Stock Crítico',
          message: `${p.nombre_producto}: ${p.cantidad_stock} unidades`,
          productCode: p.product_code,
          severity: 'critical',
          timestamp: now,
          dismissed: false
        });
      });

      // Check ROP alerts
      const ropAlerts = products.filter(p => 
        p.ai_reorder_point && 
        p.cantidad_stock !== null && 
        p.cantidad_stock <= p.ai_reorder_point &&
        p.cantidad_stock > 5
      );
      ropAlerts.slice(0, 5).forEach(p => {
        newAlerts.push({
          id: `rop_${p.product_code}`,
          type: 'rop_alerta',
          title: 'Punto de Reorden Alcanzado',
          message: `${p.nombre_producto}`,
          productCode: p.product_code,
          severity: 'warning',
          timestamp: now,
          dismissed: false
        });
      });

      // Only show new alerts (not previously shown)
      const storedDismissed = localStorage.getItem('dismissedAlerts');
      const dismissedIds = storedDismissed ? JSON.parse(storedDismissed) : [];
      
      const filteredAlerts = newAlerts.filter(a => !dismissedIds.includes(a.id));
      
      setAlerts(filteredAlerts);
      setLastCheck(now);

      // Show toast notifications for critical alerts (only if panel is closed)
      const criticalAlerts = filteredAlerts.filter(a => a.severity === 'critical');
      if (criticalAlerts.length > 0 && !showNotifications) {
        toast.error(
          `${criticalAlerts.length} alerta${criticalAlerts.length > 1 ? 's' : ''} crítica${criticalAlerts.length > 1 ? 's' : ''} de inventario`,
          {
            description: criticalAlerts[0].message,
            duration: 5000,
            action: {
              label: 'Ver todas',
              onClick: () => setShowNotifications(true)
            }
          }
        );
      }

    } catch (error) {
      console.error('Error checking alerts:', error);
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, showNotifications]);

  // Check on mount and every 5 minutes
  useEffect(() => {
    checkCriticalAlerts();
    const interval = setInterval(checkCriticalAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkCriticalAlerts]);

  const dismissAlert = (alertId: string) => {
    const storedDismissed = localStorage.getItem('dismissedAlerts');
    const dismissedIds = storedDismissed ? JSON.parse(storedDismissed) : [];
    dismissedIds.push(alertId);
    localStorage.setItem('dismissedAlerts', JSON.stringify(dismissedIds));
    
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const dismissAll = () => {
    const allIds = alerts.map(a => a.id);
    const storedDismissed = localStorage.getItem('dismissedAlerts');
    const dismissedIds = storedDismissed ? JSON.parse(storedDismissed) : [];
    localStorage.setItem('dismissedAlerts', JSON.stringify([...dismissedIds, ...allIds]));
    
    setAlerts([]);
    setShowNotifications(false);
  };

  const getAlertIcon = (type: CriticalAlert['type']) => {
    switch (type) {
      case 'sin_stock': return Package;
      case 'stock_critico': return TrendingDown;
      case 'rop_alerta': return AlertTriangle;
      case 'po_urgente': return ShoppingCart;
      default: return AlertTriangle;
    }
  };

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  return (
    <div className="relative">
      {/* Bell Button in Navbar */}
      <Button
        onClick={() => setShowNotifications(!showNotifications)}
        size="icon"
        variant={alerts.length > 0 ? "destructive" : "ghost"}
        className={cn(
          "relative h-9 w-9",
          alerts.length > 0 && "animate-pulse hover:animate-none"
        )}
      >
        <Bell className="h-4 w-4" />
        {alerts.length > 0 && (
          <Badge 
            variant="secondary" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-white text-destructive border border-destructive"
          >
            {alerts.length}
          </Badge>
        )}
      </Button>

      {/* Notifications Dropdown Panel */}
      {showNotifications && (
        <div className="absolute top-12 right-0 z-50 w-80 max-h-96 overflow-hidden">
          <div className="bg-card border-2 border-destructive/20 rounded-lg shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-destructive/10 p-3 flex items-center justify-between border-b">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="font-semibold text-sm">Alertas de Inventario</span>
              </div>
              <div className="flex items-center gap-1">
                {criticalCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {criticalCount} críticas
                  </Badge>
                )}
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-6 w-6"
                  onClick={() => setShowNotifications(false)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Alerts List */}
            <div className="max-h-72 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  ✅ No hay alertas críticas
                </div>
              ) : (
                alerts.map(alert => {
                  const Icon = getAlertIcon(alert.type);
                  return (
                    <div 
                      key={alert.id}
                      className={cn(
                        "p-3 border-b last:border-0 hover:bg-muted/50 transition-colors",
                        alert.severity === 'critical' && "bg-destructive/5"
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className={cn(
                          "mt-0.5 p-1 rounded",
                          alert.severity === 'critical' ? "bg-destructive/20" : "bg-warning/20"
                        )}>
                          <Icon className={cn(
                            "h-3 w-3",
                            alert.severity === 'critical' ? "text-destructive" : "text-warning"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium">{alert.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{alert.message}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 flex-shrink-0"
                          onClick={() => dismissAlert(alert.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {alerts.length > 0 && (
              <div className="p-2 border-t bg-muted/30 flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Última revisión: {lastCheck?.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-xs h-6"
                  onClick={dismissAll}
                >
                  Descartar todas
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}