export function calculatorTool(message: string) {
  const expression = message
    .toLowerCase()
    .replace(/calculate|what is|php|pesos|,/g, "")
    .replace(/percent/g, "%")
    .trim();

  const percentMatch = expression.match(/(\d+(?:\.\d+)?)\s*%\s*(?:of)?\s*(\d+(?:\.\d+)?)/);
  if (percentMatch) {
    const percent = Number(percentMatch[1]);
    const amount = Number(percentMatch[2]);
    return `${percent}% of ${amount} = ${(amount * percent) / 100}`;
  }

  const safe = expression.replace(/%/g, "/100");
  if (!/^[\d\s+\-*/().]+$/.test(safe)) return "I can only calculate simple math expressions.";
  try {
    const result = Function(`"use strict"; return (${safe})`)() as number;
    if (!Number.isFinite(result)) return "That calculation did not produce a valid number.";
    return `${expression} = ${result}`;
  } catch {
    return "I could not calculate that. Try a simpler expression like 299 + 499 or 10% of 499.";
  }
}
