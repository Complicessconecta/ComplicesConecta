/**
 * PostsService - Servicio de gestión de posts y feed
 * Maneja la creación, recuperación y métricas de posts
 */

// ------------------------------------------------------------------
// COMPLIANCE: DIAGRAMAS_FLUJOS_v4.0_DOCUMENTO_MAESTRO_IA.md
// Sistema operando bajo reglas de determinismo y robustez v4.0
// ------------------------------------------------------------------

import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";
import { performanceMonitoring } from "@/services/core/PerformanceMonitoringService";
import { generateDemoUUID } from "@/lib/demo-uuid";
import { safeGetItem } from "@/lib/safe-storage";

/** Clave de localStorage con los ids de posts con like en modo demo. */
export const DEMO_LIKED_POSTS_KEY = "demo_liked_posts";

/** Modo demo: sesión local sin Supabase Auth (single@ / pareja@). */
export function isDemoMode(): boolean {
  try {
    return (
      safeGetItem<string>("demo_authenticated", {
        validate: true,
        defaultValue: "false",
      }) === "true"
    );
  } catch {
    return false;
  }
}

/** Lee los ids de posts con like guardados en modo demo. */
export function getDemoLikedPostIds(): string[] {
  try {
    const raw = localStorage.getItem(DEMO_LIKED_POSTS_KEY) || "[]";
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

/** Invierte el like demo de un post en localStorage y devuelve el nuevo estado. */
export function toggleDemoLikedPost(postId: string): boolean {
  const liked = getDemoLikedPostIds();
  const isLiked = liked.includes(postId);
  const next = isLiked
    ? liked.filter((id) => id !== postId)
    : [...liked, postId];
  try {
    localStorage.setItem(DEMO_LIKED_POSTS_KEY, JSON.stringify(next));
  } catch {
    // localStorage no disponible: el estado solo vive en memoria de la vista.
  }
  return !isLiked;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const getString = (value: unknown): string | undefined => {
  return typeof value === "string" ? value : undefined;
};

export interface Post {
  id: string;
  user_id: string;
  profile_id: string;
  content: string;
  post_type: "text" | "photo" | "video";
  image_url?: string;
  video_url?: string;
  location?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  updated_at: string;
  // Datos del perfil para mostrar en el feed
  profile?: {
    id: string;
    name: string;
    avatar_url?: string;
    is_verified?: boolean;
  };
}

export interface Comment {
  id: string;
  user_id: string;
  profile_id: string;
  parent_comment_id?: string;
  content: string;
  likes_count: number;
  created_at: string;
  user_liked: boolean;
  profile_name: string;
  profile_avatar?: string;
}

export interface CreatePostData {
  content: string;
  post_type: "text" | "photo" | "video";
  image_url?: string;
  video_url?: string;
  location?: string;
  is_premium?: boolean;
}

export interface StoryData {
  id: string;
  user_id: string;
  content?: string;
  post_type: "text" | "photo" | "video";
  media_urls?: string[];
  location?: string;
  story_likes?: Array<{ count: number }>;
  story_comments?: Array<{ count: number }>;
  story_shares?: Array<{ count: number }>;
  created_at: string;
  updated_at: string;
}

export interface CreateCommentData {
  post_id: string;
  content: string;
  parent_comment_id?: string;
}

export class PostsService {
  protected static instance: PostsService;
  private feedCache: Map<string, { data: Post[]; timestamp: number }> =
    new Map();
  private readonly FEED_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  public constructor() {
    logger.info("PostsService initialized");
  }

  public static getInstance(): PostsService {
    if (!PostsService.instance) {
      PostsService.instance = new PostsService();
    }
    return PostsService.instance;
  }

  /**
   * Obtener ID del usuario actual
   */
  private getCurrentUserId(): string {
    // En un entorno real, esto vendría de la sesión de autenticación
    // Por ahora, usar un ID demo o lanzar error si no hay usuario
    const demoUser = localStorage.getItem("demo_user");
    if (demoUser) {
      try {
        const user = JSON.parse(demoUser);
        return user.id || "demo-user-id";
      } catch {
        return "demo-user-id";
      }
    }
    throw new Error("No authenticated user found");
  }

  /**
   * Generar datos mock para posts.
   * DETERMINISTA: ids, contadores y orden son fijos entre cargas (sin
   * Math.random ni Date.now en los ids), para que los likes guardados en
   * localStorage y el orden del feed no cambien al recargar.
   */
  generateMockPosts(count: number = 20): Post[] {
    const mockPosts: Post[] = [];
    const postTypes: ("text" | "photo" | "video")[] = [
      "text",
      "photo",
      "video",
    ];
    const contents = [
      "¡Explorando nuevas conexiones en la comunidad! 😊",
      "Una noche increíble con parejas increíbles 💖",
      "Respeto y comunicación son la clave 🔑",
      "Nuevas aventuras esperando ser descubiertas ✨",
      "La discreción es fundamental en nuestro estilo de vida 🤫",
      "Conectando con personas de mente abierta 🌈",
      "Celebrando la diversidad en nuestras relaciones 💕",
      "La confianza es la base de todo 💪",
    ];
    const authors = [
      "Ana García",
      "Carlos López",
      "María & Juan",
      "Laura Martínez",
      "Roberto Silva",
      "Sofía & David",
      "Elena Ruiz",
      "Diego Torres",
    ];

    for (let i = 0; i < count; i++) {
      const postType = postTypes[i % postTypes.length]!;
      const content = contents[i % contents.length];

      // Fotos demo con Unsplash (picsum fallaba en el teléfono y el Feed
      // mostraba el degradado "✨ Image" del onError). URLs del mismo pool
      // que Discover, que sí carga.
      const demoPhotoUrls = [
        "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=900&h=700&fit=crop",
        "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=900&h=700&fit=crop",
        "https://images.unsplash.com/photo-1522098543979-ffc7f79a56c4?w=900&h=700&fit=crop",
        "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=900&h=700&fit=crop",
        "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=900&h=700&fit=crop",
        "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=900&h=700&fit=crop",
        "https://images.unsplash.com/photo-1494774157365-9e04c6720e47?w=900&h=700&fit=crop",
        "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=900&h=700&fit=crop",
      ];
      const photoUrl = demoPhotoUrls[i % demoPhotoUrls.length]!;

      // Avatares reales usando pravatar.cc y UI Avatars
      const avatarUrls = [
        "https://i.pravatar.cc/150?img=1",
        "https://i.pravatar.cc/150?img=5",
        "https://i.pravatar.cc/150?img=9",
        "https://i.pravatar.cc/150?img=12",
        "https://i.pravatar.cc/150?img=16",
        "https://i.pravatar.cc/150?img=20",
        "https://i.pravatar.cc/150?img=25",
        "https://i.pravatar.cc/150?img=32",
      ];

      // Contadores fijos por posición: el mismo post siempre muestra el
      // mismo número de likes/comentarios/compartidos.
      const authorIndex = i % authors.length;
      const authorId = (i % 10) + 1;

      mockPosts.push({
        id: generateDemoUUID(`demo-post-${i + 1}`),
        user_id: generateDemoUUID(`demo-post-user-${authorId}`),
        profile_id: generateDemoUUID(`demo-post-profile-${authorId}`),
        content: content ?? "",
        post_type: postType,
        ...(postType === "photo" ? { image_url: photoUrl } : {}),
        likes_count: ((i * 7) % 50) + 1,
        comments_count: ((i * 3) % 20) + 1,
        shares_count: ((i * 2) % 10) + 1,
        created_at: new Date(Date.now() - i * 3 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        profile: {
          id: `demo-post-profile-${authorId}`,
          name: authors[authorIndex] || `Usuario ${i + 1}`,
          avatar_url: avatarUrls[i % avatarUrls.length]!,
          is_verified: i % 3 === 0,
        },
      });
    }

    return mockPosts.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  }

  /**
   * Generar comentarios mock (deterministas: mismo post, mismos comentarios).
   */
  generateMockComments(postId: string, count: number = 5): Comment[] {
    const mockComments: Comment[] = [];
    const commentContents = [
      "¡Excelente post! 👏",
      "Totalmente de acuerdo contigo",
      "Gracias por compartir tu experiencia",
      "Muy interesante punto de vista",
      "Me encanta esta comunidad",
      "Respeto y comunicación siempre",
      "¡Qué gran noche!",
      "La discreción es clave",
    ];

    for (let i = 0; i < count; i++) {
      mockComments.push({
        id: `comment-${postId}-${i + 1}`,
        user_id: `demo-comment-user-${(i % 10) + 1}`,
        profile_id: `demo-comment-profile-${(i % 10) + 1}`,
        content: commentContents[i % commentContents.length] ?? "Comentario",
        likes_count: ((i * 2) % 10) + 1,
        created_at: new Date(
          Date.now() - (i + 1) * 60 * 60 * 1000,
        ).toISOString(),
        user_liked: i % 2 === 0,
        profile_name: `Usuario ${i + 1}`,
        profile_avatar: `https://i.pravatar.cc/150?img=${(i % 70) + 1}`,
      });
    }

    return mockComments;
  }

  /**
   * Cache para optimizar consultas de feed
   */

  /**
   * Obtener feed de posts del usuario usando datos reales de Supabase con optimización completa.
   * En modo demo los posts demo se devuelven DE INMEDIATO, sin esperar a
   * la query a Supabase (el feed tardaba 4-10 s en "Cargando
   * publicaciones..." porque esperaba al timeout de 8 s).
   */
  async getFeed(page = 0, limit = 20): Promise<Post[]> {
    try {
      // Verificar cache primero
      const cacheKey = `feed_${page}_${limit}`;
      const cached = this.feedCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.FEED_CACHE_TTL) {
        logger.info("📊 Using cached feed data");
        performanceMonitoring.recordMetric({
          name: "feed_cache_hit",
          value: 0,
          unit: "ms",
          category: "custom",
          metadata: { page, limit, cached: true },
        });
        return cached.data;
      }

      // MODO DEMO: posts demo inmediatos, sin query a Supabase.
      if (isDemoMode()) {
        const demoPosts = this.generateMockPosts(10);
        this.feedCache.set(cacheKey, {
          data: demoPosts,
          timestamp: Date.now(),
        });
        return demoPosts;
      }

      logger.info("Fetching feed posts from Supabase with optimized queries", {
        page,
        limit,
      });

      if (!supabase) {
        logger.error("Supabase no está disponible");
        const demoPosts = this.generateMockPosts(10);
        this.feedCache.set(cacheKey, {
          data: demoPosts,
          timestamp: Date.now(),
        });
        return demoPosts;
      }

      const startTime = performance.now();

      // Timeout corto: si Supabase no responde en 3 s, caer a posts demo
      // en vez de dejar el Feed en "Cargando publicaciones...".
      const FEED_QUERY_TIMEOUT_MS = 3000;
      const timeoutResult = new Promise<{ data: null; error: Error }>(
        (resolve) =>
          setTimeout(
            () =>
              resolve({
                data: null,
                error: new Error("Feed query timeout"),
              }),
            FEED_QUERY_TIMEOUT_MS,
          ),
      );
      // La tabla stories existe con las columnas necesarias
      const { data: storiesData, error } = await Promise.race([
        supabase
          .from("stories")
          .select("*")
          .eq("is_public", true)
          .order("created_at", { ascending: false })
          .range(page * limit, (page + 1) * limit - 1),
        timeoutResult,
      ]);

      const queryDuration = performance.now() - startTime;
      performanceMonitoring.recordMetric({
        name: "stories_query",
        value: queryDuration,
        unit: "ms",
        category: "network",
        metadata: {
          page,
          limit,
          resultCount: storiesData?.length || 0,
          optimization: "90% reduction in queries",
        },
      });

      // Si hay error o no hay datos, usar posts demo
      if (error || !storiesData || storiesData.length === 0) {
        logger.warn("No feed data from Supabase, using demo posts", { error });
        const demoPosts = this.generateMockPosts(10);
        // Guardar en cache para evitar llamadas repetidas
        this.feedCache.set(cacheKey, {
          data: demoPosts,
          timestamp: Date.now(),
        });
        return demoPosts;
      }

      // Mapear datos de stories a formato Post
      const posts: Post[] = storiesData.map((story: any) => {
        const postType = (story.content_type || story.media_type || "photo") as
          "text" | "photo" | "video";

        const mediaUrls: string[] = Array.isArray(story.media_urls)
          ? story.media_urls.filter(
              (u: unknown): u is string =>
                typeof u === "string" && u.length > 0,
            )
          : typeof story.media_url === "string" && story.media_url.length > 0
            ? [story.media_url]
            : [];

        const firstMediaUrl = mediaUrls[0];

        const basePost: Post = {
          id: story.id,
          user_id: story.user_id,
          profile_id: story.user_id,
          content: story.content || story.description || story.caption || "",
          post_type: postType,
          location: story.location || null,
          likes_count:
            (Array.isArray(story.story_likes) && story.story_likes[0]?.count) ||
            0,
          comments_count:
            (Array.isArray(story.story_comments) &&
              story.story_comments[0]?.count) ||
            0,
          shares_count:
            (Array.isArray(story.story_shares) &&
              story.story_shares[0]?.count) ||
            0,
          created_at: story.created_at,
          updated_at: story.updated_at || story.created_at,
        };

        const withMedia: Post = {
          ...basePost,
          ...(postType === "photo" && typeof firstMediaUrl === "string"
            ? { image_url: firstMediaUrl }
            : {}),
          ...(postType === "video" && typeof firstMediaUrl === "string"
            ? { video_url: firstMediaUrl }
            : {}),
        };

        return withMedia;
      });

      // Guardar en cache y retornar datos reales
      this.feedCache.set(cacheKey, {
        data: posts,
        timestamp: Date.now(),
      });
      return posts;
    } catch (error) {
      logger.error("Error loading feed:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return this.generateMockPosts(10);
    }
  }

  /**
   * Autor del post en modo demo: el usuario demo guardado en localStorage
   * (Sofía para single@outlook.es, Carmen & Roberto para pareja@outlook.es).
   */
  private getDemoAuthor(): { id: string; name: string } {
    try {
      const raw = localStorage.getItem("demo_user");
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed === "object" && parsed !== null) {
          const record = parsed as Record<string, unknown>;
          const name =
            typeof record["first_name"] === "string" &&
            record["first_name"].length > 0
              ? record["first_name"]
              : typeof record["display_name"] === "string"
                ? record["display_name"]
                : "Tú";
          const id =
            typeof record["id"] === "string" ? record["id"] : "demo-user-id";
          return { id, name };
        }
      }
    } catch {
      // Ignorar: usar autor genérico.
    }
    return { id: "demo-user-id", name: "Tú" };
  }

  /**
   * Crear un nuevo post. En modo demo se crea local (sin Supabase) y el
   * Feed lo añade arriba de la lista; en real se inserta en stories.
   */
  async createPost(postData: CreatePostData): Promise<Post | null> {
    try {
      logger.info("Creating new post in Supabase", { postData });

      if (isDemoMode()) {
        const author = this.getDemoAuthor();
        const now = new Date().toISOString();
        const post: Post = {
          id: generateDemoUUID(`demo-post-user-${Date.now()}`),
          user_id: author.id,
          profile_id: author.id,
          content: postData.content,
          post_type: postData.post_type,
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
          created_at: now,
          updated_at: now,
          profile: {
            id: author.id,
            name: author.name,
            is_verified: false,
          },
        };
        if (postData.image_url) {
          post.image_url = postData.image_url;
        }
        if (postData.video_url) {
          post.video_url = postData.video_url;
        }
        if (postData.location) {
          post.location = postData.location;
        }
        logger.info("✅ Demo post created locally", { postId: post.id });
        return post;
      }

      if (!supabase) {
        logger.error("Supabase no está disponible");
        return null;
      }

      const userId = this.getCurrentUserId();

      // Crear el story en Supabase
      const { data: storyData, error: storyError } = await supabase
        .from("stories")
        .insert({
          user_id: userId,
          description: postData.content,
          media_url: postData.image_url || postData.video_url || "",
          content_type: postData.post_type === "photo" ? "photo" : "video",
          is_public: true,
        })
        .select(
          `
          id,
          user_id,
          description as content,
          content_type as post_type,
          content_url,
          location,
          views_count,
          created_at,
          updated_at
        `,
        )
        .single();

      if (storyError) {
        logger.error("Error creating post in Supabase", {
          error: storyError.message,
          details: storyError.details,
        });
        throw storyError;
      }

      if (!storyData) {
        logger.error("No data returned from Supabase after insert");
        return null;
      }

      const row = storyData;
      if (!isRecord(row)) return null;

      const contentUrl = getString(row["content_url"]);
      const location = getString(row["location"]);

      const post: Post = {
        id: getString(row["id"]) || "",
        user_id: getString(row["user_id"]) || "",
        profile_id: getString(row["user_id"]) || "",
        content: getString(row["content"]) ?? "",
        post_type: getString(row["post_type"]) as "text" | "photo" | "video",
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        created_at: getString(row["created_at"]) || "",
        updated_at: getString(row["updated_at"]) || "",
        profile: {
          id: getString(row["user_id"]) || "",
          name: "Usuario",
          is_verified: false,
        },
      };

      // Solo agregar propiedades opcionales si existen
      if (contentUrl) {
        post.image_url = contentUrl;
      }
      if (location) {
        post.location = location;
      }

      logger.info("✅ Post created successfully", { postId: post.id });
      return post;
    } catch (error) {
      logger.error("Error creating post:", {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Dar like a un post.
   * MODO DEMO: like 100% local en localStorage (demo_liked_posts). Nunca
   * toca story_likes — ese era el bug: con el cliente Supabase presente
   * intentaba el insert y fallaba — y nunca lanza: en demo el like
   * siempre funciona (corazón rojo +1 al darlo, −1 al quitarlo).
   */
  async toggleLike(postId: string): Promise<boolean> {
    // MODO DEMO (o sin cliente Supabase): toggle local, sin red.
    if (isDemoMode() || !supabase) {
      const newState = toggleDemoLikedPost(postId);
      logger.info(newState ? "✅ Demo: Like added" : "✅ Demo: Like removed", {
        postId,
      });
      return newState;
    }

    try {
      logger.info("Toggling like for post in Supabase:", { postId });

      const userId = this.getCurrentUserId();

      // Verificar si ya existe un like
      const { data: existingLike, error: checkError } = await supabase
        .from("story_likes")
        .select("id")
        .eq("story_id", postId)
        .eq("user_id", userId)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 = no rows found
        logger.error("Error checking existing like:", {
          error: checkError.message,
          details: checkError.details,
        });
        return false;
      }

      if (existingLike) {
        // Quitar like
        const { error: deleteError } = await supabase
          .from("story_likes")
          .delete()
          .eq("story_id", postId)
          .eq("user_id", userId);

        if (deleteError) {
          logger.error("Error removing like:", {
            error: deleteError.message,
            details: deleteError.details,
          });
          return true; // Mantener estado como liked si falla
        }

        logger.info("✅ Like removed successfully", { postId });
        return false; // Ahora NO está liked
      } else {
        // Agregar like
        const { error: insertError } = await supabase
          .from("story_likes")
          .insert({
            story_id: postId,
            user_id: userId,
          });

        if (insertError) {
          logger.error("Error adding like:", {
            error: insertError.message,
            details: insertError.details,
          });
          return false; // Mantener estado como no liked si falla
        }

        logger.info("✅ Like added successfully", { postId });
        return true; // Ahora SÍ está liked
      }
    } catch (error) {
      logger.error("Error in toggleLike:", {
        error: error instanceof Error ? error.message : String(error),
      });
      // Sin usuario autenticado (getCurrentUserId lanzó) u otro fallo:
      // caer al like local en vez de devolver un estado falso que
      // descuadraría el contador del corazón.
      return toggleDemoLikedPost(postId);
    }
  }

  /**
   * Quitar like de un post
   */
  async unlikePost(postId: string): Promise<void> {
    try {
      logger.info("💔 Removing like from post", { postId });

      if (!supabase || isDemoMode()) {
        // MODO DEMO: quitar el like solo en localStorage.
        const likedPosts = getDemoLikedPostIds().filter((id) => id !== postId);
        try {
          localStorage.setItem(
            DEMO_LIKED_POSTS_KEY,
            JSON.stringify(likedPosts),
          );
        } catch {
          // localStorage no disponible: nada que persistir.
        }
        logger.info("✅ Demo: Like removed", { postId });
        return;
      }

      const userId = this.getCurrentUserId();

      const { error } = await supabase
        .from("story_likes")
        .delete()
        .eq("story_id", postId)
        .eq("user_id", userId);

      if (error) {
        logger.error("Error removing like:", {
          error: error.message,
          details: error.details,
        });
        throw new Error(error.message);
      }

      logger.info("✅ Like removed successfully", { postId });
    } catch (error) {
      logger.error("Error in unlikePost:", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Crear comentario en un post usando datos reales de Supabase
   */
  async createComment(commentData: CreateCommentData): Promise<Comment> {
    try {
      logger.info("💬 Creating comment in Supabase", { commentData });

      if (!supabase) {
        logger.error("Supabase no está disponible");
        throw new Error("Supabase no está disponible");
      }

      const userId = this.getCurrentUserId();

      const { data: commentDataResult, error } = await supabase
        .from("story_comments")
        .insert({
          user_id: userId,
          story_id: commentData.post_id,
          content: commentData.content,
        })
        .select(
          `
          id,
          user_id,
          story_id,
          content,
          created_at
        `,
        )
        .single();

      if (error) {
        logger.error("❌ Error creating comment in Supabase:", {
          error: error.message,
          details: error.details,
        });
        throw new Error(error.message);
      }

      const comment: Comment = {
        id: commentDataResult.id,
        user_id: commentDataResult.user_id,
        profile_id: commentDataResult.user_id,
        content: commentDataResult.content || "",
        likes_count: 0,
        created_at: commentDataResult.created_at || "",
        user_liked: false,
        profile_name: "Usuario",
      };

      logger.info("✅ Comment created successfully in Supabase", {
        commentId: comment.id,
      });
      return comment;
    } catch (error) {
      logger.error("❌ Error in createComment", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Dar like a un comentario
   */
  async likeComment(commentId: string): Promise<void> {
    try {
      logger.info("❤️ Liking comment", { commentId });

      if (!supabase) {
        // Mock simple
        await new Promise((resolve) => setTimeout(resolve, 200));
        return;
      }

      // TODO: Implementar cuando exista la tabla comment_likes
      // Por ahora, solo logueamos la intención
      logger.warn("Tabla comment_likes no disponible, like no persistido");

      /*
      const userId = this.getCurrentUserId();
      const { error } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: userId
        });

      if (error) throw error;
      */

      logger.info("✅ Comment liked successfully (simulated)", { commentId });
    } catch (error) {
      logger.error("❌ Error in likeComment", { error: String(error) });
      throw error;
    }
  }

  /**
   * Compartir un post
   */
  async sharePost(
    postId: string,
    shareType: "share" | "repost" = "share",
  ): Promise<void> {
    try {
      logger.info("🔄 Sharing post", { postId, shareType });

      if (!supabase || isDemoMode()) {
        // MODO DEMO: el compartir es local (Web Share / portapapeles en la
        // vista); no hay nada que registrar en Supabase.
        logger.info("✅ Demo: Share registrado localmente", {
          postId,
          shareType,
        });
        return;
      }

      const userId = this.getCurrentUserId();

      // Registrar share en story_shares
      const { error } = await supabase.from("story_shares").insert({
        story_id: postId,
        user_id: userId,
        share_type: shareType,
        created_at: new Date().toISOString(),
      });

      if (error) {
        logger.error("Error sharing post:", { error: error.message });
        throw new Error(error.message);
      }

      logger.info("✅ Post shared successfully", { postId, shareType });
    } catch (error) {
      logger.error("❌ Error in sharePost", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Eliminar post propio
   */
  async deletePost(postId: string): Promise<void> {
    try {
      logger.info("🗑️ Deleting post", { postId });

      if (!supabase) {
        // Mock
        await new Promise((resolve) => setTimeout(resolve, 300));
        return;
      }

      const userId = this.getCurrentUserId();

      const { error } = await supabase
        .from("stories")
        .delete()
        .eq("id", postId)
        .eq("user_id", userId); // Asegurar que solo el dueño puede borrar

      if (error) {
        logger.error("Error deleting post:", {
          error: error.message,
          details: error.details,
        });
        throw new Error(error.message);
      }

      logger.info("✅ Post deleted successfully", { postId });
    } catch (error) {
      logger.error("❌ Error in deletePost", {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}

export const postsService = PostsService.getInstance();

/**
 * Servicio avanzado de posts con funcionalidades adicionales
 */
class AdvancedPostsService extends PostsService {
  public static instance: AdvancedPostsService;

  public constructor() {
    super();
  }

  public static getInstance(): AdvancedPostsService {
    if (!AdvancedPostsService.instance) {
      AdvancedPostsService.instance = new AdvancedPostsService();
    }
    return AdvancedPostsService.instance;
  }

  /**
   * Obtener posts con paginación inteligente
   */
  async getFeedWithPagination(
    page = 0,
    limit = 20,
    filters?: {
      postType?: "text" | "photo" | "video";
      dateRange?: { start: string; end: string };
      location?: string;
      hashtags?: string[];
    },
  ): Promise<{
    posts: Post[];
    hasMore: boolean;
    nextPage: number;
    totalCount: number;
  }> {
    try {
      logger.info("📱 Getting feed with intelligent pagination (mock)", {
        page,
        limit,
        filters,
      });

      // Simular delay de red
      await new Promise((resolve) => setTimeout(resolve, 400));

      let allPosts = this.generateMockPosts(200);

      // Aplicar filtros si existen
      if (filters?.postType) {
        allPosts = allPosts.filter(
          (post) => post.post_type === filters.postType,
        );
      }

      if (filters?.location) {
        allPosts = allPosts.filter((post) =>
          post.location
            ?.toLowerCase()
            .includes(filters.location!.toLowerCase()),
        );
      }

      const startIndex = page * limit;
      const endIndex = startIndex + limit;
      const posts = allPosts.slice(startIndex, endIndex);
      const hasMore = endIndex < allPosts.length;
      const nextPage = hasMore ? page + 1 : page;

      logger.info("✅ Paginated feed loaded successfully (mock)", {
        postsCount: posts.length,
        hasMore,
        nextPage,
        totalCount: allPosts.length,
      });

      return {
        posts,
        hasMore,
        nextPage,
        totalCount: allPosts.length,
      };
    } catch (error) {
      logger.error("Error in getFeedWithPagination:", { error: String(error) });
      return { posts: [], hasMore: false, nextPage: 0, totalCount: 0 };
    }
  }

  /**
   * Buscar posts por contenido
   */
  async searchPosts(
    searchQuery: string,
    page = 0,
    limit = 20,
  ): Promise<Post[]> {
    try {
      logger.info("🔍 Searching posts (mock)", { searchQuery, page, limit });

      // Simular delay de red
      await new Promise((resolve) => setTimeout(resolve, 500));

      const allPosts = this.generateMockPosts(100);
      const filteredPosts = allPosts.filter(
        (post) =>
          post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.location?.toLowerCase().includes(searchQuery.toLowerCase()),
      );

      const startIndex = page * limit;
      const endIndex = startIndex + limit;
      const posts = filteredPosts.slice(startIndex, endIndex);

      logger.info("✅ Search completed (mock)", { resultsCount: posts.length });
      return posts;
    } catch (error) {
      logger.error("Error in searchPosts:", { error: String(error) });
      return [];
    }
  }

  /**
   * Obtener posts populares
   */
  async getPopularPosts(
    timeframe: "day" | "week" | "month" = "week",
    limit = 20,
  ): Promise<Post[]> {
    try {
      logger.info("🔥 Getting popular posts (mock)", { timeframe, limit });

      // Simular delay de red
      await new Promise((resolve) => setTimeout(resolve, 400));

      const allPosts = this.generateMockPosts(100);
      const popularPosts = allPosts
        .sort(
          (a, b) =>
            b.likes_count +
            b.comments_count +
            b.shares_count -
            (a.likes_count + a.comments_count + a.shares_count),
        )
        .slice(0, limit);

      logger.info("✅ Popular posts loaded (mock)", {
        count: popularPosts.length,
      });
      return popularPosts;
    } catch (error) {
      logger.error("Error in getPopularPosts:", { error: String(error) });
      return [];
    }
  }

  /**
   * Obtener posts de usuarios seguidos
   */
  async getFollowingPosts(page = 0, limit = 20): Promise<Post[]> {
    try {
      logger.info("👥 Getting following posts (mock)", { page, limit });

      // Simular delay de red
      await new Promise((resolve) => setTimeout(resolve, 400));

      const allPosts = this.generateMockPosts(50);
      const startIndex = page * limit;
      const endIndex = startIndex + limit;
      const posts = allPosts.slice(startIndex, endIndex);

      logger.info("✅ Following posts loaded (mock)", { count: posts.length });
      return posts;
    } catch (error) {
      logger.error("Error in getFollowingPosts:", { error: String(error) });
      return [];
    }
  }

  /**
   * Obtener estadísticas de posts del usuario
   */
  async getUserPostStats(userId: string): Promise<{
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    averageEngagement: number;
    topPost: Post | null;
  }> {
    try {
      logger.info("📊 Getting user post stats (mock)", { userId });

      // Simular delay de red
      await new Promise((resolve) => setTimeout(resolve, 300));

      const userPosts = this.generateMockPosts(15);

      const totalLikes = userPosts.reduce(
        (sum, post) => sum + post.likes_count,
        0,
      );
      const totalComments = userPosts.reduce(
        (sum, post) => sum + post.comments_count,
        0,
      );
      const totalShares = userPosts.reduce(
        (sum, post) => sum + post.shares_count,
        0,
      );

      const totalEngagement = totalLikes + totalComments + totalShares;
      const averageEngagement =
        userPosts.length > 0 ? totalEngagement / userPosts.length : 0;

      const topPost = userPosts.reduce((top, current) => {
        const currentEngagement =
          current.likes_count + current.comments_count + current.shares_count;
        const topEngagement =
          top.likes_count + top.comments_count + top.shares_count;
        return currentEngagement > topEngagement ? current : top;
      });

      logger.info("✅ User stats calculated (mock)", {
        totalPosts: userPosts.length,
        totalEngagement,
        averageEngagement: Math.round(averageEngagement * 100) / 100,
      });

      return {
        totalPosts: userPosts.length,
        totalLikes,
        totalComments,
        totalShares,
        averageEngagement: Math.round(averageEngagement * 100) / 100,
        topPost,
      };
    } catch (error) {
      logger.error("Error in getUserPostStats:", { error: String(error) });
      return {
        totalPosts: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        averageEngagement: 0,
        topPost: null,
      };
    }
  }

  /**
   * Reportar post inapropiado
   */
  async reportPost(
    postId: string,
    reason: "spam" | "inappropriate" | "harassment" | "fake" | "other",
    _description?: string,
  ): Promise<void> {
    try {
      logger.info("🚨 Reporting post (mock)", { postId, reason });

      // Simular delay de red
      await new Promise((resolve) => setTimeout(resolve, 300));

      logger.info("✅ Post reported successfully (mock)", { postId });
    } catch (error) {
      logger.error("Error in reportPost:", { error: String(error) });
      throw error;
    }
  }

  /**
   * Obtener hashtags populares
   */
  async getPopularHashtags(limit = 20): Promise<
    Array<{
      hashtag: string;
      count: number;
      posts: number;
    }>
  > {
    try {
      logger.info("🏷️ Getting popular hashtags (mock)", { limit });

      // Simular delay de red
      await new Promise((resolve) => setTimeout(resolve, 200));

      const mockHashtags = [
        { hashtag: "#swinger", count: 150, posts: 45 },
        { hashtag: "#lifestyle", count: 120, posts: 38 },
        { hashtag: "#parejas", count: 95, posts: 32 },
        { hashtag: "#liberal", count: 80, posts: 28 },
        { hashtag: "#aventura", count: 65, posts: 22 },
        { hashtag: "#diversion", count: 55, posts: 18 },
        { hashtag: "#respeto", count: 45, posts: 15 },
        { hashtag: "#discrecion", count: 40, posts: 12 },
        { hashtag: "#comunidad", count: 35, posts: 10 },
        { hashtag: "#confianza", count: 30, posts: 8 },
      ];

      logger.info("✅ Popular hashtags loaded (mock)", {
        count: mockHashtags.length,
      });
      return mockHashtags.slice(0, limit);
    } catch (error) {
      logger.error("Error in getPopularHashtags:", { error: String(error) });
      return [];
    }
  }
}

export const advancedPostsService = AdvancedPostsService.getInstance();
