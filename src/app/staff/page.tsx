import { redirect } from "next/navigation";
import StudioWorkspace from "@/components/shop/StudioWorkspace";
import { HttpError } from "@/lib/server/http";
import { currentUser } from "@/lib/server/session";

export default async function StaffPage() {
  try {
    await currentUser(true);
  } catch (error) {
    if (error instanceof HttpError && error.status === 401) redirect("/login");
    if (error instanceof HttpError && error.status === 403)
      redirect("/profile");
    throw error;
  }

  return <StudioWorkspace />;
}
