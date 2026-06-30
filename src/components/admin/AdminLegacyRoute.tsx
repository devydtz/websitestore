import { lazy, Suspense } from "react";
import { useLocation } from "@tanstack/react-router";
import { AssistantFloatingButton } from "./AssistantFloatingButton";

const AdminPanel = lazy(() =>
  import("@/components/admin/AdminPanel").then((module) => ({ default: module.AdminPanel })),
);

export function AdminLegacyRoute() {
  const location = useLocation();
  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <AdminPanel />
      </Suspense>
      <AssistantFloatingButton currentPage={location.pathname} />
    </>
  );
}
