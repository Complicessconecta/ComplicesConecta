import type React from "react";
import { useLiveReviewCount } from "@/components/clubs/ClubProfileReviews";

/**
 * Ronda 16 (stream C): nº vivo de reseñas para la tarjeta de un club
 * en la lista (/clubs). Antes la tarjeta mostraba el `rating_count` /
 * `review_count` estático de la semilla (128 en la lista mientras
 * /clubs/demo ya decía 130 tras publicar 2 reseñas): solo el
 * encabezado usaba el conteo vivo (ronda 15, stream C). Misma fuente
 * y mismo evento que el encabezado: semilla + reseñas del usuario en
 * localStorage, actualizado al publicar sin recargar.
 */
export const LiveClubReviewCount: React.FC<{
  clubId: string;
  seedCount: number;
}> = ({ clubId, seedCount }) => {
  const liveCount = useLiveReviewCount(clubId, seedCount);
  return <>{liveCount}</>;
};
