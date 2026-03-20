import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { FormField } from "@/components/forms/form-field";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useInventoryData } from "@/contexts/inventory/inventory-data-context";
import { supabaseClient } from "@/services/firebase/client";

const parseDecimal = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return Number.NaN;
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  return normalized ? Number(normalized) : Number.NaN;
};

const entrySchema = z.object({
  data: z.string().min(1, "Informe a data"),
  produtoId: z.string().min(1, "Selecione o produto"),
  quantidade: z.preprocess(parseDecimal, z.number().positive("Informe a quantidade")),
  custoUnitario: z.preprocess(parseDecimal, z.number().min(0, "Informe o custo unitario")),
  fornecedor: z.string().min(2, "Informe o fornecedor"),
  notaFiscal: z.string().optional(),
  observacao: z.string().optional(),
});

const exitSchema = z.object({
  data: z.string().min(1, "Informe a data"),
  produtoId: z.string().min(1, "Selecione o produto"),
  quantidade: z.preprocess(parseDecimal, z.number().positive("Informe a quantidade")),
  area: z.string().min(2, "Informe a area"),
  equipamento: z.string().optional(),
  solicitante: z.string().min(2, "Informe o solicitante"),
  aplicacao: z.string().optional(),
  observacao: z.string().optional(),
});

type EntryFormData = {
  data: string;
  produtoId: string;
  quantidade: string;
  custoUnitario: string;
  fornecedor: string;
  notaFiscal: string;
  observacao: string;
};

type ExitFormData = {
  data: string;
  produtoId: string;
  quantidade: string;
  area: string;
  equipamento: string;
  solicitante: string;
  aplicacao: string;
  observacao: string;
};

type FormErrors<T> = Partial<Record<keyof T, string>>;

const initialEntryForm: EntryFormData = {
  data: "",
  produtoId: "",
  quantidade: "",
  custoUnitario: "",
  fornecedor: "",
  notaFiscal: "",
  observacao: "",
};

const initialExitForm: ExitFormData = {
  data: "",
  produtoId: "",
  quantidade: "",
  area: "",
  equipamento: "",
  solicitante: "",
  aplicacao: "",
  observacao: "",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function EstoqueGeralPage() {
  const { products, stock, entries, exits, areaSummaries, totalItemsInStock, totalInventoryValue, addEntry, addExit, getProductById, isRemoteMode, isSyncing, syncError } = useInventoryData();
  const [entryForm, setEntryForm] = useState<EntryFormData>(initialEntryForm);
  const [exitForm, setExitForm] = useState<ExitFormData>(initialExitForm);
  const [entryErrors, setEntryErrors] = useState<FormErrors<EntryFormData>>({});
  const [exitErrors, setExitErrors] = useState<FormErrors<ExitFormData>>({});
  const [message, setMessage] = useState("");
  const [savingEntry, setSavingEntry] = useState(false);
  const [savingExit, setSavingExit] = useState(false);
  const [equipmentOptions, setEquipmentOptions] = useState<string[]>([]);

  const availableAreas = useMemo(() => Array.from(new Set([
    ...products.map((item) => item.areaResponsavel),
    ...exits.map((item) => item.area),
  ].filter(Boolean))).sort(), [products, exits]);

  useEffect(() => {
    let active = true;

    async function loadEquipments() {
      if (!supabaseClient) {
        setEquipmentOptions(Array.from(new Set(exits.map((item) => item.equipamento).filter(Boolean) as string[])).sort());
        return;
      }

      const { data, error } = await supabaseClient
        .from("equipamentos")
        .select("nome")
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (!active) return;
      if (error) {
        setEquipmentOptions(Array.from(new Set(exits.map((item) => item.equipamento).filter(Boolean) as string[])).sort());
      } else {
        setEquipmentOptions((data ?? []).map((item) => item.nome).filter(Boolean));
      }
    }

    void loadEquipments();
    return () => {
      active = false;
    };
  }, [exits]);

  const recentMovements = useMemo(() => {
    const entryRows = entries.map((item) => ({
      id: item.id,
      type: "entrada" as const,
      data: item.data,
      produtoNome: getProductById(item.produtoId)?.nome ?? "Produto",
      detalhes: item.fornecedor,
      quantidade: item.quantidade,
      area: "",
      equipamento: "",
    }));
    const exitRows = exits.map((item) => ({
      id: item.id,
      type: "saida" as const,
      data: item.data,
      produtoNome: getProductById(item.produtoId)?.nome ?? "Produto",
      detalhes: item.solicitante,
      quantidade: item.quantidade,
      area: item.area,
      equipamento: item.equipamento ?? "",
    }));

    return [...entryRows, ...exitRows].sort((left, right) => right.data.localeCompare(left.data)).slice(0, 8);
  }, [entries, exits, getProductById]);

  const updateEntryField = (field: keyof EntryFormData, value: string) => {
    setEntryForm((current) => ({ ...current, [field]: value }));
    setEntryErrors((current) => ({ ...current, [field]: undefined }));
    setMessage("");
  };

  const updateExitField = (field: keyof ExitFormData, value: string) => {
    setExitForm((current) => ({ ...current, [field]: value }));
    setExitErrors((current) => ({ ...current, [field]: undefined }));
    setMessage("");
  };

  const handleEntrySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = entrySchema.safeParse(entryForm);
    if (!result.success) {
      const nextErrors: FormErrors<EntryFormData> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof EntryFormData | undefined;
        if (field) nextErrors[field] = issue.message;
      }
      setEntryErrors(nextErrors);
      return;
    }

    setSavingEntry(true);
    try {
      await addEntry({
        data: result.data.data,
        produtoId: result.data.produtoId,
        quantidade: result.data.quantidade,
        custoUnitario: result.data.custoUnitario,
        fornecedor: result.data.fornecedor,
        notaFiscal: result.data.notaFiscal,
        observacao: result.data.observacao,
      });

      setEntryForm(initialEntryForm);
      setEntryErrors({});
      setMessage(isRemoteMode ? "Entrada sincronizada com a API de inventario." : "Entrada de produto registrada no estoque geral.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao registrar entrada.");
    } finally {
      setSavingEntry(false);
    }
  };

  const handleExitSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = exitSchema.safeParse(exitForm);
    if (!result.success) {
      const nextErrors: FormErrors<ExitFormData> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof ExitFormData | undefined;
        if (field) nextErrors[field] = issue.message;
      }
      setExitErrors(nextErrors);
      return;
    }

    const stockItem = stock.find((item) => item.produtoId === result.data.produtoId);
    const product = getProductById(result.data.produtoId);
    if (result.data.quantidade > (stockItem?.saldoAtual ?? 0)) {
      setExitErrors({
        quantidade: `Saldo insuficiente para ${product?.nome ?? "o produto selecionado"}. Disponivel: ${(stockItem?.saldoAtual ?? 0).toLocaleString("pt-BR")} ${product?.unidade ?? ""}`.trim(),
      });
      return;
    }

    setSavingExit(true);
    try {
      await addExit({
        data: result.data.data,
        produtoId: result.data.produtoId,
        quantidade: result.data.quantidade,
        area: result.data.area,
        equipamento: result.data.equipamento,
        solicitante: result.data.solicitante,
        aplicacao: result.data.aplicacao,
        observacao: result.data.observacao,
      });

      setExitForm(initialExitForm);
      setExitErrors({});
      setMessage(isRemoteMode ? "Saida sincronizada com a API de inventario." : "Saida de produto registrada e vinculada a area/equipamento.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Falha ao registrar saida.");
    } finally {
      setSavingExit(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operacao"
        title="Estoque geral de produtos"
        description="Controle unificado de pecas, material de movelaria e outros itens com consumo distribuido por area."
        actions={<Button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Ir para lancamentos</Button>}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Itens em saldo" value={totalItemsInStock.toLocaleString("pt-BR")} helper="Quantidade consolidada em estoque" />
        <SummaryCard label="Valor estimado" value={formatCurrency(totalInventoryValue)} helper="Baseado no custo medio das entradas" />
        <SummaryCard label="Areas atendidas" value={areaSummaries.length.toLocaleString("pt-BR")} helper="Areas com retiradas registradas" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Entrada de produtos" description="Lance compras, reposicoes e recebimentos para atualizar o saldo do estoque geral.">
          <form className="space-y-4" onSubmit={handleEntrySubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Data" error={entryErrors.data}><Input type="date" value={entryForm.data} onChange={(event) => updateEntryField("data", event.target.value)} /></FormField>
              <FormField label="Produto" error={entryErrors.produtoId}><Select value={entryForm.produtoId} onChange={(event) => updateEntryField("produtoId", event.target.value)}><option value="">Selecione</option>{products.filter((item) => item.ativo).map((product) => <option key={product.id} value={product.id}>{product.nome}</option>)}</Select></FormField>
              <FormField label="Quantidade" error={entryErrors.quantidade}><Input type="text" inputMode="decimal" placeholder="10" value={entryForm.quantidade} onChange={(event) => updateEntryField("quantidade", event.target.value)} /></FormField>
              <FormField label="Custo unitario" error={entryErrors.custoUnitario}><Input type="text" inputMode="decimal" placeholder="42,50" value={entryForm.custoUnitario} onChange={(event) => updateEntryField("custoUnitario", event.target.value)} /></FormField>
              <FormField label="Fornecedor" error={entryErrors.fornecedor}><Input placeholder="Fornecedor do item" value={entryForm.fornecedor} onChange={(event) => updateEntryField("fornecedor", event.target.value)} /></FormField>
              <FormField label="Nota fiscal" error={entryErrors.notaFiscal}><Input placeholder="NF-0001" value={entryForm.notaFiscal} onChange={(event) => updateEntryField("notaFiscal", event.target.value)} /></FormField>
            </div>
            <FormField label="Observacao" error={entryErrors.observacao}><Textarea className="min-h-24" placeholder="Detalhes da compra ou recebimento" value={entryForm.observacao} onChange={(event) => updateEntryField("observacao", event.target.value)} /></FormField>
            <Button type="submit" disabled={savingEntry || isSyncing}>{savingEntry ? "Salvando..." : "Registrar entrada"}</Button>
          </form>
        </SectionCard>

        <SectionCard title="Saida por area e equipamento" description="Registre retiradas do estoque e vincule o consumo a area e, quando houver, ao equipamento atendido.">
          <form className="space-y-4" onSubmit={handleExitSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Data" error={exitErrors.data}><Input type="date" value={exitForm.data} onChange={(event) => updateExitField("data", event.target.value)} /></FormField>
              <FormField label="Produto" error={exitErrors.produtoId}><Select value={exitForm.produtoId} onChange={(event) => updateExitField("produtoId", event.target.value)}><option value="">Selecione</option>{stock.map((item) => <option key={item.produtoId} value={item.produtoId}>{item.produtoNome}</option>)}</Select></FormField>
              <FormField label="Quantidade" error={exitErrors.quantidade}><Input type="text" inputMode="decimal" placeholder="2" value={exitForm.quantidade} onChange={(event) => updateExitField("quantidade", event.target.value)} /></FormField>
              <FormField label="Area destino" error={exitErrors.area}><Select value={exitForm.area} onChange={(event) => updateExitField("area", event.target.value)}><option value="">Selecione</option>{availableAreas.map((area) => <option key={area} value={area}>{area}</option>)}</Select></FormField>
              <FormField label="Equipamento" error={exitErrors.equipamento}><Select value={exitForm.equipamento} onChange={(event) => updateExitField("equipamento", event.target.value)}><option value="">Sem equipamento</option>{equipmentOptions.map((equipment) => <option key={equipment} value={equipment}>{equipment}</option>)}</Select></FormField>
              <FormField label="Solicitante" error={exitErrors.solicitante}><Input placeholder="Equipe ou responsavel" value={exitForm.solicitante} onChange={(event) => updateExitField("solicitante", event.target.value)} /></FormField>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Aplicacao" error={exitErrors.aplicacao}><Input placeholder="Onde o item sera utilizado" value={exitForm.aplicacao} onChange={(event) => updateExitField("aplicacao", event.target.value)} /></FormField>
            </div>
            <FormField label="Observacao" error={exitErrors.observacao}><Textarea className="min-h-24" placeholder="Detalhes da retirada ou requisicao interna" value={exitForm.observacao} onChange={(event) => updateExitField("observacao", event.target.value)} /></FormField>
            <Button type="submit" disabled={savingExit || isSyncing}>{savingExit ? "Salvando..." : "Registrar saida"}</Button>
          </form>
        </SectionCard>
      </div>

      {isRemoteMode ? <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">Modo remoto ativo: estoque geral sincronizado com Supabase/API.</div> : null}
      {syncError ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{syncError}</div> : null}
      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <SectionCard title="Saldo por produto" description="Mostra saldo atual, custo medio e alerta de estoque baixo item a item.">
          <div className="space-y-3">
            {stock.map((item) => (
              <div key={item.produtoId} className="rounded-2xl border border-border bg-background p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground">{item.produtoNome}</p>
                      <Badge className={item.status === "baixo" ? "border border-amber-200 bg-amber-50 text-amber-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700"}>{item.status === "baixo" ? "Estoque baixo" : "Em dia"}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{item.categoria} | Area responsavel: {item.areaResponsavel}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Entradas: {item.quantidadeEntrada.toLocaleString("pt-BR")} {item.unidade} | Saidas: {item.quantidadeSaida.toLocaleString("pt-BR")} {item.unidade}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">{item.saldoAtual.toLocaleString("pt-BR")} {item.unidade}</p>
                    <p className="text-sm text-muted-foreground">Valor em estoque: {formatCurrency(item.valorEstoque)}</p>
                    <p className="text-sm text-muted-foreground">Estoque minimo: {item.estoqueMinimo.toLocaleString("pt-BR")} {item.unidade}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Consumo por area" description="Resumo automatico das areas que puxaram itens do estoque geral.">
          <div className="space-y-3">
            {areaSummaries.map((summary) => (
              <div key={summary.area} className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">{summary.area}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Retiradas: {summary.totalItensRetirados.toLocaleString("pt-BR")} | Produtos atendidos: {summary.produtosAtendidos.toLocaleString("pt-BR")}</p>
                    {summary.ultimaMovimentacao ? <p className="mt-1 text-sm text-muted-foreground">Ultima movimentacao: {new Intl.DateTimeFormat("pt-BR").format(new Date(summary.ultimaMovimentacao))}</p> : null}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-foreground">{summary.quantidadeConsumida.toLocaleString("pt-BR")}</p>
                    <p className="text-sm text-muted-foreground">Quantidade consumida</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(summary.valorConsumido)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Ultimas movimentacoes do estoque geral" description="Visao rapida das entradas e retiradas recentes, incluindo o destino por area e equipamento.">
        <div className="grid gap-3 lg:grid-cols-2">
          {recentMovements.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={item.type === "entrada" ? "border border-sky-200 bg-sky-50 text-sky-700" : "border border-rose-200 bg-rose-50 text-rose-700"}>{item.type === "entrada" ? "Entrada" : "Saida"}</Badge>
                <p className="font-semibold text-foreground">{item.produtoNome}</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{new Intl.DateTimeFormat("pt-BR").format(new Date(item.data))} | Quantidade: {item.quantidade.toLocaleString("pt-BR")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.type === "entrada" ? `Fornecedor: ${item.detalhes}` : `Solicitante: ${item.detalhes}`}</p>
              {item.area ? <p className="mt-1 text-sm text-muted-foreground">Area: {item.area}</p> : null}
              {item.equipamento ? <p className="mt-1 text-sm text-muted-foreground">Equipamento: {item.equipamento}</p> : null}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function SummaryCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-panel">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
    </div>
  );
}
