import type { NextAuthConfig } from "next-auth";
import DuendeIdentityServer6 from "next-auth/providers/duende-identity-server6";

function getStringClaim(profile: Record<string, unknown>, key: string) {
  const value = profile[key];

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function parseJwtPayload(token?: string | null) {
  if (!token) {
    return {};
  }

  const tokenParts = token.split(".");
  if (tokenParts.length < 2) {
    return {};
  }

  try {
    const payloadBase64 = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
    const payloadJson = Buffer.from(payloadBase64, "base64").toString("utf8");
    const parsedPayload = JSON.parse(payloadJson) as unknown;

    if (!parsedPayload || typeof parsedPayload !== "object") {
      return {};
    }

    return parsedPayload as Record<string, unknown>;
  } catch {
    return {};
  }
}

function isTokenExpired(token?: string | null): boolean {
  if (!token) return true;
  const payload = parseJwtPayload(token);
  const exp = payload.exp as number | undefined;
  if (!exp) return true;
  // Refresh if expiring within 60 seconds
  return Date.now() >= (exp - 60) * 1000;
}

async function refreshAccessToken(refreshToken: string) {
  try {
    const issuer = process.env.AUTH_DUENDE_ISSUER;
    const clientId = process.env.AUTH_DUENDE_CLIENT_ID;
    const clientSecret = process.env.AUTH_DUENDE_CLIENT_SECRET;

    if (!issuer || !clientId || !clientSecret) {
      return null;
    }

    const response = await fetch(`${issuer}/connect/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
      cache: "no-store",
    });

    if (!response.ok) return null;

    const tokens = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    };

    return {
      accessToken: tokens.access_token ?? null,
      refreshToken: tokens.refresh_token ?? refreshToken,
      expiresAt: tokens.expires_in
        ? Math.floor(Date.now() / 1000) + tokens.expires_in
        : null,
    };
  } catch {
    return null;
  }
}

async function fetchDuendeUserInfo(accessToken?: string) {
  try {
    const issuer = process.env.AUTH_DUENDE_ISSUER;
    if (!issuer || !accessToken) {
      return {};
    }

    const userInfoUrl = new URL("/connect/userinfo", issuer);
    const response = await fetch(userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {};
    }

    const payload = (await response.json()) as unknown;
    if (!payload || typeof payload !== "object") {
      return {};
    }

    return payload as Record<string, unknown>;
  } catch {
    return {};
  }
}

const authConfig: NextAuthConfig = {
  providers: [
    DuendeIdentityServer6({
      name: "Duende",
      style: {
        logo: "",
      },
      issuer: process.env.AUTH_DUENDE_ISSUER,
      clientId: process.env.AUTH_DUENDE_CLIENT_ID,
      clientSecret: process.env.AUTH_DUENDE_CLIENT_SECRET,
      authorization: { params: { scope: "openid profile email pro offline_access codebook.api" } },
      profile(profile) {
        const claims = profile as Record<string, unknown>;
        const email = getStringClaim(claims, "email");
        const name =
          getStringClaim(claims, "name") ??
          getStringClaim(claims, "preferred_username") ??
          email;

        return {
          id: getStringClaim(claims, "sub") ?? "",
          name: name ?? getStringClaim(claims, "sub") ?? "User",
          email: email ?? null,
          image: null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.provider = account.provider;
      }

      if (account?.provider === "duende-identity-server6") {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at
          ? account.expires_at
          : Math.floor(Date.now() / 1000) + (account.expires_in ?? 3600);

        const profileClaims = (profile ?? {}) as Record<string, unknown>;
        const idTokenClaims = parseJwtPayload(account.id_token);
        const userInfoClaims = await fetchDuendeUserInfo(account.access_token);

        const email =
          getStringClaim(profileClaims, "email") ??
          getStringClaim(idTokenClaims, "email") ??
          getStringClaim(userInfoClaims, "email");
        const name =
          getStringClaim(profileClaims, "name") ??
          getStringClaim(profileClaims, "preferred_username") ??
          getStringClaim(idTokenClaims, "name") ??
          getStringClaim(idTokenClaims, "preferred_username") ??
          getStringClaim(userInfoClaims, "name") ??
          getStringClaim(userInfoClaims, "preferred_username") ??
          email ??
          token.sub;

        if (name) {
          token.name = name;
        }

        if (email) {
          token.email = email;
        }

        // Sync IsPro and StripeCustomerId from Identity claims
        const isProClaim =
          getStringClaim(userInfoClaims, "isPro") ??
          getStringClaim(idTokenClaims, "isPro");
        token.isPro = isProClaim === "true";

        const stripeCustomerIdClaim =
          getStringClaim(userInfoClaims, "stripeCustomerId") ??
          getStringClaim(idTokenClaims, "stripeCustomerId");
        if (stripeCustomerIdClaim) {
          token.stripeCustomerId = stripeCustomerIdClaim;
        }
      }

      // Refresh token if expired
      if (
        typeof token.refreshToken === "string" &&
        isTokenExpired(token.accessToken as string | undefined)
      ) {
        const refreshed = await refreshAccessToken(token.refreshToken);
        if (refreshed?.accessToken) {
          token.accessToken = refreshed.accessToken;
          if (refreshed.refreshToken) {
            token.refreshToken = refreshed.refreshToken;
          }
          token.expiresAt = refreshed.expiresAt;

          // Re-fetch userinfo to get latest isPro after token refresh
          const refreshedUserInfo = await fetchDuendeUserInfo(refreshed.accessToken);
          const refreshedIsPro = getStringClaim(refreshedUserInfo, "isPro");
          if (refreshedIsPro !== undefined) {
            token.isPro = refreshedIsPro === "true";
          }
          const refreshedStripeCustId = getStringClaim(refreshedUserInfo, "stripeCustomerId");
          if (refreshedStripeCustId) {
            token.stripeCustomerId = refreshedStripeCustId;
          }
        }
      }

      if (token.name === "User") {
        if (typeof token.email === "string" && token.email.trim().length > 0) {
          token.name = token.email.trim();
        } else if (typeof token.sub === "string" && token.sub.trim().length > 0) {
          token.name = token.sub.trim();
        }
      }

      // Re-check isPro from Identity every 15 seconds so webhook updates take effect quickly
      const isProAge = (token.isProLastChecked as number) ?? 0;
      if (
        typeof token.accessToken === "string" &&
        typeof token.sub === "string" &&
        Date.now() - isProAge > 15_000
      ) {
        const latestUserInfo = await fetchDuendeUserInfo(token.accessToken);
        const latestIsPro = getStringClaim(latestUserInfo, "isPro");
        if (latestIsPro !== undefined) {
          token.isPro = latestIsPro === "true";
        }
        const latestCustId = getStringClaim(latestUserInfo, "stripeCustomerId");
        if (latestCustId !== undefined) {
          token.stripeCustomerId = latestCustId || undefined;
        }
        token.isProLastChecked = Date.now();
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.sub) {
          session.user.id = token.sub;
        }

        if (typeof token.name === "string") {
          session.user.name = token.name;
        } else if (typeof token.sub === "string") {
          session.user.name = token.sub;
        }

        if (typeof token.email === "string") {
          session.user.email = token.email;
        }

        if (typeof token.picture === "string") {
          session.user.image = token.picture;
        }
      }

      if (typeof token.accessToken === "string") {
        session.accessToken = token.accessToken;
      }

      if (typeof token.refreshToken === "string") {
        session.refreshToken = token.refreshToken;
      }

      if (typeof token.provider === "string") {
        session.user.provider = token.provider;
      }

      if (typeof token.isPro === "boolean") {
        session.user.isPro = token.isPro;
      }

      if (typeof token.stripeCustomerId === "string") {
        session.stripeCustomerId = token.stripeCustomerId;
      }

      return session;
    },
  },
};

export default authConfig;
