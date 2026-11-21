import { randomUUID } from "node:crypto";
export function notification(text: string) {
  return { mailId: randomUUID(), mailState: "pending", mailText: text };
}
