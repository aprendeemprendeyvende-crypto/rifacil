"use client";
import { api } from "@/lib/trpc";
import { Plus } from "lucide-react";

export default function VendorsPage() {
  const { data } = api.vendor.list.useQuery({});
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Vendedores</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl">
          <Plus className="w-5 h-5" /> Nuevo
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.vendors.map((v) => (
          <div key={v.id} className="bg-white dark:bg-slate-900 rounded-xl border p-4">
            <h3 className="font-semibold">{v.name}</h3>
            <p className="text-sm text-slate-500">Codigo: {v.code}</p>
            <p className="text-sm text-slate-500">Ventas: {v.totalSales}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
