import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import certificateFDA from "@/assets/certificate-fda.png";
import certificateCE from "@/assets/certificate-ce.jpg";
import certificateItaly from "@/assets/certificate-italy.png";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Award } from "lucide-react";

const certificates = [
  {
    id: "fda",
    image: certificateFDA,
    title: "FDA Approved",
    description: "Producto aprobado bajo estándares internacionales de seguridad y salud.",
  },
  {
    id: "ce",
    image: certificateCE,
    title: "Certificado CE",
    description: "Certificado como dispositivo médico Clase I según normativa europea.",
  },
  {
    id: "italy",
    image: certificateItaly,
    title: "Made in Italy",
    description: "Fabricación con estándares textiles médicos italianos.",
  },
];

export const CertificationsSection = () => {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
      className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-background via-muted/10 to-background relative overflow-hidden"
    >
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-primary rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-secondary rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center mb-10 sm:mb-14 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4 sm:mb-6">
            <Award className="w-4 h-4" />
            <span>Certificaciones Internacionales</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 text-foreground leading-tight">
            Certificaciones Internacionales y Garantía Médica
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
            Productos avalados por las máximas autoridades sanitarias internacionales
          </p>
        </motion.div>

        {/* Certificates Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {certificates.map((cert, index) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <Dialog>
                <DialogTrigger asChild>
                  <Card className="group cursor-pointer border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-hover bg-card overflow-hidden h-full">
                    <CardContent className="p-6 sm:p-8 flex flex-col items-center text-center space-y-4 h-full">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className="w-full aspect-square flex items-center justify-center p-4 bg-background rounded-2xl shadow-sm"
                      >
                        <img
                          src={cert.image}
                          alt={cert.title}
                          className="w-full h-full object-contain"
                        />
                      </motion.div>
                      <div className="space-y-2 flex-1 flex flex-col justify-center">
                        <h3 className="font-bold text-lg sm:text-xl text-foreground">
                          {cert.title}
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                          {cert.description}
                        </p>
                      </div>
                      <p className="text-xs text-primary font-medium group-hover:underline">
                        Click para ampliar
                      </p>
                    </CardContent>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-3xl p-4 sm:p-6">
                  <div className="space-y-4">
                    <h3 className="font-bold text-xl sm:text-2xl text-foreground text-center">
                      {cert.title}
                    </h3>
                    <div className="flex items-center justify-center bg-background rounded-lg p-4">
                      <img
                        src={cert.image}
                        alt={cert.title}
                        className="max-w-full max-h-[60vh] object-contain"
                      />
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground text-center leading-relaxed">
                      {cert.description}
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>
          ))}
        </div>

        {/* Mobile Carousel hint for smaller screens */}
        <div className="sm:hidden mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Toca cualquier certificado para ver en detalle
          </p>
        </div>
      </div>
    </motion.section>
  );
};
