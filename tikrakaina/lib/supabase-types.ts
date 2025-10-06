// Supabase Database Types

export interface Database {
  public: {
    Tables: {
      payment_attempts: {
        Row: {
          id: string
          ref: string
          amount_cents: number
          currency: string
          status: 'INIT' | 'REDIRECTED' | 'PAID' | 'CANCELLED' | 'FAILED'
          sumup_checkout_id: string | null
          sumup_transaction_code: string | null
          sumup_raw: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ref: string
          amount_cents?: number
          currency?: string
          status?: 'INIT' | 'REDIRECTED' | 'PAID' | 'CANCELLED' | 'FAILED'
          sumup_checkout_id?: string | null
          sumup_transaction_code?: string | null
          sumup_raw?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ref?: string
          amount_cents?: number
          currency?: string
          status?: 'INIT' | 'REDIRECTED' | 'PAID' | 'CANCELLED' | 'FAILED'
          sumup_checkout_id?: string | null
          sumup_transaction_code?: string | null
          sumup_raw?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      user_credits: {
        Row: {
          id: string
          user_id: string
          credits: number
          total_purchased: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          credits?: number
          total_purchased?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          credits?: number
          total_purchased?: number
          created_at?: string
          updated_at?: string
        }
      }
      predictions: {
        Row: {
          id: string
          user_id: string
          url: string | null
          manual_data: any | null
          result: any
          is_rental: boolean
          credits_used: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          url?: string | null
          manual_data?: any | null
          result: any
          is_rental: boolean
          credits_used?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          url?: string | null
          manual_data?: any | null
          result?: any
          is_rental?: boolean
          credits_used?: number
          created_at?: string
        }
      }
      rental_training_data: {
        Row: {
          id: string
          user_id: string | null
          rooms: number
          area_m2: number
          floor_current: number
          floor_total: number
          year_centered: number
          dist_to_center_km: number
          has_lift: boolean
          has_balcony_terrace: boolean
          has_parking_spot: boolean
          heat_centrinis: boolean
          heat_dujinis: boolean
          heat_elektra: boolean
          actual_rent_price: number | null
          listing_url: string | null
          district: string | null
          notes: string | null
          is_verified: boolean
          confidence_level: number
          source: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          rooms: number
          area_m2: number
          floor_current: number
          floor_total: number
          year_centered: number
          dist_to_center_km: number
          has_lift?: boolean
          has_balcony_terrace?: boolean
          has_parking_spot?: boolean
          heat_centrinis?: boolean
          heat_dujinis?: boolean
          heat_elektra?: boolean
          actual_rent_price?: number | null
          listing_url?: string | null
          district?: string | null
          notes?: string | null
          is_verified?: boolean
          confidence_level?: number
          source?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          rooms?: number
          area_m2?: number
          floor_current?: number
          floor_total?: number
          year_centered?: number
          dist_to_center_km?: number
          has_lift?: boolean
          has_balcony_terrace?: boolean
          has_parking_spot?: boolean
          heat_centrinis?: boolean
          heat_dujinis?: boolean
          heat_elektra?: boolean
          actual_rent_price?: number | null
          listing_url?: string | null
          district?: string | null
          notes?: string | null
          is_verified?: boolean
          confidence_level?: number
          source?: string
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      use_credits: {
        Args: {
          user_id_input: string
          credits_to_use: number
        }
        Returns: boolean
      }
      get_training_data_stats: {
        Args: Record<string, never>
        Returns: {
          total_records: number
          verified_records: number
          avg_confidence: number
        }[]
      }
    }
    Enums: Record<string, never>
  }
}