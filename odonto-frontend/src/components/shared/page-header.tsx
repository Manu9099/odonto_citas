import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-2 text-xs font-black uppercase tracking-[0.25em] text-cyan-600">
            {eyebrow}
          </p>
        ) : null}

        <h1 className="text-3xl font-black tracking-tight text-slate-950">
          {title}
        </h1>

        {description ? (
          <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div>{actions}</div> : null}
    </header>
  );
}