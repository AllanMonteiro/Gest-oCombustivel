import { Bell, LogOut, Search, Cloud, CloudOff, AlertTriangle, Download } from "lucide-react";
import type { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";
import { AppLogo } from "@/components/shared/app-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth/AuthContext";
import { useFuelData } from "@/contexts/fuel/fuel-data-context";
import { useInventoryData } from "@/contexts/inventory/inventory-data-context";
import { cn } from "@/lib/utils";
import { primaryNavigation, registryNavigation } from "@/utils/constants/navigation";

function NavigationSection({ title, items }: { title: string; items: typeof primaryNavigation }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-sidebar-foreground/55">
        {title}
      </p>
      <div className="space-y-1.5">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-start gap-3 rounded-2xl border border-transparent px-4 py-3 transition-colors",
                isActive
                  ? "border-sidebar-border bg-sidebar-accent text-sidebar-foreground"
                  : "text-sidebar-foreground/78 hover:border-sidebar-border hover:bg-sidebar-muted",
              )
            }
          >
            <item.icon className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-sidebar-foreground/65">{item.description}</p>
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export function AdminLayout({ children }: PropsWithChildren) {
  const { profile, isSupabaseConfigured, isAuthenticated, signOut } = useAuth();
  const { isRemoteMode: fuelRemote, entries, exits } = useFuelData();
  const { isRemoteMode: inventoryRemote, products: invProds } = useInventoryData();

  const isFullyRemote = fuelRemote && inventoryRemote;
  const hasLocalData = entries.length > 0 || exits.length > 0 || invProds.length > 0;

  return (
    <div className="page-shell">
      <div className="grid min-h-screen lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border-r border-sidebar-border bg-sidebar px-5 py-6 text-sidebar-foreground lg:px-6">
          <AppLogo />
          <div className="mt-10 space-y-8">
            <NavigationSection title="Operacao" items={primaryNavigation} />
            <NavigationSection title="Cadastros" items={registryNavigation} />
          </div>

          <div className="mt-auto pt-10">
            <div className={cn(
              "rounded-2xl border p-4",
              isFullyRemote ? "border-emerald-100 bg-emerald-50/50" : "border-amber-100 bg-amber-50/50"
            )}>
              <div className="flex items-center gap-3">
                {isFullyRemote ? (
                  <Cloud className="h-5 w-5 text-emerald-600" />
                ) : (
                  <CloudOff className="h-5 w-5 text-amber-600" />
                )}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Status: {isFullyRemote ? "Nuvem" : "Local"}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground leading-relaxed">
                    {isFullyRemote ? "Sincronização ativa (Seguro)" : "Dados salvos apenas neste navegador"}
                  </p>
                </div>
              </div>
            </div>
            
            <NavLink to="/relatorios" className="mt-4 flex items-center gap-2 px-4 py-2 text-xs font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors">
              <Download className="h-3 w-3" />
              Backup Manual (CSV)
            </NavLink>
          </div>
        </aside>
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 px-5 py-4 backdrop-blur lg:px-8">
            {!isFullyRemote && hasLocalData && (
              <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 animate-in fade-in slide-in-from-top-2 duration-300">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
                <p>
                  <strong>Atenção:</strong> Você tem dados locais que <strong>não</strong> estão na nuvem. 
                  Se você limpar o cache do navegador, poderá perdê-los. 
                  <span className="hidden sm:inline"> Faça login ou verifique sua conexão para sincronizar.</span>
                </p>
              </div>
            )}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Painel administrativo</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">Controle de Estoque e Combustível</h2>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="flex min-w-[280px] items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-sm">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    className="w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                    placeholder="Pesquisar modulos, relatorios ou cadastros"
                  />
                </label>
                <Button variant="outline" className="justify-start gap-2 bg-white">
                  <Bell className="h-4 w-4" />
                  Alertas
                </Button>
                {isSupabaseConfigured && isAuthenticated ? (
                  <Button variant="outline" className="justify-start gap-2 bg-white" onClick={() => void signOut()}>
                    <LogOut className="h-4 w-4" />
                    {profile?.nome ?? "Sair"}
                  </Button>
                ) : null}
              </div>
            </div>
          </header>
          <main className="flex-1 px-5 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
