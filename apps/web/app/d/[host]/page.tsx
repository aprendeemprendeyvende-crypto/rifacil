// Landing de marca del rifero, servida en SU dominio propio (rifashermanospernia.com).
// El middleware reescribe "/" → /d/<host>. Server component: resuelve el rifero por
// customDomain y arma una landing completa (data-driven, reusable para cualquier rifero).
// Diseño base oscuro (#0A0D12) con acentos en el color de marca. SIN redirect: siempre
// muestra la landing. El listado son SOLO rifas ACTIVE (filtradas en el procedure).

import { notFound } from "next/navigation";
import Link from "next/link";
import { Ticket, Calendar, Trophy, CreditCard, Search, HelpCircle, Target, ArrowRight } from "lucide-react";
import { getPublicCaller } from "@/lib/server-trpc";
import { PaymentAccountsSection, VerifyWidget, Faq, TrustBadges } from "@/components/storefront-client";

export const dynamic = "force-dynamic";

const BASE = "#0A0D12";

const money = (v: number) =>
  `$${Number(v ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export async function generateMetadata({ params }: { params: { host: string } }) {
  const host = decodeURIComponent(params.host);
  try {
    const data = await getPublicCaller().public.getStorefrontByDomain({ host });
    return {
      title: data.brand.name,
      description: `${data.brand.name} — Premios reales, sorteos en vivo. Elegí tus números y participá.`,
    };
  } catch {
    return { title: "Tienda" };
  }
}

export default async function BrandLanding({ params }: { params: { host: string } }) {
  const host = decodeURIComponent(params.host);

  let data: Awaited<ReturnType<ReturnType<typeof getPublicCaller>["public"]["getStorefrontByDomain"]>>;
  try {
    data = await getPublicCaller().public.getStorefrontByDomain({ host });
  } catch {
    notFound();
  }

  const { brand, raffles, paymentAccounts } = data;
  const color = brand.color;

  return (
    <main className="min-h-screen text-slate-100" style={{ backgroundColor: BASE }}>
      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden">
        {/* glow de marca */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{ background: `radial-gradient(60% 60% at 50% 0%, ${color}, transparent 70%)` }}
        />
        <div className="relative mx-auto max-w-4xl px-6 py-14 text-center sm:py-20">
          {brand.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brand.logo}
              alt={brand.name}
              className="mx-auto h-24 w-auto max-w-[320px] object-contain sm:h-32"
            />
          ) : (
            <h1 className="text-3xl font-extrabold sm:text-5xl">{brand.name}</h1>
          )}

          <div className="mt-6 flex justify-center">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium"
              style={{ borderColor: `${color}66`, color: "#fff", backgroundColor: `${color}1a` }}
            >
              <Trophy className="h-4 w-4" style={{ color }} />
              Premios reales · Sorteos en vivo
            </span>
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300 sm:text-xl">
            Carros, motos y efectivo que cambian vidas. Elegí tus números, pagá seguro y participá.
            <span className="mt-1 block font-semibold text-white">
              Nuestros premios juegan hasta que haya ganador.
            </span>
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#rifas"
              className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-white sm:w-auto"
              style={{ backgroundColor: color }}
            >
              Ver rifas <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#como"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-6 py-3.5 font-semibold text-white sm:w-auto"
            >
              ¿Cómo participar?
            </a>
          </div>

          <div className="mt-8">
            <TrustBadges />
          </div>
        </div>
      </section>

      {/* ───────── Rifas disponibles ───────── */}
      <section id="rifas" className="mx-auto max-w-5xl px-6 py-12">
        <SectionHeading
          icon={Target}
          color={color}
          title="Rifas disponibles"
          subtitle="Elegí tu rifa, apartá tus números antes de que se agoten y preparate para ganar."
        />
        {raffles.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-12 text-center text-slate-400">
            No hay rifas activas en este momento. ¡Volvé pronto!
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {raffles.map((r) => {
              const pct =
                r.totalNumbers > 0 ? Math.min(100, Math.round((r.soldCount / r.totalNumbers) * 100)) : 0;
              return (
                <Link
                  key={r.id}
                  href={`/r/${r.id}`}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/20 hover:bg-white/[0.06]"
                >
                  <div className="aspect-[16/9] w-full overflow-hidden bg-white/5">
                    {r.bannerUrl || r.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.bannerUrl || r.iconUrl || ""}
                        alt={r.title}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center" style={{ background: r.color || color }}>
                        <Ticket className="h-10 w-10 text-white/80" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-slate-200">
                        Activa
                      </span>
                      <span className="text-sm font-bold" style={{ color }}>
                        {money(r.pricePerNumber)} / número
                      </span>
                    </div>
                    <h3 className="font-semibold text-white">{r.title}</h3>
                    {r.prize && <p className="line-clamp-1 text-sm text-slate-400">🏆 {r.prize}</p>}
                    {r.drawDate && (
                      <p className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(r.drawDate).toLocaleDateString("es-VE")}
                        {r.loteria ? ` · ${r.loteria}` : ""}
                      </p>
                    )}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="mt-2 flex items-center gap-1 text-sm font-medium" style={{ color }}>
                      Participar <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ───────── Participar en 3 pasos ───────── */}
      <section id="como" className="mx-auto max-w-5xl px-6 py-12">
        <SectionHeading
          icon={Ticket}
          color={color}
          title="Participar en 3 pasos"
          badge="Súper fácil"
          subtitle="Comprar tu número toma menos de un minuto."
        />
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { n: 1, t: "Elegí tus números", d: "Entrá a la rifa y seleccioná tus números, manual o al azar." },
            { n: 2, t: "Pagá y subí tu comprobante", d: "Pago Móvil, Binance, Zelle, Zinli, Bancolombia o efectivo. Subí la captura." },
            { n: 3, t: "Confirmamos y jugás", d: "Te enviamos el comprobante por WhatsApp. El sorteo va en vivo por Instagram." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {s.n}
              </div>
              <h3 className="mt-3 font-semibold text-white">{s.t}</h3>
              <p className="mt-1 text-sm text-slate-400">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────── Cuentas de pago ───────── */}
      <section id="pagos" className="mx-auto max-w-5xl px-6 py-12">
        <SectionHeading
          icon={CreditCard}
          color={color}
          title="Cuentas de pago"
          subtitle="Elegí el método que más te convenga. Tocá 'Copiar datos' para no equivocarte."
        />
        <PaymentAccountsSection accounts={paymentAccounts} color={color} />
      </section>

      {/* ───────── Verificar boletos ───────── */}
      <section id="verificar" className="mx-auto max-w-5xl px-6 py-12">
        <SectionHeading
          icon={Search}
          color={color}
          title="Verificá tus boletos"
          badge="Tranquilidad total"
          subtitle="Consultá tus números con tu teléfono o número de boleto."
        />
        <VerifyWidget raffles={raffles.map((r) => ({ id: r.id, title: r.title }))} color={color} />
      </section>

      {/* ───────── FAQ ───────── */}
      <section id="faq" className="mx-auto max-w-5xl px-6 py-12">
        <SectionHeading icon={HelpCircle} color={color} title="Preguntas frecuentes" />
        <Faq />
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="border-t border-white/10 px-6 py-10 text-center">
        {brand.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brand.logo} alt={brand.name} className="mx-auto h-10 w-auto object-contain opacity-80" />
        ) : (
          <p className="font-bold text-white">{brand.name}</p>
        )}
        <p className="mt-3 text-xs text-slate-500">
          {brand.name} · Premios reales, sorteos en vivo · Sistema de rifas
        </p>
      </footer>
    </main>
  );
}

function SectionHeading({
  icon: Icon,
  color,
  title,
  subtitle,
  badge,
}: {
  icon: any;
  color: string;
  title: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <div className="mb-6 text-center">
      <div className="flex items-center justify-center gap-2">
        <Icon className="h-6 w-6" style={{ color }} />
        <h2 className="text-2xl font-bold text-white sm:text-3xl">{title}</h2>
        {badge && (
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">{subtitle}</p>}
    </div>
  );
}
