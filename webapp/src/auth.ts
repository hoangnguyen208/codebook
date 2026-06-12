import NextAuth from "next-auth";
import authConfig from "@/auth.config";

const isProduction = process.env.NODE_ENV === "production";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  ...authConfig,
  ...(isProduction
    ? {}
    : {
        cookies: {
          sessionToken: { options: { secure: false } },
          csrfToken: { options: { secure: false } },
          pkceCodeVerifier: { options: { secure: false } },
          state: { options: { secure: false } },
        },
      }),
});
