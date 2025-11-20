import { Toaster } from "@/components/ui/toaster";
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
import AdminLogin from "./pages/admin/AdminLogin";
import Dashboard from "./pages/admin/Dashboard";
import Orders from "./pages/admin/Orders";
import Products from "./pages/admin/Products";
import InventoryIA from "./pages/admin/InventoryIA";
import InventoryDashboard from "./pages/admin/InventoryDashboard";
import SyncProducts from "./pages/admin/SyncProducts";
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

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route
              path="/admin/inventario-dashboard"
              element={
                <ProtectedAdminRoute>
                  <InventoryDashboard />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/inventario-ia"
              element={
                <ProtectedAdminRoute>
                  <InventoryIA />
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
                  <Orders />
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
              path="/admin/sincronizar-productos"
              element={
                <ProtectedAdminRoute>
                  <SyncProducts />
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
