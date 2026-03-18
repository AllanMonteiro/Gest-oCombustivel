import { Flame } from "lucide-react";

export function AppLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-primary text-accent-foreground shadow-panel">
        <Flame className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sidebar-foreground/70">
          ERP Operacional
        </p>
        <h1 className="text-base font-semibold text-sidebar-foreground">
          Controle de Combustivel
        </h1>
      </div>
    </div>
  );
}
