"use client";

import { api } from "@/lib/trpc";
import { toast } from "react-hot-toast";
import { CreditCard, Loader2, Check, Crown, Ticket, Users } from "lucide-react";

export function BillingSection() {
  const utils = api.useContext();
  const { data, isLoading } = api.subscription.usage.useQuery();

  const upgrade = api.subscription.requestUpgrade.useMutation({
    onSuccess: () => {
      toast.success("¡Gracias! Te contactaremos para activar Pro.");
      utils.subscription.usage.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 rounded-xl border bg-white p-6 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-slate-700" />
        <h2 className="text-lg font-semibold text-slate-900">Plan y facturación</h2>
      </div>

      {isLoading || !data ? (
        <div className="flex justify-center py-6 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <>
          {/* Plan actual + uso */}
          <div className="rounded-xl border bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Tu plan</p>
                <p className="text-xl font-bold text-slate-900">
                  {data.plan === "PRO" ? "Pro" : "Gratis"}
                </p>
              </div>
              {data.plan === "PRO" && <Crown className="h-6 w-6 text-amber-500" />}
            </div>
            <div className="mt-3 space-y-3">
              <UsageBar
                icon={<Ticket className="h-4 w-4" />}
                label="Rifas activas"
                used={data.usage.activeRaffles}
                max={data.limits.maxRaffles}
              />
              <UsageBar
                icon={<Users className="h-4 w-4" />}
                label="Contactos"
                used={data.usage.contacts}
                max={data.limits.maxContacts}
              />
            </div>
          </div>

          {/* Planes */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {data.plans.map((p) => {
              const current = p.id === data.plan;
              return (
                <div
                  key={p.id}
                  className={`rounded-xl border p-4 ${
                    p.popular ? "border-blue-300 ring-1 ring-blue-200" : "border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900">{p.name}</h3>
                    {p.popular && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                        Recomendado
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {p.priceUSD === 0 ? "Gratis" : `$${p.priceUSD}`}
                    {p.priceUSD > 0 && <span className="text-sm font-normal text-slate-500">/mes</span>}
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" /> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4">
                    {current ? (
                      <span className="block rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-center text-sm font-medium text-slate-500">
                        Tu plan actual
                      </span>
                    ) : p.id === "PRO" ? (
                      <button
                        onClick={() => upgrade.mutate()}
                        disabled={upgrade.isLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {upgrade.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                        Mejorar a Pro
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-center text-xs text-slate-400">
            El pago en línea estará disponible pronto. Por ahora coordinamos la activación de Pro contigo.
          </p>
        </>
      )}
    </div>
  );
}

function UsageBar({
  icon,
  label,
  used,
  max,
}: {
  icon: React.ReactNode;
  label: string;
  used: number;
  max: number;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const full = used >= max;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-slate-600">
          {icon} {label}
        </span>
        <span className={full ? "font-semibold text-red-600" : "text-slate-500"}>
          {used} / {max >= 999999 ? "∞" : max}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full ${full ? "bg-red-500" : "bg-blue-600"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
