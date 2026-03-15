"use client";

import { startTransition, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

import { AuthPanel } from "@/components/world/auth-panel";
import { ChatSidebar } from "@/components/world/chat-sidebar";
import { FloatingToolbar } from "@/components/world/floating-toolbar";
import { WorldViewport } from "@/components/world/world-viewport";
import { useBubbleMessages } from "@/hooks/use-bubble-messages";
import { useCameraState } from "@/hooks/use-camera";
import { useWorldPresence } from "@/hooks/use-world-presence";
import { BUBBLE_LIMITS, CAMERA_LIMITS, DEFAULT_BUBBLE_SIZE, DEFAULT_CAMERA, WORLD_INITIAL_BOUNDS } from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { mapSupabaseUser, type AppUser, type BubbleSummary, type ProfileRow } from "@/lib/types";
import { clamp } from "@/lib/utils";

function sortBubbles(items: BubbleSummary[]) {
  return items.slice().sort((left, right) => right.updated_at.localeCompare(left.updated_at));
}

function mergeBubble(items: BubbleSummary[], nextBubble: BubbleSummary) {
  const existingIndex = items.findIndex((item) => item.id === nextBubble.id);
  if (existingIndex >= 0) {
    const clone = items.slice();
    clone[existingIndex] = nextBubble;
    return sortBubbles(clone);
  }

  return sortBubbles([nextBubble, ...items]);
}

export function ChatlasApp({
  initialBubbles,
  initialUser,
  supabaseConfigured
}: {
  initialBubbles: BubbleSummary[];
  initialUser: AppUser | null;
  supabaseConfigured: boolean;
}) {
  const searchParams = useSearchParams();
  const supabase = useMemo(() => (supabaseConfigured ? createSupabaseBrowserClient() : null), [supabaseConfigured]);
  const { camera, setCamera } = useCameraState();
  const [bubbles, setBubbles] = useState<BubbleSummary[]>(sortBubbles(initialBubbles));
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(initialBubbles[0]?.id ?? null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(initialUser);
  const [authPending, setAuthPending] = useState(false);

  const selectedBubble = useMemo(
    () => bubbles.find((bubble) => bubble.id === selectedBubbleId) ?? null,
    [bubbles, selectedBubbleId]
  );

  const { bubblePresenceMap, presenceUsers, guestName } = useWorldPresence({
    supabase,
    enabled: Boolean(supabase),
    currentUser,
    camera,
    activeBubbleId: selectedBubbleId
  });

  const { messages, isLoading, isSending, sendMessage } = useBubbleMessages({
    supabase,
    bubbleId: selectedBubbleId,
    currentUser,
    enabled: Boolean(supabase && selectedBubbleId)
  });

  useEffect(() => {
    const authError = searchParams.get("authError");
    if (!authError) {
      return;
    }

    toast.error(`Authentication failed: ${decodeURIComponent(authError)}`);
    window.history.replaceState({}, "", "/");
  }, [searchParams]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const loadUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      let profile: ProfileRow | null = null;
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
        profile = data;
      }

      setCurrentUser(mapSupabaseUser(user, profile));
    };

    void loadUser();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      startTransition(() => {
        void (async () => {
          let profile: ProfileRow | null = null;
          if (session?.user) {
            const { data } = await supabase.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
            profile = data;
          }
          setCurrentUser(mapSupabaseUser(session?.user ?? null, profile));
        })();
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const refreshBubbleSummary = async (bubbleId: string) => {
      const { data } = await supabase.from("bubble_summaries").select("*").eq("id", bubbleId).maybeSingle();
      if (!data) {
        return;
      }

      startTransition(() => {
        setBubbles((current) => mergeBubble(current, data));
      });
    };

    const bubbleChannel = supabase
      .channel("chatlas-bubbles")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bubbles" }, async (payload) => {
        await refreshBubbleSummary(payload.new.id);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "bubbles" }, async (payload) => {
        await refreshBubbleSummary(payload.new.id);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "bubbles" }, (payload) => {
        startTransition(() => {
          setBubbles((current) => current.filter((bubble) => bubble.id !== payload.old.id));
          setSelectedBubbleId((current) => (current === payload.old.id ? null : current));
        });
      })
      .subscribe();

    const messageChannel = supabase
      .channel("chatlas-bubble-summaries")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
        await refreshBubbleSummary(payload.new.bubble_id);
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(bubbleChannel);
      void supabase.removeChannel(messageChannel);
    };
  }, [supabase]);

  const applyBubblePatch = (
    bubble: BubbleSummary,
    patch: Partial<Pick<BubbleSummary, "x" | "y" | "width" | "height">>
  ): Partial<Pick<BubbleSummary, "x" | "y" | "width" | "height">> => ({
    x:
      typeof patch.x === "number"
        ? clamp(patch.x, WORLD_INITIAL_BOUNDS.minX, WORLD_INITIAL_BOUNDS.maxX)
        : bubble.x,
    y:
      typeof patch.y === "number"
        ? clamp(patch.y, WORLD_INITIAL_BOUNDS.minY, WORLD_INITIAL_BOUNDS.maxY)
        : bubble.y,
    width:
      typeof patch.width === "number"
        ? clamp(Math.round(patch.width), BUBBLE_LIMITS.minWidth, BUBBLE_LIMITS.maxWidth)
        : bubble.width,
    height:
      typeof patch.height === "number"
        ? clamp(Math.round(patch.height), BUBBLE_LIMITS.minHeight, BUBBLE_LIMITS.maxHeight)
        : bubble.height
  });

  const syncBubbleSummary = useCallback(async (bubbleId: string) => {
    if (!supabase) {
      return null;
    }

    const { data } = await supabase.from("bubble_summaries").select("*").eq("id", bubbleId).maybeSingle();
    if (data) {
      setBubbles((current) => mergeBubble(current, data));
    }
    return data;
  }, [supabase]);

  const handleCreateBubble = useCallback(async () => {
    if (!supabase || !currentUser) {
      toast.info("Sign in to create a bubble.");
      return;
    }

    const { data, error } = await supabase
      .from("bubbles")
      .insert({
        owner_id: currentUser.id,
        title: "New bubble",
        x: camera.x - DEFAULT_BUBBLE_SIZE.width / 2,
        y: camera.y - DEFAULT_BUBBLE_SIZE.height / 2,
        width: DEFAULT_BUBBLE_SIZE.width,
        height: DEFAULT_BUBBLE_SIZE.height
      })
      .select("*")
      .single();

    if (error || !data) {
      toast.error(error?.message ?? "Could not create the bubble.");
      return;
    }

    const bubble = await syncBubbleSummary(data.id);
    setSelectedBubbleId(data.id);
    toast.success("Bubble created at the center of your view.");

    if (!bubble) {
      setBubbles((current) =>
        mergeBubble(current, {
          ...data,
          message_count: 0,
          owner_name: currentUser.displayName,
          participant_count: 0,
          recent_message_at: null,
          recent_message_preview: null
        })
      );
    }
  }, [camera.x, camera.y, currentUser, supabase, syncBubbleSummary]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      if (event.key.toLowerCase() === "c") {
        event.preventDefault();
        void handleCreateBubble();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCreateBubble]);

  const handlePreviewBubble = (bubbleId: string, patch: Partial<Pick<BubbleSummary, "x" | "y" | "width" | "height">>) => {
    setBubbles((current) =>
      current.map((bubble) => (bubble.id === bubbleId ? { ...bubble, ...applyBubblePatch(bubble, patch) } : bubble))
    );
  };

  const handleCommitBubble = async (
    bubbleId: string,
    patch: Partial<Pick<BubbleSummary, "x" | "y" | "width" | "height">>
  ) => {
    const bubble = bubbles.find((item) => item.id === bubbleId);
    if (!bubble || !supabase || currentUser?.id !== bubble.owner_id) {
      return;
    }

    const nextPatch = applyBubblePatch(bubble, patch);
    const { error } = await supabase.from("bubbles").update(nextPatch).eq("id", bubbleId);
    if (error) {
      toast.error(error.message);
      await syncBubbleSummary(bubbleId);
    }
  };

  const handleSaveTitle = async (title: string) => {
    if (!supabase || !selectedBubble || currentUser?.id !== selectedBubble.owner_id) {
      return;
    }

    const nextTitle = title.trim();
    if (!nextTitle) {
      toast.error("Bubble titles need at least one character.");
      return;
    }

    setBubbles((current) => current.map((bubble) => (bubble.id === selectedBubble.id ? { ...bubble, title: nextTitle } : bubble)));
    const { error } = await supabase.from("bubbles").update({ title: nextTitle }).eq("id", selectedBubble.id);

    if (error) {
      toast.error(error.message);
      await syncBubbleSummary(selectedBubble.id);
      return;
    }

    toast.success("Bubble title updated.");
  };

  const handleDeleteBubble = async () => {
    if (!supabase || !selectedBubble || currentUser?.id !== selectedBubble.owner_id) {
      return;
    }

    const bubbleId = selectedBubble.id;
    const { error } = await supabase.from("bubbles").delete().eq("id", bubbleId);
    if (error) {
      toast.error(error.message);
      return;
    }

    setBubbles((current) => current.filter((bubble) => bubble.id !== bubbleId));
    setSelectedBubbleId(null);
    toast.success("Bubble deleted.");
  };

  const handleSendMessage = async (content: string) => {
    const result = await sendMessage(content);
    if (result.error) {
      toast.error(result.error.message);
      return false;
    }
    return true;
  };

  const handleMagicLink = async (email: string) => {
    if (!supabase) {
      return;
    }

    setAuthPending(true);
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo
      }
    });
    setAuthPending(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Magic link sent. Check your inbox.");
  };

  const handleGoogle = async () => {
    if (!supabase) {
      return;
    }

    setAuthPending(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    setAuthPending(false);

    if (error) {
      toast.error(error.message);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) {
      return;
    }

    setAuthPending(true);
    const { error } = await supabase.auth.signOut();
    setAuthPending(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setSelectedBubbleId(null);
    toast.success("Signed out.");
  };

  return (
    <main className="relative h-screen w-full overflow-hidden">
      <WorldViewport
        bubbles={bubbles}
        camera={camera}
        selectedBubbleId={selectedBubbleId}
        currentUserId={currentUser?.id ?? null}
        bubblePresenceMap={bubblePresenceMap}
        onSelectBubble={setSelectedBubbleId}
        onCreateBubble={() => void handleCreateBubble()}
        onUpdateCamera={setCamera}
        onPreviewBubble={handlePreviewBubble}
        onCommitBubble={(bubbleId, patch) => void handleCommitBubble(bubbleId, patch)}
      />

      <div className="pointer-events-none fixed right-4 top-4 z-20 hidden rounded-[2rem] border border-white/60 bg-white/68 px-4 py-3 text-sm text-muted-foreground shadow-bubble backdrop-blur-xl md:block">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <span>{presenceUsers.length} explorers live</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <span>{bubbles.length} bubbles mapped</span>
          </div>
          <div>Zoom {camera.zoom.toFixed(2)}x</div>
        </div>
      </div>

      <AuthPanel
        supabaseConfigured={supabaseConfigured}
        currentUser={currentUser}
        guestName={guestName}
        pending={authPending}
        onMagicLink={handleMagicLink}
        onGoogle={handleGoogle}
        onSignOut={handleSignOut}
      />

      <FloatingToolbar
        canCreate={Boolean(currentUser)}
        onCreateBubble={() => void handleCreateBubble()}
        onResetCamera={() => setCamera(DEFAULT_CAMERA)}
        onZoomIn={() => setCamera((current) => ({ ...current, zoom: clamp(current.zoom * 1.18, CAMERA_LIMITS.minZoom, CAMERA_LIMITS.maxZoom) }))}
        onZoomOut={() => setCamera((current) => ({ ...current, zoom: clamp(current.zoom / 1.18, CAMERA_LIMITS.minZoom, CAMERA_LIMITS.maxZoom) }))}
      />

      <ChatSidebar
        bubble={selectedBubble}
        currentUser={currentUser}
        presence={selectedBubble ? bubblePresenceMap[selectedBubble.id] : undefined}
        messages={messages}
        isLoading={isLoading}
        isSending={isSending}
        onClose={() => setSelectedBubbleId(null)}
        onSaveTitle={handleSaveTitle}
        onDelete={handleDeleteBubble}
        onSendMessage={handleSendMessage}
      />
    </main>
  );
}
