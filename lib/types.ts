import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

export type BubbleSummary = Database["public"]["Views"]["bubble_summaries"]["Row"];
export type BubbleRow = Database["public"]["Tables"]["bubbles"]["Row"];
export type BubbleInsert = Database["public"]["Tables"]["bubbles"]["Insert"];
export type BubbleUpdate = Database["public"]["Tables"]["bubbles"]["Update"];
export type MessageRow = Database["public"]["Views"]["messages_with_profiles"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type AppSupabaseClient = SupabaseClient<Database>;

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}

export interface ViewportBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface AppUser {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
}

export interface PresenceUser {
  sessionId: string;
  userId: string | null;
  name: string;
  avatarUrl: string | null;
  activeBubbleId: string | null;
  camera: CameraState;
  joinedAt: string;
}

export interface BubblePresence {
  onlineCount: number;
  participants: PresenceUser[];
}

export interface ClusterNode {
  id: string;
  x: number;
  y: number;
  count: number;
  sampleTitle: string;
}

export function mapSupabaseUser(user: User | null, profile?: ProfileRow | null): AppUser | null {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    displayName:
      profile?.display_name ??
      (typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : null) ??
      (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null) ??
      user.email?.split("@")[0] ??
      "Explorer",
    avatarUrl:
      profile?.avatar_url ??
      (typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null)
  };
}
