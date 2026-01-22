// SPDX-License-Identifier: MIT
// ComplicesConecta v3.8.0 - Web3Service
// Fecha: 10 Ene 2026 | Autor: Ing. Juan Carlos Méndez Nataren
// Descripción: Servicio para conexión Web3 con MetaMask y gestión de wallets

import { logger } from "@/lib/logger";

/**
 * Tipos de eventos de Web3
 */
export type Web3EventType =
  | "accountChanged"
  | "chainChanged"
  | "connect"
  | "disconnect"
  | "message";

/**
 * Interfaz para evento de Web3
 */
export interface Web3Event {
  type: Web3EventType;
  data?: any;
  timestamp: number;
}

/**
 * Interfaz para información de cuenta
 */
export interface AccountInfo {
  address: string;
  chainId: number;
  balance: string;
  network: string;
}

/**
 * Interfaz para información de red
 */
export interface NetworkInfo {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * Redes soportadías
 */
export const SUPPORTED_NETWORKS: Record<number, NetworkInfo> = {
  137: {
    chainId: 137,
    name: "Polygon Mainnet",
    rpcUrl: "https://polygon-rpc.com",
    blockExplorer: "https://polygonscan.com",
    nativeCurrency: {
      name: "Polygon",
      symbol: "MATIC",
      decimals: 18,
    },
  },
  80001: {
    chainId: 80001,
    name: "Polygon Amoy Testnet",
    rpcUrl: "https://rpc-amoy.polygon.technology",
    blockExplorer: "https://amoy.polygonscan.com",
    nativeCurrency: {
      name: "Polygon Amoy",
      symbol: "MATIC",
      decimals: 18,
    },
  },
  80002: {
    chainId: 80002,
    name: "Polygon Mumbai Testnet",
    rpcUrl: "https://rpc-mumbai.maticvigil.com",
    blockExplorer: "https://mumbai.polygonscan.com",
    nativeCurrency: {
      name: "Polygon Mumbai",
      symbol: "MATIC",
      decimals: 18,
    },
  },
  11155111: {
    chainId: 11155111,
    name: "Polygon Amoy",
    rpcUrl: "https://rpc-amoy.polygon.technology",
    blockExplorer: "https://amoy.polygonscan.com",
    nativeCurrency: {
      name: "Polygon Amoy",
      symbol: "MATIC",
      decimals: 18,
    },
  },
};

/**
 * Servicio para gestión de Web3 y conexión con MetaMask
 */
export class Web3Service {
  private static instance: Web3Service;
  private isConnected: boolean = false;
  private currentAccount: string | null = null;
  private currentChainId: number | null = null;
  private eventListeners: Map<Web3EventType, Set<(...args: any[]) => any>> = new Map();

  private constructor() {
    this.initializeEventListeners();
  }

  /**
   * Obtiene la instancia singleton del servicio
   */
  public static getInstance(): Web3Service {
    if (!Web3Service.instance) {
      Web3Service.instance = new Web3Service();
    }
    return Web3Service.instance;
  }

  /**
   * Verifica si MetaMask está disponible
   */
  public isMetaMaskAvailable(): boolean {
    if (typeof window === "undefined") return false;
    return typeof (window as any).ethereum !== "undefined";
  }

  /**
   * Verifica si está conectado a Web3
   */
  public isWeb3Connected(): boolean {
    return this.isConnected;
  }

  /**
   * Obtiene la cuenta actual
   */
  public getCurrentAccount(): string | null {
    return this.currentAccount;
  }

  /**
   * Obtiene el chain ID actual
   */
  public getCurrentChainId(): number | null {
    return this.currentChainId;
  }

  /**
   * Obtiene información de la red actual
   */
  public getCurrentNetwork(): NetworkInfo | null {
    if (!this.currentChainId) return null;
    return SUPPORTED_NETWORKS[this.currentChainId] || null;
  }

  /**
   * Obtiene el balance de la cuenta actual
   */
  public async getBalance(): Promise<string> {
    if (!this.currentAccount || !this.currentChainId) {
      throw new Error("No hay cuenta conectada");
    }

    try {
      const balance = await (window as any).ethereum.request({
        method: "eth_getBalance",
        params: [this.currentAccount, "latest"],
      });

      // Convertir de Wei a Ether/MATIC
      const balanceInEther = parseInt(balance, 16) / 10 ** 18;
      return balanceInEther.toFixed(6);
    } catch (error) {
      logger.error("Error obteniendo balance:", { error });
      throw new Error("Error al obtener el balance");
    }
  }

  /**
   * Obtiene información completa de la cuenta
   */
  public async getAccountInfo(): Promise<AccountInfo> {
    if (!this.currentAccount || !this.currentChainId) {
      throw new Error("No hay cuenta conectada");
    }

    const balance = await this.getBalance();
    const network = this.getCurrentNetwork();

    return {
      address: this.currentAccount || "",
      chainId: this.currentChainId || 0,
      balance,
      network: network?.name || "Unknown",
    };
  }

  /**
   * Solicita conexión a MetaMask
   */
  public async connect(): Promise<string> {
    if (!this.isMetaMaskAvailable()) {
      throw new Error("MetaMask no está disponible");
    }

    try {
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length === 0) {
        throw new Error("No se seleccionó ninguna cuenta");
      }

      this.currentAccount = accounts[0];
      this.isConnected = true;

      // Obtener chain ID
      const chainId = await (window as any).ethereum.request({
        method: "eth_chainId",
      });
      this.currentChainId = parseInt(chainId, 16);

      logger.info("Web3 conectado exitosamente", {
        account: this.currentAccount,
        chainId: this.currentChainId,
      });

      this.emitEvent("connect", { account: this.currentAccount || "" });

      return this.currentAccount || "";
    } catch (error) {
      logger.error("Error conectando a Web3:", { error });
      throw new Error("Error al conectar a MetaMask");
    }
  }

  /**
   * Desconecta de Web3
   */
  public async disconnect(): Promise<void> {
    this.currentAccount = null;
    this.currentChainId = null;
    this.isConnected = false;

    logger.info("Web3 desconectado");

    this.emitEvent("disconnect");
  }

  /**
   * Cambia a una red específica
   */
  public async switchNetwork(chainId: number): Promise<void> {
    if (!this.isMetaMaskAvailable()) {
      throw new Error("MetaMask no está disponible");
    }

    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });

      logger.info("Red cambiada exitosamente", { chainId });
    } catch (error: any) {
      // Si la red no está agregada, intentar agregarla
      if (error.code === 4902) {
        await this.addNetwork(chainId);
      } else {
        logger.error("Error cambiando de red:", { error });
        throw new Error("Error al cambiar de red");
      }
    }
  }

  /**
   * Agrega una red a MetaMask
   */
  public async addNetwork(chainId: number): Promise<void> {
    const network = SUPPORTED_NETWORKS[chainId];
    if (!network) {
      throw new Error("Red no soportada");
    }

    try {
      await (window as any).ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${chainId.toString(16)}`,
            chainName: network.name,
            nativeCurrency: network.nativeCurrency,
            rpcUrls: [network.rpcUrl],
            blockExplorerUrls: [network.blockExplorer],
          },
        ],
      });

      logger.info("Red agregada exitosamente", { chainId, networkName: network.name });
    } catch (error) {
      logger.error("Error agregando red:", { error });
      throw new Error("Error al agregar la red");
    }
  }

  /**
   * Firma un mensaje
   */
  public async signMessage(message: string): Promise<string> {
    if (!this.currentAccount) {
      throw new Error("No hay cuenta conectada");
    }

    try {
      const signature = await (window as any).ethereum.request({
        method: "personal_sign",
        params: [message, this.currentAccount],
      });

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
    if (!this.currentAccount) {
      throw new Error("No hay cuenta conectada");
    }

    try {
      const txHash = await (window as any).ethereum.request({
        method: "eth_sendTransaction",
        params: [transaction],
      });

      logger.info("Transacción enviada exitosamente", { txHash });
      return txHash;
    } catch (error) {
      logger.error("Error enviando transacción:", { error });
      throw new Error("Error al enviar la transacción");
    }
  }

  /**
   * Añade un listener de eventos
   */
  public addEventListener(type: Web3EventType, callback: (...args: any[]) => any): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(callback);
  }

  /**
   * Remueve un listener de eventos
   */
  public removeEventListener(type: Web3EventType, callback: (...args: any[]) => any): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Emite un evento
   */
  private emitEvent(type: Web3EventType, data?: any): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const event: Web3Event = {
        type,
        data,
        timestamp: Date.now(),
      };

      listeners.forEach((callback) => {
        try {
          callback(event);
        } catch (error) {
          logger.error("Error en listener de evento:", { error, type });
        }
      });
    }
  }

  /**
   * Inicializa los listeners de eventos de MetaMask
   */
  private initializeEventListeners(): void {
    if (!this.isMetaMaskAvailable()) return;

    const ethereum = (window as any).ethereum;

    // Listener para cambio de cuenta
    ethereum.on("accountsChanged", (accounts: string[]) => {
      if (accounts.length === 0) {
        this.disconnect();
      } else {
        this.currentAccount = accounts[0] || null;
        this.emitEvent("accountChanged", { account: accounts[0] || "" });
      }
    });

    // Listener para cambio de red
    ethereum.on("chainChanged", (chainId: string) => {
      this.currentChainId = parseInt(chainId, 16);
      this.emitEvent("chainChanged", { chainId: this.currentChainId });
    });

    // Listener para mensajes
    ethereum.on("message", (message: any) => {
      this.emitEvent("message", message);
    });

    // Listener para desconexión
    ethereum.on("disconnect", (error: any) => {
      logger.warn("MetaMask desconectado", { error });
      this.disconnect();
    });

    logger.info("Event listeners de Web3 inicializados");
  }

  /**
   * Limpia los listeners de eventos
   */
  public cleanup(): void {
    if (!this.isMetaMaskAvailable()) return;

    const ethereum = (window as any).ethereum;
    ethereum.removeAllListeners();

    this.eventListeners.clear();
    logger.info("Event listeners de Web3 limpiados");
  }
}

// Exportar instancia singleton
export const web3Service = Web3Service.getInstance();

