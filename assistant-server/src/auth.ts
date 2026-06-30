import type { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "./supabaseAdmin.js";

export type AdminRequest = Request & {
  admin?: { id: string; role: "owner" | "admin" | "staff" | "viewer"; display_name?: string | null };
};

export async function requireAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  if (!supabaseAdmin) return res.status(503).json({ error: "Supabase service role is not configured." });
  const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Admin session required." });
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData.user) return res.status(401).json({ error: "Invalid admin session." });
  const { data: profile, error } = await supabaseAdmin
    .from("admin_profiles")
    .select("id, role, display_name")
    .eq("id", userData.user.id)
    .maybeSingle();
  if (error || !profile) return res.status(403).json({ error: "Admin profile required." });
  req.admin = profile;
  next();
}

export function requireOwnerOrAdmin(req: AdminRequest, res: Response, next: NextFunction) {
  if (!req.admin || !["owner", "admin"].includes(req.admin.role)) return res.status(403).json({ error: "Owner or admin role required." });
  next();
}
