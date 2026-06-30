import { createFileRoute } from "@tanstack/react-router";
import { AdminRequestsPage } from "@/components/admin/AdminRequestsPage";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/requests")({
  head: () => ({ meta: [{ title: "Requests - Lunaris Admin" }] }),
  component: () => (
    <AdminShell title="Requests" subtitle="Review payments, confirm requests, reject bad entries, and add admin notes.">
      <AdminRequestsPage />
    </AdminShell>
  ),
});
