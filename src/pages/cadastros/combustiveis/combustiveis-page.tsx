import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormField } from "@/components/forms/form-field";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const schema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  codigo: z.string().min(2, "Informe o codigo"),
  unidade: z.string().min(1, "Selecione a unidade"),
  ativo: z.string().min(1, "Selecione o status"),
});

type FormData = z.infer<typeof schema>;

export function CombustiveisPage() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", codigo: "", unidade: "L", ativo: "true" },
  });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Cadastros" title="Combustiveis" description="Cadastro inicial dos tipos de combustivel com campos ja disponiveis para digitacao." actions={<Button type="submit" form="combustivel-form">Salvar combustivel</Button>} />
      <SectionCard title="Novo combustivel">
        <form id="combustivel-form" className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((data) => console.log(data))}>
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
        </form>
      </SectionCard>
    </div>
  );
}
