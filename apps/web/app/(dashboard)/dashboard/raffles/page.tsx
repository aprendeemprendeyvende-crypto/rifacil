"use client";
import { api } from "@/lib/trpc";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function RafflesPage() {
  const { data } = api.raffle.list.useQuery({});
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
          <Link
            key={raffle.id}
            href={`/dashboard/raffles/${raffle.id}`}
            className="block bg-white rounded-xl border p-4 transition hover:border-blue-400 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-900">{raffle.title}</h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-medium text-slate-600">
                {raffle.status}
              </span>
            </div>
            <p className="text-sm text-slate-500">{raffle.prize}</p>
          </Link>
        ))}
      </div>
      {data && data.raffles.length === 0 && (
        <div className="rounded-xl border border-dashed bg-white p-10 text-center text-slate-500">
          <p className="font-medium text-slate-700">Aún no tienes rifas</p>
          <p className="mt-1 text-sm">Crea tu primera rifa para empezar a vender números.</p>
        </div>
      )}
    </div>
  );
}
