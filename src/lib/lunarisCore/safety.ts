const secretPatterns = [/service[_-]?role/i, /api[_-]?key/i, /token/i, /password/i, /\.env/i, /secret/i];

export function isSensitiveText(value: string) {
  return secretPatterns.some((pattern) => pattern.test(value));
}

export function safeText(value: unknown) {
  return String(value ?? "")
    .replace(/(service[_-]?role[_-]?key\s*[:=]\s*)[^\s"']+/gi, "$1[hidden]")
    .replace(/(api[_-]?key\s*[:=]\s*)[^\s"']+/gi, "$1[hidden]")
    .replace(/(token\s*[:=]\s*)[^\s"']+/gi, "$1[hidden]")
    .replace(/(password\s*[:=]\s*)[^\s"']+/gi, "$1[hidden]");
}

export function formatToolAnswer(answer: string, source: string, next = "Ask another question or use a quick action.") {
  return `${answer}\n\nSource/tool used: ${source}\n\nNext action: ${next}`;
}
