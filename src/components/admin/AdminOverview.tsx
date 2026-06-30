import { useEffect, useMemo, useState } from "react";
import { Activity, Boxes, ClipboardCheck, Clock, Gem, KeyRound, Package, Shield, Users } from "lucide-react";
import { AdminCard } from "./AdminShell";
import { dashboardStats, type AdminLog, type RequestRow, type StoreAdminRow } from "@/lib/adminData";

export function AdminOverview() {
  const [data, setData] = useState<Awaited<ReturnType<typeof dashboardStats>> | null>(null);

  useEffect(() => {
    void dashboardStats().then(setData);
  }, []);

  const stats = useMemo(() => {
    const requests = data?.requests ?? [];
    const active = (rows?: StoreAdminRow[]) => (rows ?? []).filter((row) => row.is_active !== false).length;
    return [
      ["Total requests", requests.length, ClipboardCheck],
      ["Pending requests", requests.filter((row) => row.status === "pending" || row.status === "under_review").length, Clock],
      ["Confirmed", requests.filter((row) => row.status === "confirmed").length, Activity],
      ["Rejected", requests.filter((row) => row.status === "rejected").length, Activity],
      ["Completed", requests.filter((row) => row.status === "completed").length, ClipboardCheck],
      ["Active ranks", active(data?.ranks), Shield],
      ["Active crates", active(data?.crates), Boxes],
      ["Active keys", active(data?.keys), KeyRound],
      ["Active bundles", active(data?.bundles), Package],
      ["Active cosmetics", active(data?.cosmetics), Gem],
      ["Admins", data?.admins.length ?? 0, Users],
    ];
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, Icon]) => (
          <AdminCard key={String(label)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-purple-100/60">{label}</p>
                <p className="mt-2 text-3xl font-black">{value}</p>
              </div>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-300/15 text-purple-100">
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </AdminCard>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <RecentList title="Recent admin logs" rows={(data?.logs ?? []).slice(0, 8)} />
        <RecentRequests rows={(data?.requests ?? []).slice(0, 8)} />
      </div>
    </div>
  );
}

function RecentList({ title, rows }: { title: string; rows: AdminLog[] }) {
  return (
    <AdminCard>
      <h2 className="text-xl font-black">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.length === 0 && <p className="text-purple-100/55">No admin logs yet.</p>}
        {rows.map((row) => (
          <div key={row.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="font-bold">{row.action}</p>
            <p className="text-xs text-purple-100/55">{new Date(row.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </AdminCard>
  );
}

function RecentRequests({ rows }: { rows: RequestRow[] }) {
  return (
    <AdminCard>
      <h2 className="text-xl font-black">Recent database changes</h2>
      <div className="mt-4 space-y-3">
        {rows.length === 0 && <p className="text-purple-100/55">No requests yet.</p>}
        {rows.map((row) => (
          <div key={row.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="font-bold">
              {row.request_code} · {row.minecraft_username}
            </p>
            <p className="text-sm text-purple-100/70">{row.item_name}</p>
          </div>
        ))}
      </div>
    </AdminCard>
  );
}
