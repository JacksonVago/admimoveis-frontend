import { PessoaStatus } from '@/enums/pessoal/status-pesoa'
import { z } from 'zod'

export const grupofluxocaixaSchema = z.object({
    descricao: z.string(),
    cor: z.string(),
    status: z.enum(Object.values(PessoaStatus) as [string, ...string[]]).optional(),
    empresaId: z.number(),
})

export type GrupoFluxoCaixaSchema = z.infer<typeof grupofluxocaixaSchema>