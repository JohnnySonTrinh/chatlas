"use client";

import { useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { MessageCircleMore, Send, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AppUser, BubblePresence, BubbleSummary, MessageRow } from "@/lib/types";

export function ChatSidebar({
  bubble,
  currentUser,
  presence,
  messages,
  isLoading,
  isSending,
  onClose,
  onSaveTitle,
  onDelete,
  onSendMessage
}: {
  bubble: BubbleSummary | null;
  currentUser: AppUser | null;
  presence?: BubblePresence;
  messages: MessageRow[];
  isLoading: boolean;
  isSending: boolean;
  onClose: () => void;
  onSaveTitle: (title: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onSendMessage: (content: string) => Promise<boolean>;
}) {
  const [draftTitle, setDraftTitle] = useState(bubble?.title ?? "");
  const [draftMessage, setDraftMessage] = useState("");

  useEffect(() => {
    setDraftTitle(bubble?.title ?? "");
  }, [bubble?.id, bubble?.title]);

  const canEdit = currentUser?.id === bubble?.owner_id;
  const participantsLabel = useMemo(
    () =>
      presence?.participants.length
        ? presence.participants.map((participant) => participant.name).join(", ")
        : "No one is inside this bubble right now.",
    [presence?.participants]
  );

  if (!bubble) {
    return null;
  }

  return (
    <aside className="pointer-events-auto fixed inset-x-3 bottom-3 top-auto z-30 flex max-h-[70vh] flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 shadow-toolbar backdrop-blur-xl md:inset-y-4 md:right-4 md:left-auto md:top-4 md:max-h-none md:w-[27rem]">
      <div className="border-b border-border/70 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              <MessageCircleMore className="size-3.5" />
              Bubble chat
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight">{bubble.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Updated {formatDistanceToNow(new Date(bubble.updated_at), { addSuffix: true })}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-4 rounded-[1.5rem] bg-muted/70 p-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
            <Users className="size-3.5" />
            {presence?.onlineCount ?? 0} active in this bubble
          </div>
          <p className="mt-2 leading-6">{participantsLabel}</p>
        </div>

        {canEdit ? (
          <div className="mt-4 flex items-center gap-2">
            <Input value={draftTitle} maxLength={80} onChange={(event) => setDraftTitle(event.target.value)} />
            <Button
              variant="outline"
              onClick={() => void onSaveTitle(draftTitle)}
              disabled={!draftTitle.trim() || draftTitle.trim() === bubble.title}
            >
              Save
            </Button>
          </div>
        ) : null}
      </div>

      <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {isLoading ? (
          <div className="rounded-[1.5rem] bg-muted/70 p-4 text-sm text-muted-foreground">Loading the thread…</div>
        ) : messages.length ? (
          messages.map((message) => (
            <article
              key={message.id}
              className={`animate-rise rounded-[1.5rem] px-4 py-3 ${message.user_id === currentUser?.id ? "ml-6 bg-secondary/70" : "mr-6 bg-muted/70"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{message.display_name ?? "Explorer"}</p>
                <time className="text-xs text-muted-foreground" dateTime={message.created_at} title={format(new Date(message.created_at), "PPPp")}>
                  {format(new Date(message.created_at), "p")}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">{message.content}</p>
            </article>
          ))
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-border bg-muted/50 p-5 text-sm leading-6 text-muted-foreground">
            No messages yet. Be the first voice in this pocket of the map.
          </div>
        )}
      </div>

      <div className="border-t border-border/70 px-5 py-4">
        {currentUser ? (
          <>
            <Textarea
              placeholder="Say something to everyone here…"
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              {canEdit ? (
                <Button variant="outline" onClick={() => void onDelete()} className="text-destructive hover:text-destructive">
                  <Trash2 className="size-4" />
                  Delete bubble
                </Button>
              ) : (
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Public conversation</p>
              )}
              <Button
                onClick={async () => {
                  const success = await onSendMessage(draftMessage);
                  if (success) {
                    setDraftMessage("");
                  }
                }}
                disabled={isSending || !draftMessage.trim()}
              >
                <Send className="size-4" />
                Send
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-[1.5rem] bg-muted/70 p-4 text-sm leading-6 text-muted-foreground">
            Sign in to join the conversation. You can still explore every bubble anonymously.
          </div>
        )}
      </div>
    </aside>
  );
}
