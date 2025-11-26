import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Ruler } from "lucide-react";
import sizeGuideVarices from "@/assets/size-guide-varices.png";
import sizeGuideAntiembolicas from "@/assets/size-guide-antiembolicas.png";
import sizeGuideAlgodon from "@/assets/size-guide-algodon.png";
import sizeGuidePremama from "@/assets/size-guide-premama.png";

const sizeGuides = [
  {
    id: 1,
    title: "Medias para várices",
    image: sizeGuideVarices,
  },
  {
    id: 2,
    title: "Medias antiembólicas",
    image: sizeGuideAntiembolicas,
  },
  {
    id: 3,
    title: "Medias de algodón",
    image: sizeGuideAlgodon,
  },
  {
    id: 4,
    title: "Soporte premamá",
    image: sizeGuidePremama,
  },
];

export const SizeGuide = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>("");

  const handleImageClick = (image: string, title: string) => {
    setSelectedImage(image);
    setSelectedTitle(title);
  };

  return (
    <>
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <Ruler className="w-6 h-6 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Guía de Tallas
          </h2>
        </div>

        {/* Desktop Grid 2x2 */}
        <div className="hidden md:grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {sizeGuides.map((guide) => (
            <Card
              key={guide.id}
              className="group cursor-pointer overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
              onClick={() => handleImageClick(guide.image, guide.title)}
            >
              <div className="p-4">
                <h3 className="text-lg font-semibold text-foreground mb-4 text-center">
                  {guide.title}
                </h3>
                <div className="overflow-hidden rounded-lg">
                  <img
                    src={guide.image}
                    alt={guide.title}
                    className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden">
          <Carousel className="w-full max-w-sm mx-auto">
            <CarouselContent>
              {sizeGuides.map((guide) => (
                <CarouselItem key={guide.id}>
                  <Card
                    className="cursor-pointer overflow-hidden border-border/50 active:border-primary/50 transition-all"
                    onClick={() => handleImageClick(guide.image, guide.title)}
                  >
                    <div className="p-4">
                      <h3 className="text-base font-semibold text-foreground mb-3 text-center">
                        {guide.title}
                      </h3>
                      <div className="overflow-hidden rounded-lg">
                        <img
                          src={guide.image}
                          alt={guide.title}
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Haz clic en cualquier imagen para verla ampliada
        </p>
      </section>

      {/* Lightbox Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl w-full p-0">
          <DialogTitle className="sr-only">{selectedTitle}</DialogTitle>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 text-center">
              {selectedTitle}
            </h3>
            <img
              src={selectedImage || ""}
              alt={selectedTitle}
              className="w-full h-auto rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
