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
  tipo: z.string().min(2, "Informe o tipo"),
  areaPadrao: z.string().min(1, "Selecione a area"),
  ativo: z.string().min(1, "Selecione o status"),
});

type FormData = z.infer<typeof schema>;

export function EquipamentosPage() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", tipo: "", areaPadrao: "", ativo: "true" },
  });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Cadastros" title="Equipamentos" description="Cadastro de maquinas e veiculos com vinculo de area padrao." actions={<Button type="submit" form="equipamento-form">Salvar equipamento</Button>} />
      <SectionCard title="Novo equipamento">
        <form id="equipamento-form" className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((data) => console.log(data))}>
          <FormField label="Nome" error={form.formState.errors.nome?.message}>
            <Input placeholder="Trator 01" {...form.register("nome")} />
          </FormField>
          <FormField label="Tipo" error={form.formState.errors.tipo?.message}>
            <Input placeholder="Trator" {...form.register("tipo")} />
          </FormField>
          <FormField label="Area padrao" error={form.formState.errors.areaPadrao?.message}>
            <Select defaultValue="" {...form.register("areaPadrao")}>
              <option value="" disabled>Selecione</option>
              <option>Area Norte</option>
              <option>Manutencao</option>
              <option>Operacao de Campo</option>
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
