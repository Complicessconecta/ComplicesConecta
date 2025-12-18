
import { logger } from '@/lib/logger';

export interface AIHealthStatus {
  status: 'online' | 'degraded' | 'offline';
  latency: number;
  lastCheck: string;
  services: {
    matching: boolean;
    moderation: boolean;
    recommendations: boolean;
  };
}

class AIHeartbeatService {
  private static instance: AIHeartbeatService;
  private status: AIHealthStatus = {
    status: 'offline',
    latency: 0,
    lastCheck: new Date().toISOString(),
    services: {
      matching: false,
      moderation: false,
      recommendations: false
    }
  };

  private constructor() {
    this.startHeartbeat();
  }

  public static getInstance(): AIHeartbeatService {
    if (!AIHeartbeatService.instance) {
      AIHeartbeatService.instance = new AIHeartbeatService();
    }
    return AIHeartbeatService.instance;
  }

  private async checkServiceHealth(): Promise<void> {
    const start = performance.now();
    try {
      // Simulate API check - replace with actual endpoint call
      // await fetch(`${AppConfig.api.aiUrl}/health`);
      
      const latency = Math.round(performance.now() - start);
      
      this.status = {
        status: latency < 200 ? 'online' : 'degraded',
        latency,
        lastCheck: new Date().toISOString(),
        services: {
          matching: true,
          moderation: true,
          recommendations: true
        }
      };
    } catch (error) {
      logger.error('AI Service heartbeat failed', { error });
      this.status = {
        status: 'offline',
        latency: 0,
        lastCheck: new Date().toISOString(),
        services: {
          matching: false,
          moderation: false,
          recommendations: false
        }
      };
    }
  }

  private startHeartbeat(intervalMs: number = 30000): void {
    // Initial check
    this.checkServiceHealth();
    
    // Periodic check
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.checkServiceHealth();
      }, intervalMs);
    }
  }

  public getStatus(): AIHealthStatus {
    return { ...this.status };
  }
}

export const aiHeartbeat = AIHeartbeatService.getInstance();
