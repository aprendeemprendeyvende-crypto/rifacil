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
          <div key={raffle.id} className="bg-white dark:bg-slate-900 rounded-xl border p-4">
            <h3 className="font-semibold">{raffle.title}</h3>
            <p className="text-sm text-slate-500">{raffle.prize}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
