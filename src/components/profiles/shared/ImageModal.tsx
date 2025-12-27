import { useState, useEffect, type TouchEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Send, Lock } from 'lucide-react';
import { Button } from '@/components/ui/buttons/Button';
import { Input } from '@/components/ui/forms/Input';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
  onNavigate: (index: number) => void;
  onLike?: (imageIndex: number) => void;
  onComment?: (imageIndex: number, comment?: string) => void;
  likes?: { [key: number]: number };
  userLikes?: { [key: number]: boolean };
  isPrivate?: boolean;
  isBlurred?: boolean;
}

export const ImageModal = ({
  isOpen,
  onClose,
  images,
  currentIndex,
  onNavigate,
  onLike,
  onComment,
  likes = {},
  userLikes = {},
  isPrivate = false,
  isBlurred = false
}: ImageModalProps) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');

  // Swipe detection
  const minSwipeDistance = 50;
  const minVerticalSwipeDistance = 60;

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    const touch = e.targetTouches?.[0];
    if (!touch) return;
    setTouchEnd(null);
    setTouchEndY(null);
    setTouchStart(touch.clientX);
    setTouchStartY(touch.clientY);
  };

  const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    const touch = e.targetTouches?.[0];
    if (!touch) return;
    setTouchEnd(touch.clientX);
    setTouchEndY(touch.clientY);
  };

  const onTouchEnd = () => {
    if (touchStart === null || touchEnd === null || touchStartY === null || touchEndY === null) return;

    const horizontalDistance = touchStart - touchEnd;
    const verticalDistance = touchStartY - touchEndY;

    const isLeftSwipe = horizontalDistance > minSwipeDistance;
    const isRightSwipe = horizontalDistance < -minSwipeDistance;

    const isVerticalSwipeDown = verticalDistance < -minVerticalSwipeDistance && Math.abs(verticalDistance) > Math.abs(horizontalDistance);

    if (isVerticalSwipeDown) {
      onClose();
      return;
    }

    if (isLeftSwipe && currentIndex < images.length - 1) {
      onNavigate(currentIndex + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      }
      if (e.key === 'ArrowRight' && currentIndex < images.length - 1) {
        onNavigate(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, currentIndex, images.length, onNavigate, onClose]);

  const handleLike = () => {
    if (onLike) onLike(currentIndex);
  };

  const handleComment = () => {
    setShowCommentInput(!showCommentInput);
  };

  const submitComment = () => {
    if (onComment && commentText.trim()) {
      onComment(currentIndex, commentText);
      setCommentText('');
      setShowCommentInput(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-gradient-to-br from-purple-900/95 via-black/90 to-blue-900/95 backdrop-blur-xl"
        onClick={onClose}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/30 hover:scale-110 transition-all shadow-lg"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation arrows */}
          {currentIndex > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/30 hover:scale-110 transition-all shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(currentIndex - 1);
              }}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
          )}

          {currentIndex < images.length - 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/30 hover:scale-110 transition-all shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate(currentIndex + 1);
              }}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
          )}

          {/* Main image */}
          <motion.div
            key={currentIndex}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="relative max-w-4xl max-h-[80vh] mx-4"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={images[currentIndex]}
              alt={`Imagen ${currentIndex + 1}`}
              className={`w-full h-full object-contain rounded-lg ${
                isPrivate ? 'private-image-protection select-none pointer-events-none' : ''
              }`}
              style={isBlurred ? { filter: 'blur(15px)' } : undefined}
            />

            {isBlurred && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 rounded-2xl bg-black/70 border border-white/20 px-4 py-3 backdrop-blur-md shadow-xl">
                  <Lock className="h-5 w-5 text-white" />
                  <span className="text-white text-sm font-semibold">Contenido restringido</span>
                </div>
              </div>
            )}

            {/* Watermark for private images */}
            {isPrivate && (
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-sm border border-white/20 shadow-lg">
                ComplicesConecta © Privado
              </div>
            )}

            {/* Action buttons */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-2">
              <div className="flex gap-2 bg-black/40 backdrop-blur-md rounded-lg p-2 border border-white/10">
                {onLike && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-white bg-white/10 backdrop-blur-sm hover:bg-white/30 ${
                      userLikes[currentIndex] ? 'text-red-500' : ''
                    }`}
                    onClick={handleLike}
                  >
                    <Heart className={`h-4 w-4 mr-1 ${userLikes[currentIndex] ? 'fill-current' : ''}`} />
                    {likes[currentIndex] || 0}
                  </Button>
                )}

                {onComment && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`text-white bg-white/10 backdrop-blur-sm hover:bg-white/30 ${showCommentInput ? 'bg-white/30' : ''}`}
                    onClick={handleComment}
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Comentar
                  </Button>
                )}
              </div>
              
              {/* Comment Input */}
              <AnimatePresence>
                {showCommentInput && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="bg-black/60 backdrop-blur-md rounded-lg p-2 border border-white/10 flex gap-2 w-[300px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Escribe un comentario..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-9"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitComment();
                        e.stopPropagation();
                      }}
                      autoFocus
                    />
                    <Button 
                      size="icon" 
                      className="h-9 w-9 bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                      onClick={submitComment}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Image indicators */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black/40 backdrop-blur-md px-3 py-2 rounded-full border border-white/20">
            {images.map((_, index) => (
              <button
                key={index}
                title={`Ver imagen ${index + 1}`}
                aria-label={`Ir a imagen ${index + 1}`}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigate(index);
                }}
              />
            ))}
          </div>

          {/* Image counter */}
          <div className="absolute top-4 left-4 text-white bg-black/50 px-3 py-1 rounded">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

