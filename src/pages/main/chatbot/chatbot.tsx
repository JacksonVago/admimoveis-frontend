import { ROUTE } from "@/enums/routes.enum";
import { useAuth } from "@/hooks/auth/use-auth";
import { useEffect, useRef, useState } from "react";
import ChatBot, { ChatBotProvider, useFlow } from "react-chatbotify";
import { Params, Styles, Settings } from "react-chatbotify"
import { useNavigate } from "react-router-dom";
import { useGlobalParams } from "@/globals/GlobalParams";
import { BoletoStatus } from "@/enums/locacao/enums-locacao";
import api from "@/services/axios/api";
import { Boleto } from "@/interfaces/boleto";
import moment, { duration } from "moment";
import { Label } from "@radix-ui/react-label";
import { usdFormatter } from "@/utils/format-money";

// Componente interno que terá acesso aos Hooks do Chatbot
const BotaoReiniciar = () => {
    const { restartFlow } = useFlow();

    return (
        <button onClick={restartFlow} style={{ margin: "10px", padding: "5px 10px" }}>
            Reiniciar Conversa 🔄
        </button>
    );
};

export const MyChatBot = () => {
    const navigate = useNavigate();
    const glb_params = useGlobalParams();
    const { firstName } = useAuth();
    const [previsoes, setPrevisoes] = useState<Boleto[]>([]);
    const [filterPrevisoes, setFilterPrevisoes] = useState<Boleto[]>([]);

    const initOptions = ["Emissão de boletos", "Cadastros"];
    const criaOptions = ["Criar", "Consultar"];
    const cadastrosOptions = ["Tipo imóvel", "Imóvel", "Locação", "Proprietário", "Locatário"];
    const filtroOptions = ["Vencimento", "Valor", "Locatário", "Proprietário", "Locação"];

    const snOptions = ["Sim", "Não"];

    useEffect(() => {
    }, [filterPrevisoes]);

    const flow = {
        //Início da conversa
        start: {
            message: () => {
                let str_msg = "Bom " + (new Date().toLocaleTimeString().indexOf('AM') ? new Date().getHours() <= 12 ? "dia " : "tarde " : "noite ");
                str_msg += `${firstName}!`
                return str_msg;
            },
            transition: { duration: 1000 },
            path: "quem_sou",
        },
        quem_sou: {
            message: "Eu sou o Assis seu assistente imobiliário!",
            transition: { duration: 1000 },
            path: "como_ajudar"
        },
        como_ajudar: {
            message: "Como posso ajudar você hoje ?",
            transition: { duration: 1000 },
            path: "show_options"
        },
        //Opções iniciais
        show_options: {
            options: initOptions,
            path: "process_options"
        },
        //Processa as opções desejadas
        process_options: {
            transition: { duration: 0 },
            chatDisabled: true,
            path: async (params: Params) => {
                let link = "";
                switch (params.userInput) {
                    case "Emissão de boletos":
                        return "emissao_boleto"
                        break;
                    case "Cadastros":
                        return "opcao_cadastros";
                        break;
                    case "Examples":
                        link = "https://react-chatbotify.com/docs/examples/basic_form";
                        break;
                    case "Github":
                        link = "https://github.com/react-chatbotify/react-chatbotify/";
                        break;
                    case "Discord":
                        link = "https://discord.gg/6R4DK4G5Zh";
                        break;
                    default:
                        return "o_q_deseja";
                }
                await params.injectMessage("Aguarde um instante! Vou encaminhar você para lá agora mesmo!");
                setTimeout(() => {
                    navigate(link);
                }, 1000)
                return "repeat"
            },
        },
        //Quando Emissao de boletos
        emissao_boleto: {
            message: "Já existem uma previsão de cobrança criada o boleto que deseja emitir ?",
            options: snOptions,
            path: async (params: Params) => {
                if (params.userInput === "Sim") {
                    //Consulta boletos
                    const data = await api.get<Boleto[]>('pagamentos/' + (glb_params.id_empresa ? Number(glb_params.id_empresa) : 0) + '/' + BoletoStatus.PENDENTE)

                    const previsoes = data?.data;

                    if (previsoes && previsoes.length > 0) {
                        await params.injectMessage(`Foram encontradas ${previsoes.length} previsões aguardando geração de boletos`);
                        setPrevisoes(previsoes);
                        return "filtra_previsao"
                    }
                    else {
                        await params.injectMessage(`Não foram encontradas previsões aguardando geração de boletos.`);
                        return "criar_previsao";
                    }
                }

                if (params.userInput === "Não") {
                    return "criar_previsao";
                }
                else {
                    return "o_q_deseja";
                }
            },
        },
        //Quando selecionado Cadastros
        opcao_cadastros: {
            message: "Quais desses cadastros deseja efetuar ?",
            options: cadastrosOptions,
            path: async (params: Params) => {
                let link = "";
                switch (params.userInput) {
                    case "Tipo imóvel":
                        link = ROUTE.TIPOIMOVEL;
                        break;
                    case "Imóvel":
                        link = ROUTE.IMOVEIS_CRIAR;
                        break;
                    case "Locação":
                        link = ROUTE.LOCACOES_CRIAR;
                        break;
                    case "Proprietário":
                        link = ROUTE.CLIENTES_CRIAR;
                        break;
                    case "Locatário":
                        link = ROUTE.CLIENTES_CRIAR;
                        break;
                }
                await params.injectMessage("Aguarde um instante! Vou encaminhar você para lá agora mesmo!");
                setTimeout(() => {
                    navigate(link);
                }, 1000)
                return "repeat"
            }
        },
        //Criar uma nova previsão
        criar_previsao: {
            message: "Gostaria de criar uma previsão ?",
            options: snOptions,
            path: (params: Params) => {
                if (params.userInput === "Sim") {
                    navigate(ROUTE.PAGAMENTOS);
                }

                if (params.userInput === "Não") {
                    return "posso_algomais";
                }
                else {
                    return "o_q_deseja";
                }
            }
        },
        seleciona_previsao: {
            transitions: { duration: 0 },
            path: async (params: Params) => {
                return "filtra_previsao"
            }
        },
        //filtrar as Previsões dentre as encontradas encontradas
        filtra_previsao: {
            message: "Você teria algumas das informações abaixo, assim posso filtrar as previsões.\nClique no botão desejado para colocar a informação.",
            transitions: { duration: 1000 },
            options: filtroOptions,
            path: async (params: Params) => {
                let str_path = "";
                switch (params.userInput) {
                    case "Vencimento":
                        str_path = "filtra_previsao_venc";
                        break;

                    case "Valor":
                        str_path = "filtra_previsao_val";
                        break;

                    case "Locatário":
                        str_path = "filtra_previsao_locat";
                        break;

                    case "Proprietário":
                        str_path = "filtra_previsao_prop";
                        break;

                    case "Locação":
                        str_path = "filtra_previsao_loc";
                        break;
                }
                return str_path;
            }
        },
        filtra_previsao_venc: {
            message: `Informe uma data no formato dd/mm/aaaa (Ex.: ${new Date().toLocaleDateString()}).`,
            function: (params: Params) => {
                let str_dataAux = params.userInput;
                str_dataAux = str_dataAux.substring(3, 6) + str_dataAux.substring(0, 3) + str_dataAux.substring(6, 10)
                let str_data = new Date(str_dataAux);
                if (!isNaN(str_data.getDate())) {
                    let previsoes_aux: Boleto[] = [];
                    previsoes_aux = previsoes.filter(x => x.dataVencimento.slice(0, 10).toString() == moment.utc(str_data).format("YYYY-MM-DD").toString());
                    setFilterPrevisoes(previsoes_aux);
                }
                else {
                    params.injectMessage("A data informada não válida.");
                }
            },
            path: (params: Params) => {
                return "aguarda_refresh";
            },
        },
        aguarda_refresh: {
            message: "Estamos aplicando o filtro, aguarde...",
            transition: { duration: 3000 },
            path: "mostra_previsao",
        },
        //Filtrar previsao por valor
        filtra_previsao_val: {
            message: `Informe um valor no formato 123.00.`,
            function: (params: Params) => {
                let str_data = params.userInput;
                if (Number(str_data) > 0) {
                    let previsoes_aux: Boleto[] = [];
                    previsoes_aux = previsoes.filter(x => x.valorOriginal === Number(str_data));
                    setFilterPrevisoes(previsoes_aux);
                }
                else {
                    params.injectMessage("O Valor dever ser um número maior que ZERO.");
                }

            },
            path: (params: Params) => {
                return "aguarda_refresh";
            },
        },
        //mostra as previsões filtradas
        mostra_previsao: {
            message: () => {
                console.log(filterPrevisoes);
                if (filterPrevisoes.length > 6) {
                    return `Foram encontradas ${filterPrevisoes.length} com esse filtro`
                }
                else {
                    if (filterPrevisoes.length === 1) {
                        return "Apenas uma previsão foi encontrada com esse filtro.Se for essa a previsão basta confirmar que iremos emitir o boleto."
                    }
                    else {
                        return "Favor verificar se é uma dessas previsão, se sim basta informar o número da lista que proseguiremos."
                    }
                }
            },
            component: () => {
                return (
                    <div>
                        {(filterPrevisoes.length > 0 ?
                            <div className='rounded-md border-2 mt-2 m-2 p-2'>
                                <div className='grid grid-cols-12 m-2 font-[Poppins-bold]' >
                                    <Label className='border-b pb-5 col-span-7' style={{ 'fontSize': '0.7rem' }}>Destinatário</Label>
                                    <Label className='border-b  pb-5  col-span-3' style={{ 'fontSize': '0.7rem' }}>Vencimento</Label>
                                    <Label className='flex justify-end border-b pb-6  col-span-2' style={{ 'fontSize': '0.7rem' }}>Valor</Label>
                                </div>

                                <div className='grid grid-cols-12 m-2' >
                                    {filterPrevisoes.map((previsao, index) => (
                                        <>
                                            <Label className='flex items-center  col-span-7' style={{ 'fontSize': '0.7rem' }}>{(index + 1)} -
                                                {previsao.locatario ? previsao.locatario.pessoa?.nome :
                                                    previsao.imovel?.proprietarios ? previsao.imovel?.proprietarios[0].pessoa?.nome : ''}
                                            </Label>
                                            <Label className='flex items-center  col-span-3' style={{ 'fontSize': '0.7rem' }}>{moment.utc(previsao.dataVencimento).format("DD/MM/YYYY")}</Label>
                                            <Label className='flex justify-end items-center  col-span-2' style={{ 'fontSize': '0.7rem' }}>{usdFormatter.format(previsao.valorOriginal)}</Label>
                                        </>
                                    ))}
                                </div>
                            </div>
                            :
                            <></>
                        )}
                    </div>
                );
            },
            /*options: () =>{
                if (filterPrevisoes.length === 1) {
                    return snOptions;
                }
                else{
                    return undefined;
                }
            },*/
            chatDisabled: true,
            path: "solicita_num_previsao", /*(params:Params) =>{                
                console.log(filterPrevisoes);
                if (filterPrevisoes.length === 1) {
                    if (params.userInput === "Sim") {
                        return "confirma_previsao";
                    }
                    else{
                        return "novo_filtro";
                    }
                }
                else{
                    console.log('solicita_num_previsao');
                    return "solicita_num_previsao";
                }
            },*/
        },
        novo_filtro:{
            message : "Deseja informar um novo fitro ?",
            options: snOptions,
            path: (params:Params) =>{
                if (params.userInput === "Sim") {
                    return "filtra_previsao";
                }
                else{
                    return "start";
                }
            },
        },
        solicita_num_previsao:{
            message : "Favor informar o número da previsão que deseja emitir o boleto. ",
            function: (params: Params) => {
                let str_data = params.userInput;
                if (Number(str_data) > 0) {
                    let previsoes_aux: Boleto[] = [];
                    previsoes_aux.push(previsoes[Number(str_data)]);
                    setFilterPrevisoes(previsoes_aux);
                }
                else {
                    params.injectMessage("O Valor dever ser um número maior que ZERO.");
                }

            },
            path: (params: Params) => {
                return "aguarda_refresh";
            },
        },
        confirma_previsao : {

        },
        //Caso não selecione um item
        o_q_deseja: {
            message: (params: Params) => {
                let str_msg = params.userInput;
                //Emissão, geração
                if (str_msg.toLowerCase().indexOf('emitir') ||
                    str_msg.toLowerCase().indexOf('criar') ||
                    str_msg.toLowerCase().indexOf('gerar')) {

                    //Boleto , verificar se é boleto bancário mesmo ou apenas a previsão
                    if (str_msg.toLowerCase().indexOf('boleto')) {

                    }
                    //Previsões
                    if (str_msg.toLowerCase().indexOf('boleto')) {
                        return "Você deseja gerar uma nova previsão ou consultar uma existente ?"
                    }
                }
                //Previsões
                if (str_msg.toLowerCase().indexOf('previsão') || str_msg.toLowerCase().indexOf('previsões')) {
                    return "Você deseja gerar uma nova previsão ou consultar uma existente ?"
                }

                return "Favor informar algo sobre sua pretensão. Palavas relacionada ao assunto."
            },
            options: criaOptions,
            path: async (params: Params) => {
                if (params.userInput === "Criar") {
                    return "process_cria";
                }
                else {
                    return "process_consulta";
                }
            }
        },
        //Processar resposta de criar previsão
        process_cria: {
            message: "Já existe locação, imóvel, proprietários, locatários cadastrados ?",
            options: snOptions,
            path: async (params: Params) => {
                let link = "";
                console.log(params.userInput);
                switch (params.userInput) {
                    case "Sim":
                        link = ROUTE.PAGAMENTOS_CRIAR;
                        break;

                    case "Não":
                        return "o_falta_previsao";

                }
                await params.injectMessage("Aguarde um instante! Vou encaminhar você para lá agora mesmo!");
                setTimeout(() => {
                    navigate(link);
                }, 1000);
                return "repeat"
            }
        },
        //Processar consultar previsão
        process_consulta: {
            transition: { duration: 0 },
            chatDisabled: true,
            path: async (params: Params) => {
                await params.injectMessage("Aguarde um instante! Vou encaminhar você para lá agora mesmo!");
                setTimeout(() => {
                    navigate(ROUTE.PAGAMENTOS);
                }, 2000)
                return ""
            },
        },
        //O que falta para criar pervisões
        o_falta_previsao: {
            message: "Quais desses cadastros estão faltando ?",
            options: cadastrosOptions,
        },
        repeat: {
            transition: { duration: 3000 },
            path: "como_ajudar"
        },
        end: {
            message: "Obrigado por utilizar nosso assitente.",
            options: ["New Application"],
            chatDisabled: true,
            path: "start"
        },
    }

    const styles: Styles = {
        headerStyle: {
            background: '#034869',
            color: '#ffffff',
            padding: '10px',
        },
        chatWindowStyle: {
            backgroundColor: '#f2f2f2',
        },
    }

    const settings: Settings = {
        general: {
            showFooter: false
        },
        notification: {
            disabled: true,
        },
        header: {
            title: "Assis"
        },
        chatHistory: {
            storageKey: "example_basic_form"
        },
        tooltip: {
            mode: "NEVER",
        }
    }

    return (
        <ChatBotProvider>
            <ChatBot settings={settings} flow={flow} styles={styles} />
            <BotaoReiniciar />
        </ChatBotProvider>
    );
};