export interface Profile {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  age?: number | null;
  role?: string;
  email?: string | null;
  profile_type?: string | null;
  is_demo?: boolean | null;
  is_verified?: boolean | null;
  is_premium?: boolean | null;
  created_at?: string;
  updated_at?: string;
  user_id?: string;
  [key: string]: unknown;
}

export interface MessageDB {
  id: string;
  content: string;
  sender_id: string;
  room_id?: string;
  created_at: string;
  updated_at?: string;
  read_at?: string;
  metadata?: Record<string, any>;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Profile;
        Update: Partial<Profile>;
      };
      messages: {
        Row: MessageDB;
        Insert: MessageDB;
        Update: Partial<MessageDB>;
      };
    };
  };
}
