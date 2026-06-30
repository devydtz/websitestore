import { FormEvent, useEffect, useState } from "react";
import { AdminCard } from "./AdminShell";
import { deleteAdminRow, listAdminRows, saveAdminRow } from "@/lib/adminData";

type SettingRow = { id?: string; key: string; value: unknown; updated_at?: string };

export function AdminSettingsPage() {
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [editing, setEditing] = useState<SettingRow>({ key: "", value: {} });
  const [message, setMessage] = useState("");

  async function load() {
    const result = await listAdminRows<SettingRow>("website_settings");
    if (result.ok) setRows(result.rows);
    else setMessage(result.error);
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      const result = await saveAdminRow("website_settings", { ...editing, value: JSON.parse(String(editing.value || "{}")) });
      setMessage(result.ok ? "Setting saved." : result.error);
      setEditing({ key: "", value: {} });
      await load();
    } catch {
      setMessage("Value must be valid JSON.");
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
      <AdminCard>
        <h2 className="text-2xl font-black">Website Settings</h2>
        {message && <div className="mt-4 rounded-2xl border border-purple-300/20 bg-purple-300/10 p-3 text-sm">{message}</div>}
        <div className="mt-5 space-y-3">
          {rows.map((row) => (
            <div key={row.id ?? row.key} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex justify-between gap-3">
                <button onClick={() => setEditing({ ...row, value: JSON.stringify(row.value, null, 2) })} className="text-left">
                  <p className="font-black">{row.key}</p>
                  <pre className="mt-2 max-h-28 overflow-auto text-xs text-purple-100/65">{JSON.stringify(row.value, null, 2)}</pre>
                </button>
                {row.id && <button onClick={() => deleteAdminRow("website_settings", row.id).then(load)} className="text-red-100">Delete</button>}
              </div>
            </div>
          ))}
          {rows.length === 0 && <div className="rounded-3xl border border-dashed border-purple-300/20 p-8 text-center text-purple-100/55">No settings yet.</div>}
        </div>
      </AdminCard>
      <AdminCard>
        <h2 className="text-xl font-black">Edit setting</h2>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <input value={editing.key} onChange={(event) => setEditing((current) => ({ ...current, key: event.target.value }))} placeholder="setting_key" className="w-full rounded-2xl border border-purple-300/20 bg-black/35 px-4 py-3 text-sm outline-none" required />
          <textarea value={String(editing.value ?? "{}")} onChange={(event) => setEditing((current) => ({ ...current, value: event.target.value }))} rows={10} className="w-full rounded-2xl border border-purple-300/20 bg-black/35 px-4 py-3 text-sm outline-none" />
          <button className="w-full rounded-full bg-purple-200 px-4 py-3 font-black text-slate-950">Save setting</button>
        </form>
      </AdminCard>
    </div>
  );
}
