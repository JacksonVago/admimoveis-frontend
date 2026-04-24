import { Label } from '@/components/ui/label';
import { useGlobalParams } from '@/globals/GlobalParams';
import { Locacao } from '@/interfaces/locacao';
import api from '@/services/axios/api';
import { usdFormatter } from '@/utils/format-money';
import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useEffect, useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Boleto } from '@/interfaces/boleto';
import { BoletoStatus } from '@/enums/locacao/enums-locacao';
import moment from 'moment';
import { Barcode } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/auth/use-auth';
import { queryClient } from '@/services/react-query/query-client';
import { toast } from '@/hooks/use-toast';

ChartJS.register(ArcElement, Tooltip, Legend);

interface BoletoGroup {
  status: string;
  qtde: number;
  total: number;
  boletos: Boleto[];
};

interface LocacaoGroup {
  dia: number;
  qtde: number;
  total: number;
  locacoes: Locacao[];
};

// API & Query Logic
export const getBoletos = async (empresaId: number, status: BoletoStatus) => {
  return await api.get<Boleto[]>('pagamentos/' + empresaId.toString() + '/' + status);
}

export const useGetBoletosQueryOptions = (empresaId: number, status: BoletoStatus, {
  ...queryKeys
} = {}) => {
  return queryOptions({
    queryKey: ['boletos', empresaId, status, queryKeys],
    queryFn: () => getBoletos(empresaId, status)
  })
}

export const getLocacoes = async (empresaId: number, diVencimento: number) => {
  return await api.get<Locacao[]>('locacoes/' + empresaId.toString() + "/" + diVencimento.toString());
}

export const useGetLocacoesQueryOptions = (empresaId: number, diVencimento: number) => {
  return queryOptions({
    queryKey: ['locacoes', empresaId, diVencimento],
    queryFn: () => getLocacoes(empresaId, diVencimento)
  })
}


export const Home = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isMobile = useMediaQuery({ query: '(max-width: 420px)' })
  const glb_params = useGlobalParams();
  const [dadosRec, setDadosRec] = useState<LocacaoGroup[]>([]);
  const [dadosBol, setDadosBol] = useState<BoletoGroup[]>([]);
  const [detail, setDetail] = useState<Locacao[]>([]);
  const [openDetail, setOpenDetail] = useState<boolean>(false);
  const [openDetailBol, setOpenDetailBol] = useState<boolean>(false);
  const [detailBol, setDetailBol] = useState<Boleto[]>([]);
  const [colorItem, setColorItem] = useState<string>();
  const [chkArr, setChkArr] = useState<{ id: number, checked: boolean }[]>([]);

  //Consulta locações
  const { data: loc } = useQuery(
    useGetLocacoesQueryOptions(Number(glb_params.id_empresa), new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate())
  );
  const locacoes = loc?.data;

  //Consulta boletos
  const { data: dataBoletos } = useQuery(
    useGetBoletosQueryOptions(glb_params.id_empresa ? Number(glb_params.id_empresa) : 0, BoletoStatus.PENDENTE)
  )

  const boletos = dataBoletos?.data;

  const gerarBoleto = useMutation({
    mutationFn: async (locacao: Locacao) => {
      return await api.post('/lancamentos/gerar-boleto', locacao)
    },
    onSuccess: () => {
      ['lancamentos'].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      });
    }
  });

  useEffect(() => {
    glb_params.updTitle_form('DASHBOARD');
    glb_params.updPastaOrig("");

    if (locacoes) {

      let arr_chk: { id: number, checked: boolean }[] = [];
      let arr_agrupado: LocacaoGroup[] = [];
      let now = new Date();
      let hoje = now.getDate();
      let lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

      for (let i = hoje; i <= lastDay; i += 5) {
        if (i + 5 > lastDay) {
          arr_agrupado.push(locacoes.filter(locacao => locacao.diaVencimento > i && locacao.diaVencimento <= lastDay)
            .reduce(
              (acc: LocacaoGroup, locacao) => {
                acc.qtde += 1;
                acc.total += locacao.valorAluguel;
                acc.locacoes.push(locacao);
                arr_chk.push({ id: locacao.id, checked: false });
                return acc;
              },
              { dia: lastDay, qtde: 0, total: 0, locacoes: [] as Locacao[] }));
        }
        else {
          arr_agrupado.push(locacoes.filter(locacao => locacao.diaVencimento > i && locacao.diaVencimento <= i + 5)
            .reduce((acc: LocacaoGroup, locacao) => {
              acc.qtde += 1;
              acc.total += locacao.valorAluguel;
              acc.locacoes.push(locacao);
              arr_chk.push({ id: locacao.id, checked: false });
              return acc;
            }, { dia: i + 5, qtde: 0, total: 0, locacoes: [] as Locacao[] }));
        }
      }

      setDadosRec(arr_agrupado);
      setChkArr(arr_chk);

      //Dados boletos
      if (boletos) {
        let arr_agrupado_boletos: BoletoGroup[] = [];

        arr_agrupado_boletos.push(boletos.filter(boleto => new Date(boleto.dataVencimento) >= now)
          .reduce(
            (acc: BoletoGroup, boleto) => {
              acc.qtde += 1;
              acc.total += boleto.valorOriginal;
              acc.boletos.push(boleto);
              return acc;
            },
            { status: 'Pendente', qtde: 0, total: 0, boletos: [] as Boleto[] }));

        arr_agrupado_boletos.push(boletos.filter(boleto => new Date(boleto.dataVencimento) < now).reduce((acc: BoletoGroup, boleto) => {
          acc.qtde += 1;
          acc.total += boleto.valorOriginal;
          acc.boletos.push(boleto);
          return acc;
        }, { status: 'Atrasado', qtde: 0, total: 0, boletos: [] as Boleto[] }));

        setDadosBol(arr_agrupado_boletos);
      }
    }

  }, [locacoes, boletos]);

  /*const data = {
    labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
    datasets: [
      {
        label: '# of Votes',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };*/

  const data = {
    labels: dadosRec.map(item => 'Até dia ' + item.dia.toString()),
    datasets: [
      {
        label: 'aluguéis atrasados',
        data: dadosRec.map(item => item.total),
        backgroundColor: [
          'purple',
          'indigo',
          'blue',
          'red',
          'green',
        ],
        //dataVisibility: [12, 2, 3, 5, 5],
      },
    ],
  };

  const dataAtrasado = {
    labels: dadosBol.map(item => item.status),
    datasets: [
      {
        label: 'Boletos pendentes',
        data: dadosBol.map(item => item.total),
        backgroundColor: [
          '#e09353',
          '#d16b3f',
          '#bf4434',
          '#ba2d2d',
          '#ba2d6f',
        ],
        //dataVisibility: dados.map(item => item.qtde),
      },
    ],
  };

  const optionsReceber: any = {
    plugins: {
      legend: {
        position: 'right', // Moves legend to the right side
        align: 'center',    // Vertically centers the list in the legend area
      },
    },
    onClick: (event: any, activeElements: any, chart: any) => {
      if (activeElements.length > 0) {
        setOpenDetailBol(false);
        setOpenDetail(true);
        console.log(event);
        const firstElement = activeElements[0];
        const datasetIndex = firstElement.datasetIndex;
        const index = firstElement.index;

        // Retrieve label and value of the clicked element
        //const label = chart.data.labels[index];
        //const value = chart.data.datasets[datasetIndex].data[index];
        setColorItem(chart.data.datasets[datasetIndex].backgroundColor[index]);

        //Mostrar detalhes dos aluguéis à receber para o período correspondente                
        setDetail(dadosRec[index].locacoes);
        setOpenDetail(true);
      }
    },
    onHover: (event: any, activeElements: any) => {
      if (activeElements?.length > 0) {
        // Change to pointer when hovering over an element
        event.native.target.style.cursor = 'pointer';
      } else {
        // Revert to default when not over an element
        event.native.target.style.cursor = 'default';
      }
    }
  }

  const optionsPagamentos: any = {
    plugins: {
      legend: {
        position: 'right', // Moves legend to the right side
        align: 'center',    // Vertically centers the list in the legend area
      },
    },
    onClick: (event: any, activeElements: any, chart: any) => {
      if (activeElements.length > 0) {
        setOpenDetail(false);
        setOpenDetailBol(false);
        console.log(event);
        const firstElement = activeElements[0];
        const datasetIndex = firstElement.datasetIndex;
        const index = firstElement.index;

        // Retrieve label and value of the clicked element
        //const label = chart.data.labels[index];
        //const value = chart.data.datasets[datasetIndex].data[index];
        setColorItem(chart.data.datasets[datasetIndex].backgroundColor[index]);

        //Mostrar detalhes dos aluguéis à receber para o período correspondente
        console.log('Boletos: ', dadosBol[index].boletos);
        setDetailBol(dadosBol[index].boletos);
        setOpenDetailBol(true);
      }
    },
    onHover: (event: any, activeElements: any) => {
      if (activeElements?.length > 0) {
        // Change to pointer when hovering over an element
        event.native.target.style.cursor = 'pointer';
      } else {
        // Revert to default when not over an element
        event.native.target.style.cursor = 'default';
      }
    }
  }


  const handleCheckAllboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let arr_chk: { id: number, checked: boolean }[] = [];

    if (e.target.checked) {

      chkArr.forEach(item => {
        arr_chk.push({ id: item.id, checked: true });
      });
      setChkArr(arr_chk);
    }
    else {
      chkArr.forEach(item => {
        arr_chk.push({ id: item.id, checked: false });
      });
      setChkArr(arr_chk);
    }
    setChkArr(arr_chk);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let arr_chk: { id: number, checked: boolean }[] = [];

    chkArr.forEach(item => {
      if (item.id === Number(e.target.id.replace('chk_', ''))) {
        arr_chk.push({ id: item.id, checked: e.target.checked });
      }
      else {
        arr_chk.push({ id: item.id, checked: item.checked });
      }
    });

    setChkArr(arr_chk);
  };

  const handleGerarBoleto = async () => {
    try {
      let int_cont = 0;
      chkArr.forEach(item => {
        if (item.checked) {
          const locacao = detail.find(loc => loc.id === item.id);
          if (locacao) {
            gerarBoleto.mutateAsync(locacao);
            int_cont++;
          }
        }
      });

      if (int_cont > 0) {
        toast({
          title: 'Geração de Boleto',
          description: `Boleto(s) gerado(s) com sucesso`
        });
      }

    } catch (error) {
      toast({ title: 'Erro ao gerar boleto.', variant: 'destructive' });
    }
  };

  return (
    <div>
      <div className='grid grid-cols-2 mt-5 gap-4 p-5'>
        <div>
          <Label className='flex justify-center font-[Poppins-bold]'>Próximos Recebimentos</Label>
          <div className='border-2 rounded-lg mt-2'>
            <div className='mt-5 p-5 w-80'>
              <Doughnut data={data} options={optionsReceber} />
            </div>
          </div>
        </div>
        <div>
          <Label className='flex justify-center font-[Poppins-bold]'>Pagamentos</Label>
          <div className='border-2 rounded-lg mt-2 '>
            <div className='mt-5 p-5  w-80'>
              <Doughnut data={dataAtrasado} options={optionsPagamentos} />
            </div>
          </div>
        </div>

        {openDetail && (
          <div className='mt-2 col-span-2'>

            <div className='flex items-center justify-between mr-2'>
              <Label className='ml-2' style={{ 'fontSize': '1rem' }}> Locações </Label>
              <div className='ml-2 mb-2  hover:cursor-pointer hover:text-blue-500 flex items-center justify-between gap-2'>
                <div className='grid grid-cols-2 gap-10'>
                  {((isAdmin ||
                    user?.permissions.includes("ALL") ||
                    user?.permissions.includes("CREATE_PAGAMENTO"))) &&
                    (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button className='hover:cursor-pointer hover:text-blue-500' variant="ghost" size="icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                //setSelectedTipo(tipo)
                              }
                              }
                            >
                              <div className='flex items-center gap-2 hover:cursor-pointer hover:text-blue-500' >
                                <Barcode size={20} />
                                <Label className='hover:cursor-pointer hover:text-blue-500'> Gerar Boletos </Label>
                              </div>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                'Isso irá confirmar os lançamentos para geração do boleto.'
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleGerarBoleto()}>
                                'Sim, confirmar boleto.'
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                </div>
              </div>
            </div>
            <div className={'rounded-md border-' + colorItem + '-500 border-2 mt-2 m-2 p-2 text-' + colorItem + '-500'}>
              <div className='grid grid-cols-12 m-2 font-[Poppins-bold] gap-4' >
                <input type="checkbox" className='w-4 h-4' onChange={(e) => handleCheckAllboxChange(e)}></input>
                <Label className={!isMobile ? 'border-b pb-5 col-span-5' : 'border-b pb-5 col-span-5'} style={{ 'fontSize': '0.7rem' }}>Destinatário</Label>
                <Label className='border-b  pb-5  col-span-2' style={{ 'fontSize': '0.7rem' }}>Descrição</Label>
                <Label className='border-b  pb-5  col-span-2' style={{ 'fontSize': '0.7rem' }}>Vencimento</Label>
                <Label className='flex justify-end border-b pb-5  col-span-2' style={{ 'fontSize': '0.7rem' }}>Valor</Label>
              </div>

              <div className='grid grid-cols-12 m-2' >
                {detail.map((locacao) => (
                  <>
                    <input id={`chk_${locacao.id}`} type="checkbox" checked={chkArr.some(item => item.id === locacao.id && item.checked)} onChange={(e) => handleCheckboxChange(e)} className='w-4 h-4'></input>
                    <Label className={!isMobile ? 'flex items-center mb-1  col-span-5' : 'flex items-center mb-1 col-span-5'} style={{ 'fontSize': '0.7rem' }}>
                      {locacao.locatarios ? locacao.locatarios[0].pessoa?.nome + ' - ' +
                        locacao.imovel?.endereco.complemento + ' - ' + locacao.imovel?.condominio.name : ''}
                    </Label>
                    <Label className={!isMobile ? 'flex items-center col-span-2' : 'flex items-center col-span-2'} style={{ 'fontSize': '0.7rem' }}>
                      Aluguel
                    </Label>
                    <Label className='flex items-center  col-span-2' style={{ 'fontSize': '0.7rem' }}>{locacao.diaVencimento}</Label>
                    <Label className='flex justify-end items-center  col-span-2' style={{ 'fontSize': '0.7rem' }}>{usdFormatter.format(locacao.valorAluguel)}</Label>
                    {locacao.lancamentos ? locacao.lancamentos.map(lancamento => (
                      <>
                        <div className='col-span-1'></div>
                        <Label className={!isMobile ? 'flex items-center col-span-5' : 'flex items-center col-span-5'} style={{ 'fontSize': '0.7rem' }}>
                        </Label>
                        <Label className={!isMobile ? 'flex items-center col-span-2' : 'flex items-center col-span-2'} style={{ 'fontSize': '0.7rem' }}>
                          {lancamento.lancamentotipo.name}
                        </Label>
                        <Label className='flex items-center  col-span-2' style={{ 'fontSize': '0.7rem' }}>{locacao.diaVencimento}</Label>
                        <Label className='flex justify-end items-center  col-span-2' style={{ 'fontSize': '0.7rem' }}>{usdFormatter.format(lancamento.valorLancamento)}</Label>
                      </>
                    )) : <></>}
                    <div className='col-span-1 mt-2 mb-2'></div>
                    <Label className={!isMobile ? 'flex items-center col-span-5 mt-2 mb-2' : 'flex items-center col-span-5 mt-2 mb-2'} style={{ 'fontSize': '0.7rem' }}>
                    </Label>
                    <Label className={!isMobile ? 'flex items-center col-span-2 font-bold mt-2 mb-2 border-b' : 'flex items-center font-bold col-span-2 mb-2 mt-2 border-b'} style={{ 'fontSize': '0.7rem' }}>
                      Total
                    </Label>
                    <Label className='flex items-center  col-span-2 mt-2 mb-2 border-b' style={{ 'fontSize': '0.7rem' }}></Label>
                    <Label className='flex justify-end items-center font-bold col-span-2 mt-2 mb-2 border-b' style={{ 'fontSize': '0.7rem' }}>
                      {usdFormatter.format(locacao.valorAluguel + (locacao.lancamentos ? locacao.lancamentos.reduce((acc, lancamento) => acc + lancamento.valorLancamento, 0) : 0))}
                    </Label>
                  </>
                ))}
              </div>
            </div>
          </div>
        )}

        {openDetailBol && (
          <div className=' mt-5 col-span-2'>

            <Label className='ml-2' style={{ 'fontSize': '1rem' }}> Pagamentos </Label>
            <div className={'rounded-md border-' + colorItem + '-500 border-2 mt-2 m-2 p-2 text-' + colorItem + '-500'}>
              <div className='grid grid-cols-4 m-2 font-[Poppins-bold] gap-4' >
                <Label className={!isMobile ? 'border-b pb-5 col-span-2' : 'border-b pb-5'} style={{ 'fontSize': '0.7rem' }}>Favorecido</Label>
                <Label className='border-b  pb-5' style={{ 'fontSize': '0.7rem' }}>Vencimento</Label>
                <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Valor</Label>
              </div>

              <div className='grid grid-cols-4 m-2 gap-4' >
                {detailBol.map((boleto) => (
                  <>
                    <Label className={!isMobile ? 'flex items-center mb-1  col-span-2' : 'flex items-center mb-1'} style={{ 'fontSize': '0.7rem' }}>
                      {(boleto.locatario ? boleto.locatario.pessoa?.nome : '') + ' - ' +
                        (boleto.locacao ? boleto.locacao?.imovel?.endereco.complemento + ' - ' + boleto.locacao?.imovel?.condominio.name : '')}
                    </Label>
                    <Label className='flex items-center' style={{ 'fontSize': '0.7rem' }}>{moment.utc(boleto.dataVencimento).format('DD/MM/YYYY')}</Label>
                    <Label className='flex justify-end items-center' style={{ 'fontSize': '0.7rem' }}>{usdFormatter.format(boleto.valorOriginal)}</Label>
                  </>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>)
}
