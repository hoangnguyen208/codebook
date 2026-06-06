import Link from "next/link";

import { auth } from "@/auth";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { getDisplayName } from "@/lib/auth/user";

export default async function ProfilePage() {
  const session = await auth();
  const name = getDisplayName(session?.user?.name, session?.user?.email);
  const email = session?.user?.email ?? "No email available";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-8">
      <section className="w-full rounded-3xl border border-border/70 bg-card p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <UserAvatar
            nameOrEmail={name}
            imageUrl={session?.user?.image}
            className="size-16"
            textClassName="text-xl"
          />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold">{name}</h1>
            <p className="truncate text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium hover:bg-accent"
          >
            Back to dashboard
          </Link>
          <Link
            href="/api/auth/signout-all"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-destructive px-4 text-sm font-medium text-destructive-foreground hover:opacity-90"
          >
            Sign out
          </Link>
        </div>
      </section>
    </main>
  );
}
