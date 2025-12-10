import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ReferralDashboard from "@/components/ReferralDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, User } from "lucide-react";
import { motion } from "framer-motion";

export default function MiCuenta() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { data: customer, isLoading } = useCurrentCustomer();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-muted/30 to-background">
      <Navigation />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Mi Cuenta</h1>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout} size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                    <Skeleton className="h-16" />
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </div>
              <Skeleton className="h-64" />
            </div>
          ) : customer ? (
            <ReferralDashboard customer={customer} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Completa tu perfil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  No encontramos un perfil de cliente asociado a tu cuenta. 
                  Realiza tu primer pedido para crear tu perfil y acceder al programa de referidos.
                </p>
                <Button onClick={() => navigate("/catalogo")}>
                  Ver Catálogo
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
