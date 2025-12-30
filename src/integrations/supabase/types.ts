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
          event_data: Json | null
          event_name: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_name: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_name?: string
          id?: string
          user_id?: string | null
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
      biometric_challenges: {
        Row: {
          challenge: string
          created_at: string
          id: string
        }
        Insert: {
          challenge: string
          created_at?: string
          id?: string
        }
        Update: {
          challenge?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      biometric_credentials: {
        Row: {
          created_at: string
          credential_id: string
          id: string
          last_used_at: string | null
          public_key: string
          sign_count: number
          transports: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_id: string
          id?: string
          last_used_at?: string | null
          public_key: string
          sign_count: number
          transports?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          credential_id?: string
          id?: string
          last_used_at?: string | null
          public_key?: string
          sign_count?: number
          transports?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      biometric_sessions: {
        Row: {
          confidence: number | null
          created_at: string | null
          credential_id: string | null
          device_id: string | null
          expires_at: string
          id: string
          is_active: boolean | null
          last_used_at: string | null
          public_key: string | null
          session_id: string
          session_type: string
          success: boolean | null
          user_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          credential_id?: string | null
          device_id?: string | null
          expires_at: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          public_key?: string | null
          session_id: string
          session_type: string
          success?: boolean | null
          user_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          credential_id?: string | null
          device_id?: string | null
          expires_at?: string
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          public_key?: string | null
          session_id?: string
          session_type?: string
          success?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "biometric_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blockchain_transactions: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string
          network: string | null
          status: string | null
          token_type: string | null
          transaction_hash: string | null
          transaction_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string
          network?: string | null
          status?: string | null
          token_type?: string | null
          transaction_hash?: string | null
          transaction_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string
          network?: string | null
          status?: string | null
          token_type?: string | null
          transaction_hash?: string | null
          transaction_type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      clubs: {
        Row: {
          address: string
          check_in_count: number | null
          check_in_radius_meters: number | null
          city: string
          country: string | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          email: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          latitude: number
          logo_url: string | null
          longitude: number
          metadata: Json | null
          name: string
          phone: string | null
          rating_average: number | null
          rating_count: number | null
          review_count: number | null
          slug: string
          state: string | null
          total_reviews: number | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
          website: string | null
        }
        Insert: {
          address: string
          check_in_count?: number | null
          check_in_radius_meters?: number | null
          city: string
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          latitude: number
          logo_url?: string | null
          longitude: number
          metadata?: Json | null
          name: string
          phone?: string | null
          rating_average?: number | null
          rating_count?: number | null
          review_count?: number | null
          slug: string
          state?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Update: {
          address?: string
          check_in_count?: number | null
          check_in_radius_meters?: number | null
          city?: string
          country?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          latitude?: number
          logo_url?: string | null
          longitude?: number
          metadata?: Json | null
          name?: string
          phone?: string | null
          rating_average?: number | null
          rating_count?: number | null
          review_count?: number | null
          slug?: string
          state?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
          website?: string | null
        }
        Relationships: []
      }
      cmpx_purchases: {
        Row: {
          bonus_cmpx: number | null
          cmpx_amount: number
          created_at: string | null
          id: string
          package_id: string
          payment_status: string | null
          price_mxn: number
          price_usd: number | null
          status: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          total_cmpx: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bonus_cmpx?: number | null
          cmpx_amount: number
          created_at?: string | null
          id?: string
          package_id: string
          payment_status?: string | null
          price_mxn: number
          price_usd?: number | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          total_cmpx: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bonus_cmpx?: number | null
          cmpx_amount?: number
          created_at?: string | null
          id?: string
          package_id?: string
          payment_status?: string | null
          price_mxn?: number
          price_usd?: number | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          total_cmpx?: number
          updated_at?: string | null
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
          bonus_cmpx: number | null
          cmpx_amount: number
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_popular: boolean | null
          name: string
          price_mxn: number
          price_usd: number | null
          updated_at: string | null
        }
        Insert: {
          bonus_cmpx?: number | null
          cmpx_amount: number
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name: string
          price_mxn: number
          price_usd?: number | null
          updated_at?: string | null
        }
        Update: {
          bonus_cmpx?: number | null
          cmpx_amount?: number
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_popular?: boolean | null
          name?: string
          price_mxn?: number
          price_usd?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      couple_agreements: {
        Row: {
          agreement_type: string
          content: string | null
          couple_profile_id: string
          created_at: string | null
          id: string
          signed_at: string | null
          updated_at: string | null
        }
        Insert: {
          agreement_type: string
          content?: string | null
          couple_profile_id: string
          created_at?: string | null
          id?: string
          signed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          agreement_type?: string
          content?: string | null
          couple_profile_id?: string
          created_at?: string | null
          id?: string
          signed_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "couple_agreements_couple_profile_id_fkey"
            columns: ["couple_profile_id"]
            isOneToOne: false
            referencedRelation: "couple_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_disputes: {
        Row: {
          couple_profile_id: string
          created_at: string | null
          description: string | null
          dispute_type: string
          id: string
          resolution: string | null
          resolved_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          couple_profile_id: string
          created_at?: string | null
          description?: string | null
          dispute_type: string
          id?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          couple_profile_id?: string
          created_at?: string | null
          description?: string | null
          dispute_type?: string
          id?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "couple_disputes_couple_profile_id_fkey"
            columns: ["couple_profile_id"]
            isOneToOne: false
            referencedRelation: "couple_profiles"
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
          couple_profile_id: string
          created_at: string | null
          id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          couple_profile_id: string
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          couple_profile_id?: string
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "couple_nft_requests_couple_profile_id_fkey"
            columns: ["couple_profile_id"]
            isOneToOne: false
            referencedRelation: "couple_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      couple_profiles: {
        Row: {
          age_range_max: number | null
          age_range_min: number | null
          bio: string | null
          compatibility_factors: Json | null
          couple_name: string | null
          created_at: string | null
          display_name: string | null
          experience_level: string | null
          id: string
          interests: string[] | null
          is_active: boolean | null
          is_demo: boolean | null
          is_premium: boolean | null
          is_verified: boolean | null
          latitude: number | null
          location: string | null
          longitude: number | null
          looking_for: string[] | null
          partner_1_id: string
          partner_2_id: string
          photos: string[] | null
          preferences: Json | null
          relationship_duration: number | null
          relationship_type: string | null
          statistics: Json | null
          status: string | null
          updated_at: string | null
          user_id: string
          videos: string[] | null
        }
        Insert: {
          age_range_max?: number | null
          age_range_min?: number | null
          bio?: string | null
          compatibility_factors?: Json | null
          couple_name?: string | null
          created_at?: string | null
          display_name?: string | null
          experience_level?: string | null
          id?: string
          interests?: string[] | null
          is_active?: boolean | null
          is_demo?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          looking_for?: string[] | null
          partner_1_id: string
          partner_2_id: string
          photos?: string[] | null
          preferences?: Json | null
          relationship_duration?: number | null
          relationship_type?: string | null
          statistics?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          videos?: string[] | null
        }
        Update: {
          age_range_max?: number | null
          age_range_min?: number | null
          bio?: string | null
          compatibility_factors?: Json | null
          couple_name?: string | null
          created_at?: string | null
          display_name?: string | null
          experience_level?: string | null
          id?: string
          interests?: string[] | null
          is_active?: boolean | null
          is_demo?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          looking_for?: string[] | null
          partner_1_id?: string
          partner_2_id?: string
          photos?: string[] | null
          preferences?: Json | null
          relationship_duration?: number | null
          relationship_type?: string | null
          statistics?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          videos?: string[] | null
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
      daily_token_claims: {
        Row: {
          amount: number
          claimed_date: string | null
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          claimed_date?: string | null
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          claimed_date?: string | null
          created_at?: string | null
          id?: string
          user_id?: string
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
          asset_type: string
          created_at: string | null
          frozen_at: string | null
          id: string
          reason: string | null
          unfrozen_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          asset_type: string
          created_at?: string | null
          frozen_at?: string | null
          id?: string
          reason?: string | null
          unfrozen_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          asset_type?: string
          created_at?: string | null
          frozen_at?: string | null
          id?: string
          reason?: string | null
          unfrozen_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          granted_by: string | null
          granted_to: string | null
          id: string
          permission_type: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          gallery_owner_id?: string | null
          granted_by?: string | null
          granted_to?: string | null
          id?: string
          permission_type: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          gallery_owner_id?: string | null
          granted_by?: string | null
          granted_to?: string | null
          id?: string
          permission_type?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      investment_tiers: {
        Row: {
          amount_mxn: number
          benefits: Json | null
          cmpx_tokens_rewarded: number
          created_at: string | null
          description: string | null
          display_order: number | null
          equity_percentage: number | null
          id: string
          includes_equity: boolean | null
          includes_vip_dinner: boolean | null
          is_active: boolean | null
          name: string
          return_percentage: number
          return_type: string | null
          tier_key: string
          updated_at: string | null
        }
        Insert: {
          amount_mxn: number
          benefits?: Json | null
          cmpx_tokens_rewarded?: number
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          equity_percentage?: number | null
          id?: string
          includes_equity?: boolean | null
          includes_vip_dinner?: boolean | null
          is_active?: boolean | null
          name: string
          return_percentage?: number
          return_type?: string | null
          tier_key: string
          updated_at?: string | null
        }
        Update: {
          amount_mxn?: number
          benefits?: Json | null
          cmpx_tokens_rewarded?: number
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          equity_percentage?: number | null
          id?: string
          includes_equity?: boolean | null
          includes_vip_dinner?: boolean | null
          is_active?: boolean | null
          name?: string
          return_percentage?: number
          return_type?: string | null
          tier_key?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      investments: {
        Row: {
          activated_at: string | null
          amount_mxn: number
          amount_usd: number | null
          benefits: Json | null
          cmpx_tokens_rewarded: number | null
          completed_at: string | null
          contract_signed: boolean | null
          contract_signed_at: string | null
          created_at: string | null
          equity_percentage: number | null
          id: string
          includes_equity: boolean | null
          includes_vip_dinner: boolean | null
          metadata: Json | null
          notes: string | null
          payment_method: string | null
          payment_status: string | null
          return_percentage: number
          return_type: string | null
          safte_contract_url: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          amount_mxn: number
          amount_usd?: number | null
          benefits?: Json | null
          cmpx_tokens_rewarded?: number | null
          completed_at?: string | null
          contract_signed?: boolean | null
          contract_signed_at?: string | null
          created_at?: string | null
          equity_percentage?: number | null
          id?: string
          includes_equity?: boolean | null
          includes_vip_dinner?: boolean | null
          metadata?: Json | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          return_percentage: number
          return_type?: string | null
          safte_contract_url?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          tier: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activated_at?: string | null
          amount_mxn?: number
          amount_usd?: number | null
          benefits?: Json | null
          cmpx_tokens_rewarded?: number | null
          completed_at?: string | null
          contract_signed?: boolean | null
          contract_signed_at?: string | null
          created_at?: string | null
          equity_percentage?: number | null
          id?: string
          includes_equity?: boolean | null
          includes_vip_dinner?: boolean | null
          metadata?: Json | null
          notes?: string | null
          payment_method?: string | null
          payment_status?: string | null
          return_percentage?: number
          return_type?: string | null
          safte_contract_url?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      invitation_templates: {
        Row: {
          body: string
          created_at: string | null
          id: string
          name: string
          subject: string
          updated_at: string | null
          variables: string[] | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          name: string
          subject: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          name?: string
          subject?: string
          updated_at?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      invitations: {
        Row: {
          created_at: string | null
          id: string
          invitee_email: string
          inviter_id: string | null
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invitee_email: string
          inviter_id?: string | null
          status?: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invitee_email?: string
          inviter_id?: string | null
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          compatibility_score: number | null
          created_at: string | null
          id: string
          matched_at: string | null
          profile_id_1: string
          profile_id_2: string
          status: Database["public"]["Enums"]["match_status"] | null
          user1_id: string | null
          user2_id: string | null
        }
        Insert: {
          compatibility_score?: number | null
          created_at?: string | null
          id?: string
          matched_at?: string | null
          profile_id_1: string
          profile_id_2: string
          status?: Database["public"]["Enums"]["match_status"] | null
          user1_id?: string | null
          user2_id?: string | null
        }
        Update: {
          compatibility_score?: number | null
          created_at?: string | null
          id?: string
          matched_at?: string | null
          profile_id_1?: string
          profile_id_2?: string
          status?: Database["public"]["Enums"]["match_status"] | null
          user1_id?: string | null
          user2_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_profile_id_1_fkey"
            columns: ["profile_id_1"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_profile_id_2_fkey"
            columns: ["profile_id_2"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      moderation_metrics: {
        Row: {
          accuracy_score: number | null
          actions_taken: number | null
          created_at: string | null
          id: string
          moderator_id: string
          period_end: string
          period_start: string
          reports_reviewed: number | null
          severity: string | null
          status: string | null
        }
        Insert: {
          accuracy_score?: number | null
          actions_taken?: number | null
          created_at?: string | null
          id?: string
          moderator_id: string
          period_end: string
          period_start: string
          reports_reviewed?: number | null
          severity?: string | null
          status?: string | null
        }
        Update: {
          accuracy_score?: number | null
          actions_taken?: number | null
          created_at?: string | null
          id?: string
          moderator_id?: string
          period_end?: string
          period_start?: string
          reports_reviewed?: number | null
          severity?: string | null
          status?: string | null
        }
        Relationships: []
      }
      moderator_payments: {
        Row: {
          actions_taken: number | null
          created_at: string | null
          id: string
          metadata: Json | null
          moderator_id: string
          moderator_level: string | null
          notes: string | null
          payment_amount_mxn: number
          payment_date: string | null
          payment_method: string | null
          payment_period_end: string
          payment_period_start: string
          payment_status: string | null
          quality_score: number | null
          reports_reviewed: number | null
          revenue_percentage: number
          stripe_payout_id: string | null
          total_minutes_worked: number | null
          total_revenue_mxn: number
          updated_at: string | null
        }
        Insert: {
          actions_taken?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          moderator_id: string
          moderator_level?: string | null
          notes?: string | null
          payment_amount_mxn: number
          payment_date?: string | null
          payment_method?: string | null
          payment_period_end: string
          payment_period_start: string
          payment_status?: string | null
          quality_score?: number | null
          reports_reviewed?: number | null
          revenue_percentage: number
          stripe_payout_id?: string | null
          total_minutes_worked?: number | null
          total_revenue_mxn: number
          updated_at?: string | null
        }
        Update: {
          actions_taken?: number | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          moderator_id?: string
          moderator_level?: string | null
          notes?: string | null
          payment_amount_mxn?: number
          payment_date?: string | null
          payment_method?: string | null
          payment_period_end?: string
          payment_period_start?: string
          payment_status?: string | null
          quality_score?: number | null
          reports_reviewed?: number | null
          revenue_percentage?: number
          stripe_payout_id?: string | null
          total_minutes_worked?: number | null
          total_revenue_mxn?: number
          updated_at?: string | null
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
      moderators: {
        Row: {
          activated_at: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          level: string | null
          moderator_id: string | null
          notes: string | null
          permissions: Json | null
          role: string | null
          status: string | null
          suspended_at: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          activated_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          moderator_id?: string | null
          notes?: string | null
          permissions?: Json | null
          role?: string | null
          status?: string | null
          suspended_at?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          activated_at?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          moderator_id?: string | null
          notes?: string | null
          permissions?: Json | null
          role?: string | null
          status?: string | null
          suspended_at?: string | null
          updated_at?: string | null
          user_id?: string | null
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
          created_at: string | null
          id: string
          nft_id: string
          rewards_earned: number | null
          staked_at: string | null
          unstaked_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          nft_id: string
          rewards_earned?: number | null
          staked_at?: string | null
          unstaked_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          nft_id?: string
          rewards_earned?: number | null
          staked_at?: string | null
          unstaked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nft_staking_nft_id_fkey"
            columns: ["nft_id"]
            isOneToOne: false
            referencedRelation: "user_nfts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          notification_type: string | null
          read_at: string | null
          related_user_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          notification_type?: string | null
          read_at?: string | null
          related_user_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          notification_type?: string | null
          read_at?: string | null
          related_user_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_user_id_fkey"
            columns: ["related_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string | null
          deleted_at: string | null
          id: string
          image_url: string | null
          is_premium: boolean | null
          is_public: boolean | null
          likes_count: number | null
          location: string | null
          post_type: string | null
          profile_id: string | null
          shares_count: number | null
          updated_at: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          is_premium?: boolean | null
          is_public?: boolean | null
          likes_count?: number | null
          location?: string | null
          post_type?: string | null
          profile_id?: string | null
          shares_count?: number | null
          updated_at?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          id?: string
          image_url?: string | null
          is_premium?: boolean | null
          is_public?: boolean | null
          likes_count?: number | null
          location?: string | null
          post_type?: string | null
          profile_id?: string | null
          shares_count?: number | null
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          cover_image_url: string | null
          created_at: string | null
          display_name: string | null
          email: string | null
          email_verified_at: string | null
          experience_level: string | null
          first_name: string | null
          gender: string | null
          id: string
          interests: string[] | null
          is_active: boolean | null
          is_demo: boolean | null
          is_online: boolean | null
          is_premium: boolean | null
          is_verified: boolean | null
          last_active: string | null
          last_name: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          looking_for: string[] | null
          phone: string | null
          phone_verified_at: string | null
          pin_hash: string | null
          preferences: Json | null
          profile_type: string | null
          relationship_type: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          score: number
          score_status: Database["public"]["Enums"]["profile_score_status"]
          statistics: Json | null
          suspended: boolean | null
          suspended_at: string | null
          suspended_reason: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          email_verified_at?: string | null
          experience_level?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_active?: boolean | null
          is_demo?: boolean | null
          is_online?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          last_active?: string | null
          last_name?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          looking_for?: string[] | null
          phone?: string | null
          phone_verified_at?: string | null
          pin_hash?: string | null
          preferences?: Json | null
          profile_type?: string | null
          relationship_type?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          score?: number
          score_status?: Database["public"]["Enums"]["profile_score_status"]
          statistics?: Json | null
          suspended?: boolean | null
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          email_verified_at?: string | null
          experience_level?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_active?: boolean | null
          is_demo?: boolean | null
          is_online?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          last_active?: string | null
          last_name?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          looking_for?: string[] | null
          phone?: string | null
          phone_verified_at?: string | null
          pin_hash?: string | null
          preferences?: Json | null
          profile_type?: string | null
          relationship_type?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          score?: number
          score_status?: Database["public"]["Enums"]["profile_score_status"]
          statistics?: Json | null
          suspended?: boolean | null
          suspended_at?: string | null
          suspended_reason?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          amount: number
          claimed_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_claimed: boolean | null
          reward_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          claimed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_claimed?: boolean | null
          reward_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          claimed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_claimed?: boolean | null
          reward_type?: string
          updated_at?: string | null
          user_id?: string
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
          ai_classified: boolean | null
          assigned_to: string | null
          content_type: string | null
          created_at: string | null
          description: string | null
          id: string
          is_false_positive: boolean | null
          priority: string | null
          queue_position: number | null
          reason: string
          report_type: string | null
          reported_content_id: string | null
          reported_couple_id: string | null
          reported_user_id: string | null
          reporter_id: string
          reporter_user_id: string | null
          resolution_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          reviewing: string | null
          severity: string | null
          status: Database["public"]["Enums"]["report_status"] | null
          updated_at: string | null
        }
        Insert: {
          action_taken?: string | null
          ai_classified?: boolean | null
          assigned_to?: string | null
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_false_positive?: boolean | null
          priority?: string | null
          queue_position?: number | null
          reason: string
          report_type?: string | null
          reported_content_id?: string | null
          reported_couple_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          reporter_user_id?: string | null
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewing?: string | null
          severity?: string | null
          status?: Database["public"]["Enums"]["report_status"] | null
          updated_at?: string | null
        }
        Update: {
          action_taken?: string | null
          ai_classified?: boolean | null
          assigned_to?: string | null
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_false_positive?: boolean | null
          priority?: string | null
          queue_position?: number | null
          reason?: string
          report_type?: string | null
          reported_content_id?: string | null
          reported_couple_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          reporter_user_id?: string | null
          resolution_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewing?: string | null
          severity?: string | null
          status?: Database["public"]["Enums"]["report_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_couple_id_fkey"
            columns: ["reported_couple_id"]
            isOneToOne: false
            referencedRelation: "couple_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: unknown
          resource: string
          risk_score: number | null
          session_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource: string
          risk_score?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource?: string
          risk_score?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string
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
          story_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          story_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          story_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_comments_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        Relationships: [
          {
            foreignKeyName: "story_likes_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_shares: {
        Row: {
          created_at: string | null
          id: string
          share_type: string | null
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          share_type?: string | null
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          share_type?: string | null
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_shares_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      testnet_token_claims: {
        Row: {
          amount: number
          claimed_at: string | null
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          claimed_at?: string | null
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      token_analytics: {
        Row: {
          active_stakers: number | null
          circulating_cmpx: number
          circulating_gtk: number
          created_at: string | null
          id: string
          metadata: Json | null
          period_end: string
          period_start: string
          period_type: string
          total_cmpx_supply: number
          total_gtk_supply: number
          total_staked_cmpx: number | null
          transaction_count: number | null
          transaction_volume_cmpx: number | null
          transaction_volume_gtk: number | null
        }
        Insert: {
          active_stakers?: number | null
          circulating_cmpx: number
          circulating_gtk: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          period_end: string
          period_start: string
          period_type: string
          total_cmpx_supply: number
          total_gtk_supply: number
          total_staked_cmpx?: number | null
          transaction_count?: number | null
          transaction_volume_cmpx?: number | null
          transaction_volume_gtk?: number | null
        }
        Update: {
          active_stakers?: number | null
          circulating_cmpx?: number
          circulating_gtk?: number
          created_at?: string | null
          id?: string
          metadata?: Json | null
          period_end?: string
          period_start?: string
          period_type?: string
          total_cmpx_supply?: number
          total_gtk_supply?: number
          total_staked_cmpx?: number | null
          transaction_count?: number | null
          transaction_volume_cmpx?: number | null
          transaction_volume_gtk?: number | null
        }
        Relationships: []
      }
      token_staking: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          rewards_earned: number | null
          staked_at: string | null
          token_type: string
          unstaked_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          rewards_earned?: number | null
          staked_at?: string | null
          token_type: string
          unstaked_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          rewards_earned?: number | null
          staked_at?: string | null
          token_type?: string
          unstaked_at?: string | null
          user_id?: string
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
      two_factor_auth: {
        Row: {
          backup_codes: string[] | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          method: string
          secret: string | null
          updated_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          method: string
          secret?: string | null
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          method?: string
          secret?: string | null
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          consent_text_hash: string | null
          consent_type: string
          consented_at: string | null
          created_at: string | null
          document_path: string
          expires_at: string | null
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          user_agent: string | null
          user_id: string
          version: string | null
        }
        Insert: {
          consent_text_hash?: string | null
          consent_type: string
          consented_at?: string | null
          created_at?: string | null
          document_path: string
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          user_agent?: string | null
          user_id: string
          version?: string | null
        }
        Update: {
          consent_text_hash?: string | null
          consent_type?: string
          consented_at?: string | null
          created_at?: string | null
          document_path?: string
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          user_agent?: string | null
          user_id?: string
          version?: string | null
        }
        Relationships: []
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
      user_nfts: {
        Row: {
          contract_address: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          nft_id: string | null
          token_id: string | null
          user_id: string
        }
        Insert: {
          contract_address?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          nft_id?: string | null
          token_id?: string | null
          user_id: string
        }
        Update: {
          contract_address?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          nft_id?: string | null
          token_id?: string | null
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
          cmpx_balance: number | null
          created_at: string | null
          gtk_balance: number | null
          id: string
          nft_count: number | null
          total_earned: number | null
          updated_at: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          cmpx_balance?: number | null
          created_at?: string | null
          gtk_balance?: number | null
          id?: string
          nft_count?: number | null
          total_earned?: number | null
          updated_at?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          cmpx_balance?: number | null
          created_at?: string | null
          gtk_balance?: number | null
          id?: string
          nft_count?: number | null
          total_earned?: number | null
          updated_at?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      virtual_events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string
          event_type: string
          id: string
          location: string | null
          max_participants: number | null
          name: string
          start_time: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time: string
          event_type: string
          id?: string
          location?: string | null
          max_participants?: number | null
          name: string
          start_time: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string
          event_type?: string
          id?: string
          location?: string | null
          max_participants?: number | null
          name?: string
          start_time?: string
          status?: string | null
          updated_at?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_profile_score: { Args: { profile_id: string }; Returns: undefined }
    }
    Enums: {
      event_type: "meetup" | "party" | "dinner" | "travel" | "other"
      match_status: "pending" | "accepted" | "rejected" | "blocked"
      profile_score_status: "green" | "yellow" | "red"
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
      profile_score_status: ["green", "yellow", "red"],
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

