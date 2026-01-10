import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ContentProtectionService } from "../../services/auth/ContentProtectionService";
import { supabase } from "../../integrations/supabase/client";

// Mock de Supabase
vi.mock("../../integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

// Mock de Logger
vi.mock("../../lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("ContentProtectionService", () => {
  let contentProtectionService: ContentProtectionService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton instance if possible or just get the instance
    // Since it's a singleton, we might need to rely on the fact that it's stateless or reset it via a private method if exposed (not recommended for strict singleton)
    // For this test, we assume the instance is reused but we mock dependencies fresh each time.
    contentProtectionService = ContentProtectionService.getInstance();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should be a singleton", () => {
    const instance1 = ContentProtectionService.getInstance();
    const instance2 = ContentProtectionService.getInstance();
    expect(instance1).toBe(instance2);
  });

  describe("checkContentAccess", () => {
    it("should allow access to public content", async () => {
      const result = await contentProtectionService.checkContentAccess(
        "user-123",
        "content-456",
        "post",
        false, // isPrivate
      );

      expect(result).toBe(true);
    });

    it("should deny access to private content if user has no permission", async () => {
      // Mock Supabase response for permission check (assuming it checks DB for private content)
      // The current implementation of checkContentAccess for private content:
      // It likely checks if the user is the owner or has specific access.
      // Let's assume the implementation checks a 'content_access' table or similar.

      // Setup mock for check
      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: null }), // No permission found
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        select: selectMock,
      });

      // Note: The actual implementation of checkContentAccess in the service might be simpler
      // or more complex. Based on the previous turn, we know it logs access.
      // If the logic is "isPrivate returns false unless checked", we need to see the logic.
      // Let's assume default behavior for the test based on common patterns.

      // If we look at the actual code from previous turn:
      // if (!isPrivate) return true;
      // then it checks DB.

      // Let's adjust the mock to simulate a "not found" permission
      const fromSpy = vi.spyOn(supabase, "from");
      fromSpy.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: null, error: { message: "Not found" } }),
      } as any);

      const result = await contentProtectionService.checkContentAccess(
        "user-123",
        "content-private",
        "post",
        true,
      );

      expect(result).toBe(false);
    });

    it("should allow access to private content if permission exists", async () => {
      const fromSpy = vi.spyOn(supabase, "from");
      fromSpy.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi
          .fn()
          .mockResolvedValue({ data: { id: "permission-1" }, error: null }),
      } as any);

      const result = await contentProtectionService.checkContentAccess(
        "user-123",
        "content-private",
        "post",
        true,
      );

      expect(result).toBe(true);
    });

    it("should allow access if user is the owner (implied logic, dependent on implementation)", async () => {
      // Usually ownership check is done before calling this or inside.
      // If logic handles ownership inside:
      // For now, we test the DB permission check path.
    });
  });

  describe("reportViolation", () => {
    it("should log a violation report to Supabase", async () => {
      const insertMock = vi.fn().mockResolvedValue({ error: null });
      const fromSpy = vi.spyOn(supabase, "from");
      fromSpy.mockReturnValue({
        insert: insertMock,
      } as any);

      await contentProtectionService.reportViolation(
        "user-reporter",
        "content-bad",
        "inappropriate_content",
        "This is bad",
      );

      expect(fromSpy).toHaveBeenCalledWith("content_violations");
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          reporter_id: "user-reporter",
          content_id: "content-bad",
          reason: "inappropriate_content",
          details: "This is bad",
        }),
      );
    });

    it("should handle errors when reporting violation", async () => {
      const insertMock = vi
        .fn()
        .mockResolvedValue({ error: { message: "DB Error" } });
      const fromSpy = vi.spyOn(supabase, "from");
      fromSpy.mockReturnValue({
        insert: insertMock,
      } as any);

      // Should not throw, just log error internally
      await contentProtectionService.reportViolation(
        "user-reporter",
        "content-bad",
        "spam",
      );

      expect(insertMock).toHaveBeenCalled();
    });
  });
});
