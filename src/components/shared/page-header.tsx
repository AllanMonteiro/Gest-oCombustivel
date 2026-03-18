import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 rounded-[1.75rem] border border-border/80 bg-card/95 p-6 shadow-panel backdrop-blur sm:flex-row sm:items-center sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 page-title">{title}</h1>
        <p className="mt-2 max-w-3xl page-subtitle">{description}</p>
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </header>
  );
}
