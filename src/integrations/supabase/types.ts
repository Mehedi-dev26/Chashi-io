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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_chats: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      device_commands: {
        Row: {
          action: string
          consumed: boolean
          consumed_at: string | null
          created_at: string
          device_id: string
          id: string
          issued_by: string | null
          zone_id: string | null
        }
        Insert: {
          action: string
          consumed?: boolean
          consumed_at?: string | null
          created_at?: string
          device_id: string
          id?: string
          issued_by?: string | null
          zone_id?: string | null
        }
        Update: {
          action?: string
          consumed?: boolean
          consumed_at?: string | null
          created_at?: string
          device_id?: string
          id?: string
          issued_by?: string | null
          zone_id?: string | null
        }
        Relationships: []
      }
      device_telemetry: {
        Row: {
          current: number | null
          device_id: string
          flow_lpm: number | null
          humidity: number | null
          ldr: number | null
          motor_on: boolean | null
          rssi: number | null
          runtime_sec: number | null
          soil_moisture: number | null
          tds_ppm: number | null
          temperature: number | null
          updated_at: string
          valve_open: boolean | null
          voltage: number | null
          water_level: number | null
          zone_id: string
        }
        Insert: {
          current?: number | null
          device_id: string
          flow_lpm?: number | null
          humidity?: number | null
          ldr?: number | null
          motor_on?: boolean | null
          rssi?: number | null
          runtime_sec?: number | null
          soil_moisture?: number | null
          tds_ppm?: number | null
          temperature?: number | null
          updated_at?: string
          valve_open?: boolean | null
          voltage?: number | null
          water_level?: number | null
          zone_id: string
        }
        Update: {
          current?: number | null
          device_id?: string
          flow_lpm?: number | null
          humidity?: number | null
          ldr?: number | null
          motor_on?: boolean | null
          rssi?: number | null
          runtime_sec?: number | null
          soil_moisture?: number | null
          tds_ppm?: number | null
          temperature?: number | null
          updated_at?: string
          valve_open?: boolean | null
          voltage?: number | null
          water_level?: number | null
          zone_id?: string
        }
        Relationships: []
      }
      field_nodes: {
        Row: {
          created_at: string
          device_id: string
          id: string
          label: string
          notes: string | null
          updated_at: string
          user_id: string
          zone_id: string | null
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          label: string
          notes?: string | null
          updated_at?: string
          user_id: string
          zone_id?: string | null
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          label?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          zone_id?: string | null
        }
        Relationships: []
      }
      fields: {
        Row: {
          area_acres: number
          created_at: string
          crop_type: string
          id: string
          name: string
          name_bn: string
          polygon: string
          updated_at: string
          user_id: string
          valve_node_id: string | null
          x: number
          y: number
          zone_id: string
        }
        Insert: {
          area_acres?: number
          created_at?: string
          crop_type?: string
          id?: string
          name: string
          name_bn: string
          polygon?: string
          updated_at?: string
          user_id: string
          valve_node_id?: string | null
          x?: number
          y?: number
          zone_id: string
        }
        Update: {
          area_acres?: number
          created_at?: string
          crop_type?: string
          id?: string
          name?: string
          name_bn?: string
          polygon?: string
          updated_at?: string
          user_id?: string
          valve_node_id?: string | null
          x?: number
          y?: number
          zone_id?: string
        }
        Relationships: []
      }
      gps_assets: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["gps_asset_kind"]
          label: string
          lat: number
          lng: number
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["gps_asset_kind"]
          label: string
          lat: number
          lng: number
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["gps_asset_kind"]
          label?: string
          lat?: number
          lng?: number
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gps_pipelines: {
        Row: {
          color: string
          created_at: string
          id: string
          label: string
          notes: string | null
          points: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          label: string
          notes?: string | null
          points: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          label?: string
          notes?: string | null
          points?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      motor_runtime_log: {
        Row: {
          delta_sec: number
          device_id: string
          id: string
          recorded_at: string
        }
        Insert: {
          delta_sec: number
          device_id: string
          id?: string
          recorded_at?: string
        }
        Update: {
          delta_sec?: number
          device_id?: string
          id?: string
          recorded_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      telemetry_history: {
        Row: {
          created_at: string
          current: number | null
          device_id: string
          flow_lpm: number | null
          humidity: number | null
          id: number
          ldr: number | null
          motor_on: boolean | null
          rssi: number | null
          soil_moisture: number | null
          tds_ppm: number | null
          temperature: number | null
          valve_open: boolean | null
          voltage: number | null
          water_level: number | null
          zone_id: string
        }
        Insert: {
          created_at?: string
          current?: number | null
          device_id: string
          flow_lpm?: number | null
          humidity?: number | null
          id?: number
          ldr?: number | null
          motor_on?: boolean | null
          rssi?: number | null
          soil_moisture?: number | null
          tds_ppm?: number | null
          temperature?: number | null
          valve_open?: boolean | null
          voltage?: number | null
          water_level?: number | null
          zone_id: string
        }
        Update: {
          created_at?: string
          current?: number | null
          device_id?: string
          flow_lpm?: number | null
          humidity?: number | null
          id?: number
          ldr?: number | null
          motor_on?: boolean | null
          rssi?: number | null
          soil_moisture?: number | null
          tds_ppm?: number | null
          temperature?: number | null
          valve_open?: boolean | null
          voltage?: number | null
          water_level?: number | null
          zone_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      app_role: "admin" | "operator" | "viewer"
      gps_asset_kind: "field" | "valve" | "motor"
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
      app_role: ["admin", "operator", "viewer"],
      gps_asset_kind: ["field", "valve", "motor"],
    },
  },
} as const
