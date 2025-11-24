import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
  Award,
  Users,
  HeartPulse,
  Activity,
  Zap,
  Shield,
  BadgeCheck,
  Heart
} from "lucide-react";

const Home = () => {
  const [testOpen, setTestOpen] = useState(false);
  // Use grouped products to avoid showing duplicates
  const { products, loading } = useProducts(false, true);
  const featuredProducts = products.slice(0, 4);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <WhatsAppFloat />

      {/* Hero Section - Medical Professional - Fully Responsive */}
      <section className="relative bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] opacity-5 bg-cover bg-center" />
        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:py-24 relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-7xl mx-auto">
            {/* Content Column - Always on top in mobile */}
            <div className="space-y-4 sm:space-y-6 text-white order-1">
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Badge className="bg-health-green text-white border-0 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold shadow-lg">
                  <Truck className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  Entrega en menos de 48h en todo Perú
                </Badge>
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold">
                  <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  Paga al recibir
                </Badge>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Alivio de piernas cansadas y varices en 24 horas
              </h1>
              
              <p className="text-lg sm:text-xl md:text-2xl text-blue-50 leading-relaxed">
                Te recomendaremos la media perfecta por WhatsApp en solo 2 minutos
              </p>

              {/* Guarantee Box Hero */}
              <div className="bg-white/10 backdrop-blur-md rounded-lg sm:rounded-xl p-3 sm:p-4 space-y-1.5 sm:space-y-2 border border-white/20">
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-health-green flex-shrink-0" />
                  <span>Garantía de 7 días</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-health-green flex-shrink-0" />
                  <span>Cambio de talla sin costo</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-health-green flex-shrink-0" />
                  <span>Alivio desde las primeras 24 horas</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
                <Button
                  size="lg"
                  className="bg-whatsapp-green hover:bg-whatsapp-green/90 text-white text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto shadow-hover transition-all hover:scale-105 font-semibold w-full sm:w-auto"
                  onClick={() => window.open(getWhatsAppLink("", "Hola, necesito asesoría sobre medias de compresión. Quiero aliviar mis piernas cansadas."), "_blank")}
                >
                  <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="flex-1">Consulta Gratis por WhatsApp</span>
                  <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded flex-shrink-0">2 min</span>
                </Button>
                
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 border-2 border-white text-white hover:bg-white hover:text-primary text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 h-auto backdrop-blur-sm w-full sm:w-auto transition-all"
                  onClick={() => setTestOpen(true)}
                >
                  <Activity className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                  Hacer el Test
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-3 sm:pt-4 text-blue-50 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>+5,000 clientes satisfechos</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span>Certificación médica</span>
                </div>
              </div>
            </div>

            {/* Image Column - Hidden on mobile, shown on lg+ */}
            <div className="relative hidden lg:block order-2">
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
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-12 sm:py-16 bg-background"
      >
        <div className="container mx-auto px-4 sm:px-6">
          {/* Main highlight boxes */}
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto mb-8 sm:mb-12">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="border-2 border-health-green bg-health-green/5 hover:shadow-hover transition-all hover:scale-[1.02]">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-health-green rounded-full flex items-center justify-center flex-shrink-0">
                      <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-bold text-base sm:text-lg text-foreground">Entrega en menos de 48 horas</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Envíos rápidos a todo el Perú. Tu alivio no puede esperar.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="border-2 border-primary bg-primary/5 hover:shadow-hover transition-all hover:scale-[1.02]">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <h3 className="font-bold text-base sm:text-lg text-foreground">Pago Contraentrega</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Paga cuando recibas tu producto. Sin riesgos, 100% seguro.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Secondary benefits */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {[
              { icon: Users, title: "Asesoría Personalizada", desc: "Te ayudamos a elegir", color: "primary" },
              { icon: ShieldCheck, title: "Garantía 7 Días", desc: "Devolución sin costo", color: "health-green" },
              { icon: Activity, title: "Alivio Inmediato", desc: "Desde el primer día", color: "secondary" },
              { icon: Award, title: "Cambio de Talla", desc: "Sin costo adicional", color: "clinical-alert" }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
              >
                <Card className="border-2 hover:border-primary transition-all hover:shadow-hover hover:-translate-y-1">
                  <CardContent className="pt-4 sm:pt-6 text-center space-y-2 sm:space-y-3 px-2 sm:px-4 pb-4 sm:pb-6">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 mx-auto bg-${benefit.color}/10 rounded-full flex items-center justify-center`}>
                      <benefit.icon className={`w-6 h-6 sm:w-7 sm:h-7 text-${benefit.color}`} />
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base text-foreground leading-tight">{benefit.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{benefit.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Educational Section - Enhanced with Visual Content */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-12 sm:py-16 bg-muted/30"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-6 mb-8 sm:mb-12"
          >
            <Badge className="bg-primary text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2">Educación Rápida</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground px-4">
              ¿Qué compresión necesito?
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground px-4">
              Aprende en 30 segundos a elegir la compresión ideal para ti
            </p>
          </motion.div>

          {/* Quick Education Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto mb-8 sm:mb-12">
            <Card className="border-2 hover:border-primary transition-all">
              <CardContent className="p-4 sm:p-6 text-center space-y-2 sm:space-y-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <HeartPulse className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-foreground">¿Qué es mmHg?</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">Es la medida de presión que ejercen las medias sobre tus piernas. A mayor mmHg, mayor compresión y alivio.</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-health-green transition-all">
              <CardContent className="p-4 sm:p-6 text-center space-y-2 sm:space-y-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-health-green/10 rounded-full flex items-center justify-center">
                  <Activity className="w-7 h-7 sm:w-8 sm:h-8 text-health-green" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-foreground">15-20 vs 20-30 mmHg</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">15-20 para prevención, 20-30 para várices visibles. ¿Dudas? Te asesoramos gratis.</p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-secondary transition-all sm:col-span-2 lg:col-span-1">
              <CardContent className="p-4 sm:p-6 text-center space-y-2 sm:space-y-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-secondary/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-secondary" />
                </div>
                <h3 className="font-bold text-sm sm:text-base text-foreground">Elegir tu talla</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">Mide tu pantorrilla y tobillo. Te ayudamos por WhatsApp en 2 minutos.</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <Card className="border-2 hover:border-primary transition-all overflow-hidden group">
              <div className="h-2 sm:h-3 bg-gradient-to-r from-primary to-health-green" />
              <CardContent className="p-4 sm:p-6 lg:p-8 space-y-3 sm:space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">15-20 mmHg</h3>
                    <Badge variant="outline" className="text-xs sm:text-sm">Compresión Suave</Badge>
                  </div>
                  <Activity className="w-8 h-8 sm:w-10 sm:h-10 text-primary flex-shrink-0" />
                </div>

                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Ideal para prevención y molestias leves
                </p>

                <ul className="space-y-2 sm:space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-health-green mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Piernas cansadas al final del día</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-health-green mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Hinchazón leve en tobillos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-health-green mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Trabajos de pie o sentado prolongado</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-health-green mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Prevención durante embarazo</span>
                  </li>
                </ul>

                <Button 
                  className="w-full mt-4 bg-primary hover:bg-primary/90 text-sm sm:text-base py-5 sm:py-6"
                  onClick={() => window.open(getWhatsAppLink("", "Hola, necesito medias de compresión 15-20 mmHg"), "_blank")}
                >
                  Consultar por WhatsApp
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-secondary transition-all overflow-hidden group">
              <div className="h-2 sm:h-3 bg-gradient-to-r from-secondary to-health-green" />
              <CardContent className="p-4 sm:p-6 lg:p-8 space-y-3 sm:space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">20-30 mmHg</h3>
                    <Badge variant="outline" className="text-xs sm:text-sm border-secondary text-secondary">Compresión Moderada</Badge>
                  </div>
                  <HeartPulse className="w-8 h-8 sm:w-10 sm:h-10 text-secondary flex-shrink-0" />
                </div>

                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Recomendado para problemas circulatorios moderados
                </p>

                <ul className="space-y-2 sm:space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-health-green mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Varices visibles y arañitas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-health-green mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Hinchazón moderada persistente</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-health-green mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Post-cirugía de varices</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-health-green mt-0.5 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">Recomendación médica específica</span>
                  </li>
                </ul>

                <Button 
                  className="w-full mt-4 bg-secondary hover:bg-secondary/90 text-sm sm:text-base py-5 sm:py-6"
                  onClick={() => window.open(getWhatsAppLink("", "Hola, necesito medias de compresión 20-30 mmHg"), "_blank")}
                >
                  Consultar por WhatsApp
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8 sm:mt-10 px-4">
            <p className="text-sm sm:text-base text-muted-foreground mb-4">¿Aún tienes dudas sobre qué compresión elegir?</p>
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-primary text-primary hover:bg-primary hover:text-white text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6"
              onClick={() => window.open(getWhatsAppLink("", "Hola, no estoy seguro qué nivel de compresión necesito"), "_blank")}
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Habla con un asesor
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Featured Products with Delivery Badge */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-12 sm:py-16 bg-background"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-3 sm:space-y-4 mb-6 sm:mb-8"
          >
            <Badge className="bg-health-green text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2">Más Vendidas</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground px-4">
              Productos Destacados
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Las medias de compresión más recomendadas por nuestros clientes
            </p>
          </motion.div>

          {/* Delivery reminder before products */}
          <div className="max-w-3xl mx-auto mb-6 sm:mb-8">
            <div className="bg-health-green/10 border-2 border-health-green rounded-lg sm:rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-health-green flex-shrink-0" />
                <span className="text-xs sm:text-sm font-semibold text-foreground text-center sm:text-left">
                  Entrega en menos de 48 horas en todo Perú
                </span>
              </div>
              <span className="hidden sm:inline text-sm text-muted-foreground">•</span>
              <span className="text-xs sm:text-sm font-semibold text-foreground text-center sm:text-left">
                Pago contraentrega disponible
              </span>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} featured />
              ))}
            </div>
          )}

          <div className="text-center mt-8 sm:mt-10">
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-primary text-primary hover:bg-primary hover:text-white text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6"
              asChild
            >
              <Link to="/catalogo">
                Ver todos los productos
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Testimonials Section - Real UGC Style */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-12 sm:py-16 bg-background"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-3 sm:space-y-4 mb-8 sm:mb-12"
          >
            <Badge className="bg-health-green text-white text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2">Testimonios Reales</Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground px-4">
              Lo que dicen nuestros clientes
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground px-4">
              Experiencias reales de personas que aliviaron sus piernas
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            <Card className="border-2 hover:shadow-hover transition-all">
              <CardContent className="pt-4 sm:pt-6 space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm sm:text-base text-foreground">Rosa M.</p>
                    <p className="text-xs text-muted-foreground">Enfermera - Lima</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground italic leading-relaxed">
                  "Me alivió el dolor en horas. Trabajo 12 horas de pie y estas medias me cambiaron la vida. Ya no llego con las piernas hinchadas."
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-health-green flex-shrink-0" />
                  <span className="text-health-green font-medium">Compra verificada</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-hover transition-all">
              <CardContent className="pt-4 sm:pt-6 space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm sm:text-base text-foreground">Carmen L.</p>
                    <p className="text-xs text-muted-foreground">Vendedora - Arequipa</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground italic leading-relaxed">
                  "Pude trabajar todo el día sin hinchazón. Llegó rápido y me ayudaron a escoger la talla por WhatsApp. Excelente servicio."
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-health-green flex-shrink-0" />
                  <span className="text-health-green font-medium">Compra verificada</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-hover transition-all sm:col-span-2 lg:col-span-1">
              <CardContent className="pt-4 sm:pt-6 space-y-3 sm:space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-health-green/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-health-green" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm sm:text-base text-foreground">Patricia S.</p>
                    <p className="text-xs text-muted-foreground">Docente - Cusco</p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground italic leading-relaxed">
                  "Mis várices mejoraron notablemente. El pago contraentrega me dio mucha confianza. Las recomiendo 100%."
                </p>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-health-green flex-shrink-0" />
                  <span className="text-health-green font-medium">Compra verificada</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.section>

      {/* Trust Section - Enhanced Visual Design */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-12 sm:py-16 md:py-24 bg-gradient-to-br from-muted/20 via-background to-muted/30 relative overflow-hidden"
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-72 h-72 bg-primary rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mb-10 sm:mb-16 max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4 sm:mb-6">
              <Shield className="w-4 h-4" />
              <span>100% Garantizado</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-foreground leading-tight">
              Compra con total confianza
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
              Tu satisfacción y seguridad son nuestra prioridad
            </p>
          </motion.div>

          {/* Trust Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-7xl mx-auto">
            {/* Card 1 - Garantía */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group bg-card p-6 sm:p-8 rounded-3xl shadow-soft hover:shadow-hover transition-all duration-500 border border-border/50 hover:border-primary/30 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 sm:mb-6"
                >
                  <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                </motion.div>
                <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 text-foreground">
                  Garantía Real 7 Días
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Cambio o devolución sin complicaciones
                </p>
              </div>
            </motion.div>

            {/* Card 2 - Envío */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group bg-card p-6 sm:p-8 rounded-3xl shadow-soft hover:shadow-hover transition-all duration-500 border border-border/50 hover:border-secondary/30 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="w-14 h-14 sm:w-16 sm:h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mb-5 sm:mb-6"
                >
                  <Truck className="w-7 h-7 sm:w-8 sm:h-8 text-secondary" />
                </motion.div>
                <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 text-foreground">
                  Envío Rápido
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Menos de 48 horas en todo Perú
                </p>
              </div>
            </motion.div>

            {/* Card 3 - Cambio de Talla */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group bg-card p-6 sm:p-8 rounded-3xl shadow-soft hover:shadow-hover transition-all duration-500 border border-border/50 hover:border-health-green/30 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-health-green/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="w-14 h-14 sm:w-16 sm:h-16 bg-health-green/10 rounded-2xl flex items-center justify-center mb-5 sm:mb-6"
                >
                  <BadgeCheck className="w-7 h-7 sm:w-8 sm:h-8 text-health-green" />
                </motion.div>
                <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 text-foreground">
                  Cambio de Talla Gratis
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Sin costo adicional si necesitas otra talla
                </p>
              </div>
            </motion.div>

            {/* Card 4 - Mejoras */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group bg-card p-6 sm:p-8 rounded-3xl shadow-soft hover:shadow-hover transition-all duration-500 border border-border/50 hover:border-clinical-alert/30 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-clinical-alert/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="w-14 h-14 sm:w-16 sm:h-16 bg-clinical-alert/10 rounded-2xl flex items-center justify-center mb-5 sm:mb-6"
                >
                  <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-clinical-alert" />
                </motion.div>
                <h3 className="font-bold text-lg sm:text-xl mb-2 sm:mb-3 text-foreground">
                  Mejoras en 24 Horas
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Sensación de alivio desde el primer uso
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Final CTA Section - Enhanced with Benefits */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="py-16 sm:py-20 bg-primary text-white mb-16 sm:mb-0"
      >
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
            <Zap className="w-12 h-12 sm:w-16 sm:h-16 mx-auto" />
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold px-4">
              ¿Listo para sentir el alivio?
            </h2>
            <p className="text-base sm:text-xl text-blue-50 px-4">
              Recibe asesoría personalizada en 2 minutos y encuentra la media perfecta para ti
            </p>

            {/* Quick benefits reminder */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 py-4 sm:py-6 max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Truck className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-center sm:text-left">Envío en 48h</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-center sm:text-left">Pago al recibir</span>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="text-center sm:text-left">Garantía 7 días</span>
              </div>
            </div>

            <Button
              size="lg"
              className="bg-health-green hover:bg-health-green/90 text-white text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 h-auto shadow-2xl hover:scale-105 transition-all font-bold w-full sm:w-auto"
              onClick={() => window.open(getWhatsAppLink("", "Hola, quiero consultar sobre medias de compresión"), "_blank")}
            >
              <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0" />
              <span>Consulta Gratis por WhatsApp</span>
              <span className="ml-2 sm:ml-3 bg-white/20 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-normal">2 min</span>
            </Button>
            
            <p className="text-xs sm:text-sm text-blue-100 mt-3 sm:mt-4 px-4">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 inline mr-1" />
              Respuesta en menos de 5 minutos · Lunes a Sábado 9am - 7pm
            </p>
          </div>
        </div>
      </motion.section>

      {/* Mobile Sticky CTA - WhatsApp */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-health-green to-health-green/90 p-3 shadow-2xl border-t border-white/10">
        <Button
          className="w-full bg-white text-health-green hover:bg-white/90 font-bold text-base py-5 h-auto"
          onClick={() => window.open(getWhatsAppLink("", "Hola, quiero consultar sobre medias de compresión"), "_blank")}
        >
          <MessageCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          <span className="flex-1">Consulta Gratis</span>
          <span className="ml-2 text-xs bg-health-green/20 px-2 py-1 rounded flex-shrink-0">2 min</span>
        </Button>
      </div>

      <Footer />
    </div>
  );
};

export default Home;
