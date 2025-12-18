
/**
 * Asset Loader Utility
 * Centralizes asset loading logic with support for remote assets (CDN)
 * and local fallbacks.
 */

export type AssetType = 'image' | 'video' | 'document';

// Environment variables
const USE_REMOTE_ASSETS = import.meta.env.VITE_USE_REMOTE_ASSETS === 'true';
const ASSET_CDN_URL = import.meta.env.VITE_ASSET_CDN_URL || 'https://images.unsplash.com';

/**
 * Resolves an asset URL based on configuration
 * @param path - Relative path or identifier for the asset
 * @param type - Type of asset (default: image)
 * @returns Resolved URL
 */
export const getAssetUrl = (path: string, type: AssetType = 'image'): string => {
  // Return immediately if it's already a full URL
  if (path.startsWith('http') || path.startsWith('blob:')) return path;

  // Use remote assets if enabled (Production optimization)
  if (USE_REMOTE_ASSETS) {
    // Map common paths to Unsplash placeholders for demo/dev if CDN not fully set up
    // In a real scenario, this would map to your S3/CloudFront paths
    if (path.includes('avatar')) {
      return `${ASSET_CDN_URL}/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80`;
    }
    if (path.includes('couple')) {
      return `${ASSET_CDN_URL}/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80`;
    }
    if (path.includes('event')) {
      return `${ASSET_CDN_URL}/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80`;
    }
    
    // Default fallback for remote
    return `${ASSET_CDN_URL}/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80`;
  }

  // Local asset resolution
  try {
    // This assumes assets are in src/assets. Adjust if they are in public/
    // Vite's import.meta.glob or direct imports are preferred, but for dynamic strings:
    return new URL(`../assets/${path}`, import.meta.url).href;
  } catch (e) {
    console.warn(`Failed to resolve local asset: ${path}`, e);
    // Fallback to a placeholder or empty string
    return 'https://placehold.co/600x400?text=Asset+Not+Found';
  }
};

export const assets = {
  logos: {
    main: getAssetUrl('logo.png'),
    dark: getAssetUrl('logo-dark.png'),
  },
  placeholders: {
    user: getAssetUrl('placeholders/user.png'),
    cover: getAssetUrl('placeholders/cover.jpg'),
  }
};
