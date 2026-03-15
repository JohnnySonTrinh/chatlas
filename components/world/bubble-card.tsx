"use client";

import { memo, useMemo, useRef } from "react";
import { Grip, MessageCircleMore, Move, Users2 } from "lucide-react";

import { cn, truncate } from "@/lib/utils";
import type { BubblePresence, BubbleSummary } from "@/lib/types";

type DraftPatch = Pick<BubbleSummary, "x" | "y" | "width" | "height">;

function BubbleCardComponent({
  bubble,
  active,
  canEdit,
  zoom,
  presence,
  onSelect,
  onMovePreview,
  onMoveCommit,
  onResizePreview,
  onResizeCommit
}: {
  bubble: BubbleSummary;
  active: boolean;
  canEdit: boolean;
  zoom: number;
  presence?: BubblePresence;
  onSelect: (bubbleId: string) => void;
  onMovePreview: (bubbleId: string, patch: Partial<DraftPatch>) => void;
  onMoveCommit: (bubbleId: string, patch: Partial<DraftPatch>) => void;
  onResizePreview: (bubbleId: string, patch: Partial<DraftPatch>) => void;
  onResizeCommit: (bubbleId: string, patch: Partial<DraftPatch>) => void;
}) {
  const dragState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  } | null>(null);
  const resizeState = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    initialWidth: number;
    initialHeight: number;
  } | null>(null);

  const fontScale = useMemo(() => cn(zoom < 0.6 ? "opacity-80" : "opacity-100"), [zoom]);

  const handleDragStart = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!canEdit) {
      return;
    }

    event.stopPropagation();
    onSelect(bubble.id);

    const pointerId = event.pointerId;
    dragState.current = {
      pointerId,
      startX: event.clientX,
      startY: event.clientY,
      initialX: bubble.x,
      initialY: bubble.y
    };

    const handleMove = (moveEvent: PointerEvent) => {
      if (!dragState.current || moveEvent.pointerId !== pointerId) {
        return;
      }

      const nextX = dragState.current.initialX + (moveEvent.clientX - dragState.current.startX) / zoom;
      const nextY = dragState.current.initialY + (moveEvent.clientY - dragState.current.startY) / zoom;
      onMovePreview(bubble.id, { x: nextX, y: nextY });
    };

    const handleUp = (upEvent: PointerEvent) => {
      if (!dragState.current || upEvent.pointerId !== pointerId) {
        return;
      }

      const nextX = dragState.current.initialX + (upEvent.clientX - dragState.current.startX) / zoom;
      const nextY = dragState.current.initialY + (upEvent.clientY - dragState.current.startY) / zoom;
      onMoveCommit(bubble.id, { x: nextX, y: nextY });
      dragState.current = null;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const handleResizeStart = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!canEdit) {
      return;
    }

    event.stopPropagation();
    onSelect(bubble.id);

    const pointerId = event.pointerId;
    resizeState.current = {
      pointerId,
      startX: event.clientX,
      startY: event.clientY,
      initialWidth: bubble.width,
      initialHeight: bubble.height
    };

    const handleMove = (moveEvent: PointerEvent) => {
      if (!resizeState.current || moveEvent.pointerId !== pointerId) {
        return;
      }

      const nextWidth = resizeState.current.initialWidth + (moveEvent.clientX - resizeState.current.startX) / zoom;
      const nextHeight = resizeState.current.initialHeight + (moveEvent.clientY - resizeState.current.startY) / zoom;
      onResizePreview(bubble.id, { width: nextWidth, height: nextHeight });
    };

    const handleUp = (upEvent: PointerEvent) => {
      if (!resizeState.current || upEvent.pointerId !== pointerId) {
        return;
      }

      const nextWidth = resizeState.current.initialWidth + (upEvent.clientX - resizeState.current.startX) / zoom;
      const nextHeight = resizeState.current.initialHeight + (upEvent.clientY - resizeState.current.startY) / zoom;
      onResizeCommit(bubble.id, { width: nextWidth, height: nextHeight });
      resizeState.current = null;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  return (
    <article
      className={cn(
        "group pointer-events-auto absolute overflow-visible",
        active ? "z-20" : "z-10"
      )}
      style={{
        transform: `translate3d(${bubble.x}px, ${bubble.y}px, 0)`,
        width: bubble.width,
        height: bubble.height
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div
        className={cn(
          "relative flex h-full w-full flex-col overflow-hidden rounded-[2rem] border px-4 pb-4 pt-3 text-left shadow-bubble transition duration-200",
          active
            ? "border-primary/50 bg-white ring-2 ring-primary/30"
            : "border-white/75 bg-white/88 hover:border-primary/40 hover:bg-white",
          fontScale
        )}
        role="button"
        tabIndex={0}
        onClick={() => onSelect(bubble.id)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(bubble.id);
          }
        }}
      >
        <div className="absolute -bottom-2 left-6 size-5 rotate-45 rounded-sm border border-white/80 bg-white/88" />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight text-foreground">{bubble.title}</p>
            <div className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Users2 className="size-3.5" />
                {presence?.onlineCount ?? 0} live
              </span>
              <span>{bubble.participant_count} voices</span>
            </div>
          </div>
          {canEdit ? (
            <button
              className="rounded-full bg-muted/80 p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              onPointerDown={handleDragStart}
              aria-label={`Move ${bubble.title}`}
            >
              <Move className="size-4" />
            </button>
          ) : null}
        </div>
        <div className="mt-4 flex-1">
          <div className="rounded-[1.5rem] bg-muted/70 p-3 text-sm leading-6 text-muted-foreground">
            <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">
              <MessageCircleMore className="size-3.5" />
              Recent
            </div>
            {bubble.recent_message_preview ? truncate(bubble.recent_message_preview, 110) : "Start the vibe in this pocket of the map."}
          </div>
        </div>
      </div>

      {canEdit ? (
        <button
          className="absolute bottom-2 right-2 rounded-full border border-white/70 bg-white/80 p-2 text-muted-foreground shadow-sm transition hover:text-foreground"
          onPointerDown={handleResizeStart}
          aria-label={`Resize ${bubble.title}`}
        >
          <Grip className="size-4" />
        </button>
      ) : null}
    </article>
  );
}

export const BubbleCard = memo(BubbleCardComponent);
