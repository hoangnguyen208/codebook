# Auth UI - Sign In, Register & Sign Out

## Overview

Replace NextAuth default pages with custom UI. Update user icon, username or email in bottom of sidebar.

## Requirements

### Landing page

- "Sign in with Duende" button -> route to Duende signin 
- "Sign in with GitHub" button -> connect via Github authorization
- "Register with Duende" button -> route to Duende registration
- If the user is authenticated -> redirects to /dashboard

### Dashboard page: Top nav bar

- Display user avatar if there is (GitHub image or initials fallback as abbreviation of username or email)
- Display user name or email
- Dropdown/up on avatar click with "Sign out" link
- Clicking on the icon should go to "/profile"
- Clicking "Sign out" should log user out, clear sessions and coookies both in client and server, and then route back to the landing page.

## Notes

### Avatar Logic

- If user has `image` (from GitHub): use that
- Otherwise: generate initials from name (e.g., "Bobi Bibo" → "BB")

### Initials Component

Create a reusable avatar component that handles both cases.
