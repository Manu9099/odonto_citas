import type { PropsWithChildren, ReactNode } from "react";
import { cn } from "../../lib/utils/cn";

interface SectionCardProps extends PropsWithChildren {
  title?: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  className?: string;
}

export function SectionCard({ title, subtitle, rightSlot, className, children }: SectionCardProps) {
  return (
    <section className={cn("rounded-3xl border border-slate-200 bg-white p-5 shadow-sm", className)}>
     {(title || subtitle || rightSlot) && (
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
                {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
              </div>
              {rightSlot}
            </div>
          )}
                {children}
              </section>
            );
          }