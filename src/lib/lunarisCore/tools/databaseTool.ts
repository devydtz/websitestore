import { scanDatabase } from "../databaseScanner";

export async function databaseTool(message: string) {
  return scanDatabase(message);
}
