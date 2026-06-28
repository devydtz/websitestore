/** Lunaris Craft store-wide settings - update here to keep checkout, nav, and footer in sync. */

export const DISCORD_INVITE_URL = "https://discord.gg/MEmcUGBgDw";

export const STORE_GCASH_NUMBER = "09760064435";
export const STORE_GCASH_DISPLAY = "0976 006 4435";
export const STORE_GCASH_NAME = "Lunaris Craft Store";

export const SERVER_HOST = "mclunaris.fun";
export const SERVER_PORT = "19075";
export const SERVER_IP = `${SERVER_HOST}:${SERVER_PORT}`;

export function formatMobileNumber(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 4) return d;
  if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
  return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
}
