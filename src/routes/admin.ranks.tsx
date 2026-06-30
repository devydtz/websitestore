import { createFileRoute } from "@tanstack/react-router";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/ranks")({
  head: () => ({ meta: [{ title: "Ranks - Lunaris Admin" }] }),
  component: () => (
    <AdminShell title="Ranks" subtitle="Add, edit, disable, delete, price, perks, and delivery commands for ranks.">
      <AdminCrudPage config={{ table: "ranks", title: "Ranks", itemLabel: "Rank", jsonFields: ["perks", "commands"], extraFields: ["color", "icon", "sort_order"] }} />
    </AdminShell>
  ),
});
