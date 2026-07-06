import { FormaEnvio } from '@/enums/cobranca/FormaEnvio'
import { PessoaStatus } from '@/enums/pessoal/status-pesoa'
import { z } from 'zod'

export const contacorrenteSchema = z.object({
    descricao: z.string(),
    agencia: z.string(),
    conta: z.string(),
    digito: z.string(),
    cooperativa: z.string(),
    usuarioBancoAPI: z.string().optional(),
    senhaBancoAPI: z.string().optional(),
    chaveAppAPI: z.string().optional(),
    urlPIX: z.string().optional(),
    urlBoleto: z.string().optional(),
    urlWebhookPIX: z.string().optional(),
    urlWebhookBoleto: z.string().optional(),
    status: z.enum(Object.values(PessoaStatus) as [string, ...string[]]).optional(),

    pagtoParcial: z.boolean().optional(),
    qtdeMaxParcial: z.coerce.number().optional(),
    formaEnvio: z.enum(Object.values(FormaEnvio) as [string, ...string[]]).optional(),
    assuntoEmail: z.string().optional(),
    mensagemEmail1: z.string().optional(),
    mensagemEmail2: z.string().optional(),
    mensagemEmail3: z.string().optional(),
    convenio: z.string().optional(),

    tipoJurosCobId: z.string().optional(),
    valorJuros: z.coerce.number().or(z.string().transform(Number)).optional(),
    percJuros: z.coerce.number().or(z.string().transform(Number)).optional(),
    diasInicioJuros: z.coerce.number().or(z.string().transform(Number)).optional(),

    tipoMultaCobId: z.string().optional(),
    valorMulta: z.coerce.number().or(z.string().transform(Number)).optional(),
    percMulta: z.coerce.number().or(z.string().transform(Number)).optional(),
    diasInicioMulta: z.coerce.number().or(z.string().transform(Number)).optional(),

    tipoDescontoCobId: z.string().optional(),
    valorDesconto: z.coerce.number().or(z.string().transform(Number)).optional(),
    percDesconto: z.coerce.number().or(z.string().transform(Number)).optional(),
    diasInicioDesconto: z.coerce.number().or(z.string().transform(Number)).optional(),

    tipoAutorizacaoCobId: z.string().optional(),
    tipoRecebimentoDiv: z.string().optional(),
    valorMinDiverg: z.coerce.number().or(z.string().transform(Number)).optional(),
    valorMaxDiverg: z.coerce.number().or(z.string().transform(Number)).optional(),
    percMinDiverg: z.coerce.number().or(z.string().transform(Number)).optional(),
    percMaxDiverg: z.coerce.number().or(z.string().transform(Number)).optional(),

    protestar: z.boolean().optional(),
    qtdeDiasProtesto: z.coerce.number().optional(),
    negativar: z.boolean().optional(),
    qtdeDiasNegativar: z.coerce.number().optional(),

    instrucaoCobId1: z.string().optional(),
    instrucaoCobId2: z.string().optional(),
    instrucaoCobId3: z.string().optional(),
    qtdeDiasAposVencto: z.coerce.number().optional(),
    cobrancaDiaUtil: z.boolean().optional(),

    instrucaoRecId1: z.string().optional(),
    instrucaoRecId2: z.string().optional(),
    instrucaoRecId3: z.string().optional(),
    instrucaoRecId4: z.string().optional(),

    bancoId: z.string().min(1, 'Condomínio é obrigatório'),
    carteiraId: z.string().optional(),
    especieId: z.string().optional(),
    pessoaId: z.string().optional(),
    empresaId: z.coerce.number(),
});
/*.refine((data) => {
    if (data.tipoJurosCobId)
});*/

export type ContaCorrenteSchema = z.infer<typeof contacorrenteSchema>