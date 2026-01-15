import { useState } from "react";
import { Star, MessageSquare, ThumbsUp, User } from "lucide-react";
import { Card } from "@/components/ui/cards/Card";
import { Button } from "@/components/ui/buttons/Button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

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
}

interface ClubProfileReviewsProps {
  reviews: ClubReview[];
  averageRating: number;
  totalReviews: number;
  isOwner?: boolean;
  onReply?: (reviewId: string) => void;
}

export const ClubProfileReviews: React.FC<ClubProfileReviewsProps> = ({
  reviews,
  averageRating,
  totalReviews,
  isOwner = false,
  onReply,
}) => {
  const [sortBy, setSort] = useState<'recent' | 'highest' | 'lowest'>('recent');

  const sortedReviews = [...reviews].sort((a, b) => {
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

  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0 
      ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 
      : 0
  }));

  return (
    <Card className="bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Reseñas</h3>
              <p className="text-white/60 text-sm">
                {totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'}
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
                {totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {ratingDistribution.map(({ star, count, percentage }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-white/60 text-sm w-12">{star} ★</span>
                  <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 h-full rounded-full transition-all rating-bar-fill"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
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
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
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
