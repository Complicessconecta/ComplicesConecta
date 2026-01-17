export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string | null
          event_name: string
          event_type: string
          id: string
          properties: Json | null
          session_id: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_name: string
          event_type?: string
          id?: string
          properties?: Json | null
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_name?: string
          event_type?: string
          id?: string
          properties?: Json | null
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      anti_cheat_log: {
        Row: {
          actions_taken: Json | null
          created_at: string | null
          id: string
          notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          risk_score: number
          suspicious_patterns: Json
          user_id: string
        }
        Insert: {
          actions_taken?: Json | null
          created_at?: string | null
          id?: string
          notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          risk_score: number
          suspicious_patterns: Json
          user_id: string
        }
        Update: {
          actions_taken?: Json | null
          created_at?: string | null
          id?: string
          notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          risk_score?: number
          suspicious_patterns?: Json
          user_id?: string
        }
        Relationships: []
      }
      app_config: {
        Row: {
          created_at: string
          description: string | null
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      app_logs: {
        Row: {
          created_at: string | null
          id: string
          level: string
          message: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          level: string
          message: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: string
          message?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      banner_config: {
        Row: {
          background_color: string | null
          banner_type: string
          created_at: string | null
          created_by: string | null
          cta_link: string | null
          cta_text: string | null
          description: string | null
          icon_type: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          show_close_button: boolean | null
          storage_key: string | null
          text_color: string | null
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          background_color?: string | null
          banner_type: string
          created_at?: string | null
          created_by?: string | null
          cta_link?: string | null
          cta_text?: string | null
          description?: string | null
          icon_type?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          show_close_button?: boolean | null
          storage_key?: string | null
          text_color?: string | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          background_color?: string | null
          banner_type?: string
          created_at?: string | null
          created_by?: string | null
          cta_link?: string | null
          cta_text?: string | null
          description?: string | null
          icon_type?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          show_close_button?: boolean | null
          storage_key?: string | null
          text_color?: string | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      beta_rewards: {
        Row: {
          badge: string
          claimed_at: string | null
          cmpx_tokens: number
          created_at: string | null
          final_level: string
          final_points: number
          id: string
          lifetime_discount: number | null
          premium_months: number | null
          rewards_claimed: boolean | null
          special_perks: Json | null
          user_id: string
          vip_months: number | null
        }
        Insert: {
          badge: string
          claimed_at?: string | null
          cmpx_tokens: number
          created_at?: string | null
          final_level: string
          final_points: number
          id?: string
          lifetime_discount?: number | null
          premium_months?: number | null
          rewards_claimed?: boolean | null
          special_perks?: Json | null
          user_id: string
          vip_months?: number | null
        }
        Update: {
          badge?: string
          claimed_at?: string | null
          cmpx_tokens?: number
          created_at?: string | null
          final_level?: string
          final_points?: number
          id?: string
          lifetime_discount?: number | null
          premium_months?: number | null
          rewards_claimed?: boolean | null
          special_perks?: Json | null
          user_id?: string
          vip_months?: number | null
        }
        Relationships: []
      }
      blockchain_transactions: {
        Row: {
          amount: number | null
          block_number: number | null
          confirmed_at: string | null
          created_at: string | null
          from_address: string | null
          gas_price: number | null
          gas_used: number | null
          id: string
          metadata: Json | null
          network: string
          status: string
          to_address: string | null
          transaction_hash: string
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          block_number?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          from_address?: string | null
          gas_price?: number | null
          gas_used?: number | null
          id?: string
          metadata?: Json | null
          network?: string
          status?: string
          to_address?: string | null
          transaction_hash: string
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          block_number?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          from_address?: string | null
          gas_price?: number | null
          gas_used?: number | null
          id?: string
          metadata?: Json | null
          network?: string
          status?: string
          to_address?: string | null
          transaction_hash?: string
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      cache_statistics: {
        Row: {
          average_access_time_ms: number
          compression_ratio: number
          created_at: string
          hit_rate: number
          id: number
          memory_entries: number
          memory_size_bytes: number
          miss_rate: number
          performance_score: number
          timestamp: string
          total_hits: number
          total_misses: number
        }
        Insert: {
          average_access_time_ms: number
          compression_ratio: number
          created_at?: string
          hit_rate: number
          id?: number
          memory_entries?: number
          memory_size_bytes?: number
          miss_rate: number
          performance_score: number
          timestamp?: string
          total_hits?: number
          total_misses?: number
        }
        Update: {
          average_access_time_ms?: number
          compression_ratio?: number
          created_at?: string
          hit_rate?: number
          id?: number
          memory_entries?: number
          memory_size_bytes?: number
          miss_rate?: number
          performance_score?: number
          timestamp?: string
          total_hits?: number
          total_misses?: number
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          room_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          room_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          id: string
          is_private: boolean | null
          name: string | null
          participants: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          name?: string | null
          participants?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          name?: string | null
          participants?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_summaries: {
        Row: {
          chat_room_id: string
          created_at: string | null
          id: string
          key_points: string[] | null
          summary: string | null
        }
        Insert: {
          chat_room_id: string
          created_at?: string | null
          id?: string
          key_points?: string[] | null
          summary?: string | null
        }
        Update: {
          chat_room_id?: string
          created_at?: string | null
          id?: string
          key_points?: string[] | null
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_summaries_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_evidence: {
        Row: {
          consent_id: string
          created_at: string | null
          evidence_data: Json | null
          evidence_hash: string | null
          evidence_type: string
          id: string
        }
        Insert: {
          consent_id: string
          created_at?: string | null
          evidence_data?: Json | null
          evidence_hash?: string | null
          evidence_type: string
          id?: string
        }
        Update: {
          consent_id?: string
          created_at?: string | null
          evidence_data?: Json | null
          evidence_hash?: string | null
          evidence_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_consent"
            columns: ["consent_id"]
            isOneToOne: false
            referencedRelation: "user_consents"
            referencedColumns: ["id"]
          },
        ]
      }
      content_activities: {
        Row: {
          base_points: number | null
          comments_count: number | null
          content_id: string | null
          content_type: string
          created_at: string | null
          id: string
          is_viral: boolean | null
          likes_count: number | null
          shares_count: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
          viral_bonus: number | null
        }
        Insert: {
          base_points?: number | null
          comments_count?: number | null
          content_id?: string | null
          content_type: string
          created_at?: string | null
          id?: string
          is_viral?: boolean | null
          likes_count?: number | null
          shares_count?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
          viral_bonus?: number | null
        }
        Update: {
          base_points?: number | null
          comments_count?: number | null
          content_id?: string | null
          content_type?: string
          created_at?: string | null
          id?: string
          is_viral?: boolean | null
          likes_count?: number | null
          shares_count?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
          viral_bonus?: number | null
        }
        Relationships: []
      }
      couple_agreements: {
        Row: {
          agreement_hash: string
          couple_id: string
          created_at: string | null
          dispute_deadline: string | null
          id: string
          partner_1_id: string
          partner_1_signature: boolean
          partner_2_id: string
          partner_2_signature: boolean
          signed_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          agreement_hash: string
          couple_id: string
          created_at?: string | null
          dispute_deadline?: string | null
          id?: string
          partner_1_id: string
          partner_1_signature?: boolean
          partner_2_id: string
          partner_2_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          agreement_hash?: string
          couple_id?: string
          created_at?: string | null
          dispute_deadline?: string | null
          id?: string
          partner_1_id?: string
          partner_1_signature?: boolean
          partner_2_id?: string
          partner_2_signature?: boolean
          signed_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "couple_agreements_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couple_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_agreements_partner_1_id_fkey"
            columns: ["partner_1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_agreements_partner_2_id_fkey"
            columns: ["partner_2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_disputes: {
        Row: {
          couple_agreement_id: string
          couple_id: string | null
          created_at: string | null
          deadline_at: string
          dispute_reason: string
          id: string
          initiated_by: string
          nfts_in_dispute: Json | null
          resolution_type: string | null
          status: string
          tokens_in_dispute: Json | null
          updated_at: string | null
        }
        Insert: {
          couple_agreement_id: string
          couple_id?: string | null
          created_at?: string | null
          deadline_at?: string
          dispute_reason: string
          id?: string
          initiated_by: string
          nfts_in_dispute?: Json | null
          resolution_type?: string | null
          status?: string
          tokens_in_dispute?: Json | null
          updated_at?: string | null
        }
        Update: {
          couple_agreement_id?: string
          couple_id?: string | null
          created_at?: string | null
          deadline_at?: string
          dispute_reason?: string
          id?: string
          initiated_by?: string
          nfts_in_dispute?: Json | null
          resolution_type?: string | null
          status?: string
          tokens_in_dispute?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "couple_disputes_couple_agreement_id_fkey"
            columns: ["couple_agreement_id"]
            isOneToOne: false
            referencedRelation: "couple_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_disputes_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couple_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_disputes_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_events: {
        Row: {
          couple_id: string
          created_at: string | null
          created_by: string | null
          date: string | null
          description: string | null
          event_date: string | null
          event_name: string | null
          event_type: Database["public"]["Enums"]["event_type"] | null
          id: string
          is_public: boolean | null
          location: string | null
          max_participants: number | null
          metadata: Json | null
          participants: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          couple_id: string
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          event_date?: string | null
          event_name?: string | null
          event_type?: Database["public"]["Enums"]["event_type"] | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          max_participants?: number | null
          metadata?: Json | null
          participants?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          couple_id?: string
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          description?: string | null
          event_date?: string | null
          event_name?: string | null
          event_type?: Database["public"]["Enums"]["event_type"] | null
          id?: string
          is_public?: boolean | null
          location?: string | null
          max_participants?: number | null
          metadata?: Json | null
          participants?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "couple_events_couple_id_fkey"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couple_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_nft_requests: {
        Row: {
          blockchain_status: string | null
          consent1_timestamp: string | null
          consent2_timestamp: string | null
          created_at: string | null
          expires_at: string
          id: string
          initiator_address: string
          metadata: Json | null
          metadata_uri: string
          partner1_address: string
          partner2_address: string
          status: string
          token_id: number
          updated_at: string | null
        }
        Insert: {
          blockchain_status?: string | null
          consent1_timestamp?: string | null
          consent2_timestamp?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          initiator_address: string
          metadata?: Json | null
          metadata_uri: string
          partner1_address: string
          partner2_address: string
          status?: string
          token_id: number
          updated_at?: string | null
        }
        Update: {
          blockchain_status?: string | null
          consent1_timestamp?: string | null
          consent2_timestamp?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          initiator_address?: string
          metadata?: Json | null
          metadata_uri?: string
          partner1_address?: string
          partner2_address?: string
          status?: string
          token_id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      couple_profiles: {
        Row: {
          activities_interested: string[] | null
          age_range_max: number | null
          age_range_min: number | null
          agreement_id: string | null
          city: string | null
          communication_preference: string | null
          country: string | null
          couple_age_range: string | null
          couple_availability: string | null
          couple_body_type: string | null
          couple_height_range: string | null
          couple_interests: string[] | null
          couple_lifestyle: string | null
          created_at: string | null
          display_name: string | null
          dispute_status: string | null
          event_types: string[] | null
          experience_level: string | null
          id: string
          interested_in: string | null
          is_demo: boolean
          is_public: boolean | null
          last_active: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          looking_for: string | null
          max_distance: number | null
          partner_1_id: string | null
          partner_2_id: string | null
          preferences: Json | null
          preferred_theme: string | null
          privacy_settings: Json | null
          profile_completed_at: string | null
          profile_completeness: number | null
          state: string | null
          status: string
          swinger_experience: string | null
          total_likes: number | null
          total_matches: number | null
          total_views: number | null
          updated_at: string | null
          user_id: string
          verification_level: number | null
        }
        Insert: {
          activities_interested?: string[] | null
          age_range_max?: number | null
          age_range_min?: number | null
          agreement_id?: string | null
          city?: string | null
          communication_preference?: string | null
          country?: string | null
          couple_age_range?: string | null
          couple_availability?: string | null
          couple_body_type?: string | null
          couple_height_range?: string | null
          couple_interests?: string[] | null
          couple_lifestyle?: string | null
          created_at?: string | null
          display_name?: string | null
          dispute_status?: string | null
          event_types?: string[] | null
          experience_level?: string | null
          id?: string
          interested_in?: string | null
          is_demo?: boolean
          is_public?: boolean | null
          last_active?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          looking_for?: string | null
          max_distance?: number | null
          partner_1_id?: string | null
          partner_2_id?: string | null
          preferences?: Json | null
          preferred_theme?: string | null
          privacy_settings?: Json | null
          profile_completed_at?: string | null
          profile_completeness?: number | null
          state?: string | null
          status?: string
          swinger_experience?: string | null
          total_likes?: number | null
          total_matches?: number | null
          total_views?: number | null
          updated_at?: string | null
          user_id: string
          verification_level?: number | null
        }
        Update: {
          activities_interested?: string[] | null
          age_range_max?: number | null
          age_range_min?: number | null
          agreement_id?: string | null
          city?: string | null
          communication_preference?: string | null
          country?: string | null
          couple_age_range?: string | null
          couple_availability?: string | null
          couple_body_type?: string | null
          couple_height_range?: string | null
          couple_interests?: string[] | null
          couple_lifestyle?: string | null
          created_at?: string | null
          display_name?: string | null
          dispute_status?: string | null
          event_types?: string[] | null
          experience_level?: string | null
          id?: string
          interested_in?: string | null
          is_demo?: boolean
          is_public?: boolean | null
          last_active?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          looking_for?: string | null
          max_distance?: number | null
          partner_1_id?: string | null
          partner_2_id?: string | null
          preferences?: Json | null
          preferred_theme?: string | null
          privacy_settings?: Json | null
          profile_completed_at?: string | null
          profile_completeness?: number | null
          state?: string | null
          status?: string
          swinger_experience?: string | null
          total_likes?: number | null
          total_matches?: number | null
          total_views?: number | null
          updated_at?: string | null
          user_id?: string
          verification_level?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "couple_profiles_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "couple_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_profiles_partner_1_id_fkey"
            columns: ["partner_1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_profiles_partner_2_id_fkey"
            columns: ["partner_2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_activities: {
        Row: {
          activity_date: string
          created_at: string | null
          first_login_time: string | null
          id: string
          last_activity_time: string | null
          login_count: number | null
          minutes_active: number | null
          points_earned: number | null
          streak_bonus: number | null
          user_id: string
        }
        Insert: {
          activity_date?: string
          created_at?: string | null
          first_login_time?: string | null
          id?: string
          last_activity_time?: string | null
          login_count?: number | null
          minutes_active?: number | null
          points_earned?: number | null
          streak_bonus?: number | null
          user_id: string
        }
        Update: {
          activity_date?: string
          created_at?: string | null
          first_login_time?: string | null
          id?: string
          last_activity_time?: string | null
          login_count?: number | null
          minutes_active?: number | null
          points_earned?: number | null
          streak_bonus?: number | null
          user_id?: string
        }
        Relationships: []
      }
      daily_token_claims: {
        Row: {
          amount_claimed: number
          claim_date: string
          id: string
          network: string | null
          token_type: string | null
          transaction_hash: string | null
          updated_at: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount_claimed?: number
          claim_date: string
          id?: string
          network?: string | null
          token_type?: string | null
          transaction_hash?: string | null
          updated_at?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount_claimed?: number
          claim_date?: string
          id?: string
          network?: string | null
          token_type?: string | null
          transaction_hash?: string | null
          updated_at?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      digital_fingerprints: {
        Row: {
          ban_reason: string | null
          canvas_hash: string
          combined_hash: string
          created_at: string | null
          id: string
          is_banned: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ban_reason?: string | null
          canvas_hash: string
          combined_hash: string
          created_at?: string | null
          id?: string
          is_banned?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ban_reason?: string | null
          canvas_hash?: string
          combined_hash?: string
          created_at?: string | null
          id?: string
          is_banned?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      engagement_activities: {
        Row: {
          activity_date: string
          comments_made: number | null
          created_at: string | null
          id: string
          likes_given: number | null
          messages_sent: number | null
          points_earned: number | null
          public_room_participation: boolean | null
          shares_made: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activity_date?: string
          comments_made?: number | null
          created_at?: string | null
          id?: string
          likes_given?: number | null
          messages_sent?: number | null
          points_earned?: number | null
          public_room_participation?: boolean | null
          shares_made?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activity_date?: string
          comments_made?: number | null
          created_at?: string | null
          id?: string
          likes_given?: number | null
          messages_sent?: number | null
          points_earned?: number | null
          public_room_participation?: boolean | null
          shares_made?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      error_alerts: {
        Row: {
          category: string
          created_at: string | null
          error_message: string
          error_stack: string | null
          id: string
          metadata: Json | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          error_message: string
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          error_message?: string
          error_stack?: string | null
          id?: string
          metadata?: Json | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      frozen_assets: {
        Row: {
          amount: number | null
          asset_id: string | null
          asset_type: string
          created_at: string
          dispute_id: string
          frozen_at: string
          id: string
          is_frozen: boolean
          original_owner_id: string
          unfrozen_at: string | null
        }
        Insert: {
          amount?: number | null
          asset_id?: string | null
          asset_type: string
          created_at?: string
          dispute_id: string
          frozen_at?: string
          id?: string
          is_frozen?: boolean
          original_owner_id: string
          unfrozen_at?: string | null
        }
        Update: {
          amount?: number | null
          asset_id?: string | null
          asset_type?: string
          created_at?: string
          dispute_id?: string
          frozen_at?: string
          id?: string
          is_frozen?: boolean
          original_owner_id?: string
          unfrozen_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "frozen_assets_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "couple_disputes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "frozen_assets_original_owner_id_fkey"
            columns: ["original_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_commissions: {
        Row: {
          amount_cmpx: number
          commission_amount_cmpx: number
          created_at: string | null
          creator_amount_cmpx: number
          creator_id: string
          creator_paid: boolean | null
          gallery_id: string
          id: string
          transaction_type: string
          updated_at: string | null
        }
        Insert: {
          amount_cmpx: number
          commission_amount_cmpx: number
          created_at?: string | null
          creator_amount_cmpx: number
          creator_id: string
          creator_paid?: boolean | null
          gallery_id: string
          id?: string
          transaction_type: string
          updated_at?: string | null
        }
        Update: {
          amount_cmpx?: number
          commission_amount_cmpx?: number
          created_at?: string | null
          creator_amount_cmpx?: number
          creator_id?: string
          creator_paid?: boolean | null
          gallery_id?: string
          id?: string
          transaction_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      gallery_permissions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          gallery_owner_id: string | null
          id: string
          profile_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          gallery_owner_id?: string | null
          id?: string
          profile_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          gallery_owner_id?: string | null
          id?: string
          profile_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gallery_unlocks: {
        Row: {
          gallery_item_id: string
          id: string
          profile_id: string | null
          unlocked_at: string
          user_id: string | null
        }
        Insert: {
          gallery_item_id: string
          id?: string
          profile_id?: string | null
          unlocked_at?: string
          user_id?: string | null
        }
        Update: {
          gallery_item_id?: string
          id?: string
          profile_id?: string | null
          unlocked_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_unlocks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_templates: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          invitation_type: string | null
          name: string | null
          template_content: string | null
          template_name: string | null
          type: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          invitation_type?: string | null
          name?: string | null
          template_content?: string | null
          template_name?: string | null
          type?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          invitation_type?: string | null
          name?: string | null
          template_content?: string | null
          template_name?: string | null
          type?: string | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          created_at: string | null
          from_profile: string | null
          id: string
          to_profile: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          from_profile?: string | null
          id?: string
          to_profile?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          from_profile?: string | null
          id?: string
          to_profile?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      legal_access_audit: {
        Row: {
          accessed_at: string
          accessed_by: string
          action: string
          id: string
          ip: unknown
          reason: string | null
          target_id: string | null
          target_table: string
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string
          accessed_by: string
          action: string
          id?: string
          ip?: unknown
          reason?: string | null
          target_id?: string | null
          target_table: string
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string
          accessed_by?: string
          action?: string
          id?: string
          ip?: unknown
          reason?: string | null
          target_id?: string | null
          target_table?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      legal_consents: {
        Row: {
          accepted_at: string
          created_at: string
          device_info: Json | null
          document_slug: string
          document_version: string
          evidence_encrypted: string | null
          id: string
          ip: unknown
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          created_at?: string
          device_info?: Json | null
          document_slug: string
          document_version: string
          evidence_encrypted?: string | null
          id?: string
          ip?: unknown
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          created_at?: string
          device_info?: Json | null
          document_slug?: string
          document_version?: string
          evidence_encrypted?: string | null
          id?: string
          ip?: unknown
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          content_sha256: string | null
          created_at: string
          effective_date: string | null
          id: string
          jurisdiction: string | null
          slug: string
          source_path: string | null
          title: string
          version: string
        }
        Insert: {
          content_sha256?: string | null
          created_at?: string
          effective_date?: string | null
          id?: string
          jurisdiction?: string | null
          slug: string
          source_path?: string | null
          title: string
          version: string
        }
        Update: {
          content_sha256?: string | null
          created_at?: string
          effective_date?: string | null
          id?: string
          jurisdiction?: string | null
          slug?: string
          source_path?: string | null
          title?: string
          version?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string | null
          id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_room_id: string
          content: string
          created_at: string | null
          edited_at: string | null
          id: string
          is_edited: boolean | null
          media_url: string | null
          message_type: string | null
          sender_id: string
        }
        Insert: {
          chat_room_id: string
          content: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          media_url?: string | null
          message_type?: string | null
          sender_id: string
        }
        Update: {
          chat_room_id?: string
          content?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          media_url?: string | null
          message_type?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          mission_code: string
          mission_type: string | null
          name: string
          points_reward: number
          requirements: Json
          special_reward: string | null
          start_date: string
          token_reward: number | null
          week_number: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          mission_code: string
          mission_type?: string | null
          name: string
          points_reward: number
          requirements: Json
          special_reward?: string | null
          start_date: string
          token_reward?: number | null
          week_number?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          mission_code?: string
          mission_type?: string | null
          name?: string
          points_reward?: number
          requirements?: Json
          special_reward?: string | null
          start_date?: string
          token_reward?: number | null
          week_number?: number | null
        }
        Relationships: []
      }
      moderator_sessions: {
        Row: {
          actions_taken: number | null
          id: string
          is_active: boolean | null
          moderator_id: string
          reports_reviewed: number | null
          session_end: string | null
          session_start: string | null
          total_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          actions_taken?: number | null
          id?: string
          is_active?: boolean | null
          moderator_id: string
          reports_reviewed?: number | null
          session_end?: string | null
          session_start?: string | null
          total_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          actions_taken?: number | null
          id?: string
          is_active?: boolean | null
          moderator_id?: string
          reports_reviewed?: number | null
          session_end?: string | null
          session_start?: string | null
          total_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      monitoring_sessions: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          end_time: string | null
          id: string
          metrics: Json | null
          session_type: string
          start_time: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          end_time?: string | null
          id?: string
          metrics?: Json | null
          session_type: string
          start_time?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          end_time?: string | null
          id?: string
          metrics?: Json | null
          session_type?: string
          start_time?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nft_staking: {
        Row: {
          id: string
          is_active: boolean
          is_staked: boolean
          last_claim_at: string | null
          network: string
          nft_token_id: number
          rarity_multiplier: number
          staked_at: string | null
          staking_contract: string
          total_rewards_claimed: number | null
          user_address: string
          vesting_period_days: number
        }
        Insert: {
          id?: string
          is_active?: boolean
          is_staked?: boolean
          last_claim_at?: string | null
          network?: string
          nft_token_id: number
          rarity_multiplier?: number
          staked_at?: string | null
          staking_contract: string
          total_rewards_claimed?: number | null
          user_address: string
          vesting_period_days: number
        }
        Update: {
          id?: string
          is_active?: boolean
          is_staked?: boolean
          last_claim_at?: string | null
          network?: string
          nft_token_id?: number
          rarity_multiplier?: number
          staked_at?: string | null
          staking_contract?: string
          total_rewards_claimed?: number | null
          user_address?: string
          vesting_period_days?: number
        }
        Relationships: []
      }
      nft_verifications: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          minted_with_gtk: number
          network: string
          nft_contract_address: string
          nft_token_id: string
          staking_record_id: string | null
          updated_at: string
          user_id: string
          verified_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          minted_with_gtk: number
          network: string
          nft_contract_address: string
          nft_token_id: string
          staking_record_id?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          minted_with_gtk?: number
          network?: string
          nft_contract_address?: string
          nft_token_id?: string
          staking_record_id?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      performance_metrics: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          metric_name: string
          session_id: string
          unit: string
          url: string | null
          user_agent: string | null
          user_id: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name: string
          session_id: string
          unit: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          session_id?: string
          unit?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
          value?: number
        }
        Relationships: []
      }
      permanent_bans: {
        Row: {
          ban_reason: string
          banned_at: string | null
          banned_by: string | null
          fingerprint_ids: string[] | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ban_reason: string
          banned_at?: string | null
          banned_by?: string | null
          fingerprint_ids?: string[] | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ban_reason?: string
          banned_at?: string | null
          banned_by?: string | null
          fingerprint_ids?: string[] | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      points_transactions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          points_after: number
          points_before: number
          points_change: number
          transaction_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          points_after: number
          points_before: number
          points_change: number
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          points_after?: number
          points_before?: number
          points_change?: number
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      predictive_match_scores: {
        Row: {
          compatibility_score: number
          confidence: number
          created_at: string
          emotional_score: number
          graph_score: number
          id: string
          matched_user_id: string
          reasons: string[] | null
          social_score: number
          total_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          compatibility_score: number
          confidence: number
          created_at?: string
          emotional_score: number
          graph_score: number
          id?: string
          matched_user_id: string
          reasons?: string[] | null
          social_score: number
          total_score: number
          updated_at?: string
          user_id: string
        }
        Update: {
          compatibility_score?: number
          confidence?: number
          created_at?: string
          emotional_score?: number
          graph_score?: number
          id?: string
          matched_user_id?: string
          reasons?: string[] | null
          social_score?: number
          total_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string | null
          age: number | null
          agreement_id: string | null
          consent_status: string | null
          created_at: string | null
          display_name: string | null
          dispute_id: string | null
          email_verified_at: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_demo: boolean
          is_online: boolean | null
          is_premium: boolean | null
          last_name: string | null
          latitude: number | null
          longitude: number | null
          name: string | null
          phone_verified_at: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          s2_cell_id: string | null
          s2_level: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_type?: string | null
          age?: number | null
          agreement_id?: string | null
          consent_status?: string | null
          created_at?: string | null
          display_name?: string | null
          dispute_id?: string | null
          email_verified_at?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_demo?: boolean
          is_online?: boolean | null
          is_premium?: boolean | null
          last_name?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          phone_verified_at?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          s2_cell_id?: string | null
          s2_level?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_type?: string | null
          age?: number | null
          agreement_id?: string | null
          consent_status?: string | null
          created_at?: string | null
          display_name?: string | null
          dispute_id?: string | null
          email_verified_at?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_demo?: boolean
          is_online?: boolean | null
          is_premium?: boolean | null
          last_name?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          phone_verified_at?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          s2_cell_id?: string | null
          s2_level?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "couple_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_dispute_id_fkey"
            columns: ["dispute_id"]
            isOneToOne: false
            referencedRelation: "couple_disputes"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_rewards: {
        Row: {
          created_at: string | null
          id: string
          profile_id: string | null
          verification_method: string | null
          worldid_proof: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          profile_id?: string | null
          verification_method?: string | null
          worldid_proof?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          profile_id?: string | null
          verification_method?: string | null
          worldid_proof?: Json | null
        }
        Relationships: []
      }
      referral_statistics: {
        Row: {
          conversion_rate: number | null
          created_at: string | null
          id: string
          total_clicks: number | null
          total_conversions: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          total_clicks?: number | null
          total_conversions?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversion_rate?: number | null
          created_at?: string | null
          id?: string
          total_clicks?: number | null
          total_conversions?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referral_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          balance_before: number | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          referred_user_id: string | null
          status: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          referred_user_id?: string | null
          status?: string | null
          transaction_type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          balance_before?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          referred_user_id?: string | null
          status?: string | null
          transaction_type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          activated_at: string | null
          created_at: string | null
          id: string
          points_earned: number | null
          referral_code: string
          referred_id: string
          referrer_id: string
          registered_at: string | null
          status: string | null
          verified_at: string | null
        }
        Insert: {
          activated_at?: string | null
          created_at?: string | null
          id?: string
          points_earned?: number | null
          referral_code: string
          referred_id: string
          referrer_id: string
          registered_at?: string | null
          status?: string | null
          verified_at?: string | null
        }
        Update: {
          activated_at?: string | null
          created_at?: string | null
          id?: string
          points_earned?: number | null
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          registered_at?: string | null
          status?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      report_ai_classification: {
        Row: {
          ai_category: string | null
          ai_confidence: number
          ai_model_version: string | null
          ai_severity: string
          ai_summary: string | null
          ai_tags: string[] | null
          created_at: string | null
          detected_explicit: number | null
          detected_harassment: number | null
          detected_spam: number | null
          detected_toxicity: number | null
          id: string
          report_id: string
          suggested_action: string | null
          suggested_priority: string | null
          updated_at: string | null
        }
        Insert: {
          ai_category?: string | null
          ai_confidence: number
          ai_model_version?: string | null
          ai_severity: string
          ai_summary?: string | null
          ai_tags?: string[] | null
          created_at?: string | null
          detected_explicit?: number | null
          detected_harassment?: number | null
          detected_spam?: number | null
          detected_toxicity?: number | null
          id?: string
          report_id: string
          suggested_action?: string | null
          suggested_priority?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_category?: string | null
          ai_confidence?: number
          ai_model_version?: string | null
          ai_severity?: string
          ai_summary?: string | null
          ai_tags?: string[] | null
          created_at?: string | null
          detected_explicit?: number | null
          detected_harassment?: number | null
          detected_spam?: number | null
          detected_toxicity?: number | null
          id?: string
          report_id?: string
          suggested_action?: string | null
          suggested_priority?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_ai_classification_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          action_taken: string | null
          content_type: string
          created_at: string | null
          description: string | null
          id: string
          is_false_positive: boolean | null
          reason: string
          report_type: string
          reported_content_id: string
          reported_user_id: string | null
          reporter_user_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          action_taken?: string | null
          content_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_false_positive?: boolean | null
          reason: string
          report_type?: string
          reported_content_id: string
          reported_user_id?: string | null
          reporter_user_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          action_taken?: string | null
          content_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_false_positive?: boolean | null
          reason?: string
          report_type?: string
          reported_content_id?: string
          reported_user_id?: string | null
          reporter_user_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: unknown
          status: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: unknown
          status?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown
          status?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      staking_records: {
        Row: {
          amount: number
          apy: number | null
          created_at: string | null
          end_date: string | null
          id: string
          reward_claimed: boolean | null
          reward_percentage: number | null
          start_date: string
          status: string | null
          token_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          apy?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          reward_claimed?: boolean | null
          reward_percentage?: number | null
          start_date: string
          status?: string | null
          token_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          apy?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          reward_claimed?: boolean | null
          reward_percentage?: number | null
          start_date?: string
          status?: string | null
          token_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          caption: string | null
          created_at: string | null
          duration: number | null
          expires_at: string | null
          id: string
          is_public: boolean | null
          media_type: string | null
          media_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          duration?: number | null
          expires_at?: string | null
          id?: string
          is_public?: boolean | null
          media_type?: string | null
          media_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          duration?: number | null
          expires_at?: string | null
          id?: string
          is_public?: boolean | null
          media_type?: string | null
          media_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_comment_id: string | null
          story_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          story_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_comment_id?: string | null
          story_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "story_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      story_likes: {
        Row: {
          created_at: string | null
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: []
      }
      story_shares: {
        Row: {
          created_at: string | null
          id: string
          shared_to: string | null
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          shared_to?: string | null
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          shared_to?: string | null
          story_id?: string
          user_id?: string
        }
        Relationships: []
      }
      stripe_product_mapping: {
        Row: {
          bonus_tokens: number | null
          cmpx_tokens_amount: number
          created_at: string | null
          id: string
          is_active: boolean | null
          product_type: string
          stripe_price_id: string
          updated_at: string | null
        }
        Insert: {
          bonus_tokens?: number | null
          cmpx_tokens_amount: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          product_type: string
          stripe_price_id: string
          updated_at?: string | null
        }
        Update: {
          bonus_tokens?: number | null
          cmpx_tokens_amount?: number
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          product_type?: string
          stripe_price_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_data: Json
          event_type: string
          id: string
          processed: boolean | null
          processed_at: string | null
          stripe_event_id: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_data: Json
          event_type: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_data?: Json
          event_type?: string
          id?: string
          processed?: boolean | null
          processed_at?: string | null
          stripe_event_id?: string
        }
        Relationships: []
      }
      testnet_token_claims: {
        Row: {
          amount_claimed: number
          claimed_at: string | null
          id: string
          network: string | null
          token_type: string | null
          transaction_hash: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount_claimed?: number
          claimed_at?: string | null
          id?: string
          network?: string | null
          token_type?: string | null
          transaction_hash?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount_claimed?: number
          claimed_at?: string | null
          id?: string
          network?: string | null
          token_type?: string | null
          transaction_hash?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      token_staking: {
        Row: {
          amount_staked: number
          id: string
          is_active: boolean
          is_staked: boolean
          last_claim_at: string | null
          network: string
          staked_at: string | null
          staking_contract: string
          total_rewards_claimed: number | null
          user_address: string
          vesting_period_days: number
        }
        Insert: {
          amount_staked: number
          id?: string
          is_active?: boolean
          is_staked?: boolean
          last_claim_at?: string | null
          network?: string
          staked_at?: string | null
          staking_contract: string
          total_rewards_claimed?: number | null
          user_address: string
          vesting_period_days: number
        }
        Update: {
          amount_staked?: number
          id?: string
          is_active?: boolean
          is_staked?: boolean
          last_claim_at?: string | null
          network?: string
          staked_at?: string | null
          staking_contract?: string
          total_rewards_claimed?: number | null
          user_address?: string
          vesting_period_days?: number
        }
        Relationships: []
      }
      token_transactions: {
        Row: {
          amount: number
          balance_after: number | null
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          token_type: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          token_type: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          token_type?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          consent_text_hash: string
          consent_type: string
          consented_at: string
          created_at: string
          document_path: string
          expires_at: string | null
          id: string
          ip_address: unknown
          is_active: boolean
          revoked_at: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
          version: string
        }
        Insert: {
          consent_text_hash: string
          consent_type: string
          consented_at?: string
          created_at?: string
          document_path: string
          expires_at?: string | null
          id?: string
          ip_address: unknown
          is_active?: boolean
          revoked_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
          version?: string
        }
        Update: {
          consent_text_hash?: string
          consent_type?: string
          consented_at?: string
          created_at?: string
          document_path?: string
          expires_at?: string | null
          id?: string
          ip_address?: unknown
          is_active?: boolean
          revoked_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_identifiers: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          numeric_id: number | null
          prefix: string | null
          profile_type: string
          unique_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          numeric_id?: number | null
          prefix?: string | null
          profile_type: string
          unique_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          numeric_id?: number | null
          prefix?: string | null
          profile_type?: string
          unique_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_interests: {
        Row: {
          created_at: string | null
          id: string
          interest_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interest_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interest_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_missions: {
        Row: {
          claimed_at: string | null
          completed_at: string | null
          id: string
          mission_id: string
          points_received: number | null
          progress: Json | null
          started_at: string | null
          status: string | null
          tokens_received: number | null
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          completed_at?: string | null
          id?: string
          mission_id: string
          points_received?: number | null
          progress?: Json | null
          started_at?: string | null
          status?: string | null
          tokens_received?: number | null
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          completed_at?: string | null
          id?: string
          mission_id?: string
          points_received?: number | null
          progress?: Json | null
          started_at?: string | null
          status?: string | null
          tokens_received?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_nfts: {
        Row: {
          attributes: Json | null
          contract_address: string | null
          created_at: string | null
          id: string
          is_couple: boolean
          is_staked: boolean | null
          metadata_uri: string
          network: string
          owner_address: string
          partner_address: string | null
          rarity: string
          staked_at: string | null
          token_id: number
          updated_at: string | null
        }
        Insert: {
          attributes?: Json | null
          contract_address?: string | null
          created_at?: string | null
          id?: string
          is_couple?: boolean
          is_staked?: boolean | null
          metadata_uri: string
          network?: string
          owner_address: string
          partner_address?: string | null
          rarity?: string
          staked_at?: string | null
          token_id: number
          updated_at?: string | null
        }
        Update: {
          attributes?: Json | null
          contract_address?: string | null
          created_at?: string | null
          id?: string
          is_couple?: boolean
          is_staked?: boolean | null
          metadata_uri?: string
          network?: string
          owner_address?: string
          partner_address?: string | null
          rarity?: string
          staked_at?: string | null
          token_id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      user_points: {
        Row: {
          content_points: number | null
          created_at: string | null
          current_streak: number | null
          daily_activity_points: number | null
          engagement_points: number | null
          id: string
          last_active_date: string | null
          level: string | null
          longest_streak: number | null
          mission_points: number | null
          referral_points: number | null
          total_points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content_points?: number | null
          created_at?: string | null
          current_streak?: number | null
          daily_activity_points?: number | null
          engagement_points?: number | null
          id?: string
          last_active_date?: string | null
          level?: string | null
          longest_streak?: number | null
          mission_points?: number | null
          referral_points?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content_points?: number | null
          created_at?: string | null
          current_streak?: number | null
          daily_activity_points?: number | null
          engagement_points?: number | null
          id?: string
          last_active_date?: string | null
          level?: string | null
          longest_streak?: number | null
          mission_points?: number | null
          referral_points?: number | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_referral_balances: {
        Row: {
          cmpx_balance: number | null
          created_at: string | null
          id: string
          last_reset_date: string | null
          monthly_earned: number | null
          referral_code: string
          total_earned: number | null
          total_referrals: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cmpx_balance?: number | null
          created_at?: string | null
          id?: string
          last_reset_date?: string | null
          monthly_earned?: number | null
          referral_code: string
          total_earned?: number | null
          total_referrals?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cmpx_balance?: number | null
          created_at?: string | null
          id?: string
          last_reset_date?: string | null
          monthly_earned?: number | null
          referral_code?: string
          total_earned?: number | null
          total_referrals?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      user_stripe_customers: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          stripe_customer_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          stripe_customer_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          stripe_customer_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_token_balances: {
        Row: {
          cmpx_balance: number | null
          created_at: string | null
          gtk_balance: number | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cmpx_balance?: number | null
          created_at?: string | null
          gtk_balance?: number | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cmpx_balance?: number | null
          created_at?: string | null
          gtk_balance?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          address: string
          created_at: string | null
          encrypted_private_key: string
          id: string
          is_frozen: boolean
          network: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string | null
          encrypted_private_key: string
          id?: string
          is_frozen?: boolean
          network?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string | null
          encrypted_private_key?: string
          id?: string
          is_frozen?: boolean
          network?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      web_vitals_history: {
        Row: {
          cls: number | null
          created_at: string | null
          fcp: number | null
          fid: number | null
          id: string
          lcp: number | null
          metadata: Json | null
          ttfb: number | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          cls?: number | null
          created_at?: string | null
          fcp?: number | null
          fid?: number | null
          id?: string
          lcp?: number | null
          metadata?: Json | null
          ttfb?: number | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          cls?: number | null
          created_at?: string | null
          fcp?: number | null
          fid?: number | null
          id?: string
          lcp?: number | null
          metadata?: Json | null
          ttfb?: number | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      worldid_verifications: {
        Row: {
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string
          verification_level: string | null
          verified_at: string | null
          world_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
          verification_level?: string | null
          verified_at?: string | null
          world_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
          verification_level?: string | null
          verified_at?: string | null
          world_id?: string | null
        }
        Relationships: []
      }
      wrappers_fdw_stats: {
        Row: {
          bytes_in: number | null
          bytes_out: number | null
          create_times: number | null
          created_at: string
          fdw_name: string
          metadata: Json | null
          rows_in: number | null
          rows_out: number | null
          updated_at: string
        }
        Insert: {
          bytes_in?: number | null
          bytes_out?: number | null
          create_times?: number | null
          created_at?: string
          fdw_name: string
          metadata?: Json | null
          rows_in?: number | null
          rows_out?: number | null
          updated_at?: string
        }
        Update: {
          bytes_in?: number | null
          bytes_out?: number | null
          create_times?: number | null
          created_at?: string
          fdw_name?: string
          metadata?: Json | null
          rows_in?: number | null
          rows_out?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      geographic_hotspots: {
        Row: {
          active_users: number | null
          avg_age: number | null
          last_activity: string | null
          s2_cell_id: string | null
          s2_level: number | null
        }
        Relationships: []
      }
      stripe_prices: {
        Row: {
          created: string | null
          currency: string | null
          id: string | null
          metadata: Json | null
          nickname: string | null
          product_id: string | null
          recurring_interval: string | null
          recurring_interval_count: number | null
          type: string | null
          unit_amount: number | null
          updated: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "stripe_products"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_products: {
        Row: {
          active: boolean | null
          created: string | null
          description: string | null
          id: string | null
          metadata: Json | null
          name: string | null
          updated: string | null
        }
        Relationships: []
      }
      stripe_user_charges: {
        Row: {
          amount: number | null
          created: string | null
          currency: string | null
          description: string | null
          id: string | null
          metadata: Json | null
          status: string | null
        }
        Relationships: []
      }
      stripe_user_invoices: {
        Row: {
          amount_due: number | null
          amount_paid: number | null
          created: string | null
          currency: string | null
          due_date: string | null
          hosted_invoice_url: string | null
          id: string | null
          invoice_pdf: string | null
          metadata: Json | null
          number: string | null
          status: string | null
        }
        Relationships: []
      }
      stripe_user_subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created: string | null
          current_period_end: string | null
          current_period_start: string | null
          customer_id: string | null
          id: string | null
          metadata: Json | null
          status: string | null
          updated: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      airtable_fdw_handler: { Args: never; Returns: unknown }
      airtable_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      airtable_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      auth0_fdw_handler: { Args: never; Returns: unknown }
      auth0_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      auth0_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      big_query_fdw_handler: { Args: never; Returns: unknown }
      big_query_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      big_query_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      cleanup_expired_couple_requests: { Args: never; Returns: number }
      click_house_fdw_handler: { Args: never; Returns: unknown }
      click_house_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      click_house_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      cognito_fdw_handler: { Args: never; Returns: unknown }
      cognito_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      cognito_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      count_users_per_cell: {
        Args: never
        Returns: {
          level: number
          s2_cell_id: string
          user_count: number
        }[]
      }
      create_assets_snapshot: { Args: { p_couple_id: string }; Returns: Json }
      create_stripe_customer_for_user: {
        Args: { p_email?: string; p_metadata?: Json; p_name?: string }
        Returns: string
      }
      duckdb_fdw_handler: { Args: never; Returns: unknown }
      duckdb_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      duckdb_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      firebase_fdw_handler: { Args: never; Returns: unknown }
      firebase_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      firebase_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      get_dispute_time_remaining: {
        Args: { p_dispute_id: string }
        Returns: {
          hours_remaining: number
          is_expired: boolean
          minutes_remaining: number
          seconds_remaining: number
        }[]
      }
      get_expired_disputes: {
        Args: never
        Returns: {
          couple_id: string
          deadline_at: string
          dispute_id: string
          hours_expired: number
        }[]
      }
      get_profiles_in_cells: {
        Args: { cell_ids: string[]; limit_count?: number }
        Returns: {
          account_type: string
          age: number
          id: string
          latitude: number
          longitude: number
          name: string
          s2_cell_id: string
          updated_at: string
        }[]
      }
      get_user_daily_claims: {
        Args: { p_date?: string; p_user_id: string }
        Returns: {
          amount_claimed: number
          remaining_limit: number
          token_type: string
        }[]
      }
      get_user_stripe_customer_id: { Args: never; Returns: string }
      hello_world_fdw_handler: { Args: never; Returns: unknown }
      hello_world_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      hello_world_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      iceberg_fdw_handler: { Args: never; Returns: unknown }
      iceberg_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      iceberg_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      is_admin_or_moderator: { Args: never; Returns: boolean }
      is_demo_user: { Args: never; Returns: boolean }
      logflare_fdw_handler: { Args: never; Returns: unknown }
      logflare_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      logflare_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      mssql_fdw_handler: { Args: never; Returns: unknown }
      mssql_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      mssql_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      process_stripe_webhook_event: {
        Args: {
          p_event_data: Json
          p_event_type: string
          p_stripe_event_id: string
        }
        Returns: Json
      }
      redis_fdw_handler: { Args: never; Returns: unknown }
      redis_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      redis_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      refresh_stripe_materialized_views: { Args: never; Returns: undefined }
      s3_fdw_handler: { Args: never; Returns: unknown }
      s3_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      s3_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      stripe_fdw_handler: { Args: never; Returns: unknown }
      stripe_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      stripe_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
      wasm_fdw_handler: { Args: never; Returns: unknown }
      wasm_fdw_meta: {
        Args: never
        Returns: {
          author: string
          name: string
          version: string
          website: string
        }[]
      }
      wasm_fdw_validator: {
        Args: { catalog: unknown; options: string[] }
        Returns: undefined
      }
    }
    Enums: {
      event_type: "meetup" | "party" | "dinner" | "travel" | "other"
      match_status: "pending" | "accepted" | "rejected" | "blocked"
      report_status: "pending" | "reviewing" | "resolved" | "dismissed"
      transaction_type:
        | "referral_bonus"
        | "withdrawal"
        | "adjustment"
        | "earn"
        | "spend"
        | "transfer"
      user_role: "user" | "moderator" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      event_type: ["meetup", "party", "dinner", "travel", "other"],
      match_status: ["pending", "accepted", "rejected", "blocked"],
      report_status: ["pending", "reviewing", "resolved", "dismissed"],
      transaction_type: [
        "referral_bonus",
        "withdrawal",
        "adjustment",
        "earn",
        "spend",
        "transfer",
      ],
      user_role: ["user", "moderator", "admin"],
    },
  },
} as const

