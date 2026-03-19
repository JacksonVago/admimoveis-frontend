import { z } from 'zod'


export const moradorLocacaoSchema = z.object({
  pessoaId: z
    .union([
      z.number().min(1, 'Proprietário é obrigatório'),
      z
        .string()
        .min(1, 'Proprietário é obrigatório')
        .transform((val) => {
          const num = Number(val)
          return isNaN(num) ? undefined : num
        })
    ])
    .refine((val) => val !== undefined, 'Morador é obrigatório'),
  locacaoId: z
    .union([
      z.number().min(1, 'Locação é obrigatório'),
      z
        .string()
        .min(1, 'Locação é obrigatório')
        .transform((val) => {
          const num = Number(val)
          return isNaN(num) ? undefined : num
        })
    ])
    .refine((val) => val !== undefined, 'Locação é obrigatório'),
  moradores: z.array(
    z.object(
      {
        nome: z.string(),
        id: z.number()
      }
    )
  ).optional(),

})

export type MoradorLocacaoSchema = z.infer<typeof moradorLocacaoSchema>
