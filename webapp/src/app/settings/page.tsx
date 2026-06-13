import { auth } from "@/auth";
import { SettingsClient } from "@/components/settings/SettingsClient";
import { getDisplayName } from "@/lib/auth/user";
import { getProfileStats } from "@/lib/db/profile";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  const stats = await getProfileStats({ accessToken: session?.accessToken });
  const name = getDisplayName(session?.user?.name, session?.user?.email);
  const provider = session?.user?.provider;
  const { tab: initialTab } = await searchParams;

  return (
    <SettingsClient
      sessionName={name}
      sessionEmail={session?.user?.email ?? "No email available"}
      sessionImage={session?.user?.image ?? null}
      isDuendeUser={provider === "duende-identity-server6"}
      identityBaseUrl={process.env.AUTH_DUENDE_ISSUER?.replace(/\/$/, "") ?? ""}
      stats={stats}
      isPro={session?.user?.isPro ?? false}
      initialTab={initialTab === "billing" || initialTab === "account" ? initialTab : undefined}
    />
  );
}
