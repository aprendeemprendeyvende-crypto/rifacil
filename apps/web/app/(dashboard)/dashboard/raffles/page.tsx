"use client";
import { useState } from "react";
import { api } from "@/lib/trpc";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Plus, Trash2, Loader2 } from "lucide-react";

export default function RafflesPage() {
  const utils = api.useContext();
  const { data } = api.raffle.list.useQuery({});
  const [toDelete, setToDelete] = useState<{ id: string; title: string } | null>(null);

  const deleteRaffle = api.raffle.delete.useMutation({
    onSuccess: () => {
      toast.success("Rifa eliminada");
      setToDelete(null);
      utils.raffle.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Mis Rifas</h1>
        <Link href="/dashboard/raffles/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl">
          <Plus className="w-5 h-5" /> Nueva Rifa
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.raffles.map((raffle) => (
          <div
            key={raffle.id}
            className="relative bg-white rounded-xl border p-4 transition hover:border-blue-400 hover:shadow-sm"
          >
            <Link href={`/dashboard/raffles/${raffle.id}`} className="block pr-8">
              <h3 className="font-semibold text-slate-900">{raffle.title}</h3>
              <p className="text-sm text-slate-500">{raffle.prize}</p>
              <span className="inline-block mt-2 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">
                {raffle.status}
              </span>
            </Link>
            <button
              onClick={() => setToDelete({ id: raffle.id, title: raffle.title })}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
              aria-label="Eliminar rifa"
              title="Eliminar rifa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      {data && data.raffles.length === 0 && (
        <div className="rounded-xl border border-dashed bg-white p-10 text-center text-slate-500">
          <p className="font-medium text-slate-700">Aún no tienes rifas</p>
          <p className="mt-1 text-sm">Crea tu primera rifa para empezar a vender números.</p>
        </div>
      )}

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="w-full space-y-4 rounded-t-2xl border bg-white p-6 sm:max-w-md sm:rounded-2xl">
            <h2 className="text-lg font-bold text-slate-900">¿Eliminar esta rifa?</h2>
            <p className="text-sm text-slate-600">
              Vas a eliminar <span className="font-medium text-slate-900">{toDelete.title}</span>. No se puede deshacer.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setToDelete(null)}
                disabled={deleteRaffle.isLoading}
                className="flex-1 py-3 rounded-xl border border-slate-300 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteRaffle.mutate({ id: toDelete.id })}
                disabled={deleteRaffle.isLoading}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteRaffle.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
