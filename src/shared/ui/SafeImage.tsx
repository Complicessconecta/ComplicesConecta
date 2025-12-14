import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';

interface SafeImageProps {
  src: string;
  alt: string;
  fallbackType?: 'avatar' | 'private' | 'default';
  className?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  fallbackType = 'default',
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-blue-500/20 ${className}`}>
        {fallbackType === 'avatar' && (
          <User className="w-1/3 h-1/3 text-white/40" />
        )}
        {fallbackType === 'private' && (
          <Lock className="w-1/3 h-1/3 text-white/40" />
        )}
        {fallbackType === 'default' && (
          <div className="text-white/40 text-sm">No image</div>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setImageError(true)}
    />
  );
};
