import { createFileRoute } from "@tanstack/react-router";
import { AdminAdminsPage } from "@/components/admin/AdminAdminsPage";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/admins")({
  head: () => ({ meta: [{ title: "Admins - Lunaris Admin" }] }),
  component: () => (
    <AdminShell title="Admins" subtitle="Owner-only role management for owner, admin, staff, and viewer access.">
      <AdminAdminsPage />
    </AdminShell>
  ),
});
