export const shareToTikTok = (url: string, title: string) => {
  // Opens the TikTok share dialog (or redirects to app)
  const shareUrl = `https://www.tiktok.com/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
  window.open(shareUrl, '_blank');
};

export const isTikTokAvailable = () => {
  // Mock check for TikTok availability
  return true;
};
