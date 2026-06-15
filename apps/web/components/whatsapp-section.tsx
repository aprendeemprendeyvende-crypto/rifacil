"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/trpc";
import { toast } from "react-hot-toast";
import { MessageCircle, Loader2 } from "lucide-react";

// Credenciales de WhatsApp Cloud API (BSP). El envío masivo automático requiere
// cuenta Meta verificada + plantillas aprobadas (setup externo). Aquí queda lista
// la arquitectura: el rifero guarda sus credenciales y activa el proveedor.
export function WhatsappSection() {
  const utils = api.useContext();
  const { data: settings, isLoading } = api.settings.get.useQuery();

  const [provider, setProvider] = useState(false); // true = CLOUD_API
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    if (!settings) return;
    setProvider(settings.whatsappProvider === "CLOUD_API");
    setPhoneNumber(settings.whatsappPhoneNumber ?? "");
    setPhoneNumberId(settings.whatsappPhoneNumberId ?? "");
    setBusinessId(settings.whatsappBusinessId ?? "");
    setToken(settings.whatsappApiToken ?? "");
  }, [settings]);

  const save = api.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Credenciales guardadas");
      utils.settings.get.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  function handleSave() {
    save.mutate({
      whatsappProvider: provider ? "CLOUD_API" : "NONE",
      whatsappPhoneNumber: phoneNumber || null,
      whatsappPhoneNumberId: phoneNumberId || null,
      whatsappBusinessId: businessId || null,
      whatsappApiToken: token || null,
    });
  }

  return (
    <div className="space-y-4 rounded-xl border bg-white p-6 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-slate-700" />
        <h2 className="text-lg font-semibold text-slate-900">WhatsApp Cloud API (envío masivo)</h2>
      </div>
      <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
        <b>Upgrade opcional.</b> El envío masivo automático necesita una cuenta de Meta verificada y
        plantillas aprobadas. Mientras tanto, usa <b>Campañas</b> para enviar por enlaces wa.me sin
        costo. Aquí dejas listas tus credenciales para activarlo después.
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <>
          <label className="flex items-center justify-between rounded-xl border p-3">
            <span className="text-sm font-medium text-slate-700">Activar Cloud API</span>
            <span className="relative">
              <input
                type="checkbox"
                checked={provider}
                onChange={(e) => setProvider(e.target.checked)}
                className="peer sr-only"
              />
              <span className="block h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-green-500" />
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
            </span>
          </label>

          <Field label="Número de WhatsApp (display)">
            <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+58424…" className={inputCls} />
          </Field>
          <Field label="Phone Number ID (Meta)">
            <input value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} placeholder="1234567890" className={inputCls} />
          </Field>
          <Field label="WABA / Business Account ID">
            <input value={businessId} onChange={(e) => setBusinessId(e.target.value)} placeholder="1234567890" className={inputCls} />
          </Field>
          <Field label="Access Token permanente">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="EAAG…"
              className={inputCls}
            />
          </Field>

          <button
            onClick={handleSave}
            disabled={save.isLoading}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {save.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar credenciales"}
          </button>
        </>
      )}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  );
}
