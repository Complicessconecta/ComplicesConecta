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
      career_applications: {
        Row: {
          cover_letter: string | null
          created_at: string | null
          email: string
          experience_years: number | null
          full_name: string
          id: string
          linkedin_url: string | null
          phone: string | null
          position: string
          resume_url: string | null
          skills: string[] | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string | null
          email: string
          experience_years?: number | null
          full_name: string
          id?: string
          linkedin_url?: string | null
          phone?: string | null
          position: string
          resume_url?: string | null
          skills?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cover_letter?: string | null
          created_at?: string | null
          email?: string
          experience_years?: number | null
          full_name?: string
          id?: string
          linkedin_url?: string | null
          phone?: string | null
          position?: string
          resume_url?: string | null
          skills?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          id: string
          participants: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          participants?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          participants?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_summaries: {
        Row: {
          chat_room_id: string
          created_at: string | null
          id: string
          key_points: Json | null
          sentiment: string | null
          summary_text: string
        }
        Insert: {
          chat_room_id: string
          created_at?: string | null
          id?: string
          key_points?: Json | null
          sentiment?: string | null
          summary_text: string
        }
        Update: {
          chat_room_id?: string
          created_at?: string | null
          id?: string
          key_points?: Json | null
          sentiment?: string | null
          summary_text?: string
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
      cmpx_purchases: {
        Row: {
          bonus_cmpx: number
          cmpx_amount: number
          created_at: string
          id: number
          package_id: number
          package_name: string
          payment_method: string | null
          price_mxn: number
          price_usd: number
          status: string
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bonus_cmpx?: number
          cmpx_amount?: number
          created_at?: string
          id?: number
          package_id: number
          package_name: string
          payment_method?: string | null
          price_mxn?: number
          price_usd?: number
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bonus_cmpx?: number
          cmpx_amount?: number
          created_at?: string
          id?: number
          package_id?: number
          package_name?: string
          payment_method?: string | null
          price_mxn?: number
          price_usd?: number
          status?: string
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cmpx_purchases_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "cmpx_shop_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      cmpx_shop_packages: {
        Row: {
          bonus_cmpx: number
          cmpx_amount: number
          created_at: string
          description: string | null
          display_order: number
          id: number
          is_active: boolean
          is_popular: boolean
          name: string
          price_mxn: number
          price_usd: number
          updated_at: string
        }
        Insert: {
          bonus_cmpx?: number
          cmpx_amount?: number
          created_at?: string
          description?: string | null
          display_order?: number
          id?: number
          is_active?: boolean
          is_popular?: boolean
          name: string
          price_mxn?: number
          price_usd?: number
          updated_at?: string
        }
        Update: {
          bonus_cmpx?: number
          cmpx_amount?: number
          created_at?: string
          description?: string | null
          display_order?: number
          id?: number
          is_active?: boolean
          is_popular?: boolean
          name?: string
          price_mxn?: number
          price_usd?: number
          updated_at?: string
        }
        Relationships: []
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
          accepted_at: string | null
          couple_agreement_id: string
          couple_id: string | null
          created_at: string | null
          deadline_at: string
          dispute_reason: string
          frozen_assets_snapshot: Json | null
          id: string
          initiated_by: string
          nfts_in_dispute: Json | null
          proposed_at: string | null
          proposed_winner_id: string | null
          resolution_type: string | null
          status: string
          tokens_in_dispute: Json | null
          updated_at: string | null
          winner_accepted_by: string | null
        }
        Insert: {
          accepted_at?: string | null
          couple_agreement_id: string
          couple_id?: string | null
          created_at?: string | null
          deadline_at?: string
          dispute_reason: string
          frozen_assets_snapshot?: Json | null
          id?: string
          initiated_by: string
          nfts_in_dispute?: Json | null
          proposed_at?: string | null
          proposed_winner_id?: string | null
          resolution_type?: string | null
          status?: string
          tokens_in_dispute?: Json | null
          updated_at?: string | null
          winner_accepted_by?: string | null
        }
        Update: {
          accepted_at?: string | null
          couple_agreement_id?: string
          couple_id?: string | null
          created_at?: string | null
          deadline_at?: string
          dispute_reason?: string
          frozen_assets_snapshot?: Json | null
          id?: string
          initiated_by?: string
          nfts_in_dispute?: Json | null
          proposed_at?: string | null
          proposed_winner_id?: string | null
          resolution_type?: string | null
          status?: string
          tokens_in_dispute?: Json | null
          updated_at?: string | null
          winner_accepted_by?: string | null
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
          {
            foreignKeyName: "fk_couple_disputes_couple_agreement_id"
            columns: ["couple_agreement_id"]
            isOneToOne: false
            referencedRelation: "couple_agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_couple_disputes_couple_id"
            columns: ["couple_id"]
            isOneToOne: false
            referencedRelation: "couples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_couple_disputes_initiated_by"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_couple_disputes_proposed_winner_id"
            columns: ["proposed_winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_couple_disputes_winner_accepted_by"
            columns: ["winner_accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          account_type: string | null
          activities_interested: string[] | null
          age_range_max: number | null
          age_range_min: number | null
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
          event_types: string[] | null
          experience_level: string | null
          id: string
          interested_in: string | null
          is_demo: boolean
          is_public: boolean | null
          is_verified: boolean | null
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
          role: string | null
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
          account_type?: string | null
          activities_interested?: string[] | null
          age_range_max?: number | null
          age_range_min?: number | null
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
          event_types?: string[] | null
          experience_level?: string | null
          id?: string
          interested_in?: string | null
          is_demo?: boolean
          is_public?: boolean | null
          is_verified?: boolean | null
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
          role?: string | null
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
          account_type?: string | null
          activities_interested?: string[] | null
          age_range_max?: number | null
          age_range_min?: number | null
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
          event_types?: string[] | null
          experience_level?: string | null
          id?: string
          interested_in?: string | null
          is_demo?: boolean
          is_public?: boolean | null
          is_verified?: boolean | null
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
          role?: string | null
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
      couples: {
        Row: {
          created_at: string
          id: string
          partner_id: string | null
          relationship_start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          partner_id?: string | null
          relationship_start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          partner_id?: string | null
          relationship_start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "couples_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couples_user_id_fkey"
            columns: ["user_id"]
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
      images: {
        Row: {
          created_at: string | null
          id: string
          is_public: boolean | null
          profile_id: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          profile_id: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          profile_id?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: []
      }
      invitation_statistics: {
        Row: {
          accepted_invitations: number | null
          created_at: string | null
          id: string
          total_invitations: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accepted_invitations?: number | null
          created_at?: string | null
          id?: string
          total_invitations?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_invitations?: number | null
          created_at?: string | null
          id?: string
          total_invitations?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      matching_preferences: {
        Row: {
          created_at: string | null
          importance_activity: number | null
          importance_interests: number | null
          importance_location: number | null
          importance_personality: number | null
          importance_verification: number | null
          interested_in: string[] | null
          max_age: number | null
          max_distance: number | null
          min_age: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          importance_activity?: number | null
          importance_interests?: number | null
          importance_location?: number | null
          importance_personality?: number | null
          importance_verification?: number | null
          interested_in?: string[] | null
          max_age?: number | null
          max_distance?: number | null
          min_age?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          importance_activity?: number | null
          importance_interests?: number | null
          importance_location?: number | null
          importance_personality?: number | null
          importance_verification?: number | null
          interested_in?: string[] | null
          max_age?: number | null
          max_distance?: number | null
          min_age?: number | null
          updated_at?: string | null
          user_id?: string
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
          location_address: string | null
          location_latitude: number | null
          location_longitude: number | null
          media_url: string | null
          message_type: string | null
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          chat_room_id: string
          content: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          location_address?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          media_url?: string | null
          message_type?: string | null
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          chat_room_id?: string
          content?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          location_address?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          media_url?: string | null
          message_type?: string | null
          sender_id?: string
          updated_at?: string | null
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
      moderation_logs: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          moderator_id: string
          reason: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          moderator_id: string
          reason?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          moderator_id?: string
          reason?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      moderator_requests: {
        Row: {
          availability: string | null
          created_at: string | null
          email: string
          experience: string | null
          full_name: string
          id: string
          reason: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          availability?: string | null
          created_at?: string | null
          email: string
          experience?: string | null
          full_name: string
          id?: string
          reason: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          availability?: string | null
          created_at?: string | null
          email?: string
          experience?: string | null
          full_name?: string
          id?: string
          reason?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      moderator_sessions: {
        Row: {
          actions_count: number | null
          actions_taken: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          moderator_id: string
          reports_reviewed: number | null
          session_end: string | null
          session_start: string | null
          status: string | null
          total_minutes: number | null
        }
        Insert: {
          actions_count?: number | null
          actions_taken?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          moderator_id: string
          reports_reviewed?: number | null
          session_end?: string | null
          session_start?: string | null
          status?: string | null
          total_minutes?: number | null
        }
        Update: {
          actions_count?: number | null
          actions_taken?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          moderator_id?: string
          reports_reviewed?: number | null
          session_end?: string | null
          session_start?: string | null
          status?: string | null
          total_minutes?: number | null
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
      permanent_bans: {
        Row: {
          ban_reason: string | null
          banned_at: string | null
          banned_by: string | null
          combined_hash: string
          created_at: string | null
          details: Json | null
          id: string
          lift_reason: string | null
          lifted_at: string | null
          lifted_by: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          combined_hash: string
          created_at?: string | null
          details?: Json | null
          id?: string
          lift_reason?: string | null
          lifted_at?: string | null
          lifted_by?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          combined_hash?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          lift_reason?: string | null
          lifted_at?: string | null
          lifted_by?: string | null
          updated_at?: string | null
          user_id?: string | null
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
      posts: {
        Row: {
          comments_count: number | null
          content: string | null
          created_at: string | null
          id: string
          is_public: boolean | null
          likes_count: number | null
          media_type: string | null
          media_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          likes_count?: number | null
          media_type?: string | null
          media_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          likes_count?: number | null
          media_type?: string | null
          media_url?: string | null
          updated_at?: string | null
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
      profile_likes: {
        Row: {
          created_at: string | null
          id: string
          liked_id: string
          liker_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          liked_id: string
          liker_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          liked_id?: string
          liker_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string | null
          adventurousness: number | null
          age: number | null
          agreeableness: number | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          conscientiousness: number | null
          created_at: string | null
          discretion: number | null
          display_name: string | null
          extraversion: number | null
          first_name: string | null
          full_name: string | null
          gender: string | null
          id: string
          id_verified: boolean | null
          id_verified_at: string | null
          interests: string[] | null
          is_demo: boolean
          is_online: boolean | null
          is_premium: boolean | null
          is_public: boolean | null
          last_name: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          name: string | null
          neuroticism: number | null
          openness: number | null
          photo_verified: boolean | null
          photo_verified_at: string | null
          role: string | null
          s2_cell_id: string | null
          s2_level: number | null
          updated_at: string | null
          user_id: string
          verification_level: string | null
          world_id_nullifier_hash: string | null
          world_id_verified_at: string | null
        }
        Insert: {
          account_type?: string | null
          adventurousness?: number | null
          age?: number | null
          agreeableness?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          conscientiousness?: number | null
          created_at?: string | null
          discretion?: number | null
          display_name?: string | null
          extraversion?: number | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          id_verified?: boolean | null
          id_verified_at?: string | null
          interests?: string[] | null
          is_demo?: boolean
          is_online?: boolean | null
          is_premium?: boolean | null
          is_public?: boolean | null
          last_name?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name?: string | null
          neuroticism?: number | null
          openness?: number | null
          photo_verified?: boolean | null
          photo_verified_at?: string | null
          role?: string | null
          s2_cell_id?: string | null
          s2_level?: number | null
          updated_at?: string | null
          user_id: string
          verification_level?: string | null
          world_id_nullifier_hash?: string | null
          world_id_verified_at?: string | null
        }
        Update: {
          account_type?: string | null
          adventurousness?: number | null
          age?: number | null
          agreeableness?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          conscientiousness?: number | null
          created_at?: string | null
          discretion?: number | null
          display_name?: string | null
          extraversion?: number | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          id_verified?: boolean | null
          id_verified_at?: string | null
          interests?: string[] | null
          is_demo?: boolean
          is_online?: boolean | null
          is_premium?: boolean | null
          is_public?: boolean | null
          last_name?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name?: string | null
          neuroticism?: number | null
          openness?: number | null
          photo_verified?: boolean | null
          photo_verified_at?: string | null
          role?: string | null
          s2_cell_id?: string | null
          s2_level?: number | null
          updated_at?: string | null
          user_id?: string
          verification_level?: string | null
          world_id_nullifier_hash?: string | null
          world_id_verified_at?: string | null
        }
        Relationships: []
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
          ai_confidence: number | null
          ai_model_version: string | null
          ai_notes: string | null
          ai_severity: string | null
          ai_summary: string | null
          ai_tags: string[] | null
          category: string | null
          confidence_score: number | null
          created_at: string | null
          detected_explicit: number | null
          detected_harassment: number | null
          detected_spam: number | null
          detected_toxicity: number | null
          id: string
          is_automated: boolean | null
          metadata: Json | null
          report_id: string
          suggested_action: string | null
          suggested_priority: string | null
        }
        Insert: {
          ai_category?: string | null
          ai_confidence?: number | null
          ai_model_version?: string | null
          ai_notes?: string | null
          ai_severity?: string | null
          ai_summary?: string | null
          ai_tags?: string[] | null
          category?: string | null
          confidence_score?: number | null
          created_at?: string | null
          detected_explicit?: number | null
          detected_harassment?: number | null
          detected_spam?: number | null
          detected_toxicity?: number | null
          id?: string
          is_automated?: boolean | null
          metadata?: Json | null
          report_id: string
          suggested_action?: string | null
          suggested_priority?: string | null
        }
        Update: {
          ai_category?: string | null
          ai_confidence?: number | null
          ai_model_version?: string | null
          ai_notes?: string | null
          ai_severity?: string | null
          ai_summary?: string | null
          ai_tags?: string[] | null
          category?: string | null
          confidence_score?: number | null
          created_at?: string | null
          detected_explicit?: number | null
          detected_harassment?: number | null
          detected_spam?: number | null
          detected_toxicity?: number | null
          id?: string
          is_automated?: boolean | null
          metadata?: Json | null
          report_id?: string
          suggested_action?: string | null
          suggested_priority?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          content_type: string
          created_at: string | null
          description: string | null
          id: string
          reason: string
          report_type: string
          reported_content_id: string
          reported_user_id: string | null
          reporter_user_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          content_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          reason: string
          report_type?: string
          reported_content_id: string
          reported_user_id?: string | null
          reporter_user_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          reason?: string
          report_type?: string
          reported_content_id?: string
          reported_user_id?: string | null
          reporter_user_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      security: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          caption: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_seen: boolean | null
          media_type: string | null
          media_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_seen?: boolean | null
          media_type?: string | null
          media_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_seen?: boolean | null
          media_type?: string | null
          media_url?: string
          user_id?: string
        }
        Relationships: []
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
          cmpx_tokens: number | null
          created_at: string
          id: string
          is_active: boolean
          price_amount: number | null
          price_currency: string
          price_id: string | null
          product_id: string
          product_name: string
          stripe_product_id: string
          updated_at: string
        }
        Insert: {
          cmpx_tokens?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          price_amount?: number | null
          price_currency?: string
          price_id?: string | null
          product_id: string
          product_name: string
          stripe_product_id: string
          updated_at?: string
        }
        Update: {
          cmpx_tokens?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          price_amount?: number | null
          price_currency?: string
          price_id?: string | null
          product_id?: string
          product_name?: string
          stripe_product_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          created_at: string
          event_data: Json
          event_id: string
          event_type: string
          id: string
          processed: boolean
          processed_at: string | null
        }
        Insert: {
          created_at?: string
          event_data: Json
          event_id: string
          event_type: string
          id?: string
          processed?: boolean
          processed_at?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json
          event_id?: string
          event_type?: string
          id?: string
          processed?: boolean
          processed_at?: string | null
        }
        Relationships: []
      }
      summary_requests: {
        Row: {
          chat_room_id: string
          created_at: string | null
          error_message: string | null
          id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chat_room_id: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chat_room_id?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "summary_requests_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
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
          created_at: string | null
          id: string
          metadata: Json | null
          status: string
          token_type: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          token_type: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          status?: string
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
      user_feeds: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          story_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          story_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          story_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feeds_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_feeds_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          interest_id: string
          user_id: string
          weight: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          interest_id: string
          user_id: string
          weight?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          interest_id?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      user_metadata: {
        Row: {
          created_at: string | null
          metadata: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          metadata?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          metadata?: Json | null
          updated_at?: string | null
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
          created_at: string
          email: string | null
          id: string
          name: string | null
          stripe_customer_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          stripe_customer_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          stripe_customer_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_stripe_customers_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_swinger_interests: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          interest_id: string
          user_id: string
          weight: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          interest_id: string
          user_id: string
          weight?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          interest_id?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      user_themes: {
        Row: {
          created_at: string | null
          is_custom: boolean | null
          theme_config: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          is_custom?: boolean | null
          theme_config?: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          is_custom?: boolean | null
          theme_config?: Json
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
      wallet_balances: {
        Row: {
          balance_cmpx: number | null
          balance_gtk: number | null
          created_at: string | null
          id: string
          last_sync: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance_cmpx?: number | null
          balance_gtk?: number | null
          created_at?: string | null
          id?: string
          last_sync?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance_cmpx?: number | null
          balance_gtk?: number | null
          created_at?: string | null
          id?: string
          last_sync?: string | null
          updated_at?: string | null
          user_id?: string
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
    }
    Functions: {
      analyze_slow_queries: {
        Args: never
        Returns: {
          calls: number
          mean_time: number
          query: string
          rows: number
          total_time: number
        }[]
      }
      cleanup_demo_data: { Args: never; Returns: undefined }
      cleanup_expired_couple_requests: { Args: never; Returns: number }
      count_users_per_cell: {
        Args: never
        Returns: {
          level: number
          s2_cell_id: string
          user_count: number
        }[]
      }
      create_assets_snapshot: { Args: { p_couple_id: string }; Returns: Json }
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
      get_profile_by_user_id: { Args: { p_user_id: string }; Returns: Json }
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
      is_admin_or_moderator: { Args: never; Returns: boolean }
      is_demo_mode: { Args: never; Returns: boolean }
      is_demo_user: { Args: never; Returns: boolean }
      reindex_critical_tables: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

