import Link from "next/link";
import {
  Code2,
  Sparkles,
  Terminal,
  FileText,
  File,
  FileImage,
  Link2,
  FolderOpen,
  Layers3,
  KeyRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { auth } from "@/auth";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";
import { getDisplayName } from "@/lib/auth/user";
import { getProfileStats } from "@/lib/db/profile";

export const dynamic = "force-dynamic";

const ICON_MAP: Record<string, LucideIcon> = {
  code: Code2,
  code2: Code2,
  sparkles: Sparkles,
  terminal: Terminal,
  stickynote: FileText,
  filetext: FileText,
  "file-text": FileText,
  file: File,
  image: FileImage,
  fileimage: FileImage,
  link: Link2,
  link2: Link2,
};

const COLOR_CLASS_MAP: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  yellow: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  slate: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

function getIconComponent(icon: string | null): LucideIcon {
  if (!icon) return File;
  return ICON_MAP[icon.toLowerCase().trim()] ?? File;
}

function getColorClass(colorToken: string) {
  return COLOR_CLASS_MAP[colorToken] ?? COLOR_CLASS_MAP.slate;
}

export default async function ProfilePage() {
  const session = await auth();
  const stats = await getProfileStats({ accessToken: session?.accessToken });
  const name = getDisplayName(session?.user?.name, session?.user?.email);
  const email = session?.user?.email ?? "No email available";
  const provider = session?.user?.provider;
  const isDuendeUser = provider === "duende-identity-server6";
  const identityBaseUrl = process.env.AUTH_DUENDE_ISSUER?.replace(/\/$/, "") ?? "";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-8">
      {/* User info */}
      <section className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <UserAvatar
            nameOrEmail={name}
            imageUrl={session?.user?.image}
            className="size-16 shrink-0"
            textClassName="text-xl"
          />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-semibold">{name}</h1>
            <p className="truncate text-sm text-muted-foreground">{email}</p>
          </div>
          <span className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            {isDuendeUser ? "Email & Password" : "GitHub"}
          </span>
        </div>
      </section>

      {/* Usage stats */}
      <section className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Usage</h2>
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
            const colorClass = getColorClass(typeStat.colorToken);
            return (
              <div
                key={typeStat.typeId}
                className="flex flex-col gap-1 rounded-xl border border-border/50 bg-muted/30 px-4 py-3"
              >
                <span className={`inline-flex size-6 items-center justify-center rounded-md ${colorClass}`}>
                  <Icon className="size-3.5" />
                </span>
                <span className="text-xl font-bold tabular-nums">{typeStat.count}</span>
                <span className="text-xs text-muted-foreground">{typeStat.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Account actions */}
      <section className="rounded-3xl border border-border/70 bg-card p-8 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Account</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium hover:bg-accent transition-colors"
          >
            Back to dashboard
          </Link>
          <Link
            href="/api/auth/signout-all"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium hover:bg-accent transition-colors"
          >
            Sign out
          </Link>
          {isDuendeUser && (
            <Link
              href={`${identityBaseUrl}/Account/Manage/ChangePassword`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-medium hover:bg-accent transition-colors"
            >
              <KeyRound className="size-4" />
              Change password
            </Link>
          )}
          <DeleteAccountDialog />
        </div>
      </section>
    </main>
  );
}

