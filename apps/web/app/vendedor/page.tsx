"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { toast } from "react-hot-toast";
import { Loader2, LogOut, Wallet, Receipt, Copy, Link2, Store, ShoppingBag } from "lucide-react";

const money = (v: number) =>
  `$${Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_ES: Record<string, string> = {
  PENDING: "Por confirmar",
  RESERVED: "Apartada",
  PAID: "Pagada",
};

const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleString("es-VE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export default function VendorPortalPage() {
  const utils = api.useContext();
  const { data: me, isLoading } = api.vendorPortal.me.useQuery();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!me) {
    return <VendorLogin onLoggedIn={() => utils.vendorPortal.me.invalidate()} />;
  }

  return <VendorPanel me={me} onLogout={() => utils.vendorPortal.invalidate()} />;
}

function VendorLogin({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!phone.trim() || !code.trim()) return toast.error("Ingresa teléfono y código");
    try {
      setLoading(true);
      const res = await fetch("/api/vendor/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), code: code.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No se pudo entrar");
      toast.success("¡Bienvenido!");
      onLoggedIn();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-5">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border bg-white p-6">
        <div className="text-center">
          <Store className="mx-auto h-10 w-10 text-blue-600" />
          <h1 className="mt-2 text-xl font-bold text-slate-900">Mi panel de vendedor</h1>
          <p className="text-sm text-slate-500">Entra con tu teléfono y código de acceso.</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Teléfono</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0424 123 4567"
            inputMode="tel"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Código de acceso</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ej: A1B2C3"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono uppercase text-slate-900"
          />
        </div>
        <button
          onClick={submit}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Entrar"}
        </button>
        <p className="text-center text-xs text-slate-400">¿No tienes código? Pídeselo al organizador.</p>
      </div>
    </div>
  );
}

function VendorPanel({ me, onLogout }: { me: any; onLogout: () => void }) {
  const { data: sales } = api.vendorPortal.sales.useQuery();
  const color = me.brand.color || "#3b82f6";
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  async function logout() {
    await fetch("/api/vendor/logout", { method: "POST" });
    onLogout();
  }

  function copyRef(raffleId: string) {
    const link = `${origin}/r/${raffleId}?ref=${me.vendor.code}`;
    navigator.clipboard?.writeText(link);
    toast.success("Enlace de referido copiado");
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="px-4 py-4 text-white" style={{ background: `linear-gradient(135deg, ${color}, ${me.brand.colorSecondary || color})` }}>
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <div className="flex items-center gap-2">
            {me.brand.logo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={me.brand.logo} alt={me.brand.name} className="h-9 w-9 rounded-lg bg-white/90 object-contain p-0.5" />
            )}
            <div>
              <p className="text-xs opacity-90">{me.brand.name}</p>
              <p className="font-bold">
                {me.vendor.name} {me.vendor.lastName || ""}
              </p>
            </div>
          </div>
          <button onClick={logout} className="rounded-lg bg-white/20 p-2 hover:bg-white/30" aria-label="Salir">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-xl space-y-5 px-4 py-5">
        {/* Resumen */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Ventas" value={String(sales?.totals.count ?? 0)} icon={<ShoppingBag className="h-4 w-4" />} />
          <Stat label="Recaudado" value={money(sales?.totals.collected ?? 0)} icon={<Receipt className="h-4 w-4" />} />
          <Stat
            label={`Comisión (${me.vendor.commissionRate}%)`}
            value={money(sales?.totals.commission ?? 0)}
            icon={<Wallet className="h-4 w-4" />}
            highlight
          />
        </div>

        {/* Enlaces de referido */}
        <section className="rounded-xl border bg-white p-4">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Link2 className="h-4 w-4" /> Mis enlaces de referido
          </h2>
          <p className="mb-3 text-xs text-slate-500">
            Comparte estos enlaces: las ventas que entren por ahí se te atribuyen. Tu código: <b>{me.vendor.code}</b>
          </p>
          {me.raffles.length === 0 ? (
            <p className="text-sm text-slate-400">No hay rifas activas ahora mismo.</p>
          ) : (
            <ul className="space-y-2">
              {me.raffles.map((r: any) => (
                <li key={r.id} className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5">
                  <span className="min-w-0 truncate text-sm text-slate-800">{r.title}</span>
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => copyRef(r.id)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Copiar enlace">
                      <Copy className="h-4 w-4" />
                    </button>
                    <a
                      href={`${origin}/r/${r.id}?ref=${me.vendor.code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg px-3 py-2 text-sm font-medium text-white"
                      style={{ backgroundColor: color }}
                    >
                      Abrir
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Mis ventas */}
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-700">Mis ventas</h2>
          {!sales ? (
            <div className="flex justify-center py-8 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : sales.items.length === 0 ? (
            <p className="rounded-xl border border-dashed bg-white px-4 py-8 text-center text-sm text-slate-500">
              Aún no tienes ventas. Comparte tu enlace de referido.
            </p>
          ) : (
            <ul className="space-y-2">
              {sales.items.map((s) => (
                <li key={s.id} className="rounded-xl border bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{s.contactName}</p>
                      <p className="truncate text-xs text-slate-500">
                        {s.raffleTitle} · {fmtDate(s.createdAt)}
                      </p>
                      <p className="mt-0.5 font-mono text-xs text-slate-600">{s.numbers.join(", ")}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {STATUS_ES[s.status] ?? s.status}
                      </span>
                      <p className="mt-1 text-sm font-semibold text-green-600">+{money(s.commission)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3 text-center ${highlight ? "bg-green-50 border-green-200" : "bg-white"}`}>
      <div className="mx-auto mb-1 flex w-fit items-center gap-1 text-slate-400">{icon}</div>
      <p className={`text-base font-bold ${highlight ? "text-green-700" : "text-slate-900"}`}>{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  );
}
