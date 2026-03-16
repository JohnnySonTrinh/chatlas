"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  CAMERA_LIMITS,
  CLUSTER_CELL_SIZE,
  CLUSTER_ZOOM_THRESHOLD,
  VIEWPORT_CULLING_MARGIN,
  WORLD_INITIAL_BOUNDS,
} from "@/lib/constants";
import { clamp, cn } from "@/lib/utils";
import type { BubbleSummary, CameraState, ClusterNode } from "@/lib/types";
import { BubbleCard } from "@/components/world/bubble-card";
import { Minimap } from "@/components/world/minimap";

function getVisibleBounds(camera: CameraState, width: number, height: number) {
  return {
    left: camera.x - width / (2 * camera.zoom) - VIEWPORT_CULLING_MARGIN,
    right: camera.x + width / (2 * camera.zoom) + VIEWPORT_CULLING_MARGIN,
    top: camera.y - height / (2 * camera.zoom) - VIEWPORT_CULLING_MARGIN,
    bottom: camera.y + height / (2 * camera.zoom) + VIEWPORT_CULLING_MARGIN,
  };
}

function createClusters(bubbles: BubbleSummary[]) {
  const cells = new Map<string, ClusterNode>();

  bubbles.forEach((bubble) => {
    const centerX = bubble.x + bubble.width / 2;
    const centerY = bubble.y + bubble.height / 2;
    const cellX = Math.floor(centerX / CLUSTER_CELL_SIZE);
    const cellY = Math.floor(centerY / CLUSTER_CELL_SIZE);
    const key = `${cellX}:${cellY}`;
    const existing = cells.get(key);

    if (existing) {
      const nextCount = existing.count + 1;
      existing.x = (existing.x * existing.count + centerX) / nextCount;
      existing.y = (existing.y * existing.count + centerY) / nextCount;
      existing.count = nextCount;
      return;
    }

    cells.set(key, {
      id: key,
      x: centerX,
      y: centerY,
      count: 1,
    });
  });

  return Array.from(cells.values());
}

export function WorldViewport({
  bubbles,
  camera,
  selectedBubbleId,
  currentUserId,
  onSelectBubble,
  onCreateBubble,
  onUpdateCamera,
  onPreviewBubble,
  onCommitBubble,
}: {
  bubbles: BubbleSummary[];
  camera: CameraState;
  selectedBubbleId: string | null;
  currentUserId: string | null;
  onSelectBubble: (bubbleId: string | null) => void;
  onCreateBubble: () => void;
  onUpdateCamera: (camera: CameraState) => void;
  onPreviewBubble: (
    bubbleId: string,
    patch: Partial<Pick<BubbleSummary, "x" | "y" | "width" | "height">>,
  ) => void;
  onCommitBubble: (
    bubbleId: string,
    patch: Partial<Pick<BubbleSummary, "x" | "y" | "width" | "height">>,
  ) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panFrame = useRef<number | null>(null);
  const nextCamera = useRef(camera);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      setViewportSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    nextCamera.current = camera;
  }, [camera]);

  const visibleBounds = useMemo(
    () => getVisibleBounds(camera, viewportSize.width, viewportSize.height),
    [camera, viewportSize.height, viewportSize.width],
  );

  const visibleBubbles = useMemo(
    () =>
      bubbles.filter((bubble) => {
        const right = bubble.x + bubble.width;
        const bottom = bubble.y + bubble.height;
        return (
          right >= visibleBounds.left &&
          bubble.x <= visibleBounds.right &&
          bottom >= visibleBounds.top &&
          bubble.y <= visibleBounds.bottom
        );
      }),
    [
      bubbles,
      visibleBounds.bottom,
      visibleBounds.left,
      visibleBounds.right,
      visibleBounds.top,
    ],
  );

  const clusters = useMemo(
    () => createClusters(visibleBubbles),
    [visibleBubbles],
  );

  const queueCameraUpdate = (next: CameraState) => {
    nextCamera.current = next;

    if (panFrame.current) {
      cancelAnimationFrame(panFrame.current);
    }

    panFrame.current = requestAnimationFrame(() => {
      onUpdateCamera(nextCamera.current);
    });
  };

  useEffect(
    () => () => {
      if (panFrame.current) {
        cancelAnimationFrame(panFrame.current);
      }
    },
    [],
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    const startCamera = nextCamera.current;
    const startX = event.clientX;
    const startY = event.clientY;
    let moved = false;

    const handleMove = (moveEvent: PointerEvent) => {
      moved = true;
      const deltaX = (moveEvent.clientX - startX) / startCamera.zoom;
      const deltaY = (moveEvent.clientY - startY) / startCamera.zoom;
      queueCameraUpdate({
        ...startCamera,
        x: clamp(
          startCamera.x - deltaX,
          WORLD_INITIAL_BOUNDS.minX,
          WORLD_INITIAL_BOUNDS.maxX,
        ),
        y: clamp(
          startCamera.y - deltaY,
          WORLD_INITIAL_BOUNDS.minY,
          WORLD_INITIAL_BOUNDS.maxY,
        ),
      });
    };

    const handleUp = () => {
      if (!moved) {
        onSelectBubble(null);
      }

      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const worldX = camera.x + (screenX - rect.width / 2) / camera.zoom;
    const worldY = camera.y + (screenY - rect.height / 2) / camera.zoom;
    const delta = event.deltaY;
    const zoomFactor = Math.exp(-delta * 0.0013);
    const nextZoom = clamp(
      camera.zoom * zoomFactor,
      CAMERA_LIMITS.minZoom,
      CAMERA_LIMITS.maxZoom,
    );

    queueCameraUpdate({
      x: clamp(
        worldX - (screenX - rect.width / 2) / nextZoom,
        WORLD_INITIAL_BOUNDS.minX,
        WORLD_INITIAL_BOUNDS.maxX,
      ),
      y: clamp(
        worldY - (screenY - rect.height / 2) / nextZoom,
        WORLD_INITIAL_BOUNDS.minY,
        WORLD_INITIAL_BOUNDS.maxY,
      ),
      zoom: nextZoom,
    });
  };

  return (
    <div
      ref={containerRef}
      className="world-haze world-grid relative h-screen w-full cursor-grab overflow-hidden active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onWheel={handleWheel}
      style={{ touchAction: "none" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.28),transparent_60%)]" />

      <div
        className="absolute left-1/2 top-1/2 origin-top-left"
        style={{
          transform: `translate3d(${-camera.x * camera.zoom}px, ${-camera.y * camera.zoom}px, 0) scale(${camera.zoom})`,
        }}
      >
        <div className="pointer-events-none absolute left-[-1px] top-[-20000px] h-[40000px] w-[2px] bg-primary/8" />
        <div className="pointer-events-none absolute left-[-20000px] top-[-1px] h-[2px] w-[40000px] bg-primary/8" />

        {camera.zoom < CLUSTER_ZOOM_THRESHOLD
          ? clusters.map((cluster) => (
              <button
                key={cluster.id}
                className="pointer-events-auto absolute flex items-center gap-3 rounded-full border border-white/70 bg-white/90 px-4 py-3 text-sm font-semibold shadow-bubble transition hover:bg-white"
                style={{
                  transform: `translate3d(${cluster.x}px, ${cluster.y}px, 0) translate(-50%, -50%)`,
                }}
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() =>
                  onUpdateCamera({
                    x: cluster.x,
                    y: cluster.y,
                    zoom: clamp(
                      Math.max(camera.zoom * 1.42, 0.8),
                      CAMERA_LIMITS.minZoom,
                      CAMERA_LIMITS.maxZoom,
                    ),
                  })
                }
              >
                <span className="relative flex size-3">
                  <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-primary/40" />
                  <span className="relative inline-flex size-3 rounded-full bg-primary" />
                </span>
                {cluster.count} bubbles nearby
              </button>
            ))
          : visibleBubbles.map((bubble) => (
              <BubbleCard
                key={bubble.id}
                bubble={bubble}
                active={selectedBubbleId === bubble.id}
                canEdit={currentUserId === bubble.owner_id}
                zoom={camera.zoom}
                onSelect={onSelectBubble}
                onMovePreview={onPreviewBubble}
                onMoveCommit={onCommitBubble}
                onResizePreview={onPreviewBubble}
                onResizeCommit={onCommitBubble}
              />
            ))}
      </div>

      <Minimap
        bubbles={bubbles}
        camera={camera}
        viewportSize={viewportSize}
        onNavigate={({ x, y }) =>
          onUpdateCamera({
            ...camera,
            x,
            y,
          })
        }
      />

      {camera.zoom >= CLUSTER_ZOOM_THRESHOLD && visibleBubbles.length === 0 ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 mx-auto max-w-md -translate-y-1/2 rounded-[2rem] border border-dashed border-white/70 bg-white/70 px-6 py-5 text-center shadow-bubble backdrop-blur-xl">
          <p className="text-lg font-semibold tracking-tight text-foreground">
            Quiet patch of the map.
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Pan toward another cluster or create a new bubble at the center to
            start a fresh public conversation.
          </p>
          <button
            className={cn(
              "pointer-events-auto mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90",
            )}
            onClick={onCreateBubble}
          >
            Create a bubble here
          </button>
        </div>
      ) : null}
    </div>
  );
}
