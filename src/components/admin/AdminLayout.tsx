import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, LogOut, Database, Brain, Building2, ShoppingCart, Target, BarChart3, CreditCard, TrendingUp, Menu, BookOpen, Users, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AIAssistant } from './AIAssistant';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Ejecutivo Analytics', href: '/admin/ejecutivo', icon: BarChart3 },
  { name: 'Estadísticas Ventas', href: '/admin/estadisticas-ventas', icon: TrendingUp },
  { name: 'Pagos & Finanzas', href: '/admin/pagos', icon: CreditCard },
  { name: 'Productos', href: '/admin/productos', icon: Package },
  { name: 'Pedidos', href: '/admin/pedidos', icon: ShoppingBag },
  { name: 'Clientes', href: '/admin/clientes', icon: Users },
  { name: 'Proveedores', href: '/admin/proveedores', icon: Building2 },
  { name: 'Órdenes de Compra', href: '/admin/ordenes-compra', icon: ShoppingCart },
  { name: 'Punto Reorden IA', href: '/admin/punto-reorden-ia', icon: Target },
  { name: 'Predicción IA', href: '/admin/inventario-ia', icon: Brain },
  { name: 'Campañas WhatsApp', href: '/admin/campanas-whatsapp', icon: MessageSquare },
  { name: 'Wiki', href: '/admin/wiki', icon: BookOpen },
  { name: 'Sincronizar DB', href: '/admin/sincronizar-productos', icon: Database },
];

function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state } = useSidebar();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'Sesión cerrada',
      description: 'Has cerrado sesión correctamente.',
    });
    navigate('/admin');
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b">
          <h2 className={`text-xl font-bold text-primary transition-opacity ${state === 'collapsed' ? 'opacity-0' : 'opacity-100'}`}>
            PlazaMedik Admin
          </h2>
          {state !== 'collapsed' && (
            <p className="text-sm text-muted-foreground">ERP Dashboard</p>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.href}>
                        <Icon className="h-5 w-5" />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-4 border-t">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5" />
            {state !== 'collapsed' && <span>Cerrar Sesión</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: 'Sesión cerrada',
      description: 'Has cerrado sesión correctamente.',
    });
    navigate('/admin');
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-primary">PlazaMedik Admin</h2>
            <p className="text-sm text-muted-foreground">ERP Dashboard</p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex">
          <AppSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col w-full">
          {/* Mobile Header */}
          <header className="h-14 border-b flex items-center px-4 md:px-6 bg-background sticky top-0 z-10">
            <MobileNav />
            <SidebarTrigger className="hidden md:flex" />
            <h1 className="text-lg font-semibold ml-4 md:ml-0">PlazaMedik Admin</h1>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>

        {/* AI Assistant Floating Button */}
        <AIAssistant />
      </div>
    </SidebarProvider>
  );
};
