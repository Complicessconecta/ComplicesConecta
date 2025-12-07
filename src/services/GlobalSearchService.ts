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
        logger.error('❌ Supabase no está disponible para búsqueda global');
        return [];
      }

      type SearchUnifiedRow = {
        id: string | number;
        type: 'profile';
        title?: string | null;
        subtitle?: string | null;
        image_url?: string | null;
      };

      type MinimalSupabaseRpcClient = {
        rpc: (
          fn: string,
          args: Record<string, unknown>
        ) => Promise<{
          data: SearchUnifiedRow[] | null;
          error: { message?: string } | null;
        }>;
      };

      const rpcClient = supabase as unknown as MinimalSupabaseRpcClient;

      const { data, error } = await rpcClient.rpc('search_unified', {
        query_text: trimmed,
      });

      if (error) {
        logger.error('❌ Error en search_unified RPC', { error: error.message });
        return [];
      }

      if (!data) return [];

      return data.map((row) => ({
        id: String(row.id),
        type: row.type,
        title: row.title ?? '',
        subtitle: row.subtitle ?? '',
        image_url: row.image_url ?? null,
      }));
    } catch (error) {
      logger.error('❌ Excepción en GlobalSearchService.search', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }
}
