"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GripHorizontal } from "lucide-react";

import { WORLD_INITIAL_BOUNDS } from "@/lib/constants";
import type { BubbleSummary, CameraState } from "@/lib/types";
import { clamp } from "@/lib/utils";

const MINIMAP_WIDTH = 184;
const MINIMAP_HEIGHT = 184;
const HEATMAP_GRID_SIZE = 18;
const MINIMAP_MARGIN = 16;
const MINIMAP_POSITION_STORAGE_KEY = "chatlas:minimap-position";

interface HeatCell {
  x: number;
  y: number;
  intensity: number;
}

interface MinimapPosition {
  x: number;
  y: number;
}

function toMinimapX(worldX: number) {
  return (
    ((worldX - WORLD_INITIAL_BOUNDS.minX) /
      (WORLD_INITIAL_BOUNDS.maxX - WORLD_INITIAL_BOUNDS.minX)) *
    MINIMAP_WIDTH
  );
}

function toMinimapY(worldY: number) {
  return (
    ((worldY - WORLD_INITIAL_BOUNDS.minY) /
      (WORLD_INITIAL_BOUNDS.maxY - WORLD_INITIAL_BOUNDS.minY)) *
    MINIMAP_HEIGHT
  );
}

function toWorldX(minimapX: number) {
  return (
    WORLD_INITIAL_BOUNDS.minX +
    (minimapX / MINIMAP_WIDTH) *
      (WORLD_INITIAL_BOUNDS.maxX - WORLD_INITIAL_BOUNDS.minX)
  );
}

function toWorldY(minimapY: number) {
  return (
    WORLD_INITIAL_BOUNDS.minY +
    (minimapY / MINIMAP_HEIGHT) *
      (WORLD_INITIAL_BOUNDS.maxY - WORLD_INITIAL_BOUNDS.minY)
  );
}

function buildHeatCells(bubbles: BubbleSummary[]) {
  const counts = new Map<string, number>();
  let maxCount = 0;

  for (const bubble of bubbles) {
    const centerX = bubble.x + bubble.width / 2;
    const centerY = bubble.y + bubble.height / 2;
    const gridX = clamp(
      Math.floor(
        ((centerX - WORLD_INITIAL_BOUNDS.minX) /
          (WORLD_INITIAL_BOUNDS.maxX - WORLD_INITIAL_BOUNDS.minX)) *
          HEATMAP_GRID_SIZE,
      ),
      0,
      HEATMAP_GRID_SIZE - 1,
    );
    const gridY = clamp(
      Math.floor(
        ((centerY - WORLD_INITIAL_BOUNDS.minY) /
          (WORLD_INITIAL_BOUNDS.maxY - WORLD_INITIAL_BOUNDS.minY)) *
          HEATMAP_GRID_SIZE,
      ),
      0,
      HEATMAP_GRID_SIZE - 1,
    );
    const key = `${gridX}:${gridY}`;
    const nextCount = (counts.get(key) ?? 0) + 1;
    counts.set(key, nextCount);
    maxCount = Math.max(maxCount, nextCount);
  }

  if (maxCount === 0) {
    return [] as HeatCell[];
  }

  return Array.from(counts.entries()).map(([key, count]) => {
    const [gridX, gridY] = key.split(":").map(Number);

    return {
      x: (gridX / HEATMAP_GRID_SIZE) * MINIMAP_WIDTH,
      y: (gridY / HEATMAP_GRID_SIZE) * MINIMAP_HEIGHT,
      intensity: count / maxCount,
    };
  });
}

function clampMinimapPosition(
  position: MinimapPosition,
  panelWidth: number,
  panelHeight: number,
  viewportWidth: number,
  viewportHeight: number,
) {
  return {
    x: clamp(
      position.x,
      MINIMAP_MARGIN,
      Math.max(MINIMAP_MARGIN, viewportWidth - panelWidth - MINIMAP_MARGIN),
    ),
    y: clamp(
      position.y,
      MINIMAP_MARGIN,
      Math.max(MINIMAP_MARGIN, viewportHeight - panelHeight - MINIMAP_MARGIN),
    ),
  };
}

export function Minimap({
  bubbles,
  camera,
  viewportSize,
  onNavigate,
}: {
  bubbles: BubbleSummary[];
  camera: CameraState;
  viewportSize: {
    width: number;
    height: number;
  };
  onNavigate: (position: Pick<CameraState, "x" | "y">) => void;
}) {
  const heatCells = useMemo(() => buildHeatCells(bubbles), [bubbles]);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<MinimapPosition | null>(null);

  const viewportRect = useMemo(() => {
    const viewWidth =
      viewportSize.width > 0 ? viewportSize.width / camera.zoom : 0;
    const viewHeight =
      viewportSize.height > 0 ? viewportSize.height / camera.zoom : 0;
    const left = clamp(
      camera.x - viewWidth / 2,
      WORLD_INITIAL_BOUNDS.minX,
      WORLD_INITIAL_BOUNDS.maxX,
    );
    const top = clamp(
      camera.y - viewHeight / 2,
      WORLD_INITIAL_BOUNDS.minY,
      WORLD_INITIAL_BOUNDS.maxY,
    );
    const right = clamp(
      camera.x + viewWidth / 2,
      WORLD_INITIAL_BOUNDS.minX,
      WORLD_INITIAL_BOUNDS.maxX,
    );
    const bottom = clamp(
      camera.y + viewHeight / 2,
      WORLD_INITIAL_BOUNDS.minY,
      WORLD_INITIAL_BOUNDS.maxY,
    );

    return {
      x: toMinimapX(left),
      y: toMinimapY(top),
      width: Math.max(10, toMinimapX(right) - toMinimapX(left)),
      height: Math.max(10, toMinimapY(bottom) - toMinimapY(top)),
    };
  }, [
    camera.x,
    camera.y,
    camera.zoom,
    viewportSize.height,
    viewportSize.width,
  ]);

  const handleNavigate = (
    clientX: number,
    clientY: number,
    bounds: DOMRect,
  ) => {
    const minimapX = clamp(clientX - bounds.left, 0, MINIMAP_WIDTH);
    const minimapY = clamp(clientY - bounds.top, 0, MINIMAP_HEIGHT);

    onNavigate({
      x: clamp(
        toWorldX(minimapX),
        WORLD_INITIAL_BOUNDS.minX,
        WORLD_INITIAL_BOUNDS.maxX,
      ),
      y: clamp(
        toWorldY(minimapY),
        WORLD_INITIAL_BOUNDS.minY,
        WORLD_INITIAL_BOUNDS.maxY,
      ),
    });
  };

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || viewportSize.width === 0 || viewportSize.height === 0) {
      return;
    }

    const panelWidth = panel.offsetWidth;
    const panelHeight = panel.offsetHeight;
    const defaultPosition = {
      x: viewportSize.width - panelWidth - MINIMAP_MARGIN,
      y: viewportSize.height - panelHeight - MINIMAP_MARGIN,
    };

    let storedPosition: MinimapPosition | null = null;

    try {
      const raw = window.localStorage.getItem(MINIMAP_POSITION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<MinimapPosition>;
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          storedPosition = {
            x: parsed.x,
            y: parsed.y,
          };
        }
      }
    } catch {
      storedPosition = null;
    }

    setPosition((current) =>
      clampMinimapPosition(
        current ?? storedPosition ?? defaultPosition,
        panelWidth,
        panelHeight,
        viewportSize.width,
        viewportSize.height,
      ),
    );
  }, [viewportSize.height, viewportSize.width]);

  useEffect(() => {
    if (!position) {
      return;
    }

    try {
      window.localStorage.setItem(
        MINIMAP_POSITION_STORAGE_KEY,
        JSON.stringify(position),
      );
    } catch {
      // Ignore storage failures and keep the live position.
    }
  }, [position]);

  const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    const panel = panelRef.current;
    if (!panel || viewportSize.width === 0 || viewportSize.height === 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const bounds = panel.getBoundingClientRect();
    const origin = position ?? {
      x: viewportSize.width - bounds.width - MINIMAP_MARGIN,
      y: viewportSize.height - bounds.height - MINIMAP_MARGIN,
    };

    const handleMove = (moveEvent: PointerEvent) => {
      setPosition(
        clampMinimapPosition(
          {
            x: origin.x + moveEvent.clientX - event.clientX,
            y: origin.y + moveEvent.clientY - event.clientY,
          },
          bounds.width,
          bounds.height,
          viewportSize.width,
          viewportSize.height,
        ),
      );
    };

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  return (
    <div
      className="pointer-events-auto absolute z-30"
      style={{
        left: position?.x,
        top: position?.y,
        visibility: position ? "visible" : "hidden",
      }}
    >
      <div
        ref={panelRef}
        className="rounded-[1.85rem] border border-white/70 bg-white/78 p-3 shadow-toolbar backdrop-blur-xl transition-transform duration-200 hover:scale-[1.04]"
      >
        <div
          className="mb-2 flex cursor-grab items-center justify-between gap-3 rounded-[1.1rem] px-1 py-1 active:cursor-grabbing"
          onPointerDown={handleDragStart}
          style={{ touchAction: "none" }}
        >
          <div className="flex items-center gap-2">
            <GripHorizontal className="size-4 text-muted-foreground" />
          </div>
          <div className="rounded-full bg-muted/80 px-2.5 py-1 text-[11px] font-semibold text-foreground">
            {bubbles.length}
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-[1.35rem] border border-white/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.14))]"
          style={{ width: MINIMAP_WIDTH, height: MINIMAP_HEIGHT }}
          onPointerDown={(event) => {
            event.stopPropagation();
            const bounds = event.currentTarget.getBoundingClientRect();
            handleNavigate(event.clientX, event.clientY, bounds);

            const handleMove = (moveEvent: PointerEvent) => {
              handleNavigate(moveEvent.clientX, moveEvent.clientY, bounds);
            };

            const handleUp = () => {
              window.removeEventListener("pointermove", handleMove);
              window.removeEventListener("pointerup", handleUp);
            };

            window.addEventListener("pointermove", handleMove);
            window.addEventListener("pointerup", handleUp);
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_48%),linear-gradient(180deg,rgba(15,23,42,0.12),rgba(15,23,42,0.02))]" />

          <svg
            className="absolute inset-0 h-full w-full"
            viewBox={`0 0 ${MINIMAP_WIDTH} ${MINIMAP_HEIGHT}`}
            aria-hidden="true"
          >
            <defs>
              <filter id="minimap-blur">
                <feGaussianBlur stdDeviation="3.5" />
              </filter>
            </defs>

            <rect
              x="0.5"
              y="0.5"
              width={MINIMAP_WIDTH - 1}
              height={MINIMAP_HEIGHT - 1}
              rx="22"
              fill="transparent"
              stroke="rgba(255,255,255,0.18)"
            />

            {heatCells.map((cell) => (
              <g key={`${cell.x}:${cell.y}`}>
                <rect
                  x={cell.x}
                  y={cell.y}
                  width={MINIMAP_WIDTH / HEATMAP_GRID_SIZE}
                  height={MINIMAP_HEIGHT / HEATMAP_GRID_SIZE}
                  fill={`rgba(255, 138, 61, ${0.14 + cell.intensity * 0.44})`}
                />
                <circle
                  cx={cell.x + MINIMAP_WIDTH / (HEATMAP_GRID_SIZE * 2)}
                  cy={cell.y + MINIMAP_HEIGHT / (HEATMAP_GRID_SIZE * 2)}
                  r={8 + cell.intensity * 14}
                  fill={`rgba(250, 104, 52, ${0.18 + cell.intensity * 0.34})`}
                  filter="url(#minimap-blur)"
                />
              </g>
            ))}

            {bubbles.slice(0, 120).map((bubble) => {
              const centerX = bubble.x + bubble.width / 2;
              const centerY = bubble.y + bubble.height / 2;

              return (
                <circle
                  key={bubble.id}
                  cx={toMinimapX(centerX)}
                  cy={toMinimapY(centerY)}
                  r="1.5"
                  fill="rgba(255,255,255,0.78)"
                />
              );
            })}

            <rect
              x={viewportRect.x}
              y={viewportRect.y}
              width={viewportRect.width}
              height={viewportRect.height}
              rx="8"
              fill="rgba(255,255,255,0.08)"
              stroke="rgba(125, 211, 252, 0.95)"
              strokeWidth="1.5"
            />
          </svg>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-slate-950/14 to-transparent" />
        </div>
      </div>
    </div>
  );
}
