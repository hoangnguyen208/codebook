# Stripe Integration - Phase 2: Webhooks, Feature Gating & UI

## Overview

Wire up Stripe webhook handler to sync subscription status, add feature gating to server actions and upload route, build billing UI on settings page, and add upgrade success toast. Requires Stripe CLI for local webhook testing.

## Prerequisites

- Phase 1 complete (Stripe SDK, usage utilities, session `IsPro`, checkout/portal API routes)
- Stripe CLI installed
- Stripe CLI authenticated (`stripe login`)
- Webhook forwarding active: `stripe listen --forward-to /api/webhooks/stripe`
- Copy webhook signing secret from CLI output to `STRIPE_WEBHOOK_SECRET`

## Requirements

- Handle Stripe webhook events to sync subscription status to database
- Gate item creation behind free tier limits
- Gate collection creation behind free tier limits
- Gate file/image uploads behind Pro check
- Add billing section to settings page
- Show upgrade success toast after checkout redirect

## Implementation

### 1. Handle webhooks events

POST endpoint that:
1. Reads raw body with `request.text()` (App Router provides raw body by default)
2. Verifies signature with `stripe.webhooks.constructEvent()`
3. Returns 400 on missing or invalid signature
4. Handles events in a switch statement
5. Returns `{ received: true }` on success

#### Webhook Events

| Event | Handler | Action |
|-------|---------|--------|
| `checkout.session.completed` | `handleCheckoutCompleted` | Set `isPro: true`, store `stripeCustomerId` and `stripeSubscriptionId` |
| `invoice.paid` | `handleInvoicePaid` | Ensure `isPro: true` on renewal |
| `invoice.payment_failed` | `handlePaymentFailed` | Log warning only (Stripe retries, don't downgrade) |
| `customer.subscription.updated` | `handleSubscriptionUpdated` | Set `isPro` based on status (`active`/`trialing` = true, else false) |
| `customer.subscription.deleted` | `handleSubscriptionDeleted` | Set `isPro: false`, clear `stripeSubscriptionId` |

Key details:
- `checkout.session.completed` uses `metadata.userId` to find the user
- All other handlers use `stripeCustomerId` with `updateMany` for idempotency
- Customer/subscription fields may be string or object - handle both with typeof checks

### 2. Modify  `CreateItem`

Add two checks before existing creation logic:
1. **Pro type check:** If `input.typeName` is `file` or `image` and user is not Pro, return error: "File and image uploads require a Pro subscription"
2. **Usage limit check:** Call `CanCreateItem(userId, isPro)` and return error if false: "You have reached the free tier limit of 50 items. Upgrade to Pro for unlimited items."

### 3. Modify `CreateCollection`

Add usage limit check before existing creation logic:
- Call `CanCreateCollection(userId, isPro)` and return error if false: "You have reached the free tier limit of 3 collections. Upgrade to Pro for unlimited collections."

### 4. Modify upload API

Add Pro check after auth check. Since the upload API route may not have the JWT-enhanced session, query `IsPro` directly from the database:

### 5. Create `src/components/settings/billing-settings.tsx`

Client component (`'use client'`) that displays:

**Props:** `isPro: boolean`, `itemCount: number`, `collectionCount: number`

**Layout:**
- Credit card icon + "Billing" heading
- Card container with current plan badge (Pro/Free)
- Free users: usage display (`{itemCount}/50 items` and `{collectionCount}/3 collections`)
- Free users: Two upgrade buttons - "Upgrade $8/mo" (primary) and "Upgrade $72/yr (save 25%)" (outline)
- Pro users: "Manage Billing" button (outline, opens portal)

**Behavior:**
- Upgrade buttons POST to `/api/stripe/checkout` with `{ plan: 'monthly' | 'yearly' }`
- Manage Billing button POSTs to `/api/stripe/portal`
- Both redirect via `window.location.href = data.url`
- Loading states with `Loader2` spinner on active button
- All buttons disabled during any loading state
- Error handling with `toast.error()`

### 6. Modify `src/app/settings/page.tsx`

- Import `BillingSettings` and `getUserUsage`
- Fetch usage data: `const usage = await getUserUsage(user.id, session.user.isPro ?? false)`
- Add `<BillingSettings>` between EditorSettings and AccountSettings sections
- Pass `isPro`, `itemCount`, and `collectionCount` as props

### 7. Upgrade Success Toast

After successful checkout, users redirect to `/settings?upgraded=true`. Handle this in BillingSettings or a wrapper:

- Read `upgraded` param with `useSearchParams()`
- On mount, if `upgraded === 'true'`, show `toast.success('Welcome to DevStash Pro!')`
- Clean up URL with `window.history.replaceState({}, '', '/settings')`

## Testing

### Stripe CLI Webhook Testing

```bash
# Run containers
docker compose up -d

# Terminal 2: Forward webhooks
stripe listen --forward-to api.codebook.local:5000/api/webhooks/stripe

# Terminal 3: Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.paid
stripe trigger customer.subscription.deleted
```

### Manual Testing Checklist

- [ ] **Checkout:** Click upgrade buttons, complete with test card `4242 4242 4242 4242`, verify redirect + toast
- [ ] **Webhook - checkout.session.completed:** User gets `isPro: true`, `stripeCustomerId` and `stripeSubscriptionId` saved
- [ ] **Webhook - invoice.paid:** User stays `isPro: true`
- [ ] **Webhook - customer.subscription.deleted:** User set to `isPro: false`, `stripeSubscriptionId` cleared
- [ ] **Customer Portal:** Pro user clicks "Manage Billing", redirects to Stripe portal, returns to `/settings`
- [ ] **Feature Gating - Items:** Free user blocked at 50 items with upgrade message
- [ ] **Feature Gating - Collections:** Free user blocked at 3 collections with upgrade message
- [ ] **Feature Gating - File/Image:** Free user cannot create file/image items (error message)
- [ ] **Feature Gating - Upload:** Free user gets 403 on upload route
- [ ] **Pro Bypass:** Pro user has no limits on items, collections, or uploads
- [ ] **Session Sync:** After webhook updates `isPro`, page reload reflects new status
- [ ] **Billing UI:** Free user sees usage counts and upgrade buttons; Pro user sees "Manage Billing"

### Stripe Test Cards

| Card | Scenario |
|------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 3220` | 3D Secure required |

## Notes

- Webhook route receives raw body via `request.text()` - no special Next.js config needed
- `updateMany` in webhook handlers is idempotent for duplicate event delivery
- Payment failures only log a warning - Stripe retries automatically, downgrade only on `subscription.deleted`
- PricingSection.tsx on homepage is not modified in this phase (current CTA links to /register which is fine)
- Verify no type errors after all changes
