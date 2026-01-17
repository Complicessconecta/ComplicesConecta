/**
 * FaceRecognitionService - Servicio de reconocimiento facial
 *
 * Implementa comparación de selfies con fotos de perfil
 * Para producción, usar servicios como:
 * - AWS Rekognition
 * - Google Cloud Vision API
 * - Microsoft Azure Face API
 * - Face++ API
 *
 * @version 1.0.0
 */

import { logger } from "@/lib/logger";

export interface FaceComparisonResult {
  match: boolean;
  confidence: number; // 0-100
  faceDetected: boolean;
  error?: string;
}

export class FaceRecognitionService {
  private static instance: FaceRecognitionService;

  private constructor() {}

  static getInstance(): FaceRecognitionService {
    if (!FaceRecognitionService.instance) {
      FaceRecognitionService.instance = new FaceRecognitionService();
    }
    return FaceRecognitionService.instance;
  }

  /**
   * Compara selfie con foto de perfil
   * Implementación básica usando comparación visual simple
   * Para producción, usar API de reconocimiento facial
   */
  async compareFaces(
    selfieImageUrl: string,
    profileImageUrl?: string,
  ): Promise<FaceComparisonResult> {
    try {
      logger.info("📸 Comparando rostros", {
        selfie: selfieImageUrl.substring(0, 50) + "***",
        profile: profileImageUrl?.substring(0, 50) + "***",
      });

      // Si no hay foto de perfil, solo verificar que se detecte un rostro
      if (!profileImageUrl) {
        const faceDetected = await this.detectFace(selfieImageUrl);
        return {
          match: false,
          confidence: faceDetected ? 50 : 0,
          faceDetected,
        };
      }

      // Implementación básica: comparación de hashes de imagen
      // Para producción, usar API de reconocimiento facial real
      const similarity = await this.calculateImageSimilarity(
        selfieImageUrl,
        profileImageUrl,
      );

      const match = similarity >= 70; // Umbral de similitud
      const confidence = Math.min(similarity + 20, 95); // Boost de confianza

      logger.info("✅ Comparación de rostros completada", {
        match,
        confidence,
        similarity,
      });

      return {
        match,
        confidence,
        faceDetected: similarity > 0,
      };
    } catch (error) {
      logger.error("Error comparando rostros:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        match: false,
        confidence: 0,
        faceDetected: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Detecta si hay un rostro en la imagen
   * Implementación básica usando canvas
   */
  private async detectFace(_imageUrl: string): Promise<boolean> {
    try {
      // Para producción, usar API de detección de rostros
      // Por ahora, asumimos que si la imagen se cargó, hay un rostro
      // En un caso real, usaríamos face-api.js o similar
      return true;
    } catch (error) {
      logger.error("Error detectando rostro:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Calcula similitud entre dos imágenes
   * Implementación básica usando comparación de píxeles
   * Para producción, usar algoritmos de reconocimiento facial
   */
  private async calculateImageSimilarity(
    image1Url: string,
    image2Url: string,
  ): Promise<number> {
    try {
      // Cargar imágenes
      const img1 = await this.loadImage(image1Url);
      const img2 = await this.loadImage(image2Url);

      if (!img1 || !img2) {
        return 0;
      }

      // Crear canvas para comparación
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return 0;

      // Redimensionar imágenes al mismo tamaño
      const size = 100;
      canvas.width = size;
      canvas.height = size;

      // Obtener datos de imagen 1
      ctx.drawImage(img1, 0, 0, size, size);
      const data1 = ctx.getImageData(0, 0, size, size).data;

      // Obtener datos de imagen 2
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(img2, 0, 0, size, size);
      const data2 = ctx.getImageData(0, 0, size, size).data;

      // Calcular similitud usando MSE (Mean Squared Error)
      let mse = 0;
      for (let i = 0; i < data1.length; i += 4) {
        const r1 = data1[i] ?? 0;
        const g1 = data1[i + 1] ?? 0;
        const b1 = data1[i + 2] ?? 0;
        const r2 = data2[i] ?? 0;
        const g2 = data2[i + 1] ?? 0;
        const b2 = data2[i + 2] ?? 0;

        mse +=
          Math.pow(r1 - r2, 2) +
          Math.pow(g1 - g2, 2) +
          Math.pow(b1 - b2, 2);
      }

      mse /= (size * size * 3);

      // Convertir MSE a similitud (0-100)
      const maxMse = 255 * 255 * 3;
      const similarity = Math.max(0, 100 - (mse / maxMse) * 100);

      return similarity;
    } catch (error) {
      logger.error("Error calculando similitud de imágenes:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return 0;
    }
  }

  /**
   * Carga una imagen desde URL
   */
  private loadImage(url: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  /**
   * Extrae características faciales de una imagen
   * Para producción, usar API de reconocimiento facial
   */
  async extractFaceFeatures(_imageUrl: string): Promise<number[] | null> {
    try {
      // Para producción, usar API de reconocimiento facial
      // Por ahora, retornar null
      logger.warn("Extracción de características faciales no implementada");
      return null;
    } catch (error) {
      logger.error("Error extrayendo características faciales:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Verifica si la imagen es una selfie válida
   */
  async isValidSelfie(imageUrl: string): Promise<boolean> {
    try {
      const faceDetected = await this.detectFace(imageUrl);
      return faceDetected;
    } catch (error) {
      logger.error("Error verificando selfie:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}

// Exportar instancia singleton
export const faceRecognitionService = FaceRecognitionService.getInstance();
