"use client";
import { useRouter } from "next/navigation";
import { api } from "@/lib/trpc";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewRafflePage() {
  const router = useRouter();
  const createRaffle = api.raffle.create.useMutation({
    onSuccess: (data) => { toast.success("Rifa creada!"); router.push(`/dashboard/raffles/${data.id}`); },
    onError: (error) => { toast.error(error.message); },
  });
  const { register, handleSubmit } = useForm();
  const onSubmit = (data: any) => {
    createRaffle.mutate({
      title: data.title, prize: data.prize, prizeValue: Number(data.prizeValue),
      totalNumbers: Number(data.totalNumbers), pricePerNumber: Number(data.pricePerNumber),
      startDate: new Date().toISOString(),
    });
  };
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nueva Rifa</h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-900 rounded-xl border p-6 space-y-4">
        <div><label className="block text-sm font-medium mb-1">Titulo</label>
          <input {...register("title")} className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900" placeholder="Ej: Rifa Moto 0km" required /></div>
        <div><label className="block text-sm font-medium mb-1">Premio</label>
          <input {...register("prize")} className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900" placeholder="Ej: Moto Yamaha" required /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium mb-1">Valor del premio</label>
            <input type="number" {...register("prizeValue")} className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900" placeholder="15000000" required /></div>
          <div><label className="block text-sm font-medium mb-1">Total numeros</label>
            <input type="number" {...register("totalNumbers")} className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900" placeholder="1000" required /></div>
        </div>
        <div><label className="block text-sm font-medium mb-1">Precio por numero</label>
          <input type="number" {...register("pricePerNumber")} className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900" placeholder="10000" required /></div>
        <button type="submit" disabled={createRaffle.isLoading}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {createRaffle.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Crear Rifa"}
        </button>
      </form>
    </div>
  );
}
