"use client";

import { api } from "@/lib/trpc";
import { Loader2, FileSpreadsheet, BarChart3, Users, Store } from "lucide-react";

const money = (v: number) =>
  `$${Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function ReportSection({ raffleId }: { raffleId: string }) {
  const { data, isLoading } = api.raffle.getReport.useQuery({ id: raffleId });

  return (
    <div className="rounded-xl border bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-slate-700" />
          <h2 className="text-lg font-bold text-slate-900">Reportes</h2>
        </div>
        <a
          href={`/api/raffles/${raffleId}/export`}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          <FileSpreadsheet className="h-4 w-4" /> Exportar Excel
        </a>
      </div>

      {isLoading || !data ? (
        <div className="flex justify-center py-8 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Dinero */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Recaudado" value={money(data.money.collected)} tone="green" />
            <Metric label="Facturado" value={money(data.money.billed)} />
            <Metric label="Por cobrar" value={money(data.money.pending)} tone="red" />
            <Metric label="% Vendido" value={`${data.totals.soldPct}%`} tone="blue" />
          </div>

          {/* Números por estado */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">Números por estado</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Pill label="Disponibles" value={data.totals.available} dot="bg-slate-300" />
              <Pill label="Apartados" value={data.totals.reserved} dot="bg-orange-400" />
              <Pill label="Por confirmar" value={data.totals.sold} dot="bg-yellow-300" />
              <Pill label="Vendidos" value={data.totals.paid} dot="bg-green-500" />
            </div>
          </div>

          {/* Top clientes */}
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Users className="h-4 w-4" /> Top clientes
            </h3>
            {data.topClients.length === 0 ? (
              <p className="text-sm text-slate-400">Aún no hay ventas.</p>
            ) : (
              <ul className="divide-y rounded-xl border">
                {data.topClients.map((c, i) => (
                  <li key={c.id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {i + 1}. {c.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {c.phone} · {c.numbers} números
                      </p>
                    </div>
                    <span className="ml-3 shrink-0 font-semibold text-green-600">{money(c.collected)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Ventas por vendedor */}
          <div>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Store className="h-4 w-4" /> Ventas por vendedor
            </h3>
            {data.byVendor.length === 0 ? (
              <p className="text-sm text-slate-400">Sin ventas asignadas a vendedores.</p>
            ) : (
              <ul className="divide-y rounded-xl border">
                {data.byVendor.map((v) => (
                  <li key={v.id} className="flex items-center justify-between px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{v.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {v.salesCount} ventas · {v.numbers} números
                      </p>
                    </div>
                    <span className="ml-3 shrink-0 font-semibold text-green-600">{money(v.collected)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "green" | "red" | "blue" }) {
  const toneCls =
    tone === "green"
      ? "text-green-600"
      : tone === "red"
      ? "text-red-600"
      : tone === "blue"
      ? "text-blue-600"
      : "text-slate-900";
  return (
    <div className="rounded-xl border bg-white p-3 text-center">
      <p className={`text-lg font-bold ${toneCls}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function Pill({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-900">{value}</p>
        <p className="truncate text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
