import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmotionalAIService } from "@/services/analytics";
import { supabase } from "@/integrations/supabase/client";

// Mock openai-proxy via supabase.functions.invoke (JWT complement
// 2026-11-19: EmotionalAIService ya no usa el cliente OpenAI directo ni
// VITE_OPENAI_API_KEY; llama a la Edge Function openai-proxy con el JWT de
// sesión. No hay mock del módulo "openai": el proxy se simula con
// mockInvoke, y su rechazo fuerza el fallback de patrones igual que antes
// lo hacía el fallo de OpenAI.)
const { mockInvoke } = vi.hoisted(() => {
  return { mockInvoke: vi.fn() };
});

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        or: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(),
          })),
        })),
      })),
    })),
    functions: {
      invoke: mockInvoke,
    },
  },
}));

describe("EmotionalAIService", () => {
  let service: EmotionalAIService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset instance to ensure fresh start (though singleton persists, we can't easily reset private static instance without ts-ignore or modifying class)
    // For this test, we assume we get the instance.
    service = EmotionalAIService.getInstance();
  });

  it("should be a singleton", () => {
    const instance1 = EmotionalAIService.getInstance();
    const instance2 = EmotionalAIService.getInstance();
    expect(instance1).toBe(instance2);
  });

  describe("analyzeChatEmotions", () => {
    it("should return default values if insufficient messages", async () => {
      // Mock supabase response with few messages
      const mockSelect = vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [
                { content: "Hola", sender_id: "1", created_at: "2023-01-01" },
                { content: "Hola", sender_id: "2", created_at: "2023-01-01" },
              ],
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const result = await service.analyzeChatEmotions("user1", "user2");

      expect(result.score).toBe(50);
      expect(result.reasons[0]).toContain("Insuficientes mensajes");
    });

    it("should use pattern analysis when OpenAI fails or returns empty", async () => {
      // Mock supabase response with enough messages
      const mockSelect = vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  content: "Te odio",
                  sender_id: "1",
                  created_at: "2023-01-01",
                },
                {
                  content: "Eres lo peor",
                  sender_id: "2",
                  created_at: "2023-01-01",
                },
                { content: "Adiós", sender_id: "1", created_at: "2023-01-01" },
              ],
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      // Mock openai-proxy failure (antes: fallo de OpenAI directo)
      mockInvoke.mockRejectedValue(new Error("OpenAI error"));

      const result = await service.analyzeChatEmotions("user1", "user2");

      // Should fall back to patterns. "odio", "lo peor" (not in list?), "Adiós" (negative)
      // negativeWords: ['no', 'mal', 'adiós', 'nunca', 'odio', 'aburrido']
      // 'odio' -> -5, 'adiós' -> -5. Score 50 - 10 = 40.

      expect(result.sentiment).toBeDefined();
      expect(result.reasons[0]).toContain("Detectadas");
    });

    it("should analyze with patterns correctly (positive)", async () => {
      // Mock supabase response
      const mockSelect = vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  content: "Genial gracias",
                  sender_id: "1",
                  created_at: "2023-01-01",
                },
                {
                  content: "Me gusta mucho",
                  sender_id: "2",
                  created_at: "2023-01-01",
                },
                {
                  content: "Claro que sí",
                  sender_id: "1",
                  created_at: "2023-01-01",
                },
              ],
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      // Mock openai-proxy failure so we force pattern usage
      mockInvoke.mockRejectedValue(new Error("No OpenAI"));

      const result = await service.analyzeChatEmotions("user1", "user2");

      // positiveWords: ['gracias', 'genial', 'me gusta', 'jaja', 'sí', 'claro', 'bien']
      // 'Genial' (+5), 'gracias' (+5), 'Me gusta' (+5), 'Claro' (+5), 'sí' (+5).
      // Total +25. Score 50 + 25 = 75.

      expect(result.score).toBeGreaterThan(50);
      expect(result.sentiment).toBe("positive");
    });
  });
});

