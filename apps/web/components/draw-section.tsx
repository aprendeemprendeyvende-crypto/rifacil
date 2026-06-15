"use client";

import { useState } from "react";
import { api } from "@/lib/trpc";
import { toast } from "react-hot-toast";
import { Trophy, Loader2, Sparkles } from "lucide-react";

const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleString("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function DrawSection({ raffleId, onChanged }: { raffleId: string; onChanged?: () => void }) {
  const utils = api.useContext();
  const { data, isLoading } = api.raffle.getDraw.useQuery({ id: raffleId });
  const [confirming, setConfirming] = useState(false);

  const draw = api.raffle.draw.useMutation({
    onSuccess: (res) => {
      toast.success(`¡Ganador: ${res.winnerNumber}! 🎉`);
      setConfirming(false);
      utils.raffle.getDraw.invalidate({ id: raffleId });
      utils.raffle.getById.invalidate({ id: raffleId });
      onChanged?.();
    },
    onError: (e) => {
      toast.error(e.message);
      setConfirming(false);
    },
  });

  const drawn = data?.status === "DRAWN" && data.winner;

  return (
    <div className="rounded-xl border bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-500" />
        <h2 className="text-lg font-bold text-slate-900">Sorteo</h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : drawn ? (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-5 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-amber-500" />
          <p className="mt-2 text-sm text-amber-700">Número ganador</p>
          <p className="font-mono text-4xl font-extrabold text-slate-900">{data!.winner!.number}</p>
          {data!.winner!.name && (
            <p className="mt-2 font-medium text-slate-800">{data!.winner!.name}</p>
          )}
          {data!.winner!.phone && <p className="text-sm text-slate-500">{data!.winner!.phone}</p>}
          {data!.drawnAt && <p className="mt-2 text-xs text-slate-400">Sorteado el {fmtDate(data!.drawnAt)}</p>}
          {data!.seed && (
            <p className="mt-1 break-all text-[10px] text-slate-400">Semilla verificable: {data!.seed}</p>
          )}
        </div>
      ) : (
        <div>
          <p className="text-sm text-slate-600">
            {data?.eligible ? (
              <>
                Hay <b>{data.eligible}</b> número(s) vendido(s)/pagado(s) elegibles. El ganador se elige
                de forma aleatoria y verificable.
              </>
            ) : (
              "Aún no hay números vendidos para sortear."
            )}
          </p>

          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              disabled={!data?.eligible}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              <Trophy className="h-4 w-4" /> Realizar sorteo
            </button>
          ) : (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-slate-800">¿Realizar el sorteo ahora?</p>
              <p className="mt-1 text-xs text-slate-500">
                Se elegirá el ganador y la rifa quedará marcada como sorteada. No se puede deshacer.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setConfirming(false)}
                  disabled={draw.isLoading}
                  className="flex-1 rounded-xl border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-white disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => draw.mutate({ id: raffleId, method: "RANDOM_SYSTEM" })}
                  disabled={draw.isLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 py-2.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  {draw.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sortear"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
