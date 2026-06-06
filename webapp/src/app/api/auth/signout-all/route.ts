import { signOut } from "@/auth";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const appBaseUrl = process.env.AUTH_URL ?? requestUrl.origin;
  const duendeIssuer = process.env.AUTH_DUENDE_ISSUER;
  const duendeClientId = process.env.AUTH_DUENDE_CLIENT_ID;

  if (!duendeIssuer) {
    return signOut({ redirectTo: "/" });
  }

  const duendeSignOutUrl = new URL("/connect/endsession", duendeIssuer);
  duendeSignOutUrl.searchParams.set("post_logout_redirect_uri", `${appBaseUrl}/`);

  if (duendeClientId) {
    duendeSignOutUrl.searchParams.set("client_id", duendeClientId);
  }

  return signOut({ redirectTo: duendeSignOutUrl.toString() });
}
