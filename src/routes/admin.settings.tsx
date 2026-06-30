import { createFileRoute } from "@tanstack/react-router";
import { AdminSettingsPage } from "@/components/admin/AdminSettingsPage";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings - Lunaris Admin" }] }),
  component: () => (
    <AdminShell title="Settings" subtitle="Advanced website settings stored safely in Supabase.">
      <AdminSettingsPage />
    </AdminShell>
  ),
});
