export interface EventSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  meta: string;
}

export const demoEvents: EventSlide[] = [
  {
    id: "masks",
    title: "Noches de Máscaras",
    subtitle: "Fiesta privada en CDMX",
    description: "Encuentros discretos con dress code elegante, máscaras venecianas y música deep house.",
    imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1000&auto=format&fit=crop&q=80",
    meta: "Solo parejas y singles verificados",
  },
  {
    id: "tulum",
    title: "Escapada Tulum",
    subtitle: "Weekend lifestyle frente al mar",
    description: "Experiencia all‑inclusive en villa privada con pool parties, cenas temáticas y afters selectos.",
    imageUrl: "https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=1000&auto=format&fit=crop&q=80",
    meta: "Cupo limitado · Dress code blanco",
  },
  {
    id: "dinner",
    title: "Cena Sensorial",
    subtitle: "Restaurante clandestino",
    description: "Maridaje a ciegas con dinámicas guiadas para parejas afines, música en vivo y códigos privados.",
    imageUrl: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1000&auto=format&fit=crop&q=80",
    meta: "Reservación previa · Confidencialidad total",
  },
];
