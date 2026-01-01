// ------------------------------------------------------------------
// COMPLIANCE: DIAGRAMAS_FLUJOS_v4.0_DOCUMENTO_MAESTRO_IA.md
// Sistema operando bajo reglas de determinismo y robustez v4.0
// ------------------------------------------------------------------
// ComplicesConecta v3.7.0 - NFTService
// Fecha: 13 Nov 2025 | Autor: Ing. Juan Carlos Méndez Nataren
// Descripción: Servicio para gestión de NFTs, IPFS y lógica de parejas
// Funcionalidades: Mint NFT, upload IPFS, consentimiento doble, metadata

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { WalletService } from '@/services/payments/WalletService';
import type { 
  CoupleNFTRequest, 
  BlockchainSupabaseClient 
} from '@/types/blockchain';
import { safeBlockchainCast } from '@/types/blockchain';

/**
 * Interfaz para metadata de NFT
 */
interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

/**
 * Interfaz para información de NFT
 */
interface NFTInfo {
  id: string;
  token_id: number;
  owner_address: string;
  metadata_uri: string;
  rarity: string;
  is_couple: boolean;
  partner_address?: string;
  created_at: string;
}

// CoupleNFTRequest ya está importado desde @/types/blockchain

/**
 * Servicio de NFTs para ComplicesConecta
 * 
 * Características principales:
 * - Mint de NFTs individuales y de pareja
 * - Upload a IPFS con Pinata
 * - Sistema de consentimiento doble
 * - Gestión de metadata y rareza
 * - Integración con contratos inteligentes
 */
export class NFTService {
  private static instance: NFTService;
  private walletService: WalletService;
  
  // Helper para acceso seguro a tablas blockchain
  private get blockchainClient(): BlockchainSupabaseClient {
    if (!supabase) {
      throw new Error('Supabase client no inicializado');
    }
    return safeBlockchainCast(supabase);
  }
  
  // Configuración de Pinata IPFS
  private static readonly PINATA_API_URL = 'https://api.pinata.cloud';
  private static readonly PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';
  
  // Tipos de rareza y sus multiplicadores
  private static readonly RARITY_TYPES = {
    common: { name: 'Común', multiplier: 100, probability: 70 },
    rare: { name: 'Raro', multiplier: 125, probability: 20 },
    epic: { name: 'Épico', multiplier: 150, probability: 8 },
    legendary: { name: 'Legendario', multiplier: 200, probability: 2 }
  };
  
  private constructor() {
    this.walletService = WalletService.getInstance();
  }
  
  /**
   * Obtiene la instancia singleton del servicio
   */
  public static getInstance(): NFTService {
    if (!NFTService.instance) {
      NFTService.instance = new NFTService();
    }
    return NFTService.instance;
  }
  
  /**
   * Sube una imagen a IPFS usando Pinata
   * @param file Archivo de imagen
   * @param metadata Metadata adicional
   * @returns Hash IPFS de la imagen
   */
  public async uploadImageToIPFS(file: File, metadata?: Record<string, any>): Promise<string> {
    try {
      logger.info('Subiendo imagen a IPFS...');
      
      const formData = new FormData();
      formData.append('file', file);
      
      const pinataMetadata = JSON.stringify({
        name: `Asset-${Date.now()}`,
        keyvalues: metadata
      });
      formData.append('pinataMetadata', pinataMetadata);
      
      const pinataOptions = JSON.stringify({
        cidVersion: 1,
      });
      formData.append('pinataOptions', pinataOptions);
      
      const response = await fetch(`${NFTService.PINATA_API_URL}/pinning/pinFileToIPFS`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
        },
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Error en Pinata: ${response.statusText}`);
      }
      
      const data = await response.json();
      logger.info('Imagen subida exitosamente a IPFS', { ipfsHash: data.IpfsHash });
      return data.IpfsHash;
      
    } catch (error) {
      logger.error('Error subiendo a IPFS', { error });
      throw error;
    }
  }
  
  /**
   * Genera metadata para un NFT
   */
  public async generateMetadata(
    name: string, 
    description: string, 
    imageHash: string,
    attributes: Record<string, any>
  ): Promise<string> {
    try {
      const metadata: NFTMetadata = {
        name,
        description,
        image: `${NFTService.PINATA_GATEWAY}${imageHash}`,
        attributes: Object.entries(attributes).map(([key, value]) => ({
          trait_type: key,
          value: value as string | number
        }))
      };
      
      // Subir JSON de metadata a IPFS
      const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
      const file = new File([blob], 'metadata.json', { type: 'application/json' });
      
      return await this.uploadImageToIPFS(file, { type: 'metadata' });
      
    } catch (error) {
      logger.error('Error generando metadata', { error });
      throw error;
    }
  }
  
  /**
   * Obtiene los NFTs de un usuario
   */
  public async getUserNFTs(userId: string): Promise<NFTInfo[]> {
    try {
      const { data, error } = await this.blockchainClient
        .from('nfts')
        .select('*')
        .eq('owner_id', userId);

      if (error) throw error;
      return (data || []).map((nft: any) => ({
        id: nft.id,
        token_id: nft.token_id,
        owner_address: nft.owner_address || '',
        metadata_uri: nft.metadata_uri,
        rarity: nft.rarity || 'common',
        is_couple: nft.is_couple || false,
        created_at: nft.created_at
      }));
    } catch (error) {
      logger.error('Error fetching user NFTs', { error });
      return [];
    }
  }

  /**
   * Obtiene solicitudes de NFT de pareja pendientes
   */
  public async getCoupleNFTRequests(userId: string): Promise<CoupleNFTRequest[]> {
    try {
      const { data, error } = await this.blockchainClient
        .from('couple_nft_requests')
        .select('*')
        .or(`requester_id.eq.${userId},partner_id.eq.${userId}`)
        .eq('status', 'pending');

      if (error) throw error;
      return data || [];
    } catch (error) {
      logger.error('Error fetching couple NFT requests', { error });
      return [];
    }
  }

  /**
   * Mintea un NFT individual
   */
  public async mintSingleNFT(userId: string, name: string, description: string, imageFile: File): Promise<boolean> {
    try {
      const imageHash = await this.uploadImageToIPFS(imageFile);
      const metadataHash = await this.generateMetadata(
        name,
        description,
        imageHash,
        {}
      );
      
      // Aquí iría la llamada al contrato inteligente
      logger.info('Minting single NFT', { userId, metadataHash });
      return true;
    } catch (error) {
      logger.error('Error minting single NFT', { error });
      return false;
    }
  }

  /**
   * Aprueba una solicitud de NFT de pareja
   */
  public async approveCoupleNFT(requestId: string): Promise<boolean> {
    try {
      const { error } = await this.blockchainClient
        .from('couple_nft_requests')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error approving couple NFT', { error });
      return false;
    }
  }

  /**
   * Inicia solicitud de NFT de pareja (requiere aprobación mutua)
   */
  public async requestCoupleNFT(
    requesterId: string, 
    partnerId: string, 
    name: string,
    description: string,
    imageFile: File
  ): Promise<boolean> {
    try {
      logger.info('Iniciando solicitud de NFT de pareja', { requesterId, partnerId });
      
      const imageHash = await this.uploadImageToIPFS(imageFile);
      const metadata = {
        name,
        description,
        imageHash,
        created_at: new Date().toISOString()
      };

      const { error } = await this.blockchainClient
        .from('couple_nft_requests')
        .insert({
          requester_id: requesterId,
          partner_id: partnerId,
          status: 'pending',
          metadata: metadata,
          created_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      // TODO: Notificar al partner
      return true;
      
    } catch (error) {
      logger.error('Error solicitando NFT de pareja', { error });
      return false;
    }
  }
}

export const nftService = NFTService.getInstance();
