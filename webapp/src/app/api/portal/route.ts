import { auth } from "@/auth";
import { getStripeClient } from "@/lib/stripe";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripeCustomerId = session.stripeCustomerId;
  if (!stripeCustomerId) {
    return NextResponse.json(
      { error: "No Stripe customer found. Subscribe first to create a Stripe customer." },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const { returnUrl } = (body as Record<string, unknown> | null) ?? {};

  if (returnUrl && typeof returnUrl !== "string") {
    return NextResponse.json({ error: "returnUrl must be a string" }, { status: 400 });
  }

  try {
    const stripe = getStripeClient();

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: typeof returnUrl === "string" ? returnUrl : undefined,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Portal session error:", error);
    return NextResponse.json(
      { error: "Failed to create customer portal session" },
      { status: 500 }
    );
  }
}
