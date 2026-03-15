"use client";

import { useEffect, useState } from "react";

import { DEFAULT_CAMERA } from "@/lib/constants";
import type { CameraState } from "@/lib/types";

const STORAGE_KEY = "chatlas.camera";

export function useCameraState() {
  const [camera, setCamera] = useState<CameraState>(DEFAULT_CAMERA);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setIsHydrated(true);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<CameraState>;
      setCamera({
        x: typeof parsed.x === "number" ? parsed.x : DEFAULT_CAMERA.x,
        y: typeof parsed.y === "number" ? parsed.y : DEFAULT_CAMERA.y,
        zoom: typeof parsed.zoom === "number" ? parsed.zoom : DEFAULT_CAMERA.zoom
      });
    } catch {
      setCamera(DEFAULT_CAMERA);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(camera));
  }, [camera, isHydrated]);

  return {
    camera,
    isHydrated,
    setCamera
  };
}
