import { BoletoStatus } from "@/enums/locacao/enums-locacao";
import { MAX_DOCUMENT_FILE_SIZE } from "@/pages/main/imoveis/constants/max_document_file_size";
import { ACCEPTED_DOCUMENT_TYPES } from "@/pages/main/proprietarios/constants/accepted-document-types";
import moment from "moment";
import { z } from "zod";

export const boletoSchema = z.object({
  id: z.number().optional(),
  dataEmissao: z.string().transform((val) => {
    const data: string = val;
    return moment.utc(data.substring(0, 10)).format("YYYY-MM-DD");
  }),
  dataPagamento: z.string().transform((val) => {
    const data: string = val;
    return moment(data.substring(0, 10)).format("YYYY-MM-DD");
  }).optional(),
  dataVencimento: z.string().transform((val) => {
    const data: string = val;
    return moment.utc(data.substring(0, 10)).format("YYYY-MM-DD");
  }),
  valorOriginal: z.coerce.number().min(1, 'Valor do boleto é obrigatório'),
  valorPago: z.coerce.number().optional(),
  observacao: z.string().optional(),
  linhaDigitavel: z.string().optional(),
  status: z.enum(Object.values(BoletoStatus) as [string, ...string[]]),
  locatarioId: z.coerce.number().min(1, 'Locatário é obrigatório'),
  locacaoId: z.coerce.number().min(1, 'Locação é obrigatório'),
  documentos: z
    .array(
      z.object({
        file: z.instanceof(File),
        size: z
          .number()
          .max(
            MAX_DOCUMENT_FILE_SIZE,
            `O tamanho do documento não pode ser maior que ${MAX_DOCUMENT_FILE_SIZE / 1024 / 1024}MB.`
          )
          .optional(),
        type: z
          .string()
          .refine(
            (type) => ACCEPTED_DOCUMENT_TYPES.includes(type),
            'Tipo de arquivo não suportado. Por favor, envie um formato válido.'
          )
          .optional(),
        id: z.number().optional()
      })
    )
    .optional(),

  documentosToDeleteIds: z.array(z.number()).optional(),
  //documentosToDeleteIds: z.array(z.object({id:z.number(), file:z.string()})).optional(),
  locacao: z.array(
    z.object(
      {
        nome: z.string(),
        id: z.number(),
        locatarioId: z.number(),
      }
    )
  ).optional(),
  empresaId: z.coerce.number().min(1, 'Empresa é obrigatória'),
});

export type BoletoSchema = z.infer<typeof boletoSchema>