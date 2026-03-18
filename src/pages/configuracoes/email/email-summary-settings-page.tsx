import { PageHeader } from "@/components/shared/page-header";
import { EmailSummarySettingsPanel } from "@/components/shared/email-summary-settings-panel";

export function EmailSummarySettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuracoes"
        title="Configuracoes do sistema"
        description="Centralize aqui o envio automatico do resumo por email, frequencia, destinatarios e parametros administrativos."
      />
      <EmailSummarySettingsPanel />
    </div>
  );
}
