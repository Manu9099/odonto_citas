import { cn } from "../../lib/utils/cn";

interface StatusBadgeProps {
  label: string;
  variant?: "success" | "warning" | "danger" | "neutral" | "info";
}
const styles = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
  neutral: "bg-slate-50 text-slate-700 border-slate-200",
  info: "bg-cyan-50 text-cyan-700 border-cyan-200",
};
export function StatusBadge({ label, variant = "neutral" }: StatusBadgeProps) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", styles[variant])}>
      {label}
    </span>
  );
}