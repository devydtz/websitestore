import { createFileRoute } from "@tanstack/react-router";
import { AdminLogsPage } from "@/components/admin/AdminLogsPage";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/logs")({
  head: () => ({ meta: [{ title: "Logs - Lunaris Admin" }] }),
  component: () => (
    <AdminShell title="Logs" subtitle="Audit every admin action and assistant operation.">
      <AdminLogsPage />
    </AdminShell>
  ),
});
