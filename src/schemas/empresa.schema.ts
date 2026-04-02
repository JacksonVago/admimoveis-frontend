import { PessoaStatus } from '@/enums/pessoal/status-pesoa'
import { z } from 'zod'

export const empresaSchema = z.object({
  nome: z.string().min(1, 'Nome do cliente é obrigatório'),
  cnpj: z
    .string({
      required_error: 'CPF/CNPJ é obrigatório.',
    })
    .refine((doc) => {
      const replacedDoc = doc.replace(/\D/g, '');
      return replacedDoc.length >= 11;
    }, 'CPF/CNPJ deve conter no mínimo 11 caracteres.')
    .refine((doc) => {
      const replacedDoc = doc.replace(/\D/g, '');
      return replacedDoc.length <= 14;
    }, 'CPF/CNPJ deve conter no máximo 14 caracteres.')
    .refine((doc) => {
      const replacedDoc = doc.replace(/\D/g, '');
      return !!Number(replacedDoc);
    }, 'CPF/CNPJ deve conter apenas números.'),
  email: z.string().email('Email inválido').min(1, 'Email é obrigatório'),
  telefone: z.string().optional(),
  logradouro: z.string(),
  status: z.enum(Object.values(PessoaStatus) as [string, ...string[]]).optional(),
  numero: z
    .union([
      z.number().min(1, 'Número é obrigatório'),
      z
        .string()
        .min(1, 'Número é obrigatório')
        .transform((val) => {
          const num = Number(val)
          return isNaN(num) ? undefined : num
        })
    ])
    .refine((val) => val !== undefined, 'Número é obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  cep: z.string().regex(/^\d{5}-\d{3}$/, 'CEP inválido'),
  estado: z.string().min(1, 'Estado é obrigatório'),
  avisosReajusteLocacao: z.coerce.number().optional(),
  avisosRenovacaoContrato: z.coerce.number().optional(),
  avisosSeguroFianca: z.coerce.number().optional(),
  avisosSeguroIncendio: z.coerce.number().optional(),
  avisosTituloCapitalizacao: z.coerce.number().optional(),
  avisosDepositoCalcao: z.coerce.number().optional(),
  porcentagemComissao: z.coerce.number(),
  emiteBoleto: z.string().optional(),
  valorTaxaBoleto: z.coerce.number().optional(),
  emissaoBoletoAntecedencia: z.coerce.number().optional(),
  porcentagemMultaAtraso: z.coerce.number().optional(),
  porcentagemJurosAtraso: z
    .union([
      z.number().min(0, 'Número é obrigatório').optional(),
      z
        .string()
        .min(0, 'Número é obrigatório')
        .transform((val) => {
          const num = Number(val)
          return isNaN(num) ? undefined : num
        })
    ])
    .optional(),
  //tipoId: z.coerce.number().min(1, 'Tipo de lançamento é obrigatório'),
  logo: z.any().optional(),
  tipoId: z.coerce.number().optional(),

})

export type EmpresaSchema = z.infer<typeof empresaSchema>
