import { BoletoStatus } from "@/enums/locacao/enums-locacao";
import { MAX_DOCUMENT_FILE_SIZE } from "@/pages/main/imoveis/constants/max_document_file_size";
import { ACCEPTED_DOCUMENT_TYPES } from "@/pages/main/proprietarios/constants/accepted-document-types";
import moment from "moment";
import { z } from "zod";

export const acordoSchema = z.object({
  id: z.number().optional(),
  observacao: z.string().optional(),
  valorOriginal: z.coerce.number().min(1, 'Valor do Original é obrigatório'),
  juros: z.coerce.number().optional(),
  multa: z.coerce.number().optional(),
  desconto: z.coerce.number().optional(),
  valorLiquido: z.coerce.number().optional(),
  qtdParcelas: z.coerce.number(),
  tipoGeracaoBoleto: z.string(),


  dataEmissao: z.string().transform((val) => {
    const data: string = val;
    return moment.utc(data.substring(0, 10)).format("YYYY-MM-DD");
  }),
  dataVencimento: z.string().transform((val) => {
    const data: string = val;
    return moment.utc(data.substring(0, 10)).format("YYYY-MM-DD");
  }),
  
  status: z.enum(Object.values(BoletoStatus) as [string, ...string[]]),
  pessoaId: z.coerce.number(),
  locacaoId: z.coerce.number().optional(),
  imovelId: z.coerce.number().optional(),
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
  pessoa: z.array(
    z.object(
      {
        nome: z.string(),
        id: z.number(),        
      }
    )
  ),
  locacao: z.array(
    z.object(
      {
        nome: z.string(),
        id: z.number(),
        locatarioId: z.number(),
        imovelId: z.number(),
      }
    )
  ).optional(),
  imovel: z.array(
    z.object(
      {
        nome: z.string(),
        id: z.number(),
      }
    )
  ).optional(),  
  empresaId: z.coerce.number().min(1, 'Empresa é obrigatória'),
});

export type AcordoSchema = z.infer<typeof acordoSchema>