import { endpoint } from "@/lib/server/http";
import { currentUser } from "@/lib/server/session";
export const GET = endpoint(() => currentUser());
