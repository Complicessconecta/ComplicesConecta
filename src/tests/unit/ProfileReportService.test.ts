import { describe, it, expect, vi, beforeEach } from 'vitest';
import { profileReportService } from '@/features/profile/ProfileReportService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe('ProfileReportService', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createProfileReport', () => {
    it('should create a report successfully', async () => {
      // Setup mocks
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser }, error: null });
      
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'report-123', status: 'pending' },
            error: null,
          }),
        }),
      });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'reports') {
          return { insert: mockInsert };
        }
        if (table === 'notifications') {
          return { insert: vi.fn().mockResolvedValue({ error: null }) };
        }
        return {};
      });

      // Execute
      const result = await profileReportService.createProfileReport({
        reportedUserId: 'target-user-456',
        reason: 'harassment',
        description: 'Test description',
        severity: 'medium',
      });

      // Verify
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toBe('report-123');
      
      expect(supabase.from).toHaveBeenCalledWith('reports');
      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
        reporter_user_id: mockUser.id,
        reported_user_id: 'target-user-456',
        reason: 'harassment',
        severity: 'medium',
      }));
    });

    it('should fail if user is not authenticated', async () => {
      // Setup mocks
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null }, error: 'No session' });

      // Execute
      const result = await profileReportService.createProfileReport({
        reportedUserId: 'target-user-456',
        reason: 'harassment',
      });

      // Verify
      expect(result.success).toBe(false);
      expect(result.error).toBe('Usuario no autenticado');
    });

    it('should create a notification for confirmation', async () => {
      // Setup mocks
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser }, error: null });
      
      const mockReportsInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'report-123' },
            error: null,
          }),
        }),
      });

      const mockNotificationsInsert = vi.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'reports') return { insert: mockReportsInsert };
        if (table === 'notifications') return { insert: mockNotificationsInsert };
        return {};
      });

      // Execute
      await profileReportService.createProfileReport({
        reportedUserId: 'target-user-456',
        reason: 'harassment',
      });

      // Verify
      expect(supabase.from).toHaveBeenCalledWith('notifications');
      expect(mockNotificationsInsert).toHaveBeenCalledWith(expect.objectContaining({
        user_id: mockUser.id,
        type: 'report_update',
        title: 'Reporte Recibido',
      }));
    });
  });

  describe('canUserReport', () => {
    it('should return true if user has made few reports', async () => {
      // Setup mocks
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser }, error: null });
      
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({
              data: [{ id: 'r1' }, { id: 'r2' }], // 2 reports
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      // Execute
      const result = await profileReportService.canUserReport();

      // Verify
      expect(result.success).toBe(true);
      expect(result.canReport).toBe(true);
    });

    it('should return false if user has exceeded limit', async () => {
      // Setup mocks
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser }, error: null });
      
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            gte: vi.fn().mockResolvedValue({
              data: new Array(5).fill({ id: 'r' }), // 5 reports
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      // Execute
      const result = await profileReportService.canUserReport();

      // Verify
      expect(result.success).toBe(true);
      expect(result.canReport).toBe(false);
      expect(result.reason).toContain('límite');
    });
  });

  describe('analyzeReportContent', () => {
    it('should identify critical content', async () => {
      const result = await profileReportService.analyzeReportContent('comportamiento ilegal', 'venta de drogas');
      expect(result.score).toBeGreaterThan(90);
      expect(result.category).toBe('legal_safety');
    });

    it('should identify spam content', async () => {
      const result = await profileReportService.analyzeReportContent('es un perfil falso', 'spam masivo');
      expect(result.score).toBe(60);
      expect(result.category).toBe('spam_fraud');
    });

    it('should handle general content', async () => {
      const result = await profileReportService.analyzeReportContent('molesto', 'me cae mal');
      expect(result.score).toBe(30);
      expect(result.category).toBe('general_moderation');
    });
  });

  describe('getProfileScore', () => {
    it('should calculate score based on report count', async () => {
      // implementation: supabase.from('reports').select('*', {count: 'exact', head: true}).eq().eq()
      
      const mockEq2 = vi.fn().mockResolvedValue({ count: 2, error: null });
      const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
      const mockSelectChain = vi.fn().mockReturnValue({ eq: mockEq1 });
      
      (supabase.from as any).mockReturnValue({ select: mockSelectChain });

      const score = await profileReportService.getProfileScore('user-123');
      expect(score).toBe(90); // 100 - (2 * 5) = 90
    });
  });
});

