import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center px-6">
      <div className="max-w-lg rounded-[2rem] border border-border bg-card p-10 text-center shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Erro 404</p>
        <h1 className="mt-4 text-3xl font-semibold">Página não encontrada.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          A rota solicitada não existe na estrutura atual do sistema.
        </p>
        <Button asChild className="mt-8">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}
