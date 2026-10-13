import { ROUTE } from "@/enums/routes.enum";
import { useAuth } from "@/hooks/auth/use-auth";
import { useEffect, useState } from "react";
import ChatBot, { ChatBotProvider, useFlow } from "react-chatbotify";
import { Params, Styles, Settings } from "react-chatbotify"
import { useNavigate } from "react-router-dom";
import { useGlobalParams } from "@/globals/GlobalParams";
import { BoletoStatus, LocacaoStatus } from "@/enums/locacao/enums-locacao";
import api from "@/services/axios/api";
import { Boleto } from "@/interfaces/boleto";
import { Label } from "@radix-ui/react-label";
import { usdFormatter } from "@/utils/format-money";
import chatIcon from "@/assets/chat2.svg";
import { STATUS_LOCACAO_OPTIONS } from "@/constants/status-locacao";
import { Locacao } from "@/interfaces/locacao";
import moment from "moment";
import { set } from "react-hook-form";
import { Imovel } from "@/interfaces/imovel";
import { STATUS_IMOVEL_OPTIONS } from "@/constants/status-imovel";
import { ImovelStatus } from "@/enums/imovel/enums-imovel";
import { TipoImovel } from "@/interfaces/tipoimovel";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { STATUS_PESSOA_OPTIONS } from "@/constants/pessoas";
import { PessoaStatus } from "@/enums/pessoal/status-pesoa";
import { Pessoa } from "@/interfaces/pessoa";
import { STATUS_BOLETO_OPTIONS } from "@/constants/status-boletos";
import { BoletoBancario } from "@/interfaces/boletobancario";

// Componente interno que terá acesso aos Hooks do Chatbot
const BotaoReiniciar = () => {
    const { restartFlow } = useFlow();

    return (
        <button onClick={restartFlow} style={{ margin: "10px", padding: "5px 10px" }}>
            Reiniciar Conversa 🔄
        </button>
    );
};

export const getTipos = async (empresaId: number) => {
  return await api.get<TipoImovel[]>('tipoimovel/' + empresaId)
}

export const useGetTiposQueryOptions = (empresaId: number) => {
  return queryOptions({
    queryKey: ['tipoimovel', empresaId],
    queryFn: () => getTipos(empresaId)
  })
}

export const MyChatBot = () => {
    const navigate = useNavigate();
    const glb_params = useGlobalParams();
    const { firstName } = useAuth();
    const [previsoes, setPrevisoes] = useState<Boleto[]>([]);
    const [locacoes, setLocacoes] = useState<Locacao[]>([]);
    const [imoveis, setImoveis] = useState<Imovel[]>([]);
    const [filterPrevisoes, setFilterPrevisoes] = useState<Boleto[]>([]);
    const [filtrosSel, setFiltrosSel] = useState<string[]>([]);
    const [filtroLast, setFiltroLast] = useState<string>("");
    //const [statusLoc, setStatusLoc] = useState<LocacaoStatus>([]);
    const [filterLocacoes, setFilterLocacoes] = useState<Locacao[]>([]);
    const [filterImoveis, setFilterImoveis] = useState<Imovel[]>([]);
    const [pessoas, setPessoas] = useState<Pessoa[]>([]);
    const [boletosb, setBoletosb] = useState<BoletoBancario[]>([]);
    const [filterBoletosb, setFilterBoletosb] = useState<BoletoBancario[]>([]);
    const [filterPessoas, setFilterPessoas] = useState<Pessoa[]>([]);

    const initOptions = ["Emissão de boletos", "Cadastros", "Consultas"];
    const criaOptions = ["Criar", "Consultar"];
    //const cadastrosOptions = ["Tipo imóvel", "Imóvel", "Locação", "Proprietário", "Locatário"];
    const cadastrosOptions = ["Tipo imóvel", "Imóvel", "Locação", "Proprietário", "Locatário"];
    const filtroOptions = ["Vencimento", "Valor", "Locatário", "Proprietário", "Locação"];
    const OptionsLocacao = ["Dia Vencimento", "Valor", "Locatário", "Proprietário", "Locação"];
    const OptionsImovel = ["Proprietário", "Endereço", "Tipo imóvel"];    
    const OptionsPessoa = ["Nome", "Telefone", "Email"];
    const OptionsBoleto = ["Vencimento", "Valor", "Locatário", "Proprietário", "Locação"];

    const snOptions = ["Sim", "Não"];

    const { data } = useQuery(
        useGetTiposQueryOptions(Number(glb_params.id_empresa))
      )
    
      const tiposImoveis = data?.data || [];
    
    const styles: Styles = {
        headerStyle: {
            background: '#034869',
            color: '#ffffff',
            padding: '10px',
        },
        chatWindowStyle: {
            backgroundColor: '#f2f2f2',
        },
        chatButtonStyle: { background: "transparent" },
    }

    const settings: Settings = {
        general: {
            showFooter: false
        },
        chatButton: {
            icon: chatIcon,
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
        },
        // Customizing emoji button icons
        emoji: {
            disabled: false,
            icon: () => <span>😊</span>,
        }
    }

    const flow = {
        //Início da conversa
        start: {
            message: () => {
                let str_msg = "Bom " + (new Date().toLocaleTimeString().indexOf('AM') ? new Date().getHours() <= 12 ? "dia " : "tarde " : "noite ");
                str_msg += `${firstName}!`
                return str_msg;
                setFiltrosSel([]);
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
                        setFiltrosSel([]);
                        link = "emissao_boleto";
                        break;

                    case "Cadastros":
                        setFiltrosSel([]);
                        link = "opcao_cadastros";;
                        break;

                    case "Consultas":
                        setFiltrosSel([]);
                        link = "opcao_consultas";
                        break;

                    default:
                        link = "o_q_deseja";
                }
                return link
            },
        },

        //Opções iniciais
        //Quando Emissao de boletos
        emissao_boleto: {
            message: "Já existem uma previsão de cobrança criada para o boleto que deseja emitir ?",
            options: snOptions,
            path: async (params: Params) => {
                if (params.userInput === "Sim") {
                    //Consulta boletos previsões
                    const data = await api.get<Boleto[]>('pagamentos/' + (glb_params.id_empresa ? Number(glb_params.id_empresa) : 0) + '/' + BoletoStatus.PENDENTE)

                    const previsoes = data?.data;

                    if (previsoes && previsoes.length > 0) {
                        await params.injectMessage(`Foram encontradas ${previsoes.length} previsões aguardando geração de boletos`);
                        setPrevisoes(previsoes);
                        setFilterPrevisoes(previsoes);
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
        //Opção de consultas
        opcao_consultas: {
            message: "Quais dessas consultas deseja efetuar ?",
            //options: ["Locações", "Imóveis", "Clientes", "Previsões", "Boletos"],
            options: ["Locações", "Imóveis", "Clientes", "Previsões", "Boletos"],
            path: async (params: Params) => {
                let link = "";
                switch (params.userInput) {
                    case "Locações":
                        link = "consulta_locacao";
                        break;
                    case "Imóveis":
                        link = "consulta_imovel";
                        break;
                    case "Clientes":
                        link = "consulta_cliente";
                        break;
                    case "Previsões":
                        link = "consulta_previsao";
                        break;
                    case "Boletos":
                        link = "consulta_boleto";
                        break;
                    default:
                        link = "o_q_deseja";
                        break;
                }
                return link
            }
        },

        //PREVISÔES
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
            transition: { duration: 0 },
            path: async () => {
                setFiltroLast("");
                return "filtra_previsao"
            }
        },
        //filtrar as Previsões dentre as encontradas encontradas
        filtra_previsao: {
            message: "Você teria algumas das informações abaixo, assim posso filtrar as previsões.\nClique no botão desejado para colocar a informação.",
            transition: { duration: 1000 },
            path: "mostra_filtros",
        },
        //mostra os filtros disponíveis
        mostra_filtros: {
            options: () => {
                return (filterPrevisoes.length <= 20 ? [...filtroOptions.filter(x => !filtrosSel.includes(x)), "Listar todas"] : filtroOptions.filter(x => !filtrosSel.includes(x)));
            },
            path: async (params: Params) => {
                let str_path = "";
                switch (params.userInput) {
                    case "Vencimento":
                        setFiltrosSel([...filtrosSel, "Vencimento"]);
                        setFiltroLast("Vencimento");
                        str_path = "filtra_previsao_venc";
                        break;

                    case "Valor":
                        setFiltrosSel([...filtrosSel, "Valor"]);
                        setFiltroLast("Valor");
                        str_path = "filtra_previsao_val";
                        break;

                    case "Locatário":
                        setFiltrosSel([...filtrosSel, "Locatário"]);
                        setFiltroLast("Locatário");
                        str_path = "filtra_previsao_locat";
                        break;

                    case "Proprietário":
                        setFiltrosSel([...filtrosSel, "Proprietário"]);
                        setFiltroLast("Proprietário");
                        str_path = "filtra_previsao_prop";
                        break;

                    case "Locação":
                        setFiltrosSel([...filtrosSel, "Locação"]);
                        setFiltroLast("Locação");
                        str_path = "filtra_previsao_loc";
                        break;

                    case "Listar todas":
                        str_path = "mostra_previsao_todas";
                        break;

                    default:
                        str_path = "o_q_deseja";
                        break;
                }
                return str_path;
            }
        },
        //Filtra previsões por vencimento
        filtra_previsao_venc: {
            message: `Informe uma data no formato dd/mm/aaaa (Ex.: ${new Date().toLocaleDateString()}).`,
            function: (params: Params) => {
                let str_dataAux = params.userInput;
                str_dataAux = str_dataAux.substring(3, 6) + str_dataAux.substring(0, 3) + str_dataAux.substring(6, 10)
                let str_data = new Date(str_dataAux);
                if (!isNaN(str_data.getDate())) {
                    let previsoes_aux: Boleto[] = [];
                    previsoes_aux = filterPrevisoes.filter(x => x.dataVencimento.slice(0, 10).toString() == moment.utc(str_data).format("YYYY-MM-DD").toString());
                    setFilterPrevisoes(previsoes_aux);
                }
                else {
                    params.injectMessage("A data informada não válida.");
                }
            },
            path: () => {
                return "aguarda_refresh";
            },
        },
        //Filtrar previsao por valor
        filtra_previsao_val: {
            message: `Informe um valor no formato 123.00.`,
            function: (params: Params) => {
                let str_data = params.userInput;
                if (Number(str_data) > 0) {
                    let previsoes_aux: Boleto[] = [];
                    previsoes_aux = filterPrevisoes.filter(x => x.valorOriginal === Number(str_data));
                    setFilterPrevisoes(previsoes_aux);
                }
                else {
                    params.injectMessage("O Valor dever ser um número maior que ZERO.");
                }

            },
            path: () => {
                return "aguarda_refresh";
            },
        },
        //Filtra previsão por locatário
        filtra_previsao_locat: {
            message: "Qual o nome do locatário que deseja encontrar?",
            function: (params: Params) => {
                let str_data = params.userInput;
                if (str_data.length > 0) {
                    let previsoes_aux: Boleto[] = [];
                    previsoes_aux = filterPrevisoes.filter(x => x.locatario?.pessoa?.nome.toLowerCase().includes(str_data.toLowerCase()));
                    setFilterPrevisoes(previsoes_aux);
                }
                else {
                    params.injectMessage("Favor informar ao menos uma letra.");
                }

            },
            path: () => {
                return "aguarda_refresh";
            },
        },
        aguarda_refresh: {
            message: "Estamos aplicando o filtro, aguarde...",
            transition: { duration: 3000 },
            path: "mostra_previsao",
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
                        {(filterPrevisoes.length <= 10 ?
                            <div className='rounded-md border-2 mt-2 m-2 p-2'>
                                <div className='grid grid-cols-12 m-2 font-[Poppins-bold]' >
                                    <Label className='border-b pb-5 col-span-7' style={{ 'fontSize': '0.7rem' }}>Destinatário</Label>
                                    <Label className='border-b  pb-5  col-span-3' style={{ 'fontSize': '0.7rem' }}>Vencimento</Label>
                                    <Label className='flex justify-end border-b pb-6  col-span-2' style={{ 'fontSize': '0.7rem' }}>Valor</Label>
                                </div>

                                <div>
                                    {filterPrevisoes.map((previsao, index) => (
                                        <div key={index} className='grid grid-cols-12 m-2'>
                                            <Label className='flex items-center  col-span-7' style={{ 'fontSize': '0.7rem' }}>{(index + 1)} -
                                                {previsao.locatario ? previsao.locatario.pessoa?.nome :
                                                    previsao.imovel?.proprietarios ? previsao.imovel?.proprietarios[0].pessoa?.nome : ''}
                                            </Label>
                                            <Label className='flex items-center  col-span-3' style={{ 'fontSize': '0.7rem' }}>{moment.utc(previsao.dataVencimento).format("DD/MM/YYYY")}</Label>
                                            <Label className='flex justify-end items-center  col-span-2' style={{ 'fontSize': '0.7rem' }}>{usdFormatter.format(previsao.valorOriginal)}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            :
                            <></>
                        )}
                    </div>
                );
            },
            transition: {
                duration: 1000,
                //interruptable: (filterPrevisoes.length === 1 ? true : false)
            },
            path: () => {
                console.log(filterPrevisoes);
                if (filterPrevisoes.length === 1) {
                    return "solicita_previsao_emissao";
                }
                else {
                    if (filterPrevisoes.length === 0) {
                        return "previsao_nao_encontrada";
                    }
                    else {
                        if (filterPrevisoes.length > 10) {
                            return "filtra_previsao";
                        }
                        else {
                            return "solicita_num_previsao";
                        }
                    }
                }
            },
        },
        //Mostrar todas as previsões
        mostra_previsao_todas: {
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

                                <div>
                                    {filterPrevisoes.map((previsao, index) => (
                                        <div key={index} className='grid grid-cols-12 m-2'>
                                            <Label className='flex items-center  col-span-7' style={{ 'fontSize': '0.7rem' }}>{(index + 1)} -
                                                {previsao.locatario ? previsao.locatario.pessoa?.nome :
                                                    previsao.imovel?.proprietarios ? previsao.imovel?.proprietarios[0].pessoa?.nome : ''}
                                            </Label>
                                            <Label className='flex items-center  col-span-3' style={{ 'fontSize': '0.7rem' }}>{moment.utc(previsao.dataVencimento).format("DD/MM/YYYY")}</Label>
                                            <Label className='flex justify-end items-center  col-span-2' style={{ 'fontSize': '0.7rem' }}>{usdFormatter.format(previsao.valorOriginal)}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            :
                            <></>
                        )}
                    </div>
                );
            },
            transition: {
                duration: 1000,
            },
            path: () => {
                console.log(filterPrevisoes);
                if (filterPrevisoes.length === 1) {
                    return "solicita_previsao_emissao";
                }
                else {
                    if (filterPrevisoes.length === 0) {
                        return "previsao_nao_encontrada";
                    }
                    else {
                        return "solicita_num_previsao";
                    }
                }
            },
        },
        //Quando não econtrar nenhuma previsao
        previsao_nao_encontrada: {
            message: "Nenhuma previsão encontrada, deseja informar outro filtro ?",
            options: snOptions,
            path: (params: Params) => {
                setFiltrosSel(filtrosSel.filter(x => x !== filtroLast));
                setFiltroLast("");
                if (params.userInput === "Sim") {
                    return "filtra_previsao";
                }
                else {
                    if (params.userInput === "Não") {
                        return "end";
                    }
                    else {
                        return "o_q_deseja";
                    }
                }
            }
        },
        novo_filtro_previsao: {
            message: "Deseja informar um novo fitro ?",
            options: snOptions,
            path: (params: Params) => {
                if (params.userInput === "Sim") {
                    return "filtra_previsao";
                }
                else {
                    return "end";
                }
            },
        },
        solicita_previsao_emissao: {
            message: "Confirma a emissão do boleto para essa previsão ?",
            options: snOptions,

            path: (params: Params) => {
                if (params.userInput === "Sim") {
                    return "confirma_previsao";
                }
                else {
                    if (params.userInput === "Não") {
                        return "novo_filtro_previsao";
                    }
                    else {
                        return "o_que_deseja";
                    }
                }
            },
        },
        solicita_num_previsao: {
            message: "Favor informar o número da previsão que deseja emitir o boleto ou 0 - zero para retornar aos fitros.",
            function: (params: Params) => {
                let str_data = params.userInput;
                if (Number(str_data) > 0 &&
                    Number(str_data) <= filterPrevisoes.length) {
                    let previsoes_aux: Boleto[] = [];
                    previsoes_aux.push(filterPrevisoes[Number(str_data) - 1]);
                    setFilterPrevisoes(previsoes_aux);
                }
                else {
                    if (params.userInput.toLowerCase().indexOf('não') > -1 ||
                        params.userInput.toLowerCase().indexOf('nao') > -1 ||
                        params.userInput.toLowerCase().indexOf('nenhum') > -1 ||
                        params.userInput.toLowerCase().indexOf('emitir') > -1 ||
                        params.userInput.toLowerCase() === "0" ||
                        params.userInput.toLowerCase().indexOf('cancelar') > -1 ||
                        params.userInput.toLowerCase().indexOf('geração') > -1 ||
                        params.userInput.toLowerCase().indexOf('geraçao') > -1
                    ) {
                        params.injectMessage("Um momento por favor.");
                    }
                    else {
                        params.injectMessage("O Valor informado dever estar entre 1 e " + (filterPrevisoes.length).toString());
                    }
                }

            },
            path: (params: Params) => {
                if (params.userInput.toLowerCase() === "0") {
                    return "novo_filtro_previsao";
                }
                else {
                    return "aguarda_refresh";
                }
            },
        },
        confirma_previsao: {
            message: "Gerando boleto...",
            transition: { duration: 1000 },
            path: "envia_boleto_banco",
        },


        //LOCAÇÕES
        //Consulta Locações
        consulta_locacao: {
            message: "Qual situação das locações deseja consultar ?",
            component: () => {
                return (
                    <div className='rounded-md border-2 mt-2 m-2 p-2'>
                        <div className='grid grid-cols-12 m-2 font-[Poppins-bold]' >
                            <Label className='border-b pb-5 col-span-7' style={{ 'fontSize': '0.7rem' }}>Situação</Label>
                        </div>

                        <div>
                            {STATUS_LOCACAO_OPTIONS.map((status, index) => (
                                <div key={index} className='grid grid-cols-12 m-2'>
                                    <Label className='flex items-center  col-span-7' style={{ 'fontSize': '0.7rem' }}>{(index + 1)} -
                                        {status.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            },
            path: async (params: Params) => {
                //setStatusLoc(params.userInput.toUpperCase() as LocacaoStatus);
                setFiltroLast("");
                if (Number(params.userInput) > 0 && Number(params.userInput) <= 3) {

                    let str_status = (params.userInput === "1" ? LocacaoStatus.AGUARDANDO_DOCUMENTOS : (params.userInput === "2" ? LocacaoStatus.ATIVA : LocacaoStatus.ENCERRADA));
                    //Consulta locações
                    console.log(str_status);
                    const data = await api.get<Locacao[]>('locacoes/empresastatus/' + (glb_params.id_empresa ? Number(glb_params.id_empresa) : 0) + '/' + str_status);

                    const locacoes = data?.data;

                    setFiltrosSel([]);
                    setFilterLocacoes([]);
                    if (locacoes && locacoes.length > 0) {
                        await params.injectMessage(`Foram encontradas ${locacoes.length} locações ${str_status}`);
                        setLocacoes(locacoes);
                        setFilterLocacoes(locacoes);
                        return "filtra_locacao"
                    }
                    else {
                        await params.injectMessage(`Não foram encontradas locações ${str_status}.`);
                        setLocacoes([]);
                        return "criar_previsao";
                    }
                }
                else {
                    if (params.userInput.toLowerCase().indexOf('iniciar') > -1 ||
                        params.userInput.toLowerCase().indexOf('começar') > -1) {
                        await params.injectMessage(`Voltando ao início.`);
                        return "start";
                    }
                    else {
                        await params.injectMessage(`O valor informado não é válido. Deve ser um número entre 1 e 3.`);
                        return "consulta_locacao";

                    }
                }
            }
        },
        process_status_locacao: {
            message: async () => {

            }
        },

        mostra_locacao: {
            message: () => {
                console.log(filterLocacoes);
                if (filterLocacoes.length > 6) {
                    return `Foram encontradas ${filterLocacoes.length} locações com esse filtro`
                }
                else {
                    if (filterLocacoes.length === 1) {
                        return "Apenas uma locação foi encontrada com esse filtro."
                    }
                    else {
                        return "Favor verificar se é uma dessas locações, se sim basta informar o número da lista que proseguiremos."
                    }
                }
            },
            component: () => {
                return (
                    <div>
                        {(filterLocacoes.length <= 10 ?
                            <div className='rounded-md border-2 mt-2 m-2 p-2'>
                                <div className='grid grid-cols-12 m-2 font-[Poppins-bold]' >
                                    <Label className='border-b pb-5 col-span-7' style={{ 'fontSize': '0.7rem' }}>Locatário</Label>
                                    <Label className='border-b  pb-5  col-span-3' style={{ 'fontSize': '0.7rem' }}>Vencimento</Label>
                                    <Label className='flex justify-end border-b pb-6  col-span-2' style={{ 'fontSize': '0.7rem' }}>Aluguel</Label>
                                </div>

                                <div>
                                    {filterLocacoes.map((locacao, index) => (
                                        <div key={index} className='grid grid-cols-12 m-2'>
                                            <Label className='flex items-center  col-span-7' style={{ 'fontSize': '0.7rem' }}>{(index + 1)} -
                                                {locacao.locatarios ? locacao.locatarios[0].pessoa?.nome : ""}
                                            </Label>
                                            <Label className='flex items-center  col-span-3' style={{ 'fontSize': '0.7rem' }}>{locacao.diaVencimento}</Label>
                                            <Label className='flex justify-end items-center  col-span-2' style={{ 'fontSize': '0.7rem' }}>{usdFormatter.format(locacao.valorAluguel)}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            :
                            <></>
                        )}
                    </div>
                );
            },
            transition: {
                duration: 1000,
                //interruptable: (filterPrevisoes.length === 1 ? true : false)
            },
            path: () => {
                console.log(filterLocacoes);
                if (filterLocacoes.length === 1) {
                    return "solicita_locacao_detalhes";
                }
                else {
                    if (filterLocacoes.length === 0) {
                        return "locacao_nao_encontrada";
                    }
                    else {
                        if (filterLocacoes.length > 10) {
                            return "filtra_locacao";
                        }
                        else {
                            return "solicita_num_locacao";
                        }
                    }
                }
            },
        },
        //Mostrar todas as previsões
        mostra_locacao_todas: {
            component: () => {
                return (
                    <div>
                        {(filterLocacoes.length > 0 ?
                            <div className='rounded-md border-2 mt-2 m-2 p-2'>
                                <div className='grid grid-cols-12 m-2 font-[Poppins-bold]' >
                                    <Label className='border-b pb-5 col-span-7' style={{ 'fontSize': '0.7rem' }}>Locatário</Label>
                                    <Label className='border-b  pb-5  col-span-3' style={{ 'fontSize': '0.7rem' }}>Vencimento</Label>
                                    <Label className='flex justify-end border-b pb-6  col-span-2' style={{ 'fontSize': '0.7rem' }}>Aluguel</Label>
                                </div>

                                <div>
                                    {filterLocacoes.map((locacao, index) => (
                                        <div key={index} className='grid grid-cols-12 m-2'>
                                            <Label className='flex items-center  col-span-7' style={{ 'fontSize': '0.7rem' }}>{(index + 1)} -
                                                {locacao.locatarios ? locacao.locatarios[0].pessoa?.nome : ""}
                                            </Label>
                                            <Label className='flex items-center  col-span-3' style={{ 'fontSize': '0.7rem' }}>{locacao.diaVencimento}</Label>
                                            <Label className='flex justify-end items-center  col-span-2' style={{ 'fontSize': '0.7rem' }}>{usdFormatter.format(locacao.valorAluguel)}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            :
                            <></>
                        )}
                    </div>
                );
            },
            transition: {
                duration: 1000,
            },
            path: () => {
                console.log(filterLocacoes);
                if (locacoes.length === 1) {
                    return "solicita_locacao_detalhes";
                }
                else {
                    if (locacoes.length === 0) {
                        return "locacao_nao_encontrada";
                    }
                    else {
                        return "solicita_num_locacao";
                    }
                }
            },
        },
        //Quando não econtrar nenuma previsao
        locacao_nao_encontrada: {
            message: "Nenhuma locação encontrada, deseja informar outro filtro ?",
            options: snOptions,
            path: (params: Params) => {
                setFiltrosSel(filtrosSel.filter(x => x !== filtroLast));
                setFiltroLast("");

                if (params.userInput === "Sim") {
                    return "filtra_locacao";
                }
                else {
                    if (params.userInput === "Não") {
                        return "end";
                    }
                    else {
                        return "o_q_deseja";
                    }
                }
            }
        },
        novo_filtro_locacao: {
            message: "Deseja informar um novo fitro ?",
            options: snOptions,
            path: (params: Params) => {
                if (params.userInput === "Sim") {
                    return "filtra_locacao";
                }
                else {
                    return "end";
                }
            },
        },

        //filtrar as locações dentre as encontradas encontradas
        filtra_locacao: {
            message: "Você teria algumas das informações abaixo, assim posso filtrar as locações.\nClique no botão desejado para colocar a informação.",
            transition: { duration: 1000 },
            path: "mostra_filtros_locacao",
        },
        mostra_filtros_locacao: {
            options: () => {
                return (filterLocacoes.length < 20 ? [...OptionsLocacao.filter(x => !filtrosSel.includes(x)), "Listar todas"] : OptionsLocacao.filter(x => !filtrosSel.includes(x)));
            },
            path: (params: Params) => {
                let str_path = "";
                switch (params.userInput) {
                    case "Dia Vencimento":
                        str_path = "filtra_locacao_venc";
                        setFiltrosSel([...filtrosSel, "Dia Vencimento"]);
                        setFiltroLast("Dia Vencimento");
                        break;

                    case "Valor":
                        str_path = "filtra_locacao_val";
                        setFiltrosSel([...filtrosSel, "Valor"]);
                        setFiltroLast("Valor");
                        break;

                    case "Locatário":
                        str_path = "filtra_locacao_locat";
                        setFiltrosSel([...filtrosSel, "Locatário"]);
                        setFiltroLast("Locatário");
                        break;

                    case "Proprietário":
                        str_path = "filtra_locacao_prop";
                        setFiltrosSel([...filtrosSel, "Proprietário"]);
                        setFiltroLast("Proprietário");
                        break;

                    case "Locação":
                        str_path = "filtra_locacao_loc";
                        setFiltrosSel([...filtrosSel, "Locação"]);
                        setFiltroLast("Locação");
                        break;

                    case "Listar todas":
                        str_path = "mostra_locacao_todas";
                        break;

                    default:
                        str_path = "consulta_locacao";
                }

                return str_path;
            },
        },

        filtra_locacao_venc: {
            message: `Informe um dia de vencimento entre 1 e 31 (a depender do mês).`,
            function: async (params: Params) => {
                let str_data = params.userInput;
                if (Number(str_data) > 0) {

                    let locacoes_aux: Locacao[] = [];
                    locacoes_aux = filterLocacoes.filter(x => x.diaVencimento === Number(str_data));
                    setFilterLocacoes(locacoes_aux);
                }
                else {
                    params.injectMessage("O dia do vencimento deve ser um número entre 1 e 31.");
                }
            },
            path: () => {
                return "aguarda_refresh_locacao";
            },
        },
        filtra_locacao_val: {
            message: `Informe um valor no formato 123.00.`,

            function: async (params: Params) => {
                let str_data = params.userInput;
                if (Number(str_data) > 0) {

                    let locacoes_aux: Locacao[] = [];
                    locacoes_aux = filterLocacoes.filter(x => x.valorAluguel === Number(str_data));
                    setFilterLocacoes(locacoes_aux);
                }
                else {
                    params.injectMessage("o Valor deve ser número maior que ZERO.");
                }
            },
            path: () => {
                return "aguarda_refresh_locacao";
            },
        },
        filtra_locacao_locat: {
            message: `Informe o nome do locatário.`,

            function: async (params: Params) => {
                let str_data = params.userInput;
                if (str_data.length > 0) {

                    let locacoes_aux: Locacao[] = [];
                    locacoes_aux = filterLocacoes.filter(x => x.locatarios && x.locatarios.some(l => l.pessoa ? l.pessoa.nome.toLowerCase().includes(str_data.toLowerCase()) : false));
                    setFilterLocacoes(locacoes_aux);
                }
            },
            path: () => {
                return "aguarda_refresh_locacao";
            },
        },
        filtra_locacao_prop: {
            message: `Informe o nome do proprietário.`,

            function: async (params: Params) => {
                let str_data = params.userInput;
                if (str_data.length > 0) {

                    let locacoes_aux: Locacao[] = [];
                    locacoes_aux = filterLocacoes.filter(x => x.imovel && x.imovel.proprietarios && x.imovel.proprietarios.some(p => p.pessoa ? p.pessoa.nome.toLowerCase().includes(str_data.toLowerCase()) : false));
                    setFilterLocacoes(locacoes_aux);
                }
            },
            path: () => {
                return "aguarda_refresh_locacao";
            },
        },
        filtra_locacao_loc: {
            message: `Informe algum dado da Locação.`,

            function: async (params: Params) => {
                let str_data = params.userInput;
                if (str_data.length > 0) {

                    let locacoes_aux: Locacao[] = [];
                    locacoes_aux = filterLocacoes.filter(x => x.imovel && x.imovel.endereco && (x.imovel.endereco.logradouro.toLowerCase().includes(str_data.toLowerCase()) || x.imovel.endereco.complemento?.toLowerCase().includes(str_data.toLowerCase()) || x.imovel.endereco.numero.toString().toLowerCase().includes(str_data.toLowerCase())));
                    setFilterLocacoes(locacoes_aux);
                }
            },
            path: () => {
                return "aguarda_refresh_locacao";
            },
        },
        solicita_locacao_detalhes: {
            options: ["Ver detalhes"],
            path: (params: Params) => {
                let str_path = "";
                switch (params.userInput) {
                    case "Ver detalhes":
                        navigate(ROUTE.LOCACOES + "/" + filterLocacoes[0].id);
                        str_path = "mostra_locacao_detalhes";
                }
                return str_path;
            }
        },
        aguarda_refresh_locacao: {
            message: "Estamos aplicando o filtro, aguarde...",
            transition: { duration: 3000 },
            path: "mostra_locacao",
        },

        solicita_num_locacao: {
            message: "Favor informar o número do imóvel que deseja visualizar ou 0 - zero para retornar aos fitros.",
            function: (params: Params) => {
                let str_data = params.userInput;
                if (Number(str_data) > 0 &&
                    Number(str_data) <= filterLocacoes.length) {
                    let locacoes_aux: Locacao[] = [];
                    locacoes_aux.push(filterLocacoes[Number(str_data) - 1]);
                    setFilterLocacoes(locacoes_aux);
                }
                else {
                    if (params.userInput.toLowerCase().indexOf('não') > -1 ||
                        params.userInput.toLowerCase().indexOf('nao') > -1 ||
                        params.userInput.toLowerCase().indexOf('nenhum') > -1 ||
                        params.userInput.toLowerCase().indexOf('emitir') > -1 ||
                        params.userInput.toLowerCase() === "0" ||
                        params.userInput.toLowerCase().indexOf('cancelar') > -1 ||
                        params.userInput.toLowerCase().indexOf('geração') > -1 ||
                        params.userInput.toLowerCase().indexOf('geraçao') > -1
                    ) {
                        params.injectMessage("Um momento por favor.");
                    }
                    else {
                        params.injectMessage("O Valor informado dever estar entre 1 e " + (filterLocacoes.length).toString());
                    }
                }

            },
            path: (params: Params) => {
                if (params.userInput.toLowerCase() === "0") {
                    return "novo_filtro_locacao";
                }
                else {
                    return "aguarda_refresh_locacao";
                }
            },
        },


        //IMÒVEIS
        //Consulta Imóveis
        consulta_imovel: {
            message: "Qual situação dos imóveis deseja consultar ?",
            component: () => {
                return (
                    <div className='rounded-md border-2 mt-2 m-2 p-2'>
                        <div className='grid grid-cols-12 m-2 font-[Poppins-bold]' >
                            <Label className='border-b pb-5 col-span-7' style={{ 'fontSize': '0.7rem' }}>Situação</Label>
                        </div>

                        <div>
                            {STATUS_IMOVEL_OPTIONS.map((status, index) => (
                                <div key={index} className='grid grid-cols-12 m-2'>
                                    <Label className='flex items-center  col-span-7' style={{ 'fontSize': '0.7rem' }}>{(index + 1)} -
                                        {status.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            },
            path: async (params: Params) => {
                //setStatusLoc(params.userInput.toUpperCase() as LocacaoStatus);
                setFiltroLast("");
                if (Number(params.userInput) > 0 && Number(params.userInput) <= 3) {

                    let str_status = (params.userInput === "1" ? ImovelStatus.DISPONIVEL : (params.userInput === "2" ? ImovelStatus.ALUGADO : (params.userInput === "3" ? ImovelStatus.VENDIDO : (params.userInput === "4" ? ImovelStatus.INDISPONIVEL : ImovelStatus.INATIVO))));
                    //Consulta locações
                    console.log(str_status);
                    const data = await api.get<Imovel[]>('imoveis/status/' + (glb_params.id_empresa ? Number(glb_params.id_empresa) : 0) + '/' + str_status);

                    const imoveis = data?.data;

                    setFiltrosSel([]);
                    setFilterImoveis([]);
                    if (imoveis && imoveis.length > 0) {
                        await params.injectMessage(`Foram encontrados ${imoveis.length} imóveis`);
                        setImoveis(imoveis);
                        setFilterImoveis(imoveis);
                        return "filtra_imovel"
                    }
                    else {
                        await params.injectMessage(`Não foram encontrados imóveis com o status ${str_status}.`);
                        setImoveis([]);
                        return "criar_previsao";
                    }
                }
                else {
                    if (params.userInput.toLowerCase().indexOf('iniciar') > -1 ||
                        params.userInput.toLowerCase().indexOf('começar') > -1) {
                        await params.injectMessage(`Voltando ao início.`);
                        return "start";
                    }
                    else {
                        await params.injectMessage(`O valor informado não é válido. Deve ser um número entre 1 e 5.`);
                        return "consulta_imovel";

                    }
                }
            }
        },
        process_status_imovel: {
            message: async () => {

            }
        },

        mostra_imovel: {
            message: () => {
                console.log(imoveis);
                if (filterImoveis.length > 6) {
                    return `Foram encontrados ${filterImoveis.length} imóveis com esse filtro`
                }
                else {
                    if (filterImoveis.length === 1) {
                        return "Apenas um imóvel foi encontrado com esse filtro."
                    }
                    else {
                        return "Favor verificar se é um desses imóveis, se sim basta informar o número da lista que proseguiremos."
                    }
                }
            },
            component: () => {
                return (
                    <div>
                        {(filterImoveis.length <= 10 ?
                            <div className='rounded-md border-2 mt-2 m-2 p-2'>
                                <div className='grid grid-cols-12 m-2 font-[Poppins-bold]' >
                                    <Label className='border-b pb-5 col-span-6' style={{ 'fontSize': '0.7rem' }}>Proprietário</Label>
                                    <Label className='border-b  pb-5  col-span-6' style={{ 'fontSize': '0.7rem' }}>Endereço</Label>
                                </div>

                                <div>
                                    {filterImoveis.map((imovel, index) => (
                                        <div key={index} className='grid grid-cols-12 m-2'>
                                            <Label className='flex items-center  col-span-6' style={{ 'fontSize': '0.7rem' }}>{(index + 1)} -
                                                {imovel.proprietarios ? imovel.proprietarios[0].pessoa?.nome : ""}
                                            </Label>
                                            <Label className='flex items-center  col-span-6' style={{ 'fontSize': '0.7rem' }}>{imovel.endereco.logradouro} - {imovel.endereco.complemento}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            :
                            <></>
                        )}
                    </div>
                );
            },
            transition: {
                duration: 1000,
            },
            path: () => {
                console.log(filterImoveis);
                if (filterImoveis.length === 1) {
                    return "solicita_imovel_detalhes";
                }
                else {
                    if (filterImoveis.length === 0) {
                        return "imovel_nao_encontrada";
                    }
                    else {
                        if (filterImoveis.length > 10) {
                            return "filtra_imovel";
                        }
                        else {
                            return "solicita_num_imovel";
                        }
                    }
                }
            },
        },
        //Mostrar todas as previsões
        mostra_imovel_todas: {
            component: () => {
                return (
                    <div>
                        {(filterImoveis.length <= 10 ?
                            <div className='rounded-md border-2 mt-2 m-2 p-2'>
                                <div className='grid grid-cols-12 m-2 font-[Poppins-bold]' >
                                    <Label className='border-b pb-5 col-span-6' style={{ 'fontSize': '0.7rem' }}>Proprietário</Label>
                                    <Label className='border-b  pb-5  col-span-6' style={{ 'fontSize': '0.7rem' }}>Endereço</Label>
                                </div>

                                <div>
                                    {filterImoveis.map((imovel, index) => (
                                        <div key={index} className='grid grid-cols-12 m-2'>
                                            <Label className='flex items-center  col-span-6' style={{ 'fontSize': '0.7rem' }}>{(index + 1)} -
                                                {imovel.proprietarios ? imovel.proprietarios[0].pessoa?.nome : ""}
                                            </Label>
                                            <Label className='flex items-center  col-span-6' style={{ 'fontSize': '0.7rem' }}>{imovel.endereco.logradouro} - {imovel.endereco.complemento}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            :
                            <></>
                        )}
                    </div>
                );
            },
            transition: {
                duration: 1000,
            },
            path: () => {
                console.log(filterImoveis);
                if (filterImoveis.length === 1) {
                    return "solicita_imovel_detalhes";
                }
                else {
                    if (filterImoveis.length === 0) {
                        return "imovel_nao_encontrada";
                    }
                    else {
                        return "solicita_num_imovel";
                    }
                }
            },
        },
        //Quando não econtrar nenuma previsao
        imovel_nao_encontrada: {
            message: "Nenhum imóvel encontrado, deseja informar outro filtro ?",
            options: snOptions,
            path: (params: Params) => {
                setFiltrosSel(filtrosSel.filter(x => x !== filtroLast));
                setFiltroLast("");

                if (params.userInput === "Sim") {
                    return "filtra_imovel";
                }
                else {
                    if (params.userInput === "Não") {
                        return "end";
                    }
                    else {
                        return "o_q_deseja";
                    }
                }
            }
        },
        novo_filtro_imovel: {
            message: "Deseja informar um novo fitro ?",
            options: snOptions,
            path: (params: Params) => {
                if (params.userInput === "Sim") {
                    return "filtra_imovel";
                }
                else {
                    return "end";
                }
            },
        },

        //filtrar as locações dentre as encontradas encontradas
        filtra_imovel: {
            message: "Você teria algumas das informações abaixo, assim posso filtrar os imóveis.\nClique no botão desejado para colocar a informação.",
            transition: { duration: 1000 },
            path: "mostra_filtros_imovel",
        },
        mostra_filtros_imovel: {
            options: () => {
                return (filterImoveis.length < 20 ? [...OptionsImovel.filter(x => !filtrosSel.includes(x)), "Listar todas"] : OptionsImovel.filter(x => !filtrosSel.includes(x)));
            },
            path: (params: Params) => {
                let str_path = "";
                switch (params.userInput) {
                    case "Tipo imóvel":
                        str_path = "filtra_imovel_tipo";
                        setFiltrosSel([...filtrosSel, "Tipo imóvel"]);
                        setFiltroLast("Tipo imóvel");
                        break;

                    case "Proprietário":
                        str_path = "filtra_imovel_prop";
                        setFiltrosSel([...filtrosSel, "Proprietário"]);
                        setFiltroLast("Proprietário");
                        break;

                    case "Endereço":
                        str_path = "filtra_imovel_ender";
                        setFiltrosSel([...filtrosSel, "Endereço"]);
                        setFiltroLast("Endereço");
                        break;

                    case "Listar todas":
                        str_path = "mostra_imovel_todas";
                        break;

                    default:
                        str_path = "consulta_imovel";
                }

                return str_path;
            },
        },
        filtra_imovel_tipo: {
            message: `Informe o tipo de Imóvel desejado.`,
            options: () =>{                
                console.log(tiposImoveis);
                if (tiposImoveis){
                    return tiposImoveis.map((tipo) => tipo.name);
                }
                else{
                    return [];
                }
            },
            function: async (params: Params) => {
                console.log(params.userInput);
                let str_tipo = params.userInput;
                if (str_tipo.length > 0) {

                    let tipoimovel_aux: TipoImovel[] = [];
                    tipoimovel_aux = tiposImoveis.filter(x => x.name === str_tipo);
                    let imoveis_aux: Imovel[] = [];
                    console.log(filterImoveis);
                    imoveis_aux = filterImoveis.filter(x => x.tipoId && x.tipoId === tipoimovel_aux[0].id);
                    setFilterImoveis(imoveis_aux);
                }
                else {
                    params.injectMessage("O tipo de imóvel é obrigatório.");
                }
            },
            path: () => {
                return "aguarda_refresh_imovel";
            },
        },
        filtra_imovel_prop: {
            message: `Informe o nome do proprietário.`,

            function: async (params: Params) => {
                let str_data = params.userInput;
                if (str_data.length > 0) {

                    let imoveis_aux: Imovel[] = [];
                    imoveis_aux = filterImoveis.filter(x => x.proprietarios && x.proprietarios.some(p => p.pessoa ? p.pessoa.nome.toLowerCase().includes(str_data.toLowerCase()) : false));
                    setFilterImoveis(imoveis_aux);
                }
            },
            path: () => {
                return "aguarda_refresh_imovel";
            },
        },
        filtra_imovel_ender: {
            message: `Informe algum dado do endereço do imóvel.`,

            function: async (params: Params) => {
                let str_data = params.userInput;
                if (str_data.length > 0) {

                    let imoveis_aux: Imovel[] = [];
                    imoveis_aux = filterImoveis.filter(x => x.endereco && (x.endereco.logradouro.toLowerCase().includes(str_data.toLowerCase()) || x.endereco.complemento?.toLowerCase().includes(str_data.toLowerCase()) || x.endereco.numero.toString().toLowerCase().includes(str_data.toLowerCase())));
                    setFilterImoveis(imoveis_aux);
                }
            },
            path: () => {
                return "aguarda_refresh_imovel";
            },
        },
        solicita_imovel_detalhes: {
            options: ["Ver detalhes"],
            path: (params: Params) => {
                let str_path = "";
                switch (params.userInput) {
                    case "Ver detalhes":
                        navigate(ROUTE.LOCACOES + "/" + filterLocacoes[0].id);
                        str_path = "mostra_imovel_detalhes";
                }
                return str_path;
            }
        },
        aguarda_refresh_imovel: {
            message: "Estamos aplicando o filtro, aguarde...",
            transition: { duration: 3000 },
            path: "mostra_imovel",
        },

        solicita_num_imovel: {
            message: "Favor informar o número da locacao que deseja visualizar ou 0 - zero para retornar aos fitros.",
            function: (params: Params) => {
                let str_data = params.userInput;
                if (Number(str_data) > 0 &&
                    Number(str_data) <= filterLocacoes.length) {
                    let locacoes_aux: Locacao[] = [];
                    locacoes_aux.push(filterLocacoes[Number(str_data) - 1]);
                    setFilterLocacoes(locacoes_aux);
                }
                else {
                    if (params.userInput.toLowerCase().indexOf('não') > -1 ||
                        params.userInput.toLowerCase().indexOf('nao') > -1 ||
                        params.userInput.toLowerCase().indexOf('nenhum') > -1 ||
                        params.userInput.toLowerCase().indexOf('emitir') > -1 ||
                        params.userInput.toLowerCase() === "0" ||
                        params.userInput.toLowerCase().indexOf('cancelar') > -1 ||
                        params.userInput.toLowerCase().indexOf('geração') > -1 ||
                        params.userInput.toLowerCase().indexOf('geraçao') > -1
                    ) {
                        params.injectMessage("Um momento por favor.");
                    }
                    else {
                        params.injectMessage("O Valor informado dever estar entre 1 e " + (filterLocacoes.length).toString());
                    }
                }

            },
            path: (params: Params) => {
                if (params.userInput.toLowerCase() === "0") {
                    return "novo_filtro_imovel";
                }
                else {
                    return "aguarda_refresh_imovel";
                }
            },
        },

        //Pessoas
        //Consulta Clientes
        consulta_cliente: {
            message: "Qual situação dos clientes deseja consultar ?",
            component: () => {
                return (
                    <div className='rounded-md border-2 mt-2 m-2 p-2'>
                        <div className='grid grid-cols-12 m-2 font-[Poppins-bold]' >
                            <Label className='border-b pb-5 col-span-7' style={{ 'fontSize': '0.7rem' }}>Situação</Label>
                        </div>

                        <div>
                            {STATUS_PESSOA_OPTIONS.map((status, index) => (
                                <div key={index} className='grid grid-cols-12 m-2'>
                                    <Label className='flex items-center  col-span-7' style={{ 'fontSize': '0.7rem' }}>{(index + 1)} -
                                        {status.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            },
            path: async (params: Params) => {
                //setStatusLoc(params.userInput.toUpperCase() as LocacaoStatus);
                setFiltroLast("");
                if (Number(params.userInput) > 0 && Number(params.userInput) <= 3) {

                    let str_status = (params.userInput === "1" ? PessoaStatus.ATIVA : PessoaStatus.CANCELADA);
                    //Consulta locações
                    console.log(str_status);
                    const data = await api.get<Pessoa[]>('pessoas/status/' + (glb_params.id_empresa ? Number(glb_params.id_empresa) : 0) + '/' + str_status);

                    const pessoas_aux = data?.data;

                    setFiltrosSel([]);
                    setFilterPessoas([]);
                    if (pessoas_aux && pessoas_aux.length > 0) {
                        await params.injectMessage(`Foram encontradas ${pessoas_aux.length} pessoas`);
                        setPessoas(pessoas_aux);
                        setFilterPessoas(pessoas_aux);
                        return "filtra_cliente"
                    }
                    else {
                        await params.injectMessage(`Não foram encontradas pessoas com o status ${str_status}.`);
                        setPessoas([]);
                        return "consulta_cliente";
                    }
                }
                else {
                    if (params.userInput.toLowerCase().indexOf('iniciar') > -1 ||
                        params.userInput.toLowerCase().indexOf('começar') > -1) {
                        await params.injectMessage(`Voltando ao início.`);
                        return "start";
                    }
                    else {
                        await params.injectMessage(`O valor informado não é válido. Deve ser um número entre 1 e 2.`);
                        return "consulta_cliente";

                    }
                }
            }
        },
        process_status_cliente: {
            message: async () => {

            }
        },

        mostra_cliente: {
            message: () => {
                console.log(pessoas);
                if (filterPessoas.length > 6) {
                    return `Foram encontrados ${filterPessoas.length} clientes com esse filtro`
                }
                else {
                    if (filterPessoas.length === 1) {
                        return "Apenas um cliente foi encontrado com esse filtro."
                    }
                    else {
                        return "Favor verificar se é um desses clientes, se sim basta informar o número da lista que proseguiremos."
                    }
                }
            },
            component: () => {
                return (
                    <div>
                        {(filterPessoas.length <= 10 ?
                            <div className='rounded-md border-2 mt-2 m-2 p-2'>
                                <div className='grid grid-cols-12 m-2 font-[Poppins-bold]' >
                                    <Label className='border-b pb-5 col-span-6' style={{ 'fontSize': '0.7rem' }}>Nome</Label>
                                    <Label className='border-b  pb-5  col-span-6' style={{ 'fontSize': '0.7rem' }}>Telefone</Label>
                                    <Label className='border-b  pb-5  col-span-6' style={{ 'fontSize': '0.7rem' }}>Email</Label>
                                </div>

                                <div>
                                    {filterPessoas.map((pessoa, index) => (
                                        <div key={index} className='grid grid-cols-12 m-2'>
                                            <Label className='flex items-center  col-span-6' style={{ 'fontSize': '0.7rem' }}>{(index + 1)} -
                                                {pessoa.nome}
                                            </Label>
                                            <Label className='flex items-center  col-span-6' style={{ 'fontSize': '0.7rem' }}>{pessoa.telefone}</Label>
                                            <Label className='flex items-center  col-span-6' style={{ 'fontSize': '0.7rem' }}>{pessoa.email}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            :
                            <></>
                        )}
                    </div>
                );
            },
            transition: {
                duration: 1000,
            },
            path: () => {
                console.log(filterPessoas);
                if (filterPessoas.length === 1) {
                    return "solicita_cliente_detalhes";
                }
                else {
                    if (filterPessoas.length === 0) {
                        return "cliente_nao_encontrado";
                    }
                    else {
                        if (filterPessoas.length > 10) {
                            return "filtra_cliente";
                        }
                        else {
                            return "solicita_num_cliente";
                        }
                    }
                }
            },
        },
        //Mostrar todas as previsões
        mostra_cliente_todas: {
            component: () => {
                return (
                    <div>
                        {(filterPessoas.length <= 10 ?
                            <div className='rounded-md border-2 mt-2 m-2 p-2'>
                                <div className='grid grid-cols-12 m-2 font-[Poppins-bold]' >
                                    <Label className='border-b pb-5 col-span-6' style={{ 'fontSize': '0.7rem' }}>Nome</Label>
                                    <Label className='border-b  pb-5  col-span-6' style={{ 'fontSize': '0.7rem' }}>Telefone</Label>
                                    <Label className='border-b  pb-5  col-span-6' style={{ 'fontSize': '0.7rem' }}>Email</Label>
                                </div>

                                <div>
                                    {filterPessoas.map((pessoa, index) => (
                                        <div key={index} className='grid grid-cols-12 m-2'>
                                            <Label className='flex items-center  col-span-6' style={{ 'fontSize': '0.7rem' }}>{(index + 1)} -
                                                {pessoa.nome}
                                            </Label>
                                            <Label className='flex items-center  col-span-6' style={{ 'fontSize': '0.7rem' }}>{pessoa.telefone}</Label>
                                            <Label className='flex items-center  col-span-6' style={{ 'fontSize': '0.7rem' }}>{pessoa.email}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            :
                            <></>
                        )}
                    </div>
                );
            },
            transition: {
                duration: 1000,
            },
            path: () => {
                console.log(filterPessoas);
                if (filterPessoas.length === 1) {
                    return "solicita_cliente_detalhes";
                }
                else {
                    if (filterPessoas.length === 0) {
                        return "cliente_nao_encontrado";
                    }
                    else {
                        return "solicita_num_cliente";
                    }
                }
            },
        },
        //Quando não econtrar nenuma previsao
        cliente_nao_encontrado: {
            message: "Nenhum cliente encontrado, deseja informar outro filtro ?",
            options: snOptions,
            path: (params: Params) => {
                setFiltrosSel(filtrosSel.filter(x => x !== filtroLast));
                setFiltroLast("");

                if (params.userInput === "Sim") {
                    return "filtra_cliente";
                }
                else {
                    if (params.userInput === "Não") {
                        return "end";
                    }
                    else {
                        return "o_q_deseja";
                    }
                }
            }
        },
        novo_filtro_cliente: {
            message: "Deseja informar um novo fitro ?",
            options: snOptions,
            path: (params: Params) => {
                if (params.userInput === "Sim") {
                    return "filtra_cliente";
                }
                else {
                    return "end";
                }
            },
        },

        //filtrar as locações dentre as encontradas encontradas
        filtra_cliente: {
            message: "Você teria algumas das informações abaixo, assim posso filtrar os clientes.\nClique no botão desejado para colocar a informação.",
            transition: { duration: 1000 },
            path: "mostra_filtros_cliente",
        },
        mostra_filtros_cliente: {
            options: () => {
                return (filterPessoas.length < 20 ? [...OptionsPessoa.filter(x => !filtrosSel.includes(x)), "Listar todas"] : OptionsPessoa.filter(x => !filtrosSel.includes(x)));
            },
            path: (params: Params) => {
                let str_path = "";
                switch (params.userInput) {
                    case "Nome":
                        str_path = "filtra_cliente_nome";
                        setFiltrosSel([...filtrosSel, "Nome"]);
                        setFiltroLast("Nome");
                        break;

                    case "Telefone":
                        str_path = "filtra_cliente_tel";
                        setFiltrosSel([...filtrosSel, "Telefone"]);
                        setFiltroLast("Telefone");
                        break;

                    case "Email":
                        str_path = "filtra_cliente_email";
                        setFiltrosSel([...filtrosSel, "Email"]);
                        setFiltroLast("Email");
                        break;

                    case "Listar todas":
                        str_path = "mostra_cliente_todas";
                        break;

                    default:
                        str_path = "consulta_cliente";
                }

                return str_path;
            },
        },
        filtra_cliente_nome: {
            message: `Informe o nome do cliente.`,
            function: async (params: Params) => {
                console.log(params.userInput);
                let str_nome = params.userInput;
                if (str_nome.length > 0) {

                    let clientes_aux: Pessoa[] = [];
                    console.log(filterPessoas);
                    clientes_aux = filterPessoas.filter(x => x.nome.toLowerCase().includes(str_nome.toLowerCase()));
                    setFilterPessoas(clientes_aux);
                }
                else {
                    params.injectMessage("O nome do cliente é obrigatório.");
                }
            },
            path: () => {
                return "aguarda_refresh_cliente";
            },
        },
        filtra_cliente_tel: {
            message: `Informe o telefone do cliente.`,

            function: async (params: Params) => {
                let str_data = params.userInput;
                if (str_data.length > 0) {

                    let clientes_aux: Pessoa[] = [];
                    clientes_aux = filterPessoas.filter(x => x.telefone && x.telefone.includes(str_data));
                    setFilterPessoas(clientes_aux);
                }
            },
            path: () => {
                return "aguarda_refresh_cliente";
            },
        },
        filtra_cliente_email: {
            message: `Informe o email do cliente.`,

            function: async (params: Params) => {
                let str_data = params.userInput;
                if (str_data.length > 0) {

                    let clientes_aux: Pessoa[] = [];
                    clientes_aux = filterPessoas.filter(x => x.email && x.email.includes(str_data));
                    setFilterPessoas(clientes_aux);
                }
            },
            path: () => {
                return "aguarda_refresh_cliente";
            },
        },
        solicita_cliente_detalhes: {
            options: ["Ver detalhes"],
            path: (params: Params) => {
                let str_path = "";
                switch (params.userInput) {
                    case "Ver detalhes":
                        navigate(ROUTE.CLIENTES + "/" + filterPessoas[0].id);
                        str_path = "mostra_cliente_detalhes";
                }
                return str_path;
            }
        },
        aguarda_refresh_cliente: {
            message: "Estamos aplicando o filtro, aguarde...",
            transition: { duration: 3000 },
            path: "mostra_cliente",
        },

        solicita_num_cliente: {
            message: "Favor informar o número do cliente que deseja visualizar ou 0 - zero para retornar aos fitros.",
            function: (params: Params) => {
                let str_data = params.userInput;
                if (Number(str_data) > 0 &&
                    Number(str_data) <= filterPessoas.length) {
                    let clientes_aux: Pessoa[] = [];
                    clientes_aux.push(filterPessoas[Number(str_data) - 1]);
                    setFilterPessoas(clientes_aux);
                }
                else {
                    if (params.userInput.toLowerCase().indexOf('não') > -1 ||
                        params.userInput.toLowerCase().indexOf('nao') > -1 ||
                        params.userInput.toLowerCase().indexOf('nenhum') > -1 ||
                        params.userInput.toLowerCase().indexOf('emitir') > -1 ||
                        params.userInput.toLowerCase() === "0" ||
                        params.userInput.toLowerCase().indexOf('cancelar') > -1 ||
                        params.userInput.toLowerCase().indexOf('geração') > -1 ||
                        params.userInput.toLowerCase().indexOf('geraçao') > -1
                    ) {
                        params.injectMessage("Um momento por favor.");
                    }
                    else {
                        params.injectMessage("O Valor informado dever estar entre 1 e " + (filterPessoas.length).toString());
                    }
                }

            },
            path: (params: Params) => {
                if (params.userInput.toLowerCase() === "0") {
                    return "novo_filtro_cliente";
                }
                else {
                    return "aguarda_refresh_cliente";
                }
            },
        },

        //BOLETOS
        //Consulta boletos
        consulta_boleto: {
            message: "Qual situação dos boletos deseja consultar ?",
            component: () => {
                return (
                    <div className='rounded-md border-2 mt-2 m-2 p-2'>
                        <div className='grid grid-cols-12 m-2 font-[Poppins-bold]' >
                            <Label className='border-b pb-5 col-span-7' style={{ 'fontSize': '0.7rem' }}>Situação</Label>
                        </div>

                        <div>
                            {STATUS_BOLETO_OPTIONS.map((status, index) => (
                                <div key={index} className='grid grid-cols-12 m-2'>
                                    <Label className='flex items-center  col-span-7' style={{ 'fontSize': '0.7rem' }}>{(index + 1)} -
                                        {status.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            },
            path: async (params: Params) => {
                setFiltroLast("");
                //setStatusLoc(params.userInput.toUpperCase() as LocacaoStatus);

                if (Number(params.userInput) > 0 && Number(params.userInput) <= 5) {

                    let str_status = (params.userInput === "1" ? BoletoStatus.ATRASADO : params.userInput === "2" ? BoletoStatus.PAGO : params.userInput === "3" ? BoletoStatus.PENDENTE : params.userInput === "4" ? BoletoStatus.CONFIRMADO : BoletoStatus.CANCELADO);
                    //Consulta locações
                    console.log(str_status);
                    const data = await api.get<BoletoBancario[]>('boleto-bancario/status/' + (glb_params.id_empresa ? Number(glb_params.id_empresa) : 0) + '/' + str_status);

                    const bb_aux = data?.data;

                    setFiltrosSel([]);
                    setFilterBoletosb([]);
                    if (bb_aux && bb_aux.length > 0) {
                        await params.injectMessage(`Foram encontradas ${bb_aux.length} boletos`);
                        setBoletosb(bb_aux);
                        setFilterBoletosb(bb_aux);
                        return "filtra_boleto"
                    }
                    else {
                        await params.injectMessage(`Não foram encontradas boletos com o status ${str_status}.`);
                        setBoletosb([]);
                        return "consulta_boleto";
                    }
                }
                else {
                    if (params.userInput.toLowerCase().indexOf('iniciar') > -1 ||
                        params.userInput.toLowerCase().indexOf('começar') > -1) {
                        await params.injectMessage(`Voltando ao início.`);
                        return "start";
                    }
                    else {
                        await params.injectMessage(`O valor informado não é válido. Deve ser um número entre 1 e 5.`);
                        return "consulta_boleto";

                    }
                }
            }
        },
        process_status_boleto: {
            message: async () => {

            }
        },

        mostra_boleto: {
            message: () => {
                console.log(boletosb);
                if (filterBoletosb.length > 6) {
                    return `Foram encontrados ${filterBoletosb.length} boletos com esse filtro`
                }
                else {
                    if (filterBoletosb.length === 1) {
                        return "Apenas um boleto foi encontrado com esse filtro."
                    }
                    else {
                        return "Favor verificar se é um desses boletos, se sim basta informar o número da lista que proseguiremos."
                    }
                }
            },
            component: () => {
                return (
                    <div>
                        {(filterBoletosb.length <= 10 ?
                            <div className='rounded-md border-2 mt-2 m-2 p-2'>
                                <div className='grid grid-cols-12 m-2 font-[Poppins-bold]' >
                                    <Label className='border-b pb-5 col-span-6' style={{ 'fontSize': '0.7rem' }}>Nome</Label>
                                    <Label className='border-b  pb-5  col-span-3' style={{ 'fontSize': '0.7rem' }}>Vencimento</Label>
                                    <Label className='border-b  pb-5  col-span-3' style={{ 'fontSize': '0.7rem' }}>Valor</Label>
                                </div>

                                <div>
                                    {filterBoletosb.map((boleto, index) => (
                                        <div key={index} className='grid grid-cols-12 m-2'>
                                            <Label className='flex items-center  col-span-6' style={{ 'fontSize': '0.7rem' }}>{(index + 1)} -
                                                {boleto.boleto?.locatario ? boleto.boleto.locatario.pessoa?.nome : 
                                                 boleto.boleto?.imovel && boleto.boleto.imovel.proprietarios && boleto.boleto.imovel.proprietarios[0].pessoa ? boleto.boleto.imovel.proprietarios[0].pessoa.nome : "Sem proprietário"
                                                }
                                            </Label>
                                            <Label className='flex items-center  col-span-3' style={{ 'fontSize': '0.7rem' }}>{moment.utc(boleto.dataVencimento).format('DD/MM/YYYY')}</Label>
                                            <Label className='flex items-center  col-span-3' style={{ 'fontSize': '0.7rem' }}>{boleto.valor.toLocaleString()}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            :
                            <></>
                        )}
                    </div>
                );
            },
            transition: {
                duration: 1000,
            },
            path: () => {
                console.log(filterBoletosb);
                if (filterBoletosb.length === 1) {
                    return "solicita_boleto_detalhes";
                }
                else {
                    if (filterBoletosb.length === 0) {
                        return "boleto_nao_encontrado";
                    }
                    else {
                        if (filterBoletosb.length > 10) {
                            return "filtra_boleto";
                        }
                        else {
                            return "solicita_num_boleto";
                        }
                    }
                }
            },
        },
        //Mostrar todas as previsões
        mostra_boleto_todas: {
            component: () => {
                return (
                    <div>
                        {(filterBoletosb.length <= 10 ?
                            <div className='rounded-md border-2 mt-2 m-2 p-2'>
                                <div className='grid grid-cols-12 m-2 font-[Poppins-bold]' >
                                    <Label className='border-b pb-5 col-span-6' style={{ 'fontSize': '0.7rem' }}>Nome</Label>
                                    <Label className='border-b  pb-5  col-span-3' style={{ 'fontSize': '0.7rem' }}>Vencimento</Label>
                                    <Label className='border-b  pb-5  col-span-3' style={{ 'fontSize': '0.7rem' }}>Valor</Label>
                                </div>

                                <div>
                                    {filterBoletosb.map((boleto, index) => (
                                        <div key={index} className='grid grid-cols-12 m-2'>
                                            <Label className='flex items-center  col-span-6' style={{ 'fontSize': '0.7rem' }}>{(index + 1)} -
                                                {boleto.boleto?.locatario ? boleto.boleto.locatario.pessoa?.nome : 
                                                 boleto.boleto?.imovel && boleto.boleto.imovel.proprietarios && boleto.boleto.imovel.proprietarios[0].pessoa ? boleto.boleto.imovel.proprietarios[0].pessoa.nome : "Sem proprietário"
                                                }
                                            </Label>
                                            <Label className='flex items-center  col-span-3' style={{ 'fontSize': '0.7rem' }}>{moment.utc(boleto.dataVencimento).format('DD/MM/YYYY')}</Label>
                                            <Label className='flex items-center  col-span-3' style={{ 'fontSize': '0.7rem' }}>{boleto.valor.toLocaleString()}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            :
                            <></>
                        )}
                    </div>
                );
            },
            transition: {
                duration: 1000,
            },
            path: () => {
                console.log(filterBoletosb);
                if (filterBoletosb.length === 1) {
                    return "solicita_boleto_detalhes";
                }
                else {
                    if (filterBoletosb.length === 0) {
                        return "boleto_nao_encontrado";
                    }
                    else {
                        return "solicita_num_boleto";
                    }
                }
            },
        },
        //Quando não econtrar nenuma previsao
        boleto_nao_encontrado: {
            message: "Nenhum boleto encontrado, deseja informar outro filtro ?",
            options: snOptions,
            path: (params: Params) => {
                setFiltrosSel(filtrosSel.filter(x => x !== filtroLast));
                setFiltroLast("");

                if (params.userInput === "Sim") {
                    return "filtra_boleto";
                }
                else {
                    if (params.userInput === "Não") {
                        return "end";
                    }
                    else {
                        return "o_q_deseja";
                    }
                }
            }
        },
        novo_filtro_boleto: {
            message: "Deseja informar um novo fitro ?",
            options: snOptions,
            path: (params: Params) => {
                if (params.userInput === "Sim") {
                    return "filtra_boleto";
                }
                else {
                    return "end";
                }
            },
        },

        //filtrar as locações dentre as encontradas encontradas
        filtra_boleto: {
            message: "Você teria algumas das informações abaixo, assim posso filtrar os boletos.\nClique no botão desejado para colocar a informação.",
            transition: { duration: 1000 },
            path: "mostra_filtros_boleto",
        },
        mostra_filtros_boleto: {
            options: () => {
                console.log(filterBoletosb);
                return (filterBoletosb.length < 20 ? [...OptionsBoleto.filter(x => !filtrosSel.includes(x)), "Listar todas"] : OptionsBoleto.filter(x => !filtrosSel.includes(x)));
            },
            path: (params: Params) => {
                let str_path = "";
                switch (params.userInput) {
                    case "Vencimento":
                        setFiltrosSel([...filtrosSel, "Vencimento"]);
                        setFiltroLast("Vencimento");
                        str_path = "filtra_boleto_venc";
                        break;

                    case "Valor":
                        setFiltrosSel([...filtrosSel, "Valor"]);
                        setFiltroLast("Valor");
                        str_path = "filtra_boleto_val";
                        break;

                    case "Locatário":
                        setFiltrosSel([...filtrosSel, "Locatário"]);
                        setFiltroLast("Locatário");
                        str_path = "filtra_boleto_locat";
                        break;

                    case "Proprietário":
                        setFiltrosSel([...filtrosSel, "Proprietário"]);
                        setFiltroLast("Proprietário");
                        str_path = "filtra_boleto_prop";
                        break;

                    case "Locação":
                        setFiltrosSel([...filtrosSel, "Locação"]);
                        setFiltroLast("Locação");
                        str_path = "filtra_boleto_loc";
                        break;

                    case "Listar todas":
                        str_path = "mostra_boleto_todas";
                        break;

                    default:
                        str_path = "o_q_deseja";
                        break;
                }

                return str_path;
            },
        },
        //Filtra boletos por vencimento
        filtra_boleto_venc: {
            message: `Informe uma data no formato dd/mm/aaaa (Ex.: ${new Date().toLocaleDateString()}).`,
            function: (params: Params) => {
                let str_dataAux = params.userInput;
                str_dataAux = str_dataAux.substring(3, 6) + str_dataAux.substring(0, 3) + str_dataAux.substring(6, 10)
                let str_data = new Date(str_dataAux);
                if (!isNaN(str_data.getDate())) {
                    let boletos_aux: BoletoBancario[] = [];
                    boletos_aux = filterBoletosb.filter(x => x.dataVencimento.slice(0, 10).toString() == moment.utc(str_data).format("YYYY-MM-DD").toString());
                    setFilterBoletosb(boletos_aux);
                }
                else {
                    params.injectMessage("A data informada não válida.");
                }
            },
            path: () => {
                return "aguarda_refresh_boleto";
            },
        },
        //Filtrar boleto por valor
        filtra_boleto_val: {
            message: `Informe um valor no formato 123.00.`,
            function: (params: Params) => {
                let str_data = params.userInput;
                if (Number(str_data) > 0) {
                    let boletos_aux: BoletoBancario[] = [];
                    console.log(Number(str_data));
                    boletos_aux = filterBoletosb.filter(x => x.valor === Number(str_data));
                    console.log(boletos_aux);
                    setFilterBoletosb(boletos_aux);
                }
                else {
                    params.injectMessage("O Valor dever ser um número maior que ZERO.");
                }

            },
            path: () => {
                return "aguarda_refresh_boleto";
            },
        },
        //Filtra boleto por locatário
        filtra_boleto_locat: {
            message: "Qual o nome do locatário que deseja encontrar?",
            function: (params: Params) => {
                let str_data = params.userInput;
                if (str_data.length > 0) {
                    let boletos_aux: BoletoBancario[] = [];
                    boletos_aux = filterBoletosb.filter(x => x.boleto?.locatario?.pessoa?.nome.toLowerCase().includes(str_data.toLowerCase()));
                    setFilterBoletosb(boletos_aux);
                }
                else {
                    params.injectMessage("Favor informar ao menos uma letra.");
                }

            },
            path: () => {
                return "aguarda_refresh";
            },
        },
        solicita_boleto_detalhes: {
            options: ["Ver detalhes"],
            path: (params: Params) => {
                let str_path = "";
                switch (params.userInput) {
                    case "Ver detalhes":
                        navigate(ROUTE.BOLETO_BANCARIO + "/" + filterBoletosb[0].id);
                        str_path = "mostra_boleto_detalhes";
                }
                return str_path;
            }
        },
        aguarda_refresh_boleto: {
            message: "Estamos aplicando o filtro, aguarde...",
            transition: { duration: 3000 },
            path: "mostra_boleto",
        },

        solicita_num_boleto: {
            message: "Favor informar o número do boleto que deseja visualizar ou 0 - zero para retornar aos fitros.",
            function: (params: Params) => {
                let str_data = params.userInput;
                if (Number(str_data) > 0 &&
                    Number(str_data) <= filterBoletosb.length) {
                    let boletos_aux: BoletoBancario[] = [];
                    boletos_aux.push(filterBoletosb[Number(str_data) - 1]);
                    setFilterBoletosb(boletos_aux);
                }
                else {
                    if (params.userInput.toLowerCase().indexOf('não') > -1 ||
                        params.userInput.toLowerCase().indexOf('nao') > -1 ||
                        params.userInput.toLowerCase().indexOf('nenhum') > -1 ||
                        params.userInput.toLowerCase().indexOf('emitir') > -1 ||
                        params.userInput.toLowerCase() === "0" ||
                        params.userInput.toLowerCase().indexOf('cancelar') > -1 ||
                        params.userInput.toLowerCase().indexOf('geração') > -1 ||
                        params.userInput.toLowerCase().indexOf('geraçao') > -1
                    ) {
                        params.injectMessage("Um momento por favor.");
                    }
                    else {
                        params.injectMessage("O Valor informado dever estar entre 1 e " + (filterBoletosb.length).toString());
                    }
                }

            },
            path: (params: Params) => {
                if (params.userInput.toLowerCase() === "0") {
                    return "novo_filtro_boleto";
                }
                else {
                    return "aguarda_refresh_boleto";
                }
            },
        },

        //envia boleto ao banco
        envia_boleto_banco: {
            message: "Registrando boleto no banco...",
            transition: { duration: 1000 },
            path: "end",
        },

        //PREVISÕES COSULTAS
        //Consulta previsões
        consulta_previsao: {
            message: "Qual situação das previsões deseja consultar ?",
            component: () => {
                return (
                    <div className='rounded-md border-2 mt-2 m-2 p-2'>
                        <div className='grid grid-cols-12 m-2 font-[Poppins-bold]' >
                            <Label className='border-b pb-5 col-span-7' style={{ 'fontSize': '0.7rem' }}>Situação</Label>
                        </div>

                        <div>
                            {STATUS_BOLETO_OPTIONS.map((status, index) => (
                                <div key={index} className='grid grid-cols-12 m-2'>
                                    <Label className='flex items-center  col-span-7' style={{ 'fontSize': '0.7rem' }}>{(index + 1)} -
                                        {status.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            },
            path: async (params: Params) => {
                //setStatusLoc(params.userInput.toUpperCase() as LocacaoStatus);
                setFiltroLast("");
                if (Number(params.userInput) > 0 && Number(params.userInput) <= 5) {

                    //Consulta boletos previsões

                    let str_status = (params.userInput === "1" ? BoletoStatus.ATRASADO : params.userInput === "2" ? BoletoStatus.PAGO : params.userInput === "3" ? BoletoStatus.PENDENTE : params.userInput === "4" ? BoletoStatus.CONFIRMADO : BoletoStatus.CANCELADO);
                    //Consulta locações
                    console.log(str_status);
                    const data = await api.get<Boleto[]>('pagamentos/' + (glb_params.id_empresa ? Number(glb_params.id_empresa) : 0) + '/' + str_status);

                    const bb_aux = data?.data;

                    setFiltrosSel([]);
                    setFilterBoletosb([]);
                    if (bb_aux && bb_aux.length > 0) {
                        await params.injectMessage(`Foram encontradas ${bb_aux.length} previsões`);
                        setPrevisoes(bb_aux);
                        setFilterPrevisoes(bb_aux);
                        return "filtra_previsao_novo"
                    }
                    else {
                        await params.injectMessage(`Não foram encontradas previsões com o status ${str_status}.`);
                        setPrevisoes([]);
                        setFilterPrevisoes([]);
                        return "consulta_previsao";
                    }
                }
                else {
                    if (params.userInput.toLowerCase().indexOf('iniciar') > -1 ||
                        params.userInput.toLowerCase().indexOf('começar') > -1) {
                        await params.injectMessage(`Voltando ao início.`);
                        return "start";
                    }
                    else {
                        await params.injectMessage(`O valor informado não é válido. Deve ser um número entre 1 e 5.`);
                        return "consulta_previsao";

                    }
                }
            }
        },
        process_status_previsao: {
            message: async () => {

            }
        },

        mostra_previsao_novo: {
            message: () => {
                console.log(previsoes);
                if (filterPrevisoes.length > 6) {
                    return `Foram encontradas ${filterPrevisoes.length} previsões com esse filtro`
                }
                else {
                    if (filterPrevisoes.length === 1) {
                        return "Apenas uma previsão foi encontrada com esse filtro."
                    }
                    else {
                        return "Favor verificar se é um desses boletos, se sim basta informar o número da lista que proseguiremos."
                    }
                }
            },
            component: () => {
                return (
                    <div>
                        {(filterPrevisoes.length <= 10 ?
                            <div className='rounded-md border-2 mt-2 m-2 p-2'>
                                <div className='grid grid-cols-12 m-2 font-[Poppins-bold]' >
                                    <Label className='border-b pb-5 col-span-6' style={{ 'fontSize': '0.7rem' }}>Nome</Label>
                                    <Label className='border-b  pb-5  col-span-3' style={{ 'fontSize': '0.7rem' }}>Vencimento</Label>
                                    <Label className='border-b  pb-5  col-span-3' style={{ 'fontSize': '0.7rem' }}>Valor</Label>
                                </div>

                                <div>
                                    {filterPrevisoes.map((previsao, index) => (
                                        <div key={index} className='grid grid-cols-12 m-2'>
                                            <Label className='flex items-center  col-span-6' style={{ 'fontSize': '0.7rem' }}>{(index + 1)} -
                                                {previsao.locatario ? previsao.locatario.pessoa?.nome : 
                                                 previsao.imovel && previsao.imovel.proprietarios && previsao.imovel.proprietarios[0].pessoa ? previsao.imovel.proprietarios[0].pessoa.nome : "Sem proprietário"
                                                }
                                            </Label>
                                            <Label className='flex items-center  col-span-3' style={{ 'fontSize': '0.7rem' }}>{moment.utc(previsao.dataVencimento).format('DD/MM/YYYY')}</Label>
                                            <Label className='flex items-center  col-span-3' style={{ 'fontSize': '0.7rem' }}>{previsao.valorOriginal.toLocaleString()}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            :
                            <></>
                        )}
                    </div>
                );
            },
            transition: {
                duration: 1000,
            },
            path: () => {
                console.log(filterPrevisoes);
                if (filterPrevisoes.length === 1) {
                    return "solicita_previsao_detalhes";
                }
                else {
                    if (filterPrevisoes.length === 0) {
                        return "previsao_nao_encontrado";
                    }
                    else {
                        if (filterBoletosb.length > 10) {
                            return "filtra_previsao_novo";
                        }
                        else {
                            return "solicita_num_previsao_novo";
                        }
                    }
                }
            },
        },
        //Mostrar todas as previsões
        mostra_previsao_todas_novo: {
            component: () => {
                return (
                    <div>
                        {(filterPrevisoes.length <= 10 ?
                            <div className='rounded-md border-2 mt-2 m-2 p-2'>
                                <div className='grid grid-cols-12 m-2 font-[Poppins-bold]' >
                                    <Label className='border-b pb-5 col-span-6' style={{ 'fontSize': '0.7rem' }}>Nome</Label>
                                    <Label className='border-b  pb-5  col-span-3' style={{ 'fontSize': '0.7rem' }}>Vencimento</Label>
                                    <Label className='border-b  pb-5  col-span-3' style={{ 'fontSize': '0.7rem' }}>Valor</Label>
                                </div>

                                <div>
                                    {filterPrevisoes.map((previsao, index) => (
                                        <div key={index} className='grid grid-cols-12 m-2'>
                                            <Label className='flex items-center  col-span-6' style={{ 'fontSize': '0.7rem' }}>{(index + 1)} -
                                                {previsao.locatario ? previsao.locatario.pessoa?.nome : 
                                                 previsao.imovel && previsao.imovel.proprietarios && previsao.imovel.proprietarios[0].pessoa ? previsao.imovel.proprietarios[0].pessoa.nome : "Sem proprietário"
                                                }
                                            </Label>
                                            <Label className='flex items-center  col-span-3' style={{ 'fontSize': '0.7rem' }}>{moment.utc(previsao.dataVencimento).format('DD/MM/YYYY')}</Label>
                                            <Label className='flex items-center  col-span-3' style={{ 'fontSize': '0.7rem' }}>{previsao.valorOriginal.toLocaleString()}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            :
                            <></>
                        )}
                    </div>
                );
            },
            transition: {
                duration: 1000,
            },
            path: () => {
                console.log(filterPrevisoes);
                if (filterPrevisoes.length === 1) {
                    return "solicita_previsao_detalhes";
                }
                else {
                    if (filterPrevisoes.length === 0) {
                        return "previsao_nao_encontrado";
                    }
                    else {
                        return "solicita_num_previsao_novo";
                    }
                }
            },
        },
        //Quando não econtrar nenuma previsao
        previsao_nao_encontrado: {
            message: "Nenhuma previsão encontrada, deseja informar outro filtro ?",
            options: snOptions,
            path: (params: Params) => {
                setFiltrosSel(filtrosSel.filter(x => x !== filtroLast));
                setFiltroLast("");

                if (params.userInput === "Sim") {
                    return "filtra_previsao_novo";
                }
                else {
                    if (params.userInput === "Não") {
                        return "end";
                    }
                    else {
                        return "o_q_deseja";
                    }
                }
            }
        },
        novo_filtro_previsao_novo: {
            message: "Deseja informar um novo fitro ?",
            options: snOptions,
            path: (params: Params) => {
                if (params.userInput === "Sim") {
                    return "filtra_previsao_novo";
                }
                else {
                    return "end";
                }
            },
        },

        //filtrar as locações dentre as encontradas encontradas
        filtra_previsao_novo: {
            message: "Você teria algumas das informações abaixo, assim posso filtrar as previsões.\nClique no botão desejado para colocar a informação.",
            transition: { duration: 1000 },
            path: "mostra_filtros_previsao",
        },
        mostra_filtros_previsao: {
            options: () => {
                console.log(filterPrevisoes);
                return (filterPrevisoes.length < 20 ? [...filtroOptions.filter(x => !filtrosSel.includes(x)), "Listar todas"] : filtroOptions.filter(x => !filtrosSel.includes(x)));
            },
            path: (params: Params) => {
                let str_path = "";
                switch (params.userInput) {
                    case "Vencimento":
                        setFiltrosSel([...filtrosSel, "Vencimento"]);
                        setFiltroLast("Vencimento");
                        str_path = "filtra_previsao_venc_novo";
                        break;

                    case "Valor":
                        setFiltrosSel([...filtrosSel, "Valor"]);
                        setFiltroLast("Valor"); 
                        str_path = "filtra_previsao_val_novo";
                        break;

                    case "Locatário":
                        setFiltrosSel([...filtrosSel, "Locatário"]);
                        setFiltroLast("Locatário");
                        str_path = "filtra_previsao_locat_novo";
                        break;

                    case "Proprietário":
                        setFiltrosSel([...filtrosSel, "Proprietário"]);
                        setFiltroLast("Proprietário");
                        str_path = "filtra_previsao_prop_novo";
                        break;

                    case "Locação":
                        setFiltrosSel([...filtrosSel, "Locação"]);
                        setFiltroLast("Locação");
                        str_path = "filtra_previsao_loc_novo";
                        break;

                    case "Listar todas":
                        str_path = "mostra_previsao_todas_novo";
                        break;

                    default:
                        str_path = "o_q_deseja";
                        break;
                }

                return str_path;
            },
        },
        //Filtra boletos por vencimento
        filtra_previsao_venc_novo: {
            message: `Informe uma data no formato dd/mm/aaaa (Ex.: ${new Date().toLocaleDateString()}).`,
            function: (params: Params) => {
                let str_dataAux = params.userInput;
                str_dataAux = str_dataAux.substring(3, 6) + str_dataAux.substring(0, 3) + str_dataAux.substring(6, 10)
                let str_data = new Date(str_dataAux);
                if (!isNaN(str_data.getDate())) {
                    let previsoes_aux: Boleto[] = [];
                    previsoes_aux = filterPrevisoes.filter(x => x.dataVencimento.slice(0, 10).toString() == moment.utc(str_data).format("YYYY-MM-DD").toString());
                    setFilterPrevisoes(previsoes_aux);
                }
                else {
                    params.injectMessage("A data informada não válida.");
                }
            },
            path: () => {
                return "aguarda_refresh";
            },
        },
        //Filtrar previsao por valor
        filtra_previsao_val_novo: {
            message: `Informe um valor no formato 123.00.`,
            function: (params: Params) => {
                let str_data = params.userInput;
                if (Number(str_data) > 0) {
                    let previsoes_aux: Boleto[] = [];
                    previsoes_aux = filterPrevisoes.filter(x => x.valorOriginal === Number(str_data));
                    setFilterPrevisoes(previsoes_aux);
                }
                else {
                    params.injectMessage("O Valor dever ser um número maior que ZERO.");
                }

            },
            path: () => {
                return "aguarda_refresh";
            },
        },
        //Filtra previsão por locatário
        filtra_previsao_locat_novo: {
            message: "Qual o nome do locatário que deseja encontrar?",
            function: (params: Params) => {
                let str_data = params.userInput;
                if (str_data.length > 0) {
                    let previsoes_aux: Boleto[] = [];
                    previsoes_aux = filterPrevisoes.filter(x => x.locatario?.pessoa?.nome.toLowerCase().includes(str_data.toLowerCase()));
                    setFilterPrevisoes(previsoes_aux);
                }
                else {
                    params.injectMessage("Favor informar ao menos uma letra.");
                }

            },
            path: () => {
                return "aguarda_refresh";
            },
        },
        filtra_previsao_prop_novo: {
            message: "Qual o nome do proprietário que deseja encontrar?",
            function: (params: Params) => {
                let str_data = params.userInput;
                if (str_data.length > 0) {
                    let previsoes_aux: Boleto[] = [];
                    previsoes_aux = filterPrevisoes.filter(x => x.imovel && x.imovel.proprietarios && x.imovel.proprietarios.some(p => p.pessoa ? p.pessoa.nome.toLowerCase().includes(str_data.toLowerCase()) : false))
                    setFilterPrevisoes(previsoes_aux);
                }
                else {
                    params.injectMessage("Favor informar ao menos uma letra.");
                }

            },
            path: () => {
                return "aguarda_refresh";
            },
        },
        solicita_previsao_detalhes: {
            options: ["Ver detalhes"],
            path: (params: Params) => {
                let str_path = "";
                switch (params.userInput) {
                    case "Ver detalhes":
                        navigate(ROUTE.PAGAMENTOS_DETALHES + "/" + filterPrevisoes[0].id);
                        str_path = "mostra_previsao_detalhes";
                }
                return str_path;
            }
        },
        aguarda_refresh_previsao: {
            message: "Estamos aplicando o filtro, aguarde...",
            transition: { duration: 3000 },
            path: "mostra_previsao",
        },

        solicita_num_previsao_novo: {
            message: "Favor informar o número do boleto que deseja visualizar ou 0 - zero para retornar aos fitros.",
            function: (params: Params) => {
                let str_data = params.userInput;
                if (Number(str_data) > 0 &&
                    Number(str_data) <= filterPrevisoes.length) {
                    let previsoes_aux: Boleto[] = [];
                    previsoes_aux.push(filterPrevisoes[Number(str_data) - 1]);
                    setFilterPrevisoes(previsoes_aux);
                }
                else {
                    if (params.userInput.toLowerCase().indexOf('não') > -1 ||
                        params.userInput.toLowerCase().indexOf('nao') > -1 ||
                        params.userInput.toLowerCase().indexOf('nenhum') > -1 ||
                        params.userInput.toLowerCase().indexOf('emitir') > -1 ||
                        params.userInput.toLowerCase() === "0" ||
                        params.userInput.toLowerCase().indexOf('cancelar') > -1 ||
                        params.userInput.toLowerCase().indexOf('geração') > -1 ||
                        params.userInput.toLowerCase().indexOf('geraçao') > -1
                    ) {
                        params.injectMessage("Um momento por favor.");
                    }
                    else {
                        params.injectMessage("O Valor informado dever estar entre 1 e " + (filterPrevisoes.length).toString());
                    }
                }

            },
            path: (params: Params) => {
                if (params.userInput.toLowerCase() === "0") {
                    return "novo_filtro_previsao";
                }
                else {
                    return "aguarda_refresh_previsao";
                }
            },
        },


        //Outras palavras que o usuário pode informar e que não estão relacionadas a nenhum assunto específico da plataforma
        o_q_deseja: {
            message: (params: Params) => {
                let str_msg = params.userInput;
                //Emissão, geração
                if (str_msg.toLowerCase().indexOf('emitir') ||
                    str_msg.toLowerCase().indexOf('criar') ||
                    str_msg.toLowerCase().indexOf('gerar')) {

                    //Boleto , verificar se é boleto bancário mesmo ou apenas a previsão
                    if (str_msg.toLowerCase().indexOf('boleto') > -1 || str_msg.toLowerCase().indexOf('boletos') > -1) {
                        return "Você deseja gerar um novo boleto ou consulta um existente ?"
                    }
                    //Previsões
                    if (str_msg.toLowerCase().indexOf('previsão') > -1 || str_msg.toLowerCase().indexOf('previsões') > -1) {
                        return "Você deseja gerar uma nova previsão ou consultar uma existente ?"
                    }
                }
                //Previsões
                if (str_msg.toLowerCase().indexOf('previsão') > -1 || str_msg.toLowerCase().indexOf('previsões') > -1) {
                    return "Você deseja gerar uma nova previsão ou consultar uma existente ?"
                }

                //Boletos
                if (str_msg.toLowerCase().indexOf('boleto') > -1 || str_msg.toLowerCase().indexOf('boletos') > -1) {
                    return "Você deseja gerar uma novo boleto ou consultar um existente ?"
                }

                //Inicio
                if (str_msg.toLowerCase().indexOf('inicio') > -1 || str_msg.toLowerCase().indexOf('iniciar') > -1) {
                    return "Ok vemos reiniciando o processo, aguarde um instante."
                }

                return "Favor informar algo sobre sua pretensão. Palavras relacionada à assuntos da plataforma (Cadastros, previsões boletos, etc..)."
            },
            options: (params: Params) => {
                return (params.userInput === "Criar") ? criaOptions : [];
            },
            transition: { duration: 1000 },
            path: async (params: Params) => {
                if (params.userInput === "Criar") {
                    return "process_cria";
                }
                else {
                    if (params.userInput.toLowerCase().indexOf('inicio') > -1 || params.userInput.toLowerCase().indexOf('iniciar') > -1) {
                        return "start";
                    }
                    else {
                        return "process_consulta";
                    }
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
            message: "Obrigado por utilizar nosso assitente.\nAté a próxima!👋",
            options: ["Iniciar novamente"],
            chatDisabled: true,
            path: "start"
        },
    }

    return (
        <ChatBotProvider>
            <ChatBot settings={settings} flow={flow} styles={styles} />
            <BotaoReiniciar />
        </ChatBotProvider>
    );
};