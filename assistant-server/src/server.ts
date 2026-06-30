import cors from "cors";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import "dotenv/config";
import { requireAdmin, requireOwnerOrAdmin, type AdminRequest } from "./auth.js";
import { defaultModel, isOllamaOnline, listModels } from "./ollama.js";
import { handleChat } from "./chat.js";
import { analyzeDatabase, scanTable } from "./database.js";
import { searchData, searchProject } from "./search.js";
import { rebuildIndex } from "./indexer.js";
import { runApprovedCommand } from "./commands.js";
import { applyFileEdits } from "./diff.js";
import { supabaseAdmin } from "./supabaseAdmin.js";

const app = express();
const port = Number(process.env.ASSISTANT_PORT || 8789);
const projectRoot = path.resolve(process.env.PROJECT_ROOT || path.join(process.cwd(), ".."));
const backupDir = path.resolve(process.env.ASSISTANT_BACKUP_DIR || path.join(process.cwd(), "backups"));

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/admin/assistant/status", requireAdmin, async (_req, res) => {
  res.json({ ok: true, ollama: await isOllamaOnline(), model: defaultModel });
});

app.get("/api/admin/assistant/models", requireAdmin, async (_req, res) => {
  try {
    const installed = await listModels();
    const names = new Set(installed.map((item) => item.name));
    const preferred = ["qwen2.5-coder:7b", "qwen2.5-coder:3b", "qwen3-coder"];
    res.json({ models: preferred.map((name) => ({ name, installed: names.has(name) })) });
  } catch {
    res.status(503).json({ error: "Assistant backend offline." });
  }
});

app.post("/api/admin/assistant/chat", requireAdmin, async (req: AdminRequest, res) => {
  try {
    const result = await handleChat({ adminId: req.admin!.id, message: String(req.body.message || ""), model: req.body.model, conversationId: req.body.conversationId });
    res.json(result);
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : "Assistant backend offline." });
  }
});

app.post("/api/admin/assistant/analyze-project", requireAdmin, async (_req, res) => {
  const result = await searchProject("admin ranks requests bundles checkout supabase", 20);
  res.json({ summary: `Project knowledge returned ${result.length} relevant chunks. Run Rebuild Project Knowledge if this is empty.`, rows: result });
});
app.post("/api/admin/assistant/analyze-database", requireAdmin, async (_req, res) => res.json({ summary: "Database scan complete.", rows: await analyzeDatabase() }));
app.post("/api/admin/assistant/search-project", requireAdmin, async (req, res) => res.json({ rows: await searchProject(String(req.body.query || "")) }));
app.post("/api/admin/assistant/search-data", requireAdmin, async (req, res) => res.json({ rows: await searchData(String(req.body.query || "")) }));
app.post("/api/admin/assistant/scan-ranks", requireAdmin, async (_req, res) => res.json({ rows: await scanTable("ranks") }));
app.post("/api/admin/assistant/scan-crates", requireAdmin, async (_req, res) => res.json({ rows: await scanTable("crates") }));
app.post("/api/admin/assistant/scan-keys", requireAdmin, async (_req, res) => res.json({ rows: await scanTable("crate_keys") }));
app.post("/api/admin/assistant/scan-bundles", requireAdmin, async (_req, res) => res.json({ rows: await scanTable("bundles") }));
app.post("/api/admin/assistant/scan-cosmetics", requireAdmin, async (_req, res) => res.json({ rows: await scanTable("cosmetics") }));
app.post("/api/admin/assistant/scan-admins", requireOwnerOrAdmin, async (_req, res) => res.json({ rows: await scanTable("admin_profiles") }));
app.post("/api/admin/assistant/scan-logs", requireAdmin, async (_req, res) => res.json({ rows: await scanTable("admin_logs") }));
app.post("/api/admin/assistant/rebuild-index", requireOwnerOrAdmin, async (_req, res) => res.json(await rebuildIndex()));

app.post("/api/admin/assistant/propose-edit", requireOwnerOrAdmin, async (req: AdminRequest, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "Supabase service role is not configured." });
  const { data, error } = await supabaseAdmin
    .from("assistant_edit_proposals")
    .insert({ admin_id: req.admin!.id, conversation_id: req.body.conversationId ?? null, title: req.body.title, description: req.body.description, files: req.body.files ?? [], diff: req.body.diff ?? "" })
    .select("*")
    .single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

app.post("/api/admin/assistant/apply-edit", requireOwnerOrAdmin, async (req, res) => {
  const files = Array.isArray(req.body.files) ? req.body.files : [];
  const applied = await applyFileEdits(projectRoot, backupDir, files);
  res.json({ applied });
});

app.post("/api/admin/assistant/run-command", requireOwnerOrAdmin, async (req, res) => {
  if (req.body.approved !== true) return res.status(400).json({ error: "Command approval required." });
  res.json({ output: await runApprovedCommand(String(req.body.command || ""), projectRoot) });
});

app.get("/api/admin/assistant/conversations", requireAdmin, async (req: AdminRequest, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "Supabase service role is not configured." });
  const { data, error } = await supabaseAdmin.from("assistant_conversations").select("*").eq("admin_id", req.admin!.id).order("updated_at", { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ rows: data ?? [] });
});
app.get("/api/admin/assistant/conversations/:id", requireAdmin, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "Supabase service role is not configured." });
  const { data, error } = await supabaseAdmin.from("assistant_messages").select("*").eq("conversation_id", req.params.id).order("created_at", { ascending: true });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ rows: data ?? [] });
});
app.post("/api/admin/assistant/conversations", requireAdmin, async (req: AdminRequest, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "Supabase service role is not configured." });
  const { data, error } = await supabaseAdmin.from("assistant_conversations").insert({ admin_id: req.admin!.id, title: req.body.title ?? "New chat" }).select("*").single();
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});
app.delete("/api/admin/assistant/conversations/:id", requireAdmin, async (req, res) => {
  if (!supabaseAdmin) return res.status(503).json({ error: "Supabase service role is not configured." });
  const { error } = await supabaseAdmin.from("assistant_conversations").delete().eq("id", req.params.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

app.get("/api/admin/assistant/git-status", requireAdmin, async (_req, res) => res.json({ output: await runApprovedCommand("git status --short", projectRoot) }));
app.get("/api/admin/assistant/git-diff", requireAdmin, async (_req, res) => res.json({ output: await runApprovedCommand("git diff -- src supabase assistant-server package.json pnpm-workspace.yaml README.md .env.example", projectRoot) }));

await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true });
await fs.mkdir(backupDir, { recursive: true });
app.listen(port, () => console.log(`Lunaris assistant server running on http://localhost:${port}`));
