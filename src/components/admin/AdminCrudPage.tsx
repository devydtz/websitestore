import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit3, Plus, Save, Trash2 } from "lucide-react";
import { AdminCard } from "./AdminShell";
import { deleteAdminRow, listAdminRows, saveAdminRow, type StoreAdminRow, type StoreTable } from "@/lib/adminData";

type CrudConfig = {
  table: StoreTable;
  title: string;
  itemLabel: string;
  jsonFields: string[];
  extraFields?: Array<"category" | "crate_id" | "compare_at_price" | "preview_url" | "color" | "icon" | "sort_order">;
};

const blank: StoreAdminRow = {
  name: "",
  slug: "",
  description: "",
  price: null,
  currency: "PHP",
  is_active: true,
  commands: [],
};

export function AdminCrudPage({ config }: { config: CrudConfig }) {
  const [rows, setRows] = useState<StoreAdminRow[]>([]);
  const [editing, setEditing] = useState<StoreAdminRow>({ ...blank });
  const [message, setMessage] = useState("");

  const emptyText = useMemo(() => `No ${config.itemLabel.toLowerCase()} yet. Add real items manually here.`, [config.itemLabel]);

  async function load() {
    const result = await listAdminRows<StoreAdminRow>(config.table, "sort_order");
    if (result.ok) setRows(result.rows);
    else setMessage(result.error);
  }

  useEffect(() => {
    void load();
  }, [config.table]);

  function setField(key: keyof StoreAdminRow, value: unknown) {
    setEditing((current) => ({ ...current, [key]: value }));
  }

  function parseJson(value: unknown) {
    if (Array.isArray(value)) return JSON.stringify(value, null, 2);
    if (!value) return "[]";
    return String(value);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    const row: StoreAdminRow = { ...editing, slug: editing.slug.trim() || editing.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") };
    for (const field of config.jsonFields) {
      try {
        (row as Record<string, unknown>)[field] = JSON.parse(String((editing as Record<string, unknown>)[field] ?? "[]"));
      } catch {
        setMessage(`${field} must be valid JSON.`);
        return;
      }
    }
    const result = await saveAdminRow(config.table, row);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setEditing({ ...blank });
    setMessage(`${config.itemLabel} saved.`);
    await load();
  }

  async function remove(id?: string) {
    if (!id) return;
    const result = await deleteAdminRow(config.table, id);
    setMessage(result.ok ? `${config.itemLabel} deleted.` : result.error);
    await load();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_440px]">
      <AdminCard>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">{config.title}</h2>
            <p className="text-sm text-purple-100/60">Manual add, edit, disable, and delete. Nothing fake is seeded.</p>
          </div>
          <button onClick={() => setEditing({ ...blank })} className="rounded-full bg-purple-200 px-4 py-2 text-sm font-bold text-slate-950">
            <Plus className="mr-1 inline h-4 w-4" />
            New
          </button>
        </div>
        {message && <div className="mb-4 rounded-2xl border border-purple-300/20 bg-purple-300/10 p-3 text-sm text-purple-50">{message}</div>}
        <div className="space-y-3">
          {rows.length === 0 && <div className="rounded-3xl border border-dashed border-purple-300/20 p-8 text-center text-purple-100/55">{emptyText}</div>}
          {rows.map((row) => (
            <div key={row.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black">{row.name}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${row.is_active === false ? "bg-red-400/15 text-red-100" : "bg-emerald-400/15 text-emerald-100"}`}>
                      {row.is_active === false ? "disabled" : "active"}
                    </span>
                  </div>
                  <p className="text-sm text-purple-100/60">{row.slug}</p>
                  {row.price != null && <p className="mt-1 font-bold">PHP {Number(row.price).toLocaleString()}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(row)} className="rounded-full border border-white/10 px-3 py-2 text-sm font-bold hover:bg-white/10">
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(row.id)} className="rounded-full border border-red-300/20 px-3 py-2 text-sm font-bold text-red-100 hover:bg-red-400/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard>
        <h2 className="text-xl font-black">{editing.id ? "Edit" : "Add"} {config.itemLabel}</h2>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <Field label="Name" value={editing.name} onChange={(value) => setField("name", value)} required />
          <Field label="Slug" value={editing.slug} onChange={(value) => setField("slug", value)} placeholder="auto-from-name if blank" />
          <Field label="Description" value={editing.description ?? ""} onChange={(value) => setField("description", value)} textarea />
          <Field label="Price" value={editing.price ?? ""} onChange={(value) => setField("price", value === "" ? null : Number(value))} type="number" />
          {(config.extraFields ?? []).includes("compare_at_price") && <Field label="Compare at price" value={editing.compare_at_price ?? ""} onChange={(value) => setField("compare_at_price", value === "" ? null : Number(value))} type="number" />}
          {(config.extraFields ?? []).includes("category") && <Field label="Category" value={editing.category ?? "other"} onChange={(value) => setField("category", value)} />}
          {(config.extraFields ?? []).includes("crate_id") && <Field label="Crate ID" value={editing.crate_id ?? ""} onChange={(value) => setField("crate_id", value || null)} />}
          {(config.extraFields ?? []).includes("preview_url") && <Field label="Preview URL" value={editing.preview_url ?? ""} onChange={(value) => setField("preview_url", value)} />}
          {(config.extraFields ?? []).includes("color") && <Field label="Color" value={editing.color ?? ""} onChange={(value) => setField("color", value)} />}
          {(config.extraFields ?? []).includes("icon") && <Field label="Icon" value={editing.icon ?? ""} onChange={(value) => setField("icon", value)} />}
          {(config.extraFields ?? []).includes("sort_order") && <Field label="Sort order" value={editing.sort_order ?? 0} onChange={(value) => setField("sort_order", Number(value))} type="number" />}
          {config.jsonFields.map((field) => (
            <Field key={field} label={`${field} JSON`} value={parseJson((editing as Record<string, unknown>)[field])} onChange={(value) => setField(field as keyof StoreAdminRow, value)} textarea />
          ))}
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm font-bold">
            <input type="checkbox" checked={editing.is_active !== false} onChange={(event) => setField("is_active", event.target.checked)} />
            Enabled
          </label>
          <button className="w-full rounded-full bg-purple-200 px-4 py-3 font-black text-slate-950">
            <Save className="mr-2 inline h-4 w-4" />
            Save {config.itemLabel}
          </button>
        </form>
      </AdminCard>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
  required,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  textarea?: boolean;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  const className = "mt-2 w-full rounded-2xl border border-purple-300/20 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-purple-200";
  return (
    <label className="block text-xs font-bold uppercase tracking-[0.2em] text-purple-100/65">
      {label}
      {textarea ? (
        <textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} className={className} required={required} placeholder={placeholder} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className={className} required={required} type={type} placeholder={placeholder} />
      )}
    </label>
  );
}
