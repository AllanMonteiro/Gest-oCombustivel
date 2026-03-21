import type { PropsWithChildren } from "react";

export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center px-6 py-10">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-panel lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden bg-primary px-10 py-12 text-primary-foreground lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-foreground/70">
            Plataforma administrativa
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight">
            Controle de Estoque e Combustível
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-7 text-primary-foreground/80">
            Base pronta para autenticação, rastreabilidade, estoque consolidado, relatórios e indicadores de consumo.
          </p>
        </section>
        <section className="bg-white px-6 py-10 sm:px-10">{children}</section>
      </div>
    </div>
  );
}
