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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      ai_usage: {
        Row: {
          bucket: string
          count: number
          user_id: string
          window_start: string
        }
        Insert: {
          bucket: string
          count?: number
          user_id: string
          window_start: string
        }
        Update: {
          bucket?: string
          count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      api_usage: {
        Row: {
          count: number
          endpoint: string
          user_id: string
          window_start: string
        }
        Insert: {
          count?: number
          endpoint: string
          user_id: string
          window_start: string
        }
        Update: {
          count?: number
          endpoint?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      maintenance_items: {
        Row: {
          cost: number | null
          created_at: string
          description: string | null
          id: string
          log_id: string
          status: string | null
          type: string
          updated_at: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          log_id: string
          status?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          log_id?: string
          status?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_items_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "maintenance_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          invoice_number: string | null
          labor_cost: number | null
          location: string | null
          mileage: number | null
          notes: string | null
          parts_cost: number | null
          taxes: number | null
          updated_at: string
          user_id: string
          vehicle_id: string
          vendor_name: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          invoice_number?: string | null
          labor_cost?: number | null
          location?: string | null
          mileage?: number | null
          notes?: string | null
          parts_cost?: number | null
          taxes?: number | null
          updated_at?: string
          user_id: string
          vehicle_id: string
          vendor_name?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          invoice_number?: string | null
          labor_cost?: number | null
          location?: string | null
          mileage?: number | null
          notes?: string | null
          parts_cost?: number | null
          taxes?: number | null
          updated_at?: string
          user_id?: string
          vehicle_id?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_predictions: {
        Row: {
          based_on: Json | null
          confidence: number
          created_at: string
          description: string | null
          id: string
          predicted_date: string
          predicted_mileage: number | null
          title: string
          type: string
          updated_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          based_on?: Json | null
          confidence: number
          created_at?: string
          description?: string | null
          id?: string
          predicted_date: string
          predicted_mileage?: number | null
          title: string
          type: string
          updated_at?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          based_on?: Json | null
          confidence?: number
          created_at?: string
          description?: string | null
          id?: string
          predicted_date?: string
          predicted_mileage?: number | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_predictions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_records: {
        Row: {
          cost: number | null
          created_at: string
          date: string
          description: string
          id: string
          mileage: number | null
          notes: string | null
          performed_by: string | null
          type: string
          updated_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          date: string
          description: string
          id?: string
          mileage?: number | null
          notes?: string | null
          performed_by?: string | null
          type: string
          updated_at?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          date?: string
          description?: string
          id?: string
          mileage?: number | null
          notes?: string | null
          performed_by?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reminder_preferences: {
        Row: {
          created_at: string
          email_reminders: boolean
          id: string
          last_reminded_at: string | null
          push_reminders: boolean
          reminder_days_before: number[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_reminders?: boolean
          id?: string
          last_reminded_at?: string | null
          push_reminders?: boolean
          reminder_days_before?: number[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_reminders?: boolean
          id?: string
          last_reminded_at?: string | null
          push_reminders?: boolean
          reminder_days_before?: number[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sent_reminders: {
        Row: {
          id: string
          maintenance_prediction_id: string
          reminder_type: string
          sent_at: string
          type: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          id?: string
          maintenance_prediction_id: string
          reminder_type: string
          sent_at?: string
          type: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          id?: string
          maintenance_prediction_id?: string
          reminder_type?: string
          sent_at?: string
          type?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sent_reminders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          ai_access: boolean
          ai_predictions: boolean
          created_at: string
          current_period_end: string | null
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_access?: boolean
          ai_predictions?: boolean
          created_at?: string
          current_period_end?: string | null
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_access?: boolean
          ai_predictions?: boolean
          created_at?: string
          current_period_end?: string | null
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          color: string | null
          created_at: string
          id: string
          image: string | null
          license_plate: string | null
          make: string
          mileage: number | null
          model: string
          notes: string | null
          purchase_date: string | null
          updated_at: string
          user_id: string
          vin: string | null
          year: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          image?: string | null
          license_plate?: string | null
          make: string
          mileage?: number | null
          model: string
          notes?: string | null
          purchase_date?: string | null
          updated_at?: string
          user_id: string
          vin?: string | null
          year: number
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          image?: string | null
          license_plate?: string | null
          make?: string
          mileage?: number | null
          model?: string
          notes?: string | null
          purchase_date?: string | null
          updated_at?: string
          user_id?: string
          vin?: string | null
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      maintenance_records_compat: {
        Row: {
          cost: number | null
          created_at: string | null
          date: string | null
          description: string | null
          id: string | null
          invoice_number: string | null
          mileage: number | null
          notes: string | null
          status: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
          vehicle_id: string | null
          vendor_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_user_maintenance_limit: {
        Args: { uid: string }
        Returns: number
      }
      get_user_vehicle_limit: {
        Args: { uid: string }
        Returns: number
      }
      increment_ai_usage: {
        Args: { p_bucket: string; p_user: string; p_window: string }
        Returns: number
      }
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
