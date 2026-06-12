import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Navbar } from "@/components/marketing/Navbar";
import { ChaosContainer } from "@/components/marketing/ChaosContainer";
import { TransformArrow } from "@/components/marketing/TransformArrow";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import { Features } from "@/components/marketing/Features";
import { AISection } from "@/components/marketing/AISection";
import { Pricing } from "@/components/marketing/Pricing";
import { Footer } from "@/components/marketing/Footer";
import { SectionHeader } from "@/components/marketing/SectionHeader";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  const registerUrl = "/api/auth/register?callbackUrl=%2Fdashboard";
  const githubUrl = "/api/auth/signin-github?callbackUrl=%2Fdashboard";

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Stop Losing Your{" "}
            <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-pink-500 bg-clip-text text-transparent">
              Developer Knowledge
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Your code snippets, prompts, commands, and docs are scattered across
            Notion, GitHub, Slack, and your browser bookmarks. Bring them
            together in one searchable, organized hub.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href={registerUrl}
              prefetch={false}
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-blue-500 text-white hover:bg-blue-600"
              )}
            >
              Get Started Free
            </Link>
            <a
              href="#features"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" })
              )}
            >
              See Features
            </a>
            <Link
              href={githubUrl}
              prefetch={false}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" })
              )}
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="mr-1.5 size-4"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Sign in with GitHub
            </Link>
          </div>
        </div>

        {/* Chaos → Arrow → Dashboard */}
        <div className="mx-auto mt-16 max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
            <ChaosContainer />
            <TransformArrow />
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeader
            title="Everything You Need"
            description="All your developer knowledge types, unified in one place."
          />
          <Features />
        </div>
      </section>

      {/* AI Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <AISection />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeader
            title="Simple, Transparent Pricing"
            description="Start free. Upgrade when you need AI superpowers."
          />
          <Pricing />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to Organize Your Knowledge?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Join developers who have already stopped hunting through tabs and
            bookmarks.
          </p>
          <Link
            href={registerUrl}
            prefetch={false}
            className={cn(
              buttonVariants({ size: "lg" }),
              "mt-6 bg-blue-500 text-white hover:bg-blue-600"
            )}
          >
            Get Started Free
          </Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
