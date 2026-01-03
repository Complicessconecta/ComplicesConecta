import type React from 'react';

export const optimizeImage = (url: string, _width: number = 800): string => {
  // Placeholder: In a real implementation, this would append query params for an image CDN
  // e.g., return `${url}?w=${width}&q=80`;
  return url;
};

export interface OptimizeImageUrlOptions {
  quality?: number;
  width?: number | undefined;
  height?: number | undefined;
}

export type ImageFormat = 'avif' | 'webp' | 'jpeg';

export interface ImageOptimizationOptions extends OptimizeImageUrlOptions {
  format?: ImageFormat;
}

export function optimizeImageUrl(url: string, options: ImageOptimizationOptions = {}): string {
  const { quality, width, height, format } = options;
  const widthValue = typeof width === 'number' ? width : undefined;
  const heightValue = typeof height === 'number' ? height : undefined;

  // Conservador: si no hay transformaciones, regresar tal cual
  if (!quality && !widthValue && !heightValue && !format) return url;

  try {
    const hasProtocol = /^https?:\/\//i.test(url);
    const base = hasProtocol ? undefined : window.location.origin;
    const u = new URL(url, base);

    if (typeof quality === 'number') u.searchParams.set('q', String(quality));
    if (typeof widthValue === 'number') u.searchParams.set('w', String(Math.round(widthValue)));
    if (typeof heightValue === 'number') u.searchParams.set('h', String(Math.round(heightValue)));
    if (format) u.searchParams.set('format', format);

    return u.toString();
  } catch {
    // Fallback: no romper si el URL no es parseable
    return url;
  }
}

export function generateSrcSet(
  url: string,
  widths: number[],
  options: Omit<ImageOptimizationOptions, 'width'> = {}
): string {
  return widths
    .filter((w): w is number => typeof w === 'number' && Number.isFinite(w) && w > 0)
    .map((w) => `${optimizeImageUrl(url, { ...options, width: w })} ${Math.round(w)}w`)
    .join(', ');
}

export async function supportsWebP(): Promise<boolean> {
  if (typeof document === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    if (!canvas.getContext) return false;
    const data = canvas.toDataURL('image/webp');
    return data.startsWith('data:image/webp');
  } catch {
    return false;
  }
}

export async function supportsAVIF(): Promise<boolean> {
  if (typeof document === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    if (!canvas.getContext) return false;
    const data = canvas.toDataURL('image/avif');
    return data.startsWith('data:image/avif');
  } catch {
    return false;
  }
}

export function preloadImage(src: string, options: OptimizeImageUrlOptions = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Image preload failed'));
    img.src = optimizeImageUrl(src, options);
  });
}

export function createLazyLoader(): IntersectionObserver | null {
  if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return null;

  const onIntersect: IntersectionObserverCallback = (entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      if (!(img instanceof HTMLImageElement)) return;

      const dataSrc = img.getAttribute('data-src');
      const dataSrcSet = img.getAttribute('data-srcset');

      if (dataSrc) img.src = dataSrc;
      if (dataSrcSet) img.srcset = dataSrcSet;

      observer.unobserve(img);
    });
  };

  return new IntersectionObserver(onIntersect, {
    root: null,
    rootMargin: '100px',
    threshold: 0.01,
  });
}

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  quality?: number;
}
