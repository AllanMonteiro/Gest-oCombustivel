import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useFuelData } from "@/contexts/fuel/fuel-data-context";
import { getFuelTone, getStatusTone } from "@/utils/constants/fuel-visuals";

function formatLiters(value: number) {
  return `${value.toLocaleString("pt-BR")} L`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatMonth(date: Date) {
  return date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
}

function buildDailyConsumption(exits: ReturnType<typeof useFuelData>["exits"]) {
  const grouped = exits.reduce<Record<string, number>>((acc, item) => {
    const key = item.data;
    acc[key] = (acc[key] ?? 0) + item.litros;
    return acc;
  }, {});

  return Object.entries(grouped)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, litros]) => ({
      date,
      label: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(date)),
      litros: Number(litros.toFixed(2)),
    }));
}

function buildMonthlyConsumption(exits: ReturnType<typeof useFuelData>["exits"]) {
  const grouped = exits.reduce<Record<string, number>>((acc, item) => {
    const date = new Date(item.data);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    acc[key] = (acc[key] ?? 0) + item.litros;
    return acc;
  }, {});

  return Object.entries(grouped)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([monthKey, litros]) => {
      const [year, month] = monthKey.split("-").map(Number);
      const date = new Date(year, month - 1, 1);
      return { monthKey, label: formatMonth(date), litros: Number(litros.toFixed(2)) };
    });
}

export function DashboardPage() {
  const { entries, exits, stockByFuel, partnerBalances } = useFuelData();

  const [selectedArea, setSelectedArea] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedFuel, setSelectedFuel] = useState("all");
  const [selectedEquipment, setSelectedEquipment] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("active");
  const [selectedPartner, setSelectedPartner] = useState("all");

  const allExits = useMemo(() => exits, [exits]);

  const availableAreas = useMemo(() => Array.from(new Set(allExits.map((item) => item.area).filter(Boolean))).sort(), [allExits]);
  const availableMonths = useMemo(() => Array.from(new Set(allExits.map((item) => {
    const date = new Date(item.data);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }))).sort(), [allExits]);
  const availableFuels = useMemo(() => Array.from(new Set([...entries.map((item) => item.combustivel), ...allExits.map((item) => item.combustivel)])).sort(), [entries, allExits]);
  const availableEquipments = useMemo(() => Array.from(new Set(allExits.map((item) => item.equipamento).filter(Boolean))).sort(), [allExits]);
  const availablePartners = useMemo(() => Array.from(new Set([
    ...entries.map((item) => item.partnerName).filter(Boolean),
    ...allExits.map((item) => item.partnerName).filter(Boolean),
  ] as string[])).sort(), [entries, allExits]);

  const filteredExits = useMemo(() => {
    return allExits.filter((item) => {
      const date = new Date(item.data);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const matchArea = selectedArea === "all" || item.area === selectedArea;
      const matchMonth = selectedMonth === "all" || monthKey === selectedMonth;
      const matchFuel = selectedFuel === "all" || item.combustivel === selectedFuel;
      const matchEquipment = selectedEquipment === "all" || item.equipamento === selectedEquipment;
      const matchStatus = selectedStatus === "all" || item.status === selectedStatus;
      const matchPartner = selectedPartner === "all" || item.partnerName === selectedPartner;
      return matchArea && matchMonth && matchFuel && matchEquipment && matchStatus && matchPartner;
    });
  }, [allExits, selectedArea, selectedMonth, selectedFuel, selectedEquipment, selectedStatus, selectedPartner]);

  const dailyConsumption = useMemo(() => buildDailyConsumption(filteredExits), [filteredExits]);
  const monthlyConsumption = useMemo(() => buildMonthlyConsumption(filteredExits), [filteredExits]);
  const latestMovements = useMemo(() => [...entries, ...exits].sort((a, b) => b.data.localeCompare(a.data)).slice(0, 6), [entries, exits]);

  const monthLabel = (monthKey: string) => {
    const [year, month] = monthKey.split("-").map(Number);
    return formatMonth(new Date(year, month - 1, 1));
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Dashboard" title="Visao executiva do abastecimento" description="Painel com estoque, consumo e emprestimos entre parceiros." actions={<Button>Atualizar painel</Button>} />

      <SectionCard title="Filtros do dashboard" description="Use os filtros abaixo para recortar consumos e emprestimos por area, mes, combustivel, equipamento, status e parceiro.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <FormFilter label="Area"><Select value={selectedArea} onChange={(event) => setSelectedArea(event.target.value)}><option value="all">Todas</option>{availableAreas.map((area) => <option key={area} value={area}>{area}</option>)}</Select></FormFilter>
          <FormFilter label="Mes"><Select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}><option value="all">Todos</option>{availableMonths.map((month) => <option key={month} value={month}>{monthLabel(month)}</option>)}</Select></FormFilter>
          <FormFilter label="Combustivel"><Select value={selectedFuel} onChange={(event) => setSelectedFuel(event.target.value)}><option value="all">Todos</option>{availableFuels.map((fuel) => <option key={fuel} value={fuel}>{fuel}</option>)}</Select></FormFilter>
          <FormFilter label="Equipamento"><Select value={selectedEquipment} onChange={(event) => setSelectedEquipment(event.target.value)}><option value="all">Todos</option>{availableEquipments.map((equipment) => <option key={equipment} value={equipment}>{equipment}</option>)}</Select></FormFilter>
          <FormFilter label="Status"><Select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)}><option value="active">Ativas</option><option value="cancelled">Canceladas</option><option value="all">Todas</option></Select></FormFilter>
          <FormFilter label="Parceiro"><Select value={selectedPartner} onChange={(event) => setSelectedPartner(event.target.value)}><option value="all">Todos</option>{availablePartners.map((partner) => <option key={partner} value={partner}>{partner}</option>)}</Select></FormFilter>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <SectionCard title="Saldo por combustivel" description="Cada item abaixo considera entradas menos saidas, custo medio e valor estimado em estoque.">
          <div className="space-y-4">{stockByFuel.map((item) => {
            const tone = getFuelTone(item.combustivel);
            return <div key={item.combustivel} className={`overflow-hidden rounded-[1.25rem] border ${tone.card}`}><div className={`h-2 ${tone.bar}`} /><div className="px-5 py-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="text-base font-semibold text-foreground">{item.combustivel}</p><Badge className={tone.badge}>{item.combustivel}</Badge></div><p className="mt-1 text-sm text-muted-foreground">Entradas: {formatLiters(item.litrosEntrada)} | Saidas: {formatLiters(item.litrosSaida)}</p></div><div className="grid gap-1 text-right"><p className={`text-lg font-semibold ${tone.accent}`}>{formatLiters(item.saldoLitros)}</p><p className="text-sm text-muted-foreground">Saldo atual</p><p className="text-sm text-muted-foreground">Custo medio: {formatCurrency(item.custoMedio)}</p><p className="text-sm text-muted-foreground">Valor estimado: {formatCurrency(item.valorEstimado)}</p></div></div></div></div>;
          })}</div>
        </SectionCard>

        <SectionCard title="Saldo com parceiros" description="Mostra quanto estamos devendo e quanto temos a receber de cada parceiro.">
          <div className="space-y-3">
            {partnerBalances.length > 0 ? partnerBalances.filter((item) => selectedPartner === "all" || item.partnerName === selectedPartner).map((item) => (
              <div key={item.partnerName} className="rounded-2xl border border-border bg-background px-4 py-4">
                <p className="font-semibold text-foreground">{item.partnerName}</p>
                <p className="mt-2 text-sm text-muted-foreground">Emprestou para nos: {formatLiters(item.litrosEmprestadosPorParceiros)}</p>
                <p className="mt-1 text-sm text-muted-foreground">Devolvemos: {formatLiters(item.litrosDevolvidosAParceiros)}</p>
                <p className="mt-1 text-sm text-muted-foreground">Emprestamos para ele: {formatLiters(item.litrosEmprestadosPorNos)}</p>
                <p className="mt-1 text-sm text-muted-foreground">Recebemos de volta: {formatLiters(item.litrosDevolvidosParaNos)}</p>
                <p className="mt-3 text-sm font-medium text-foreground">Devendo: {formatLiters(item.saldoDevendo)}</p>
                <p className="mt-1 text-sm font-medium text-foreground">A receber: {formatLiters(item.saldoAReceber)}</p>
              </div>
            )) : <div className="rounded-2xl border border-dashed border-border bg-background px-6 py-12 text-center text-sm text-muted-foreground">Nenhum parceiro com movimentacoes de emprestimo/devolucao.</div>}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Ultimas movimentacoes" description="As cores ajudam a identificar rapidamente combustivel e status dos registros mais recentes.">
        <div className="grid gap-3 lg:grid-cols-2">
          {latestMovements.length > 0 ? latestMovements.map((item) => {
            const fuelTone = getFuelTone(item.combustivel);
            const statusTone = getStatusTone(item.status);
            return <div key={item.id} className={`overflow-hidden rounded-2xl border ${fuelTone.card}`}><div className={`h-2 ${fuelTone.bar}`} /><div className="p-4"><div className="flex flex-wrap items-center gap-2"><Badge className={fuelTone.badge}>{item.combustivel}</Badge><Badge className={statusTone.badge}>{item.status === "active" ? "Ativa" : "Cancelada"}</Badge></div><p className="mt-3 font-semibold text-foreground">{"fornecedor" in item ? item.fornecedor : item.usuarioNome || item.partnerName || "Movimentacao de parceiro"}</p><p className="mt-1 text-sm text-muted-foreground">{new Intl.DateTimeFormat("pt-BR").format(new Date(item.data))} - {formatLiters(item.litros)}</p></div></div>;
          }) : <div className="rounded-2xl border border-dashed border-border bg-background px-6 py-12 text-center text-sm text-muted-foreground lg:col-span-2">Nenhuma movimentacao registrada ainda.</div>}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Consumo por dia" description="Total de litros consumidos por dia a partir das saidas filtradas.">
          {dailyConsumption.length > 0 ? <div className="h-[320px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={dailyConsumption}><CartesianGrid strokeDasharray="3 3" stroke="#d6d9cc" /><XAxis dataKey="label" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /><Tooltip formatter={(value: number) => [`${value.toLocaleString("pt-BR")} L`, "Consumo"]} /><Bar dataKey="litros" fill="#00b7a7" radius={[10, 10, 0, 0]} /></BarChart></ResponsiveContainer></div> : <div className="rounded-2xl border border-dashed border-border bg-background px-6 py-16 text-center text-sm text-muted-foreground">Nenhuma saida encontrada para os filtros atuais.</div>}
        </SectionCard>

        <SectionCard title="Consumo por mes" description="Consolidado mensal de litros consumidos nas saidas filtradas.">
          {monthlyConsumption.length > 0 ? <div className="h-[320px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={monthlyConsumption}><CartesianGrid strokeDasharray="3 3" stroke="#d6d9cc" /><XAxis dataKey="label" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} /><Tooltip formatter={(value: number) => [`${value.toLocaleString("pt-BR")} L`, "Consumo"]} /><Line type="monotone" dataKey="litros" stroke="#0c4f74" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} /></LineChart></ResponsiveContainer></div> : <div className="rounded-2xl border border-dashed border-border bg-background px-6 py-16 text-center text-sm text-muted-foreground">Nenhuma saida encontrada para os filtros atuais.</div>}
        </SectionCard>
      </div>
    </div>
  );
}

function FormFilter({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-medium text-foreground">{label}</span>{children}</label>;
}
