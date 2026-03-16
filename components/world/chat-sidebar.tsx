"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { CornerDownRight, EyeOff, Flag, PenSquare, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BUBBLE_TEXT_LIMIT } from "@/lib/content";
import type { AppUser, BubbleSummary } from "@/lib/types";

export function ChatSidebar({
  bubble,
  currentUser,
  pending,
  onClose,
  onDelete,
  onHide,
  onReport,
  onPostToBubble,
  onReplyNearby
}: {
  bubble: BubbleSummary | null;
  currentUser: AppUser | null;
  pending: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
  onHide: () => void;
  onReport: () => Promise<void>;
  onPostToBubble: (content: string) => Promise<boolean>;
  onReplyNearby: (content: string) => Promise<boolean>;
}) {
  const [draftMessage, setDraftMessage] = useState("");

  useEffect(() => {
    setDraftMessage("");
  }, [bubble?.id]);

  const hasText = Boolean(bubble?.recent_message_preview);
  const canEdit = currentUser?.id === bubble?.owner_id;

  const placeholder = useMemo(() => {
    if (hasText) {
      return "Write a reply bubble...";
    }

    if (canEdit) {
      return "Write the first text for this bubble...";
    }

    return "Write a nearby bubble...";
  }, [canEdit, hasText]);

  if (!bubble) {
    return null;
  }

  return (
    <aside className="pointer-events-auto fixed inset-x-3 bottom-3 top-auto z-30 flex max-h-[72vh] flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/92 shadow-toolbar backdrop-blur-xl md:inset-y-4 md:right-4 md:left-auto md:top-4 md:max-h-none md:w-[24rem]">
      <div className="border-b border-border/70 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold tracking-tight text-foreground">
              {bubble.owner_name ?? "Explorer"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Updated {formatDistanceToNow(new Date(bubble.updated_at), { addSuffix: true })}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-4">
        <div className="rounded-[1.6rem] bg-muted/60 p-4">
          <p className="text-sm leading-6 text-foreground">
            {bubble.recent_message_preview ?? "This bubble is empty for now."}
          </p>
        </div>

        <div className="mt-4 rounded-[1.5rem] border border-dashed border-border/70 bg-white/50 p-4 text-sm leading-6 text-muted-foreground">
          Replies do not go inside this bubble. They become new bubbles placed nearby on the map.
        </div>
      </div>

      <div className="border-t border-border/70 px-5 py-4">
        {currentUser ? (
          <>
            <Textarea
              placeholder={placeholder}
              maxLength={BUBBLE_TEXT_LIMIT}
              value={draftMessage}
              onChange={(event) => setDraftMessage(event.target.value)}
            />
            <div className="mt-2 text-right text-xs text-muted-foreground">
              {draftMessage.trim().length}/{BUBBLE_TEXT_LIMIT}
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onHide}>
                  <EyeOff className="size-4" />
                  Hide
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => void onReport()}
                  disabled={pending || !currentUser}
                  title={currentUser ? "Report bubble" : "Pick a display name to report bubbles"}
                >
                  <Flag className="size-4" />
                  Report
                </Button>
                {canEdit ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void onDelete()}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                {!hasText && canEdit ? (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const success = await onPostToBubble(draftMessage);
                      if (success) {
                        setDraftMessage("");
                      }
                    }}
                    disabled={pending || !draftMessage.trim()}
                  >
                    <PenSquare className="size-4" />
                    Post here
                  </Button>
                ) : null}

                <Button
                  onClick={async () => {
                    const success = await onReplyNearby(draftMessage);
                    if (success) {
                      setDraftMessage("");
                    }
                  }}
                  disabled={pending || !draftMessage.trim()}
                >
                  <CornerDownRight className="size-4" />
                  Reply bubble
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="rounded-[1.5rem] bg-muted/70 p-4 text-sm leading-6 text-muted-foreground">
              Pick a display name to drop your own bubble reply or send a report.
            </div>
            <Button variant="ghost" size="sm" onClick={onHide}>
              <EyeOff className="size-4" />
              Hide bubble
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
