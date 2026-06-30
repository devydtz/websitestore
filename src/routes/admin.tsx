import { Outlet, createFileRoute, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

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
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === "/admin") {
      void navigate({ to: "/admin/dashboard", replace: true });
    }
  }, [location.pathname, navigate]);

  return <Outlet />;
}
