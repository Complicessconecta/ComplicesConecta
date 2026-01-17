// SPDX-License-Identifier: MIT
// ComplicesConecta v3.8.0 - Web3WalletService
// Fecha: 10 Ene 2026 | Autor: Ing. Juan Carlos Méndez Nataren
// Descripción: Servicio para gestión de wallet Web3 interna

import { web3Service } from "@/services/blockchain/Web3Service";
import { logger } from "@/lib/logger";

/**
 * Interfaz para información de wallet
 */
export interface WalletInfo {
  address: string;
  chainId: number;
  balance: string;
  network: string;
  isConnected: boolean;
  lastConnected: string;
}

/**
 * Interfaz para token en wallet
 */
export interface TokenBalance {
  symbol: string;
  balance: string;
  decimals: number;
  address: string;
}

/**
 * Servicio para gestión de wallet Web3 interna
 */
export class Web3WalletService {
  private static instance: Web3WalletService;
  private walletInfo: WalletInfo | null = null;
  private tokenBalances: Map<string, TokenBalance> = new Map();

  private constructor() {
    this.loadWalletFromStorage();
  }

  /**
   * Obtiene la instancia singleton del servicio
   */
  public static getInstance(): Web3WalletService {
    if (!Web3WalletService.instance) {
      Web3WalletService.instance = new Web3WalletService();
    }
    return Web3WalletService.instance;
  }

  /**
   * Conecta la wallet Web3
   */
  public async connectWallet(): Promise<WalletInfo> {
    try {
      const accountAddress = await web3Service.connect();
      const accountInfo = await web3Service.getAccountInfo();

      this.walletInfo = {
        address: accountAddress,
        chainId: accountInfo.chainId,
        balance: accountInfo.balance,
        network: accountInfo.network,
        isConnected: true,
        lastConnected: new Date().toISOString(),
      };

      this.saveWalletToStorage();

      logger.info("Wallet conectada exitosamente", {
        address: this.walletInfo.address,
        network: this.walletInfo.network,
      });

      return this.walletInfo;
    } catch (error) {
      logger.error("Error conectando wallet:", { error });
      throw new Error("Error al conectar la wallet");
    }
  }

  /**
   * Desconecta la wallet Web3
   */
  public async disconnectWallet(): Promise<void> {
    try {
      await web3Service.disconnect();

      this.walletInfo = null;
      this.tokenBalances.clear();

      this.clearWalletFromStorage();

      logger.info("Wallet desconectada exitosamente");
    } catch (error) {
      logger.error("Error desconectando wallet:", { error });
      throw new Error("Error al desconectar la wallet");
    }
  }

  /**
   * Obtiene información de la wallet
   */
  public getWalletInfo(): WalletInfo | null {
    return this.walletInfo;
  }

  /**
   * Verifica si la wallet está conectada
   */
  public isWalletConnected(): boolean {
    return this.walletInfo?.isConnected || false;
  }

  /**
   * Obtiene la dirección de la wallet
   */
  public getWalletAddress(): string | null {
    return this.walletInfo?.address || null;
  }

  /**
   * Obtiene el balance de la wallet
   */
  public async getBalance(): Promise<string> {
    if (!this.isWalletConnected()) {
      throw new Error("Wallet no conectada");
    }

    try {
      const balance = await web3Service.getBalance();

      if (this.walletInfo) {
        this.walletInfo.balance = balance;
        this.saveWalletToStorage();
      }

      return balance;
    } catch (error) {
      logger.error("Error obteniendo balance:", { error });
      throw new Error("Error al obtener el balance");
    }
  }

  /**
   * Actualiza la información de la wallet
   */
  public async updateWalletInfo(): Promise<WalletInfo> {
    if (!this.isWalletConnected()) {
      throw new Error("Wallet no conectada");
    }

    try {
      const accountInfo = await web3Service.getAccountInfo();

      this.walletInfo = {
        address: accountInfo.address,
        chainId: accountInfo.chainId,
        balance: accountInfo.balance,
        network: accountInfo.network,
        isConnected: true,
        lastConnected: new Date().toISOString(),
      };

      this.saveWalletToStorage();

      return this.walletInfo;
    } catch (error) {
      logger.error("Error actualizando wallet:", { error });
      throw new Error("Error al actualizar la wallet");
    }
  }

  /**
   * Obtiene el balance de un token específico
   */
  public async getTokenBalance(tokenAddress: string): Promise<TokenBalance> {
    if (!this.isWalletConnected()) {
      throw new Error("Wallet no conectada");
    }

    try {
      // Llamada RPC para obtener balance de token ERC-20
      const balance = await (window as any).ethereum.request({
        method: "eth_call",
        params: [
          {
            to: tokenAddress,
            data: `0x70a08231000000000000000000000000${this.walletInfo?.address?.slice(2)}`,
          },
          "latest",
        ],
      });

      // Llamada RPC para obtener símbolo del token
      const symbol = await (window as any).ethereum.request({
        method: "eth_call",
        params: [
          {
            to: tokenAddress,
            data: "0x95d89b41",
          },
          "latest",
        ],
      });

      // Llamada RPC para obtener decimales del token
      const decimals = await (window as any).ethereum.request({
        method: "eth_call",
        params: [
          {
            to: tokenAddress,
            data: "0x313ce567",
          },
          "latest",
        ],
      });

      const tokenBalance: TokenBalance = {
        symbol: this.hexToString(symbol),
        balance: this.hexToBalance(balance, parseInt(decimals, 16)),
        decimals: parseInt(decimals, 16),
        address: tokenAddress,
      };

      this.tokenBalances.set(tokenAddress, tokenBalance);

      return tokenBalance;
    } catch (error) {
      logger.error("Error obteniendo balance de token:", { error, tokenAddress });
      throw new Error("Error al obtener el balance del token");
    }
  }

  /**
   * Obtiene todos los balances de tokens
   */
  public getAllTokenBalances(): Map<string, TokenBalance> {
    return this.tokenBalances;
  }

  /**
   * Firma un mensaje con la wallet
   */
  public async signMessage(message: string): Promise<string> {
    if (!this.isWalletConnected()) {
      throw new Error("Wallet no conectada");
    }

    try {
      const signature = await web3Service.signMessage(message);

      logger.info("Mensaje firmado exitosamente", { message });
      return signature;
    } catch (error) {
      logger.error("Error firmando mensaje:", { error });
      throw new Error("Error al firmar el mensaje");
    }
  }

  /**
   * Envía una transacción
   */
  public async sendTransaction(transaction: any): Promise<string> {
    if (!this.isWalletConnected()) {
      throw new Error("Wallet no conectada");
    }

    try {
      const txHash = await web3Service.sendTransaction(transaction);

      logger.info("Transacción enviada exitosamente", { txHash });
      return txHash;
    } catch (error) {
      logger.error("Error enviando transacción:", { error });
      throw new Error("Error al enviar la transacción");
    }
  }

  /**
   * Convierte un valor hex a string
   */
  private hexToString(hex: string): string {
    if (!hex || hex === "0x") return "";
    const str = hex.slice(130);
    return this.hexToAscii(str);
  }

  /**
   * Convierte un valor hex a ASCII
   */
  private hexToAscii(hex: string): string {
    let str = "";
    for (let i = 0; i < hex.length; i += 2) {
      const code = parseInt(hex.substr(i, 2), 16);
      if (code > 0) {
        str += String.fromCharCode(code);
      }
    }
    return str;
  }

  /**
   * Convierte un valor hex a balance
   */
  private hexToBalance(hex: string, decimals: number): string {
    if (!hex || hex === "0x") return "0";
    const balance = BigInt(hex);
    const divisor = BigInt(10 ** decimals);
    const result = Number(balance) / Number(divisor);
    return result.toFixed(6);
  }

  /**
   * Guarda la wallet en localStorage
   */
  private saveWalletToStorage(): void {
    if (typeof window === "undefined") return;

    try {
      if (this.walletInfo) {
        localStorage.setItem("web3_wallet", JSON.stringify(this.walletInfo));
      }
    } catch (error) {
      logger.error("Error guardando wallet en storage:", { error });
    }
  }

  /**
   * Carga la wallet desde localStorage
   */
  private loadWalletFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem("web3_wallet");
      if (stored) {
        this.walletInfo = JSON.parse(stored);
      }
    } catch (error) {
      logger.error("Error cargando wallet desde storage:", { error });
    }
  }

  /**
   * Limpia la wallet de localStorage
   */
  private clearWalletFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem("web3_wallet");
    } catch (error) {
      logger.error("Error limpiando wallet de storage:", { error });
    }
  }
}

// Exportar instancia singleton
export const web3WalletService = Web3WalletService.getInstance();
