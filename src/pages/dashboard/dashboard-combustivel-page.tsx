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

const schema = z.object({
  dataInicial: z.string().optional(),
  dataFinal: z.string().optional(),
  combustivel: z.string().optional(),
  area: z.string().optional(),
  equipamento: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type FuelAreaRow = {
  area: string;
  litros: number;
  valor: number;
  abastecimentos: number;
};

type FuelEquipmentRow = {
  equipamento: string;
  area: string;
  litros: number;
  valor: number;
  abastecimentos: number;
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

export function DashboardCombustivelPage() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      dataInicial: "",
      dataFinal: "",
      combustivel: "",
      area: "",
      equipamento: "",
    },
  });

  const filters = form.watch();
  const { exits, stockByFuel, totalEstimatedValue, totalStockLiters } = useFuelData();

  const availableAreas = useMemo(() => Array.from(new Set(exits.map((item) => item.area).filter(Boolean))).sort(), [exits]);
  const availableEquipments = useMemo(() => Array.from(new Set(exits.map((item) => item.equipamento).filter(Boolean))).sort(), [exits]);
  const availableFuels = useMemo(() => stockByFuel.map((item) => item.combustivel).sort(), [stockByFuel]);
  const fuelCostMap = useMemo(() => new Map(stockByFuel.map((item) => [item.combustivel, item.custoMedio])), [stockByFuel]);

  const filteredExits = useMemo(() => exits.filter((item) => {
    if (item.movementType !== "regular" || item.status !== "active") return false;
    if (!isWithinRange(item.data, filters.dataInicial || undefined, filters.dataFinal || undefined)) return false;
    if (filters.combustivel && item.combustivel !== filters.combustivel) return false;
    if (filters.area && item.area !== filters.area) return false;
    if (filters.equipamento && item.equipamento !== filters.equipamento) return false;
    return true;
  }), [exits, filters]);

  const filteredStock = useMemo(() => stockByFuel.filter((item) => !filters.combustivel || item.combustivel === filters.combustivel), [stockByFuel, filters.combustivel]);

  const consumptionByArea = useMemo<FuelAreaRow[]>(() => {
    const grouped = new Map<string, FuelAreaRow>();

    for (const item of filteredExits) {
      const key = item.area || "Sem area";
      const current = grouped.get(key) ?? { area: key, litros: 0, valor: 0, abastecimentos: 0 };
      const valor = item.litros * Number(fuelCostMap.get(item.combustivel) ?? 0);
      current.litros += item.litros;
      current.valor += valor;
      current.abastecimentos += 1;
      grouped.set(key, current);
    }

    return Array.from(grouped.values()).map((item) => ({
      ...item,
      litros: Number(item.litros.toFixed(2)),
      valor: Number(item.valor.toFixed(2)),
    })).sort((left, right) => right.valor - left.valor);
  }, [filteredExits, fuelCostMap]);

  const consumptionByEquipment = useMemo<FuelEquipmentRow[]>(() => {
    const grouped = new Map<string, FuelEquipmentRow>();

    for (const item of filteredExits) {
      const key = item.equipamento || "Sem equipamento";
      const current = grouped.get(key) ?? { equipamento: key, area: item.area || "Sem area", litros: 0, valor: 0, abastecimentos: 0 };
      const valor = item.litros * Number(fuelCostMap.get(item.combustivel) ?? 0);
      current.litros += item.litros;
      current.valor += valor;
      current.abastecimentos += 1;
      grouped.set(key, current);
    }

    return Array.from(grouped.values()).map((item) => ({
      ...item,
      litros: Number(item.litros.toFixed(2)),
      valor: Number(item.valor.toFixed(2)),
    })).sort((left, right) => right.valor - left.valor);
  }, [filteredExits, fuelCostMap]);

  const totalConsumedLiters = useMemo(() => filteredExits.reduce((sum, item) => sum + item.litros, 0), [filteredExits]);
  const totalConsumedValue = useMemo(() => filteredExits.reduce((sum, item) => sum + (item.litros * Number(fuelCostMap.get(item.combustivel) ?? 0)), 0), [filteredExits, fuelCostMap]);
  const filteredStockLiters = useMemo(() => filteredStock.reduce((sum, item) => sum + item.saldoLitros, 0), [filteredStock]);
  const filteredStockValue = useMemo(() => filteredStock.reduce((sum, item) => sum + item.valorEstimado, 0), [filteredStock]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Dashboard" title="Dashboard de combustivel" description="Painel focado em consumo, saldo atual e custo operacional de combustivel no mesmo formato dos relatorios." />

      <SectionCard title="Filtros do dashboard" description="Filtre por periodo, combustivel, area e equipamento para recalcular os indicadores do painel.">
        <form id="dashboard-combustivel-form" className="grid gap-x-4 gap-y-5 md:grid-cols-2 xl:grid-cols-4" onSubmit={form.handleSubmit(() => undefined)}>
          <FormField label="Periodo inicial"><Input type="date" {...form.register("dataInicial")} /></FormField>
          <FormField label="Periodo final"><Input type="date" {...form.register("dataFinal")} /></FormField>
          <FormField label="Combustivel"><Select {...form.register("combustivel")}><option value="">Todos</option>{availableFuels.map((fuel) => <option key={fuel} value={fuel}>{fuel}</option>)}</Select></FormField>
          <FormField label="Area"><Select {...form.register("area")}><option value="">Todas</option>{availableAreas.map((area) => <option key={area} value={area}>{area}</option>)}</Select></FormField>
          <FormField label="Equipamento"><Select {...form.register("equipamento")}><option value="">Todos</option>{availableEquipments.map((equipment) => <option key={equipment} value={equipment}>{equipment}</option>)}</Select></FormField>
          <div className="md:col-span-2 xl:col-span-4 flex justify-start border-t border-border/70 pt-4">
            <Button type="submit" className="w-full md:w-auto md:min-w-56">Aplicar filtros</Button>
          </div>
        </form>
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Combustivel utilizado" value={`${totalConsumedLiters.toLocaleString("pt-BR")} L`} helper={`${formatCurrency(totalConsumedValue)} consumidos no periodo`} tone="used" />
        <MetricCard label="Valor consumido" value={formatCurrency(totalConsumedValue)} helper={`${filteredExits.length.toLocaleString("pt-BR")} abastecimentos considerados`} tone="used" />
        <MetricCard label="Saldo em estoque" value={`${filteredStockLiters.toLocaleString("pt-BR")} L`} helper={`${formatCurrency(filteredStockValue)} de saldo atual`} tone="stock" />
        <MetricCard label="Valor em estoque" value={formatCurrency(filteredStockValue)} helper={`${totalStockLiters.toLocaleString("pt-BR")} L e ${formatCurrency(totalEstimatedValue)} no total geral`} tone="stock" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Consumo por area" description="Mostra a distribuicao do consumo de combustivel por area, com quantidade, custo e numero de abastecimentos.">
          <div className="space-y-3">
            {consumptionByArea.length > 0 ? consumptionByArea.map((item) => (
              <div key={item.area} className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2"><p className="font-semibold text-foreground">{item.area}</p><Badge className="border border-slate-200 bg-slate-50 text-slate-700">Area</Badge></div>
                    <p className="mt-2 text-sm text-muted-foreground">Consumo: {item.litros.toLocaleString("pt-BR")} L</p>
                    <p className="mt-1 text-sm text-muted-foreground">Abastecimentos: {item.abastecimentos.toLocaleString("pt-BR")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(item.valor)}</p>
                    <p className="mt-2 text-sm text-muted-foreground">Custo operacional</p>
                  </div>
                </div>
              </div>
            )) : <EmptyState message="Nenhum consumo por area encontrado para os filtros atuais." />}
          </div>
        </SectionCard>

        <SectionCard title="Saldo por combustivel" description="Resume o estoque atual por tipo de combustivel, com custo medio e valor estimado em reais.">
          <div className="space-y-3">
            {filteredStock.length > 0 ? filteredStock.map((item) => (
              <div key={item.combustivel} className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">{item.combustivel}</p>
                    <p className="mt-2 text-sm text-muted-foreground">Entradas: {item.litrosEntrada.toLocaleString("pt-BR")} L</p>
                    <p className="mt-1 text-sm text-muted-foreground">Saidas: {item.litrosSaida.toLocaleString("pt-BR")} L</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">{item.saldoLitros.toLocaleString("pt-BR")} L</p>
                    <p className="mt-2 text-sm text-muted-foreground">Custo medio: {formatCurrency(item.custoMedio)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Valor estimado: {formatCurrency(item.valorEstimado)}</p>
                  </div>
                </div>
              </div>
            )) : <EmptyState message="Nenhum saldo de combustivel encontrado para os filtros atuais." />}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Consumo por equipamento" description="Detalha quanto cada equipamento ja consumiu em litros e em reais dentro do recorte selecionado.">
        <div className="space-y-3">
          {consumptionByEquipment.length > 0 ? consumptionByEquipment.map((item) => (
            <div key={item.equipamento} className="rounded-2xl border border-border bg-background p-4 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">{item.equipamento}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Area: {item.area}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Consumo: {item.litros.toLocaleString("pt-BR")} L</p>
                  <p className="mt-1 text-sm text-muted-foreground">Abastecimentos: {item.abastecimentos.toLocaleString("pt-BR")}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-foreground">{formatCurrency(item.valor)}</p>
                  <p className="mt-2 text-sm text-muted-foreground">Custo operacional</p>
                </div>
              </div>
            </div>
          )) : <EmptyState message="Nenhum consumo por equipamento encontrado para os filtros atuais." />}
        </div>
      </SectionCard>
    </div>
  );
}

function MetricCard({ label, value, helper, tone }: { label: string; value: string; helper: string; tone: "used" | "stock" }) {
  const toneClassName = tone === "used"
    ? "border-rose-200/80 bg-gradient-to-br from-rose-50 via-white to-white"
    : "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-white";
  const eyebrowClassName = tone === "used" ? "text-rose-600" : "text-emerald-600";

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
