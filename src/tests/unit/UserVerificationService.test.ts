import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userVerificationService } from '@/services/auth/UserVerificationService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: { success: true }, error: null })
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://test.com/img.jpg' } })
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { is_verified: true, email_verified_at: '2023-01-01', phone_verified_at: null },
            error: null
          })
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null })
      }))
    }))
  }
}));

describe('UserVerificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyWithWorldID', () => {
    it('should verify successfully', async () => {
      const proof = {
        merkle_root: 'root',
        nullifier_hash: 'hash',
        proof: 'proof',
        verification_level: 'orb',
        action: 'login'
      };

      const result = await userVerificationService.verifyWithWorldID('user1', proof);
      
      expect(result.success).toBe(true);
      expect(result.method).toBe('world_id');
      expect(supabase.functions.invoke).toHaveBeenCalledWith('worldid-verify', expect.any(Object));
    });

    it('should handle verification failure', async () => {
      (supabase.functions.invoke as any).mockResolvedValueOnce({ data: { success: false, message: 'Invalid proof' }, error: null });
      
      const proof = {
        merkle_root: 'root',
        nullifier_hash: 'hash',
        proof: 'proof',
        verification_level: 'orb',
        action: 'login'
      };

      const result = await userVerificationService.verifyWithWorldID('user1', proof);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid proof');
    });
  });

  describe('verifyWithSelfie', () => {
    it('should upload selfie and verify', async () => {
      const file = new File([''], 'selfie.jpg', { type: 'image/jpeg' });
      const result = await userVerificationService.verifyWithSelfie('user1', { selfieFile: file });
      
      expect(result.success).toBe(true);
      expect(result.method).toBe('selfie');
      // @ts-ignore
      expect(supabase.storage.from('profile-images').upload).toHaveBeenCalled();
    });
  });

  describe('getVerificationStatus', () => {
    it('should return correct status', async () => {
      const status = await userVerificationService.getVerificationStatus('user1');
      
      expect(status.worldId).toBe(true); // mocked data has is_verified: true
      expect(status.email).toBe(true);
      expect(status.overall).toBe('verified');
    });
  });
});
