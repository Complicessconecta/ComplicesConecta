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