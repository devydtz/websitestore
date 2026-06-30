import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell, AdminCard } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin Login - Lunaris Craft" }] }),
  component: () => (
    <AdminShell title="Admin Login" subtitle="Use your Supabase account, then return to the private dashboard.">
      <AdminCard>
        <p className="text-purple-100/75">
          Admin login uses the website account session. Sign in on the account page with a user that exists in
          <span className="font-bold text-white"> admin_profiles</span>.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/account" className="rounded-full bg-purple-200 px-5 py-3 font-bold text-slate-950">
            Go to account login
          </Link>
          <Link to="/admin/dashboard" className="rounded-full border border-white/15 px-5 py-3 font-bold">
            Open dashboard
          </Link>
        </div>
      </AdminCard>
    </AdminShell>
  ),
});
