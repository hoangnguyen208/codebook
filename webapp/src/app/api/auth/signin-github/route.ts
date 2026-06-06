import { signIn } from "@/auth";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const callbackUrl = requestUrl.searchParams.get("callbackUrl") ?? "/dashboard";

  return signIn("github", { redirectTo: callbackUrl });
}
