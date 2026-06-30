import { calculatorTool } from "./calculatorTool";

export function codeRunnerTool(message: string) {
  if (/^[\d\s+\-*/().,%]+$/.test(message) || /\b(calculate|percent|percentage|total|minus|plus)\b/i.test(message)) {
    return calculatorTool(message);
  }

  return [
    "Safe code execution is intentionally limited in the browser build.",
    "I can analyze CSV/JSON text, calculate totals, and generate reports, but I will not run unrestricted shell code or access private files.",
  ].join("\n");
}
