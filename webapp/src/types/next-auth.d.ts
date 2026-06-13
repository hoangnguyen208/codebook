import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      provider?: string;
      isPro?: boolean;
    };
    accessToken?: string;
    refreshToken?: string;
    stripeCustomerId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    provider?: string;
    isPro?: boolean;
    stripeCustomerId?: string;
    expiresAt?: number;
    isProLastChecked?: number;
  }
}
