import { JobsStatus } from "@/enums/alertas/JobsStatus";
import moment from "moment";
import { z } from "zod"

export const jobSchema = z.object({
    id: z.string().optional(),
    empresaId: z.number(),
    alertaId: z.coerce.number(),
    descAlerta: z.string(),
    pessoaId: z.coerce.number().optional(),

    imovelId: z.coerce.number().optional(),

    locacaoId: z.coerce.number().optional(),

    str_email: z.string(),

    str_message: z.string(),

    str_error: z.string().optional(),

    str_start_date: z.string().optional(),
    str_end_date: z.string().optional(),
    str_start_time: z.string().optional(),
    str_end_time: z.string().optional(),
    str_cron: z.string().optional(),

    int_delay: z.coerce.number().optional(),

    dtm_created: z.string().transform((val) => {
        const data: string = val;
        return moment(data.substring(0, 10)).format("YYYY-MM-DD");
    }).optional(),

    dtm_updated: z.string().transform((val) => {
        const data: string = val;
        return moment(data.substring(0, 10)).format("YYYY-MM-DD");
    }).optional(),
    status: z.enum(Object.values(JobsStatus) as [string, ...string[]]),
    userId: z.string().optional(),
})

export type JobSchema = z.infer<typeof jobSchema>