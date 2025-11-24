import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  label: string;
}

interface CategoryCarouselProps {
  categories: Category[];
  selected: string;
  onSelect: (id: string) => void;
  title: string;
}

export function CategoryCarousel({ categories, selected, onSelect, title }: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      const newPosition = direction === "left" 
        ? scrollRef.current.scrollLeft - scrollAmount
        : scrollRef.current.scrollLeft + scrollAmount;
      
      scrollRef.current.scrollTo({
        left: newPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      
      <div className="relative group">
        {/* Left scroll button - hidden on mobile, visible on desktop */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory px-1 py-2"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch"
          }}
        >
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant={selected === category.id ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap snap-start shrink-0 px-4 py-2 text-sm transition-all hover:scale-105"
              onClick={() => onSelect(category.id)}
            >
              {category.label}
            </Badge>
          ))}
        </div>

        {/* Right scroll button - hidden on mobile, visible on desktop */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-md opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Scroll indicator hint for mobile */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
