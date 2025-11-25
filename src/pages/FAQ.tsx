import Navigation from "@/components/Navigation";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MessageCircle } from "lucide-react";
import { getWhatsAppLink } from "@/lib/productUtils";

const FAQ = () => {
  const faqs = [
    {
      question: "¿Cómo sé qué talla necesito?",
      answer: "Escríbenos por WhatsApp y te guiamos paso a paso con fotos para tomar tus medidas correctamente. Es súper fácil y te toma menos de 5 minutos. Mides circunferencia de tobillo, pantorrilla y muslo (si aplica), más la longitud de tu pierna. No te preocupes, te explicamos todo y si no te queda bien, te cambiamos la talla sin costo adicional."
    },
    {
      question: "¿Dan mucho calor estas medias?",
      answer: "Las medias Relaxsan Basic están diseñadas con tejido transpirable. Sin embargo, si vives en clima muy cálido (como la costa peruana en verano) o sudas mucho, te recomendamos las opciones con punta abierta o nuestros modelos especiales ultra-transpirables. Escríbenos por WhatsApp y te recomendamos la mejor opción según tu clima y necesidades. La mayoría de nuestros clientes en Lima las usa sin problemas todo el año."
    },
    {
      question: "¿Puedo usarlas todos los días?",
      answer: "Sí, y de hecho deberías. Estas medias están diseñadas para uso diario. Para obtener mejores resultados en el tratamiento de várices o prevención, úsalas todos los días durante tus actividades. Póntelas por la mañana al levantarte y quítatelas por la noche antes de dormir. Así funcionan mejor y verás resultados más rápido. El 87% de nuestros clientes siente alivio desde el primer día de uso."
    },
    {
      question: "¿Cuánto tiempo duran?",
      answer: "Con cuidado adecuado (lavado a mano o en bolsa protectora en lavadora, sin secar en secadora), las medias Relaxsan Basic duran entre 3 y 6 meses con uso diario. La compresión se mantiene efectiva durante todo este tiempo si sigues las instrucciones. Te enviamos una guía completa de cuidado con tu pedido. Siguiéndola, durarán más tiempo y funcionarán mejor."
    },
    {
      question: "¿Son difíciles de poner?",
      answer: "Al principio toma un poco de práctica (como todo), pero una vez que aprendes la técnica correcta, es muy fácil y rápido. Te enviamos instrucciones detalladas con tu pedido. Si necesitas ayuda, escríbenos por WhatsApp y te explicamos los mejores trucos para ponértelas sin esfuerzo. Consejo: póntelas en la mañana antes de que tus piernas se hinchen."
    },
    {
      question: "¿Cómo es el proceso de compra?",
      answer: "Todo por WhatsApp para brindarte atención personalizada: 1) Nos escribes, 2) Te ayudamos a elegir producto y talla ideal (gratis), 3) Te confirmamos precio final y formas de pago, 4) Haces tu pedido, 5) Lo enviamos a tu domicilio en 24h (Lima) o 48h (todo Perú). Es rápido, fácil y con asesoría real en cada paso. Sin bots, solo personas que realmente te ayudan."
    },
    {
      question: "¿Hacen envíos a todo el Perú?",
      answer: "Sí, hacemos envíos a todo el Perú. Entrega en 24 horas en Lima Metropolitana y 48 horas a nivel nacional. Escríbenos por WhatsApp con tu distrito o ciudad y te confirmamos el costo y tiempo exacto de envío."
    },
    {
      question: "¿Qué métodos de pago aceptan?",
      answer: "Pago contraentrega (cuando lo recibes en tu puerta), transferencia bancaria, Yape, Plin, Interbank, BCP y otros métodos digitales. Puedes pagar en efectivo al recibir o anticipar si prefieres. 100% seguro. Te explicamos todas las opciones cuando nos escribes por WhatsApp."
    },
    {
      question: "¿Las medias tienen garantía?",
      answer: "Sí. Todos nuestros productos tienen garantía de calidad. Si recibes un producto defectuoso o con algún problema de fabricación, lo cambiamos sin costo adicional. Si la talla no te queda bien, también te la cambiamos gratis. Compra sin riesgos. Tu satisfacción y alivio son nuestra prioridad."
    },
    {
      question: "¿Son realmente efectivas para las várices?",
      answer: "Sí. Estas medias tienen compresión graduada médica certificada de 20-30 mmHg (Clase II), que es exactamente la que recomiendan los médicos para várices moderadas a severas. Mejoran la circulación, reducen la hinchazón y alivian el dolor desde el primer uso. Son dispositivos médicos certificados, no medias decorativas. El 87% de nuestros clientes siente alivio el primer día. Cientos de profesionales de salud las recomiendan."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <WhatsAppFloat />

      {/* Header */}
      <section className="bg-gradient-hero text-primary-foreground py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Preguntas Frecuentes
            </h1>
            <p className="text-lg text-primary-foreground/90">
              Respuestas a las dudas más comunes sobre nuestras medias de compresión
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-border rounded-lg px-6">
                <AccordionTrigger className="text-left hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* CTA */}
          <div className="mt-12 text-center space-y-6 p-8 bg-muted/30 rounded-lg">
            <h2 className="text-2xl font-semibold text-foreground">
              ¿Todavía tienes dudas?
            </h2>
            <p className="text-muted-foreground">
              Escríbenos directo por WhatsApp. Te respondemos en menos de 2 minutos. Sin compromiso, solo ayuda real.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-[#25D366] hover:bg-[#20BA5A] text-white"
            >
              <a
                href={getWhatsAppLink("", "Hola, tengo algunas preguntas sobre las medias de compresión")}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Pregunta por WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
