import type { FuelType, MovementStatus } from "@/contexts/fuel/fuel-data-context";

export function getFuelTone(fuel: FuelType | string) {
  switch (fuel) {
    case "Diesel S10":
      return {
        badge: "bg-sky-100 text-sky-900 border border-sky-300",
        card: "border-sky-300 bg-gradient-to-br from-sky-100 via-sky-50 to-white shadow-sm",
        accent: "text-sky-800",
        bar: "bg-sky-500",
        chart: "#0ea5e9",
      };
    case "Diesel S500":
      return {
        badge: "bg-indigo-100 text-indigo-900 border border-indigo-300",
        card: "border-indigo-300 bg-gradient-to-br from-indigo-100 via-indigo-50 to-white shadow-sm",
        accent: "text-indigo-800",
        bar: "bg-indigo-500",
        chart: "#4f46e5",
      };
    case "Gasolina":
      return {
        badge: "bg-amber-100 text-amber-900 border border-amber-300",
        card: "border-amber-300 bg-gradient-to-br from-amber-100 via-amber-50 to-white shadow-sm",
        accent: "text-amber-800",
        bar: "bg-amber-500",
        chart: "#f59e0b",
      };
    case "Etanol":
      return {
        badge: "bg-emerald-100 text-emerald-900 border border-emerald-300",
        card: "border-emerald-300 bg-gradient-to-br from-emerald-100 via-emerald-50 to-white shadow-sm",
        accent: "text-emerald-800",
        bar: "bg-emerald-500",
        chart: "#10b981",
      };
    default:
      return {
        badge: "bg-slate-100 text-slate-800 border border-slate-300",
        card: "border-slate-300 bg-gradient-to-br from-slate-100 via-slate-50 to-white shadow-sm",
        accent: "text-slate-800",
        bar: "bg-slate-500",
        chart: "#0c4f74",
      };
  }
}

export function getStatusTone(status: MovementStatus | string) {
  if (status === "cancelled") {
    return {
      badge: "bg-rose-100 text-rose-800 border border-rose-300",
      text: "text-rose-700",
      surface: "border-rose-300 bg-rose-50",
    };
  }

  return {
    badge: "bg-emerald-100 text-emerald-800 border border-emerald-300",
    text: "text-emerald-700",
    surface: "border-emerald-300 bg-emerald-50",
  };
}

export function getMovementTone(type: string) {
  switch (type) {
    case "loan_in":
    case "loan_out":
      return "bg-cyan-100 text-cyan-900 border border-cyan-300";
    case "return_in":
    case "return_out":
      return "bg-violet-100 text-violet-900 border border-violet-300";
    default:
      return "bg-slate-100 text-slate-800 border border-slate-300";
  }
}
