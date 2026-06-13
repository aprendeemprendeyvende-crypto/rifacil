"use client";
import { api } from "@/lib/trpc";

export default function SalesPage() {
  const { data } = api.sale.list.useQuery({ limit: 50 });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ventas</h1>
      <div className="bg-white dark:bg-slate-900 rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-800"><tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Recibo</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Cliente</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Total</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Estado</th>
          </tr></thead>
          <tbody className="divide-y">
            {data?.sales.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-mono text-sm">{s.receiptNumber}</td>
                <td className="px-4 py-3">{s.contact.name}</td>
                <td className="px-4 py-3">${Number(s.finalAmount).toLocaleString()}</td>
                <td className="px-4 py-3"><span className="px-2 py-1 bg-slate-100 rounded text-xs">{s.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
