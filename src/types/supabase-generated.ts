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
      app_logs: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          level: string
          message: string
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          level: string
          message: string
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          level?: string
          message?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      app_metrics: {
        Row: {
          created_at: string
          id: string
          metric_name: string
          metric_type: string
          metric_value: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metric_name: string
          metric_type: string
          metric_value: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metric_name?: string
          metric_type?: string
          metric_value?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
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
      career_applications: {
        Row: {
          cover_letter: string | null
          id: string
          position: string
          resume_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          user_id: string | null
        }
        Insert: {
          cover_letter?: string | null
          id?: string
          position: string
          resume_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          user_id?: string | null
        }
        Update: {
          cover_letter?: string | null
          id?: string
          position?: string
          resume_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "career_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_summaries: {
        Row: {
          chat_id: string
          completed_at: string | null
          content: string
          created_at: string
          id: string
          message_count: number | null
          method: string | null
          sentiment: string | null
          status: string
          summary: string | null
          topics: Json | null
          user_id: string | null
        }
        Insert: {
          chat_id: string
          completed_at?: string | null
          content: string
          created_at?: string
          id?: string
          message_count?: number | null
          method?: string | null
          sentiment?: string | null
          status?: string
          summary?: string | null
          topics?: Json | null
          user_id?: string | null
        }
        Update: {
          chat_id?: string
          completed_at?: string | null
          content?: string
          created_at?: string
          id?: string
          message_count?: number | null
          method?: string | null
          sentiment?: string | null
          status?: string
          summary?: string | null
          topics?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_summaries_user_id_fkey"
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
      club_flyers: {
        Row: {
          ai_processing_status: string | null
          blur_applied: boolean | null
          club_id: string
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string | null
          event_end_date: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean | null
          title: string
          watermark_applied: boolean | null
        }
        Insert: {
          ai_processing_status?: string | null
          blur_applied?: boolean | null
          club_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string | null
          event_end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean | null
          title: string
          watermark_applied?: boolean | null
        }
        Update: {
          ai_processing_status?: string | null
          blur_applied?: boolean | null
          club_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string | null
          event_end_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean | null
          title?: string
          watermark_applied?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "club_flyers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users_safe"
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
          status: string
          submitted_at: string
          user_id: string | null
          verification_type: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          club_id: string
          created_at?: string
          documents?: Json | null
          id?: string
          notes?: string | null
          status?: string
          submitted_at?: string
          user_id?: string | null
          verification_type?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          club_id?: string
          created_at?: string
          documents?: Json | null
          id?: string
          notes?: string | null
          status?: string
          submitted_at?: string
          user_id?: string | null
          verification_type?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_verifications_verified_by_fkey"
            columns: ["verified_by"]
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
      consent_verifications: {
        Row: {
          chat_id: string | null
          confidence: number | null
          consent_level: string | null
          consent_score: number | null
          consent_type: string
          created_at: string
          explanation: string | null
          id: string
          is_granted: boolean
          is_paused: boolean
          message_count: number | null
          pause_reason: string | null
          reasoning: string | null
          recipient_id: string | null
          status: string | null
          suggested_action: string | null
          updated_at: string
          user_id: string | null
          user_id1: string | null
          user_id2: string | null
        }
        Insert: {
          chat_id?: string | null
          confidence?: number | null
          consent_level?: string | null
          consent_score?: number | null
          consent_type: string
          created_at?: string
          explanation?: string | null
          id?: string
          is_granted?: boolean
          is_paused?: boolean
          message_count?: number | null
          pause_reason?: string | null
          reasoning?: string | null
          recipient_id?: string | null
          status?: string | null
          suggested_action?: string | null
          updated_at?: string
          user_id?: string | null
          user_id1?: string | null
          user_id2?: string | null
        }
        Update: {
          chat_id?: string | null
          confidence?: number | null
          consent_level?: string | null
          consent_score?: number | null
          consent_type?: string
          created_at?: string
          explanation?: string | null
          id?: string
          is_granted?: boolean
          is_paused?: boolean
          message_count?: number | null
          pause_reason?: string | null
          reasoning?: string | null
          recipient_id?: string | null
          status?: string | null
          suggested_action?: string | null
          updated_at?: string
          user_id?: string | null
          user_id1?: string | null
          user_id2?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_verifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_verifications_user_id1_fkey"
            columns: ["user_id1"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_verifications_user_id2_fkey"
            columns: ["user_id2"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
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
      couple_events: {
        Row: {
          couple_id: string | null
          created_at: string
          current_participants: number
          date: string
          description: string | null
          event_type: string
          id: string
          location: string | null
          max_participants: number | null
          title: string
          updated_at: string
        }
        Insert: {
          couple_id?: string | null
          created_at?: string
          current_participants?: number
          date: string
          description?: string | null
          event_type: string
          id?: string
          location?: string | null
          max_participants?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          couple_id?: string | null
          created_at?: string
          current_participants?: number
          date?: string
          description?: string | null
          event_type?: string
          id?: string
          location?: string | null
          max_participants?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
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
          age: number | null
          age_range_max: number | null
          age_range_min: number | null
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
          event_types: string[] | null
          experience_level: string | null
          id: string
          interested_in: string | null
          is_demo: boolean
          is_public: boolean | null
          is_verified: boolean
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
          age?: number | null
          age_range_max?: number | null
          age_range_min?: number | null
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
          event_types?: string[] | null
          experience_level?: string | null
          id?: string
          interested_in?: string | null
          is_demo?: boolean
          is_public?: boolean | null
          is_verified?: boolean
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
          age?: number | null
          age_range_max?: number | null
          age_range_min?: number | null
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
          event_types?: string[] | null
          experience_level?: string | null
          id?: string
          interested_in?: string | null
          is_demo?: boolean
          is_public?: boolean | null
          is_verified?: boolean
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
      digital_fingerprints: {
        Row: {
          browser_fingerprint: string | null
          canvas_data: string | null
          canvas_hash: string | null
          combined_hash: string | null
          created_at: string
          device_info: Json | null
          fingerprint_hash: string
          id: string
          ip_address: string | null
          is_banned: boolean
          last_seen_at: string | null
          user_id: string | null
          worldid_nullifier_hash: string | null
        }
        Insert: {
          browser_fingerprint?: string | null
          canvas_data?: string | null
          canvas_hash?: string | null
          combined_hash?: string | null
          created_at?: string
          device_info?: Json | null
          fingerprint_hash: string
          id?: string
          ip_address?: string | null
          is_banned?: boolean
          last_seen_at?: string | null
          user_id?: string | null
          worldid_nullifier_hash?: string | null
        }
        Update: {
          browser_fingerprint?: string | null
          canvas_data?: string | null
          canvas_hash?: string | null
          combined_hash?: string | null
          created_at?: string
          device_info?: Json | null
          fingerprint_hash?: string
          id?: string
          ip_address?: string | null
          is_banned?: boolean
          last_seen_at?: string | null
          user_id?: string | null
          worldid_nullifier_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_fingerprints_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      error_alerts: {
        Row: {
          created_at: string
          error_message: string
          error_type: string
          id: string
          resolved: boolean
          severity: string
          stack_trace: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message: string
          error_type: string
          id?: string
          resolved?: boolean
          severity?: string
          stack_trace?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string
          error_type?: string
          id?: string
          resolved?: boolean
          severity?: string
          stack_trace?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      event_participations: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_participations_user_id_fkey"
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
      gallery_commissions: {
        Row: {
          amount_cmpx: number
          commission_amount_cmpx: number
          created_at: string
          creator_amount_cmpx: number
          creator_id: string
          creator_paid: boolean
          gallery_id: string
          id: string
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount_cmpx: number
          commission_amount_cmpx: number
          created_at?: string
          creator_amount_cmpx: number
          creator_id: string
          creator_paid?: boolean
          gallery_id: string
          id?: string
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount_cmpx?: number
          commission_amount_cmpx?: number
          created_at?: string
          creator_amount_cmpx?: number
          creator_id?: string
          creator_paid?: boolean
          gallery_id?: string
          id?: string
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_commissions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
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
          {
            foreignKeyName: "gallery_unlocks_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_unlocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
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
      invitation_statistics: {
        Row: {
          acceptance_rate: number | null
          accepted_invitations: number
          created_at: string
          declined_invitations: number
          expired_invitations: number
          id: string
          pending_invitations: number
          period_end: string
          period_start: string
          total_invitations: number
          updated_at: string
          user_id: string
        }
        Insert: {
          acceptance_rate?: number | null
          accepted_invitations?: number
          created_at?: string
          declined_invitations?: number
          expired_invitations?: number
          id?: string
          pending_invitations?: number
          period_end: string
          period_start: string
          total_invitations?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          acceptance_rate?: number | null
          accepted_invitations?: number
          created_at?: string
          declined_invitations?: number
          expired_invitations?: number
          id?: string
          pending_invitations?: number
          period_end?: string
          period_start?: string
          total_invitations?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_statistics_user_id_fkey"
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
          message: string | null
          status: string
          to_profile: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          from_profile?: string | null
          id?: string
          message?: string | null
          status?: string
          to_profile?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          from_profile?: string | null
          id?: string
          message?: string | null
          status?: string
          to_profile?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      matches: {
        Row: {
          created_at: string
          id: string
          match_score: number
          status: string
          updated_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_score?: number
          status?: string
          updated_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_score?: number
          status?: string
          updated_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          caption: string | null
          created_at: string
          file_name: string | null
          file_path: string | null
          file_type: string | null
          file_url: string | null
          id: string
          is_public: boolean | null
          mime_type: string | null
          profile_id: string | null
          type: string
          updated_at: string
          url: string
          user_id: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_public?: boolean | null
          mime_type?: string | null
          profile_id?: string | null
          type: string
          updated_at?: string
          url: string
          user_id?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_public?: boolean | null
          mime_type?: string | null
          profile_id?: string | null
          type?: string
          updated_at?: string
          url?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "media_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "media_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          receiver_id: string | null
          room_id: string | null
          sender_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          receiver_id?: string | null
          room_id?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          receiver_id?: string | null
          room_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          moderator_id: string | null
          reason: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          moderator_id?: string | null
          reason?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          moderator_id?: string | null
          reason?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderation_logs_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
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
      moderator_requests: {
        Row: {
          id: string
          reason: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          id?: string
          reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          reason?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderator_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moderator_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      moderator_sessions: {
        Row: {
          actions_taken: number
          created_at: string
          id: string
          is_active: boolean
          moderator_id: string
          reports_reviewed: number
          session_end: string | null
          session_start: string
          total_minutes: number
          updated_at: string
        }
        Insert: {
          actions_taken?: number
          created_at?: string
          id?: string
          is_active?: boolean
          moderator_id: string
          reports_reviewed?: number
          session_end?: string | null
          session_start?: string
          total_minutes?: number
          updated_at?: string
        }
        Update: {
          actions_taken?: number
          created_at?: string
          id?: string
          is_active?: boolean
          moderator_id?: string
          reports_reviewed?: number
          session_end?: string | null
          session_start?: string
          total_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moderator_sessions_moderator_id_fkey"
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
      monitoring_sessions: {
        Row: {
          created_at: string
          end_time: string | null
          id: string
          session_id: string
          start_time: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          session_id: string
          start_time?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          session_id?: string
          start_time?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "monitoring_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      nft_galleries: {
        Row: {
          created_at: string
          description: string | null
          gallery_name: string | null
          id: string
          is_private: boolean
          is_public: boolean
          is_verified: boolean
          metadata: Json | null
          nft_contract_address: string | null
          nft_network: string | null
          profile_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          gallery_name?: string | null
          id?: string
          is_private?: boolean
          is_public?: boolean
          is_verified?: boolean
          metadata?: Json | null
          nft_contract_address?: string | null
          nft_network?: string | null
          profile_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          gallery_name?: string | null
          id?: string
          is_private?: boolean
          is_public?: boolean
          is_verified?: boolean
          metadata?: Json | null
          nft_contract_address?: string | null
          nft_network?: string | null
          profile_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nft_galleries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      nft_gallery_images: {
        Row: {
          created_at: string
          description: string | null
          gallery_id: string
          id: string
          image_url: string
          is_verified: boolean
          metadata: Json | null
          nft_network: string | null
          sort_order: number
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          gallery_id: string
          id?: string
          image_url: string
          is_verified?: boolean
          metadata?: Json | null
          nft_network?: string | null
          sort_order?: number
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          gallery_id?: string
          id?: string
          image_url?: string
          is_verified?: boolean
          metadata?: Json | null
          nft_network?: string | null
          sort_order?: number
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nft_gallery_images_user_id_fkey"
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
          user_id: string
          verified_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          minted_with_gtk?: number
          network: string
          nft_contract_address: string
          nft_token_id: string
          staking_record_id?: string | null
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
          user_id?: string
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nft_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
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
      performance_metrics: {
        Row: {
          created_at: string
          id: string
          metric_name: string
          metric_type: string
          metric_value: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metric_name: string
          metric_type: string
          metric_value: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metric_name?: string
          metric_type?: string
          metric_value?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      permanent_bans: {
        Row: {
          ban_reason: string
          banned_at: string
          banned_by: string | null
          canvas_hash: string | null
          combined_hash: string | null
          created_at: string
          evidence: Json | null
          fingerprint_ids: string[] | null
          id: string
          is_active: boolean
          reason: string
          severity: string
          user_id: string | null
          worldid_nullifier_hash: string | null
        }
        Insert: {
          ban_reason?: string
          banned_at?: string
          banned_by?: string | null
          canvas_hash?: string | null
          combined_hash?: string | null
          created_at?: string
          evidence?: Json | null
          fingerprint_ids?: string[] | null
          id?: string
          is_active?: boolean
          reason: string
          severity?: string
          user_id?: string | null
          worldid_nullifier_hash?: string | null
        }
        Update: {
          ban_reason?: string
          banned_at?: string
          banned_by?: string | null
          canvas_hash?: string | null
          combined_hash?: string | null
          created_at?: string
          evidence?: Json | null
          fingerprint_ids?: string[] | null
          id?: string
          is_active?: boolean
          reason?: string
          severity?: string
          user_id?: string | null
          worldid_nullifier_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permanent_bans_banned_by_fkey"
            columns: ["banned_by"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permanent_bans_user_id_fkey"
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
          age: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          gender: string | null
          id: string
          interests: string[] | null
          is_active: boolean
          is_blocked: boolean
          is_demo: boolean
          is_premium: boolean | null
          is_verified: boolean
          latitude: number | null
          location: string | null
          longitude: number | null
          minted_with_gtk: number
          name: string | null
          network: string | null
          nft_contract_address: string | null
          nft_token_id: string | null
          staking_record_id: string | null
          updated_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_active?: boolean
          is_blocked?: boolean
          is_demo?: boolean
          is_premium?: boolean | null
          is_verified?: boolean
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          minted_with_gtk?: number
          name?: string | null
          network?: string | null
          nft_contract_address?: string | null
          nft_token_id?: string | null
          staking_record_id?: string | null
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          is_active?: boolean
          is_blocked?: boolean
          is_demo?: boolean
          is_premium?: boolean | null
          is_verified?: boolean
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          minted_with_gtk?: number
          name?: string | null
          network?: string | null
          nft_contract_address?: string | null
          nft_token_id?: string | null
          staking_record_id?: string | null
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
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
      referral_statistics: {
        Row: {
          conversion_rate: number
          created_at: string
          id: string
          total_conversions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          conversion_rate?: number
          created_at?: string
          id?: string
          total_conversions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          conversion_rate?: number
          created_at?: string
          id?: string
          total_conversions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_statistics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          referrer_id: string
          transaction_type: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          referrer_id: string
          transaction_type?: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          referrer_id?: string
          transaction_type?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_transactions_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      report_ai_classification: {
        Row: {
          ai_category: string
          ai_confidence: number | null
          ai_model_version: string | null
          ai_reasoning: string | null
          ai_severity: string
          ai_summary: string | null
          ai_tags: string[] | null
          created_at: string
          detected_explicit: number | null
          detected_harassment: number | null
          detected_spam: number | null
          detected_toxicity: number | null
          id: string
          report_id: string
          suggested_action: string | null
          suggested_priority: string | null
        }
        Insert: {
          ai_category: string
          ai_confidence?: number | null
          ai_model_version?: string | null
          ai_reasoning?: string | null
          ai_severity: string
          ai_summary?: string | null
          ai_tags?: string[] | null
          created_at?: string
          detected_explicit?: number | null
          detected_harassment?: number | null
          detected_spam?: number | null
          detected_toxicity?: number | null
          id?: string
          report_id: string
          suggested_action?: string | null
          suggested_priority?: string | null
        }
        Update: {
          ai_category?: string
          ai_confidence?: number | null
          ai_model_version?: string | null
          ai_reasoning?: string | null
          ai_severity?: string
          ai_summary?: string | null
          ai_tags?: string[] | null
          created_at?: string
          detected_explicit?: number | null
          detected_harassment?: number | null
          detected_spam?: number | null
          detected_toxicity?: number | null
          id?: string
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
          reviewed_at: string | null
          reviewed_by: string | null
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
          reviewed_at?: string | null
          reviewed_by?: string | null
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
          reviewed_at?: string | null
          reviewed_by?: string | null
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
          {
            foreignKeyName: "reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      security: {
        Row: {
          created_at: string
          description: string | null
          details: Json | null
          event_type: string
          fingerprint_ids: string[] | null
          id: string
          ip_address: string | null
          metadata: Json | null
          nullifier_hash: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          details?: Json | null
          event_type: string
          fingerprint_ids?: string[] | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          nullifier_hash?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          details?: Json | null
          event_type?: string
          fingerprint_ids?: string[] | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          nullifier_hash?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_user_id_fkey"
            columns: ["user_id"]
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
      staking_records: {
        Row: {
          amount: number
          created_at: string
          end_date: string | null
          id: string
          rewards_earned: number
          start_date: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          end_date?: string | null
          id?: string
          rewards_earned?: number
          start_date: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          end_date?: string | null
          id?: string
          rewards_earned?: number
          start_date?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staking_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          content_type: string
          content_url: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          location: string | null
          updated_at: string
          user_id: string
          views_count: number
        }
        Insert: {
          content_type?: string
          content_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          location?: string | null
          updated_at?: string
          user_id: string
          views_count?: number
        }
        Update: {
          content_type?: string
          content_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          location?: string | null
          updated_at?: string
          user_id?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey"
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
      summary_feedback: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          is_helpful: boolean | null
          rating: number
          summary_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          is_helpful?: boolean | null
          rating: number
          summary_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          is_helpful?: boolean | null
          rating?: number
          summary_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "summary_feedback_summary_id_fkey"
            columns: ["summary_id"]
            isOneToOne: false
            referencedRelation: "chat_summaries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "summary_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      summary_requests: {
        Row: {
          chat_id: string | null
          completed_at: string | null
          content: string | null
          created_at: string
          id: string
          sentiment: string | null
          status: string
          summary: string | null
          user_id: string | null
        }
        Insert: {
          chat_id?: string | null
          completed_at?: string | null
          content?: string | null
          created_at?: string
          id?: string
          sentiment?: string | null
          status?: string
          summary?: string | null
          user_id?: string | null
        }
        Update: {
          chat_id?: string | null
          completed_at?: string | null
          content?: string | null
          created_at?: string
          id?: string
          sentiment?: string | null
          status?: string
          summary?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "summary_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      swinger_interests: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
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
      token_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          token_type: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          token_type: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          token_type?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
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
      user_device_tokens: {
        Row: {
          created_at: string
          device_token: string
          id: string
          is_active: boolean
          platform: string
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_token: string
          id?: string
          is_active?: boolean
          platform?: string
          provider?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_token?: string
          id?: string
          is_active?: boolean
          platform?: string
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_device_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          created_at: string
          id: string
          interest_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interest_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "swinger_interests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
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
      user_referral_balances: {
        Row: {
          cmpx_balance: number
          created_at: string
          gtk_balance: number
          id: string
          last_reset_date: string
          monthly_earned: number
          referral_code: string
          total_earned: number
          total_referrals: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cmpx_balance?: number
          created_at?: string
          gtk_balance?: number
          id?: string
          last_reset_date?: string
          monthly_earned?: number
          referral_code: string
          total_earned?: number
          total_referrals?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cmpx_balance?: number
          created_at?: string
          gtk_balance?: number
          id?: string
          last_reset_date?: string
          monthly_earned?: number
          referral_code?: string
          total_earned?: number
          total_referrals?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_referral_balances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      user_referral_stats: {
        Row: {
          cmpx_balance: number
          created_at: string
          id: string
          monthly_earned: number
          total_earned: number
          total_referrals: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cmpx_balance?: number
          created_at?: string
          id?: string
          monthly_earned?: number
          total_earned?: number
          total_referrals?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cmpx_balance?: number
          created_at?: string
          id?: string
          monthly_earned?: number
          total_earned?: number
          total_referrals?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_referral_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "user_stripe_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      user_suspensions: {
        Row: {
          expires_at: string | null
          id: string
          is_active: boolean
          reason: string
          suspended_at: string
          suspended_by: string | null
          user_id: string | null
        }
        Insert: {
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason: string
          suspended_at?: string
          suspended_by?: string | null
          user_id?: string | null
        }
        Update: {
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason?: string
          suspended_at?: string
          suspended_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_suspensions_suspended_by_fkey"
            columns: ["suspended_by"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_suspensions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      user_token_balances: {
        Row: {
          cmpx_balance: number
          created_at: string
          gtk_balance: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cmpx_balance?: number
          created_at?: string
          gtk_balance?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cmpx_balance?: number
          created_at?: string
          gtk_balance?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_token_balances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
      web_vitals_history: {
        Row: {
          created_at: string
          id: string
          metric_name: string
          metric_type: string
          metric_value: number
          session_id: string
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metric_name: string
          metric_type: string
          metric_value: number
          session_id: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metric_name?: string
          metric_type?: string
          metric_value?: number
          session_id?: string
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "web_vitals_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      worldid_rewards: {
        Row: {
          amount: number
          created_at: string
          id: string
          reward_type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reward_type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reward_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "worldid_rewards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      worldid_statistics: {
        Row: {
          created_at: string
          id: string
          period_end: string
          period_start: string
          total_rewards: number
          total_verifications: number
        }
        Insert: {
          created_at?: string
          id?: string
          period_end: string
          period_start: string
          total_rewards?: number
          total_verifications?: number
        }
        Update: {
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          total_rewards?: number
          total_verifications?: number
        }
        Relationships: []
      }
      worldid_verifications: {
        Row: {
          action: string
          created_at: string | null
          id: string
          nullifier_hash: string | null
          proof: Json | null
          signal: string | null
          status: string | null
          user_id: string | null
          verification_level: string | null
          world_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          nullifier_hash?: string | null
          proof?: Json | null
          signal?: string | null
          status?: string | null
          user_id?: string | null
          verification_level?: string | null
          world_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          nullifier_hash?: string | null
          proof?: Json | null
          signal?: string | null
          status?: string | null
          user_id?: string | null
          verification_level?: string | null
          world_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "worldid_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
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
          ip: string | null
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
          ip?: string | null
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
          ip?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_safe"
            referencedColumns: ["id"]
          },
        ]
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
      stripe_prices_view: {
        Row: {
          active: boolean | null
          billing_scheme: string | null
          created: string | null
          currency: string | null
          id: string | null
          livemode: boolean | null
          lookup_key: string | null
          metadata: Json | null
          nickname: string | null
          object: string | null
          product: string | null
          product_description: string | null
          product_name: string | null
          recurring: Json | null
          tax_behavior: string | null
          type: string | null
          unit_amount: number | null
          unit_amount_decimal: number | null
        }
        Relationships: []
      }
      stripe_products_view: {
        Row: {
          active: boolean | null
          created: string | null
          description: string | null
          id: string | null
          images: string[] | null
          metadata: Json | null
          name: string | null
          object: string | null
          statement_descriptor: string | null
          type: string | null
          updated: string | null
        }
        Relationships: []
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
      create_stripe_customer: {
        Args: {
          p_email?: string
          p_metadata?: Json
          p_name?: string
          p_user_id: string
        }
        Returns: {
          customer_id: string
          message: string
          success: boolean
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
  public: {
    Enums: {},
  },
} as const

