import { ChatlasApp } from "@/components/chatlas-app";
import { isSupabaseConfigured } from "@/lib/env";
import { mapSupabaseUser, type BubbleSummary } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function loadInitialData() {
  if (!isSupabaseConfigured) {
    return {
      initialBubbles: [] as BubbleSummary[],
      currentUser: null
    };
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: authResult }, { data: initialBubbles }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("bubble_summaries").select("*").order("updated_at", { ascending: false }).limit(500)
  ]);

  const profile = authResult.user
    ? await supabase.from("profiles").select("*").eq("id", authResult.user.id).maybeSingle()
    : { data: null };

  return {
    initialBubbles: initialBubbles ?? [],
    currentUser: mapSupabaseUser(authResult.user, profile.data)
  };
}

export default async function HomePage() {
  const { initialBubbles, currentUser } = await loadInitialData();

  return <ChatlasApp initialBubbles={initialBubbles} initialUser={currentUser} supabaseConfigured={isSupabaseConfigured} />;
}
