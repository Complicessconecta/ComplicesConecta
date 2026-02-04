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
          created_at: string
          id: string
          is_active: boolean
          permissions: Json | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          permissions?: Json | null
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          permissions?: Json | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      club_applications: {
        Row: {
          additional_info: Json | null
          application_type: string
          approved_at: string | null
          club_id: string | null
          communication_history: Json | null
          created_at: string
          documents: Json | null
          expires_at: string | null
          id: string
          priority: string | null
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          additional_info?: Json | null
          application_type: string
          approved_at?: string | null
          club_id?: string | null
          communication_history?: Json | null
          created_at?: string
          documents?: Json | null
          expires_at?: string | null
          id?: string
          priority?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          additional_info?: Json | null
          application_type?: string
          approved_at?: string | null
          club_id?: string | null
          communication_history?: Json | null
          created_at?: string
          documents?: Json | null
          expires_at?: string | null
          id?: string
          priority?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_applications_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_check_ins: {
        Row: {
          area: string | null
          check_in_time: string
          check_out_time: string | null
          club_id: string | null
          companions: Json | null
          created_at: string
          duration_minutes: number | null
          id: string
          is_verified: boolean | null
          issues_reported: Json | null
          notes: string | null
          payment_method: string | null
          photos: Json | null
          purpose: string | null
          rating: number | null
          review: string | null
          spent_amount: number | null
          staff_interactions: Json | null
          table_number: string | null
          tags: Json | null
          updated_at: string
          user_id: string | null
          verified_by: string | null
        }
        Insert: {
          area?: string | null
          check_in_time?: string
          check_out_time?: string | null
          club_id?: string | null
          companions?: Json | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_verified?: boolean | null
          issues_reported?: Json | null
          notes?: string | null
          payment_method?: string | null
          photos?: Json | null
          purpose?: string | null
          rating?: number | null
          review?: string | null
          spent_amount?: number | null
          staff_interactions?: Json | null
          table_number?: string | null
          tags?: Json | null
          updated_at?: string
          user_id?: string | null
          verified_by?: string | null
        }
        Update: {
          area?: string | null
          check_in_time?: string
          check_out_time?: string | null
          club_id?: string | null
          companions?: Json | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_verified?: boolean | null
          issues_reported?: Json | null
          notes?: string | null
          payment_method?: string | null
          photos?: Json | null
          purpose?: string | null
          rating?: number | null
          review?: string | null
          spent_amount?: number | null
          staff_interactions?: Json | null
          table_number?: string | null
          tags?: Json | null
          updated_at?: string
          user_id?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_check_ins_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_discounts: {
        Row: {
          applicable_items: Json | null
          club_id: string | null
          conditions: string | null
          created_at: string
          current_usage: number | null
          description: string | null
          discount_type: string
          discount_value: number
          exclusions: Json | null
          id: string
          is_active: boolean | null
          max_discount: number | null
          member_only: boolean | null
          min_amount: number | null
          promo_code: string | null
          title: string
          updated_at: string
          usage_limit: number | null
          user_limit: number | null
          valid_from: string
          valid_until: string | null
          verification_required: boolean | null
        }
        Insert: {
          applicable_items?: Json | null
          club_id?: string | null
          conditions?: string | null
          created_at?: string
          current_usage?: number | null
          description?: string | null
          discount_type: string
          discount_value: number
          exclusions?: Json | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          member_only?: boolean | null
          min_amount?: number | null
          promo_code?: string | null
          title: string
          updated_at?: string
          usage_limit?: number | null
          user_limit?: number | null
          valid_from: string
          valid_until?: string | null
          verification_required?: boolean | null
        }
        Update: {
          applicable_items?: Json | null
          club_id?: string | null
          conditions?: string | null
          created_at?: string
          current_usage?: number | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          exclusions?: Json | null
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          member_only?: boolean | null
          min_amount?: number | null
          promo_code?: string | null
          title?: string
          updated_at?: string
          usage_limit?: number | null
          user_limit?: number | null
          valid_from?: string
          valid_until?: string | null
          verification_required?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "club_discounts_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_events: {
        Row: {
          age_restriction: number | null
          cancellation_reason: string | null
          club_id: string | null
          created_at: string
          created_by: string | null
          current_attendees: number | null
          description: string | null
          dress_code: string | null
          end_time: string
          event_type: string
          id: string
          images: Json | null
          is_active: boolean | null
          is_cancelled: boolean | null
          is_recurring: boolean | null
          max_capacity: number | null
          performers: Json | null
          promotions: Json | null
          recurrence_pattern: Json | null
          social_media_tags: Json | null
          special_guests: Json | null
          start_time: string
          ticket_price: number | null
          ticket_url: string | null
          title: string
          updated_at: string
          videos: Json | null
        }
        Insert: {
          age_restriction?: number | null
          cancellation_reason?: string | null
          club_id?: string | null
          created_at?: string
          created_by?: string | null
          current_attendees?: number | null
          description?: string | null
          dress_code?: string | null
          end_time: string
          event_type: string
          id?: string
          images?: Json | null
          is_active?: boolean | null
          is_cancelled?: boolean | null
          is_recurring?: boolean | null
          max_capacity?: number | null
          performers?: Json | null
          promotions?: Json | null
          recurrence_pattern?: Json | null
          social_media_tags?: Json | null
          special_guests?: Json | null
          start_time: string
          ticket_price?: number | null
          ticket_url?: string | null
          title: string
          updated_at?: string
          videos?: Json | null
        }
        Update: {
          age_restriction?: number | null
          cancellation_reason?: string | null
          club_id?: string | null
          created_at?: string
          created_by?: string | null
          current_attendees?: number | null
          description?: string | null
          dress_code?: string | null
          end_time?: string
          event_type?: string
          id?: string
          images?: Json | null
          is_active?: boolean | null
          is_cancelled?: boolean | null
          is_recurring?: boolean | null
          max_capacity?: number | null
          performers?: Json | null
          promotions?: Json | null
          recurrence_pattern?: Json | null
          social_media_tags?: Json | null
          special_guests?: Json | null
          start_time?: string
          ticket_price?: number | null
          ticket_url?: string | null
          title?: string
          updated_at?: string
          videos?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "club_events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_followers: {
        Row: {
          auto_renew: boolean | null
          benefits: Json | null
          club_id: string | null
          created_at: string
          expires_at: string | null
          follow_type: string
          followed_at: string
          id: string
          interaction_count: number | null
          last_interaction: string | null
          membership_level: string | null
          notification_preferences: Json | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          benefits?: Json | null
          club_id?: string | null
          created_at?: string
          expires_at?: string | null
          follow_type?: string
          followed_at?: string
          id?: string
          interaction_count?: number | null
          last_interaction?: string | null
          membership_level?: string | null
          notification_preferences?: Json | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          benefits?: Json | null
          club_id?: string | null
          created_at?: string
          expires_at?: string | null
          follow_type?: string
          followed_at?: string
          id?: string
          interaction_count?: number | null
          last_interaction?: string | null
          membership_level?: string | null
          notification_preferences?: Json | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_followers_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_nfts: {
        Row: {
          animation_url: string | null
          attributes: Json | null
          blockchain: string
          burn_date: string | null
          club_id: string | null
          contract_address: string
          created_at: string
          creator_royalty: number | null
          current_owner: string | null
          description: string | null
          edition_number: number | null
          external_url: string | null
          id: string
          image_url: string | null
          is_burned: boolean | null
          is_transferable: boolean | null
          last_transfer_date: string | null
          metadata: Json | null
          mint_currency: string | null
          mint_date: string | null
          mint_price: number | null
          name: string
          rarity: string | null
          token_id: string
          token_standard: string
          total_editions: number | null
          transfer_count: number | null
          updated_at: string
        }
        Insert: {
          animation_url?: string | null
          attributes?: Json | null
          blockchain?: string
          burn_date?: string | null
          club_id?: string | null
          contract_address: string
          created_at?: string
          creator_royalty?: number | null
          current_owner?: string | null
          description?: string | null
          edition_number?: number | null
          external_url?: string | null
          id?: string
          image_url?: string | null
          is_burned?: boolean | null
          is_transferable?: boolean | null
          last_transfer_date?: string | null
          metadata?: Json | null
          mint_currency?: string | null
          mint_date?: string | null
          mint_price?: number | null
          name: string
          rarity?: string | null
          token_id: string
          token_standard: string
          total_editions?: number | null
          transfer_count?: number | null
          updated_at?: string
        }
        Update: {
          animation_url?: string | null
          attributes?: Json | null
          blockchain?: string
          burn_date?: string | null
          club_id?: string | null
          contract_address?: string
          created_at?: string
          creator_royalty?: number | null
          current_owner?: string | null
          description?: string | null
          edition_number?: number | null
          external_url?: string | null
          id?: string
          image_url?: string | null
          is_burned?: boolean | null
          is_transferable?: boolean | null
          last_transfer_date?: string | null
          metadata?: Json | null
          mint_currency?: string | null
          mint_date?: string | null
          mint_price?: number | null
          name?: string
          rarity?: string | null
          token_id?: string
          token_standard?: string
          total_editions?: number | null
          transfer_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_nfts_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_reviews: {
        Row: {
          atmosphere_rating: number | null
          check_in_id: string | null
          cleanliness_rating: number | null
          club_id: string | null
          created_at: string
          crowd_rating: number | null
          flags: Json | null
          group_type: string | null
          helpful_count: number | null
          id: string
          is_featured: boolean | null
          is_verified: boolean | null
          moderation_status: string | null
          music_rating: number | null
          occasion: string | null
          photos: Json | null
          price_range: string | null
          rating: number
          response_date: string | null
          response_from_club: string | null
          return_probability: number | null
          review: string
          safety_rating: number | null
          service_rating: number | null
          staff_rating: number | null
          title: string | null
          updated_at: string
          user_id: string | null
          value_rating: number | null
          videos: Json | null
          visit_date: string | null
          visit_frequency: string | null
          would_recommend: boolean | null
        }
        Insert: {
          atmosphere_rating?: number | null
          check_in_id?: string | null
          cleanliness_rating?: number | null
          club_id?: string | null
          created_at?: string
          crowd_rating?: number | null
          flags?: Json | null
          group_type?: string | null
          helpful_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          moderation_status?: string | null
          music_rating?: number | null
          occasion?: string | null
          photos?: Json | null
          price_range?: string | null
          rating: number
          response_date?: string | null
          response_from_club?: string | null
          return_probability?: number | null
          review: string
          safety_rating?: number | null
          service_rating?: number | null
          staff_rating?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
          value_rating?: number | null
          videos?: Json | null
          visit_date?: string | null
          visit_frequency?: string | null
          would_recommend?: boolean | null
        }
        Update: {
          atmosphere_rating?: number | null
          check_in_id?: string | null
          cleanliness_rating?: number | null
          club_id?: string | null
          created_at?: string
          crowd_rating?: number | null
          flags?: Json | null
          group_type?: string | null
          helpful_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_verified?: boolean | null
          moderation_status?: string | null
          music_rating?: number | null
          occasion?: string | null
          photos?: Json | null
          price_range?: string | null
          rating?: number
          response_date?: string | null
          response_from_club?: string | null
          return_probability?: number | null
          review?: string
          safety_rating?: number | null
          service_rating?: number | null
          staff_rating?: number | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
          value_rating?: number | null
          videos?: Json | null
          visit_date?: string | null
          visit_frequency?: string | null
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "club_reviews_check_in_id_fkey"
            columns: ["check_in_id"]
            isOneToOne: false
            referencedRelation: "club_check_ins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_reviews_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          accessibility_features: Json | null
          address: string
          age_restriction: number | null
          average_rating: number | null
          bottle_service: boolean | null
          business_license: string | null
          capacity: number | null
          category: string
          check_in_count: number | null
          check_in_radius_meters: number | null
          city: string
          country: string | null
          cover_image_url: string | null
          created_at: string
          dance_floor: boolean | null
          description: string
          dj_booth: boolean | null
          dress_code: string | null
          email: string | null
          facebook_url: string | null
          features: Json | null
          fire_safety_compliance: boolean | null
          health_department_rating: string | null
          hookah_available: boolean | null
          id: string
          indoor_seating: boolean | null
          inspection_score: number | null
          instagram_url: string | null
          insurance_info: Json | null
          is_active: boolean
          is_verified: boolean
          last_inspection_date: string | null
          latitude: number | null
          live_music: boolean | null
          logo_url: string | null
          longitude: number | null
          member_count: number | null
          membership_tier: string
          music_genre: Json | null
          name: string
          noise_compliance: boolean | null
          opening_hours: Json | null
          operating_status: string | null
          outdoor_seating: boolean | null
          owner_id: string | null
          parking_available: boolean | null
          payment_methods: Json | null
          permit_number: string | null
          phone: string | null
          pricing: Json | null
          rejection_reason: string | null
          reservations_required: boolean | null
          security_features: Json | null
          slug: string
          smoking_allowed: boolean | null
          special_events: boolean | null
          state: string
          suspended_at: string | null
          suspension_reason: string | null
          tags: Json | null
          twitter_url: string | null
          updated_at: string
          valet_parking: boolean | null
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
          vip_areas: boolean | null
          website: string | null
        }
        Insert: {
          accessibility_features?: Json | null
          address: string
          age_restriction?: number | null
          average_rating?: number | null
          bottle_service?: boolean | null
          business_license?: string | null
          capacity?: number | null
          category?: string
          check_in_count?: number | null
          check_in_radius_meters?: number | null
          city: string
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          dance_floor?: boolean | null
          description: string
          dj_booth?: boolean | null
          dress_code?: string | null
          email?: string | null
          facebook_url?: string | null
          features?: Json | null
          fire_safety_compliance?: boolean | null
          health_department_rating?: string | null
          hookah_available?: boolean | null
          id?: string
          indoor_seating?: boolean | null
          inspection_score?: number | null
          instagram_url?: string | null
          insurance_info?: Json | null
          is_active?: boolean
          is_verified?: boolean
          last_inspection_date?: string | null
          latitude?: number | null
          live_music?: boolean | null
          logo_url?: string | null
          longitude?: number | null
          member_count?: number | null
          membership_tier?: string
          music_genre?: Json | null
          name: string
          noise_compliance?: boolean | null
          opening_hours?: Json | null
          operating_status?: string | null
          outdoor_seating?: boolean | null
          owner_id?: string | null
          parking_available?: boolean | null
          payment_methods?: Json | null
          permit_number?: string | null
          phone?: string | null
          pricing?: Json | null
          rejection_reason?: string | null
          reservations_required?: boolean | null
          security_features?: Json | null
          slug: string
          smoking_allowed?: boolean | null
          special_events?: boolean | null
          state: string
          suspended_at?: string | null
          suspension_reason?: string | null
          tags?: Json | null
          twitter_url?: string | null
          updated_at?: string
          valet_parking?: boolean | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          vip_areas?: boolean | null
          website?: string | null
        }
        Update: {
          accessibility_features?: Json | null
          address?: string
          age_restriction?: number | null
          average_rating?: number | null
          bottle_service?: boolean | null
          business_license?: string | null
          capacity?: number | null
          category?: string
          check_in_count?: number | null
          check_in_radius_meters?: number | null
          city?: string
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          dance_floor?: boolean | null
          description?: string
          dj_booth?: boolean | null
          dress_code?: string | null
          email?: string | null
          facebook_url?: string | null
          features?: Json | null
          fire_safety_compliance?: boolean | null
          health_department_rating?: string | null
          hookah_available?: boolean | null
          id?: string
          indoor_seating?: boolean | null
          inspection_score?: number | null
          instagram_url?: string | null
          insurance_info?: Json | null
          is_active?: boolean
          is_verified?: boolean
          last_inspection_date?: string | null
          latitude?: number | null
          live_music?: boolean | null
          logo_url?: string | null
          longitude?: number | null
          member_count?: number | null
          membership_tier?: string
          music_genre?: Json | null
          name?: string
          noise_compliance?: boolean | null
          opening_hours?: Json | null
          operating_status?: string | null
          outdoor_seating?: boolean | null
          owner_id?: string | null
          parking_available?: boolean | null
          payment_methods?: Json | null
          permit_number?: string | null
          phone?: string | null
          pricing?: Json | null
          rejection_reason?: string | null
          reservations_required?: boolean | null
          security_features?: Json | null
          slug?: string
          smoking_allowed?: boolean | null
          special_events?: boolean | null
          state?: string
          suspended_at?: string | null
          suspension_reason?: string | null
          tags?: Json | null
          twitter_url?: string | null
          updated_at?: string
          valet_parking?: boolean | null
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
          vip_areas?: boolean | null
          website?: string | null
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
          created_at: string | null
          id: string
          is_demo: boolean
          partner_1_id: string | null
          partner_2_id: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_demo?: boolean
          partner_1_id?: string | null
          partner_2_id?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_demo?: boolean
          partner_1_id?: string | null
          partner_2_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
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
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          is_demo: boolean
          reset_token_hash: string | null
          token_expiry: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_demo?: boolean
          reset_token_hash?: string | null
          token_expiry?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_demo?: boolean
          reset_token_hash?: string | null
          token_expiry?: string | null
          updated_at?: string | null
          user_id?: string
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin_or_moderator: { Args: never; Returns: boolean }
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

