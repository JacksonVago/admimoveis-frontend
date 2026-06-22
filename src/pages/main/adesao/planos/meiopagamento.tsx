import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@radix-ui/react-label'
import { useMediaQuery } from 'react-responsive'
import { Input } from '@/components/ui/input'
import { ROUTE } from '@/enums/routes.enum'
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Check, Info } from 'lucide-react'
import { pagamentoSchema, PagamentoSchema } from '@/schemas/pagamento.schema'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from '@/hooks/use-toast'
import axios from 'axios'
import { formatCpfCnpj, formatCreditCard } from '@/utils/format-cpfcnpj'
import api from '@/services/axios/api'
import { PAGSEGURO_PUIBLIC_KEY } from '@/constants/pagseguro'
import { Plano } from '@/interfaces/plano'
import { useQuery } from '@tanstack/react-query'
import { usdFormatter } from '@/utils/format-money'
import { PagamentoAssinatura } from '@/interfaces/pagamentosassinaturas'
import { useAuth } from '@/hooks/auth/use-auth'
import  { encryptCardPagSeguro }  from '@/utils/pagseguro-ecrypt'

export const getPlano = async (id: string) => {
    return await api.get<Plano>('assinatura/' + id)
}

//envia pagamento PagSeguro
const createPagSeguro = async (data: FormData): Promise<PagamentoAssinatura> => {

    const response = await api.post<PagamentoAssinatura>(`pagseguro`, data)
    return response.data

}

//Bem vindo
export const MeioPagamento = () => {

    const dataParams = useParams<{ email: string, plano: string }>()
    const planoId = dataParams.plano ? dataParams.plano : '0';
    const email = dataParams.email ? dataParams.email : 'email@email.com';

    const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
    const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
    const isTablet = useMediaQuery({ query: '(min-width: 746px)' })
    const isMobile = useMediaQuery({ query: '(min-width: 200px)' })

    const [openAss, setOpenAss] = useState(false);
    const { login} = useAuth();

    const cardStyle = {
        padding: '20px',
        borderRadius: '8px',
        transition: 'border-color 0.3s ease',
        cursor: 'pointer'
    };
    const navigate = useNavigate()

    //Consulta PLANOS
    const {
        data: plano
    } = useQuery({
        queryKey: ['plano', planoId],
        queryFn: () => getPlano(planoId)
    });



    //default values
    const defaultValues = useMemo(
        () => ({
            nome: '',
            numeroCartao: '',
            expMes: 0,
            expAno: 0,
            codigoSeguranca: '0',
            valorPagamento: 1,
            parcela: 1,
            observacao: plano?.data ? `Assinatura Plano ${plano?.data.tipo}` : '',
            cpf: '',
            encryptedCard: '123',
            email: email,
            plano: plano?.data ? plano?.data.tipo : '',
            frequencia: plano?.data ? plano?.data.frequencia : 'MENSAL',
            assinaturaId: Number(planoId),
            empresaId: 0
        }),
        [plano, planoId, email]
    )
    useEffect(() => {
        if (localStorage) pagamentoMethods.reset(defaultValues)
    }, [])

    const pagamentoMethods = useForm<PagamentoSchema>({
        resolver: zodResolver(pagamentoSchema),
        defaultValues,
        mode: 'all'
    })

    console.log('erros', pagamentoMethods.formState?.errors);
    console.log('planoId', plano?.data);
    // Event Handlers
    const onSubmitPagamentoData = async (data: PagamentoSchema) => {
        try {
            const card = encryptCardPagSeguro({
                publicKey: PAGSEGURO_PUIBLIC_KEY,
                holder: data.nome,
                number: data.numeroCartao.toString().replace(/\s+/g, ''),
                expMonth: data.expMes.toString(),
                expYear: data.expAno.toString(),
                securityCode: data.codigoSeguranca
            });

            //console.log('card:', card);

            /*const card = PagSeguro.encryptCard({
                publicKey: PAGSEGURO_PUIBLIC_KEY,
                holder: data.nome,
                number: data.numeroCartao.toString().replace(/\s+/g, ''),
                expMonth: data.expMes.toString(),
                expYear: data.expAno.toString(),
                securityCode: data.codigoSeguranca
            });
            console.log('card:', card);*/

            const form = new FormData()

            if (data?.nome) {
                form.append('nome', data.nome)
            }
            if (data?.cpf) {
                console.log('cpf', data.cpf.replace(/\D/g, ''));
                form.append('cpf', data.cpf.replace(/\D/g, ''))
            }
            if (data?.numeroCartao) {
                form.append('numeroCartao', data.numeroCartao.replace(/\D/g, ''))
            }
            if (data?.expMes) {
                form.append('expMes', data.expMes.toString())
            }
            if (data?.expAno) {
                form.append('expAno', data.expAno.toString())
            }
            if (data?.codigoSeguranca) {
                form.append('codigoSeguranca', data.codigoSeguranca)
            }

            form.append('valorPagamento', plano?.data ? plano?.data.valor.toFixed(2).toString().replace(/\D/g,'') : '0')

            if (data?.parcela) {
                form.append('parcela', data.parcela.toString())
            }
            if (data?.observacao) {
                form.append('observacao', data.observacao);
            }

            form.append('encryptedCard', card.encryptedCard);

            form.append('plano', plano?.data ? plano?.data.tipo : '');
            form.append('frequencia', plano?.data ? plano?.data.frequencia : 'MENSAL');

            form.append('assinaturaId', planoId);

            if (data?.metodoPagamento) {
                form.append('metodoPagamento', data.metodoPagamento)
            }
            if (data?.empresa_pagamento) {
                form.append('empresa_pagamento', data.empresa_pagamento)
            }
            if (data?.email) {
                form.append('email', data.email)
            }
            form.append('empresaId', '0')

            /*const pagamentoData = {
                reference_id: 'pagamento-001',
                costumer: {
                    name: data.nome,
                    tax_id: data.cpf,
                },
                items: [
                    {
                        name: `Assinatura Plano ${Plano}`,
                        quantity: 1,
                        unit_amount: 18000
                    }
                ],
                //qr_codes : []
                //notification_urls: ['https://meusite.com/notificacoes'],
                charges: [
                    {
                        reference_id: 'charge-001',
                        description: `Pagamento Plano ${Plano}`,
                        amount: {
                            value: 18000,
                            currency: 'BRL'
                        },
                        payment_method: {
                            type: 'CREDIT_CARD',
                            installments: 1,
                            capture : true,
                            soft_description: 'ADM Imóveis',
                            card: {
                                encrypted: card.encryptedCard,
                                store: true,
                            }
                        }

                    }

                ]
            }*/


            //chama api pagamento
            //const cardEncrypted = await encryptCardPagSeguro(data){
            const result = await createPagSeguro(form)
            console.log('result pagamento:', result);

            toast({
                title: 'Pagamento',
                description: `Pagamento realizado com sucesso`

            });

            const loginResponse = await login({login: data.email, password: 'Senha123@'});
            console.log('loginResponse após pagamento:', loginResponse);
            navigate(`${ROUTE.EMPRESA}/${result.assinaturaempresa.empresa.id}`)

        } catch (error) {

            if (axios.isAxiosError(error)) {
                // Check if there's a response and data within the error
                if (error.response && error.response.data) {
                    console.error('Error message from server:', error.response.data);
                    toast({
                        title: 'Erro ao realizar o pagamento',
                        description: error.response.data.message,
                    })

                    // You can also set this error message to a state to display it in your UI
                } else {
                    console.error('Axios error without response data:', error.message);
                }
            } else {
                console.error('Non-Axios error:', error);
                toast({
                    title: 'Erro',
                    description: error instanceof Error ? error.message : 'Ocorreu um erro ao tentar realizar o pagamento. Tente novamente.',
                    variant: 'destructive'
                })
            }
        }
    }

    return (
        <div className="container mx-auto space-y-6 p-4 font-[Poppins-regular]">
            <div className='grid grid-cols-2'>
                <h1 className='flex justify-start font-bold m-3 text-center'>Agora só falata o meio de pagamento</h1>
                <h1 className='flex justify-end m-3 text-center'>Etapa 4 de 4</h1>
            </div>
            <div className={(isBigScreen ? "grid gap-4 grid-cols-3" : isPortrait ? "grid gap-4 grid-cols-3" : isTablet ? "grid gap-4 grid-cols-2" : isMobile ? "grid gap-4 grid-cols-1" : "grid gap-4 grid-cols-1")}>
                <form onSubmit={pagamentoMethods.handleSubmit(onSubmitPagamentoData)}>
                    <div className={(isPortrait ? "grid grid-cols-2 gap-4 mt-3" : "grid grid-cols-1 gap-4 mt-3")}>
                        <Label className="text-base">
                            Nome Titular
                            <Input
                                type="text"
                                step={'any'}
                                className="mt-1"
                                placeholder="Nome titular do Cartão"
                                {...pagamentoMethods.register('nome')}
                            />
                            {pagamentoMethods.formState?.errors?.nome?.message && <p style={{ color: '#f26871', fontSize: '0.8rem' }}>* {pagamentoMethods.formState?.errors?.nome?.message}</p>}
                        </Label>
                        <Label className="text-base">
                            CPF/CNPJ
                            <Input
                                className="mt-1"
                                type="text"
                                placeholder="Cpf"
                                {...pagamentoMethods.register('cpf', {
                                    onChange: async (e) => {
                                        const { value } = e.target;
                                        e.target.value = formatCpfCnpj(value);
                                    }
                                })}
                            />
                            {pagamentoMethods.formState.errors.cpf?.message &&
                                (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                                    {pagamentoMethods.formState.errors.cpf.message}
                                </p>)}
                        </Label>

                        <Label className="text-base">
                            Número do Cartão
                            <Input
                                type="text"
                                className="mt-1"
                                {...pagamentoMethods.register('numeroCartao', {
                                    onChange: async (e) => {
                                        const { value } = e.target;
                                        e.target.value = formatCreditCard(value);
                                    }
                                })}

                            />
                            {pagamentoMethods.formState?.errors?.numeroCartao?.message && <p style={{ color: '#f26871', fontSize: '0.8rem' }}>* {pagamentoMethods.formState?.errors?.numeroCartao?.message}</p>}
                        </Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                        <Label className="text-base">
                            Mês/Ano Expiração
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    type="number"
                                    className="mt-1"
                                    placeholder="mês"
                                    {...pagamentoMethods.register('expMes')}
                                />
                                <Input
                                    type="number"
                                    className="mt-1"
                                    {...pagamentoMethods.register('expAno')}
                                />
                            </div>
                            {pagamentoMethods.formState?.errors?.expMes?.message && <p style={{ color: '#f26871', fontSize: '0.8rem' }}>* {pagamentoMethods.formState?.errors?.expMes?.message}</p>}
                            {pagamentoMethods.formState?.errors?.expAno?.message && <p style={{ color: '#f26871', fontSize: '0.8rem' }}>* {pagamentoMethods.formState?.errors?.expAno?.message}</p>}
                        </Label>
                        <Label className="text-base">
                            CVV
                            <Input
                                type="number"
                                className="mt-1"
                                placeholder="CVV"
                                {...pagamentoMethods.register('codigoSeguranca')}
                            />
                            {pagamentoMethods.formState?.errors?.codigoSeguranca?.message && <p style={{ color: '#f26871', fontSize: '0.8rem' }}>* {pagamentoMethods.formState?.errors?.codigoSeguranca?.message}</p>}
                        </Label>
                    </div>
                    <div className='mt-3 flex justify-center'>
                        <Button type="submit" size={'lg'} >
                            Confirma
                        </Button>
                    </div>

                </form>

                <div>
                    <Card className='font-[Poppins-regular]' style={cardStyle}>
                        <CardHeader>
                            <CardTitle className="">
                                <div className='mb-2 flex justify-between items-center col-span-3'>
                                    <Label className="font-bold">Plano {plano?.data?.tipo} - {plano?.data?.frequencia}
                                    </Label>
                                </div>
                                <div className='mt-6'>
                                    <Label className="ml-1 mt-12 font-bold" style={{ "fontSize": '1.5rem' }}>{usdFormatter.format(Number(plano?.data?.valor ? plano?.data?.valor : 0))}</Label>
                                </div>
                                <p className="ml-1 mt-2 font-bold" style={{ "fontSize": '0.9rem' }}>7 dias grátis</p>
                                <p className="ml-1 mt-1 mb-5 border-b pb-8 text-gray-500 font-[Poppins-Light]" style={{ "fontSize": '0.9rem' }}>Pagamento à vista.Renovação automática, exceto se cancelada</p>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {plano?.data?.descricao.split(' - ').map((desc, index) => (
                                <div key={index} className="flex justify-left mb-2">
                                    <Check className="inline mr-2 text-green-500" />{desc}
                                </div>
                            ))}

                        </CardContent>
                    </Card>
                    <div className='mt-2 flex justify-center'>
                        <AlertDialog open={openAss} onOpenChange={setOpenAss}>
                            <AlertDialogTrigger>
                                <Button size="sm" className="rounded-full bg-gray-400 hover:bg-blue-500 hover:cursor-pointer">
                                    <Info className="inline mr-2" />
                                    SABER MAIS
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <div className='flex justify-end'>
                                        <Button size="icon" variant="ghost" className="close-button hover:cursor-pointer" aria-label="Close dialog"
                                            onClick={() => {
                                                setOpenAss(false);
                                            }}>
                                            &times; {/* This is the HTML entity for an "X" icon */}
                                        </Button>
                                    </div>

                                    <AlertDialogTitle>Informações de Assinatura</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        <p>
                                            Seu plano será renovado automaticamente a cada ano, inclusive após qualquer período de avaliação gratuita ou promocional aplicável, a menos que o cancelamento seja feito antes da renovação. O cancelamento entrará em vigor após o período de cobrança atual.
                                            Disponibilidade sujeita ao seu serviço de internet e aos recursos do dispositivo. </p>
                                        Saiba mais aqui: <a href="www.admimoveis.com.br/premium">www.admimoveis.com.br/premium</a>.
                                        <p>Assista em quatro dispositivos ao mesmo tempo. Para obter mais informações sobre dispositivos compatíveis e requisitos do sistema operacional, acesse nossa Central de Ajuda: www.paramountplus.com/devices.
                                            Todos os planos incluem promoções da Paramount+ e trailers antes e/ou depois do conteúdo. Conteúdo ao vivo (e reprises) (se disponível em seu mercado e no seu plano selecionado) contém pausas para anúncios publicitários.
                                            Você pode realizar o download e assistir onde quiser. Restrições aplicáveis. Saiba mais aqui: www.paramountplus.com/downloads.
                                        </p>
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </div>
        </div >
    )
}

