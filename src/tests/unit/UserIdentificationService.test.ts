import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userIdentificationService } from '@/services/auth/UserIdentificationService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue({
              data: [{ numeric_id: 10 }],
              error: null
            })
          })),
          single: vi.fn().mockResolvedValue({
            data: {
              unique_id: 'SNG-00000011',
              user_id: 'user-123',
              profile_type: 'single',
              prefix: 'SNG',
              numeric_id: 11,
              created_at: new Date().toISOString(),
              metadata: {}
            },
            error: null
          })
        })),
        single: vi.fn()
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: {}, error: null })
        }))
      }))
    }))
  }
}));

describe('UserIdentificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateUniqueId', () => {
    it('should generate a unique ID correctly', async () => {
      // Mock findByUserId to return null (no existing ID)
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }) // Not found
          })
        })
      });

      // Mock getNextSequentialNumber
      // We need to re-mock the chain for getNextSequentialNumber
      // But wait, generateUniqueId calls findByUserId first.
      
      // Let's improve the mock setup to handle different calls based on arguments or method chains
      // Ideally we mock the implementation of internal methods if possible, but here we test the public API.
      
      // Since supabase.from is called multiple times, we need to mock the return values carefully.
      // But for simplicity in this unit test environment, we can rely on the default mocks or specific overrides.
      
      // Override for this specific test
      const selectMock = vi.fn();
      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: {}, error: null })
        })
      });

      (supabase.from as any).mockReturnValue({
        select: selectMock,
        insert: insertMock
      });

      // 1. First call: findByUserId -> select('*').eq().single() -> returns null (not found)
      // 2. Second call: getNextSequentialNumber -> select('numeric_id').eq().order().limit() -> returns 10
      
      selectMock.mockImplementation((columns) => {
        if (columns === '*') {
          return {
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
            }),
            // Mock for listByProfileType or stats if called with * but not followed by eq().single() immediately
            // But here we need to handle specific chains.
            // For safety, let's just return a generic chain if needed.
          };
        }
        if (columns === 'numeric_id') {
          return {
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue({
                  data: [{ numeric_id: 10 }],
                  error: null
                })
              })
            })
          };
        }
        return { 
          eq: vi.fn().mockReturnValue({
             single: vi.fn(),
             count: 5, 
             error: null
          }) 
        };
      });

      const result = await userIdentificationService.generateUniqueId('user-new', 'single');

      expect(result.numericId).toBe(11); // 10 + 1
      expect(result.uniqueId).toBe('SNG-00000011');
      expect(result.profileType).toBe('single');
      expect(insertMock).toHaveBeenCalled();
    });

    it('should return existing ID if user already has one', async () => {
      // Mock findByUserId to return existing
      const existingId = {
        unique_id: 'SNG-00000005',
        user_id: 'user-existing',
        profile_type: 'single',
        prefix: 'SNG',
        numeric_id: 5,
        created_at: new Date().toISOString()
      };

      const insertMock = vi.fn();
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: existingId, error: null })
          })
        }),
        insert: insertMock
      });

      const result = await userIdentificationService.generateUniqueId('user-existing', 'single');
      
      expect(result.uniqueId).toBe('SNG-00000005');
      // Should not insert
      expect(insertMock).not.toHaveBeenCalled();
    });
  });

  describe('validateUniqueId', () => {
    it('should validate correct IDs', () => {
      expect(userIdentificationService.validateUniqueId('SNG-12345678')).toBe(true);
      expect(userIdentificationService.validateUniqueId('CPL-00000001')).toBe(true);
    });

    it('should reject incorrect IDs', () => {
      expect(userIdentificationService.validateUniqueId('ABC-12345678')).toBe(false);
      expect(userIdentificationService.validateUniqueId('SNG-123')).toBe(false); // too short
      expect(userIdentificationService.validateUniqueId('SNG-123456789')).toBe(false); // too long
      expect(userIdentificationService.validateUniqueId('single-123')).toBe(false);
    });
  });

  describe('parseUniqueId', () => {
    it('should parse valid IDs', () => {
      const result = userIdentificationService.parseUniqueId('SNG-00000042');
      expect(result).toEqual({ profileType: 'single', numericId: 42 });

      const result2 = userIdentificationService.parseUniqueId('CPL-00000100');
      expect(result2).toEqual({ profileType: 'couple', numericId: 100 });
    });

    it('should return null for invalid IDs', () => {
      expect(userIdentificationService.parseUniqueId('INVALID')).toBeNull();
    });
  });
});
