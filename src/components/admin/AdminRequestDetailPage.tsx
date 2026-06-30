import { FormEvent, useEffect, useState } from "react";
import { Save } from "lucide-react";
import { AdminCard } from "./AdminShell";
import { listAdminRows, updateRequest, type RequestRow, type RequestStatus } from "@/lib/adminData";

export function AdminRequestDetailPage({ id }: { id: string }) {
  const [request, setRequest] = useState<RequestRow | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const result = await listAdminRows<RequestRow>("requests");
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    const found = result.rows.find((row) => row.id === id) ?? null;
    setRequest(found);
    setNote(found?.admin_note ?? "");
  }

  useEffect(() => {
    void load();
  }, [id]);

  async function changeStatus(status: RequestStatus) {
    const result = await updateRequest(id, { status }, `${status}_request`);
    setMessage(result.ok ? `Request marked ${status}.` : result.error);
    await load();
  }

  async function saveNote(event: FormEvent) {
    event.preventDefault();
    const result = await updateRequest(id, { admin_note: note }, "add_admin_note");
    setMessage(result.ok ? "Admin note saved." : result.error);
    await load();
  }

  if (!request) {
    return <AdminCard>{message || "Request not found."}</AdminCard>;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <AdminCard>
        <h2 className="text-2xl font-black">{request.request_code}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Info label="Minecraft username" value={request.minecraft_username} />
          <Info label="Status" value={request.status} />
          <Info label="Item" value={`${request.item_type}: ${request.item_name}`} />
          <Info label="Amount" value={`PHP ${Number(request.amount ?? 0).toLocaleString()}`} />
          <Info label="Customer" value={request.customer_name || "Not provided"} />
          <Info label="Contact" value={request.contact || "Not provided"} />
          <Info label="Payment method" value={request.payment_method || "gcash"} />
          <Info label="Payment reference" value={request.payment_reference || "None"} />
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {(["under_review", "confirmed", "rejected", "completed", "cancelled"] as RequestStatus[]).map((status) => (
            <button key={status} onClick={() => changeStatus(status)} className="rounded-full border border-purple-300/20 px-4 py-2 text-sm font-bold hover:bg-purple-300/10">
              {status}
            </button>
          ))}
        </div>
      </AdminCard>
      <AdminCard>
        <h2 className="text-xl font-black">Admin note</h2>
        {message && <div className="mt-3 rounded-2xl border border-purple-300/20 bg-purple-300/10 p-3 text-sm">{message}</div>}
        <form onSubmit={saveNote} className="mt-4">
          <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={8} className="w-full rounded-3xl border border-purple-300/20 bg-black/35 p-4 text-sm outline-none" />
          <button className="mt-3 w-full rounded-full bg-purple-200 px-4 py-3 font-black text-slate-950">
            <Save className="mr-2 inline h-4 w-4" />
            Save note
          </button>
        </form>
      </AdminCard>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-purple-100/50">{label}</p>
      <p className="mt-2 font-bold">{value}</p>
    </div>
  );
}
