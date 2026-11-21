import { endpoint } from "@/lib/server/http";
import { signOut } from "@/lib/server/session";
export const POST = endpoint(signOut);
