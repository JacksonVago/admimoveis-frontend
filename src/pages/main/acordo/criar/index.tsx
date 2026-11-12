import { Card, CardContent } from '@/components/ui/card'
import { ROUTE } from '@/enums/routes.enum'
import { toast } from '@/hooks/use-toast'
import api from '@/services/axios/api'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useGlobalParams } from '@/globals/GlobalParams'
import { useEffect } from 'react'
import axios from 'axios'
import { Acordo } from '@/interfaces/acordo'
import { acordoSchema, AcordoSchema } from '@/schemas/acordo.schema'
import moment from 'moment'
import { BoletoStatus } from '@/enums/locacao/enums-locacao'
import { AcordoFormContent, AcordoFormRoot, AcordoFormSubmitButton } from './components/acordo-form'

const createAcordo = async (data: FormData): Promise<Acordo | any> => {
    const dataObject = Object.fromEntries(data.entries());
    const jsonData = JSON.stringify(dataObject);
    console.log(jsonData);
    return await api.post<Acordo>('/acordos', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
}

export const CriarAcordo = () => {
    //Globals
    const glb_params = useGlobalParams();
    const navigate = useNavigate()

    useEffect(() => {
    }, [glb_params]);

    const acordoMethods = useForm<AcordoSchema>({
        resolver: zodResolver(acordoSchema),
        defaultValues: {
            empresaId: glb_params.id_empresa ? Number(glb_params.id_empresa) : 0,
            tipoGeracaoBoleto: 'T',
            status: BoletoStatus.PENDENTE,
        },
        mode: 'all'
    })

    useEffect(() => {
        glb_params.updTitle_form('Acordo');

        if (glb_params.pastaOrig === '') {
            glb_params.updPastaOrig('acordo-create');
        }
        else {
            //setActiveTab(glb_params.pastaOrig);
        }

    }, [])


    const createAcordoMutation = useMutation({
        mutationFn: ({ data }: { data: FormData }) => createAcordo(data),
        onSuccess: () => {

            toast({ title: 'Acordo criado com sucesso' });

            navigate(ROUTE.ACORDOS);

        },
        onError: (error) => {
            if (axios.isAxiosError(error)) {
                // Check if there's a response and data within the error
                if (error.response && error.response.data) {
                    console.error('Error message from server:', error.response.data);
                    toast({
                        title: 'Erro ao criar o acordo',
                        description: error.response.data.message,
                    })

                    // You can also set this error message to a state to display it in your UI
                } else {
                    console.error('Axios error without response data:', error.message);
                }
            } else {
                console.error('Non-Axios error:', error);
            }
        }
    });


    const onSubmitAcordoData = async (data: AcordoSchema) => {
        //try {
        const form = new FormData()

        console.log(data);
        if (data?.observacao) {
            form.append('observacao', data.observacao);
        }

        if (data?.valorOriginal) {
            form.append('valorOriginal', data.valorOriginal.toString());
        }

        if (data?.juros) {
            form.append('juros', data.juros.toString());
        }

        if (data?.multa) {
            form.append('multa', data.multa.toString());
        }

        if (data?.desconto) {
            form.append('desconto', data.desconto.toString());
        }

        if (data?.valorLiquido) {
            form.append('valorLiquido', data.valorLiquido.toString());
        }

        if (data?.qtdParcelas) {
            form.append('qtdParcelas', data.qtdParcelas.toString());
        }

        if (data?.valorParcela) {
            form.append('valorParcela', data.valorParcela.toString());
        }

        if (data?.tipoGeracaoBoleto) {
            form.append('tipoGeracaoBoleto', data.tipoGeracaoBoleto);
        }

        if (data?.dataEmissao) {
            form.append('dataEmissao', moment(data.dataEmissao).format('YYYY-MM-DD'));
        }

        if (data?.dataVencimento) {
            form.append('dataVencimento', moment(data.dataVencimento).format('YYYY-MM-DD'));
        }


        if (data?.locacaoId) {
            form.append('locacaoId', data.locacaoId.toString());
        }

        if (data?.imovelId) {
            form.append('imovelId', data.imovelId.toString());
        }

        form.append('status', BoletoStatus.PENDENTE);
        form.append('pessoaId', data.pessoaId.toString());
        form.append('empresaId', glb_params.id_empresa ? glb_params.id_empresa : "0");

        if (data?.lancamentos && data?.lancamentos.length > 0) {
            form.append('lancamentos', JSON.stringify(data?.lancamentos))
            /*data.lancamentos.forEach((lancamento)=>{
                form.append('lancamentos', JSON.stringify(lancamento))
            });*/
        }
        const newDocuments = data?.documentos?.filter((doc) => !doc.id)
        newDocuments?.forEach((doc) => {
            form.append('documentos', doc.file)
        })

        if (data?.documentosToDeleteIds?.length) {
            data.documentosToDeleteIds.forEach((docId) => {
                form.append('documentosToDeleteIds[]', docId.toString())
            })
        }

        console.log('Antes de enviar');

        createAcordoMutation.mutate({ data: form });

    }

    console.log('Erro', acordoMethods.formState.errors);
    console.log('dirty', acordoMethods.formState.isDirty);
    console.log('valid', acordoMethods.formState.isValid);
    console.log('valid', acordoMethods.getValues());
    return (
        <div className="mx-auto max-w-screen-xl" style={{ color: "#034869" }}>
            <Card className='py-10' style={{ color: "#034869" }}>
                <CardContent>
                    <h2 className="mb-4 mt-8 text-xl font-bold">Criar um novo Acordo</h2>
                    <AcordoFormRoot                        
                        createAcordoMethods={acordoMethods}
                        onSubmitAcordoData={onSubmitAcordoData}
                    >
                        <AcordoFormContent 
                        action='create'
                        createAcordoMethods={acordoMethods} />
                        <AcordoFormSubmitButton createAcordoMethods={acordoMethods} />
                    </AcordoFormRoot>
                </CardContent>
            </Card>
        </div>
    )
}
