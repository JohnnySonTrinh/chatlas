"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { PRESENCE_CHANNEL } from "@/lib/constants";
import type { AppSupabaseClient, AppUser, BubblePresence, CameraState, PresenceUser } from "@/lib/types";
import { formatPresenceName, makeGuestName } from "@/lib/utils";

const GUEST_NAME_STORAGE_KEY = "chatlas.guest-name";

function persistGuestName(nextName: string) {
  const formatted = formatPresenceName(nextName);

  try {
    window.localStorage.setItem(GUEST_NAME_STORAGE_KEY, formatted);
  } catch {
    // Ignore storage failures and keep the in-memory name.
  }

  return formatted;
}

function flattenPresence(state: Record<string, PresenceUser[]>) {
  return Object.values(state).flat().sort((a, b) => a.name.localeCompare(b.name));
}

export function useWorldPresence({
  supabase,
  enabled,
  currentUser,
  camera,
  activeBubbleId
}: {
  supabase: AppSupabaseClient | null;
  enabled: boolean;
  currentUser: AppUser | null;
  camera: CameraState;
  activeBubbleId: string | null;
}) {
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [guestName, setGuestName] = useState("Explorer");
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const channelRef = useRef<ReturnType<AppSupabaseClient["channel"]> | null>(null);
  const currentStateRef = useRef({
    camera,
    activeBubbleId
  });

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(GUEST_NAME_STORAGE_KEY);
      if (stored) {
        setGuestName(formatPresenceName(stored));
        return;
      }

      const generated = makeGuestName();
      setGuestName(persistGuestName(generated));
    } catch {
      setGuestName(makeGuestName());
    }
  }, []);

  const identity = useMemo(
    () => ({
      sessionId: sessionIdRef.current,
      userId: currentUser?.id ?? null,
      name: currentUser?.displayName ?? guestName,
      avatarUrl: currentUser?.avatarUrl ?? null
    }),
    [currentUser, guestName]
  );

  useEffect(() => {
    currentStateRef.current = {
      camera,
      activeBubbleId
    };
  }, [activeBubbleId, camera]);

  useEffect(() => {
    if (!enabled || !supabase) {
      setPresenceUsers([]);
      return;
    }

    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: {
        presence: {
          key: sessionIdRef.current
        }
      }
    });

    channelRef.current = channel;

    channel.on("presence", { event: "sync" }, () => {
      setPresenceUsers(flattenPresence(channel.presenceState<PresenceUser>()));
    });

    channel.on("presence", { event: "join" }, () => {
      setPresenceUsers(flattenPresence(channel.presenceState<PresenceUser>()));
    });

    channel.on("presence", { event: "leave" }, () => {
      setPresenceUsers(flattenPresence(channel.presenceState<PresenceUser>()));
    });

    channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") {
        return;
      }

      await channel.track({
        ...identity,
        activeBubbleId: currentStateRef.current.activeBubbleId,
        camera: currentStateRef.current.camera,
        joinedAt: new Date().toISOString()
      });
    });

    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [enabled, identity, supabase]);

  useEffect(() => {
    if (!supabase || !channelRef.current) {
      return;
    }

    void channelRef.current.track({
      ...identity,
      activeBubbleId,
      camera,
      joinedAt: new Date().toISOString()
    });
  }, [activeBubbleId, camera, identity, supabase]);

  const bubblePresenceMap = useMemo<Record<string, BubblePresence>>(() => {
    return presenceUsers.reduce<Record<string, BubblePresence>>((accumulator, user) => {
      if (!user.activeBubbleId) {
        return accumulator;
      }

      const current = accumulator[user.activeBubbleId] ?? {
        onlineCount: 0,
        participants: []
      };

      current.onlineCount += 1;
      current.participants.push(user);
      accumulator[user.activeBubbleId] = current;
      return accumulator;
    }, {});
  }, [presenceUsers]);

  return {
    bubblePresenceMap,
    presenceUsers,
    guestName,
    setGuestName: (nextName: string) => {
      setGuestName(persistGuestName(nextName));
    }
  };
}
