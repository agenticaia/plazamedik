import { Toaster } from "@/components/ui/toaster";
import AIAgentSettings from "./pages/admin/AIAgentSettings";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ProductDetail from "./pages/ProductDetail";
import Auth from "./pages/Auth";
import Varices from "./pages/Varices";
import TrabajoPie from "./pages/TrabajoPie";
import PielSensible from "./pages/PielSensible";
import Blog from "./pages/Blog";
import FAQ from "./pages/FAQ";
import NotFound from "./pages/NotFound";
import MediasElasticasParaVarices from "@/pages/blog/MediasElasticasParaVarices";
import TiposMediasCompresion from "@/pages/blog/TiposMediasCompresion";
import MediasAntiembolicas from "@/pages/blog/MediasAntiembolicas";
import ComoElegirTallaCorrecta from "@/pages/blog/ComoElegirTallaCorrecta";
import Seguimiento from "./pages/Seguimiento";
import HacerPedidoWA from "./pages/HacerPedidoWA";
import AdminLogin from "./pages/admin/AdminLogin";
import Dashboard from "./pages/admin/Dashboard";
import Pedidos from "./pages/admin/Pedidos";
import PedidosPage from "./pages/admin/pedidos";
import CrearPedidoPage from "./pages/admin/pedidos/create";
import EditarPedidoPage from "./pages/admin/pedidos/[id]/edit";
import DetallePedidoPage from "./pages/admin/pedidos/[id]";
import Clientes from "./pages/admin/Clientes";
import InventoryIA from "./pages/admin/InventoryIA";
import SyncProducts from "./pages/admin/SyncProducts";
import SuppliersManagement from "./pages/admin/SuppliersManagement";
import PurchaseOrders from "./pages/admin/PurchaseOrders";
import Products from "./pages/admin/Products";
import ReorderPointsIA from "./pages/admin/ReorderPointsIA";
import ExecutiveDashboard from "./pages/admin/ExecutiveDashboard";
import PaymentDashboard from "./pages/admin/PaymentDashboard";
import SalesStatistics from "./pages/admin/SalesStatistics";
import Wiki from "./pages/admin/Wiki";
import CampanasWhatsApp from "./pages/admin/CampanasWhatsApp";
import Invite from "./pages/Invite";
import { ProtectedAdminRoute } from "./components/ProtectedAdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/catalogo" element={<Catalog />} />
            <Route path="/producto/:categorySlug/:productSlug" element={<ProductDetail />} />
            <Route path="/producto" element={<ProductDetail />} />
            <Route path="/medias-para-varices" element={<Varices />} />
            <Route path="/trabajo-de-pie" element={<TrabajoPie />} />
            <Route path="/piel-sensible" element={<PielSensible />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/medias-elasticas-para-varices" element={<MediasElasticasParaVarices />} />
            <Route path="/blog/tipos-de-medias-de-compresion" element={<TiposMediasCompresion />} />
            <Route path="/blog/medias-antiembolicas" element={<MediasAntiembolicas />} />
            <Route path="/blog/como-elegir-talla-correcta" element={<ComoElegirTallaCorrecta />} />
            <Route path="/preguntas-frecuentes" element={<FAQ />} />
            <Route path="/seguimiento" element={<Seguimiento />} />
            <Route path="/hacer-pedido-wa" element={<HacerPedidoWA />} />
            <Route path="/invite/:code" element={<Invite />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route
              path="/admin/inventario-ia"
              element={
                <ProtectedAdminRoute>
                  <InventoryIA />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/punto-reorden-ia"
              element={
                <ProtectedAdminRoute>
                  <ReorderPointsIA />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/agente-ia"
              element={
                <ProtectedAdminRoute>
                  <AIAgentSettings />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedAdminRoute>
                  <Dashboard />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/pedidos"
              element={
                <ProtectedAdminRoute>
                  <PedidosPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/pedidos/create"
              element={
                <ProtectedAdminRoute>
                  <CrearPedidoPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/pedidos/:id"
              element={
                <ProtectedAdminRoute>
                  <DetallePedidoPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/pedidos/:id/edit"
              element={
                <ProtectedAdminRoute>
                  <EditarPedidoPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/clientes"
              element={
                <ProtectedAdminRoute>
                  <Clientes />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/sincronizar-productos"
              element={
                <ProtectedAdminRoute>
                  <SyncProducts />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/proveedores"
              element={
                <ProtectedAdminRoute>
                  <SuppliersManagement />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/ordenes-compra"
              element={
                <ProtectedAdminRoute>
                  <PurchaseOrders />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/productos"
              element={
                <ProtectedAdminRoute>
                  <Products />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/ejecutivo"
              element={
                <ProtectedAdminRoute>
                  <ExecutiveDashboard />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/pagos"
              element={
                <ProtectedAdminRoute>
                  <PaymentDashboard />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/estadisticas-ventas"
              element={
                <ProtectedAdminRoute>
                  <SalesStatistics />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/wiki"
              element={
                <ProtectedAdminRoute>
                  <Wiki />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/campanas-whatsapp"
              element={
                <ProtectedAdminRoute>
                  <CampanasWhatsApp />
                </ProtectedAdminRoute>
              }
            />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
