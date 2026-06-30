import fs from "node:fs/promises";
import path from "node:path";
import { resolveInsideProject } from "./safety.js";

export async function createBackup(root: string, filePath: string, backupDir: string) {
  const resolved = resolveInsideProject(root, filePath);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `${stamp}-${filePath.replace(/[\\/:]/g, "_")}`);
  await fs.mkdir(path.dirname(backupPath), { recursive: true });
  await fs.copyFile(resolved, backupPath);
  return backupPath;
}

export async function applyFileEdits(root: string, backupDir: string, files: Array<{ path: string; content: string }>) {
  const applied: string[] = [];
  for (const file of files) {
    const resolved = resolveInsideProject(root, file.path);
    await createBackup(root, file.path, backupDir);
    await fs.writeFile(resolved, file.content, "utf8");
    applied.push(file.path);
  }
  return applied;
}
