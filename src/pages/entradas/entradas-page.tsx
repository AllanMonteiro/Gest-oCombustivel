import { useMemo, useState } from "react";
import { z } from "zod";
import { FormField } from "@/components/forms/form-field";
import { SectionCard } from "@/components/shared/section-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFuelData, type FuelType } from "@/contexts/fuel/fuel-data-context";
import { getFuelTone, getStatusTone } from "@/utils/constants/fuel-visuals";

const parseDecimal = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return Number.NaN;
  const trimmed = value.trim();
  if (!trimmed) return Number.NaN;
  const normalized = trimmed.includes(",") ? trimmed.replace(/\./g, "").replace(",", ".") : trimmed;
  return normalized ? Number(normalized) : Number.NaN;
};

const entradaSchema = z.object({
  data: z.string().min(1, "Informe a data"),
  fornecedor: z.string().min(2, "Informe o fornecedor"),
  combustivel: z.custom<FuelType>((value) => typeof value === "string" && value.length > 0, { message: "Selecione o combustivel" }),
  litros: z.preprocess(parseDecimal, z.number().positive("Informe os litros")),
  valorLitro: z.preprocess(parseDecimal, z.number().positive("Informe o valor por litro")),
  notaFiscal: z.string().min(1, "Informe a nota fiscal"),
  observacao: z.string().optional(),
});

type EntradaFormData = {
  data: string;
  fornecedor: string;
  combustivel: string;
  litros: string;
  valorLitro: string;
  notaFiscal: string;
  observacao: string;
};

type EntradaErrors = Partial<Record<keyof EntradaFormData, string>>;

const initialForm: EntradaFormData = {
  data: "",
  fornecedor: "",
  combustivel: "",
  litros: "",
  valorLitro: "",
  notaFiscal: "",
  observacao: "",
};

export function EntradasPage() {
  const { entries, addEntry, cancelEntry, stockByFuel, isRemoteMode, isSyncing, syncError } = useFuelData();
  const [mensagem, setMensagem] = useState("");
  const [errors, setErrors] = useState<EntradaErrors>({});
  const [form, setForm] = useState<EntradaFormData>(initialForm);
  const [saving, setSaving] = useState(false);

  const regularEntries = useMemo(() => entries.filter((item) => item.movementType === "regular"), [entries]);
  const litros = parseDecimal(form.litros);
  const valorLitro = parseDecimal(form.valorLitro);
  const valorTotal = useMemo(() => (Number.isFinite(litros) ? litros : 0) * (Number.isFinite(valorLitro) ? valorLitro : 0), [litros, valorLitro]);

  const updateField = (field: keyof EntradaFormData, value: string) => {
    setMensagem("");
    setErrors((current) => ({ ...current, [field]: undefined }));
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = entradaSchema.safeParse(form);
    if (!result.success) {
      const nextErrors: EntradaErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof EntradaFormData | undefined;
        if (field) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    const data = result.data;
    setSaving(true);
    setMensagem("");
    try {
      await addEntry({
        data: data.data,
        fornecedor: data.fornecedor,
        combustivel: data.combustivel,
        litros: data.litros,
        valorLitro: data.valorLitro,
        notaFiscal: data.notaFiscal,
        observacao: data.observacao,
        movementType: "regular",
      });

      setForm(initialForm);
      setErrors({});
      setMensagem(isRemoteMode ? "Entrada sincronizada com Supabase/API com sucesso." : "Entrada normal registrada com sucesso.");
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : "Falha ao salvar a entrada.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (entryId: string) => {
    const reason = window.prompt("Informe a justificativa do cancelamento desta entrada:");
    if (!reason?.trim()) return;
    try {
      await cancelEntry(entryId, reason.trim());
    } catch (error) {
      setMensagem(error instanceof Error ? error.message : "Falha ao cancelar a entrada.");
    }
  };

  return (
    <div className="space-y-6">
      <SectionCard title="Nova entrada normal" description="Registre aqui compras e recebimentos operacionais. Emprestimos e devolucoes com parceiros ficam na aba `Emprestimos`.">
        <form id="entrada-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
            <div className="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
              <FormField label="Data" error={errors.data}><Input type="date" value={form.data} onChange={(event) => updateField("data", event.target.value)} /></FormField>
              <FormField label="Fornecedor" error={errors.fornecedor}><Input placeholder="Ex.: Petro Norte" value={form.fornecedor} onChange={(event) => updateField("fornecedor", event.target.value)} /></FormField>
              <FormField label="Combustivel" error={errors.combustivel}><Select value={form.combustivel} onChange={(event) => updateField("combustivel", event.target.value)}><option value="">Selecione</option><option>Diesel S10</option><option>Diesel S500</option><option>Gasolina</option><option>Etanol</option></Select></FormField>
              <FormField label="Litros" error={errors.litros}><Input type="text" inputMode="decimal" placeholder="5000" value={form.litros} onChange={(event) => updateField("litros", event.target.value)} /></FormField>
              <FormField label="Valor por litro" error={errors.valorLitro}><Input type="text" inputMode="decimal" placeholder="8,50" value={form.valorLitro} onChange={(event) => updateField("valorLitro", event.target.value)} /></FormField>
              <FormField label="Nota fiscal" error={errors.notaFiscal}><Input placeholder="NF-000123" value={form.notaFiscal} onChange={(event) => updateField("notaFiscal", event.target.value)} /></FormField>
            </div>
            <Button type="submit" size="sm" className="h-10 px-3 xl:min-w-[130px]" disabled={saving || isSyncing}>{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
          <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <FormField label="Observacao" error={errors.observacao}><Textarea placeholder="Observacoes da entrada, conferencia e detalhes complementares" value={form.observacao} onChange={(event) => updateField("observacao", event.target.value)} className="min-h-24" /></FormField>
            <div className="rounded-2xl border border-border bg-background p-4"><p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Valor total calculado</p><p className="mt-2 text-2xl font-semibold text-foreground">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valorTotal)}</p></div>
          </div>
          {isRemoteMode ? <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800">Modo remoto ativo: entradas sincronizadas com Supabase + API Render.</div> : null}
          {syncError ? <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{syncError}</div> : null}
          {mensagem ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{mensagem}</div> : null}
        </form>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Saldo por combustivel" description="Consolidado atual de estoque incluindo entradas normais, saidas operacionais e emprestimos.">
          <div className="space-y-3">{stockByFuel.map((item) => { const tone = getFuelTone(item.combustivel); return <div key={item.combustivel} className={`rounded-2xl border p-4 ${tone.card}`}><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><p className="font-medium text-foreground">{item.combustivel}</p><Badge className={tone.badge}>{item.combustivel}</Badge></div><p className="mt-1 text-sm text-muted-foreground">Entradas: {item.litrosEntrada.toLocaleString("pt-BR")} L</p><p className="mt-1 text-sm text-muted-foreground">Saidas: {item.litrosSaida.toLocaleString("pt-BR")} L</p></div><div className="text-right"><p className={`font-semibold ${tone.accent}`}>{item.saldoLitros.toLocaleString("pt-BR")} L</p><p className="mt-1 text-sm text-muted-foreground">Saldo atual</p></div></div></div>; })}</div>
        </SectionCard>

        <SectionCard title="Ultimas entradas normais" description="Historico apenas das entradas de compra ou recebimento operacional.">
          <div className="space-y-3">{regularEntries.slice(0, 5).map((item) => { const fuelTone = getFuelTone(item.combustivel); const statusTone = getStatusTone(item.status); return <div key={item.id} className={`rounded-2xl border p-4 ${fuelTone.card}`}><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-foreground">{item.fornecedor}</p><Badge className={statusTone.badge}>{item.status === "active" ? "Ativa" : "Cancelada"}</Badge><Badge className={fuelTone.badge}>{item.combustivel}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{new Intl.DateTimeFormat("pt-BR").format(new Date(item.data))}</p>{item.status === "cancelled" && item.cancellationReason ? <p className={`mt-1 text-sm ${statusTone.text}`}>Justificativa: {item.cancellationReason}</p> : null}</div><div className="text-right"><p className="font-semibold text-foreground">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.litros * item.valorLitro)}</p><p className="mt-1 text-sm text-muted-foreground">{item.litros.toLocaleString("pt-BR")} L</p>{item.status === "active" ? <Button variant="outline" size="sm" className="mt-3" onClick={() => void handleCancel(item.id)}>Cancelar</Button> : null}</div></div></div>; })}</div>
        </SectionCard>
      </div>
    </div>
  );
}