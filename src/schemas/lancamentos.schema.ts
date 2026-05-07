import { LancamentoStatus } from "@/enums/locacao/enums-locacao";
import moment from "moment";
import { z } from "zod";

export const lancamentoSchema = z.object({
  id: z.coerce.number(),
  dataLancamento: z.string().transform((val) => {
    const data: string = val;
    return moment(data.substring(0, 10)).format("YYYY-MM-DD");
  }),
  vencimentoLancamento: z.string().transform((val) => {
    const data: string = val;
    return moment(data.substring(0, 10)).format("YYYY-MM-DD");
  }),
  valorLancamento: z.coerce.number().min(1, 'Valor do lançamento é obrigatório'),
  parcela: z.coerce.number().optional(),
  linhaDigitavel: z.string().optional(),
  observacao: z.string().optional(),
  status: z.enum(Object.values(LancamentoStatus) as [string, ...string[]]),
  tipoId: z.coerce.number().optional(),
  locacaoId: z.coerce.number().min(1, 'Locação é obrigatório'),
});

export type LancamentoSchema = z.infer<typeof lancamentoSchema>

export const lancCondominioSchema = z.object({
  id: z.coerce.number(),
  dataLancamento: z.string().transform((val) => {
    const data: string = val;
    return moment(data.substring(0, 10)).format("YYYY-MM-DD");
  }),
  vencimentoLancamento: z.string().transform((val) => {
    const data: string = val;
    return moment(data.substring(0, 10)).format("YYYY-MM-DD");
  }),
  valorLancamento: z.coerce.number().min(1, 'Valor do lançamento é obrigatório'),
  parcela: z.coerce.number().optional(),
  rateia: z.string().optional(),
  linhaDigitavel: z.string().optional(),
  observacao: z.string().optional(),
  status: z.enum(Object.values(LancamentoStatus) as [string, ...string[]]),
  tipoId: z.coerce.number().optional(),
  blocoId: z.coerce.number().min(1, 'Bloco é obrigatório'),
});

export type LancamentoCondominioSchema = z.infer<typeof lancCondominioSchema>

export const lancamentoImovelSchema = z.object({
  id: z.coerce.number(),
  dataLancamento: z.string().transform((val) => {
    const data: string = val;
    return moment(data.substring(0, 10)).format("YYYY-MM-DD");
  }),
  vencimentoLancamento: z.string().transform((val) => {
    const data: string = val;
    return moment(data.substring(0, 10)).format("YYYY-MM-DD");
  }),
  valorLancamento: z.coerce.number().min(1, 'Valor do lançamento é obrigatório'),
  parcela: z.coerce.number().optional(),
  linhaDigitavel: z.string().optional(),
  observacao: z.string().optional(),
  status: z.enum(Object.values(LancamentoStatus) as [string, ...string[]]),
  tipoId: z.coerce.number().optional(),
  imovelId: z.coerce.number().min(1, 'Imóvel é obrigatório'),
});

export type LancamentoImovelSchema = z.infer<typeof lancamentoImovelSchema>

