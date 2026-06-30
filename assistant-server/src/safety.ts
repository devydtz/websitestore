import path from "node:path";

const blockedCommandPatterns = [
  /rm\s+-rf/i,
  /\bdel\s+\/s/i,
  /\bformat\b/i,
  /\bshutdown\b/i,
  /\bgit\s+push\b/i,
  /\bgit\s+reset\s+--hard\b/i,
  /\bnpm\s+publish\b/i,
  /\bwrangler\s+deploy\b/i,
  /\bsupabase\s+db\s+reset\b/i,
  /\b(cat|type)\s+\.env/i,
  /\bcurl\b.*(token|key|secret)/i,
];

const blockedPathParts = [".env", "node_modules", ".git", "dist", "build"];

export function commandIsBlocked(command: string) {
  return blockedCommandPatterns.some((pattern) => pattern.test(command));
}

export function filePathIsBlocked(filePath: string) {
  const normalized = filePath.replaceAll("\\", "/").toLowerCase();
  return blockedPathParts.some((part) => normalized.includes(part));
}

export function resolveInsideProject(root: string, filePath: string) {
  const resolved = path.resolve(root, filePath);
  if (!resolved.startsWith(path.resolve(root))) throw new Error("Path escapes project root.");
  if (filePathIsBlocked(resolved)) throw new Error("Blocked path.");
  return resolved;
}

export function redactSecrets(text: string) {
  return text
    .replace(/(service[_-]?role[_-]?key\s*[:=]\s*)[^\s"']+/gi, "$1[REDACTED]")
    .replace(/(password\s*[:=]\s*)[^\s"']+/gi, "$1[REDACTED]")
    .replace(/(token\s*[:=]\s*)[^\s"']+/gi, "$1[REDACTED]")
    .replace(/(api[_-]?key\s*[:=]\s*)[^\s"']+/gi, "$1[REDACTED]");
}
