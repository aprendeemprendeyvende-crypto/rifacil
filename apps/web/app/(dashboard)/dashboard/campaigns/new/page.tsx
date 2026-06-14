"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc";
import { toast } from "react-hot-toast";
import { ArrowLeft, Loader2, Users } from "lucide-react";

export default function NewCampaignPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [targetAll, setTargetAll] = useState(true);
  const [tagsRaw, setTagsRaw] = useState("");

  const targetTags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const { data: audience } = api.campaign.previewAudience.useQuery({
    targetAll,
    targetTags,
  });

  const create = api.campaign.create.useMutation({
    onSuccess: () => {
      toast.success("Campaña creada");
      router.push("/dashboard/campaigns");
    },
    onError: (e) => toast.error(e.message),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) {
      toast.error("Completa el nombre y el mensaje");
      return;
    }
    create.mutate({
      name: name.trim(),
      type: "WHATSAPP",
      message: message.trim(),
      targetAll,
      targetTags,
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Nueva campaña</h1>
      </div>

      <form onSubmit={onSubmit} className="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900"
            placeholder="Ej: Recordatorio sorteo del viernes"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mensaje</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900"
            placeholder="Hola! Te recordamos que el sorteo es este viernes. ¡Aún quedan números!"
            required
          />
        </div>

        <div className="rounded-xl border bg-slate-50 p-4 space-y-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={targetAll}
              onChange={(e) => setTargetAll(e.target.checked)}
              className="h-4 w-4"
            />
            Enviar a todos mis contactos
          </label>

          {!targetAll && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Etiquetas (separadas por coma)
              </label>
              <input
                value={tagsRaw}
                onChange={(e) => setTagsRaw(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900"
                placeholder="Importados, VIP"
              />
            </div>
          )}

          <p className="flex items-center gap-2 text-sm text-slate-600">
            <Users className="w-4 h-4" />
            {audience ? `${audience.count} contactos recibirían esta campaña` : "Calculando…"}
          </p>
        </div>

        <p className="text-xs text-slate-400">
          El envío por WhatsApp se conecta en la Fase 2. Por ahora la campaña queda guardada como
          borrador.
        </p>

        <button
          type="submit"
          disabled={create.isLoading}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {create.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Guardar campaña"}
        </button>
      </form>
    </div>
  );
}
