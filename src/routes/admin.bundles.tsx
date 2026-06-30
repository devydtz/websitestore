import { createFileRoute } from "@tanstack/react-router";
import { AdminCrudPage } from "@/components/admin/AdminCrudPage";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/bundles")({
  head: () => ({ meta: [{ title: "Bundles - Lunaris Admin" }] }),
  component: () => (
    <AdminShell title="Bundles" subtitle="Build bundles manually from ranks, keys, crates, cosmetics, or custom items.">
      <AdminCrudPage config={{ table: "bundles", title: "Bundles", itemLabel: "Bundle", jsonFields: ["items", "commands"], extraFields: ["compare_at_price", "color", "icon", "sort_order"] }} />
    </AdminShell>
  ),
});
