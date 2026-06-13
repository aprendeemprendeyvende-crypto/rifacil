"use client";
import { api } from "@/lib/trpc";

export default function AnalyticsPage() {
  const { data } = api.analytics.dashboard.useQuery({});
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl border p-4">
          <p className="text-sm text-slate-500">Ventas Totales</p>
          <p className="text-2xl font-bold">{data?.totalSales || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border p-4">
          <p className="text-sm text-slate-500">Ingresos</p>
          <p className="text-2xl font-bold">${Number(data?.totalRevenue || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border p-4">
          <p className="text-sm text-slate-500">Contactos</p>
          <p className="text-2xl font-bold">{data?.totalContacts || 0}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl border p-4">
          <p className="text-sm text-slate-500">Rifas</p>
          <p className="text-2xl font-bold">{data?.totalRaffles || 0}</p>
        </div>
      </div>
    </div>
  );
}
