import NextAuth from "next-auth";
import authConfig from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  ...authConfig,
  cookies: {
    sessionToken: { options: { secure: false } },
    csrfToken: { options: { secure: false } },
    pkceCodeVerifier: { options: { secure: false } },
    state: { options: { secure: false } },
  },
});
