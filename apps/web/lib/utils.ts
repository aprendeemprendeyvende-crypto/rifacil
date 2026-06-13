import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "COP"): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string, format: "short" | "long" | "relative" = "long"): string {
  const d = new Date(date);
  if (format === "relative") {
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Hoy";
    if (days === 1) return "Ayer";
    if (days < 7) return `Hace ${days} días`;
    if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
    return `Hace ${Math.floor(days / 30)} meses`;
  }
  return d.toLocaleDateString("es-CO", {
    year: "numeric",
    month: format === "long" ? "long" : "short",
    day: "numeric",
  });
}
