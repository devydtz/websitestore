import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { AdminCard } from "./AdminShell";
import { listAdminRows, updateRequest, type RequestRow, type RequestStatus } from "@/lib/adminData";

const statuses: Array<RequestStatus | "all"> = ["all", "pending", "under_review", "confirmed", "rejected", "completed", "cancelled"];

export function AdminRequestsPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<RequestStatus | "all">("all");
  const [message, setMessage] = useState("");

  async function load() {
    const result = await listAdminRows<RequestRow>("requests");
    if (result.ok) setRows(result.rows);
    else setMessage(result.error);
  }

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const lower = query.toLowerCase();
    return rows.filter((row) => {
      const matchesStatus = status === "all" || row.status === status;
      const matchesText = [row.minecraft_username, row.request_code, row.item_name, row.contact].some((item) => String(item ?? "").toLowerCase().includes(lower));
      return matchesStatus && matchesText;
    });
  }, [query, rows, status]);

  async function setRequestStatus(id: string, next: RequestStatus) {
    const result = await updateRequest(id, { status: next }, `${next}_request`);
    setMessage(result.ok ? `Request marked ${next}.` : result.error);
    await load();
  }

  return (
    <AdminCard>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-black">All Requests</h2>
          <p className="text-sm text-purple-100/60">Search, verify, confirm, reject, or complete customer requests.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="flex items-center gap-2 rounded-full border border-purple-300/20 bg-black/35 px-4 py-2">
            <Search className="h-4 w-4 text-purple-200" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search username..." className="bg-transparent text-sm outline-none" />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value as RequestStatus | "all")} className="rounded-full border border-purple-300/20 bg-black/60 px-4 py-2 text-sm outline-none">
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>
      {message && <div className="mt-4 rounded-2xl border border-purple-300/20 bg-purple-300/10 p-3 text-sm">{message}</div>}
      <div className="mt-5 space-y-3">
        {filtered.length === 0 && <div className="rounded-3xl border border-dashed border-purple-300/20 p-8 text-center text-purple-100/55">No requests found.</div>}
        {filtered.map((row) => (
          <div key={row.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <Link to="/admin/requests/$id" params={{ id: row.id }} className="text-lg font-black hover:text-purple-200">
                  {row.request_code} · {row.minecraft_username}
                </Link>
                <p className="text-sm text-purple-100/65">{row.item_name} · PHP {Number(row.amount ?? 0).toLocaleString()} · {row.status}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["confirmed", "rejected", "completed"] as RequestStatus[]).map((next) => (
                  <button key={next} onClick={() => setRequestStatus(row.id, next)} className="rounded-full border border-purple-300/20 px-3 py-2 text-xs font-bold hover:bg-purple-300/10">
                    {next}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminCard>
  );
}
