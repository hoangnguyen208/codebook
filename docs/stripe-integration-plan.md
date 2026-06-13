# Stripe Integration Plan

> Comprehensive plan for adding Stripe subscription billing to DevStash Pro ($8/mo or $72/yr).

---

## Table of Contents

- [Current State Analysis](#current-state-analysis)
- [Stripe Dashboard Setup](#stripe-dashboard-setup)
- [Implementation Order](#implementation-order)
- [Phase 1: Stripe SDK & Utilities](#phase-1-stripe-sdk--utilities)
- [Phase 2: Session & Auth Changes](#phase-2-session--auth-changes)
- [Phase 3: Checkout Flow](#phase-3-checkout-flow)
- [Phase 4: Webhook Handler](#phase-4-webhook-handler)
- [Phase 5: Customer Portal](#phase-5-customer-portal)
- [Phase 6: Feature Gating](#phase-6-feature-gating)
- [Phase 7: UI Components](#phase-7-ui-components)
- [Files Summary](#files-summary)
- [Testing Checklist](#testing-checklist)

---

## Current State Analysis

### What's Already in Place (please double check if there is missing)

| Area | Status | Details |
|------|--------|---------|
| **User schema** | Needs update | `IsPro`, `StripeCustomerId`, `StripeSubscriptionId` fields on User integration either on api or identity |
| **Environment variables** | Ready | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY` in env.example |
| **NextAuth v5** | Ready | JWT strategy with `user.id` in session. Needs `isPro` added |
| **Session types** | Needs update | `next-auth.d.ts` only has `id` on session.user |
| **Rate limiting** | Ready | native .NET api, can extend for usage limits |
| **UI Pro badges** | Needs update | Sidebar and NewItemDialog show "PRO" badges on File/Image types |
| **Pricing page** | Needs update | PricingSection.tsx with Free/Pro comparison, monthly/yearly toggle |

### What Needs to Be Built

| Area | Description |
|------|-------------|
| **Stripe SDK** | SDK initialization |
| **Checkout API** | Create checkout sessions |
| **Webhook handler** | Process Stripe events |
| **Customer portal** | Billing management redirect |
| **Usage limits** | Check item/collection limits |
| **Feature gating** | Modify `CreateItem`, `CreateCollection`, upload route |
| **Session isPro** | Add `IsPro` into User model integration and also to JWT callback, session type, auth config |
| **Billing UI** | Billing section on settings page, upgrade prompts |

## Stripe Dashboard Setup

Before writing code, configure these in the [Stripe Dashboard](https://dashboard.stripe.com):

### 1. Create Product

- **Name:** CodeBook Pro
- **Description:** Unlimited items, collections, file uploads, and AI features

### 2. Create Two Prices

| Price | Amount | Interval | Notes |
|-------|--------|----------|-------|
| Monthly | $8.00 USD | Monthly | Copy Price ID to `STRIPE_PRICE_ID_MONTHLY` |
| Yearly | $72.00 USD | Yearly | Copy Price ID to `STRIPE_PRICE_ID_YEARLY` |

### 3. Configure Customer Portal

Go to **Settings > Billing > Customer Portal** and enable:
- Invoice history
- Subscription cancellation
- Subscription plan switching (between monthly/yearly)
- Payment method management

### 4. Create Webhook Endpoint

Go to **Developers > Webhooks** and add:
- **URL:** `https://your-domain.com/api/webhooks/stripe`
- **Events to listen for:**
  - `checkout.session.completed`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Copy the **Signing secret** to `STRIPE_WEBHOOK_SECRET`

### 5. Environment Variables

```env
STRIPE_SECRET_KEY="sk_test_..."          # From API keys
STRIPE_PUBLISHABLE_KEY="pk_test_..."     # From API keys
STRIPE_WEBHOOK_SECRET="whsec_..."        # From webhook endpoint
STRIPE_PRICE_ID_MONTHLY="price_..."      # From monthly price
STRIPE_PRICE_ID_YEARLY="price_..."       # From yearly price
```

---

## Testing Checklist

### Stripe CLI Testing

Use the [Stripe CLI](https://stripe.com/docs/stripe-cli) for local webhook testing:

```bash
# Login
stripe login

# Forward webhooks to local dev
stripe listen --forward-to api.codebook.local:5000/api/webhooks/stripe

# Copy the webhook signing secret and set as STRIPE_WEBHOOK_SECRET
```

### Manual Testing

- [ ] **Checkout Flow**
  - [ ] Click "Upgrade $8/mo" from settings - redirects to Stripe Checkout
  - [ ] Click "Upgrade $72/yr" from settings - redirects to Stripe Checkout
  - [ ] Complete payment with test card `4242 4242 4242 4242`
  - [ ] Redirected back to `/settings?upgraded=true`
  - [ ] "Welcome to CodeBook Pro!" toast appears
  - [ ] Plan shows as "Pro" on settings page
  - [ ] `session.user.isPro` is `true` after page reload

- [ ] **Webhook Processing**
  - [ ] checkour session completes, and sets `IsPro=true`, stores `StripeCustomerId` and `StripeSubscriptionId`
  - [ ] `Invoice.Paid` keeps `IsPro=true`
  - [ ] `Invoice.Payment_failed` logs warning (does not downgrade)
  - [ ] `Customer.Subscription.Deleted` sets `IsPro=false`, clears `StripeSubscriptionId`
  - [ ] `Customer.Subscription.Updated` with `Status=active` keeps `IsPro=true`
  - [ ] `Customer.Subscription.Updated` with `Status=canceled` sets `IsPro=false`

- [ ] **Customer Portal**
  - [ ] Pro user can click "Manage Billing" - redirects to Stripe portal
  - [ ] Can view invoices
  - [ ] Can cancel subscription
  - [ ] Can switch between monthly/yearly
  - [ ] Returns to `/settings` after portal

- [ ] **Feature Gating**
  - [ ] Free user can create up to 50 items
  - [ ] Free user sees error at 50 items: "You have reached the free tier limit..."
  - [ ] Free user can create up to 3 collections
  - [ ] Free user sees error at 3 collections
  - [ ] Free user cannot create File or Image items
  - [ ] Free user cannot upload files (403 from upload route)
  - [ ] Pro user has no limits on items or collections
  - [ ] Pro user can create File and Image items
  - [ ] Pro user can upload files

- [ ] **Session Sync**
  - [ ] After Stripe webhook updates `IsPro`, a page reload reflects the change
  - [ ] No stale `IsPro=false` after successful checkout

- [ ] **Edge Cases**
  - [ ] User who was Pro and cancels: `IsPro` set to `false` after `Subscription.Deleted`
  - [ ] Webhook signature verification fails: returns 400, no DB changes
  - [ ] Duplicate webhook events: idempotent (updateMany is safe)
  - [ ] User without Stripe customer: checkout creates new customer

### Unit Tests to Write

- `GetUserUsage` returns correct counts and limits 
- `CanCreateItem` returns false at limit 
- `CanCreateCollection` returns false at limit
- Pro users bypass all limits
- `CreateItem` rejects file type for free users
- `CreateItem` rejects at item limit 
- `CreateCollection` rejects at collection limit

### Stripe Test Cards

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 3220` | 3D Secure required |

---
