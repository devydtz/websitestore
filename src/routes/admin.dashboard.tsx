import { createFileRoute } from "@tanstack/react-router";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Admin Dashboard - Lunaris Craft" }] }),
  component: () => (
    <AdminShell title="Dashboard" subtitle="Private overview of store requests, products, admins, and recent activity.">
      <AdminOverview />
    </AdminShell>
  ),
});
