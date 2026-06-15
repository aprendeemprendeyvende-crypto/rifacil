"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { api } from "@/lib/trpc";
import { toast } from "react-hot-toast";
import { Globe, Share2, Copy, ExternalLink, X, Loader2, Download } from "lucide-react";

export function SharePublic({
  raffleId,
  isPublic,
  onChanged,
}: {
  raffleId: string;
  isPublic: boolean;
  onChanged?: () => void;
}) {
  const utils = api.useContext();
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState<string>("");

  // URL pública (en cliente para usar el host real).
  const url = typeof window !== "undefined" ? `${window.location.origin}/r/${raffleId}` : `/r/${raffleId}`;

  const setPublic = api.raffle.update.useMutation({
    onSuccess: () => {
      utils.raffle.getById.invalidate({ id: raffleId });
      onChanged?.();
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(url, { width: 320, margin: 1 })
      .then(setQr)
      .catch(() => setQr(""));
  }, [open, url]);

  function copy() {
    navigator.clipboard?.writeText(url);
    toast.success("Enlace copiado");
  }

  return (
    <div className="rounded-xl border bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-slate-700" />
          <div>
            <h2 className="font-bold text-slate-900">Página pública</h2>
            <p className="text-xs text-slate-500">
              {isPublic ? "Visible en /r para los compradores." : "Oculta: actívala para compartirla."}
            </p>
          </div>
        </div>

        {/* Toggle Rifa pública */}
        <button
          onClick={() => setPublic.mutate({ id: raffleId, data: { isPublic: !isPublic } })}
          disabled={setPublic.isLoading}
          className="inline-flex items-center gap-2 disabled:opacity-50"
          title={isPublic ? "Pública (toca para ocultar)" : "Privada (toca para publicar)"}
        >
          <span className="text-xs font-medium text-slate-500">{isPublic ? "Pública" : "Privada"}</span>
          <span className="relative inline-block h-6 w-11">
            <span className={`block h-6 w-11 rounded-full transition ${isPublic ? "bg-green-500" : "bg-slate-300"}`} />
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${isPublic ? "left-[22px]" : "left-0.5"}`} />
          </span>
        </button>
      </div>

      <button
        onClick={() => setOpen(true)}
        disabled={!isPublic}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        <Share2 className="h-4 w-4" /> Compartir / Ver página pública
      </button>
      {!isPublic && (
        <p className="mt-2 text-center text-xs text-slate-400">Activa “Pública” para compartir el enlace.</p>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-t-2xl bg-white p-6 sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Compartir rifa</h3>
              <button onClick={() => setOpen(false)} aria-label="Cerrar" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex justify-center">
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt="QR de la rifa" className="h-56 w-56 rounded-xl border" />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-xl border bg-slate-50 px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{url}</span>
              <button onClick={copy} className="rounded-lg p-2 text-slate-500 hover:bg-slate-200" aria-label="Copiar">
                <Copy className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                <ExternalLink className="h-4 w-4" /> Abrir
              </a>
              {qr && (
                <a
                  href={qr}
                  download={`rifa-${raffleId}.png`}
                  className="flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" /> Descargar QR
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
