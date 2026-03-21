import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormField } from "@/components/forms/form-field";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useFuelData } from "@/contexts/fuel/fuel-data-context";
import { useInventoryData } from "@/contexts/inventory/inventory-data-context";
import { useAuth } from "@/contexts/auth/AuthContext";
import { useState } from "react";

const schema = z.object({
  dataInicial: z.string().optional(),
  dataFinal: z.string().optional(),
  combustivel: z.string().optional(),
  area: z.string().optional(),
  equipamento: z.string().optional(),
  categoriaProduto: z.string().optional(),
  produtoId: z.string().optional(),
  usuario: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type AreaCostRow = {
  area: string;
  custoCombustivel: number;
  custoProdutos: number;
  custoTotal: number;
  litrosCombustivel: number;
  itensProdutos: number;
};

type EquipmentCostRow = {
  equipamento: string;
  area: string;
  litros: number;
  custoCombustivel: number;
  custoProdutos: number;
  custoTotal: number;
  abastecimentos: number;
  itensProdutos: number;
};

type InventoryStockAreaRow = {
  area: string;
  quantidadeItens: number;
  valorEstoque: number;
  produtosAtivos: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function isWithinRange(date: string, start?: string, end?: string) {
  if (!date) return false;
  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
}

export function RelatoriosPage() {
  const { session } = useAuth();
  const [saving, setSaving] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      dataInicial: "",
      dataFinal: "",
      combustivel: "",
      area: "",
      equipamento: "",
      categoriaProduto: "",
      produtoId: "",
      usuario: "",
    },
  });

  const filters = form.watch();
  const { exits, stockByFuel, isRemoteMode: isFuelRemoteMode, syncError: fuelSyncError } = useFuelData();
  const {
    products: inventoryProducts,
    exits: inventoryExits,
    stock: inventoryStock,
    isRemoteMode: isInventoryRemoteMode,
    syncError: inventorySyncError,
  } = useInventoryData();

  const availableAreas = useMemo(() => Array.from(new Set([
    ...exits.map((item) => item.area).filter(Boolean),
    ...inventoryExits.map((item) => item.area).filter(Boolean),
    ...inventoryStock.map((item) => item.areaResponsavel).filter(Boolean),
  ])).sort(), [exits, inventoryExits, inventoryStock]);

  const availableEquipments = useMemo(() => Array.from(new Set([
    ...exits.map((item) => item.equipamento).filter(Boolean),
    ...inventoryExits.map((item) => item.equipamento).filter(Boolean),
  ])).sort(), [exits, inventoryExits]);

  const availableUsers = useMemo(() => Array.from(new Set(exits.map((item) => item.usuarioNome).filter(Boolean))).sort(), [exits]);
  const availableFuels = useMemo(() => stockByFuel.map((item) => item.combustivel).sort(), [stockByFuel]);
  const availableProductCategories = useMemo(() => Array.from(new Set(inventoryProducts.map((item) => item.categoria).filter(Boolean))).sort(), [inventoryProducts]);
  const availableProducts = useMemo(() => inventoryProducts
    .filter((item) => !filters.categoriaProduto || item.categoria === filters.categoriaProduto)
    .sort((left, right) => left.nome.localeCompare(right.nome)), [inventoryProducts, filters.categoriaProduto]);

  const fuelCostMap = useMemo(() => new Map(stockByFuel.map((item) => [item.combustivel, item.custoMedio])), [stockByFuel]);
  const productCostMap = useMemo(() => new Map(inventoryStock.map((item) => [item.produtoId, item.custoMedio])), [inventoryStock]);
  const productMap = useMemo(() => new Map(inventoryProducts.map((item) => [item.id, item])), [inventoryProducts]);

  const filteredFuelExits = useMemo(() => exits.filter((item) => {
    if (item.movementType !== "regular" || item.status !== "active") return false;
    if (!isWithinRange(item.data, filters.dataInicial || undefined, filters.dataFinal || undefined)) return false;
    if (filters.combustivel && item.combustivel !== filters.combustivel) return false;
    if (filters.area && item.area !== filters.area) return false;
    if (filters.equipamento && item.equipamento !== filters.equipamento) return false;
    if (filters.usuario && !item.usuarioNome.toLowerCase().includes(filters.usuario.toLowerCase())) return false;
    return true;
  }), [exits, filters]);

  const filteredInventoryExits = useMemo(() => inventoryExits.filter((item) => {
    if (!isWithinRange(item.data, filters.dataInicial || undefined, filters.dataFinal || undefined)) return false;
    if (filters.area && item.area !== filters.area) return false;
    if (filters.equipamento && item.equipamento !== filters.equipamento) return false;
    if (filters.produtoId && item.produtoId !== filters.produtoId) return false;
    const product = productMap.get(item.produtoId);
    if (filters.categoriaProduto && product?.categoria !== filters.categoriaProduto) return false;
    return true;
  }), [inventoryExits, filters, productMap]);

  const filteredInventoryStock = useMemo(() => inventoryStock.filter((item) => {
    if (filters.area && item.areaResponsavel !== filters.area) return false;
    if (filters.produtoId && item.produtoId !== filters.produtoId) return false;
    if (filters.categoriaProduto && item.categoria !== filters.categoriaProduto) return false;
    return true;
  }), [inventoryStock, filters]);

  const areaCosts = useMemo<AreaCostRow[]>(() => {
    const grouped = new Map<string, AreaCostRow>();

    for (const item of filteredFuelExits) {
      const key = item.area || "Sem area";
      const current = grouped.get(key) ?? { area: key, custoCombustivel: 0, custoProdutos: 0, custoTotal: 0, litrosCombustivel: 0, itensProdutos: 0 };
      const custo = item.litros * Number(fuelCostMap.get(item.combustivel) ?? 0);
      current.custoCombustivel += custo;
      current.custoTotal += custo;
      current.litrosCombustivel += item.litros;
      grouped.set(key, current);
    }

    for (const item of filteredInventoryExits) {
      const key = item.area || "Sem area";
      const current = grouped.get(key) ?? { area: key, custoCombustivel: 0, custoProdutos: 0, custoTotal: 0, litrosCombustivel: 0, itensProdutos: 0 };
      const custo = item.quantidade * Number(productCostMap.get(item.produtoId) ?? 0);
      current.custoProdutos += custo;
      current.custoTotal += custo;
      current.itensProdutos += item.quantidade;
      grouped.set(key, current);
    }

    return Array.from(grouped.values()).map((item) => ({
      ...item,
      custoCombustivel: Number(item.custoCombustivel.toFixed(2)),
      custoProdutos: Number(item.custoProdutos.toFixed(2)),
      custoTotal: Number(item.custoTotal.toFixed(2)),
      litrosCombustivel: Number(item.litrosCombustivel.toFixed(2)),
      itensProdutos: Number(item.itensProdutos.toFixed(2)),
    })).sort((left, right) => right.custoTotal - left.custoTotal);
  }, [filteredFuelExits, filteredInventoryExits, fuelCostMap, productCostMap]);

  const equipmentCosts = useMemo<EquipmentCostRow[]>(() => {
    const grouped = new Map<string, EquipmentCostRow>();

    for (const item of filteredFuelExits) {
      const key = item.equipamento || "Sem equipamento";
      const current = grouped.get(key) ?? { equipamento: key, area: item.area || "Sem area", litros: 0, custoCombustivel: 0, custoProdutos: 0, custoTotal: 0, abastecimentos: 0, itensProdutos: 0 };
      const custo = item.litros * Number(fuelCostMap.get(item.combustivel) ?? 0);
      current.litros += item.litros;
      current.custoCombustivel += custo;
      current.custoTotal += custo;
      current.abastecimentos += 1;
      grouped.set(key, current);
    }

    for (const item of filteredInventoryExits) {
      const key = item.equipamento || "Sem equipamento";
      const current = grouped.get(key) ?? { equipamento: key, area: item.area || "Sem area", litros: 0, custoCombustivel: 0, custoProdutos: 0, custoTotal: 0, abastecimentos: 0, itensProdutos: 0 };
      const custo = item.quantidade * Number(productCostMap.get(item.produtoId) ?? 0);
      current.custoProdutos += custo;
      current.custoTotal += custo;
      current.itensProdutos += item.quantidade;
      grouped.set(key, current);
    }

    return Array.from(grouped.values()).map((item) => ({
      ...item,
      litros: Number(item.litros.toFixed(2)),
      custoCombustivel: Number(item.custoCombustivel.toFixed(2)),
      custoProdutos: Number(item.custoProdutos.toFixed(2)),
      custoTotal: Number(item.custoTotal.toFixed(2)),
      itensProdutos: Number(item.itensProdutos.toFixed(2)),
    })).sort((left, right) => right.custoTotal - left.custoTotal);
  }, [filteredFuelExits, filteredInventoryExits, fuelCostMap, productCostMap]);

  const stockByArea = useMemo<InventoryStockAreaRow[]>(() => {
    const grouped = new Map<string, InventoryStockAreaRow>();

    for (const item of filteredInventoryStock) {
      const key = item.areaResponsavel || "Sem area";
      const current = grouped.get(key) ?? { area: key, quantidadeItens: 0, valorEstoque: 0, produtosAtivos: 0 };
      current.quantidadeItens += item.saldoAtual;
      current.valorEstoque += item.valorEstoque;
      current.produtosAtivos += 1;
      grouped.set(key, current);
    }

    return Array.from(grouped.values()).map((item) => ({
      ...item,
      quantidadeItens: Number(item.quantidadeItens.toFixed(2)),
      valorEstoque: Number(item.valorEstoque.toFixed(2)),
    })).sort((left, right) => right.valorEstoque - left.valorEstoque);
  }, [filteredInventoryStock]);

  const totalAreaCost = useMemo(() => areaCosts.reduce((sum, item) => sum + item.custoTotal, 0), [areaCosts]);
  const totalEquipmentCost = useMemo(() => equipmentCosts.reduce((sum, item) => sum + item.custoTotal, 0), [equipmentCosts]);
  const totalProductAreaCost = useMemo(() => areaCosts.reduce((sum, item) => sum + item.custoProdutos, 0), [areaCosts]);
  const totalUsedFuelLiters = useMemo(() => filteredFuelExits.reduce((sum, item) => sum + item.litros, 0), [filteredFuelExits]);
  const totalUsedFuelValue = useMemo(() => filteredFuelExits.reduce((sum, item) => sum + (item.litros * Number(fuelCostMap.get(item.combustivel) ?? 0)), 0), [filteredFuelExits, fuelCostMap]);
  const totalUsedProductQuantity = useMemo(() => filteredInventoryExits.reduce((sum, item) => sum + item.quantidade, 0), [filteredInventoryExits]);
  const totalUsedProductValue = useMemo(() => filteredInventoryExits.reduce((sum, item) => sum + (item.quantidade * Number(productCostMap.get(item.produtoId) ?? 0)), 0), [filteredInventoryExits, productCostMap]);
  const totalStockFuelLiters = useMemo(() => stockByFuel
    .filter((item) => !filters.combustivel || item.combustivel === filters.combustivel)
    .reduce((sum, item) => sum + item.saldoLitros, 0), [stockByFuel, filters.combustivel]);
  const totalStockFuelValue = useMemo(() => stockByFuel
    .filter((item) => !filters.combustivel || item.combustivel === filters.combustivel)
    .reduce((sum, item) => sum + item.valorEstimado, 0), [stockByFuel, filters.combustivel]);
  const totalStockProductQuantity = useMemo(() => filteredInventoryStock.reduce((sum, item) => sum + item.saldoAtual, 0), [filteredInventoryStock]);
  const totalStockProductValue = useMemo(() => filteredInventoryStock.reduce((sum, item) => sum + item.valorEstoque, 0), [filteredInventoryStock]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Analises"
        title="Relatorios gerenciais"
        description="Relatorio consolidado de custos por area e por equipamento, considerando combustivel e produtos gerais vinculados ao consumo operacional."
        actions={(
          <Button
            variant="outline"
            disabled={saving}
            onClick={async () => {
              if (!session?.access_token) return;
              try {
                setSaving(true);
                const baseUrl = import.meta.env.VITE_API_BASE_URL || "";
                const response = await fetch(`${baseUrl}/api/relatorios/movimentacoes.csv`, {
                  headers: {
                    "Authorization": `Bearer ${session.access_token}`
                  }
                });
                if (!response.ok) throw new Error("Erro ao gerar relatorio.");
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `relatorio-movimentacoes-${new Date().toISOString().split("T")[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } catch (err) {
                console.error(err);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Gerando..." : "Exportar CSV"}
          </Button>
        )}
      />

      <SectionCard title="Filtros do relatorio" description="Filtre por periodo, combustivel, area, equipamento, categoria, produto e usuario para recalcular os custos em tempo real.">
        <form id="relatorio-form" className="grid gap-x-4 gap-y-5 md:grid-cols-2 xl:grid-cols-4" onSubmit={form.handleSubmit(() => undefined)}>
          <FormField label="Periodo inicial"><Input type="date" {...form.register("dataInicial")} /></FormField>
          <FormField label="Periodo final"><Input type="date" {...form.register("dataFinal")} /></FormField>
          <FormField label="Combustivel"><Select {...form.register("combustivel")}><option value="">Todos</option>{availableFuels.map((fuel) => <option key={fuel} value={fuel}>{fuel}</option>)}</Select></FormField>
          <FormField label="Area"><Select {...form.register("area")}><option value="">Todas</option>{availableAreas.map((area) => <option key={area} value={area}>{area}</option>)}</Select></FormField>
          <FormField label="Equipamento"><Select {...form.register("equipamento")}><option value="">Todos</option>{availableEquipments.map((equipment) => <option key={equipment} value={equipment}>{equipment}</option>)}</Select></FormField>
          <FormField label="Categoria do produto"><Select {...form.register("categoriaProduto")}><option value="">Todas</option>{availableProductCategories.map((category) => <option key={category} value={category}>{category}</option>)}</Select></FormField>
          <FormField label="Produto"><Select {...form.register("produtoId")}><option value="">Todos</option>{availableProducts.map((product) => <option key={product.id} value={product.id}>{product.nome}</option>)}</Select></FormField>
          <FormField label="Usuario"><Select {...form.register("usuario")}><option value="">Todos</option>{availableUsers.map((user) => <option key={user} value={user}>{user}</option>)}</Select></FormField>
          <div className="md:col-span-2 xl:col-span-4 flex justify-start border-t border-border/70 pt-4">
            <Button type="submit" className="w-full md:w-auto md:min-w-56">Aplicar filtros</Button>
          </div>
        </form>
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Ja utilizado combustivel" value={`${totalUsedFuelLiters.toLocaleString("pt-BR")} L`} helper={`${formatCurrency(totalUsedFuelValue)} consumidos nos filtros`} tone="used" />
        <MetricCard label="Ja utilizado produtos" value={totalUsedProductQuantity.toLocaleString("pt-BR")} helper={`${formatCurrency(totalUsedProductValue)} retirados do estoque`} tone="used" />
        <MetricCard label="Em estoque combustivel" value={`${totalStockFuelLiters.toLocaleString("pt-BR")} L`} helper={`${formatCurrency(totalStockFuelValue)} em saldo atual`} tone="stock" />
        <MetricCard label="Em estoque produtos" value={totalStockProductQuantity.toLocaleString("pt-BR")} helper={`${formatCurrency(totalStockProductValue)} em saldo atual`} tone="stock" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Custo por areas" value={formatCurrency(totalAreaCost)} helper="Consumo de combustivel e produtos por area" />
        <MetricCard label="Custo por equipamentos" value={formatCurrency(totalEquipmentCost)} helper="Consumo de combustivel e produtos por equipamento" />
        <MetricCard label="Produtos nas areas" value={formatCurrency(totalProductAreaCost)} helper="Valor ja utilizado dos itens do estoque geral" />
      </div>

      {(isFuelRemoteMode || isInventoryRemoteMode) ? <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">Modo remoto ativo: relatorio calculado com dados sincronizados da API.</div> : null}
      {fuelSyncError ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Combustivel: {fuelSyncError}</div> : null}
      {inventorySyncError ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Estoque geral: {inventorySyncError}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Custos por area" description="Soma o custo do combustivel consumido e dos produtos retirados do estoque geral por area.">
          <div className="space-y-3">
            {areaCosts.length > 0 ? areaCosts.map((item) => (
              <div key={item.area} className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2"><p className="font-semibold text-foreground">{item.area}</p><Badge className="border border-slate-200 bg-slate-50 text-slate-700">Area</Badge></div>
                    <p className="mt-2 text-sm text-muted-foreground">Combustivel: {item.litrosCombustivel.toLocaleString("pt-BR")} L</p>
                    <p className="mt-1 text-sm text-muted-foreground">Produtos: {item.itensProdutos.toLocaleString("pt-BR")} itens/unidades</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(item.custoTotal)}</p>
                    <p className="mt-2 text-sm text-muted-foreground">Combustivel: {formatCurrency(item.custoCombustivel)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Produtos: {formatCurrency(item.custoProdutos)}</p>
                  </div>
                </div>
              </div>
            )) : <EmptyState message="Nenhum custo por area encontrado para os filtros atuais." />}
          </div>
        </SectionCard>

        <SectionCard title="Custos por equipamento" description="Mostra o que ja foi utilizado em combustivel e produtos gerais por equipamento atendido.">
          <div className="space-y-3">
            {equipmentCosts.length > 0 ? equipmentCosts.map((item) => (
              <div key={item.equipamento} className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">{item.equipamento}</p>
                    <p className="mt-2 text-sm text-muted-foreground">Area: {item.area}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Abastecimentos combustivel: {item.abastecimentos.toLocaleString("pt-BR")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Itens de produtos: {item.itensProdutos.toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(item.custoTotal)}</p>
                    <p className="mt-2 text-sm text-muted-foreground">Combustivel: {formatCurrency(item.custoCombustivel)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Produtos: {formatCurrency(item.custoProdutos)}</p>
                  </div>
                </div>
              </div>
            )) : <EmptyState message="Nenhum custo por equipamento encontrado para os filtros atuais." />}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Estoque atual por area" description="Separa o saldo atual do estoque geral por area responsavel, com quantidade e valor em reais.">
          <div className="space-y-3">
            {stockByArea.length > 0 ? stockByArea.map((item) => (
              <div key={item.area} className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2"><p className="font-semibold text-foreground">{item.area}</p><Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">Estoque</Badge></div>
                    <p className="mt-2 text-sm text-muted-foreground">Quantidade em estoque: {item.quantidadeItens.toLocaleString("pt-BR")} itens/unidades</p>
                    <p className="mt-1 text-sm text-muted-foreground">Produtos ativos: {item.produtosAtivos.toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(item.valorEstoque)}</p>
                    <p className="mt-2 text-sm text-muted-foreground">Valor atual em estoque</p>
                  </div>
                </div>
              </div>
            )) : <EmptyState message="Nenhum saldo em estoque encontrado para os filtros atuais." />}
          </div>
        </SectionCard>

        <SectionCard title="Leitura do relatorio" description="Distingue o que ja saiu para uso operacional do que ainda permanece em saldo no estoque atual.">
          <div className="space-y-3">
            <SummaryPanel title="Ja utilizado" lines={[
              `Combustivel: ${totalUsedFuelLiters.toLocaleString("pt-BR")} L e ${formatCurrency(totalUsedFuelValue)}`,
              `Produtos: ${totalUsedProductQuantity.toLocaleString("pt-BR")} itens/unidades e ${formatCurrency(totalUsedProductValue)}`,
            ]} tone="used" />
            <SummaryPanel title="Em estoque" lines={[
              `Combustivel: ${totalStockFuelLiters.toLocaleString("pt-BR")} L e ${formatCurrency(totalStockFuelValue)}`,
              `Produtos: ${totalStockProductQuantity.toLocaleString("pt-BR")} itens/unidades e ${formatCurrency(totalStockProductValue)}`,
            ]} tone="stock" />
            <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-4 text-sm leading-6 text-muted-foreground">
              O saldo em estoque reflete a posicao atual do sistema. Ele respeita os filtros de combustivel, area, categoria e produto. Filtros de equipamento, usuario e periodo continuam valendo apenas para a parte ja utilizada.
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  tone = "default",
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "default" | "used" | "stock";
}) {
  const toneClassName = tone === "used"
    ? "border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-white"
    : tone === "stock"
      ? "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-white"
      : "border-border/70 bg-card";

  const eyebrowClassName = tone === "used"
    ? "text-rose-600"
    : tone === "stock"
      ? "text-emerald-600"
      : "text-accent";

  return (
    <div className={`rounded-[1.5rem] border p-5 shadow-panel ${toneClassName}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${eyebrowClassName}`}>{label}</p>
      <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{helper}</p>
    </div>
  );
}

function SummaryPanel({
  title,
  lines,
  tone,
}: {
  title: string;
  lines: string[];
  tone: "used" | "stock";
}) {
  const className = tone === "used"
    ? "border-rose-200 bg-rose-50/70"
    : "border-emerald-200 bg-emerald-50/70";

  return (
    <div className={`rounded-2xl border px-4 py-4 ${className}`}>
      <p className="font-semibold text-foreground">{title}</p>
      {lines.map((line) => <p key={line} className="mt-2 text-sm leading-6 text-muted-foreground">{line}</p>)}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-background px-6 py-12 text-center text-sm text-muted-foreground">{message}</div>;
}
