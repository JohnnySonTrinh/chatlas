"use client";

import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Eye, LogOut, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AuthPanel } from "@/components/world/auth-panel";
import { ChatSidebar } from "@/components/world/chat-sidebar";
import { FloatingToolbar } from "@/components/world/floating-toolbar";
import { WorldViewport } from "@/components/world/world-viewport";
import { useCameraState } from "@/hooks/use-camera";
import { useWorldPresence } from "@/hooks/use-world-presence";
import { BUBBLE_TEXT_COOLDOWN_MS, validateBubbleText, validateDisplayName } from "@/lib/content";
import {
  BUBBLE_LIMITS,
  CAMERA_LIMITS,
  DEFAULT_BUBBLE_SIZE,
  DEFAULT_CAMERA,
  WORLD_INITIAL_BOUNDS,
} from "@/lib/constants";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  mapSupabaseUser,
  type AppUser,
  type BubbleSummary,
  type ProfileRow,
} from "@/lib/types";
import { clamp, formatPresenceName } from "@/lib/utils";

function sortBubbles(items: BubbleSummary[]) {
  return items
    .slice()
    .sort((left, right) => right.updated_at.localeCompare(left.updated_at));
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

const HIDDEN_BUBBLES_STORAGE_KEY = "chatlas:hidden-bubbles";

const REPLY_OFFSET_PATTERN = [
  { x: 180, y: -16 },
  { x: 132, y: 118 },
  { x: -14, y: 150 },
  { x: -154, y: 74 },
  { x: -154, y: -74 },
  { x: -14, y: -150 },
  { x: 132, y: -118 },
  { x: 192, y: 70 },
];

function getBubbleCenter(bubble: Pick<BubbleSummary, "x" | "y" | "width" | "height">) {
  return {
    x: bubble.x + bubble.width / 2,
    y: bubble.y + bubble.height / 2,
  };
}

function getReplyBubblePosition(anchorBubble: BubbleSummary, bubbles: BubbleSummary[]) {
  const anchorCenter = getBubbleCenter(anchorBubble);
  const nearbyBubbleCount = bubbles.filter((bubble) => {
    if (bubble.id === anchorBubble.id) {
      return false;
    }

    const bubbleCenter = getBubbleCenter(bubble);
    return Math.hypot(bubbleCenter.x - anchorCenter.x, bubbleCenter.y - anchorCenter.y) < 420;
  }).length;

  const offset = REPLY_OFFSET_PATTERN[nearbyBubbleCount % REPLY_OFFSET_PATTERN.length];
  const ring = Math.floor(nearbyBubbleCount / REPLY_OFFSET_PATTERN.length);
  const spread = 1 + ring * 0.36;

  return {
    x: clamp(
      anchorCenter.x + offset.x * spread - DEFAULT_BUBBLE_SIZE.width / 2,
      WORLD_INITIAL_BOUNDS.minX,
      WORLD_INITIAL_BOUNDS.maxX
    ),
    y: clamp(
      anchorCenter.y + offset.y * spread - DEFAULT_BUBBLE_SIZE.height / 2,
      WORLD_INITIAL_BOUNDS.minY,
      WORLD_INITIAL_BOUNDS.maxY
    ),
  };
}

export function ChatlasApp({
  initialBubbles,
  initialUser,
  supabaseConfigured,
}: {
  initialBubbles: BubbleSummary[];
  initialUser: AppUser | null;
  supabaseConfigured: boolean;
}) {
  const searchParams = useSearchParams();
  const supabase = useMemo(
    () => (supabaseConfigured ? createSupabaseBrowserClient() : null),
    [supabaseConfigured],
  );
  const { camera, setCamera } = useCameraState();
  const [bubbles, setBubbles] = useState<BubbleSummary[]>(
    sortBubbles(initialBubbles),
  );
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(initialUser);
  const [authPending, setAuthPending] = useState(false);
  const [composerPending, setComposerPending] = useState(false);
  const [hiddenBubbleIds, setHiddenBubbleIds] = useState<string[]>([]);
  const lastSubmittedAtRef = useRef(0);
  const lastSubmittedTextRef = useRef<string | null>(null);

  const visibleBubbles = useMemo(
    () => bubbles.filter((bubble) => !hiddenBubbleIds.includes(bubble.id)),
    [bubbles, hiddenBubbleIds]
  );

  const selectedBubble = useMemo(
    () => visibleBubbles.find((bubble) => bubble.id === selectedBubbleId) ?? null,
    [selectedBubbleId, visibleBubbles],
  );

  const { presenceUsers, guestName, setGuestName } =
    useWorldPresence({
      supabase,
      enabled: Boolean(supabase),
      currentUser,
      camera,
      activeBubbleId: selectedBubbleId,
    });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HIDDEN_BUBBLES_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) {
        setHiddenBubbleIds(parsed.filter((value) => typeof value === "string"));
      }
    } catch {
      setHiddenBubbleIds([]);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(HIDDEN_BUBBLES_STORAGE_KEY, JSON.stringify(hiddenBubbleIds));
    } catch {
      // Ignore storage failures and keep the live hidden set.
    }
  }, [hiddenBubbleIds]);

  useEffect(() => {
    if (selectedBubbleId && hiddenBubbleIds.includes(selectedBubbleId)) {
      setSelectedBubbleId(null);
    }
  }, [hiddenBubbleIds, selectedBubbleId]);

  useEffect(() => {
    const authError = searchParams.get("authError");
    if (!authError) {
      return;
    }

    toast.error(`Authentication failed: ${decodeURIComponent(authError)}`);
    window.history.replaceState({}, "", "/");
  }, [searchParams]);

  const syncCurrentUser = useCallback(
    async (user: User | null, overrideDisplayName?: string) => {
      if (!supabase) {
        return;
      }

      let profile: ProfileRow | null = null;
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        profile = data;
      }

      const nextUser = mapSupabaseUser(user, profile);
      setCurrentUser(
        nextUser && overrideDisplayName
          ? {
              ...nextUser,
              displayName: overrideDisplayName,
            }
          : nextUser,
      );
    },
    [supabase],
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await syncCurrentUser(user);
    };

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      startTransition(() => {
        void syncCurrentUser(session?.user ?? null);
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, syncCurrentUser]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const refreshBubbleSummary = async (bubbleId: string) => {
      const { data } = await supabase
        .from("bubble_summaries")
        .select("*")
        .eq("id", bubbleId)
        .maybeSingle();
      if (!data) {
        return;
      }

      startTransition(() => {
        setBubbles((current) => mergeBubble(current, data));
      });
    };

    const bubbleChannel = supabase
      .channel("chatlas-bubbles")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bubbles" },
        async (payload) => {
          await refreshBubbleSummary(payload.new.id);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bubbles" },
        async (payload) => {
          await refreshBubbleSummary(payload.new.id);
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "bubbles" },
        (payload) => {
          startTransition(() => {
            setBubbles((current) =>
              current.filter((bubble) => bubble.id !== payload.old.id),
            );
            setSelectedBubbleId((current) =>
              current === payload.old.id ? null : current,
            );
          });
        },
      )
      .subscribe();

    const messageChannel = supabase
      .channel("chatlas-bubble-summaries")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          await refreshBubbleSummary(payload.new.bubble_id);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(bubbleChannel);
      void supabase.removeChannel(messageChannel);
    };
  }, [supabase]);

  const applyBubblePatch = (
    bubble: BubbleSummary,
    patch: Partial<Pick<BubbleSummary, "x" | "y" | "width" | "height">>,
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
        ? clamp(
            Math.round(patch.width),
            BUBBLE_LIMITS.minWidth,
            BUBBLE_LIMITS.maxWidth,
          )
        : bubble.width,
    height:
      typeof patch.height === "number"
        ? clamp(
            Math.round(patch.height),
            BUBBLE_LIMITS.minHeight,
            BUBBLE_LIMITS.maxHeight,
          )
        : bubble.height,
  });

  const syncBubbleSummary = useCallback(
    async (bubbleId: string) => {
      if (!supabase) {
        return null;
      }

      const { data } = await supabase
        .from("bubble_summaries")
        .select("*")
        .eq("id", bubbleId)
        .maybeSingle();
      if (data) {
        setBubbles((current) => mergeBubble(current, data));
      }
      return data;
    },
    [supabase],
  );

  const prepareBubbleText = useCallback((content: string) => {
    const trimmed = content.trim();
    const validationError = validateBubbleText(trimmed);
    if (validationError) {
      toast.error(validationError);
      return null;
    }

    const now = Date.now();
    if (now - lastSubmittedAtRef.current < BUBBLE_TEXT_COOLDOWN_MS) {
      const seconds = Math.ceil((BUBBLE_TEXT_COOLDOWN_MS - (now - lastSubmittedAtRef.current)) / 1000);
      toast.info(`Slow down a bit. Try again in ${seconds}s.`);
      return null;
    }

    if (
      lastSubmittedTextRef.current &&
      lastSubmittedTextRef.current === trimmed.toLowerCase() &&
      now - lastSubmittedAtRef.current < 60000
    ) {
      toast.info("That looks like the same message again. Try changing it a little.");
      return null;
    }

    return trimmed;
  }, []);

  const rememberBubbleText = useCallback((content: string) => {
    lastSubmittedAtRef.current = Date.now();
    lastSubmittedTextRef.current = content.trim().toLowerCase();
  }, []);

  const createBubble = useCallback(
    async ({
      x,
      y,
      initialText,
    }: {
      x: number;
      y: number;
      initialText?: string;
    }) => {
      if (!supabase || !currentUser) {
        toast.info("Enter the world with a display name to create a bubble.");
        return null;
      }

      const trimmedText = initialText?.trim();
      const { data, error } = await supabase
        .from("bubbles")
        .insert({
          owner_id: currentUser.id,
          title: "Bubble",
          x,
          y,
          width: DEFAULT_BUBBLE_SIZE.width,
          height: DEFAULT_BUBBLE_SIZE.height,
        })
        .select("*")
        .single();

      if (error || !data) {
        toast.error(error?.message ?? "Could not create the bubble.");
        return null;
      }

      if (trimmedText) {
        const { error: messageError } = await supabase.from("messages").insert({
          bubble_id: data.id,
          content: trimmedText,
          user_id: currentUser.id,
        });

        if (messageError) {
          await supabase.from("bubbles").delete().eq("id", data.id);
          toast.error(messageError.message);
          return null;
        }

        rememberBubbleText(trimmedText);
      }

      const bubble = await syncBubbleSummary(data.id);
      setSelectedBubbleId(data.id);

      if (!bubble) {
        setBubbles((current) =>
          mergeBubble(current, {
            ...data,
            message_count: trimmedText ? 1 : 0,
            owner_name: currentUser.displayName,
            participant_count: trimmedText ? 1 : 0,
            recent_message_at: trimmedText ? new Date().toISOString() : null,
            recent_message_preview: trimmedText ?? null,
          }),
        );
      }

      return data.id;
    },
    [currentUser, rememberBubbleText, supabase, syncBubbleSummary],
  );

  const handleCreateBubble = useCallback(async () => {
    if (!supabase || !currentUser) {
      toast.info("Enter the world with a display name to create a bubble.");
      return;
    }

    const bubbleId = await createBubble({
      x: camera.x - DEFAULT_BUBBLE_SIZE.width / 2,
      y: camera.y - DEFAULT_BUBBLE_SIZE.height / 2,
    });

    if (bubbleId) {
      toast.success("Bubble dropped at the center. Add text or riff off another bubble nearby.");
    }
  }, [camera.x, camera.y, createBubble, currentUser, supabase]);

  const handlePostInBubble = useCallback(
    async (content: string) => {
      if (!supabase || !currentUser || !selectedBubble) {
        toast.info("Pick a bubble first.");
        return false;
      }

      if (currentUser.id !== selectedBubble.owner_id) {
        toast.info("Reply by creating your own bubble nearby.");
        return false;
      }

      if (selectedBubble.message_count > 0) {
        toast.info("This bubble already has text. Drop a reply bubble nearby instead.");
        return false;
      }

      const trimmed = prepareBubbleText(content);
      if (!trimmed) {
        return false;
      }

      setComposerPending(true);
      const { error } = await supabase.from("messages").insert({
        bubble_id: selectedBubble.id,
        content: trimmed,
        user_id: currentUser.id,
      });
      setComposerPending(false);

      if (error) {
        toast.error(error.message);
        return false;
      }

      rememberBubbleText(trimmed);
      await syncBubbleSummary(selectedBubble.id);
      toast.success("Text added to your bubble.");
      return true;
    },
    [currentUser, prepareBubbleText, rememberBubbleText, selectedBubble, supabase, syncBubbleSummary],
  );

  const handleReplyNearby = useCallback(
    async (content: string) => {
      if (!selectedBubble) {
        toast.info("Pick a bubble to reply to.");
        return false;
      }

      const trimmed = prepareBubbleText(content);
      if (!trimmed) {
        return false;
      }

      setComposerPending(true);
      const position = getReplyBubblePosition(selectedBubble, visibleBubbles);
      const bubbleId = await createBubble({
        x: position.x,
        y: position.y,
        initialText: trimmed,
      });
      setComposerPending(false);

      if (!bubbleId) {
        return false;
      }

      toast.success("Reply bubble dropped nearby.");
      return true;
    },
    [createBubble, prepareBubbleText, selectedBubble, visibleBubbles],
  );

  const handleDeleteBubble = async () => {
    if (
      !supabase ||
      !selectedBubble ||
      currentUser?.id !== selectedBubble.owner_id
    ) {
      return;
    }

    const bubbleId = selectedBubble.id;
    const { error } = await supabase
      .from("bubbles")
      .delete()
      .eq("id", bubbleId);
    if (error) {
      toast.error(error.message);
      return;
    }

    setBubbles((current) => current.filter((bubble) => bubble.id !== bubbleId));
    setSelectedBubbleId(null);
    toast.success("Bubble deleted.");
  };

  const handleHideBubble = useCallback(() => {
    if (!selectedBubble) {
      return;
    }

    setHiddenBubbleIds((current) =>
      current.includes(selectedBubble.id) ? current : [...current, selectedBubble.id]
    );
    setSelectedBubbleId(null);
    toast.success("Bubble hidden on this device.");
  }, [selectedBubble]);

  const handleRestoreHiddenBubbles = useCallback(() => {
    setHiddenBubbleIds([]);
    toast.success("Hidden bubbles restored.");
  }, []);

  const handleReportBubble = useCallback(async () => {
    if (!supabase || !currentUser || !selectedBubble) {
      toast.info("Pick a display name before reporting bubbles.");
      return;
    }

    const { error } = await supabase.from("bubble_reports").upsert(
      {
        bubble_id: selectedBubble.id,
        reporter_id: currentUser.id,
        reason: "manual review requested"
      },
      {
        onConflict: "bubble_id,reporter_id"
      }
    );

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Bubble reported for review.");
  }, [currentUser, selectedBubble, supabase]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
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

  const handlePreviewBubble = (
    bubbleId: string,
    patch: Partial<Pick<BubbleSummary, "x" | "y" | "width" | "height">>,
  ) => {
    setBubbles((current) =>
      current.map((bubble) =>
        bubble.id === bubbleId
          ? { ...bubble, ...applyBubblePatch(bubble, patch) }
          : bubble,
      ),
    );
  };

  const handleCommitBubble = async (
    bubbleId: string,
    patch: Partial<Pick<BubbleSummary, "x" | "y" | "width" | "height">>,
  ) => {
    const bubble = bubbles.find((item) => item.id === bubbleId);
    if (!bubble || !supabase || currentUser?.id !== bubble.owner_id) {
      return;
    }

    const nextPatch = applyBubblePatch(bubble, patch);
    const { error } = await supabase
      .from("bubbles")
      .update(nextPatch)
      .eq("id", bubbleId);
    if (error) {
      toast.error(error.message);
      await syncBubbleSummary(bubbleId);
    }
  };

  const handleJoinAsGuest = async (name: string) => {
    if (!supabase) {
      return;
    }

    const nextName = formatPresenceName(name);
    const nameError = validateDisplayName(nextName);
    if (nameError) {
      toast.error(nameError);
      return;
    }

    setAuthPending(true);
    setGuestName(nextName);

    const { data, error } = await supabase.auth.signInAnonymously({
      options: {
        data: {
          display_name: nextName,
        },
      },
    });

    if (!error && data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          display_name: nextName,
        },
        {
          onConflict: "id",
        },
      );

      if (!profileError) {
        await syncCurrentUser(data.user, nextName);
      }
    }

    setAuthPending(false);

    if (error) {
      if (
        error.message.toLowerCase().includes("anonymous sign-ins are disabled")
      ) {
        toast.error(
          "Enable Anonymous Sign-Ins in Supabase Dashboard -> Authentication -> Providers, then try again.",
        );
        return;
      }

      toast.error(error.message);
      return;
    }

    toast.success(`Welcome to Chatlas, ${nextName}.`);
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
        bubbles={visibleBubbles}
        camera={camera}
        selectedBubbleId={selectedBubbleId}
        currentUserId={currentUser?.id ?? null}
        onSelectBubble={setSelectedBubbleId}
        onCreateBubble={() => void handleCreateBubble()}
        onUpdateCamera={setCamera}
        onPreviewBubble={handlePreviewBubble}
        onCommitBubble={(bubbleId, patch) =>
          void handleCommitBubble(bubbleId, patch)
        }
      />

      <div className="pointer-events-auto fixed right-3 top-3 z-20 rounded-[1.65rem] border border-white/60 bg-white/68 px-3 py-2 text-xs text-muted-foreground shadow-bubble backdrop-blur-xl sm:right-4 sm:top-4 sm:rounded-[2rem] sm:px-4 sm:py-3 sm:text-sm">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Users className="size-3.5 text-primary sm:size-4" />
            <span className="tabular-nums">{presenceUsers.length}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Sparkles className="size-3.5 text-primary sm:size-4" />
            <span className="tabular-nums">{visibleBubbles.length}</span>
          </div>
          <div className="tabular-nums">{camera.zoom.toFixed(2)}x</div>
          {hiddenBubbleIds.length ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRestoreHiddenBubbles()}
              className="h-8 gap-1 rounded-full bg-transparent px-2 text-muted-foreground sm:h-9"
              title="Show hidden bubbles"
            >
              <Eye className="size-3.5 sm:size-4" />
              <span className="tabular-nums">{hiddenBubbleIds.length}</span>
            </Button>
          ) : null}
          {currentUser ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleSignOut()}
              disabled={authPending}
              className="h-8 w-8 rounded-full bg-transparent p-0 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 focus-visible:ring-red-300 sm:h-9 sm:w-9"
              aria-label="Leave session"
              title="Leave session"
            >
              <LogOut className="size-3.5 sm:size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <AuthPanel
        supabaseConfigured={supabaseConfigured}
        currentUser={currentUser}
        guestName={guestName}
        pending={authPending}
        onJoinAsGuest={handleJoinAsGuest}
      />

      <FloatingToolbar
        canCreate={Boolean(currentUser)}
        onCreateBubble={() => void handleCreateBubble()}
        onResetCamera={() => setCamera(DEFAULT_CAMERA)}
        onZoomIn={() =>
          setCamera((current) => ({
            ...current,
            zoom: clamp(
              current.zoom * 1.18,
              CAMERA_LIMITS.minZoom,
              CAMERA_LIMITS.maxZoom,
            ),
          }))
        }
        onZoomOut={() =>
          setCamera((current) => ({
            ...current,
            zoom: clamp(
              current.zoom / 1.18,
              CAMERA_LIMITS.minZoom,
              CAMERA_LIMITS.maxZoom,
            ),
          }))
        }
      />

      <ChatSidebar
        bubble={selectedBubble}
        currentUser={currentUser}
        pending={composerPending}
        onClose={() => setSelectedBubbleId(null)}
        onDelete={handleDeleteBubble}
        onHide={handleHideBubble}
        onReport={handleReportBubble}
        onPostToBubble={handlePostInBubble}
        onReplyNearby={handleReplyNearby}
      />
    </main>
  );
}
