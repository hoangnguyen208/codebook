"use client";

import { useState } from "react";
import Link from "next/link";
import { Code2, File, FileImage, FileText, FolderOpen, KeyRound, Layers3, Link2, Sparkles, Terminal } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { UserAvatar } from "@/components/auth/UserAvatar";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";
import { EditorPreferencesSection } from "@/components/settings/EditorPreferencesSection";
import { BillingSettings } from "@/components/settings/billing-settings";

const ICON_MAP: Record<string, LucideIcon> = {
  code: Code2, code2: Code2, sparkles: Sparkles, terminal: Terminal,
  stickynote: FileText, filetext: FileText, "file-text": FileText,
  file: File, image: FileImage, fileimage: FileImage, link: Link2, link2: Link2,
};

const COLOR_CLASS_MAP: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-300", purple: "bg-purple-500/10 text-purple-300",
  orange: "bg-orange-500/10 text-orange-300", yellow: "bg-yellow-500/10 text-yellow-300",
  slate: "bg-slate-500/10 text-slate-300", pink: "bg-pink-500/10 text-pink-300",
  emerald: "bg-emerald-500/10 text-emerald-300",
};

function getIconComponent(icon: string | null): LucideIcon {
  if (!icon) return File;
  return ICON_MAP[icon.toLowerCase().trim()] ?? File;
}

type Props = {
  sessionName: string;
  sessionEmail: string;
  sessionImage: string | null;
  isDuendeUser: boolean;
  identityBaseUrl: string;
  isPro: boolean;
  initialTab?: "billing" | "account";
  stats: {
    totalCollections: number;
    totalItems: number;
    typeBreakdown: Array<{ typeId: string; icon: string | null; colorToken: string; label: string; count: number }>;
  };
};

export function SettingsClient({ sessionName, sessionEmail, sessionImage, isDuendeUser, identityBaseUrl, isPro, initialTab, stats }: Props) {
  const [tab, setTab] = useState<"editor" | "billing" | "account">(initialTab ?? "editor");

  const sidebarLink = (id: "editor" | "billing" | "account", label: string) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`block w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
        tab === id ? "text-foreground bg-accent/50 font-medium" : "text-muted-foreground hover:text-foreground hover:bg-accent"
      }`}
    >
      {label}
    </button>
  );

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="space-y-1">
            <Link href="/dashboard" className="block rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              Back to dashboard
            </Link>
            <div className="mt-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3">Settings</div>
            {sidebarLink("editor", "Editor")}
            {sidebarLink("billing", "Billing")}
            {sidebarLink("account", "Account")}
          </nav>
        </aside>

        <div className="min-w-0 flex-1 space-y-8">
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

          {tab === "editor" ? (
            <div id="editor">
              <EditorPreferencesSection />
            </div>
          ) : tab === "billing" ? (
            <div id="billing">
              <BillingSettings isPro={isPro} itemCount={stats.totalItems} collectionCount={stats.totalCollections} />
            </div>
          ) : (
            <div id="account" className="space-y-6">
              <section className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm">
                <div className="flex items-center gap-4">
                  <UserAvatar nameOrEmail={sessionName} imageUrl={sessionImage} className="size-16 shrink-0" textClassName="text-xl" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-xl font-semibold">{sessionName}</h2>
                    <p className="truncate text-sm text-muted-foreground">{sessionEmail}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                    {isDuendeUser ? "Email & Password" : "GitHub"}
                  </span>
                </div>
              </section>

              <section className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm">
                <h2 className="mb-1 text-base font-semibold">Usage</h2>
                <p className="mb-6 text-sm text-muted-foreground">Overview of your data across the platform.</p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div className="flex flex-col gap-1 rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                    <FolderOpen className="size-4 text-muted-foreground" />
                    <span className="text-xl font-bold tabular-nums">{stats.totalCollections}</span>
                    <span className="text-xs text-muted-foreground">Collections</span>
                  </div>
                  <div className="flex flex-col gap-1 rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                    <Layers3 className="size-4 text-muted-foreground" />
                    <span className="text-xl font-bold tabular-nums">{stats.totalItems}</span>
                    <span className="text-xs text-muted-foreground">Total items</span>
                  </div>
                  {stats.typeBreakdown.map((typeStat) => {
                    const Icon = getIconComponent(typeStat.icon);
                    return (
                      <div key={typeStat.typeId} className="flex flex-col gap-1 rounded-xl border border-border/50 bg-muted/30 px-4 py-3">
                        <span className={`inline-flex size-6 items-center justify-center rounded-md ${COLOR_CLASS_MAP[typeStat.colorToken] ?? ""}`}>
                          <Icon className="size-3.5" />
                        </span>
                        <span className="text-xl font-bold tabular-nums">{typeStat.count}</span>
                        <span className="text-xs text-muted-foreground">{typeStat.label}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm">
                <h2 className="mb-1 text-base font-semibold">Account</h2>
                <p className="mb-6 text-sm text-muted-foreground">Manage your account security and sessions.</p>
                <div className="flex flex-wrap gap-3">
                  {isDuendeUser ? (
                    <Link href={`${identityBaseUrl}/Account/Manage/ChangePassword`} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-medium hover:bg-accent transition-colors">
                      <KeyRound className="size-4" />
                      Change password
                    </Link>
                  ) : null}
                  <Link href="/api/auth/signout-all" className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium hover:bg-accent transition-colors">
                    Sign out all sessions
                  </Link>
                  <DeleteAccountDialog />
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
