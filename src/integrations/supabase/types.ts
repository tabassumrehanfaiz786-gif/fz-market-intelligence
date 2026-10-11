export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          analyst_notes: string
          created_at: string
          id: string
          observations: Json
          owner_id: string
          review_status: string
          rule: string
          rule_version: string
          signal_id: string | null
          updated_at: string
        }
        Insert: {
          analyst_notes?: string
          created_at?: string
          id?: string
          observations?: Json
          owner_id: string
          review_status?: string
          rule: string
          rule_version: string
          signal_id?: string | null
          updated_at?: string
        }
        Update: {
          analyst_notes?: string
          created_at?: string
          id?: string
          observations?: Json
          owner_id?: string
          review_status?: string
          rule?: string
          rule_version?: string
          signal_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "derived_signals"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string
          details: Json
          id: number
          occurred_at: string
          resource_id: string
          resource_type: string
        }
        Insert: {
          action: string
          actor_id: string
          details?: Json
          id?: never
          occurred_at?: string
          resource_id: string
          resource_type: string
        }
        Update: {
          action?: string
          actor_id?: string
          details?: Json
          id?: never
          occurred_at?: string
          resource_id?: string
          resource_type?: string
        }
        Relationships: []
      }
      cases: {
        Row: {
          alternative_explanations: string
          conclusion: string
          confidence: number | null
          created_at: string
          data_status: string
          evidence: Json
          id: string
          limitations: string
          methodology_version: string
          owner_id: string
          research_question: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          alternative_explanations?: string
          conclusion?: string
          confidence?: number | null
          created_at?: string
          data_status?: string
          evidence?: Json
          id?: string
          limitations?: string
          methodology_version?: string
          owner_id: string
          research_question?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          alternative_explanations?: string
          conclusion?: string
          confidence?: number | null
          created_at?: string
          data_status?: string
          evidence?: Json
          id?: string
          limitations?: string
          methodology_version?: string
          owner_id?: string
          research_question?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      derived_signals: {
        Row: {
          alternative_explanations: string
          confidence: number
          created_at: string
          evidence: Json
          id: string
          kind: string
          limitations: string
          market: string
          observed_at: string
          provenance: Json
          rule_version: string
        }
        Insert: {
          alternative_explanations: string
          confidence: number
          created_at?: string
          evidence: Json
          id?: string
          kind: string
          limitations: string
          market: string
          observed_at: string
          provenance: Json
          rule_version: string
        }
        Update: {
          alternative_explanations?: string
          confidence?: number
          created_at?: string
          evidence?: Json
          id?: string
          kind?: string
          limitations?: string
          market?: string
          observed_at?: string
          provenance?: Json
          rule_version?: string
        }
        Relationships: []
      }
      entitlements: {
        Row: {
          expires_at: string | null
          feature: string
          id: string
          plan: string
          usage_limit: number
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          feature: string
          id?: string
          plan?: string
          usage_limit?: number
          user_id: string
        }
        Update: {
          expires_at?: string | null
          feature?: string
          id?: string
          plan?: string
          usage_limit?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      etf_observations: {
        Row: {
          aum_usd: number | null
          btc_conversion_price: number | null
          exchange_at: string
          id: string
          ingested_at: string
          net_flow_usd: number
          provider_id: string
          quality: string
          reporting_date: string
          source_url: string
          ticker: string
        }
        Insert: {
          aum_usd?: number | null
          btc_conversion_price?: number | null
          exchange_at: string
          id?: string
          ingested_at?: string
          net_flow_usd: number
          provider_id: string
          quality?: string
          reporting_date: string
          source_url: string
          ticker: string
        }
        Update: {
          aum_usd?: number | null
          btc_conversion_price?: number | null
          exchange_at?: string
          id?: string
          ingested_at?: string
          net_flow_usd?: number
          provider_id?: string
          quality?: string
          reporting_date?: string
          source_url?: string
          ticker?: string
        }
        Relationships: [
          {
            foreignKeyName: "etf_observations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      news_metadata: {
        Row: {
          asset: string
          category: string | null
          claim_type: string
          confidence: number | null
          explanation: string | null
          headline: string
          id: string
          ingested_at: string
          original_url: string
          provider_id: string
          published_at: string
          publisher: string
          sentiment: string
        }
        Insert: {
          asset: string
          category?: string | null
          claim_type?: string
          confidence?: number | null
          explanation?: string | null
          headline: string
          id?: string
          ingested_at?: string
          original_url: string
          provider_id: string
          published_at: string
          publisher: string
          sentiment?: string
        }
        Update: {
          asset?: string
          category?: string | null
          claim_type?: string
          confidence?: number | null
          explanation?: string | null
          headline?: string
          id?: string
          ingested_at?: string
          original_url?: string
          provider_id?: string
          published_at?: string
          publisher?: string
          sentiment?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_metadata_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      orderbook_observations: {
        Row: {
          asks: Json
          bids: Json
          exchange_at: string
          id: number
          ingested_at: string
          is_snapshot: boolean
          market: string
          provider_id: string
          quality: string
          sequence_id: number
          symbol: string
        }
        Insert: {
          asks: Json
          bids: Json
          exchange_at: string
          id?: never
          ingested_at?: string
          is_snapshot?: boolean
          market: string
          provider_id: string
          quality: string
          sequence_id: number
          symbol: string
        }
        Update: {
          asks?: Json
          bids?: Json
          exchange_at?: string
          id?: never
          ingested_at?: string
          is_snapshot?: boolean
          market?: string
          provider_id?: string
          quality?: string
          sequence_id?: number
          symbol?: string
        }
        Relationships: [
          {
            foreignKeyName: "orderbook_observations_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          timezone: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
          timezone?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          timezone?: string
        }
        Relationships: []
      }
      providers: {
        Row: {
          earliest_coverage_at: string | null
          endpoint: string | null
          id: string
          kind: string
          last_exchange_at: string | null
          last_ingestion_at: string | null
          license_notes: string
          metadata: Json
          name: string
          status: string
          update_frequency_seconds: number | null
        }
        Insert: {
          earliest_coverage_at?: string | null
          endpoint?: string | null
          id?: string
          kind: string
          last_exchange_at?: string | null
          last_ingestion_at?: string | null
          license_notes?: string
          metadata?: Json
          name: string
          status?: string
          update_frequency_seconds?: number | null
        }
        Update: {
          earliest_coverage_at?: string | null
          endpoint?: string | null
          id?: string
          kind?: string
          last_exchange_at?: string | null
          last_ingestion_at?: string | null
          license_notes?: string
          metadata?: Json
          name?: string
          status?: string
          update_frequency_seconds?: number | null
        }
        Relationships: []
      }
      subscription_records: {
        Row: {
          created_at: string
          id: string
          plan: string
          provider_subscription_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan?: string
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan?: string
          provider_subscription_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          aggressor_side: string
          exchange_at: string
          id: number
          ingested_at: string
          market: string
          price: number
          provider_id: string
          quantity: number
          source_trade_id: string
          symbol: string
        }
        Insert: {
          aggressor_side: string
          exchange_at: string
          id?: never
          ingested_at?: string
          market: string
          price: number
          provider_id: string
          quantity: number
          source_trade_id: string
          symbol: string
        }
        Update: {
          aggressor_side?: string
          exchange_at?: string
          id?: never
          ingested_at?: string
          market?: string
          price?: number
          provider_id?: string
          quantity?: number
          source_trade_id?: string
          symbol?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "analyst" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["user", "analyst", "admin"],
    },
  },
} as const
