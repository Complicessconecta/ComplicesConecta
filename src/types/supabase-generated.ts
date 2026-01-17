export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      app_metrics: {
        Row: {
          created_at: string | null
          id: string
          metric_name: string
          metric_type: string
          metric_value: number
          tags: Json | null
          timestamp: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metric_name: string
          metric_type: string
          metric_value: number
          tags?: Json | null
          timestamp?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metric_name?: string
          metric_type?: string
          metric_value?: number
          tags?: Json | null
          timestamp?: string | null
          updated_at?: string | null
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
          chat_room_id: string
          content: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          metadata: Json | null
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          chat_room_id: string
          content: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          chat_room_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          metadata?: Json | null
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          chat_id: string
          content: string | null
          created_at: string | null
          id: string
          key_points: string[] | null
          message_count: number
          method: string | null
          model_version: string | null
          sentiment: string | null
          summary: string | null
          topics: Json | null
          updated_at: string | null
        }
        Insert: {
          chat_id: string
          content?: string | null
          created_at?: string | null
          id?: string
          key_points?: string[] | null
          message_count?: number
          method?: string | null
          model_version?: string | null
          sentiment?: string | null
          summary?: string | null
          topics?: Json | null
          updated_at?: string | null
        }
        Update: {
          chat_id?: string
          content?: string | null
          created_at?: string | null
          id?: string
          key_points?: string[] | null
          message_count?: number
          method?: string | null
          model_version?: string | null
          sentiment?: string | null
          summary?: string | null
          topics?: Json | null
          updated_at?: string | null
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
      club_flyers: {
        Row: {
          ai_processing_status: string
          blur_applied: boolean
          club_id: string
          created_at: string
          description: string | null
          event_date: string | null
          event_end_date: string | null
          id: string
          image_url: string
          is_active: boolean
          is_featured: boolean
          processed_image_url: string | null
          title: string
          updated_at: string
          watermark_applied: boolean
        }
        Insert: {
          ai_processing_status?: string
          blur_applied?: boolean
          club_id: string
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_end_date?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          is_featured?: boolean
          processed_image_url?: string | null
          title: string
          updated_at?: string
          watermark_applied?: boolean
        }
        Update: {
          ai_processing_status?: string
          blur_applied?: boolean
          club_id?: string
          created_at?: string
          description?: string | null
          event_date?: string | null
          event_end_date?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          is_featured?: boolean
          processed_image_url?: string | null
          title?: string
          updated_at?: string
          watermark_applied?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "club_flyers_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_verifications: {
        Row: {
          club_id: string
          created_at: string
          documents: Json | null
          id: string
          notes: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          updated_at: string
          user_id: string
          verification_type: string | null
          verified_by: string | null
        }
        Insert: {
          club_id: string
          created_at?: string
          documents?: Json | null
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id: string
          verification_type?: string | null
          verified_by?: string | null
        }
        Update: {
          club_id?: string
          created_at?: string
          documents?: Json | null
          id?: string
          notes?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
          verification_type?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_verifications_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          amenities: Json | null
          check_in_radius_meters: number | null
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          latitude: number | null
          location: string | null
          longitude: number | null
          name: string
          opening_hours: Json | null
          phone: string | null
          rating_average: number | null
          rating_count: number | null
          slug: string
          updated_at: string | null
          verified_at: string | null
          website_url: string | null
        }
        Insert: {
          amenities?: Json | null
          check_in_radius_meters?: number | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name: string
          opening_hours?: Json | null
          phone?: string | null
          rating_average?: number | null
          rating_count?: number | null
          slug?: string
          updated_at?: string | null
          verified_at?: string | null
          website_url?: string | null
        }
        Update: {
          amenities?: Json | null
          check_in_radius_meters?: number | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          rating_average?: number | null
          rating_count?: number | null
          slug?: string
          updated_at?: string | null
          verified_at?: string | null
          website_url?: string | null
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
      consent_verifications: {
        Row: {
          chat_id: string
          confidence: number | null
          consent_score: number | null
          created_at: string | null
          id: string
          is_paused: boolean | null
          message_count: number | null
          pause_reason: string | null
          reasoning: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          user_id1: string
          user_id2: string
        }
        Insert: {
          chat_id: string
          confidence?: number | null
          consent_score?: number | null
          created_at?: string | null
          id?: string
          is_paused?: boolean | null
          message_count?: number | null
          pause_reason?: string | null
          reasoning?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          user_id1: string
          user_id2: string
        }
        Update: {
          chat_id?: string
          confidence?: number | null
          consent_score?: number | null
          created_at?: string | null
          id?: string
          is_paused?: boolean | null
          message_count?: number | null
          pause_reason?: string | null
          reasoning?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          user_id1?: string
          user_id2?: string
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
      couple_events: {
        Row: {
          couple_id: string
          created_at: string | null
          created_by: string | null
          current_participants: number | null
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
          current_participants?: number | null
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
          current_participants?: number | null
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
          couple_images: Json | null
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
          couple_images?: Json | null
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
          couple_images?: Json | null
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
          error_type: string | null
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
          error_type?: string | null
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
          error_type?: string | null
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
      event_participations: {
        Row: {
          cmpx_rewarded: number | null
          co2_saved: number | null
          created_at: string | null
          event_id: string
          id: string
          participated_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cmpx_rewarded?: number | null
          co2_saved?: number | null
          created_at?: string | null
          event_id: string
          id?: string
          participated_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cmpx_rewarded?: number | null
          co2_saved?: number | null
          created_at?: string | null
          event_id?: string
          id?: string
          participated_at?: string | null
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
          expires_at: string | null
          gallery_item_id: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          profile_id: string
          reason: string | null
          target_profile_id: string
          unlocked_at: string | null
          user_id: string | null
        }
        Insert: {
          expires_at?: string | null
          gallery_item_id?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          profile_id: string
          reason?: string | null
          target_profile_id: string
          unlocked_at?: string | null
          user_id?: string | null
        }
        Update: {
          expires_at?: string | null
          gallery_item_id?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          profile_id?: string
          reason?: string | null
          target_profile_id?: string
          unlocked_at?: string | null
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
          {
            foreignKeyName: "gallery_unlocks_target_profile_id_fkey"
            columns: ["target_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_unlocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      invitation_statistics: {
        Row: {
          created_at: string | null
          id: string
          total_accepted: number | null
          total_pending: number | null
          total_rejected: number | null
          total_sent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          total_accepted?: number | null
          total_pending?: number | null
          total_rejected?: number | null
          total_sent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          total_accepted?: number | null
          total_pending?: number | null
          total_rejected?: number | null
          total_sent?: number | null
          updated_at?: string | null
          user_id?: string
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
          message: string | null
          status: string | null
          to_profile: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          from_profile?: string | null
          id?: string
          message?: string | null
          status?: string | null
          to_profile?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          from_profile?: string | null
          id?: string
          message?: string | null
          status?: string | null
          to_profile?: string | null
          type?: string | null
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
      media: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_private: boolean | null
          is_public: boolean | null
          is_verified: boolean | null
          metadata: Json | null
          profile_id: string
          title: string | null
          type: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          is_public?: boolean | null
          is_verified?: boolean | null
          metadata?: Json | null
          profile_id: string
          title?: string | null
          type: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          is_public?: boolean | null
          is_verified?: boolean | null
          metadata?: Json | null
          profile_id?: string
          title?: string | null
          type?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_profile_id_fkey"
            columns: ["profile_id"]
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
      mfa_settings: {
        Row: {
          backup_codes: string[]
          created_at: string | null
          enabled: boolean
          id: string
          secret: string
          updated_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          backup_codes?: string[]
          created_at?: string | null
          enabled?: boolean
          id?: string
          secret: string
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          backup_codes?: string[]
          created_at?: string | null
          enabled?: boolean
          id?: string
          secret?: string
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
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
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          moderator_id: string
          reason: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          moderator_id: string
          reason?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
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
      nft_galleries: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          is_verified: boolean | null
          metadata: Json | null
          minted_at: string | null
          minted_with_gtk: number | null
          nft_contract_address: string | null
          nft_network: string | null
          nft_token_id: string | null
          profile_id: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_verified?: boolean | null
          metadata?: Json | null
          minted_at?: string | null
          minted_with_gtk?: number | null
          nft_contract_address?: string | null
          nft_network?: string | null
          nft_token_id?: string | null
          profile_id?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_verified?: boolean | null
          metadata?: Json | null
          minted_at?: string | null
          minted_with_gtk?: number | null
          nft_contract_address?: string | null
          nft_network?: string | null
          nft_token_id?: string | null
          profile_id?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nft_galleries_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      nft_gallery_images: {
        Row: {
          created_at: string | null
          gallery_id: string
          id: string
          image_hash: string | null
          image_url: string
          is_verified: boolean | null
          metadata: Json | null
          minted_at: string | null
          minted_with_gtk: number | null
          nft_contract_address: string | null
          nft_network: string | null
          nft_token_id: string | null
          sort_order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          gallery_id: string
          id?: string
          image_hash?: string | null
          image_url: string
          is_verified?: boolean | null
          metadata?: Json | null
          minted_at?: string | null
          minted_with_gtk?: number | null
          nft_contract_address?: string | null
          nft_network?: string | null
          nft_token_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          gallery_id?: string
          id?: string
          image_hash?: string | null
          image_url?: string
          is_verified?: boolean | null
          metadata?: Json | null
          minted_at?: string | null
          minted_with_gtk?: number | null
          nft_contract_address?: string | null
          nft_network?: string | null
          nft_token_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nft_gallery_images_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "nft_galleries"
            referencedColumns: ["id"]
          },
        ]
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
          ban_reason: string | null
          banned_at: string | null
          banned_by: string | null
          combined_hash: string
          created_at: string | null
          details: Json | null
          fingerprint_ids: string[] | null
          id: string
          lift_reason: string | null
          lifted_at: string | null
          lifted_by: string | null
          updated_at: string | null
          user_id: string | null
          worldid_nullifier_hash: string | null
        }
        Insert: {
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          combined_hash: string
          created_at?: string | null
          details?: Json | null
          fingerprint_ids?: string[] | null
          id?: string
          lift_reason?: string | null
          lifted_at?: string | null
          lifted_by?: string | null
          updated_at?: string | null
          user_id?: string | null
          worldid_nullifier_hash?: string | null
        }
        Update: {
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          combined_hash?: string
          created_at?: string | null
          details?: Json | null
          fingerprint_ids?: string[] | null
          id?: string
          lift_reason?: string | null
          lifted_at?: string | null
          lifted_by?: string | null
          updated_at?: string | null
          user_id?: string | null
          worldid_nullifier_hash?: string | null
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
          avatar_url: string | null
          bio: string | null
          blocked_at: string | null
          blocked_reason: string | null
          consent_status: string | null
          created_at: string | null
          display_name: string | null
          dispute_id: string | null
          email_verified_at: string | null
          first_name: string | null
          full_name: string | null
          gender: string | null
          id: string
          interests: string[] | null
          is_blocked: boolean | null
          is_demo: boolean
          is_online: boolean | null
          is_premium: boolean | null
          is_verified: boolean | null
          last_name: string | null
          latitude: number | null
          location: string | null
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
          avatar_url?: string | null
          bio?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          consent_status?: string | null
          created_at?: string | null
          display_name?: string | null
          dispute_id?: string | null
          email_verified_at?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_blocked?: boolean | null
          is_demo?: boolean
          is_online?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          last_name?: string | null
          latitude?: number | null
          location?: string | null
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
          avatar_url?: string | null
          bio?: string | null
          blocked_at?: string | null
          blocked_reason?: string | null
          consent_status?: string | null
          created_at?: string | null
          display_name?: string | null
          dispute_id?: string | null
          email_verified_at?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_blocked?: boolean | null
          is_demo?: boolean
          is_online?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          last_name?: string | null
          latitude?: number | null
          location?: string | null
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
          reporter_id: string | null
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
          reporter_id?: string | null
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
          reporter_id?: string | null
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
      security: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          risk_level: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          risk_level?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          risk_level?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          resource: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          resource?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          resource?: string | null
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
          resource: string | null
          risk_score: number | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource?: string | null
          risk_score?: number | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource?: string | null
          risk_score?: number | null
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
      security_logs: {
        Row: {
          created_at: string | null
          details: Json | null
          event_name: string
          event_type: string
          id: string
          ip_address: string | null
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_name: string
          event_type: string
          id?: string
          ip_address?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_name?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      summary_feedback: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          is_helpful: boolean
          rating: number | null
          summary_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          is_helpful: boolean
          rating?: number | null
          summary_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          is_helpful?: boolean
          rating?: number | null
          summary_id?: string
          user_id?: string
        }
        Relationships: []
      }
      summary_requests: {
        Row: {
          chat_id: string
          created_at: string | null
          id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          chat_id: string
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          chat_id?: string
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      swinger_interests: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          updated_at?: string | null
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
      token_analytics: {
        Row: {
          active_stakers: number
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
          total_staked_cmpx: number
          transaction_count: number
          transaction_volume_cmpx: number
          transaction_volume_gtk: number
          updated_at: string | null
        }
        Insert: {
          active_stakers: number
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
          total_staked_cmpx: number
          transaction_count: number
          transaction_volume_cmpx: number
          transaction_volume_gtk: number
          updated_at?: string | null
        }
        Update: {
          active_stakers?: number
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
          total_staked_cmpx?: number
          transaction_count?: number
          transaction_volume_cmpx?: number
          transaction_volume_gtk?: number
          updated_at?: string | null
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
      two_factor_auth: {
        Row: {
          backup_codes: string[]
          created_at: string | null
          id: string
          is_enabled: boolean
          method: string
          secret: string | null
          updated_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          backup_codes?: string[]
          created_at?: string | null
          id?: string
          is_enabled?: boolean
          method: string
          secret?: string | null
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          backup_codes?: string[]
          created_at?: string | null
          id?: string
          is_enabled?: boolean
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
      user_device_tokens: {
        Row: {
          app_version: string | null
          created_at: string | null
          device_model: string | null
          device_os: string | null
          device_token: string
          device_type: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string | null
          device_model?: string | null
          device_os?: string | null
          device_token: string
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          app_version?: string | null
          created_at?: string | null
          device_model?: string | null
          device_os?: string | null
          device_token?: string
          device_type?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          updated_at?: string | null
          user_id?: string
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
      user_suspensions: {
        Row: {
          created_at: string | null
          id: string
          lift_reason: string | null
          lifted_at: string | null
          lifted_by: string | null
          metadata: Json | null
          reason: string
          suspended_at: string | null
          suspended_by: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lift_reason?: string | null
          lifted_at?: string | null
          lifted_by?: string | null
          metadata?: Json | null
          reason: string
          suspended_at?: string | null
          suspended_by: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lift_reason?: string | null
          lifted_at?: string | null
          lifted_by?: string | null
          metadata?: Json | null
          reason?: string
          suspended_at?: string | null
          suspended_by?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_themes: {
        Row: {
          bg_url: string | null
          created_at: string | null
          id: string
          primary_color: string | null
          secondary_color: string | null
          text_color: string | null
          theme_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bg_url?: string | null
          created_at?: string | null
          id?: string
          primary_color?: string | null
          secondary_color?: string | null
          text_color?: string | null
          theme_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bg_url?: string | null
          created_at?: string | null
          id?: string
          primary_color?: string | null
          secondary_color?: string | null
          text_color?: string | null
          theme_name?: string | null
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
      worldid_rewards: {
        Row: {
          claimed_at: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_claimed: boolean | null
          metadata: Json | null
          reward_type: string
          reward_value: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_claimed?: boolean | null
          metadata?: Json | null
          reward_type: string
          reward_value: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_claimed?: boolean | null
          metadata?: Json | null
          reward_type?: string
          reward_value?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worldid_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worldid_statistics: {
        Row: {
          failed_verifications: number | null
          id: string
          last_verification_at: string | null
          metadata: Json | null
          successful_verifications: number | null
          total_verifications: number | null
          user_id: string
          verification_level: number
          verified_at: string | null
        }
        Insert: {
          failed_verifications?: number | null
          id?: string
          last_verification_at?: string | null
          metadata?: Json | null
          successful_verifications?: number | null
          total_verifications?: number | null
          user_id: string
          verification_level?: number
          verified_at?: string | null
        }
        Update: {
          failed_verifications?: number | null
          id?: string
          last_verification_at?: string | null
          metadata?: Json | null
          successful_verifications?: number | null
          total_verifications?: number | null
          user_id?: string
          verification_level?: number
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "worldid_statistics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worldid_verifications: {
        Row: {
          created_at: string | null
          id: string
          nullifier_hash: string | null
          status: string | null
          updated_at: string | null
          user_id: string
          verification_level: string | null
          verified_at: string | null
          world_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nullifier_hash?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          verification_level?: string | null
          verified_at?: string | null
          world_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nullifier_hash?: string | null
          status?: string | null
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
      is_demo_user: { Args: never; Returns: boolean }
      record_gallery_commission: {
        Args: {
          p_amount_cmpx: number
          p_commission_percentage?: number
          p_creator_id: string
          p_gallery_id: string
          p_transaction_type: string
        }
        Returns: string
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

