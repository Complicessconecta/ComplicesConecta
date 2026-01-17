import { FC } from "react";
import { Heart } from "lucide-react";
import "@/styles/DecorativeHearts.css";

interface DecorativeHeartsProps {
  count?: number;
  className?: string;
}

export const DecorativeHearts: FC<DecorativeHeartsProps> = ({
  count = 6,
  className = "",
}) => {
  type Position = Partial<Record<"top" | "left" | "right" | "bottom", string>>;
  // Generar posiciones aleatorias para los corazones
  // Usar posiciones predefinidas para mejor distribución
  const positions: Position[] = [
    { top: "15%", left: "10%" },
    { top: "25%", right: "15%" },
    { top: "45%", left: "8%" },
    { top: "60%", right: "12%" },
    { top: "75%", left: "20%" },
    { top: "35%", right: "25%" },
    { top: "55%", left: "85%" },
    { top: "80%", right: "18%" },
    { top: "20%", left: "75%" },
    { top: "70%", right: "80%" },
  ];

  const hearts = Array.from({ length: count }, (_, i) => {
    const pos: Position = positions[i % positions.length] ?? {};
    const heartData: {
      id: number;
      top?: string;
      left?: string;
      right?: string;
      bottom?: string;
      size: number;
      delay: number;
      duration: number;
      opacity: number;
    } = {
      id: i,
      size: Math.random() * 20 + 16, // Entre 16px y 36px - más grandes y visibles
      delay: i * 1.2, // Delay escalonado más espaciado para mejor distribución
      duration: Math.random() * 6 + 12, // Entre 12s y 18s - mucho más lentas
      opacity: Math.random() * 0.5 + 0.5, // Entre 0.5 y 1.0 - más visibles
    };

    if ("top" in pos && typeof pos.top === "string") heartData.top = pos.top;
    if ("left" in pos && typeof pos.left === "string")
      heartData.left = pos.left;
    if ("right" in pos && typeof pos.right === "string")
      heartData.right = pos.right;
    if ("bottom" in pos && typeof pos.bottom === "string")
      heartData.bottom = pos.bottom;

    return heartData;
  });

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className} hearts-container`}
      style={{ willChange: "transform" }}
    >
      {hearts.map((heart) => (
        <Heart
          key={heart.id}
          className="absolute text-white animate-float-heart-slow heart-position"
          style={{
            '--top': heart.top || undefined,
            '--left': heart.left || undefined,
            '--right': heart.right || undefined,
            '--bottom': heart.bottom || undefined,
          } as React.CSSProperties}
        >
          <style>
            {`
              .heart-position {
                width: ${heart.size}px;
                height: ${heart.size}px;
                opacity: ${heart.opacity};
                animation-delay: ${heart.delay}s;
                animation-duration: ${heart.duration}s;
                filter: drop-shadow(0 4px 12px rgba(255,255,255,0.6));
                will-change: transform, opacity;
                transform: translateZ(0); /* Force hardware acceleration */
              }
            `}
          </style>
        </Heart>
      ))}
    </div>
  );
};
