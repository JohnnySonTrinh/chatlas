import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { DISPLAY_NAME_LIMIT } from "@/lib/content";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function formatPresenceName(input: string) {
  return input.trim().slice(0, DISPLAY_NAME_LIMIT) || "Explorer";
}

export function truncate(input: string | null | undefined, length = 80) {
  if (!input) {
    return "";
  }

  return input.length > length ? `${input.slice(0, length - 1)}…` : input;
}

export function makeGuestName() {
  return `Guest ${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
