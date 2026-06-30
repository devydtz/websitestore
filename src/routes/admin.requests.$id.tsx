import { createFileRoute } from "@tanstack/react-router";
import { AdminRequestDetailPage } from "@/components/admin/AdminRequestDetailPage";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/requests/$id")({
  head: () => ({ meta: [{ title: "Request Detail - Lunaris Admin" }] }),
  component: RequestDetailRoute,
});

function RequestDetailRoute() {
  const { id } = Route.useParams();
  return (
    <AdminShell title="Request Detail" subtitle="Full customer request view with notes and status controls.">
      <AdminRequestDetailPage id={id} />
    </AdminShell>
  );
}
