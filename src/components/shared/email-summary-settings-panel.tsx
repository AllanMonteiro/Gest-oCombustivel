import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Mail, RefreshCcw, Save, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchEmailSummarySettings,
  saveEmailSummarySettings,
  sendEmailSummaryTest,
  type EmailSummaryApiSettings,
  type EmailSummaryFrequency,
} from "@/services/modules/email-summary-service";

const STORAGE_KEY = "fuel-summary-email-ui-settings-v1";
const DEFAULT_BASE_URL = "https://southamerica-east1-seu-projeto.cloudfunctions.net";

interface LocalConnectionState {
  baseUrl: string;
  adminToken: string;
}

function parseRecipients(value: string) {
  return value
    .split(/[;,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(value: string | null) {
  if (!value) return "Ainda nao salvo no backend";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function frequencyDescription(frequency: EmailSummaryFrequency) {
  if (frequency === "weekly") return "Envio toda segunda-feira no horario informado.";
  if (frequency === "monthly") return "Envio no primeiro dia de cada mes no horario informado.";
  return "Envio todos os dias no horario informado.";
}

export function EmailSummarySettingsPanel({ compact = false }: { compact?: boolean }) {
  const [connection, setConnection] = useState<LocalConnectionState>({ baseUrl: DEFAULT_BASE_URL, adminToken: "" });
  const [enabled, setEnabled] = useState("true");
  const [scheduleLabel, setScheduleLabel] = useState("07:00");
  const [frequency, setFrequency] = useState<EmailSummaryFrequency>("daily");
  const [recipientsText, setRecipientsText] = useState("");
  const [updatedAtIso, setUpdatedAtIso] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<LocalConnectionState>;
      setConnection({ baseUrl: parsed.baseUrl || DEFAULT_BASE_URL, adminToken: parsed.adminToken || "" });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(connection));
  }, [connection]);

  const recipientsPreview = useMemo(() => parseRecipients(recipientsText), [recipientsText]);

  const applyRemoteSettings = (settings: EmailSummaryApiSettings) => {
    setEnabled(String(settings.enabled));
    setScheduleLabel(settings.scheduleLabel || "07:00");
    setFrequency(settings.frequency || "daily");
    setRecipientsText(settings.recipients.join("\n"));
    setUpdatedAtIso(settings.updatedAtIso);
  };

  const requireConnection = () => {
    if (!connection.baseUrl.trim() || !connection.adminToken.trim()) {
      throw new Error("Preencha a URL base das functions e o token administrativo.");
    }
  };

  const handleLoad = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      requireConnection();
      const settings = await fetchEmailSummarySettings(connection);
      applyRemoteSettings(settings);
      setMessage("Configuracao carregada do backend com sucesso.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Falha ao carregar configuracao.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      requireConnection();
      const response = await saveEmailSummarySettings(connection, {
        enabled: enabled === "true",
        recipients: recipientsPreview,
        scheduleLabel: scheduleLabel.trim() || "07:00",
        frequency,
        updatedAtIso,
      });
      applyRemoteSettings(response.settings);
      setMessage("Destinatarios e configuracoes salvos no backend.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Falha ao salvar configuracao.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      requireConnection();
      const response = await sendEmailSummaryTest(connection);
      setMessage(`Email de teste enviado para ${response.recipients.join(", ")}.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Falha ao disparar email de teste.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[1.75rem] border border-[#8fd7d0] bg-gradient-to-r from-[#103b5b] via-[#16567a] to-[#00b7a7] p-[1px] shadow-panel">
        <div className="grid gap-4 rounded-[calc(1.75rem-1px)] bg-[#f5fbfd] p-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#00a99d]">Identidade Algar</p>
            <h3 className="mt-3 text-2xl font-semibold text-[#123047]">Resumo automatico por email</h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#4f6778]">
              Configure os destinatarios do resumo de combustivel e escolha se o envio sera diario, semanal ou mensal.
            </p>
          </div>
          <div className={compact ? "grid gap-3 sm:grid-cols-3" : "grid gap-3 sm:grid-cols-3"}>
            <ColorSwatch label="Azul principal" hex="#103b5b" />
            <ColorSwatch label="Azul apoio" hex="#16567a" />
            <ColorSwatch label="Turquesa" hex="#00b7a7" />
          </div>
        </div>
      </section>

      <div className={`grid gap-5 ${compact ? "xl:grid-cols-2" : "xl:grid-cols-[1.05fr_0.95fr]"}`}>
        <div className="rounded-[1.5rem] border border-border bg-card p-5 shadow-panel">
          <p className="text-lg font-semibold text-foreground">Conexao com o backend</p>
          <div className="mt-4 space-y-4">
            <FormField label="URL base das functions"><Input value={connection.baseUrl} onChange={(event) => setConnection((current) => ({ ...current, baseUrl: event.target.value }))} placeholder="https://southamerica-east1-seu-projeto.cloudfunctions.net" /></FormField>
            <FormField label="Token administrativo"><Input type="password" value={connection.adminToken} onChange={(event) => setConnection((current) => ({ ...current, adminToken: event.target.value }))} placeholder="Token usado para carregar, salvar e testar" /></FormField>
            <div className="rounded-2xl border border-[#b7dce2] bg-gradient-to-br from-[#eaf7fb] to-[#f6fffd] px-4 py-4 text-sm text-[#4f6778]">
              <p className="font-medium text-[#123047]">Fluxo configurado</p>
              <p className="mt-2">1. Atualize os dados atuais.</p>
              <p className="mt-1">2. Ajuste destinatarios e frequencia.</p>
              <p className="mt-1">3. Salve e envie um teste.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-border bg-card p-5 shadow-panel">
          <p className="text-lg font-semibold text-foreground">Configuracao do resumo</p>
          <div className="mt-4 space-y-4">
            <div className={`grid gap-4 ${compact ? "md:grid-cols-3" : "md:grid-cols-3"}`}>
              <FormField label="Resumo habilitado"><Select value={enabled} onChange={(event) => setEnabled(event.target.value)}><option value="true">Sim</option><option value="false">Nao</option></Select></FormField>
              <FormField label="Frequencia"><Select value={frequency} onChange={(event) => setFrequency(event.target.value as EmailSummaryFrequency)}><option value="daily">Diariamente</option><option value="weekly">Semanalmente</option><option value="monthly">Mensalmente</option></Select></FormField>
              <FormField label="Horario"><Input value={scheduleLabel} onChange={(event) => setScheduleLabel(event.target.value)} placeholder="07:00" /></FormField>
            </div>
            <div className="rounded-2xl border border-[#c7e5e3] bg-[#f5fffd] px-4 py-3 text-sm text-[#24516d]"><div className="flex items-center gap-2 font-medium text-[#103b5b]"><Clock3 className="h-4 w-4" />Regra atual de envio</div><p className="mt-2">{frequencyDescription(frequency)}</p></div>
            <FormField label="Destinatarios"><Textarea value={recipientsText} onChange={(event) => setRecipientsText(event.target.value)} placeholder={"gestor@empresa.com.br\nalmoxarifado@empresa.com.br"} className="min-h-32" /></FormField>
            <p className="text-sm text-muted-foreground">Destinatarios detectados: {recipientsPreview.length}. Ultima sincronizacao: {formatDate(updatedAtIso)}</p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleLoad} disabled={loading} variant="outline" className="gap-2"><RefreshCcw className="h-4 w-4" />Atualizar dados</Button>
              <Button onClick={handleSave} disabled={loading} className="gap-2 bg-[#103b5b] text-white hover:bg-[#16567a]"><Save className="h-4 w-4" />Salvar no backend</Button>
              <Button onClick={handleSendTest} disabled={loading} variant="secondary" className="gap-2 bg-[#00b7a7] text-white hover:bg-[#00a196]"><Send className="h-4 w-4" />Enviar teste</Button>
            </div>
          </div>
        </div>
      </div>

      {!compact ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoTile title="Saldo por combustivel" description="Litros, custo medio e valor estimado por combustivel." icon={<Mail className="h-5 w-5" />} />
        <InfoTile title="Emprestimos recebidos" description="Quanto parceiros emprestaram e o saldo que ainda devemos." icon={<CheckCircle2 className="h-5 w-5" />} />
        <InfoTile title="Emprestimos enviados" description="Quanto saiu para parceiros e o saldo a receber." icon={<Send className="h-5 w-5" />} />
        <InfoTile title="Frequencia configuravel" description="Diaria, semanal na segunda ou mensal no primeiro dia." icon={<RefreshCcw className="h-5 w-5" />} />
      </div> : null}

      {message ? <FeedbackBox tone="success">{message}</FeedbackBox> : null}
      {error ? <FeedbackBox tone="error">{error}</FeedbackBox> : null}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="text-sm font-medium text-foreground">{label}</span>{children}</label>;
}

function InfoTile({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return <div className="rounded-[1.25rem] border border-[#d7e4ec] bg-gradient-to-br from-white to-[#f4fbfb] px-5 py-5"><div className="mb-3 inline-flex rounded-2xl bg-[#dff7f3] p-3 text-[#0f726c]">{icon}</div><p className="text-base font-semibold text-foreground">{title}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div>;
}

function ColorSwatch({ label, hex }: { label: string; hex: string }) {
  return <div className="rounded-2xl border border-white/30 bg-white/90 p-3 shadow-sm"><div className="h-12 rounded-xl" style={{ backgroundColor: hex }} /><p className="mt-3 text-sm font-medium text-[#123047]">{label}</p><p className="mt-1 text-xs text-[#4f6778]">{hex}</p></div>;
}

function FeedbackBox({ tone, children }: { tone: "success" | "error"; children: React.ReactNode }) {
  return <div className={tone === "success" ? "rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800" : "rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"}>{children}</div>;
}
