"use client";

import { useEffect, useState } from "react";
import { Orbit } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DISPLAY_NAME_LIMIT } from "@/lib/content";
import type { AppUser } from "@/lib/types";

export function AuthPanel({
  supabaseConfigured,
  currentUser,
  guestName,
  pending,
  onJoinAsGuest,
}: {
  supabaseConfigured: boolean;
  currentUser: AppUser | null;
  guestName: string;
  pending: boolean;
  onJoinAsGuest: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState(guestName);

  useEffect(() => {
    if (!currentUser) {
      setName(guestName);
    }
  }, [currentUser, guestName]);

  return (
    <>
      <aside className="pointer-events-none fixed left-4 top-4 z-30">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-secondary-foreground">
          <Orbit className="size-3.5" />
          Chatlas
        </div>
      </aside>

      {!supabaseConfigured ? (
        <div className="pointer-events-auto fixed inset-x-4 top-1/2 z-30 mx-auto w-full max-w-lg -translate-y-1/2 rounded-[2rem] border border-amber-200 bg-white/88 p-6 shadow-toolbar backdrop-blur-xl">
          <p className="text-lg font-semibold tracking-tight text-foreground">
            Supabase keys needed
          </p>
          <p className="mt-3 text-sm leading-6 text-amber-900">
            Add your Supabase URL and publishable or anon key to{" "}
            <code>.env.local</code> to enable realtime persistence.
          </p>
        </div>
      ) : !currentUser ? (
        <div className="pointer-events-auto fixed inset-x-4 top-1/2 z-30 mx-auto w-full max-w-md -translate-y-1/2 rounded-[2rem] border border-white/75 bg-white/88 p-5 shadow-toolbar backdrop-blur-xl">
          <div className="mb-3 px-1 text-sm font-medium tracking-tight text-foreground">
            Enter a display name
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              maxLength={DISPLAY_NAME_LIMIT}
              placeholder="Pick a display name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="sm:flex-1"
            />
            <Button
              onClick={() => void onJoinAsGuest(name)}
              disabled={pending || !name.trim()}
              className="sm:px-6"
            >
              Enter world
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
