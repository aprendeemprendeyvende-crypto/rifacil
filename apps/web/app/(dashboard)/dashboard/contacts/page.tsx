"use client";
import { useState } from "react";
import { api } from "@/lib/trpc";
import { toast } from "react-hot-toast";
import { parseGoogleContacts, type ParseResult } from "@riffas/shared";
import { Plus, Upload, Check, X } from "lucide-react";

export default function ContactsPage() {
  const { data, refetch } = api.contact.list.useQuery({ limit: 50 });
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const createContact = api.contact.create.useMutation({
    onSuccess: () => {
      toast.success("Contacto agregado");
      setNewOpen(false);
      setNewName("");
      setNewPhone("");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const importCSV = api.contact.importCSV.useMutation({
    onSuccess: (res) => {
      const parts = [`${res.imported} nuevos`];
      if (res.updated) parts.push(`${res.updated} actualizados`);
      if (res.skipped) parts.push(`${res.skipped} omitidos`);
      if (res.errors.length) parts.push(`${res.errors.length} con error`);
      toast.success(`Importación lista: ${parts.join(", ")}`);
      setPreview(null);
      setFileName("");
      refetch();
    },
    onError: (e) => toast.error(e.message || "No se pudo importar"),
  });

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    // Parsear del lado del cliente ANTES de tocar el servidor: separa ':::',
    // concatena nombre, normaliza a E.164 con default Venezuela y deduplica.
    const result = parseGoogleContacts(text, { tag: "Importados" });
    setPreview(result);
  }

  function confirmImport() {
    if (!preview) return;
    importCSV.mutate({
      format: "google_contacts",
      data: preview.contacts.map((c) => ({
        name: c.name,
        phone: c.phone,
        email: c.email ?? undefined,
        city: c.city ?? undefined,
        tags: c.tags,
        notes: c.notes ?? undefined,
      })),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Contactos</h1>
        <div className="flex gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-slate-700 dark:text-slate-200">
            <Upload className="h-5 w-5" /> Importar Google
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFile}
            />
          </label>
          <button
            onClick={() => setNewOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" /> Nuevo
          </button>
        </div>
      </div>

      {/* Vista previa de la importación */}
      {preview && (
        <div className="rounded-xl border bg-white p-4 dark:bg-slate-900">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-medium text-slate-900 dark:text-white">
              Vista previa — {fileName}
            </p>
            <button
              onClick={() => {
                setPreview(null);
                setFileName("");
              }}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Cancelar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat label="Filas" value={preview.stats.totalRows} />
            <Stat label="Con teléfono" value={preview.stats.withValidPhone} />
            <Stat label="Duplicados" value={preview.stats.duplicatesMerged} />
            <Stat label="Inválidos" value={preview.stats.invalid} />
            <Stat label="Tel. extra" value={preview.stats.extraPhonesFound} />
          </div>

          <div className="mt-4 max-h-48 overflow-auto rounded-lg border">
            <table className="w-full text-sm">
              <tbody className="divide-y">
                {preview.contacts.slice(0, 10).map((c, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2">{c.name}</td>
                    <td className="px-3 py-2 text-slate-500">{c.phone}</td>
                    <td className="px-3 py-2 text-slate-400">{c.country}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.contacts.length > 10 && (
            <p className="mt-2 text-xs text-slate-400">
              …y {preview.contacts.length - 10} más
            </p>
          )}

          <button
            onClick={confirmImport}
            disabled={importCSV.isLoading || preview.stats.withValidPhone === 0}
            className="mt-4 flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-white disabled:opacity-50"
          >
            <Check className="h-5 w-5" />
            {importCSV.isLoading
              ? "Importando…"
              : `Importar ${preview.stats.withValidPhone} contactos`}
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-white dark:bg-slate-900">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Nombre</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Telefono</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Compras</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {data?.contacts.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">{c.name}</td>
                <td className="px-4 py-3">{c.phone}</td>
                <td className="px-4 py-3">{c._count.sales}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {newOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="w-full space-y-4 rounded-t-2xl border bg-white p-6 sm:max-w-md sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Nuevo contacto</h2>
              <button
                onClick={() => setNewOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newName.trim() || !newPhone.trim()) {
                  toast.error("Completa nombre y teléfono");
                  return;
                }
                createContact.mutate({ name: newName.trim(), phone: newPhone.trim() });
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nombre</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                  placeholder="Ej: Carlos Rodríguez"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">WhatsApp</label>
                <input
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
                  placeholder="0424..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={createContact.isLoading}
                className="w-full rounded-xl bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {createContact.isLoading ? "Guardando…" : "Agregar contacto"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800">
      <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
