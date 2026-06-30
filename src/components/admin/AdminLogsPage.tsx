import { useEffect, useState } from "react";
import { AdminCard } from "./AdminShell";
import { listAdminRows, type AdminLog } from "@/lib/adminData";

export function AdminLogsPage() {
  const [rows, setRows] = useState<AdminLog[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    void listAdminRows<AdminLog>("admin_logs").then((result) => {
      if (result.ok) setRows(result.rows);
      else setError(result.error);
    });
  }, []);

  return (
    <AdminCard>
      <h2 className="text-2xl font-black">Admin Logs</h2>
      {error && <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-400/10 p-3 text-red-100">{error}</div>}
      <div className="mt-5 space-y-3">
        {rows.length === 0 && <div className="rounded-3xl border border-dashed border-purple-300/20 p-8 text-center text-purple-100/55">No logs yet.</div>}
        {rows.map((row) => (
          <div key={row.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="font-black">{row.action}</p>
            <p className="text-sm text-purple-100/60">{row.target_type || "system"} · {row.target_id || "none"} · {new Date(row.created_at).toLocaleString()}</p>
            <pre className="mt-3 max-h-40 overflow-auto rounded-2xl bg-black/35 p-3 text-xs text-purple-100/70">{JSON.stringify(row.metadata ?? {}, null, 2)}</pre>
          </div>
        ))}
      </div>
    </AdminCard>
  );
}
