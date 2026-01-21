import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, MapPin, Music, Utensils } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/components/ui/buttons/Button";
import { demoEvents } from "@/demo/carousel-events-data";

interface EventsCarouselProps {
  className?: string;
}

export const EventsCarousel: React.FC<EventsCarouselProps> = ({
  className,
}) => {
  const [index, setIndex] = React.useState(0);

  const next = () => setIndex((prev) => (prev + 1) % demoEvents.length);
  const prev = () =>
    setIndex((prev) => (prev - 1 + demoEvents.length) % demoEvents.length);

  const current = demoEvents[index]!;

  return (
    <div className={cn("relative w-full max-w-3xl mx-auto", className)}>
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-black/70 backdrop-blur-xl shadow-2xl">
        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative h-64 md:h-full">
            <AnimatePresence mode="wait">
              <motion.img
                key={current.id}
                src={current.imageUrl}
                alt={current.title}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.35 }}
                className="w-full h-full object-cover"
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs text-zinc-200">
              <MapPin className="w-4 h-4" />
              <span>{current.subtitle}</span>
            </div>
          </div>

          <div className="p-5 md:p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-purple-300 mb-2">
                Eventos Lifestyle
              </p>
              <h3 className="text-xl md:text-2xl font-semibold text-white mb-2">
                {current.title}
              </h3>
              <p className="text-sm text-zinc-300 mb-4">
                {current.description}
              </p>
              <div className="flex items-center gap-3 text-xs text-zinc-300">
                <span className="inline-flex items-center gap-1">
                  <Music className="w-4 h-4" />
                  Música seleccionada
                </span>
                <span className="inline-flex items-center gap-1">
                  <Utensils className="w-4 h-4" />
                  Experiencias gourmet
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
              <span>{current.meta}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={prev}
                  aria-label="Anterior evento"
                  className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={next}
                  aria-label="Siguiente evento"
                  className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-100"
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 flex justify-center gap-2">
        {demoEvents.map((event, i) => (
          <button
            key={event.id}
            type="button"
            aria-label={`Ir al evento ${i + 1}`}
            onClick={() => setIndex(i)}
            className={cn(
              "h-1.5 w-6 rounded-full transition-all",
              i === index
                ? "bg-purple-400 w-8"
                : "bg-zinc-600 hover:bg-zinc-400",
            )}
          />
        ))}
      </div>
    </div>
  );
};
