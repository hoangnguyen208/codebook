import { auth } from "@/auth";
import { UpgradeClient } from "@/components/upgrade/UpgradeClient";

export const dynamic = "force-dynamic";

export default async function UpgradePage() {
  const session = await auth();
  const isPro = session?.user?.isPro ?? false;

  return <UpgradeClient isPro={isPro} />;
}
