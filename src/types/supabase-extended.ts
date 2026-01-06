import { Database as GeneratedDatabase } from "./supabase-generated";

// Definición de las nuevas tablas
export interface Like {
  id: string;
  liker_id: string;
  liked_id: string;
  created_at: string;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
}

// Extender el tipo Database de forma segura preservando todas las claves de 'public'
type ExtendedPublic = Omit<GeneratedDatabase["public"], "Tables"> & {
  Tables: GeneratedDatabase["public"]["Tables"] & {
    likes: {
      Row: Like;
      Insert: Omit<Like, "id" | "created_at">;
      Update: Partial<Like>;
    };
    matches: {
      Row: Match;
      Insert: Omit<Match, "id" | "created_at">;
      Update: Partial<Match>;
    };
  };
};

export type Database = Omit<GeneratedDatabase, "public"> & {
  public: ExtendedPublic;
};
