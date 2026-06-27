export type PasswordStrength = "weak" | "fair" | "good" | "strong";

export function validateUsername(raw: string): string | null {
  const clean = raw.trim().replace(/^\.+/, "");
  if (clean.length < 3 || clean.length > 16) return "Username must be 3-16 characters.";
  if (!/^[A-Za-z0-9_]+$/.test(clean)) return "Only letters, numbers, and underscores.";
  return null;
}

export function validateEmail(email: string): string | null {
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return "Enter a valid email address.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password)) return "Include at least one letter.";
  if (!/\d/.test(password)) return "Include at least one number.";
  return null;
}

export function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) return "weak";
  let score = 0;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length >= 12) score++;
  if (score <= 2) return "fair";
  if (score <= 3) return "good";
  return "strong";
}

export function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function userKey(username: string, edition: string): string {
  return `${edition}:${username.trim().replace(/^\.+/, "").toLowerCase()}`;
}
