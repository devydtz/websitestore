import { askLunarisCore } from "./aiEngine";

export type LunarisCoreMessage = {
  role: "admin" | "core";
  content: string;
  attachments?: LunarisCoreAttachment[];
  generatedImages?: LunarisCoreGeneratedImage[];
  tools?: LunarisCoreToolTrace[];
};

export type LunarisCoreMode = "general" | "coder" | "data" | "minecraft" | "security" | "store";

export type LunarisCoreAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  kind: "image" | "text" | "data" | "file";
  preview?: string;
  text?: string;
};

export type LunarisCoreToolTrace = {
  name: string;
  status: "running" | "done" | "error";
  summary: string;
  output?: string;
};

export type LunarisCoreGeneratedImage = {
  id: string;
  prompt: string;
  url: string;
};

export type LunarisCoreRequestContext = {
  mode?: LunarisCoreMode;
  history?: LunarisCoreMessage[];
  attachments?: LunarisCoreAttachment[];
};

export async function sendToLunarisCore(message: string, context: LunarisCoreRequestContext = {}) {
  return askLunarisCore(message, context);
}
