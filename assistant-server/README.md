# Lunaris Assistant Server

Local private AI backend for the Lunaris Craft admin panel.

## Start

```bash
pnpm install
pnpm dev
```

The server listens on `http://localhost:8789` by default.

## Required Env

Create `assistant-server/.env` locally:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b
ASSISTANT_PORT=8789
PROJECT_ROOT=..
```

Do not commit this file.

## Project Index

Run:

```bash
pnpm index:project
```

It indexes safe project files into Supabase tables:

- `assistant_project_files`
- `assistant_project_chunks`

It excludes `.env`, `node_modules`, `.git`, build outputs, private keys, large binary assets, and images.

## Endpoints

The server exposes `/api/admin/assistant/*` endpoints for status, models, chat, project search, database scans, edit proposals, command approval, conversations, git status, and git diff.

Every endpoint requires a Supabase admin session. Owner/admin-only endpoints are protected again server-side.
