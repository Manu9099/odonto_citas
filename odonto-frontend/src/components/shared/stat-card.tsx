import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, hint, icon }: StatCardProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
        {hint ? <p className="text-sm text-slate-500">{hint}</p> : null}
      </div>
          </div>
        );
      }