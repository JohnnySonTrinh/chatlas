import { Minus, Plus, Sparkles, Target } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FloatingToolbar({
  onCreateBubble,
  onResetCamera,
  onZoomIn,
  onZoomOut,
  canCreate
}: {
  onCreateBubble: () => void;
  onResetCamera: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  canCreate: boolean;
}) {
  return (
    <div className="pointer-events-auto fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/60 bg-white/78 p-2 shadow-toolbar backdrop-blur-xl">
      <Button variant="primary" size="md" onClick={onCreateBubble} disabled={!canCreate}>
        <Sparkles className="size-4" />
        Create bubble
      </Button>
      <Button variant="ghost" size="sm" onClick={onResetCamera} aria-label="Reset camera">
        <Target className="size-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onZoomOut} aria-label="Zoom out">
        <Minus className="size-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={onZoomIn} aria-label="Zoom in">
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
