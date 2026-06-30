import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import "dotenv/config";
import { supabaseAdmin } from "./supabaseAdmin.js";
import { redactSecrets } from "./safety.js";

const root = path.resolve(process.env.PROJECT_ROOT || path.join(process.cwd(), ".."));
const includeExt = new Set([".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".scss", ".html", ".md", ".sql"]);
const excludeDirs = new Set(["node_modules", ".git", "dist", "build", ".next", ".cache", "data", "backups"]);
const excludeFiles = [/^\.env/, /lock$/i, /\.(png|jpg|jpeg|webp|gif|ico|svg)$/i];

async function walk(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!excludeDirs.has(entry.name)) files.push(...(await walk(path.join(dir, entry.name))));
      continue;
    }
    if (excludeFiles.some((pattern) => pattern.test(entry.name))) continue;
    if (includeExt.has(path.extname(entry.name))) files.push(path.join(dir, entry.name));
  }
  return files;
}

function chunks(content: string, size = 3200) {
  const out: string[] = [];
  for (let index = 0; index < content.length; index += size) out.push(content.slice(index, index + size));
  return out;
}

export async function rebuildIndex() {
  if (!supabaseAdmin) throw new Error("Supabase service role is not configured.");
  const files = await walk(root);
  let indexed = 0;
  for (const file of files) {
    const rel = path.relative(root, file).replaceAll("\\", "/");
    const raw = await fs.readFile(file, "utf8");
    const content = redactSecrets(raw.slice(0, 120000));
    const contentHash = crypto.createHash("sha256").update(content).digest("hex");
    const { data: existing } = await supabaseAdmin.from("assistant_project_files").select("id, content_hash").eq("path", rel).maybeSingle();
    if (existing?.content_hash === contentHash) continue;
    const summary = `${rel} (${path.extname(rel).slice(1) || "text"})`;
    const { data: saved, error } = await supabaseAdmin
      .from("assistant_project_files")
      .upsert({ path: rel, file_type: path.extname(rel), content_hash: contentHash, summary, safe_snippet: content.slice(0, 1600), updated_at: new Date().toISOString() }, { onConflict: "path" })
      .select("id")
      .single();
    if (error) throw error;
    await supabaseAdmin.from("assistant_project_chunks").delete().eq("file_id", saved.id);
    const rows = chunks(content).map((chunk, chunk_index) => ({ file_id: saved.id, path: rel, chunk_index, content: chunk }));
    if (rows.length) await supabaseAdmin.from("assistant_project_chunks").insert(rows);
    indexed += 1;
  }
  return { indexed, scanned: files.length };
}

if (import.meta.url === `file://${process.argv[1]?.replaceAll("\\", "/")}`) {
  rebuildIndex()
    .then((result) => console.log(`Indexed ${result.indexed}/${result.scanned} files.`))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
