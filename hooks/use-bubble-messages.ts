"use client";

import { useEffect, useMemo, useState } from "react";

import type { AppSupabaseClient, AppUser, MessageRow } from "@/lib/types";
import type { Database } from "@/types/supabase";

interface OptimisticMessage extends MessageRow {
  optimistic?: boolean;
}

function mergeMessages(current: OptimisticMessage[], nextMessage: OptimisticMessage) {
  const existingIndex = current.findIndex((message) => message.id === nextMessage.id);
  if (existingIndex >= 0) {
    const clone = current.slice();
    clone[existingIndex] = {
      ...clone[existingIndex],
      ...nextMessage,
      optimistic: false
    };
    return clone;
  }

  return [...current, nextMessage].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

async function buildRealtimeMessage(
  supabase: AppSupabaseClient,
  payload: { new: Database["public"]["Tables"]["messages"]["Row"] },
  currentUser: AppUser | null
): Promise<OptimisticMessage> {
  if (currentUser?.id === payload.new.user_id) {
    return {
      ...payload.new,
      display_name: currentUser.displayName,
      avatar_url: currentUser.avatarUrl
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", payload.new.user_id)
    .maybeSingle();

  return {
    ...payload.new,
    display_name: profile?.display_name ?? "Explorer",
    avatar_url: profile?.avatar_url ?? null
  };
}

export function useBubbleMessages({
  supabase,
  bubbleId,
  currentUser,
  enabled
}: {
  supabase: AppSupabaseClient | null;
  bubbleId: string | null;
  currentUser: AppUser | null;
  enabled: boolean;
}) {
  const [messages, setMessages] = useState<OptimisticMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!enabled || !bubbleId || !supabase) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    void (async () => {
      try {
        const { data } = await supabase
          .from("messages_with_profiles")
          .select("*")
          .eq("bubble_id", bubbleId)
          .order("created_at", { ascending: true });

        if (!isMounted) {
          return;
        }

        setMessages(data ?? []);
        setIsLoading(false);
      } catch {
        if (!isMounted) {
          return;
        }

        setMessages([]);
        setIsLoading(false);
      }
    })();

    const channel = supabase
      .channel(`bubble-messages:${bubbleId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `bubble_id=eq.${bubbleId}`
        },
        async (payload) => {
          const nextMessage = await buildRealtimeMessage(supabase, payload, currentUser);
          setMessages((current) => mergeMessages(current.filter((message) => message.id !== `optimistic:${nextMessage.id}`), nextMessage));
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [bubbleId, currentUser, enabled, supabase]);

  const sendMessage = async (content: string) => {
    if (!bubbleId || !currentUser || !supabase) {
      return { error: new Error("You need to sign in before chatting.") };
    }

    const trimmed = content.trim();
    if (!trimmed) {
      return { error: new Error("Write something before sending.") };
    }

    const optimisticId = `optimistic:${crypto.randomUUID()}`;
    const optimisticMessage: OptimisticMessage = {
      id: optimisticId,
      bubble_id: bubbleId,
      content: trimmed,
      created_at: new Date().toISOString(),
      user_id: currentUser.id,
      display_name: currentUser.displayName,
      avatar_url: currentUser.avatarUrl,
      optimistic: true
    };

    setMessages((current) => mergeMessages(current, optimisticMessage));
    setIsSending(true);

    const { data, error } = await supabase
      .from("messages")
      .insert({
        bubble_id: bubbleId,
        content: trimmed,
        user_id: currentUser.id
      })
      .select("*")
      .single();

    setIsSending(false);

    if (error) {
      setMessages((current) => current.filter((message) => message.id !== optimisticId));
      return { error };
    }

    setMessages((current) =>
      current.map((message) =>
        message.id === optimisticId
          ? {
              ...message,
              ...data,
              optimistic: false
            }
          : message
      )
    );

    return { error: null };
  };

  return {
    isLoading,
    isSending,
    messages: useMemo(() => messages, [messages]),
    sendMessage
  };
}
