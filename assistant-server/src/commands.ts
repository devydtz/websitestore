import { exec } from "node:child_process";
import { promisify } from "node:util";
import { commandIsBlocked, redactSecrets } from "./safety.js";

const execAsync = promisify(exec);

export async function runApprovedCommand(command: string, cwd: string) {
  if (commandIsBlocked(command)) throw new Error("Blocked dangerous command.");
  const { stdout, stderr } = await execAsync(command, { cwd, timeout: 120000, windowsHide: true, maxBuffer: 1024 * 1024 * 3 });
  return redactSecrets([stdout, stderr].filter(Boolean).join("\n"));
}
