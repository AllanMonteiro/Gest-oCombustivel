import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function UnauthorizedPage() {
  return (
    <div className="page-shell flex min-h-screen items-center justify-center px-6">
      <div className="max-w-lg rounded-[2rem] border border-border bg-card p-10 text-center shadow-panel">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-destructive">Acesso negado</p>
        <h1 className="mt-4 text-3xl font-semibold">Você não tem permissão para acessar esta área.</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          As regras por perfil serão aplicadas no frontend, no Firestore e nas Cloud Functions nas próximas etapas.
        </p>
        <Button asChild className="mt-8">
          <Link to="/">Voltar ao dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
