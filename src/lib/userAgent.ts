// Reusable Android WebView detection helper
export function isAndroidWebView(uaString?: string): boolean {
  const ua = (uaString ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '')).toLowerCase();
  if (!ua) return false;

  // Common tokens in Android WebView
  const hasAndroid = ua.includes('android');
  const hasMobile = ua.includes('mobile');
  const hasChrome = ua.includes('chrome/');
  const hasVersionToken = ua.includes('version/'); // present in many WebView UA strings
  const hasWVToken = ua.includes('; wv') || /\bwv\b/.test(ua); // "; wv" is typical in Android WebView

  // Chrome-based WebView on Android often includes Chrome + Version/ + Mobile
  const isChromeWebView = hasAndroid && hasChrome && (hasVersionToken || hasWVToken) && (hasMobile || ua.includes('samsung'));
  const isGenericWebView = hasWVToken;

  // Try to avoid full desktop/mobile browsers
  const notFullDesktop = !ua.includes('windows nt') && !ua.includes('macintosh');
  const notFullSafari = !ua.includes('safari/') || hasVersionToken; // Safari pattern is rare on Android; Version/ indicates WebView

  return (isChromeWebView || isGenericWebView) && notFullDesktop && notFullSafari;
}

// MERGED FROM UTILS (platformDetection.ts)

export type Platform = 'android' | 'ios' | 'windows' | 'macos' | 'linux' | 'unknown';
export type Browser = 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'unknown';

/**
 * Detect the current platform
 */
export function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/android/i.test(userAgent)) return 'android';
  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
  if (/windows/i.test(userAgent)) return 'windows';
  if (/macintosh|mac os x/i.test(userAgent)) return 'macos';
  if (/linux/i.test(userAgent)) return 'linux';
  
  return 'unknown';
}

/**
 * Detect the current browser
 */
export function detectBrowser(): Browser {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) return 'chrome';
  if (/firefox/i.test(userAgent)) return 'firefox';
  if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) return 'safari';
  if (/edge/i.test(userAgent)) return 'edge';
  if (/opera/i.test(userAgent)) return 'opera';
  
  return 'unknown';
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  return detectPlatform() === 'android';
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  return detectPlatform() === 'ios';
}

/**
 * Check if PWA installation is supported
 */
export function supportsPWAInstall(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for beforeinstallprompt event support
  return 'onbeforeinstallprompt' in window;
}

/**
 * Check if running in standalone mode (PWA)
 */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    return (
      (window as any).matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  } catch {
    return false;
  }
}

/**
 * Get platform-specific app store URL
 */
export function getAppStoreUrl(): string | null {
  const platform = detectPlatform();
  
  switch (platform) {
    case 'android':
      return 'https://play.google.com/store/apps/details?id=com.complicesconecta.app';
    case 'ios':
      return 'https://apps.apple.com/app/complicesconecta/id123456789';
    default:
      return null;
  }
}

/**
 * Check if running from APK (Android app)
 */
export function isRunningFromAPK(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if running in WebView or standalone app
  return (
    isAndroid() && 
    (isStandalone() || (window.navigator as any).standalone === true)
  );
}

/**
 * Get platform information
 */
export function getPlatformInfo(): {
  platform: Platform;
  browser: Browser;
  isStandalone: boolean;
  supportsInstall: boolean;
  appStoreUrl: string | null;
} {
  return {
    platform: detectPlatform(),
    browser: detectBrowser(),
    isStandalone: isStandalone(),
    supportsInstall: supportsPWAInstall(),
    appStoreUrl: getAppStoreUrl()
  };
}

export default {
  detectPlatform,
  detectBrowser,
  isAndroid,
  isIOS,
  supportsPWAInstall,
  isStandalone,
  getAppStoreUrl,
  supportsAppInstall: supportsPWAInstall,
  isRunningFromAPK,
  getPlatformInfo
};
