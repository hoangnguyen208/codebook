import Link from "next/link";
import { KeyRound } from "lucide-react";

import { auth } from "@/auth";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  const provider = session?.user?.provider;
  const isDuendeUser = provider === "duende-identity-server6";
  const identityBaseUrl = process.env.AUTH_DUENDE_ISSUER?.replace(/\/$/, "") ?? "";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>

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
            Sign out all sessions
          </Link>
          {isDuendeUser ? (
            <Link
              href={`${identityBaseUrl}/Account/Manage/ChangePassword`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-medium hover:bg-accent transition-colors"
            >
              <KeyRound className="size-4" />
              Change password
            </Link>
          ) : null}
          <DeleteAccountDialog />
        </div>
      </section>
    </main>
  );
}
