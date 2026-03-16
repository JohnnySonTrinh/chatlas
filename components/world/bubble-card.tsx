"use client";

import { memo, useMemo, useRef } from "react";
import { Grip, Move } from "lucide-react";

import { cn } from "@/lib/utils";
import type { BubbleSummary } from "@/lib/types";

type DraftPatch = Pick<BubbleSummary, "x" | "y" | "width" | "height">;

const BUBBLE_THEMES = [
  {
    background: "linear-gradient(180deg, rgba(255,247,230,0.97) 0%, rgba(255,229,193,0.92) 100%)",
    activeBackground: "linear-gradient(180deg, rgba(255,249,236,0.99) 0%, rgba(255,234,201,0.96) 100%)",
    border: "rgba(229,174,101,0.58)",
    activeBorder: "rgba(205,134,44,0.84)",
    ring: "rgba(214,147,61,0.24)",
    panel: "rgba(255,255,255,0.54)",
    control: "rgba(255,243,218,0.9)",
    icon: "rgba(133,85,28,0.82)"
  },
  {
    background: "linear-gradient(180deg, rgba(234,250,242,0.97) 0%, rgba(207,242,224,0.92) 100%)",
    activeBackground: "linear-gradient(180deg, rgba(239,252,245,0.99) 0%, rgba(214,246,229,0.96) 100%)",
    border: "rgba(107,185,146,0.56)",
    activeBorder: "rgba(64,146,106,0.82)",
    ring: "rgba(88,168,127,0.22)",
    panel: "rgba(255,255,255,0.52)",
    control: "rgba(228,247,237,0.9)",
    icon: "rgba(45,109,79,0.82)"
  },
  {
    background: "linear-gradient(180deg, rgba(236,246,255,0.97) 0%, rgba(209,232,250,0.92) 100%)",
    activeBackground: "linear-gradient(180deg, rgba(241,249,255,0.99) 0%, rgba(216,236,252,0.96) 100%)",
    border: "rgba(108,161,214,0.58)",
    activeBorder: "rgba(61,124,188,0.84)",
    ring: "rgba(74,138,201,0.22)",
    panel: "rgba(255,255,255,0.54)",
    control: "rgba(228,240,250,0.9)",
    icon: "rgba(45,89,137,0.84)"
  },
  {
    background: "linear-gradient(180deg, rgba(255,239,235,0.97) 0%, rgba(250,217,208,0.92) 100%)",
    activeBackground: "linear-gradient(180deg, rgba(255,243,240,0.99) 0%, rgba(252,224,216,0.96) 100%)",
    border: "rgba(214,129,112,0.58)",
    activeBorder: "rgba(186,92,73,0.84)",
    ring: "rgba(203,112,94,0.22)",
    panel: "rgba(255,255,255,0.54)",
    control: "rgba(251,235,230,0.9)",
    icon: "rgba(141,67,52,0.84)"
  },
  {
    background: "linear-gradient(180deg, rgba(252,249,228,0.97) 0%, rgba(244,236,186,0.92) 100%)",
    activeBackground: "linear-gradient(180deg, rgba(253,250,235,0.99) 0%, rgba(247,239,198,0.96) 100%)",
    border: "rgba(197,178,80,0.58)",
    activeBorder: "rgba(168,147,34,0.84)",
    ring: "rgba(184,164,58,0.22)",
    panel: "rgba(255,255,255,0.54)",
    control: "rgba(248,244,218,0.9)",
    icon: "rgba(122,108,28,0.82)"
  },
  {
    background: "linear-gradient(180deg, rgba(249,238,232,0.97) 0%, rgba(236,214,206,0.92) 100%)",
    activeBackground: "linear-gradient(180deg, rgba(251,242,237,0.99) 0%, rgba(241,221,213,0.96) 100%)",
    border: "rgba(179,131,107,0.58)",
    activeBorder: "rgba(150,95,67,0.84)",
    ring: "rgba(165,112,84,0.22)",
    panel: "rgba(255,255,255,0.54)",
    control: "rgba(245,232,226,0.9)",
    icon: "rgba(117,74,52,0.84)"
  },
  {
    background: "linear-gradient(180deg, rgba(241,248,232,0.97) 0%, rgba(223,237,205,0.92) 100%)",
    activeBackground: "linear-gradient(180deg, rgba(245,250,237,0.99) 0%, rgba(228,241,212,0.96) 100%)",
    border: "rgba(139,173,104,0.56)",
    activeBorder: "rgba(104,141,67,0.82)",
    ring: "rgba(121,156,84,0.22)",
    panel: "rgba(255,255,255,0.54)",
    control: "rgba(236,244,227,0.9)",
    icon: "rgba(80,108,49,0.82)"
  },
  {
    background: "linear-gradient(180deg, rgba(236,243,248,0.97) 0%, rgba(211,224,234,0.92) 100%)",
    activeBackground: "linear-gradient(180deg, rgba(241,247,251,0.99) 0%, rgba(217,229,239,0.96) 100%)",
    border: "rgba(115,144,170,0.58)",
    activeBorder: "rgba(73,107,137,0.84)",
    ring: "rgba(93,124,152,0.22)",
    panel: "rgba(255,255,255,0.54)",
    control: "rgba(231,239,245,0.9)",
    icon: "rgba(56,83,107,0.84)"
  }
] as const;

function getBubbleTheme(bubbleId: string) {
  let hash = 0;

  for (let index = 0; index < bubbleId.length; index += 1) {
    hash = (hash * 31 + bubbleId.charCodeAt(index)) >>> 0;
  }

  return BUBBLE_THEMES[hash % BUBBLE_THEMES.length];
}

function BubbleCardComponent({
  bubble,
  active,
  canEdit,
  zoom,
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
  const theme = useMemo(() => getBubbleTheme(bubble.id), [bubble.id]);

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

  const cardStyle = {
    background: active ? theme.activeBackground : theme.background,
    borderColor: active ? theme.activeBorder : theme.border,
    boxShadow: active
      ? `0 0 0 2px ${theme.ring}, 0 24px 48px rgba(90, 70, 40, 0.18)`
      : undefined
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
          active ? "" : "hover:-translate-y-0.5",
          fontScale
        )}
        style={cardStyle}
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
        <div
          className="absolute -bottom-2 left-6 size-5 rotate-45 rounded-sm border"
          style={{
            background: active ? theme.activeBackground : theme.background,
            borderColor: active ? theme.activeBorder : theme.border
          }}
        />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-semibold tracking-tight"
              style={{ color: theme.icon }}
            >
              {bubble.owner_name ?? "Explorer"}
            </p>
          </div>
          {canEdit ? (
            <button
              className="rounded-full p-2 transition"
              style={{
                backgroundColor: theme.control,
                color: theme.icon
              }}
              onPointerDown={handleDragStart}
              aria-label={`Move ${bubble.title}`}
            >
              <Move className="size-4" />
            </button>
          ) : null}
        </div>
        <div
          className="mt-4 flex-1 rounded-[1.5rem] px-4 py-3"
          style={{ backgroundColor: theme.panel }}
        >
          <p className="text-sm leading-6 text-foreground [display:-webkit-box] overflow-hidden [-webkit-box-orient:vertical] [-webkit-line-clamp:6]">
            {bubble.recent_message_preview ?? "Drop the first message in this bubble."}
          </p>
        </div>
      </div>

      {canEdit ? (
        <button
          className="absolute bottom-2 right-2 rounded-full border p-2 shadow-sm transition"
          style={{
            backgroundColor: theme.control,
            borderColor: active ? theme.activeBorder : theme.border,
            color: theme.icon
          }}
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
