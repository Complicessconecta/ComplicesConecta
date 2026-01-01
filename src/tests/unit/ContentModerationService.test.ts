import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contentModerationService } from '@/services/social/ContentModerationService';

// Mock Supabase (not heavily used in text analysis but used in logging)
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null })
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } })
    }
  }
}));

describe('ContentModerationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('moderateText', () => {
    it('should detect toxic content', async () => {
      const result = await contentModerationService.moderateText('te odio idiota', 'message');
      expect(result.isAppropriate).toBe(false);
      expect(result.flags.some(f => f.type === 'harassment')).toBe(true);
    });

    it('should detect spam content', async () => {
      const result = await contentModerationService.moderateText('gana dinero gratis click aqui www.spam.com', 'message');
      // "ganar" "dinero" "gratis" "click aqui" matches spam patterns
      expect(result.isAppropriate).toBe(false);
      expect(result.flags.some(f => f.type === 'spam')).toBe(true);
    });

    it('should approve safe content', async () => {
      const result = await contentModerationService.moderateText('Hola, ¿cómo estás? Me gusta tu perfil.', 'message');
      expect(result.isAppropriate).toBe(true);
      expect(result.flags).toHaveLength(0);
    });
    
    it('should enforce context rules (length)', async () => {
      const longText = 'a'.repeat(600);
      const result = await contentModerationService.moderateText(longText, 'message'); // limit 500
      expect(result.isAppropriate).toBe(false);
      expect(result.flags.some(f => f.description.includes('excede el límite'))).toBe(true);
    });
  });

  describe('moderateProfile', () => {
    it('should flag incomplete profiles', async () => {
      const result = await contentModerationService.moderateProfile({});
      expect(result.flags.some(f => f.type === 'fake_profile')).toBe(true);
    });

    it('should flag underage users', async () => {
      const result = await contentModerationService.moderateProfile({
        name: 'Kid',
        age: 16,
        bio: 'I am a kid',
        photos: ['photo1.jpg', 'photo2.jpg']
      });
      expect(result.flags.some(f => f.description.includes('Edad menor'))).toBe(true);
    });
  });
});
