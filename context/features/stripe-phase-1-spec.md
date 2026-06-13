# Stripe Integration - Phase 1: Core Infrastructure

## Overview

Set up Stripe SDK, usage limit utilities, session/auth changes for `IsPro`, checkout flow API, and customer portal API. This phase builds all server-side infrastructure needed before wiring up webhooks and UI.

## Prerequisites

- Stripe Dashboard configured with DevStash Pro product, monthly ($8) and yearly ($72) prices
- Environment variables set: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY`
- Needs update user integration for fields `IsPro`, `StripeCustomerId`, `StripeSubscriptionId` 

## Requirements

- Install `stripe` package
- Initialize Stripe SDK
- Create usage limit utilities with unit tests
- Add `IsPro` also to NextAuth session and JWT types
- Update auth callbacks to sync `IsPro` from database
- Create checkout session API route
- Create customer portal API route

## Notes

- Price IDs stay server-side only (Option B from plan) - client sends `plan: 'monthly' | 'yearly'`, API maps to env var
- Checkout route validates plan value against allowed strings, not raw price IDs
- Customer portal requires prior Stripe customer creation (happens during first checkout)
- No UI changes in this phase - all API routes can be tested with curl/Postman
- Verify usage limit tests pass
- Verify no other errors
