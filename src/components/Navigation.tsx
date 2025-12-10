import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, MessageCircle, LogIn, LogOut, Gift } from "lucide-react";
import { getWhatsAppLink } from "@/lib/productUtils";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentCustomer } from "@/hooks/useCurrentCustomer";

interface NavigationProps {
  muted?: boolean;
}

const Navigation = ({ muted = false }: NavigationProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { data: customer } = useCurrentCustomer();

  const menuItems = [
    { label: "Inicio", path: "/" },
    { label: "Catálogo", path: "/catalogo" },
    { label: "Várices", path: "/medias-para-varices" },
    { label: "Trabajo de Pie", path: "/trabajo-de-pie" },
    { label: "Piel Sensible", path: "/piel-sensible" },
    { label: "Blog", path: "/blog" },
    { label: "Preguntas", path: "/preguntas-frecuentes" },
  ];

  return (
    <nav className={`sticky top-0 z-50 backdrop-blur-sm border-b shadow-soft transition-all ${
      muted 
        ? "bg-muted/80 border-muted-foreground/10" 
        : "bg-card/95 border-border"
    }`}>
      {/* Top Banner - Delivery Promise */}
      <div className={`py-2 transition-all ${
        muted 
          ? "bg-muted-foreground/20 text-muted-foreground" 
          : "bg-primary text-primary-foreground"
      }`}>
        <div className="container mx-auto px-4">
          <p className="text-center text-sm font-medium">
            🚚 Envíos rápidos: <span className="font-bold">24h en Lima</span> /{" "}
            <span className="font-bold">48h a todo Perú</span>
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">Pk</span>
            </div>
            <span className="font-semibold text-lg text-foreground">Plazamedik</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-6">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}

            {/* Botón Regala Salud - Para todos */}
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700 font-semibold"
            >
              <Link to="/invite">
                <Gift className="w-4 h-4 mr-2" />
                Regala Salud
              </Link>
            </Button>

            <Button
              asChild
              size="sm"
              className="bg-whatsapp-green hover:bg-whatsapp-green/90 text-white transition-all"
            >
              <a
                href={getWhatsAppLink("", "Hola, necesito asesoría sobre medias de compresión")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </a>
            </Button>

            {user ? (
              <Button asChild variant="outline" size="sm">
                <Link to="/mi-cuenta">
                  Mi Cuenta
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link to="/auth">
                  <LogIn className="w-4 h-4 mr-2" />
                  Entrar
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-foreground"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="lg:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors py-2"
                >
                  {item.label}
                </Link>
              ))}

              {/* Botón Regala Salud Mobile - Para todos */}
              <Button
                asChild
                variant="outline"
                className="w-full border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700 font-semibold"
              >
                <Link to="/invite" onClick={() => setIsOpen(false)}>
                  <Gift className="w-4 h-4 mr-2" />
                  Regala Salud
                </Link>
              </Button>

              <Button
                asChild
                className="bg-whatsapp-green hover:bg-whatsapp-green/90 text-white w-full transition-all"
              >
                <a
                  href={getWhatsAppLink("", "Hola, necesito asesoría sobre medias de compresión")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </a>
              </Button>

              {user ? (
                <Button asChild variant="outline" className="w-full">
                  <Link to="/mi-cuenta" onClick={() => setIsOpen(false)}>
                    Mi Cuenta
                  </Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="w-full">
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    <LogIn className="w-4 h-4 mr-2" />
                    Entrar
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;