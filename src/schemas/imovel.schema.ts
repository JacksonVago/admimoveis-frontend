import { ImovelFinalidade, ImovelStatus } from '@/enums/imovel/enums-imovel'
import { MAX_DOCUMENT_FILE_SIZE } from '@/pages/main/imoveis/constants/max_document_file_size'
import { ACCEPTED_DOCUMENT_TYPES } from '@/pages/main/proprietarios/constants/accepted-document-types'
import { z } from 'zod'

export const imovelSchema = z.object({
  description: z.string().optional(),
  tipoId: z.coerce.number().min(1, 'Tipo é obrigatório').or(z.string().transform(Number)),
  status: z.enum(Object.values(ImovelStatus) as [string, ...string[]], { required_error: 'Situação é obrigatório' }),
  finalidade: z.enum(Object.values(ImovelFinalidade) as [string, ...string[]], { required_error: 'Finalidade é obrigatório' }),
  porcentagemLucroImobiliaria: z
    .union([
      z.number({ invalid_type_error: 'Taxa administrativa é obrigatório' }).min(1, { message: 'Taxa administrativa é obrigatório' }),
      z
        .string()
        .min(1, { message: 'Taxa administrativa é obrigatório' })
        .transform((val) => {
          const num = Number(val)
          return isNaN(num) ? undefined : num
        })
    ])
    .refine((val) => val !== undefined, 'Taxa administrativa é obrigatório'),
  valorAluguel: z.coerce.number().or(z.string().transform(Number)),
  metragem: z
    .union([
      z.number(),
      z.string().transform((val) => (val === '' ? undefined : Number(val))),
      z.literal('')
    ])    
    .transform((val) => (val === '' ? undefined : val))
    .optional(),
  quartos: z
    .union([
      z.number(),
      z.string().transform((val) => (val === '' ? undefined : Number(val))),
      z.literal('')
    ])    
    .transform((val) => (val === '' ? undefined : val))
    .optional(),
  banheiros: z
    .union([
      z.number(),
      z.string().transform((val) => (val === '' ? undefined : Number(val))),
      z.literal('')
    ])    
    .transform((val) => (val === '' ? undefined : val))
    .optional(),
  vagasEstacionamento: z
    .union([
      z.number(),
      z.string().transform((val) => (val === '' ? undefined : Number(val))),
      z.literal('')
    ])    
    .transform((val) => (val === '' ? undefined : val))
    .optional(),
  andar: z
    .union([
      z.number(),
      z.string().transform((val) => (val === '' ? undefined : Number(val))),
      z.literal('')
    ])    
    .transform((val) => (val === '' ? undefined : val))
    .optional(),

  logradouro: z.string().min(1, 'Logradouro é obrigatório'),  
  numero: z
    .union([
      z.number({ invalid_type_error: 'Número é obrigatório' }).min(1, { message: 'Número é obrigatório' }),
      z
        .string()
        .min(1, { message: 'Número é obrigatório' })
        .transform((val) => {
          const num = Number(val)
          return isNaN(num) ? undefined : num
        })
    ])
    .refine((val) => val !== undefined, 'Número é obrigatório'),
  /*z.string()
    .min(1, 'Número é obrigatório')
    .transform((val) => {
      const num = Number(val)
      return isNaN(num) ? undefined : num
    })
    .refine((val) => val !== undefined, 'Número é obrigatório'),*/
  complemento: z.string().optional(),
  bairro: z.string().min(1, 'Bairro é obrigatório'),
  cidade: z.string().min(1, 'Cidade é obrigatória'),
  cep: z.string().regex(/^\d{5}-\d{3}$/, 'CEP inválido'),
  estado: z.string().min(1, 'Estado é obrigatório'),
  images: z.any().optional(),
  imovelPhotos: z.any().optional(),
  // .refine(
  //   (file) => {
  //     //importante: converter para MB
  //     const fileSizeMB = file?.size / (1024 * 1024)
  //     return fileSizeMB <= MAX_DOCUMENT_FILE_SIZE
  //   },
  //   { message: `Tamanho máximo de imagem é ${MAX_DOCUMENT_FILE_SIZE} MB` }
  // ) // message customizada

  imagesToDeleteIds: z.array(z.number()).optional(),
  documentos: z
    .array(
      z.object({
        file: z.instanceof(File).optional(),
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

  empresaId: z.number().min(1, 'Empresa é obrigatória'),
  condominioId: z.number().optional().nullable(),
  blocoId: z.number().optional().nullable(),  
  condominioBloco : z.string().optional().nullable(),
})

export type ImovelSchema = z.infer<typeof imovelSchema>
