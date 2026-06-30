import { askLunarisCore } from "./aiEngine";

export type LunarisCoreMessage = {
  role: "admin" | "core";
  content: string;
};

export async function sendToLunarisCore(message: string) {
  return askLunarisCore(message);
}
