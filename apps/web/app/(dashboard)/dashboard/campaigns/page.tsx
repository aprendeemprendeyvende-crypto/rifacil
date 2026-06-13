"use client";
import { api } from "@/lib/trpc";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function CampaignsPage() {
  const { data } = api.campaign.list.useQuery({});
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Campañas</h1>
        <Link href="/dashboard/campaigns/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl">
          <Plus className="w-5 h-5" /> Nueva
        </Link>
      </div>
      <div className="space-y-2">
        {data?.campaigns.map((c) => (
          <div key={c.id} className="bg-white dark:bg-slate-900 rounded-xl border p-4 flex justify-between">
            <div><h3 className="font-medium">{c.name}</h3><p className="text-sm text-slate-500">{c.type}</p></div>
            <span className="px-2 py-1 bg-slate-100 rounded text-xs">{c.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
