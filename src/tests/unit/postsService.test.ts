import { describe, it, expect, vi, beforeEach } from "vitest";
import { PostsService } from "@/services/social/postsService";
import { supabase } from "@/lib/supabase";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          })),
        })),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: "post-123",
              user_id: "user-123",
              content: "Test post",
              post_type: "text",
              content_url: null,
              location: "Test Location",
              views_count: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            error: null,
          }),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null }),
        })),
      })),
    })),
  },
}));

describe("PostsService", () => {
  let service: PostsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = PostsService.getInstance();
    // Clear cache if possible, but it's private.
    // We can rely on different page/limit or just mock supabase differently.
  });

  describe("getFeed", () => {
    it("should return demo posts if supabase returns no data", async () => {
      const posts = await service.getFeed(0, 10);
      expect(posts.length).toBeGreaterThan(0);
      expect(posts[0].id).toBeDefined();
    });

    it("should fetch from supabase", async () => {
      const mockData = [
        {
          id: "post-supa",
          user_id: "user-1",
          content: "Supabase Content",
          post_type: "text",
          media_urls: [],
          location: null,
          views_count: 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          story_likes: [{ count: 5 }],
          story_comments: [{ count: 2 }],
          story_shares: [{ count: 1 }],
        },
      ];

      (supabase!.from as any).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockData,
                error: null,
              }),
            }),
          }),
        }),
      });

      // Use a new cache key by changing params
      const posts = await service.getFeed(1, 10);

      expect(posts.length).toBe(1);
      expect(posts[0].content).toBe("Supabase Content");
      expect(posts[0].likes_count).toBe(5);
    });
  });

  describe("createPost", () => {
    it("should create a post successfully", async () => {
      // Mock localStorage for user id
      const getItemSpy = vi.spyOn(Storage.prototype, "getItem");
      getItemSpy.mockReturnValue(JSON.stringify({ id: "user-123" }));

      const result = await service.createPost({
        content: "Test post",
        post_type: "text",
      });

      expect(result).not.toBeNull();
      expect(result?.content).toBe("Test post");
      expect(supabase!.from).toHaveBeenCalledWith("stories");
    });
  });
});
