import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  const hasGitHubProvider = Boolean(
    process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET,
  );

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <section className="w-full max-w-md rounded-3xl border border-border/70 bg-card p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome to CodeBook</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to your developer knowledge hub.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/api/auth/signin-duende?callbackUrl=%2Fdashboard"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Sign in with Duende
          </Link>
          {hasGitHubProvider ? (
            <Link
              href="/api/auth/signin-github?callbackUrl=%2Fdashboard"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent"
            >
              Sign in with GitHub
            </Link>
          ) : null}
          <Link
            href="/api/auth/register?callbackUrl=%2Fdashboard"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent"
          >
            Register with Duende
          </Link>
        </div>
      </section>
    </main>
  );
}
