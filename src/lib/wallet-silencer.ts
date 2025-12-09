/**
 * Wallet Silencer - ÚNICO PUNTO DE ENTRADA PARA PROTECCIÓN DE WALLET
 * Debe estar al inicio de main.tsx para evitar conflictos
 */

if (typeof window !== 'undefined') {
  // 1. Silenciar errores de consola relacionados con wallets
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;

  const walletErrorPatterns = [
    'Cannot redefine property',
    'Cannot assign to read only',
    'ethereum',
    'solana',
    'wallet',
    'tronweb',
    'bybit',
    'provider inject',
    'extension',
  ];

  const isWalletError = (msg: string): boolean => {
    const lowerMsg = msg.toLowerCase();
    return walletErrorPatterns.some(pattern => lowerMsg.includes(pattern.toLowerCase()));
  };

  console.error = (...args: unknown[]) => {
    const msg = args[0]?.toString() || '';
    if (!isWalletError(msg)) {
      originalConsoleError(...args);
    }
  };

  console.warn = (...args: unknown[]) => {
    const msg = args[0]?.toString() || '';
    if (!isWalletError(msg)) {
      originalConsoleWarn(...args);
    }
  };

  // 2. Silenciar eventos de error global para wallets
  const handleWalletError = (event: Event) => {
    const errorEvent = event as ErrorEvent;
    const rejectionEvent = event as PromiseRejectionEvent;
    const error = errorEvent.error || rejectionEvent.reason;
    const message = error?.message || error?.toString() || '';
    
    if (isWalletError(message)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  };

  window.addEventListener('error', handleWalletError, true);
  window.addEventListener('unhandledrejection', handleWalletError, true);

  // 3. NO intentar redefinir propiedades de wallet - dejar que las extensiones las controlen
  // Esto previene "Cannot redefine property" errors
}

export {};
