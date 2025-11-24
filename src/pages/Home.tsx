import { useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useProducts } from "@/hooks/useProducts";
import { getWhatsAppLink } from "@/lib/productUtils";
import { 
  MessageCircle, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  ArrowRight,
  CheckCircle2,
  Clock,
  Award,
  Users,
  HeartPulse,
  Activity,
  Zap
} from "lucide-react";

const Home = () => {
  const { products, loading } = useProducts();
  const featuredProducts = products.slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <WhatsAppFloat />

      {/* Hero Section - Medical Professional */}
      <section className="relative bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5 bg-cover bg-center" />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="space-y-6 text-white">
              <Badge className="bg-health-green text-white border-0 px-4 py-2 text-sm font-medium">
                <Clock className="w-4 h-4 mr-2" />
                Entrega en 24-48 horas
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Alivio de piernas cansadas y varices en 24 horas
              </h1>
              
              <p className="text-xl md:text-2xl text-blue-50 leading-relaxed">
                Te recomendaremos la media perfecta por WhatsApp en solo 2 minutos
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  size="lg"
                  className="bg-health-green hover:bg-health-green/90 text-white text-lg px-8 py-6 h-auto shadow-hover transition-all hover:scale-105"
                  onClick={() => window.open(getWhatsAppLink("", "Hola, necesito asesoría sobre medias de compresión. Quiero aliviar mis piernas cansadas."), "_blank")}
                >
                  <MessageCircle className="w-6 h-6 mr-3" />
                  Consulta Gratis por WhatsApp
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-2 border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-6 h-auto backdrop-blur-sm"
                  asChild
                >
                  <Link to="/catalog">
                    Ver Catálogo
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>

              <div className="flex items-center gap-6 pt-6 text-blue-50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm">+5,000 clientes satisfechos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  <span className="text-sm">Garantía médica</span>
                </div>
              </div>
            </div>

            <div className="relative hidden md:block">
              <div className="absolute -inset-4 bg-health-green/20 rounded-3xl blur-2xl" />
              <img
                src="/placeholder.svg"
                alt="Persona usando medias de compresión"
                className="relative rounded-2xl shadow-2xl w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section - Iconography Minimalist */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            <Card className="border-2 hover:border-primary transition-all hover:shadow-hover">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="w-14 h-14 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Asesoría Personalizada</h3>
                <p className="text-sm text-muted-foreground">Te ayudamos a elegir</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all hover:shadow-hover">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="w-14 h-14 mx-auto bg-health-green/10 rounded-full flex items-center justify-center">
                  <Truck className="w-7 h-7 text-health-green" />
                </div>
                <h3 className="font-semibold text-foreground">Envío Rápido</h3>
                <p className="text-sm text-muted-foreground">24-48 horas</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all hover:shadow-hover">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="w-14 h-14 mx-auto bg-secondary/10 rounded-full flex items-center justify-center">
                  <CreditCard className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="font-semibold text-foreground">Pago Contraentrega</h3>
                <p className="text-sm text-muted-foreground">Seguro y fácil</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all hover:shadow-hover">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="w-14 h-14 mx-auto bg-clinical-alert/10 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-clinical-alert" />
                </div>
                <h3 className="font-semibold text-foreground">Garantía de Talla</h3>
                <p className="text-sm text-muted-foreground">Cambio gratis</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Educational Section - Simple Cards */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6 mb-12">
            <Badge className="bg-primary text-white text-sm px-4 py-2">Guía Médica</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              ¿Qué compresión necesito?
            </h2>
            <p className="text-lg text-muted-foreground">
              Elige según tu nivel de molestia y actividad diaria
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-2 hover:border-primary transition-all overflow-hidden group">
              <div className="h-3 bg-gradient-to-r from-primary to-health-green" />
              <CardContent className="p-8 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">15-20 mmHg</h3>
                    <Badge variant="outline" className="text-sm">Compresión Suave</Badge>
                  </div>
                  <Activity className="w-10 h-10 text-primary" />
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  Ideal para prevención y molestias leves
                </p>

                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-health-green mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Piernas cansadas al final del día</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-health-green mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Hinchazón leve en tobillos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-health-green mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Trabajos de pie o sentado prolongado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-health-green mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Prevención durante embarazo</span>
                  </li>
                </ul>

                <Button 
                  className="w-full mt-4 bg-primary hover:bg-primary/90"
                  onClick={() => window.open(getWhatsAppLink("", "Hola, necesito medias de compresión 15-20 mmHg"), "_blank")}
                >
                  Consultar por WhatsApp
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-secondary transition-all overflow-hidden group">
              <div className="h-3 bg-gradient-to-r from-secondary to-health-green" />
              <CardContent className="p-8 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">20-30 mmHg</h3>
                    <Badge variant="outline" className="text-sm border-secondary text-secondary">Compresión Moderada</Badge>
                  </div>
                  <HeartPulse className="w-10 h-10 text-secondary" />
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  Recomendado para problemas circulatorios moderados
                </p>

                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-health-green mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Varices visibles y arañitas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-health-green mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Hinchazón moderada persistente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-health-green mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Post-cirugía de varices</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-health-green mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Recomendación médica específica</span>
                  </li>
                </ul>

                <Button 
                  className="w-full mt-4 bg-secondary hover:bg-secondary/90"
                  onClick={() => window.open(getWhatsAppLink("", "Hola, necesito medias de compresión 20-30 mmHg"), "_blank")}
                >
                  Consultar por WhatsApp
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-10">
            <p className="text-muted-foreground mb-4">¿Aún tienes dudas sobre qué compresión elegir?</p>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-primary text-primary hover:bg-primary hover:text-white"
              onClick={() => window.open(getWhatsAppLink("", "Hola, no estoy seguro qué nivel de compresión necesito"), "_blank")}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Habla con un asesor
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <Badge className="bg-health-green text-white text-sm px-4 py-2">Más Vendidas</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Productos Destacados
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Las medias de compresión más recomendadas por nuestros clientes
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} featured />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-primary text-primary hover:bg-primary hover:text-white"
              asChild
            >
              <Link to="/catalog">
                Ver todos los productos
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-gradient-trust text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">
                Compra con Total Confianza
              </h2>
              <p className="text-xl text-green-50">
                Tu satisfacción es nuestra prioridad
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center space-y-3 hover:bg-white/20 transition-all">
                <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-lg">Cambio de Talla Gratis</h3>
                <p className="text-sm text-green-50">Si no te queda bien, lo cambiamos sin costo</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center space-y-3 hover:bg-white/20 transition-all">
                <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                  <CreditCard className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-lg">Pago al Recibir</h3>
                <p className="text-sm text-green-50">Paga cuando tengas tu producto en mano</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center space-y-3 hover:bg-white/20 transition-all">
                <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-lg">Compra Segura</h3>
                <p className="text-sm text-green-50">Productos médicos certificados</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center space-y-3 hover:bg-white/20 transition-all">
                <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                  <Truck className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-lg">Envíos a Todo Perú</h3>
                <p className="text-sm text-green-50">Entrega rápida en todo el país</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <Zap className="w-16 h-16 mx-auto" />
            <h2 className="text-3xl md:text-5xl font-bold">
              ¿Listo para sentir el alivio?
            </h2>
            <p className="text-xl text-blue-50">
              Recibe asesoría personalizada en 2 minutos y encuentra la media perfecta para ti
            </p>
            <Button
              size="lg"
              className="bg-health-green hover:bg-health-green/90 text-white text-lg px-10 py-7 h-auto shadow-2xl hover:scale-105 transition-all mt-6"
              onClick={() => window.open(getWhatsAppLink("", "Hola, quiero consultar sobre medias de compresión"), "_blank")}
            >
              <MessageCircle className="w-6 h-6 mr-3" />
              Consulta Gratis por WhatsApp
            </Button>
            <p className="text-sm text-blue-100 mt-4">
              <CheckCircle2 className="w-4 h-4 inline mr-1" />
              Respuesta en menos de 5 minutos · Lunes a Sábado 9am - 7pm
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
