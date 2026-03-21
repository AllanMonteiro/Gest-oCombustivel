import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormField } from "@/components/forms/form-field";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/contexts/auth/AuthContext";
import { createEquipamentoApi, fetchAreasApi } from "@/services/modules/inventory-api-service";
import { useState, useEffect } from "react";

const schema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  tipo: z.string().min(2, "Informe o tipo"),
  areaPadrao: z.string().min(1, "Selecione a area"),
  ativo: z.string().min(1, "Selecione o status"),
});

type FormData = z.infer<typeof schema>;

export function EquipamentosPage() {
  const { session } = useAuth();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [areas, setAreas] = useState<any[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", tipo: "", areaPadrao: "", ativo: "true" },
  });

  useEffect(() => {
    if (!session?.access_token) return;
    fetchAreasApi(session.access_token).then(setAreas).catch(console.error);
  }, [session]);

  const onSubmit = async (data: FormData) => {
    if (!session?.access_token) return;
    setSaving(true);
    setMessage("");
    try {
      await createEquipamentoApi(session.access_token, {
        nome: data.nome,
        tipo: data.tipo,
        areaPadrao: data.areaPadrao,
        ativo: data.ativo === "true",
      });
      setMessage("Equipamento cadastrado com sucesso!");
      form.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao cadastrar equipamento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Cadastros" title="Equipamentos" description="Cadastro de maquinas e veiculos com vinculo de area padrao." actions={<Button type="submit" form="equipamento-form" disabled={saving}>{saving ? "Salvando..." : "Salvar equipamento"}</Button>} />
      <SectionCard title="Novo equipamento">
        <form id="equipamento-form" className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField label="Nome" error={form.formState.errors.nome?.message}>
            <Input placeholder="Trator 01" {...form.register("nome")} />
          </FormField>
          <FormField label="Tipo" error={form.formState.errors.tipo?.message}>
            <Input placeholder="Trator" {...form.register("tipo")} />
          </FormField>
          <FormField label="Area padrao" error={form.formState.errors.areaPadrao?.message}>
            <Select defaultValue="" {...form.register("areaPadrao")}>
              <option value="" disabled>Selecione</option>
              {areas.filter(a => a.ativo).map(a => <option key={a.id} value={a.nome}>{a.nome}</option>)}
            </Select>
          </FormField>
          <FormField label="Status" error={form.formState.errors.ativo?.message}>
            <Select {...form.register("ativo")}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </Select>
          </FormField>
          {message ? <div className={`md:col-span-2 px-4 py-3 rounded-2xl text-sm ${message.includes("Erro") ? "bg-amber-50 text-amber-800 border border-amber-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"}`}>{message}</div> : null}
        </form>
      </SectionCard>
    </div>
  );
}
