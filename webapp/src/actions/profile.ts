"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import { auth } from "@/auth";

export async function deleteAccountAction() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const provider = session.user.provider;

  if (provider === "duende-identity-server6") {
    const issuer = process.env.AUTH_DUENDE_ISSUER?.replace(/\/$/, "");
    redirect(`${issuer}/Account/Manage/DeleteAccount`);
  }

  await signOut({ redirectTo: "/" });
}
