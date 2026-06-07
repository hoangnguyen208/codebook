# Rate Limiting for Auth

## Overview

Implement rate limiting on authentication endpoints to prevent brute force attacks, credential stuffing, and abuse of email-sending endpoints.

## Requirements

- Add rate limiting to auth-related API routes
- Create reusable rate limiting utility
- Return appropriate error responses (429 Too Many Requests)
- Display user-friendly error messages on the frontend

## Endpoints to Protect

| login | 5 attempts | 15 min | IP + email |
| register | 3 attempts | 1 hour | IP |
| forgot password | 3 attempts | 1 hour | IP |
| reset password | 5 attempts | 15 min | IP |
| email verification | 3 attempts | 15 min | IP + email |

## Implementation

- Implement in Duende Identity Server with .NET built-in rate limiting middleware
- Use sliding window algorithm for smooth limiting
- Extract the real user's IP via Kestrel for now with `RemoteIpAddress`, not entirely trust on `x-forwarded-for` header 
- Combine IP + identifier (email) where applicable for tighter limits
- Return `{ success, remaining, reset }` from rate limit checks

## Error Handling

- API returns 429 status with JSON: `{ error: "Too many attempts. Please try again in X minutes." }`
- Frontend displays error via toast notification
- Include `Retry-After` header in 429 responses

