"use client";

import { useState } from "react";
import { LogIn, LogOut, Mail, Orbit, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AppUser } from "@/lib/types";

export function AuthPanel({
  supabaseConfigured,
  currentUser,
  guestName,
  pending,
  onMagicLink,
  onGoogle,
  onSignOut
}: {
  supabaseConfigured: boolean;
  currentUser: AppUser | null;
  guestName: string;
  pending: boolean;
  onMagicLink: (email: string) => Promise<void>;
  onGoogle: () => Promise<void>;
  onSignOut: () => Promise<void>;
}) {
  const [email, setEmail] = useState("");

  return (
    <aside className="pointer-events-auto fixed left-4 top-4 z-30 w-[min(24rem,calc(100vw-2rem))] rounded-[2rem] border border-white/70 bg-white/78 p-4 shadow-toolbar backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-secondary-foreground">
            <Orbit className="size-3.5" />
            Chatlas
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">A shared map of conversations.</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Pan the world, zoom into clusters, and drop public chat bubbles wherever conversation wants to happen.
          </p>
        </div>
      </div>

      {!supabaseConfigured ? (
        <div className="mt-4 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Add your Supabase URL and anon key to <code>.env.local</code> to enable auth, realtime, and persistence.
        </div>
      ) : currentUser ? (
        <div className="mt-4 rounded-[1.5rem] border border-border bg-white/75 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <UserRound className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">{currentUser.displayName}</p>
              <p className="text-xs text-muted-foreground">{currentUser.email ?? "Signed in"}</p>
            </div>
          </div>
          <Button className="mt-4 w-full" variant="outline" onClick={() => void onSignOut()} disabled={pending}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-3 rounded-[1.5rem] border border-border bg-white/75 p-4">
          <div className="rounded-[1.25rem] bg-muted/70 px-3 py-2 text-sm text-muted-foreground">
            Exploring as <span className="font-semibold text-foreground">{guestName}</span>. Sign in to create, move, resize, and chat.
          </div>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Button className="w-full" onClick={() => void onMagicLink(email)} disabled={pending || !email.trim()}>
            <Mail className="size-4" />
            Email magic link
          </Button>
          <Button className="w-full" variant="outline" onClick={() => void onGoogle()} disabled={pending}>
            <LogIn className="size-4" />
            Continue with Google
          </Button>
        </div>
      )}
    </aside>
  );
}
