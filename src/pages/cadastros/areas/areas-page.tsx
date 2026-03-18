import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormField } from "@/components/forms/form-field";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  descricao: z.string().min(2, "Informe a descricao"),
  ativo: z.string().min(1, "Selecione o status"),
});

type FormData = z.infer<typeof schema>;

export function AreasPage() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { nome: "", descricao: "", ativo: "true" },
  });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Cadastros" title="Areas" description="Cadastro de areas operacionais e centros de consumo com formulario ja disponivel." actions={<Button type="submit" form="area-form">Salvar area</Button>} />
      <SectionCard title="Nova area">
        <form id="area-form" className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit((data) => console.log(data))}>
          <FormField label="Nome" error={form.formState.errors.nome?.message}>
            <Input placeholder="Area Norte" {...form.register("nome")} />
          </FormField>
          <FormField label="Status" error={form.formState.errors.ativo?.message}>
            <Select {...form.register("ativo")}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </Select>
          </FormField>
          <div className="md:col-span-2">
            <FormField label="Descricao" error={form.formState.errors.descricao?.message}>
              <Textarea placeholder="Descricao da area, centro de custo ou frente operacional" {...form.register("descricao")} />
            </FormField>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
