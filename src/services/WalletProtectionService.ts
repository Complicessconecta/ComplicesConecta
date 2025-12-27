/**
 * Wallet Protection Service
 * Protege contra conflictos de extensiones de wallet
 */

import { logger } from '@/lib/logger';
import type { WindowWithWallets } from '@/types/wallet.types';

export class WalletProtectionService {
  private static instance: WalletProtectionService;
  private protectedProperties: Set<string> = new Set();

  static getInstance(): WalletProtectionService {
    if (!WalletProtectionService.instance) {
      WalletProtectionService.instance = new WalletProtectionService();
    }
    return WalletProtectionService.instance;
  }

  constructor() {
    this.initializeProtection();
  }

  private initializeProtection(): void {
    // Proteger propiedades crÃ­ticas del window object
    this.protectWindowProperties();
    
    // Detectar y manejar conflictos de wallet
    this.detectWalletConflicts();
  }

  private protectWindowProperties(): void {
    const criticalProperties = ['ethereum', 'solana', 'tronWeb', 'bybit'];

    criticalProperties.forEach(prop => {
      if (typeof window === 'undefined') {
        return;
      }

      if (prop in window) {
        this.protectedProperties.add(prop);

        try {
          const descriptor = Object.getOwnPropertyDescriptor(window, prop);

          // Si la extensiÃ³n ya definiÃ³ la propiedad como no configurable, NO intentar redefinirla
          if (descriptor && descriptor.configurable === false) {
            logger.debug(`${prop} ya estÃ¡ definido por una extensiÃ³n y es no configurable. No se redefine.`);
            return;
          }

          // Si es configurable, no necesitamos cambiar nada aquÃ­; solo registramos
          logger.debug(`${prop} estÃ¡ disponible y configurable. Protegido sin redefinir.`);
        } catch (error) {
          logger.warn(`No se pudo inspeccionar la propiedad ${prop}`, { error });
        }
      }
    });
  }

  private detectWalletConflicts(): void {
    const win = window as WindowWithWallets;
    
    // Detectar MetaMask
    if (win.ethereum && win.ethereum.isMetaMask) {
      logger.debug('MetaMask detectado');
      this.handleMetaMaskConflicts();
    }

    // Detectar Solana
    if (win.solana) {
      logger.debug('Solana detectado');
      this.handleSolanaConflicts();
    }

    // Detectar TronLink
    if (win.tronWeb) {
      logger.debug('TronLink detectado');
      this.handleTronLinkConflicts();
    }

    // Detectar Bybit
    if (win.bybit) {
      logger.debug('Bybit detectado');
      this.handleBybitConflicts();
    }
  }

  private handleMetaMaskConflicts(): void {
    // Prevenir errores de redefiniciÃ³n de ethereum
    try {
      const win = window as WindowWithWallets;
      if (win.ethereum) {
        const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');

        // Solo redefinir si la propiedad es configurable; de lo contrario, respetar la definiciÃ³n de la extensiÃ³n
        if (!descriptor || descriptor.configurable !== false) {
          Object.defineProperty(window, 'ethereum', {
            value: win.ethereum,
            writable: false,
            configurable: true
          });
        } else {
          logger.debug('ethereum ya definido por extensiÃ³n como no configurable. No se redefine.');
        }
      }
    } catch (error) {
      logger.warn('MetaMask conflict handled', { error });
    }
  }

  private handleSolanaConflicts(): void {
    // Prevenir errores de redefiniciÃ³n de solana
    try {
      const win = window as WindowWithWallets;
      if (win.solana) {
        const descriptor = Object.getOwnPropertyDescriptor(window, 'solana');

        if (!descriptor || descriptor.configurable !== false) {
          Object.defineProperty(window, 'solana', {
            value: win.solana,
            writable: false,
            configurable: true
          });
        } else {
          logger.debug('solana ya definido por extensiÃ³n como no configurable. No se redefine.');
        }
      }
    } catch (error) {
      logger.warn('Solana conflict handled', { error });
    }
  }

  private handleTronLinkConflicts(): void {
    // Prevenir errores de redefiniciÃ³n de tronWeb
    try {
      const win = window as WindowWithWallets;
      if (win.tronWeb) {
        const descriptor = Object.getOwnPropertyDescriptor(window, 'tronWeb');

        if (!descriptor || descriptor.configurable !== false) {
          Object.defineProperty(window, 'tronWeb', {
            value: win.tronWeb,
            writable: false,
            configurable: true
          });
        } else {
          logger.debug('tronWeb ya definido por extensiÃ³n como no configurable. No se redefine.');
        }
      }
    } catch (error) {
      logger.warn('TronLink conflict handled', { error });
    }
  }

  private handleBybitConflicts(): void {
    // Prevenir errores de redefiniciÃ³n de bybit
    try {
      const win = window as WindowWithWallets;
      if (win.bybit) {
        const descriptor = Object.getOwnPropertyDescriptor(window, 'bybit');

        if (!descriptor || descriptor.configurable !== false) {
          Object.defineProperty(window, 'bybit', {
            value: win.bybit,
            writable: false,
            configurable: true
          });
        } else {
          logger.debug('bybit ya definido por extensiÃ³n como no configurable. No se redefine.');
        }
      }
    } catch (error) {
      logger.warn('Bybit conflict handled', { error });
    }
  }

  // MÃ©todo pÃºblico para verificar si hay conflictos
  public hasConflicts(): boolean {
    return this.protectedProperties.size > 0;
  }

  // MÃ©todo pÃºblico para obtener lista de wallets detectados
  public getDetectedWallets(): string[] {
    const wallets: string[] = [];
    const win = window as WindowWithWallets;
    
    if (win.ethereum && win.ethereum.isMetaMask) wallets.push('MetaMask');
    if (win.solana) wallets.push('Solana');
    if (win.tronWeb) wallets.push('TronLink');
    if (win.bybit) wallets.push('Bybit');
    
    return wallets;
  }

  // MÃ©todo para limpiar conflictos si es necesario
  public clearConflicts(): void {
    this.protectedProperties.clear();
    logger.debug('Conflictos de wallet limpiados');
  }
}

// Inicializar protecciÃ³n automÃ¡ticamente
if (typeof window !== 'undefined') {
  WalletProtectionService.getInstance();
}

export default WalletProtectionService;

