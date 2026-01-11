// SPDX-License-Identifier: MIT
// ComplicesConecta v3.8.0 - ContractService
// Fecha: 10 Ene 2026 | Autor: Ing. Juan Carlos Méndez Nataren
// Descripción: Servicio para interactuar con contratos inteligentes

import { web3Service } from "./Web3Service";
import { logger } from "@/lib/logger";

/**
 * Interfaz para configuración de contrato
 */
export interface ContractConfig {
  address: string;
  abi: any[];
}

/**
 * Interfaz para resultado de transacción
 */
export interface TransactionResult {
  hash: string;
  status: "pending" | "success" | "failed";
  blockNumber?: number;
  gasUsed?: string;
  error?: string;
}

/**
 * Servicio para interactuar con contratos inteligentes
 */
export class ContractService {
  private static instance: ContractService;
  private contracts: Map<string, ContractConfig> = new Map();

  private constructor() {
    this.initializeContracts();
  }

  /**
   * Obtiene la instancia singleton del servicio
   */
  public static getInstance(): ContractService {
    if (!ContractService.instance) {
      ContractService.instance = new ContractService();
    }
    return ContractService.instance;
  }

  /**
   * Inicializa los contratos inteligentes
   */
  private initializeContracts(): void {
    // Contrato CMPX (Token ERC-20)
    this.contracts.set("CMPX", {
      address: import.meta.env.VITE_CMPX_CONTRACT_ADDRESS || "",
      abi: [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address) view returns (uint256)",
        "function transfer(address, uint256) returns (bool)",
        "function approve(address, uint256) returns (bool)",
        "function allowance(address, address) view returns (uint256)",
        "function mint(address, uint256)",
        "function burn(uint256)",
      ],
    });

    // Contrato CoupleNFT (NFT ERC-721)
    this.contracts.set("CoupleNFT", {
      address: import.meta.env.VITE_COUPLENFT_CONTRACT_ADDRESS || "",
      abi: [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function tokenURI(uint256) view returns (string)",
        "function balanceOf(address) view returns (uint256)",
        "function ownerOf(uint256) view returns (address)",
        "function requestCoupleNFT(address, string, string) returns (uint256)",
        "function approveCoupleNFT(uint256)",
        "function cancelCoupleNFT(uint256)",
        "function getConsentStatus(uint256) view returns (bool, bool, uint256)",
      ],
    });

    // Contrato StakingPool
    this.contracts.set("StakingPool", {
      address: import.meta.env.VITE_STAKINGPOOL_CONTRACT_ADDRESS || "",
      abi: [
        "function stakeTokens(uint256, uint256)",
        "function unstakeTokens(uint256)",
        "function stakeNFT(uint256, uint256)",
        "function unstakeNFT(uint256)",
        "function claimRewards(uint256)",
        "function getStakeInfo(uint256) view returns (uint256, uint256, uint256, uint256, uint256)",
        "function calculateRewards(uint256) view returns (uint256)",
        "function getAPY(uint256) view returns (uint256)",
      ],
    });

    logger.info("Contratos inteligentes inicializados", {
      contracts: Array.from(this.contracts.keys()),
    });
  }

  /**
   * Obtiene la configuración de un contrato
   */
  public getContract(contractName: string): ContractConfig | null {
    return this.contracts.get(contractName) || null;
  }

  /**
   * Llama a una función de lectura de un contrato
   */
  public async callReadFunction(
    contractName: string,
    functionName: string,
    params: any[] = []
  ): Promise<any> {
    if (!web3Service.isWeb3Connected()) {
      throw new Error("Web3 no está conectado");
    }

    const contract = this.getContract(contractName);
    if (!contract) {
      throw new Error(`Contrato ${contractName} no encontrado`);
    }

    if (!contract.address) {
      throw new Error(`Contrato ${contractName} no tiene dirección configurada`);
    }

    try {
      const result = await (window as any).ethereum.request({
        method: "eth_call",
        params: [
          {
            to: contract.address,
            data: this.encodeFunctionCall(functionName, params, contract.abi),
          },
          "latest",
        ],
      });

      logger.info(`Llamada a ${contractName}.${functionName} exitosa`, { result });
      return result;
    } catch (error) {
      logger.error(`Error llamando a ${contractName}.${functionName}:`, { error });
      throw new Error(`Error al llamar a ${functionName}`);
    }
  }

  /**
   * Llama a una función de escritura de un contrato
   */
  public async callWriteFunction(
    contractName: string,
    functionName: string,
    params: any[] = []
  ): Promise<TransactionResult> {
    if (!web3Service.isWeb3Connected()) {
      throw new Error("Web3 no está conectado");
    }

    const contract = this.getContract(contractName);
    if (!contract) {
      throw new Error(`Contrato ${contractName} no encontrado`);
    }

    if (!contract.address) {
      throw new Error(`Contrato ${contractName} no tiene dirección configurada`);
    }

    try {
      const txHash = await (window as any).ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            to: contract.address,
            data: this.encodeFunctionCall(functionName, params, contract.abi),
          },
        ],
      });

      logger.info(`Transacción enviada a ${contractName}.${functionName}`, { txHash });

      // Esperar confirmación de transacción
      const receipt = await this.waitForTransaction(txHash);

      return {
        hash: txHash,
        status: receipt.status === "0x1" ? "success" : "failed",
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
      };
    } catch (error) {
      logger.error(`Error en transacción ${contractName}.${functionName}:`, { error });
      return {
        hash: "",
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Espera la confirmación de una transacción
   */
  private async waitForTransaction(txHash: string): Promise<any> {
    const maxAttempts = 60; // 60 intentos = 1 minuto (1 segundo por intento)
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const receipt = await (window as any).ethereum.request({
          method: "eth_getTransactionReceipt",
          params: [txHash],
        });

        if (receipt) {
          return receipt;
        }
      } catch (error) {
        // La transacción aún no está confirmada
      }

      attempts++;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error("Timeout esperando confirmación de transacción");
  }

  /**
   * Codifica una llamada a función
   */
  private encodeFunctionCall(
    functionName: string,
    params: any[],
    abi: any[]
  ): string {
    // Buscar la función en el ABI
    const funcAbi = abi.find((item: any) => item.name === functionName);
    if (!funcAbi) {
      throw new Error(`Función ${functionName} no encontrada en ABI`);
    }

    // Codificar selector de función
    const functionSignature = `${functionName}(${funcAbi.inputs.map((input: any) => input.type).join(",")})`;
    const functionSelector = this.keccak256(functionSignature).slice(0, 10);

    // Codificar parámetros
    const encodedParams = this.encodeParams(params, funcAbi.inputs);

    return `0x${functionSelector}${encodedParams}`;
  }

  /**
   * Codifica parámetros
   */
  private encodeParams(params: any[], inputs: any[]): string {
    let encoded = "";
    let offset = inputs.length * 32;

    params.forEach((param, index) => {
      const input = inputs[index];

      if (input.type === "address") {
        encoded += param.slice(2).padStart(64, "0");
      } else if (input.type === "uint256") {
        encoded += BigInt(param).toString(16).padStart(64, "0");
      } else if (input.type === "string") {
        // Para strings, primero codificamos el offset y luego el string
        const offsetHex = offset.toString(16).padStart(64, "0");
        encoded += offsetHex;

        // Codificar el string
        const stringHex = this.encodeString(param);
        encoded += stringHex;

        offset += Math.ceil(param.length / 32) * 32;
      } else if (input.type === "bool") {
        encoded += param ? "1".padStart(64, "0") : "0".padStart(64, "0");
      }
    });

    return encoded;
  }

  /**
   * Codifica un string
   */
  private encodeString(str: string): string {
    const lengthHex = str.length.toString(16).padStart(64, "0");
    const stringHex = str
      .split("")
      .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("");

    return `${lengthHex}${stringHex.padEnd(Math.ceil(str.length / 32) * 64, "0")}`;
  }

  /**
   * Calcula hash Keccak-256 (simplificado)
   */
  private keccak256(data: string): string {
    // En producción, usar ethers.js o web3.js para esto
    // Por ahora, retornamos un hash simulado
    return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  }

  /**
   * Obtiene el balance de tokens CMPX
   */
  public async getCMPXBalance(address: string): Promise<string> {
    try {
      const balance = await this.callReadFunction("CMPX", "balanceOf", [address]);
      const balanceInTokens = parseInt(balance, 16) / 10 ** 18;
      return balanceInTokens.toFixed(2);
    } catch (error) {
      logger.error("Error obteniendo balance CMPX:", { error });
      throw new Error("Error al obtener balance CMPX");
    }
  }

  /**
   * Aprueba tokens CMPX para un contrato
   */
  public async approveCMPX(spenderAddress: string, amount: string): Promise<TransactionResult> {
    try {
      const amountInWei = (parseFloat(amount) * 10 ** 18).toString(16);
      return await this.callWriteFunction("CMPX", "approve", [spenderAddress, `0x${amountInWei}`]);
    } catch (error) {
      logger.error("Error aprobando CMPX:", { error });
      throw new Error("Error al aprobar CMPX");
    }
  }

  /**
   * Solicita NFT de pareja
   */
  public async requestCoupleNFT(
    partnerAddress: string,
    name: string,
    description: string
  ): Promise<TransactionResult> {
    try {
      return await this.callWriteFunction("CoupleNFT", "requestCoupleNFT", [
        partnerAddress,
        name,
        description,
      ]);
    } catch (error) {
      logger.error("Error solicitando NFT de pareja:", { error });
      throw new Error("Error al solicitar NFT de pareja");
    }
  }

  /**
   * Aprueba NFT de pareja
   */
  public async approveCoupleNFT(requestId: number): Promise<TransactionResult> {
    try {
      const requestIdHex = requestId.toString(16).padStart(64, "0");
      return await this.callWriteFunction("CoupleNFT", "approveCoupleNFT", [`0x${requestIdHex}`]);
    } catch (error) {
      logger.error("Error aprobando NFT de pareja:", { error });
      throw new Error("Error al aprobar NFT de pareja");
    }
  }

  /**
   * Stakea tokens
   */
  public async stakeTokens(amount: string, duration: number): Promise<TransactionResult> {
    try {
      const amountInWei = (parseFloat(amount) * 10 ** 18).toString(16);
      const durationInSeconds = (duration * 24 * 60 * 60).toString(16);
      return await this.callWriteFunction("StakingPool", "stakeTokens", [
        `0x${amountInWei}`,
        `0x${durationInSeconds}`,
      ]);
    } catch (error) {
      logger.error("Error staking tokens:", { error });
      throw new Error("Error al staking tokens");
    }
  }

  /**
   * Desstakea tokens
   */
  public async unstakeTokens(stakeId: number): Promise<TransactionResult> {
    try {
      const stakeIdHex = stakeId.toString(16).padStart(64, "0");
      return await this.callWriteFunction("StakingPool", "unstakeTokens", [`0x${stakeIdHex}`]);
    } catch (error) {
      logger.error("Error unstaking tokens:", { error });
      throw new Error("Error al unstaking tokens");
    }
  }

  /**
   * Reclama rewards
   */
  public async claimRewards(stakeId: number): Promise<TransactionResult> {
    try {
      const stakeIdHex = stakeId.toString(16).padStart(64, "0");
      return await this.callWriteFunction("StakingPool", "claimRewards", [`0x${stakeIdHex}`]);
    } catch (error) {
      logger.error("Error reclamando rewards:", { error });
      throw new Error("Error al reclamar rewards");
    }
  }
}

// Exportar instancia singleton
export const contractService = ContractService.getInstance();
