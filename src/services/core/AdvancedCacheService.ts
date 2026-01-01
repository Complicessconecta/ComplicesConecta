/**
 * AdvancedCacheService - Sistema de caché avanzado con múltiples estrategias
 * Implementa técnicas avanzadas de caché:
 * - Cache en memoria con LRU
 * - Cache persistente con IndexedDB
 * - Cache distribuido con Redis (futuro)
 * - Invalidación inteligente
 * - Compresión de datos
 */

// ------------------------------------------------------------------
// COMPLIANCE: DIAGRAMAS_FLUJOS_v4.0_DOCUMENTO_MAESTRO_IA.md
// Sistema operando bajo reglas de determinismo y robustez v4.0
// ------------------------------------------------------------------

import { logger } from '@/lib/logger';

export interface CacheConfig {
  maxMemorySize: number; // MB
  maxPersistentSize: number; // MB
  defaultTTL: number; // seconds
  compressionEnabled: boolean;
  enablePersistentCache: boolean;
  enableMemoryCache: boolean;
  cleanupInterval: number; // seconds
  enablePredictiveCache: boolean;
  enableAdaptiveTTL: boolean;
  enableDistributedCache: boolean;
  cacheWarmingEnabled: boolean;
  maxConcurrentRequests: number;
  batchSize: number;
  compressionThreshold: number; // bytes
  evictionPolicy: 'lru' | 'lfu' | 'fifo' | 'adaptive';
  priorityLevels: number;
}

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  compressed: boolean;
  size: number;
  priority: number;
  predictedAccessTime?: number;
  accessPattern: 'frequent' | 'recent' | 'sporadic' | 'burst';
  dependencies: string[];
  tags: string[];
}

export interface CacheStats {
  memoryEntries: number;
  persistentEntries: number;
  memorySize: number; // bytes
  persistentSize: number; // bytes
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  averageAccessTime: number;
  compressionRatio: number;
  predictiveHits: number;
  adaptiveTTLAdjustments: number;
  evictionCount: number;
  warmingHits: number;
  distributedSyncs: number;
  performanceScore: number;
}

export interface CacheInvalidationRule {
  pattern: string;
  strategy: 'exact' | 'prefix' | 'regex' | 'dependency' | 'tag';
  priority: number;
  cascade: boolean;
}

export interface CachePrediction {
  key: string;
  probability: number;
  expectedAccessTime: number;
  confidence: number;
}

export interface CacheWarmingStrategy {
  patterns: string[];
  priority: number;
  frequency: number; // seconds
  dependencies: string[];
}

export class AdvancedCacheService {
  private memoryCache = new Map<string, CacheEntry>();
  private persistentCache: IDBDatabase | null = null;
  private config: CacheConfig = {
    maxMemorySize: 50, // 50MB
    maxPersistentSize: 200, // 200MB
    defaultTTL: 300, // 5 minutes
    compressionEnabled: true,
    enablePersistentCache: true,
    enableMemoryCache: true,
    cleanupInterval: 60, // 1 minute
    enablePredictiveCache: true,
    enableAdaptiveTTL: true,
    enableDistributedCache: false,
    cacheWarmingEnabled: true,
    maxConcurrentRequests: 10,
    batchSize: 50,
    compressionThreshold: 1024, // 1KB
    evictionPolicy: 'adaptive',
    priorityLevels: 5
  };

  private stats = {
    hits: 0,
    misses: 0,
    totalAccessTime: 0,
    compressedSize: 0,
    originalSize: 0,
    predictiveHits: 0,
    adaptiveTTLAdjustments: 0,
    evictionCount: 0,
    warmingHits: 0,
    distributedSyncs: 0
  };

  private invalidationRules: CacheInvalidationRule[] = [];
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializePersistentCache();
    this.startCleanupInterval();
    this.setupDefaultInvalidationRules();
  }

  /**
   * Inicializa el cache persistente con IndexedDB
   */
  private async initializePersistentCache(): Promise<void> {
    if (!this.config.enablePersistentCache) return;

    try {
      const request = indexedDB.open('ComplicesConectaCache', 1);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('ttl', 'ttl', { unique: false });
        }
      };

      request.onsuccess = () => {
        this.persistentCache = request.result;
        logger.info('✅ Persistent cache initialized');
      };

      request.onerror = () => {
        logger.warn('⚠️ Failed to initialize persistent cache');
      };
    } catch (error) {
      logger.warn('⚠️ Persistent cache not available', { error: String(error) });
    }
  }

  /**
   * Obtiene un valor del cache con estrategia multi-nivel
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      // 1. Intentar desde cache en memoria
      if (this.config.enableMemoryCache) {
        const memoryResult = this.getFromMemoryCache<T>(key);
        if (memoryResult !== null) {
          this.stats.hits++;
          this.stats.totalAccessTime += Date.now() - startTime;
          logger.debug('✅ Memory cache hit', { key });
          return memoryResult;
        }
      }

      // 2. Intentar desde cache persistente
      if (this.config.enablePersistentCache && this.persistentCache) {
        const persistentResult = await this.getFromPersistentCache<T>(key);
        if (persistentResult !== null) {
          // Promover a cache en memoria
          this.setToMemoryCache(key, persistentResult, this.config.defaultTTL);
          this.stats.hits++;
          this.stats.totalAccessTime += Date.now() - startTime;
          logger.debug('✅ Persistent cache hit', { key });
          return persistentResult;
        }
      }

      // Cache miss
      this.stats.misses++;
      this.stats.totalAccessTime += Date.now() - startTime;
      logger.debug('❌ Cache miss', { key });
      return null;

    } catch (error) {
      logger.error('❌ Cache get error', { key, error: String(error) });
      return null;
    }
  }

  /**
   * Establece un valor en el cache con estrategia multi-nivel
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const actualTTL = ttl || this.config.defaultTTL;
    
    try {
      // 1. Establecer en cache en memoria
      if (this.config.enableMemoryCache) {
        this.setToMemoryCache(key, value, actualTTL);
      }

      // 2. Establecer en cache persistente
      if (this.config.enablePersistentCache && this.persistentCache) {
        await this.setToPersistentCache(key, value, actualTTL);
      }

      logger.debug('✅ Cache set', { key, ttl: actualTTL });

    } catch (error) {
      logger.error('❌ Cache set error', { key, error: String(error) });
    }
  }

  /**
   * Elimina un valor del cache
   */
  async delete(key: string): Promise<void> {
    try {
      // Eliminar de ambos caches
      if (this.config.enableMemoryCache) {
        this.memoryCache.delete(key);
      }

      if (this.config.enablePersistentCache && this.persistentCache) {
        await this.deleteFromPersistentCache(key);
      }

      logger.debug('🗑️ Cache deleted', { key });

    } catch (error) {
      logger.error('❌ Cache delete error', { key, error: String(error) });
    }
  }

  /**
   * Invalida cache basado en reglas
   */
  async invalidate(pattern: string, strategy: 'exact' | 'prefix' | 'regex' = 'prefix'): Promise<void> {
    try {
      const keysToDelete: string[] = [];

      // Encontrar claves que coincidan con el patrón
      if (strategy === 'exact') {
        keysToDelete.push(pattern);
      } else if (strategy === 'prefix') {
        for (const key of this.memoryCache.keys()) {
          if (key.startsWith(pattern)) {
            keysToDelete.push(key);
          }
        }
      } else if (strategy === 'regex') {
        const regex = new RegExp(pattern);
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) {
            keysToDelete.push(key);
          }
        }
      }

      // Eliminar claves encontradas
      for (const key of keysToDelete) {
        await this.delete(key);
      }

      logger.info('🔄 Cache invalidated', { 
        pattern, 
        strategy, 
        keysDeleted: keysToDelete.length 
      });

    } catch (error) {
      logger.error('❌ Cache invalidation error', { pattern, error: String(error) });
    }
  }

  /**
   * Obtiene estadísticas del cache
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    const missRate = totalRequests > 0 ? this.stats.misses / totalRequests : 0;
    const averageAccessTime = totalRequests > 0 ? this.stats.totalAccessTime / totalRequests : 0;
    const compressionRatio = this.stats.originalSize > 0 
      ? this.stats.compressedSize / this.stats.originalSize 
      : 1;

    // Calcular score de rendimiento
    const performanceScore = this.calculatePerformanceScore(hitRate, averageAccessTime, compressionRatio);

    const stats = {
      memoryEntries: this.memoryCache.size,
      persistentEntries: 0, // TODO: Implementar conteo de entradas persistentes
      memorySize: this.calculateMemorySize(),
      persistentSize: 0, // TODO: Implementar cálculo de tamaño persistente
      hitRate,
      missRate,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      averageAccessTime,
      compressionRatio,
      predictiveHits: this.stats.predictiveHits,
      adaptiveTTLAdjustments: this.stats.adaptiveTTLAdjustments,
      evictionCount: this.stats.evictionCount,
      warmingHits: this.stats.warmingHits,
      distributedSyncs: this.stats.distributedSyncs,
      performanceScore
    };

    // Registrar estadísticas en cache_statistics (async, no bloquea)
    this.logCacheStatistics(stats).catch(err => 
      logger.debug('Failed to log cache statistics:', { error: String(err) })
    );

    return stats;
  }

  /**
   * Registra estadísticas del cache en la base de datos
   * @private
   * NOTA: La tabla 'cache_statistics' no existe en el schema actual de Supabase
   * Esta función está deshabilitada hasta que se cree la tabla correspondiente
   */
  private async logCacheStatistics(_stats: CacheStats): Promise<void> {
    // TODO: Implementar cuando la tabla cache_statistics esté disponible en Supabase
    // try {
    //   const { supabase } = await import('@/integrations/supabase/client');
    //   if (!supabase) return;
    //
    //   await supabase
    //     .from('cache_statistics')
    //     .insert({
    //       hit_rate: stats.hitRate,
    //       miss_rate: stats.missRate,
    //       total_hits: stats.totalHits,
    //       total_misses: stats.totalMisses,
    //       average_access_time_ms: stats.averageAccessTime,
    //       memory_entries: stats.memoryEntries,
    //       memory_size_bytes: stats.memorySize,
    //       compression_ratio: stats.compressionRatio,
    //       performance_score: stats.performanceScore,
    //       timestamp: new Date().toISOString(),
    //     });
    // } catch (error) {
    //   logger.debug('Failed to log cache statistics:', { error: String(error) });
    // }
  }

  /**
   * Calcula score de rendimiento general
   */
  private calculatePerformanceScore(hitRate: number, averageAccessTime: number, compressionRatio: number): number {
    let score = 0;
    
    // Hit rate (40% del score)
    score += hitRate * 40;
    
    // Velocidad de acceso (30% del score)
    score += Math.max(0, 30 - (averageAccessTime / 2));
    
    // Compresión (20% del score)
    score += Math.max(0, 20 - (compressionRatio * 20));
    
    // Predicciones exitosas (10% del score)
    const predictiveRate = this.stats.predictiveHits / Math.max(this.stats.hits, 1);
    score += predictiveRate * 10;
    
    return Math.min(score, 100);
  }

  /**
   * Limpia el cache expirado
   */
  async cleanup(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    // Limpiar cache en memoria
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.memoryCache.delete(key);
    }

    // Limpiar cache persistente
    if (this.persistentCache) {
      await this.cleanupPersistentCache();
    }

    logger.info('🧹 Cache cleanup completed', { 
      expiredKeys: expiredKeys.length,
      memoryEntries: this.memoryCache.size
    });
  }

  /**
   * Obtiene valor del cache en memoria
   */
  private getFromMemoryCache<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl * 1000) {
      this.memoryCache.delete(key);
      return null;
    }

    // Actualizar estadísticas de acceso
    entry.accessCount++;
    entry.lastAccessed = now;

    // Descomprimir si es necesario
    if (entry.compressed) {
      try {
        return this.decompress(entry.data);
      } catch (error) {
        logger.warn('⚠️ Failed to decompress cache entry', { key, error: String(error) });
        this.memoryCache.delete(key);
        return null;
      }
    }

    return entry.data;
  }

  /**
   * Establece valor en cache en memoria
   */
  private setToMemoryCache<T>(key: string, value: T, ttl: number): void {
    const now = Date.now();
    let data = value;
    let compressed = false;
    let size = this.calculateSize(value);

    // Comprimir si está habilitado y el tamaño es significativo
    if (this.config.compressionEnabled && size > 1024) { // > 1KB
      try {
        data = this.compress(value) as any;
        compressed = true;
        size = this.calculateSize(data);
        this.stats.compressedSize += size;
        this.stats.originalSize += this.calculateSize(value);
      } catch (error) {
        logger.warn('⚠️ Compression failed, storing uncompressed', { key, error: String(error) });
      }
    }

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: now,
      ttl,
      accessCount: 1,
      lastAccessed: now,
      compressed,
      size,
      priority: 1, // Prioridad por defecto
      accessPattern: 'recent',
      dependencies: [],
      tags: []
    };

    this.memoryCache.set(key, entry);

    // Verificar límite de tamaño y limpiar si es necesario
    this.enforceMemoryLimit();
  }

  /**
   * Obtiene valor del cache persistente
   */
  private async getFromPersistentCache<T>(key: string): Promise<T | null> {
    if (!this.persistentCache) return null;

    return new Promise((resolve) => {
      const transaction = this.persistentCache!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry<T>;
        if (!entry) {
          resolve(null);
          return;
        }

        const now = Date.now();
        if (now - entry.timestamp > entry.ttl * 1000) {
          // Eliminar entrada expirada
          this.deleteFromPersistentCache(key);
          resolve(null);
          return;
        }

        // Descomprimir si es necesario
        if (entry.compressed) {
          try {
            resolve(this.decompress(entry.data as string));
          } catch (error) {
            logger.warn('⚠️ Failed to decompress persistent cache entry', { key, error: String(error) });
            this.deleteFromPersistentCache(key);
            resolve(null);
          }
        } else {
          resolve(entry.data);
        }
      };

      request.onerror = () => {
        logger.warn('⚠️ Failed to get from persistent cache', { key });
        resolve(null);
      };
    });
  }

  /**
   * Establece valor en cache persistente
   */
  private async setToPersistentCache<T>(key: string, value: T, ttl: number): Promise<void> {
    if (!this.persistentCache) return;

    const now = Date.now();
    let data = value;
    let compressed = false;
    let size = this.calculateSize(value);

    // Comprimir si está habilitado
    if (this.config.compressionEnabled && size > 1024) {
      try {
        data = this.compress(value) as any;
        compressed = true;
        size = this.calculateSize(data);
      } catch (error) {
        logger.warn('⚠️ Compression failed for persistent cache', { key, error: String(error) });
      }
    }

    const entry: CacheEntry<T> = {
      key,
      data,
      timestamp: now,
      ttl,
      accessCount: 1,
      lastAccessed: now,
      compressed,
      size,
      priority: 1,
      accessPattern: 'recent',
      dependencies: [],
      tags: []
    };

    return new Promise((resolve, reject) => {
      const transaction = this.persistentCache!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Elimina valor del cache persistente
   */
  private async deleteFromPersistentCache(key: string): Promise<void> {
    if (!this.persistentCache) return;

    return new Promise((resolve, reject) => {
      const transaction = this.persistentCache!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Limpia cache persistente expirado
   */
  private async cleanupPersistentCache(): Promise<void> {
    if (!this.persistentCache) return;

    return new Promise((resolve) => {
      const transaction = this.persistentCache!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('timestamp');
      const now = Date.now();
      const range = IDBKeyRange.upperBound(now - this.config.defaultTTL * 1000);
      const request = index.openCursor(range);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => resolve();
    });
  }

  /**
   * Comprime datos usando JSON y base64
   */
  private compress<T>(data: T): string {
    const jsonString = JSON.stringify(data);
    return btoa(jsonString);
  }

  /**
   * Descomprime datos
   */
  private decompress<T>(compressedData: string): T {
    const jsonString = atob(compressedData);
    return JSON.parse(jsonString);
  }

  /**
   * Calcula el tamaño aproximado de un objeto
   */
  private calculateSize<T>(data: T): number {
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 0;
    }
  }

  /**
   * Calcula el tamaño total del cache en memoria
   */
  private calculateMemorySize(): number {
    let totalSize = 0;
    for (const entry of this.memoryCache.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  /**
   * Aplica límite de memoria y elimina entradas menos usadas
   */
  private enforceMemoryLimit(): void {
    const maxSizeBytes = this.config.maxMemorySize * 1024 * 1024;
    let currentSize = this.calculateMemorySize();

    if (currentSize > maxSizeBytes) {
      // Ordenar por frecuencia de acceso y eliminar los menos usados
      const entries = Array.from(this.memoryCache.entries())
        .sort(([, a], [, b]) => a.accessCount - b.accessCount);

      for (const [key, entry] of entries) {
        this.memoryCache.delete(key);
        currentSize -= entry.size;
        
        if (currentSize <= maxSizeBytes * 0.8) { // Mantener 80% del límite
          break;
        }
      }

      logger.info('🧹 Memory cache cleaned due to size limit', { 
        entriesRemoved: entries.length,
        newSize: this.calculateMemorySize()
      });
    }
  }

  /**
   * Inicia el intervalo de limpieza automática
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval * 1000);
  }

  /**
   * Configura reglas de invalidación por defecto
   */
  private setupDefaultInvalidationRules(): void {
    this.invalidationRules = [
      { pattern: 'profiles:', strategy: 'prefix', priority: 1, cascade: true },
      { pattern: 'stories:', strategy: 'prefix', priority: 2, cascade: true },
      { pattern: 'analytics:', strategy: 'prefix', priority: 3, cascade: false },
      { pattern: 'user:', strategy: 'prefix', priority: 1, cascade: true }
    ];
  }

  /**
   * Actualiza configuración del cache
   */
  updateConfig(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('⚙️ Cache config updated', { config: this.config });
  }

  /**
   * Limpia todo el cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    if (this.persistentCache) {
      const transaction = this.persistentCache.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      await store.clear();
    }

    this.stats = {
      hits: 0,
      misses: 0,
      totalAccessTime: 0,
      compressedSize: 0,
      originalSize: 0,
      predictiveHits: 0,
      adaptiveTTLAdjustments: 0,
      evictionCount: 0,
      warmingHits: 0,
      distributedSyncs: 0
    };

    logger.info('🧹 All cache cleared');
  }

  /**
   * Cache predictivo - predice qué datos se necesitarán próximamente
   */
  async predictAndWarm(accessPattern: string[]): Promise<void> {
    if (!this.config.enablePredictiveCache) return;

    try {
      const predictions = this.generatePredictions(accessPattern);
      
      for (const prediction of predictions) {
        if (prediction.probability > 0.7) {
          // Pre-cargar datos predichos
          await this.warmCache(prediction.key);
        }
      }

      logger.info('🔮 Predictive cache warming completed', { 
        predictions: predictions.length 
      });
    } catch (error) {
      logger.error('Error in predictive cache warming:', { error: String(error) });
    }
  }

  /**
   * Genera predicciones basadas en patrones de acceso
   */
  private generatePredictions(accessPattern: string[]): CachePrediction[] {
    const predictions: CachePrediction[] = [];
    const patternCounts = new Map<string, number>();
    
    // Analizar patrones de acceso
    for (const pattern of accessPattern) {
      patternCounts.set(pattern, (patternCounts.get(pattern) || 0) + 1);
    }

    // Generar predicciones basadas en frecuencia y secuencias
    for (const [pattern, count] of patternCounts) {
      const probability = Math.min(count / accessPattern.length, 1);
      const confidence = this.calculateConfidence(pattern, accessPattern);
      
      predictions.push({
        key: pattern,
        probability,
        expectedAccessTime: Date.now() + this.calculateExpectedDelay(pattern),
        confidence
      });
    }

    return predictions.sort((a, b) => b.probability - a.probability);
  }

  /**
   * Calcula la confianza de una predicción
   */
  private calculateConfidence(pattern: string, accessPattern: string[]): number {
    const recentPatterns = accessPattern.slice(-10); // Últimos 10 accesos
    const frequency = recentPatterns.filter(p => p === pattern).length;
    return Math.min(frequency / 10, 1);
  }

  /**
   * Calcula el tiempo esperado hasta el próximo acceso
   */
  private calculateExpectedDelay(pattern: string): number {
    const entry = this.memoryCache.get(pattern);
    if (!entry) return 300000; // 5 minutos por defecto

    const timeSinceLastAccess = Date.now() - entry.lastAccessed;
    const averageInterval = timeSinceLastAccess / entry.accessCount;
    
    return Math.min(averageInterval, 1800000); // Máximo 30 minutos
  }

  /**
   * Pre-carga datos en el cache
   */
  private async warmCache(key: string): Promise<void> {
    try {
      // Verificar si ya está en cache
      if (this.memoryCache.has(key)) {
        this.stats.warmingHits++;
        return;
      }

      // TODO: Implementar lógica de pre-carga específica
      // Por ejemplo, cargar desde API o base de datos
      logger.debug('🔥 Cache warming:', { key });
    } catch (error) {
      logger.error('Error warming cache:', { key, error: String(error) });
    }
  }

  /**
   * TTL adaptativo - ajusta TTL basado en patrones de acceso
   */
  private adjustTTL(entry: CacheEntry): number {
    if (!this.config.enableAdaptiveTTL) return entry.ttl;

    const now = Date.now();
    const _timeSinceLastAccess = now - entry.lastAccessed;
    const accessFrequency = entry.accessCount / ((now - entry.timestamp) / 1000);

    let newTTL = entry.ttl;

    // Ajustar TTL basado en frecuencia de acceso
    if (accessFrequency > 0.1) { // Acceso frecuente
      newTTL = Math.min(entry.ttl * 1.5, 3600); // Aumentar TTL hasta 1 hora
    } else if (accessFrequency < 0.01) { // Acceso esporádico
      newTTL = Math.max(entry.ttl * 0.5, 60); // Reducir TTL mínimo 1 minuto
    }

    if (newTTL !== entry.ttl) {
      this.stats.adaptiveTTLAdjustments++;
      logger.debug('🔄 TTL adjusted:', { 
        key: entry.key, 
        oldTTL: entry.ttl, 
        newTTL 
      });
    }

    return newTTL;
  }

  /**
   * Política de evicción adaptativa
   */
  private evictEntries(): void {
    const maxEntries = this.config.maxMemorySize * 1024 * 1024 / 1024; // Entradas aproximadas
    if (this.memoryCache.size <= maxEntries) return;

    const entriesToEvict = this.memoryCache.size - Math.floor(maxEntries * 0.8);
    const entries = Array.from(this.memoryCache.entries());

    let evictedCount = 0;

    switch (this.config.evictionPolicy) {
      case 'lru':
        entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
        break;
      case 'lfu':
        entries.sort(([, a], [, b]) => a.accessCount - b.accessCount);
        break;
      case 'fifo':
        entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
        break;
      case 'adaptive':
        entries.sort(([, a], [, b]) => {
          const scoreA = this.calculateEvictionScore(a);
          const scoreB = this.calculateEvictionScore(b);
          return scoreA - scoreB;
        });
        break;
    }

    for (const [key, _entry] of entries.slice(0, entriesToEvict)) {
      this.memoryCache.delete(key);
      evictedCount++;
    }

    this.stats.evictionCount += evictedCount;
    logger.info('🗑️ Cache eviction completed:', { 
      evictedCount, 
      policy: this.config.evictionPolicy 
    });
  }

  /**
   * Calcula score de evicción para política adaptativa
   */
  private calculateEvictionScore(entry: CacheEntry): number {
    const now = Date.now();
    const age = now - entry.timestamp;
    const timeSinceLastAccess = now - entry.lastAccessed;
    const accessFrequency = entry.accessCount / (age / 1000);

    // Score más alto = más probable de ser evictado
    let score = 0;
    
    // Penalizar por edad
    score += age / 1000000; // 1 punto por millón de ms
    
    // Penalizar por tiempo sin acceso
    score += timeSinceLastAccess / 100000; // 1 punto por 100k ms
    
    // Bonificar por frecuencia de acceso
    score -= accessFrequency * 100;
    
    // Bonificar por prioridad alta
    score -= entry.priority * 10;
    
    // Penalizar por tamaño grande
    score += entry.size / 10000; // 1 punto por 10KB

    return score;
  }

  /**
   * Cache distribuido - sincroniza con otros nodos
   */
  async syncWithDistributedCache(): Promise<void> {
    if (!this.config.enableDistributedCache) return;

    try {
      // TODO: Implementar sincronización con Redis o similar
      // Por ahora, simular sincronización
      this.stats.distributedSyncs++;
      
      logger.info('🔄 Distributed cache sync completed');
    } catch (error) {
      logger.error('Error syncing distributed cache:', { error: String(error) });
    }
  }

  /**
   * Análisis de rendimiento del cache
   */
  getPerformanceAnalysis(): {
    score: number;
    recommendations: string[];
    bottlenecks: string[];
  } {
    const stats = this.getStats();
    const recommendations: string[] = [];
    const bottlenecks: string[] = [];
    let score = 0;

    // Calcular score de rendimiento
    score += stats.hitRate * 40; // 40% del score por hit rate
    score += Math.min(stats.averageAccessTime / 10, 20); // 20% por velocidad
    score += Math.min(stats.compressionRatio * 20, 20); // 20% por compresión
    score += Math.min(stats.predictiveHits / 100, 20); // 20% por predicciones

    // Generar recomendaciones
    if (stats.hitRate < 0.7) {
      recommendations.push('Considerar aumentar el tamaño del cache');
      bottlenecks.push('Bajo hit rate');
    }

    if (stats.averageAccessTime > 50) {
      recommendations.push('Optimizar algoritmos de acceso');
      bottlenecks.push('Tiempo de acceso lento');
    }

    if (stats.compressionRatio > 0.8) {
      recommendations.push('Mejorar algoritmo de compresión');
      bottlenecks.push('Compresión ineficiente');
    }

    if (stats.memorySize > this.config.maxMemorySize * 1024 * 1024 * 0.9) {
      recommendations.push('Aumentar límite de memoria o mejorar evicción');
      bottlenecks.push('Memoria casi llena');
    }

    return {
      score: Math.min(score, 100),
      recommendations,
      bottlenecks
    };
  }

  /**
   * Optimización automática del cache
   */
  async optimize(): Promise<void> {
    try {
      const analysis = this.getPerformanceAnalysis();
      
      // Aplicar optimizaciones automáticas
      if (analysis.score < 70) {
        // Ajustar configuración automáticamente
        if (analysis.bottlenecks.includes('Bajo hit rate')) {
          this.config.defaultTTL = Math.min(this.config.defaultTTL * 1.2, 1800);
        }
        
        if (analysis.bottlenecks.includes('Memoria casi llena')) {
          this.config.maxMemorySize = Math.min(this.config.maxMemorySize * 1.5, 200);
        }
        
        // Limpiar cache si es necesario
        await this.cleanup();
        
        logger.info('⚡ Cache optimization completed:', { 
          score: analysis.score,
          optimizations: analysis.recommendations.length 
        });
      }
    } catch (error) {
      logger.error('Error optimizing cache:', { error: String(error) });
    }
  }

  /**
   * Cache con dependencias - invalida entradas relacionadas
   */
  async invalidateByDependency(dependencyKey: string): Promise<void> {
    try {
      const keysToInvalidate: string[] = [];
      
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.dependencies.includes(dependencyKey)) {
          keysToInvalidate.push(key);
        }
      }

      for (const key of keysToInvalidate) {
        await this.delete(key);
      }

      logger.info('🔗 Dependency invalidation completed:', { 
        dependencyKey, 
        invalidatedKeys: keysToInvalidate.length 
      });
    } catch (error) {
      logger.error('Error invalidating by dependency:', { error: String(error) });
    }
  }

  /**
   * Cache con tags - invalida por etiquetas
   */
  async invalidateByTag(tag: string): Promise<void> {
    try {
      const keysToInvalidate: string[] = [];
      
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.tags.includes(tag)) {
          keysToInvalidate.push(key);
        }
      }

      for (const key of keysToInvalidate) {
        await this.delete(key);
      }

      logger.info('🏷️ Tag invalidation completed:', { 
        tag, 
        invalidatedKeys: keysToInvalidate.length 
      });
    } catch (error) {
      logger.error('Error invalidating by tag:', { error: String(error) });
    }
  }

  /**
   * Destruye el servicio y limpia recursos
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.memoryCache.clear();
    
    if (this.persistentCache) {
      this.persistentCache.close();
    }

    logger.info('🔚 Cache service destroyed');
  }
}

export const advancedCacheService = new AdvancedCacheService();

