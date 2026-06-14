"use client";
import { useState } from "react";
import { api } from "@/lib/trpc";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Plus, X, Loader2, Trash2 } from "lucide-react";

type VendorForm = {
  name: string;
  phone: string;
  email?: string;
  commissionRate?: string;
};

export default function VendorsPage() {
  const [open, setOpen] = useState(false);
  const { data, isLoading, refetch } = api.vendor.list.useQuery({});
  const { register, handleSubmit, reset } = useForm<VendorForm>();

  const createVendor = api.vendor.create.useMutation({
    onSuccess: () => {
      toast.success("Vendedor agregado");
      reset();
      setOpen(false);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteVendor = api.vendor.delete.useMutation({
    onSuccess: () => {
      toast.success("Vendedor eliminado");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const onSubmit = (form: VendorForm) => {
    createVendor.mutate({
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      commissionRate: form.commissionRate ? Number(form.commissionRate) : 0,
    });
  };

  const vendors = data?.vendors ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Vendedores</h1>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" /> Nuevo
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      )}

      {!isLoading && vendors.length === 0 && (
        <div className="rounded-xl border border-dashed bg-white p-10 text-center text-slate-500">
          <p className="font-medium text-slate-700">Todavía no tienes vendedores</p>
          <p className="mt-1 text-sm">
            Agrega tu primer vendedor para repartir números y llevar el recaudo.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vendors.map((v) => (
          <div key={v.id} className="bg-white rounded-xl border p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">{v.name}</h3>
                <p className="text-sm text-slate-500">Código: {v.code}</p>
                <p className="text-sm text-slate-500">{v.phone}</p>
                <p className="text-sm text-slate-500">
                  Comisión: {Number(v.commissionRate)}% · Ventas: {v.totalSales}
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm(`¿Eliminar a ${v.name}?`)) deleteVendor.mutate({ id: v.id });
                }}
                className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100"
                aria-label="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Nuevo vendedor</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                <input
                  {...register("name", { required: true })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900"
                  placeholder="Ej: María Pérez"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
                <input
                  {...register("phone", { required: true })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900"
                  placeholder="0424..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900"
                  placeholder="maria@correo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Comisión % (opcional)
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register("commissionRate")}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900"
                  placeholder="10"
                />
              </div>
              <button
                type="submit"
                disabled={createVendor.isLoading}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {createVendor.isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Agregar vendedor"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
