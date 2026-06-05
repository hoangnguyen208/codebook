import type { NextAuthConfig } from "next-auth";
import DuendeIdentityServer6 from "next-auth/providers/duende-identity-server6";
import GitHub from "next-auth/providers/github";

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
    }),
    GitHub
  ],
  callbacks: {
    jwt({ token, account }) {
      if (account?.provider === "duende-identity-server6") {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      if (typeof token.accessToken === "string") {
        session.accessToken = token.accessToken;
      }

      if (typeof token.refreshToken === "string") {
        session.refreshToken = token.refreshToken;
      }

      return session;
    },
  },
};

export default authConfig;
