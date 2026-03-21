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
import { createCombustivelApi } from "@/services/modules/inventory-api-service";
import { useState } from "react";

const schema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  codigo: z.string().min(2, "Informe o codigo"),
  unidade: z.string().min(1, "Selecione a unidade"),
  ativo: z.string().min(1, "Selecione o status"),
});

type FormData = z.infer<typeof schema>;

export function CombustiveisPage() {
  const { session } = useAuth();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", codigo: "", unidade: "L", ativo: "true" },
  });

  const onSubmit = async (data: FormData) => {
    if (!session?.access_token) return;
    setSaving(true);
    setMessage("");
    try {
      await createCombustivelApi(session.access_token, {
        nome: data.nome,
        codigo: data.codigo,
        unidade: data.unidade,
        ativo: data.ativo === "true",
      });
      setMessage("Combustivel cadastrado com sucesso!");
      form.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao cadastrar combustivel.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Cadastros" title="Combustiveis" description="Cadastro inicial dos tipos de combustivel com campos ja disponiveis para digitacao." actions={<Button type="submit" form="combustivel-form" disabled={saving}>{saving ? "Salvando..." : "Salvar combustivel"}</Button>} />
      <SectionCard title="Novo combustivel">
        <form id="combustivel-form" className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField label="Nome" error={form.formState.errors.nome?.message}>
            <Input placeholder="Diesel S10" {...form.register("nome")} />
          </FormField>
          <FormField label="Codigo" error={form.formState.errors.codigo?.message}>
            <Input placeholder="DSL-S10" {...form.register("codigo")} />
          </FormField>
          <FormField label="Unidade" error={form.formState.errors.unidade?.message}>
            <Select {...form.register("unidade")}>
              <option value="L">Litros</option>
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
