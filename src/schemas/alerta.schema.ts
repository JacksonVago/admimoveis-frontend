import { FrequenciaEnvio } from '@/enums/alertas/FrequenciaEnvio'
import { TipoAgendamento } from '@/enums/alertas/TipoAgendamento'
import { TipoIntervaloEnvio } from '@/enums/alertas/TipoIntervaloEnvio'
import { MAX_DOCUMENT_FILE_SIZE } from '@/pages/main/imoveis/constants/max_document_file_size'
import { ACCEPTED_DOCUMENT_TYPES } from '@/pages/main/proprietarios/constants/accepted-document-types'
import moment from 'moment'
import { z } from 'zod'

export const alertaSchema = z.object({
    descricao: z.string(),
    ativo: z.boolean(),
    textoAlerta: z.string(),
    tipoAgendamento: z.enum(Object.values(TipoAgendamento) as [string, ...string[]]).optional(),
    frequenciaEnvio: z.enum(Object.values(FrequenciaEnvio) as [string, ...string[]]).optional(),
    dataInicio: z.string().transform((val) => {
        const data: string = val;
        return moment(data.substring(0, 10)).format("YYYY-MM-DD");
    }).optional(),
    ocorreAcada: z.coerce.number().optional(),
    grupoEnvio: z.string().optional(),
    horarioEnvio: z.string().optional(),
    tipoIntervaloEnvio: z.enum(Object.values(TipoIntervaloEnvio) as [string, ...string[]]).optional(),
    intervaloEnvio: z.number().optional(),
    horarioInicial: z.string().optional(),
    horarioFinal: z.string().optional(),
    dataInicioEnvio: z.string().transform((val) => {
        const data: string = val;
        return moment(data.substring(0, 10)).format("YYYY-MM-DD");
    }).optional(),
    dataFinalEnvio: z.string().transform((val) => {
        const data: string = val;
        return moment(data.substring(0, 10)).format("YYYY-MM-DD");
    }).optional(),
    empresaId: z.number(),
    alertaId: z.coerce.number(),

    // condominios: z.array(
    //     z.object(
    //         {
    //             nome: z.string(),
    //             id: z.string()
    //         }
    //     )
    // ).optional(),

})

export type AlertaSchema = z.infer<typeof alertaSchema>