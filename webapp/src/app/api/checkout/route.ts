import { auth } from "@/auth";
import { getStripeClient, getPriceId } from "@/lib/stripe";
import { NextResponse } from "next/server";

const ALLOWED_PLANS = ["monthly", "yearly"] as const;
type Plan = (typeof ALLOWED_PLANS)[number];

function isValidPlan(value: unknown): value is Plan {
  return typeof value === "string" && (ALLOWED_PLANS as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Request body is required" }, { status: 400 });
  }

  const { plan, successUrl, cancelUrl } = body as Record<string, unknown>;

  if (!isValidPlan(plan)) {
    return NextResponse.json(
      { error: `Invalid plan. Must be one of: ${ALLOWED_PLANS.join(", ")}` },
      { status: 400 }
    );
  }

  if (typeof successUrl !== "string" || !successUrl) {
    return NextResponse.json({ error: "successUrl is required" }, { status: 400 });
  }

  if (typeof cancelUrl !== "string" || !cancelUrl) {
    return NextResponse.json({ error: "cancelUrl is required" }, { status: 400 });
  }

  try {
    const stripe = getStripeClient();
    const priceId = getPriceId(plan);

    const stripeSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: session.user.id,
      customer_email: session.user.email ?? undefined,
      metadata: {
        userId: session.user.id,
      },
    });

    if (!stripeSession.url) {
      return NextResponse.json(
        { error: "Failed to create checkout session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error("Checkout session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
