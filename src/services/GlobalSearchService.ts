import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface GlobalSearchResult {
  id: string;
  type: 'profile';
  title: string;
  subtitle: string;
  image_url: string | null;
}

export class GlobalSearchService {
  static async search(query: string): Promise<GlobalSearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    try {
      if (!supabase) {
        logger.error('âŒ Supabase no estÃ¡ disponible para bÃºsqueda global');
        return [];
      }

      const { data, error } = await (supabase as any).rpc('search_unified', {
        query_text: trimmed,
      });

      if (error) {
        logger.error('âŒ Error en search_unified RPC', { error: error.message });
        return [];
      }

      if (!data) return [];

      return (data as any[]).map((row) => ({
        id: String(row.id),
        type: row.type as 'profile',
        title: row.title ?? '',
        subtitle: row.subtitle ?? '',
        image_url: row.image_url ?? null,
      }));
    } catch (error) {
      logger.error('âŒ ExcepciÃ³n en GlobalSearchService.search', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }
}

