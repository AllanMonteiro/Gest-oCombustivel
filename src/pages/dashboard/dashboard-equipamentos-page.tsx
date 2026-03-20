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

const schema = z.object({
  dataInicial: z.string().optional(),
  dataFinal: z.string().optional(),
  area: z.string().optional(),
  equipamento: z.string().optional(),
  categoriaProduto: z.string().optional(),
  produtoId: z.string().optional(),
  combustivel: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type EquipmentDashboardRow = {
  equipamento: string;
  area: string;
  litrosCombustivel: number;
  valorCombustivel: number;
  itensProdutos: number;
  valorProdutos: number;
  custoTotal: number;
  abastecimentos: number;
  retiradasProdutos: number;
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

export function DashboardEquipamentosPage() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      dataInicial: "",
      dataFinal: "",
      area: "",
      equipamento: "",
      categoriaProduto: "",
      produtoId: "",
      combustivel: "",
    },
  });

  const filters = form.watch();
  const { exits: fuelExits, stockByFuel } = useFuelData();
  const { products, exits: inventoryExits, stock: inventoryStock } = useInventoryData();

  const availableAreas = useMemo(() => Array.from(new Set([
    ...fuelExits.map((item) => item.area).filter(Boolean),
    ...inventoryExits.map((item) => item.area).filter(Boolean),
  ])).sort(), [fuelExits, inventoryExits]);

  const availableEquipments = useMemo(() => Array.from(new Set([
    ...fuelExits.map((item) => item.equipamento).filter(Boolean),
    ...inventoryExits.map((item) => item.equipamento).filter(Boolean),
  ])).sort(), [fuelExits, inventoryExits]);

  const availableFuels = useMemo(() => stockByFuel.map((item) => item.combustivel).sort(), [stockByFuel]);
  const availableProductCategories = useMemo(() => Array.from(new Set(products.map((item) => item.categoria).filter(Boolean))).sort(), [products]);
  const availableProducts = useMemo(() => products
    .filter((item) => !filters.categoriaProduto || item.categoria === filters.categoriaProduto)
    .sort((left, right) => left.nome.localeCompare(right.nome)), [products, filters.categoriaProduto]);

  const fuelCostMap = useMemo(() => new Map(stockByFuel.map((item) => [item.combustivel, item.custoMedio])), [stockByFuel]);
  const productCostMap = useMemo(() => new Map(inventoryStock.map((item) => [item.produtoId, item.custoMedio])), [inventoryStock]);
  const productMap = useMemo(() => new Map(products.map((item) => [item.id, item])), [products]);

  const filteredFuelExits = useMemo(() => fuelExits.filter((item) => {
    if (item.movementType !== "regular" || item.status !== "active") return false;
    if (!isWithinRange(item.data, filters.dataInicial || undefined, filters.dataFinal || undefined)) return false;
    if (filters.area && item.area !== filters.area) return false;
    if (filters.equipamento && item.equipamento !== filters.equipamento) return false;
    if (filters.combustivel && item.combustivel !== filters.combustivel) return false;
    return true;
  }), [fuelExits, filters]);

  const filteredInventoryExits = useMemo(() => inventoryExits.filter((item) => {
    if (!isWithinRange(item.data, filters.dataInicial || undefined, filters.dataFinal || undefined)) return false;
    if (filters.area && item.area !== filters.area) return false;
    if (filters.equipamento && item.equipamento !== filters.equipamento) return false;
    if (filters.produtoId && item.produtoId !== filters.produtoId) return false;
    const product = productMap.get(item.produtoId);
    if (filters.categoriaProduto && product?.categoria !== filters.categoriaProduto) return false;
    return true;
  }), [inventoryExits, filters, productMap]);

  const equipmentRows = useMemo<EquipmentDashboardRow[]>(() => {
    const grouped = new Map<string, EquipmentDashboardRow>();

    for (const item of filteredFuelExits) {
      const key = item.equipamento || "Sem equipamento";
      const current = grouped.get(key) ?? {
        equipamento: key,
        area: item.area || "Sem area",
        litrosCombustivel: 0,
        valorCombustivel: 0,
        itensProdutos: 0,
        valorProdutos: 0,
        custoTotal: 0,
        abastecimentos: 0,
        retiradasProdutos: 0,
      };
      const valor = item.litros * Number(fuelCostMap.get(item.combustivel) ?? 0);
      current.litrosCombustivel += item.litros;
      current.valorCombustivel += valor;
      current.custoTotal += valor;
      current.abastecimentos += 1;
      grouped.set(key, current);
    }

    for (const item of filteredInventoryExits) {
      const key = item.equipamento || "Sem equipamento";
      const current = grouped.get(key) ?? {
        equipamento: key,
        area: item.area || "Sem area",
        litrosCombustivel: 0,
        valorCombustivel: 0,
        itensProdutos: 0,
        valorProdutos: 0,
        custoTotal: 0,
        abastecimentos: 0,
        retiradasProdutos: 0,
      };
      const valor = item.quantidade * Number(productCostMap.get(item.produtoId) ?? 0);
      current.itensProdutos += item.quantidade;
      current.valorProdutos += valor;
      current.custoTotal += valor;
      current.retiradasProdutos += 1;
      grouped.set(key, current);
    }

    return Array.from(grouped.values()).map((item) => ({
      ...item,
      litrosCombustivel: Number(item.litrosCombustivel.toFixed(2)),
      valorCombustivel: Number(item.valorCombustivel.toFixed(2)),
      itensProdutos: Number(item.itensProdutos.toFixed(2)),
      valorProdutos: Number(item.valorProdutos.toFixed(2)),
      custoTotal: Number(item.custoTotal.toFixed(2)),
    })).sort((left, right) => right.custoTotal - left.custoTotal);
  }, [filteredFuelExits, filteredInventoryExits, fuelCostMap, productCostMap]);

  const productUsageRows = useMemo(() => filteredInventoryExits.map((item) => {
    const product = productMap.get(item.produtoId);
    const custoUnitario = Number(productCostMap.get(item.produtoId) ?? 0);
    return {
      id: item.id,
      equipamento: item.equipamento || "Sem equipamento",
      area: item.area || "Sem area",
      produto: product?.nome ?? "Produto nao localizado",
      categoria: product?.categoria ?? "Sem categoria",
      quantidade: item.quantidade,
      valor: item.quantidade * custoUnitario,
    };
  }).sort((left, right) => right.valor - left.valor), [filteredInventoryExits, productMap, productCostMap]);

  const totalEquipmentCount = useMemo(() => equipmentRows.length, [equipmentRows]);
  const totalFuelLiters = useMemo(() => equipmentRows.reduce((sum, item) => sum + item.litrosCombustivel, 0), [equipmentRows]);
  const totalProductItems = useMemo(() => equipmentRows.reduce((sum, item) => sum + item.itensProdutos, 0), [equipmentRows]);
  const totalOperationalCost = useMemo(() => equipmentRows.reduce((sum, item) => sum + item.custoTotal, 0), [equipmentRows]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Dashboard" title="Dashboard de equipamentos" description="Painel dedicado aos equipamentos, consolidando combustivel e produtos no mesmo formato da aba de relatorios." />

      <SectionCard title="Filtros do dashboard" description="Filtre por periodo, area, equipamento, combustivel, categoria e produto para recalcular o painel em tempo real.">
        <form id="dashboard-equipamentos-form" className="grid gap-x-4 gap-y-5 md:grid-cols-2 xl:grid-cols-4" onSubmit={form.handleSubmit(() => undefined)}>
          <FormField label="Periodo inicial"><Input type="date" {...form.register("dataInicial")} /></FormField>
          <FormField label="Periodo final"><Input type="date" {...form.register("dataFinal")} /></FormField>
          <FormField label="Area"><Select {...form.register("area")}><option value="">Todas</option>{availableAreas.map((area) => <option key={area} value={area}>{area}</option>)}</Select></FormField>
          <FormField label="Equipamento"><Select {...form.register("equipamento")}><option value="">Todos</option>{availableEquipments.map((equipment) => <option key={equipment} value={equipment}>{equipment}</option>)}</Select></FormField>
          <FormField label="Combustivel"><Select {...form.register("combustivel")}><option value="">Todos</option>{availableFuels.map((fuel) => <option key={fuel} value={fuel}>{fuel}</option>)}</Select></FormField>
          <FormField label="Categoria do produto"><Select {...form.register("categoriaProduto")}><option value="">Todas</option>{availableProductCategories.map((category) => <option key={category} value={category}>{category}</option>)}</Select></FormField>
          <FormField label="Produto"><Select {...form.register("produtoId")}><option value="">Todos</option>{availableProducts.map((product) => <option key={product.id} value={product.id}>{product.nome}</option>)}</Select></FormField>
          <div className="md:col-span-2 xl:col-span-4 flex justify-start border-t border-border/70 pt-4">
            <Button type="submit" className="w-full md:w-auto md:min-w-56">Aplicar filtros</Button>
          </div>
        </form>
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Equipamentos atendidos" value={totalEquipmentCount.toLocaleString("pt-BR")} helper="Quantidade de equipamentos no recorte aplicado" tone="default" />
        <MetricCard label="Combustivel utilizado" value={`${totalFuelLiters.toLocaleString("pt-BR")} L`} helper="Litros consumidos pelos equipamentos" tone="used" />
        <MetricCard label="Produtos utilizados" value={totalProductItems.toLocaleString("pt-BR")} helper="Itens retirados para uso nos equipamentos" tone="used" />
        <MetricCard label="Custo operacional" value={formatCurrency(totalOperationalCost)} helper="Combustivel e produtos somados por equipamento" tone="stock" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Custo por equipamento" description="Mostra quanto cada equipamento ja consumiu em combustivel e produtos, com consolidado financeiro.">
          <div className="space-y-3">
            {equipmentRows.length > 0 ? equipmentRows.map((item) => (
              <div key={item.equipamento} className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">{item.equipamento}</p>
                    <p className="mt-2 text-sm text-muted-foreground">Area: {item.area}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Combustivel: {item.litrosCombustivel.toLocaleString("pt-BR")} L em {item.abastecimentos.toLocaleString("pt-BR")} abastecimentos</p>
                    <p className="mt-1 text-sm text-muted-foreground">Produtos: {item.itensProdutos.toLocaleString("pt-BR")} itens em {item.retiradasProdutos.toLocaleString("pt-BR")} retiradas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(item.custoTotal)}</p>
                    <p className="mt-2 text-sm text-muted-foreground">Combustivel: {formatCurrency(item.valorCombustivel)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Produtos: {formatCurrency(item.valorProdutos)}</p>
                  </div>
                </div>
              </div>
            )) : <EmptyState message="Nenhum equipamento encontrado para os filtros atuais." />}
          </div>
        </SectionCard>

        <SectionCard title="Uso de produtos por equipamento" description="Lista as retiradas de pecas, movelaria e demais itens vinculadas a equipamentos.">
          <div className="space-y-3">
            {productUsageRows.length > 0 ? productUsageRows.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2"><p className="font-semibold text-foreground">{item.equipamento}</p><Badge className="border border-slate-200 bg-slate-50 text-slate-700">{item.categoria}</Badge></div>
                    <p className="mt-2 text-sm text-muted-foreground">Produto: {item.produto}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Area: {item.area}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Quantidade: {item.quantidade.toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(item.valor)}</p>
                    <p className="mt-2 text-sm text-muted-foreground">Valor da retirada</p>
                  </div>
                </div>
              </div>
            )) : <EmptyState message="Nenhuma retirada de produto vinculada a equipamento foi encontrada nos filtros atuais." />}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function MetricCard({ label, value, helper, tone }: { label: string; value: string; helper: string; tone: "default" | "used" | "stock" }) {
  const toneClassName = tone === "used"
    ? "border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-white"
    : tone === "stock"
      ? "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-white"
      : "border-border/70 bg-card";
  const eyebrowClassName = tone === "used" ? "text-rose-600" : tone === "stock" ? "text-emerald-600" : "text-accent";

  return (
    <div className={`rounded-[1.5rem] border p-5 shadow-panel ${toneClassName}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${eyebrowClassName}`}>{label}</p>
      <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{helper}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-background px-6 py-12 text-center text-sm text-muted-foreground">{message}</div>;
}
