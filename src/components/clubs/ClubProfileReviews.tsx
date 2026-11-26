import { useEffect, useState } from "react";
import { Star, MessageSquare, ThumbsUp, User } from "lucide-react";
import { Card } from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  ANONYMOUS_REVIEW_LABEL,
  canAnonymousReview,
} from "@/lib/anonymous";

interface ClubReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  checkInDate: string;
  helpfulCount: number;
  isVerified: boolean;
  createdAt: string;
  /**
   * Ronda 10 (stream A, punto A5): reseña escrita por una cuenta
   * anónima. Se muestra como "Anónimo" con la etiqueta obligatoria
   * "Reseña anónima" y queda en revisión por moderación.
   */
  isAnonymous?: boolean;
  /** "pending" = en revisión por moderación; "approved" = publicada. */
  moderationStatus?: "pending" | "approved";
}

interface ClubProfileReviewsProps {
  reviews: ClubReview[];
  averageRating: number;
  totalReviews: number;
  isOwner?: boolean;
  onReply?: (reviewId: string) => void;
  /**
   * Ronda 10 (stream A, punto A5): clave para persistir las reseñas
   * que el usuario escribe en este club (localStorage, por club).
   * Sin clubId, las reseñas solo viven en esta vista.
   */
  clubId?: string;
  /** Nombre visible del autor (por defecto "Tú"). */
  currentUserName?: string;
  /** El autor es una cuenta anónima: su reseña va etiquetada y moderada. */
  isAnonymous?: boolean;
  /**
   * ¿El autor ya interactuó (amistad aceptada o acceso concedido)?
   * Regla del anónimo: sin interacción previa no hay reseña. En el
   * contexto de club no hay estado de check-in en demo, así que el
   * padre no lo pasa y el default es true (el formulario existe y
   * toda reseña anónima queda en revisión). Si el padre pasa false
   * explícito, el formulario se bloquea con el motivo.
   */
  hasInteraction?: boolean;
}

/**
 * Reseñas escritas por el usuario en este club, persistidas en
 * localStorage por club. Mínimo viable (ronda 10, stream A, punto
 * A5): no es un sistema nuevo de reseñas, solo el formulario que
 * faltaba + la etiqueta "Reseña anónima" + la marca de moderación.
 */
const USER_REVIEWS_STORAGE_PREFIX = "cc_club_reviews_v1:";

/**
 * Ronda 15 (stream C): evento que se dispara cada vez que el usuario
 * escribe una reseña en un club. El encabezado del club
 * (`ClubProfileHeader`) lo escucha para actualizar su conteo en vivo:
 * antes mostraba el `rating_count` estático de la semilla (128) mientras
 * la sección de reseñas ya decía 129 (test PR #74).
 */
export const USER_REVIEWS_CHANGED_EVENT = "cc:club-user-reviews-changed";

/** Nº de reseñas escritas por el usuario en este club (persistidas). */
export function countUserReviews(clubId: string | undefined): number {
  return readUserReviews(clubId).length;
}

/**
 * Ronda 16 (stream C): conteo VIVO de reseñas para cualquier
 * superficie que muestre el total de un club — el encabezado
 * (`ClubProfileHeader`) y la tarjeta de la lista (`/clubs`). Es el
 * mismo mecanismo de la ronda 15 (stream C): semilla + reseñas del
 * usuario en localStorage, re-leído con el evento
 * `cc:club-user-reviews-changed` al publicar, sin recargar. Antes
 * solo el encabezado lo usaba y la tarjeta de la lista seguía con
 * el `rating_count` estático de la semilla (128 en la lista mientras
 * /clubs/demo ya decía 130).
 */
export function useLiveReviewCount(
  clubId: string | undefined,
  seedCount: number,
): number {
  const [userReviewCount, setUserReviewCount] = useState(() =>
    countUserReviews(clubId),
  );
  useEffect(() => {
    setUserReviewCount(countUserReviews(clubId));
    const onUserReviewsChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ clubId?: string }>).detail;
      if (!detail?.clubId || detail.clubId === clubId) {
        setUserReviewCount(countUserReviews(clubId));
      }
    };
    window.addEventListener(USER_REVIEWS_CHANGED_EVENT, onUserReviewsChanged);
    return () =>
      window.removeEventListener(
        USER_REVIEWS_CHANGED_EVENT,
        onUserReviewsChanged,
      );
  }, [clubId]);
  return seedCount + userReviewCount;
}

function readUserReviews(clubId: string | undefined): ClubReview[] {
  if (typeof window === "undefined" || !clubId) return [];
  try {
    const raw = window.localStorage.getItem(
      `${USER_REVIEWS_STORAGE_PREFIX}${clubId}`,
    );
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is ClubReview =>
        Boolean(r) &&
        typeof r === "object" &&
        typeof (r as { id?: unknown }).id === "string" &&
        typeof (r as { comment?: unknown }).comment === "string" &&
        typeof (r as { rating?: unknown }).rating === "number",
    );
  } catch {
    return [];
  }
}

function saveUserReviews(clubId: string | undefined, reviews: ClubReview[]): void {
  if (typeof window === "undefined" || !clubId) return;
  try {
    window.localStorage.setItem(
      `${USER_REVIEWS_STORAGE_PREFIX}${clubId}`,
      JSON.stringify(reviews),
    );
    // Ronda 15 (stream C): avisar al encabezado del club para que su
    // conteo pase a ser el vivo (ver USER_REVIEWS_CHANGED_EVENT).
    window.dispatchEvent(
      new CustomEvent(USER_REVIEWS_CHANGED_EVENT, { detail: { clubId } }),
    );
  } catch {
    // Sin almacenamiento: la reseña solo vive en esta vista.
  }
}

/**
 * Distribución de estrellas coherente con el total y el promedio del
 * club. Si la lista cargada ES el total, se cuentan las reseñas
 * reales; si no (p. ej. Eden Noir: 1 reseña cargada, 186 en total),
 * se deriva una distribución determinista: se parte de todas en 5★
 * y se bajan reseñas de a un escalón hasta que la suma de estrellas
 * iguala `round(promedio × total)`. Resultado: la suma de la
 * distribución es el total y su media redondea al promedio mostrado
 * (186 reseñas, 4.9 → 167×5★ + 19×4★ = 911 estrellas, media 4.90).
 */
export function deriveRatingDistribution(
  reviews: ClubReview[],
  averageRating: number,
  totalReviews: number,
): { star: number; count: number; percentage: number }[] {
  const total = Math.max(0, Math.floor(totalReviews));
  if (reviews.length > 0 && reviews.length === total) {
    return [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((r) => r.rating === star).length;
      return {
        star,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      };
    });
  }
  // counts[0..4] = reseñas de 1★..5★.
  const counts = [0, 0, 0, 0, 0];
  counts[4] = total;
  const targetSum = Math.min(
    5 * total,
    Math.max(total, Math.round(averageRating * total)),
  );
  let toRemove = 5 * total - targetSum;
  for (let star = 5; star > 1 && toRemove > 0; star--) {
    const move = Math.min(counts[star - 1] ?? 0, toRemove);
    counts[star - 1] = (counts[star - 1] ?? 0) - move;
    counts[star - 2] = (counts[star - 2] ?? 0) + move;
    toRemove -= move;
  }
  return [5, 4, 3, 2, 1].map((star) => {
    const count = counts[star - 1] ?? 0;
    return {
      star,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
    };
  });
}

export const ClubProfileReviews: React.FC<ClubProfileReviewsProps> = ({
  reviews,
  averageRating,
  totalReviews,
  isOwner = false,
  onReply,
  clubId,
  currentUserName,
  isAnonymous = false,
  hasInteraction = true,
}) => {
  const [sortBy, setSort] = useState<'recent' | 'highest' | 'lowest'>('recent');

  // Ronda 10 (stream A, punto A5): formulario de reseña. Las
  // reseñas del usuario se suman a las del club y se persisten por
  // club en localStorage.
  const [userReviews, setUserReviews] = useState<ClubReview[]>(() =>
    readUserReviews(clubId),
  );
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formDone, setFormDone] = useState(false);

  // Si cambia el club, recargar sus reseñas escritas.
  useEffect(() => {
    setUserReviews(readUserReviews(clubId));
    setRating(0);
    setComment("");
    setFormError(null);
    setFormDone(false);
  }, [clubId]);

  const allReviews = [...userReviews, ...reviews];
  const totalWithUserReviews = totalReviews + userReviews.length;

  const anonymousReviewCheck = isAnonymous
    ? canAnonymousReview({ hasInteraction })
    : { allowed: true, label: ANONYMOUS_REVIEW_LABEL };

  const handleSubmitReview = () => {
    if (!anonymousReviewCheck.allowed) {
      setFormError(anonymousReviewCheck.reason ?? "No puedes reseñar este club.");
      return;
    }
    if (rating < 1 || rating > 5) {
      setFormError("Elige una calificación de 1 a 5 estrellas.");
      return;
    }
    if (comment.trim().length < 3) {
      setFormError("Escribe tu reseña (mínimo 3 caracteres).");
      return;
    }
    const now = new Date().toISOString();
    const review: ClubReview = {
      id: `user-review-${Date.now()}`,
      userId: "current-user",
      userName: isAnonymous ? "Anónimo" : (currentUserName ?? "Tú"),
      rating,
      comment: comment.trim(),
      checkInDate: now,
      helpfulCount: 0,
      isVerified: false,
      createdAt: now,
      ...(isAnonymous
        ? {
            isAnonymous: true as const,
            moderationStatus: "pending" as const,
          }
        : { moderationStatus: "approved" as const }),
    };
    const next = [review, ...userReviews];
    setUserReviews(next);
    saveUserReviews(clubId, next);
    setRating(0);
    setComment("");
    setFormError(null);
    setFormDone(true);
  };

  const sortedReviews = [...allReviews].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'highest') {
      return b.rating - a.rating;
    } else {
      return a.rating - b.rating;
    }
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating
            ? 'text-yellow-400 fill-current'
            : 'text-gray-400'
        }`}
      />
    ));
  };

  /**
   * Ronda 8 (punto 15): la distribución contaba SOLO las reseñas
   * cargadas en la lista (1 reseña demo de 5★ → "5★=1") mientras el
   * encabezado mostraba el total del club (186 reseñas): dos fuentes
   * distintas para el mismo número. Cuando la lista trae menos
   * reseñas que el total, la distribución se deriva del total y del
   * promedio del club (suma = total, media ponderada ≈ promedio);
   * cuando la lista ES el total, se cuentan las reseñas reales.
   */
  const ratingDistribution = deriveRatingDistribution(
    allReviews,
    averageRating,
    totalWithUserReviews,
  );

  return (
    <Card className="bg-slate-900/85 dark:bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linear-to-r from-yellow-500 to-orange-500 rounded-lg">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Reseñas</h3>
              <p className="text-white/60 text-sm">
                {totalWithUserReviews} {totalWithUserReviews === 1 ? 'reseña' : 'reseñas'}
              </p>
            </div>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSort(e.target.value as any)}
            className="bg-white/10 border border-white/20 text-white rounded-lg px-3 py-2 text-sm"
            aria-label="Ordenar reseñas por"
          >
            <option value="recent">Más recientes</option>
            <option value="highest">Mejor calificadas</option>
            <option value="lowest">Peor calificadas</option>
          </select>
        </div>

        {/* Formulario de reseña (ronda 10, stream A, punto A5): antes
            no existía ningún formulario en la app — el perfil anónimo
            decía "solo pueden crear reseñas" pero no había dónde
            crearlas. La reseña anónima se publica como "Anónimo" con
            la etiqueta "Reseña anónima" y queda "En revisión" por
            moderación. */}
        <div className="bg-white/5 rounded-xl p-4 sm:p-5 mb-6 border border-white/10">
          <h4 className="text-white font-semibold mb-1">Escribe una reseña</h4>
          <p className="text-white/60 text-xs mb-1">
            {isAnonymous
              ? "Tu reseña se publicará como «Reseña anónima» y quedará en revisión por moderación."
              : "Tu reseña se publicará con tu nombre visible."}
          </p>
          {/* Ronda 15, stream D (decisión D2): la guía afirmaba que
              solo usuarios con check-in real podían reseñar, pero el
              formulario nunca verificó ningún check-in. En beta las
              reseñas están abiertas; la reseña verificada con
              check-in real (50 m, WorldID) llega próximamente. */}
          <p className="text-white/60 text-xs mb-4">
            En beta, las reseñas están abiertas a todos los usuarios. La
            reseña verificada con check-in real llega próximamente.
          </p>
          {!anonymousReviewCheck.allowed ? (
            <p className="text-sm text-amber-200 bg-amber-500/10 border border-amber-400/30 rounded-lg px-3 py-2">
              {anonymousReviewCheck.reason}
            </p>
          ) : (
            <>
              <div
                className="flex items-center gap-1 mb-3"
                role="radiogroup"
                aria-label="Calificación de 1 a 5 estrellas"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    role="radio"
                    aria-checked={rating === star}
                    aria-label={`${star} ${star === 1 ? "estrella" : "estrellas"}`}
                    onClick={() => {
                      setRating(star);
                      setFormError(null);
                    }}
                    className="p-1 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <Star
                      className={`h-6 w-6 ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-400"}`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-white/70">
                    {rating} {rating === 1 ? "estrella" : "estrellas"}
                  </span>
                )}
              </div>
              <textarea
                value={comment}
                onChange={(e) => {
                  setComment(e.target.value);
                  setFormError(null);
                }}
                placeholder="Cuéntanos cómo te fue en este club…"
                aria-label="Tu reseña"
                rows={3}
                className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-lg px-3 py-2 text-sm mb-3"
              />
              {formError && (
                <p className="text-sm text-red-300 mb-3">{formError}</p>
              )}
              {formDone && (
                <p className="text-sm text-emerald-300 mb-3">
                  {isAnonymous
                    ? "Tu reseña se envió a moderación como «Reseña anónima»."
                    : "Gracias por tu reseña."}
                </p>
              )}
              <Button
                onClick={handleSubmitReview}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                Publicar reseña
                {isAnonymous ? " como anónimo" : ""}
              </Button>
            </>
          )}
        </div>

        {/* Rating Summary */}
        <div className="bg-white/5 rounded-xl p-6 mb-6 border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center gap-1 mb-2">
                {renderStars(Math.round(averageRating))}
              </div>
              <p className="text-white/60 text-sm">
                {totalWithUserReviews} {totalWithUserReviews === 1 ? 'reseña' : 'reseñas'}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {ratingDistribution.map(({ star, count, percentage }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-white/60 text-sm w-12">{star} ★</span>
                  <progress
                    className="flex-1 h-2 rounded-full overflow-hidden bg-white/10 [&::-webkit-progress-bar]:bg-white/10 [&::-webkit-progress-value]:bg-linear-to-r [&::-webkit-progress-value]:from-yellow-500 [&::-webkit-progress-value]:to-orange-500 [&::-moz-progress-bar]:bg-linear-to-r [&::-moz-progress-bar]:from-yellow-500 [&::-moz-progress-bar]:to-orange-500"
                    value={percentage}
                    max={100}
                  />
                  <span className="text-white/60 text-sm w-8">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Reviews List */}
        {sortedReviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-white/40 mx-auto mb-4" />
            <p className="text-white/60">No hay reseñas disponibles</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 rounded-xl p-4 border border-white/10"
              >
                <div className="flex items-start gap-4">
                  {/* User Avatar */}
                  <div className="shrink-0">
                    <div className="w-12 h-12 rounded-full bg-linear-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
                      {review.userAvatar ? (
                        <img
                          src={review.userAvatar}
                          alt={review.userName}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <User className="h-6 w-6 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-white">
                            {review.userName}
                          </h4>
                          {review.isVerified && (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              Verificado
                            </Badge>
                          )}
                          {/* Ronda 10 (stream A, punto A5): etiqueta
                              obligatoria y marca de moderación. */}
                          {review.isAnonymous && (
                            <Badge className="bg-slate-500/25 text-slate-100 border-slate-400/40">
                              {ANONYMOUS_REVIEW_LABEL}
                            </Badge>
                          )}
                          {review.moderationStatus === "pending" && (
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-400/40">
                              En revisión
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-white/60">
                          <div className="flex gap-0.5">
                            {renderStars(review.rating)}
                          </div>
                          <span>•</span>
                          <span>{formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-white/80 mb-3">{review.comment}</p>

                    {/* Review Actions */}
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-1 text-white/60 hover:text-white transition-colors text-sm">
                        <ThumbsUp className="h-4 w-4" />
                        <span>Útil ({review.helpfulCount})</span>
                      </button>

                      {isOwner && onReply && (
                        <Button
                          onClick={() => onReply(review.id)}
                          variant="ghost"
                          size="sm"
                          className="text-white/60 hover:text-white hover:bg-white/10"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Responder
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

