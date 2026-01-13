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
      admin_users: {
        Row: {
          created_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_users_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
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
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "blockchain_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      club_applications: {
        Row: {
          address: string
          capacity: number
          city: string
          club_name: string
          club_type: string
          company_rfc: string | null
          created_at: string
          description: string
          documents_url: string
          email: string
          hours: string
          id: string
          license: string | null
          notes: string | null
          owner_age: number
          owner_gender: string
          owner_name: string
          owner_rfc: string
          phone: string
          rejection_reason: string | null
          rep_email: string | null
          rep_name: string | null
          rep_phone: string | null
          rep_position: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          state: string
          status: string
          updated_at: string
          use_app_as_website: boolean | null
          website: string | null
          whatsapp: string | null
          zip_code: string
        }
        Insert: {
          address: string
          capacity: number
          city: string
          club_name: string
          club_type: string
          company_rfc?: string | null
          created_at?: string
          description: string
          documents_url: string
          email: string
          hours: string
          id?: string
          license?: string | null
          notes?: string | null
          owner_age: number
          owner_gender: string
          owner_name: string
          owner_rfc: string
          phone: string
          rejection_reason?: string | null
          rep_email?: string | null
          rep_name?: string | null
          rep_phone?: string | null
          rep_position?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state: string
          status?: string
          updated_at?: string
          use_app_as_website?: boolean | null
          website?: string | null
          whatsapp?: string | null
          zip_code: string
        }
        Update: {
          address?: string
          capacity?: number
          city?: string
          club_name?: string
          club_type?: string
          company_rfc?: string | null
          created_at?: string
          description?: string
          documents_url?: string
          email?: string
          hours?: string
          id?: string
          license?: string | null
          notes?: string | null
          owner_age?: number
          owner_gender?: string
          owner_name?: string
          owner_rfc?: string
          phone?: string
          rejection_reason?: string | null
          rep_email?: string | null
          rep_name?: string | null
          rep_phone?: string | null
          rep_position?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string
          status?: string
          updated_at?: string
          use_app_as_website?: boolean | null
          website?: string | null
          whatsapp?: string | null
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_safe"
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
        Relationships: [
          {
            foreignKeyName: "clubs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clubs_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "cmpx_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
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
            foreignKeyName: "couple_agreements_partner_1_id_fkey"
            columns: ["partner_1_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_agreements_partner_2_id_fkey"
            columns: ["partner_2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_agreements_partner_2_id_fkey"
            columns: ["partner_2_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
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
          {
            foreignKeyName: "couple_disputes_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
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
          last_active: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          looking_for: string | null
          max_distance: number | null
          partner_1_id: string | null
          partner_2_id: string | null
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
          last_active?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          looking_for?: string | null
          max_distance?: number | null
          partner_1_id?: string | null
          partner_2_id?: string | null
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
          last_active?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          looking_for?: string | null
          max_distance?: number | null
          partner_1_id?: string | null
          partner_2_id?: string | null
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
            foreignKeyName: "couple_profiles_partner_1_id_fkey"
            columns: ["partner_1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_profiles_partner_1_id_fkey"
            columns: ["partner_1_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_profiles_partner_2_id_fkey"
            columns: ["partner_2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_profiles_partner_2_id_fkey"
            columns: ["partner_2_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couple_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_token_claims: {
        Row: {
          amount_claimed: number
          claim_date: string
          id: string
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
          token_type?: string | null
          transaction_hash?: string | null
          updated_at?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_token_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "frozen_assets_original_owner_id_fkey"
            columns: ["original_owner_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
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
        Relationships: [
          {
            foreignKeyName: "investments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
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
        Relationships: [
          {
            foreignKeyName: "moderator_payments_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "moderators_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
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
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          is_demo: boolean
          is_premium: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_demo?: boolean
          is_premium?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_demo?: boolean
          is_premium?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string | null
          id: string
          ip_address: string | null
          is_blocked: boolean | null
          request_count: number | null
          updated_at: string | null
          user_id: string | null
          window_end: string | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint?: string | null
          id?: string
          ip_address?: string | null
          is_blocked?: boolean | null
          request_count?: number | null
          updated_at?: string | null
          user_id?: string | null
          window_end?: string | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string | null
          id?: string
          ip_address?: string | null
          is_blocked?: boolean | null
          request_count?: number | null
          updated_at?: string | null
          user_id?: string | null
          window_end?: string | null
          window_start?: string | null
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
        Relationships: [
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_user_id_fkey"
            columns: ["reporter_user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string | null
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          resource: string | null
          severity: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource?: string | null
          severity?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource?: string | null
          severity?: string | null
          user_id?: string | null
        }
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "security_audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
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
          {
            foreignKeyName: "story_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
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
            foreignKeyName: "story_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "story_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
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
        Relationships: [
          {
            foreignKeyName: "testnet_token_claims_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "user_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      user_nfts: {
        Row: {
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
        Relationships: [
          {
            foreignKeyName: "user_roles_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wallets: {
        Row: {
          address: string
          created_at: string | null
          encrypted_private_key: string
          id: string
          network: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string | null
          encrypted_private_key: string
          id?: string
          network?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string | null
          encrypted_private_key?: string
          id?: string
          network?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "virtual_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_safe: {
        Row: {
          created_at: string | null
          id: string | null
          is_demo: boolean | null
          is_premium: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          is_demo?: boolean | null
          is_premium?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          is_demo?: boolean | null
          is_premium?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      users_safe: {
        Row: {
          created_at: string | null
          email_confirmed_at: string | null
          id: string | null
          last_sign_in_at: string | null
          raw_app_meta_data: Json | null
          raw_user_meta_data: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_confirmed_at?: string | null
          id?: string | null
          last_sign_in_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_confirmed_at?: string | null
          id?: string | null
          last_sign_in_at?: string | null
          raw_app_meta_data?: Json | null
          raw_user_meta_data?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      block_ip: {
        Args: { p_ip_address: string; p_reason: string }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_ip_address: string
          p_max_requests?: number
          p_user_id: string
        }
        Returns: {
          allowed: boolean
          remaining_requests: number
          reset_at: string
        }[]
      }
      detect_suspicious_activity: {
        Args: { p_user_id: string }
        Returns: {
          is_suspicious: boolean
          reason: string
          severity: string
        }[]
      }
      escape_html: { Args: { text: string }; Returns: string }
      has_access_to_sensitive_data: {
        Args: { p_data_type: string; p_target_user_id: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_or_moderator: { Args: never; Returns: boolean }
      is_ip_blocked: { Args: { p_ip_address: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_valid_email: { Args: { email: string }; Returns: boolean }
      is_valid_uuid: { Args: { uuid: string }; Returns: boolean }
      log_security_event: {
        Args: {
          p_action: string
          p_details: Json
          p_ip_address: string
          p_resource: string
          p_severity?: string
          p_user_id: string
        }
        Returns: string
      }
      mask_email: { Args: { email: string }; Returns: string }
      mask_sensitive_data: {
        Args: { data: string; data_type: string }
        Returns: string
      }
      sanitize_input: { Args: { input_text: string }; Returns: string }
      sanitize_user_content: { Args: { content: string }; Returns: string }
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

