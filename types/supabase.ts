export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      bubbles: {
        Row: {
          created_at: string;
          height: number;
          id: string;
          owner_id: string;
          title: string;
          updated_at: string;
          width: number;
          x: number;
          y: number;
        };
        Insert: {
          created_at?: string;
          height: number;
          id?: string;
          owner_id: string;
          title: string;
          updated_at?: string;
          width: number;
          x: number;
          y: number;
        };
        Update: {
          created_at?: string;
          height?: number;
          id?: string;
          owner_id?: string;
          title?: string;
          updated_at?: string;
          width?: number;
          x?: number;
          y?: number;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          bubble_id: string;
          content: string;
          created_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          bubble_id: string;
          content: string;
          created_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          bubble_id?: string;
          content?: string;
          created_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      bubble_summaries: {
        Row: {
          created_at: string;
          height: number;
          id: string;
          message_count: number;
          owner_id: string;
          owner_name: string | null;
          participant_count: number;
          recent_message_at: string | null;
          recent_message_preview: string | null;
          title: string;
          updated_at: string;
          width: number;
          x: number;
          y: number;
        };
        Relationships: [];
      };
      messages_with_profiles: {
        Row: {
          avatar_url: string | null;
          bubble_id: string;
          content: string;
          created_at: string;
          display_name: string | null;
          id: string;
          user_id: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      create_guest_profile: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
  };
}
