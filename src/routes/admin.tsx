import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const AdminPanel = lazy(() =>
  import("@/components/admin/AdminPanel").then((module) => ({ default: module.AdminPanel })),
);

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin - Lunaris Craft" },
      { name: "description", content: "Store administration panel" },
      { property: "og:title", content: "Admin - Lunaris Craft" },
    ],
  }),
  component: AdminRoute,
});

function AdminRoute() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <AdminPanel />
    </Suspense>
  );
}
