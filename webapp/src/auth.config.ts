import type { NextAuthConfig } from "next-auth";
import DuendeIdentityServer6 from "next-auth/providers/duende-identity-server6";
import GitHub from "next-auth/providers/github";

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

async function fetchDuendeUserInfo(accessToken?: string) {
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
}

const hasGitHubProviderConfig = Boolean(
  process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET,
);

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
      authorization: { params: { scope: "openid profile email offline_access codebook.api" } },
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
    ...(hasGitHubProviderConfig ? [GitHub] : []),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.provider = account.provider;
      }

      if (account?.provider === "duende-identity-server6") {
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

        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }

      if (token.name === "User") {
        if (typeof token.email === "string" && token.email.trim().length > 0) {
          token.name = token.email.trim();
        } else if (typeof token.sub === "string" && token.sub.trim().length > 0) {
          token.name = token.sub.trim();
        }
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

      return session;
    },
  },
};

export default authConfig;
