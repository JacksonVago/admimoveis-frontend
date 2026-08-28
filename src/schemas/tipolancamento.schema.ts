import { lancamentoTipo } from "@/enums/locacao/enums-locacao";
import { z } from "zod";

export const tipolancamentoSchema = z.object({
  id: z.coerce.number(),
  name: z.string(),
  tipo: z.enum(Object.values(lancamentoTipo) as [string, ...string[]]),
  automatico: z.string().optional(),
  parcelas: z.coerce.number().optional(),
  geraObservacao: z.string().optional(),
  valorFixo: z.coerce.number().optional(),
  empresaId: z.coerce.number(),
  grupofluxoId: z.coerce.number().optional(),
});

export type TipoLancamentoSchema = z.infer<typeof tipolancamentoSchema>
