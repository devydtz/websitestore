import { askLunarisCore } from "./aiEngine";

export type LunarisCoreMessage = {
  role: "admin" | "core";
  content: string;
};

export type LunarisCoreMode = "general" | "coder" | "data" | "minecraft" | "security" | "store";

export type LunarisCoreRequestContext = {
  mode?: LunarisCoreMode;
  history?: LunarisCoreMessage[];
};

export async function sendToLunarisCore(message: string, context: LunarisCoreRequestContext = {}) {
  return askLunarisCore(message, context);
}
