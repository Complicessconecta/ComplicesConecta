/**
 * Tests unitarios para HistoricalMetricsService v3.4.1
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { historicalMetricsService, HistoricalMetricsService } from '../../services/analytics/HistoricalMetricsService'

// Mock de Supabase
const mockPerformanceData = [
  {
    timestamp: '2025-01-01T10:00:00Z',
    load_time: 150,
    interaction_time: 50,
    memory_usage: 200,
    total_requests: 10
  },
  {
    timestamp: '2025-01-01T10:30:00Z',
    load_time: 160,
    interaction_time: 55,
    memory_usage: 210,
    total_requests: 15
  },
  {
    timestamp: '2025-01-01T11:00:00Z',
    load_time: 140,
    interaction_time: 45,
    memory_usage: 190,
    total_requests: 8
  }
];

const mockErrorData = [
  {
    timestamp: '2025-01-01T10:00:00Z',
    severity: 'critical'
  },
  {
    timestamp: '2025-01-01T10:30:00Z',
    severity: 'high'
  },
  {
    timestamp: '2025-01-01T11:00:00Z',
    severity: 'low'
  }
];

const mockWebVitalsData = [
  {
    timestamp: '2025-01-01T10:00:00Z',
    lcp: 1000,
    fid: 50,
    cls: 0.05,
    fcp: 800,
    ttfb: 200
  },
  {
    timestamp: '2025-01-01T11:00:00Z',
    lcp: 1200,
    fid: 60,
    cls: 0.08,
    fcp: 900,
    ttfb: 250
  }
];

const mockModerationData = [
  {
    created_at: '2025-01-01T10:00:00Z',
    status: 'pending'
  },
  {
    created_at: '2025-01-01T10:30:00Z',
    status: 'resolved'
  },
  {
    created_at: '2025-01-01T11:00:00Z',
    status: 'dismissed'
  }
];

vi.mock('../../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn((table) => {
      let mockData: any[] = [];
      if (table === 'performance_metrics') mockData = mockPerformanceData;
      else if (table === 'error_alerts') mockData = mockErrorData;
      else if (table === 'web_vitals_history') mockData = mockWebVitalsData;
      else if (table === 'reports') mockData = mockModerationData;

      return {
        select: vi.fn(() => ({
          gte: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: mockData, error: null }))
          }))
        }))
      };
    })
  }
}));

// Mock del logger
vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn()
  }
}));

describe('HistoricalMetricsService', () => {
  let service: HistoricalMetricsService;

  beforeEach(() => {
    service = HistoricalMetricsService.getInstance();
    vi.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = HistoricalMetricsService.getInstance();
      const instance2 = HistoricalMetricsService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getPerformanceTrends', () => {
    it('should return performance trends grouped by hour', async () => {
      const result = await service.getPerformanceTrends({ hours: 24, interval: 'hour' });

      expect(result).toBeDefined();
      expect(result.loadTime.length).toBeGreaterThan(0);
      expect(result.interactionTime.length).toBeGreaterThan(0);
      expect(result.memoryUsage.length).toBeGreaterThan(0);
      expect(result.requests.length).toBeGreaterThan(0);

      // Verify data aggregation
      const firstLoadTime = result.loadTime[0];
      expect(firstLoadTime.value).toBeGreaterThan(0);
      expect(firstLoadTime.timestamp).toContain('2025-01-01');
    });

    it('should handle empty data gracefully', async () => {
      // Mock empty return
      const { supabase } = await import('../../integrations/supabase/client');
      vi.mocked(supabase.from).mockImplementationOnce(() => ({
        select: vi.fn(() => ({
          gte: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      } as any));

      const result = await service.getPerformanceTrends();
      expect(result.loadTime).toEqual([]);
      expect(result.interactionTime).toEqual([]);
    });
  });

  describe('getErrorTrends', () => {
    it('should return error trends grouped by hour', async () => {
      const result = await service.getErrorTrends({ hours: 24, interval: 'hour' });

      expect(result).toBeDefined();
      expect(result.total.length).toBeGreaterThan(0);
      expect(result.critical.length).toBeGreaterThan(0);
      
      // Verify counts
      const totalErrors = result.total.reduce((sum, item) => sum + item.value, 0);
      expect(totalErrors).toBe(3); // 3 items in mock data
    });
  });

  describe('getWebVitalsTrends', () => {
    it('should return web vitals trends', async () => {
      const result = await service.getWebVitalsTrends({ hours: 24, interval: 'hour' });

      expect(result).toBeDefined();
      expect(result.lcp.length).toBeGreaterThan(0);
      expect(result.fid.length).toBeGreaterThan(0);
    });
  });

  describe('getModerationTrends', () => {
    it('should return moderation trends', async () => {
      const result = await service.getModerationTrends({ days: 7, interval: 'hour' }); // using hour to match mock data timestamp resolution

      expect(result).toBeDefined();
      expect(result.total.length).toBeGreaterThan(0);
      expect(result.pending.length).toBeGreaterThan(0);
      expect(result.resolved.length).toBeGreaterThan(0);
    });
  });
});
