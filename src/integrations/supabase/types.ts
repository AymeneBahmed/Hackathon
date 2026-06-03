export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      messages: {
        Row: {
          content: string;
          correction: Json | null;
          created_at: string;
          id: string;
          role: string;
          session_id: string;
          user_id: string;
        };
        Insert: {
          content: string;
          correction?: Json | null;
          created_at?: string;
          id?: string;
          role: string;
          session_id: string;
          user_id: string;
        };
        Update: {
          content?: string;
          correction?: Json | null;
          created_at?: string;
          id?: string;
          role?: string;
          session_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      placement_results: {
        Row: {
          answers: Json;
          confidence: number;
          created_at: string;
          id: string;
          level: string;
          strengths: Json;
          user_id: string;
          weaknesses: Json;
        };
        Insert: {
          answers?: Json;
          confidence: number;
          created_at?: string;
          id?: string;
          level: string;
          strengths?: Json;
          user_id: string;
          weaknesses?: Json;
        };
        Update: {
          answers?: Json;
          confidence?: number;
          created_at?: string;
          id?: string;
          level?: string;
          strengths?: Json;
          user_id?: string;
          weaknesses?: Json;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          current_streak: number;
          daily_minutes: number | null;
          display_name: string | null;
          goal: string | null;
          id: string;
          interests: Json;
          last_active_date: string | null;
          level: string | null;
          native_language: string | null;
          onboarded: boolean;
          placed: boolean;
          strengths: Json;
          target_language: string | null;
          updated_at: string;
          weaknesses: Json;
          xp: number;
        };
        Insert: {
          created_at?: string;
          current_streak?: number;
          daily_minutes?: number | null;
          display_name?: string | null;
          goal?: string | null;
          id: string;
          interests?: Json;
          last_active_date?: string | null;
          level?: string | null;
          native_language?: string | null;
          onboarded?: boolean;
          placed?: boolean;
          strengths?: Json;
          target_language?: string | null;
          updated_at?: string;
          weaknesses?: Json;
          xp?: number;
        };
        Update: {
          created_at?: string;
          current_streak?: number;
          daily_minutes?: number | null;
          display_name?: string | null;
          goal?: string | null;
          id?: string;
          interests?: Json;
          last_active_date?: string | null;
          level?: string | null;
          native_language?: string | null;
          onboarded?: boolean;
          placed?: boolean;
          strengths?: Json;
          target_language?: string | null;
          updated_at?: string;
          weaknesses?: Json;
          xp?: number;
        };
        Relationships: [];
      };
      scenarios: {
        Row: {
          character_name: string;
          character_role: string;
          context: string;
          created_at: string;
          description: string;
          difficulty: string;
          emoji: string;
          goal: string;
          id: string;
          slug: string;
          title: string;
        };
        Insert: {
          character_name: string;
          character_role: string;
          context: string;
          created_at?: string;
          description: string;
          difficulty: string;
          emoji?: string;
          goal: string;
          id?: string;
          slug: string;
          title: string;
        };
        Update: {
          character_name?: string;
          character_role?: string;
          context?: string;
          created_at?: string;
          description?: string;
          difficulty?: string;
          emoji?: string;
          goal?: string;
          id?: string;
          slug?: string;
          title?: string;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          created_at: string;
          ended_at: string | null;
          id: string;
          last_score: Json | null;
          scenario_id: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          last_score?: Json | null;
          scenario_id?: string | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          ended_at?: string | null;
          id?: string;
          last_score?: Json | null;
          scenario_id?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_scenario_id_fkey";
            columns: ["scenario_id"];
            isOneToOne: false;
            referencedRelation: "scenarios";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
