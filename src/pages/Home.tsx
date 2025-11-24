import { useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import ProductCard from "@/components/ProductCard";
import { TestDialog } from "@/components/TestDialog";
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
  const [testOpen, setTestOpen] = useState(false);
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
              <div className="flex flex-wrap gap-3">
                <Badge className="bg-health-green text-white border-0 px-4 py-2 text-sm font-semibold shadow-lg">
                  <Truck className="w-4 h-4 mr-2" />
                  Entrega en menos de 48h en todo Perú
                </Badge>
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 px-4 py-2 text-sm font-semibold">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Paga al recibir
                </Badge>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Alivio de piernas cansadas y varices en 24 horas
              </h1>
              
              <p className="text-xl md:text-2xl text-blue-50 leading-relaxed">
                Te recomendaremos la media perfecta por WhatsApp en solo 2 minutos
              </p>

              {/* Guarantee Box Hero */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 space-y-2 border border-white/20">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-health-green" />
                  <span>Garantía de 7 días</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-health-green" />
                  <span>Cambio de talla sin costo</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-health-green" />
                  <span>Alivio desde las primeras 24 horas</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button
                  size="lg"
                  className="bg-health-green hover:bg-health-green/90 text-white text-lg px-8 py-6 h-auto shadow-hover transition-all hover:scale-105 font-semibold"
                  onClick={() => window.open(getWhatsAppLink("", "Hola, necesito asesoría sobre medias de compresión. Quiero aliviar mis piernas cansadas."), "_blank")}
                >
                  <MessageCircle className="w-6 h-6 mr-3" />
                  Consulta Gratis por WhatsApp
                  <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded">2 min</span>
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-2 border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-6 h-auto backdrop-blur-sm"
                  onClick={() => setTestOpen(true)}
                >
                  <Activity className="w-5 h-5 mr-2" />
                  Hacer el Test
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-4 text-blue-50">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm">+5,000 clientes satisfechos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  <span className="text-sm">Certificación médica</span>
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

      <TestDialog open={testOpen} onOpenChange={setTestOpen} />

      {/* Benefits Section - Enhanced with Delivery & Payment */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          {/* Main highlight boxes */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
            <Card className="border-2 border-health-green bg-health-green/5 hover:shadow-hover transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-health-green rounded-full flex items-center justify-center flex-shrink-0">
                    <Truck className="w-6 h-6 text-white" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-foreground">Entrega en menos de 48 horas</h3>
                    <p className="text-sm text-muted-foreground">Envíos rápidos a todo el Perú. Tu alivio no puede esperar.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary bg-primary/5 hover:shadow-hover transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-foreground">Pago Contraentrega</h3>
                    <p className="text-sm text-muted-foreground">Paga cuando recibas tu producto. Sin riesgos, 100% seguro.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary benefits */}
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
                  <ShieldCheck className="w-7 h-7 text-health-green" />
                </div>
                <h3 className="font-semibold text-foreground">Garantía 7 Días</h3>
                <p className="text-sm text-muted-foreground">Devolución sin costo</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all hover:shadow-hover">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="w-14 h-14 mx-auto bg-secondary/10 rounded-full flex items-center justify-center">
                  <Activity className="w-7 h-7 text-secondary" />
                </div>
                <h3 className="font-semibold text-foreground">Alivio Inmediato</h3>
                <p className="text-sm text-muted-foreground">Desde el primer día</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-all hover:shadow-hover">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="w-14 h-14 mx-auto bg-clinical-alert/10 rounded-full flex items-center justify-center">
                  <Award className="w-7 h-7 text-clinical-alert" />
                </div>
                <h3 className="font-semibold text-foreground">Cambio de Talla</h3>
                <p className="text-sm text-muted-foreground">Sin costo adicional</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Educational Section - Enhanced with Visual Content */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6 mb-12">
            <Badge className="bg-primary text-white text-sm px-4 py-2">Educación Rápida</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              ¿Qué compresión necesito?
            </h2>
            <p className="text-lg text-muted-foreground">
              Aprende en 30 segundos a elegir la compresión ideal para ti
            </p>
          </div>

          {/* Quick Education Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            <Card className="border-2 hover:border-primary transition-all">
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <HeartPulse className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-foreground">¿Qué es mmHg?</h3>
                <p className="text-sm text-muted-foreground">Es la medida de presión que ejercen las medias sobre tus piernas. A mayor mmHg, mayor compresión y alivio.</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-health-green transition-all">
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-health-green/10 rounded-full flex items-center justify-center">
                  <Activity className="w-8 h-8 text-health-green" />
                </div>
                <h3 className="font-bold text-foreground">15-20 vs 20-30 mmHg</h3>
                <p className="text-sm text-muted-foreground">15-20 para prevención, 20-30 para várices visibles. ¿Dudas? Te asesoramos gratis.</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-secondary transition-all">
              <CardContent className="p-6 text-center space-y-3">
                <div className="w-16 h-16 mx-auto bg-secondary/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="font-bold text-foreground">Elegir tu talla</h3>
                <p className="text-sm text-muted-foreground">Mide tu pantorrilla y tobillo. Te ayudamos por WhatsApp en 2 minutos.</p>
              </CardContent>
            </Card>
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

      {/* Featured Products with Delivery Badge */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-8">
            <Badge className="bg-health-green text-white text-sm px-4 py-2">Más Vendidas</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Productos Destacados
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Las medias de compresión más recomendadas por nuestros clientes
            </p>
          </div>

          {/* Delivery reminder before products */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-health-green/10 border-2 border-health-green rounded-xl p-4 flex items-center justify-center gap-3">
              <Truck className="w-5 h-5 text-health-green" />
              <span className="text-sm font-semibold text-foreground">
                Entrega en menos de 48 horas en todo Perú
              </span>
              <span className="hidden sm:inline text-sm text-muted-foreground">•</span>
              <span className="hidden sm:inline text-sm font-semibold text-foreground">
                Pago contraentrega disponible
              </span>
            </div>
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
              <Link to="/catalogo">
                Ver todos los productos
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Real UGC Style */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <Badge className="bg-health-green text-white text-sm px-4 py-2">Testimonios Reales</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Lo que dicen nuestros clientes
            </h2>
            <p className="text-lg text-muted-foreground">
              Experiencias reales de personas que aliviaron sus piernas
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="border-2 hover:shadow-hover transition-all">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Rosa M.</p>
                    <p className="text-xs text-muted-foreground">Enfermera - Lima</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic">
                  "Me alivió el dolor en horas. Trabajo 12 horas de pie y estas medias me cambiaron la vida. Ya no llego con las piernas hinchadas."
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-health-green" />
                  <span className="text-health-green font-medium">Compra verificada</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-hover transition-all">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Carmen L.</p>
                    <p className="text-xs text-muted-foreground">Vendedora - Arequipa</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic">
                  "Pude trabajar todo el día sin hinchazón. Llegó rápido y me ayudaron a escoger la talla por WhatsApp. Excelente servicio."
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-health-green" />
                  <span className="text-health-green font-medium">Compra verificada</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-hover transition-all">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-health-green/10 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-health-green" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Patricia S.</p>
                    <p className="text-xs text-muted-foreground">Docente - Cusco</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic">
                  "Mis várices mejoraron notablemente. El pago contraentrega me dio mucha confianza. Las recomiendo 100%."
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-health-green" />
                  <span className="text-health-green font-medium">Compra verificada</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust & Guarantees Section - Enhanced */}
      <section className="py-16 bg-gradient-trust text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl md:text-4xl font-bold">
                Compra con Total Confianza
              </h2>
              <p className="text-xl text-green-50">
                Tu satisfacción y seguridad son nuestra prioridad
              </p>
            </div>

            {/* Main guarantees - larger */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-8 space-y-4 hover:bg-white/25 transition-all">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-2xl">Garantía Real de 7 Días</h3>
                <p className="text-green-50">Si no sientes alivio o no te queda bien, te devolvemos tu dinero. Sin letra pequeña.</p>
              </div>

              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-8 space-y-4 hover:bg-white/25 transition-all">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <CreditCard className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-2xl">Pago Contraentrega</h3>
                <p className="text-green-50">Paga cuando recibas tu producto en mano. Cero riesgos, 100% seguro y confiable.</p>
              </div>
            </div>

            {/* Secondary benefits */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center space-y-3 hover:bg-white/20 transition-all">
                <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                  <Activity className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-lg">Cambio de Talla Gratis</h3>
                <p className="text-sm text-green-50">Si no te queda bien, lo cambiamos sin costo adicional</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center space-y-3 hover:bg-white/20 transition-all">
                <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-lg">Certificación Médica</h3>
                <p className="text-sm text-green-50">Productos con certificación terapéutica oficial</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center space-y-3 hover:bg-white/20 transition-all">
                <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center">
                  <Truck className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-lg">Envío en 48h Perú</h3>
                <p className="text-sm text-green-50">Entrega rápida garantizada en todo el territorio</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section - Enhanced with Benefits */}
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

            {/* Quick benefits reminder */}
            <div className="grid md:grid-cols-3 gap-4 py-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 text-sm">
                <Truck className="w-5 h-5" />
                <span>Envío en 48h</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm">
                <CreditCard className="w-5 h-5" />
                <span>Pago al recibir</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>Garantía 7 días</span>
              </div>
            </div>

            <Button
              size="lg"
              className="bg-health-green hover:bg-health-green/90 text-white text-lg px-10 py-7 h-auto shadow-2xl hover:scale-105 transition-all font-bold"
              onClick={() => window.open(getWhatsAppLink("", "Hola, quiero consultar sobre medias de compresión"), "_blank")}
            >
              <MessageCircle className="w-6 h-6 mr-3" />
              Consulta Gratis por WhatsApp
              <span className="ml-3 bg-white/20 px-3 py-1 rounded text-sm font-normal">2 min</span>
            </Button>
            
            <p className="text-sm text-blue-100 mt-4">
              <CheckCircle2 className="w-4 h-4 inline mr-1" />
              Respuesta en menos de 5 minutos · Lunes a Sábado 9am - 7pm
            </p>
          </div>
        </div>
      </section>

      {/* Mobile Sticky CTA - WhatsApp */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-health-green to-health-green/90 p-4 shadow-2xl">
        <Button
          className="w-full bg-white text-health-green hover:bg-white/90 font-bold text-lg py-6 h-auto"
          onClick={() => window.open(getWhatsAppLink("", "Hola, quiero consultar sobre medias de compresión"), "_blank")}
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Consulta Gratis
          <span className="ml-2 text-xs bg-health-green/20 px-2 py-1 rounded">2 min</span>
        </Button>
      </div>

      <Footer />
    </div>
  );
};

export default Home;
