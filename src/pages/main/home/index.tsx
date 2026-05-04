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
  console.log('path: ','locacoes/' + empresaId.toString() + "/" + diVencimento.toString());
  return await api.get<Locacao[]>('locacoes/' + empresaId.toString() + "/" + diVencimento.toString());
  //return await api.get<Locacao[]>('locacoes/' + empresaId.toString() + "/25");
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
  const [titulo, setTitulo] = useState<string>();
  const [chkArr, setChkArr] = useState<{ id: number, checked: boolean }[]>([]);

  //Consulta locações
  const { data: loc } = useQuery(
    useGetLocacoesQueryOptions(Number(glb_params.id_empresa), new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate())
  );
  const locacoes = loc?.data;
  console.log('Locações: ', locacoes);

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
      console.log('Processando locações para agrupamento...');
      let arr_chk: { id: number, checked: boolean }[] = [];
      let arr_agrupado: LocacaoGroup[] = [];
      let now = new Date();
      let hoje = now.getDate();
      let lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      console.log('Hoje: ', hoje);
      console.log('LastDay: ', lastDay);
      for (let i = hoje; i <= lastDay; i += 5) {
        if (i + 5 > lastDay) {
          if (i < lastDay) {
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
            arr_agrupado.push(locacoes.filter(locacao => locacao.diaVencimento >= i && locacao.diaVencimento <= lastDay)
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

      console.log('Agrupamento locações: ', arr_agrupado);
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
            { status: 'À vencer', qtde: 0, total: 0, boletos: [] as Boleto[] }));

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

  const dataLocacoes = {
    labels: dadosRec.map(item => 'Até dia ' + item.dia.toString()),
    datasets: [
      {
        label: 'aluguéis atrasados',
        data: dadosRec.map(item => item.total),
        backgroundColor: [
          '#6350f2',
          '#4267ed',
          '#42a0ed',
          '#42dced',
          '#42edb7',
          '#42ed7b',
          '#56ed42'
        ],
        //dataVisibility: [12, 2, 3, 5, 5],
      },
    ],
  };

  const dataReceber = {
    labels: dadosBol.map(item => item.status),
    datasets: [
      {
        label: 'Boletos à receber',
        data: dadosBol.map(item => item.total),
        backgroundColor: [
          '#e09353',
          '#e0bf53',
          '#d9e053',
          '#90e053',
          '#53e074',
          '#53e0cd',
          '#5372e0'
        ],
        //circumference: 180,
        //rotation:270,
        //offset: activeSegment === 0 ? 20 : 0, // Example for highlighting index 0
        //dataVisibility: dados.map(item => item.qtde),
      },
    ],
  };

  const optionsLocacoes: any = {
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
        const index = firstElement.index;

        // Retrieve label and value of the clicked element
        //const label = chart.data.labels[index];
        //const value = chart.data.datasets[datasetIndex].data[index];
        //setColorItem(chart.data.datasets[datasetIndex].backgroundColor[index]);
        setTitulo('Locações - ' + chart.data.labels[index]);
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

  const optionsBoletos: any = {
    plugins: {
      legend: {
        position: 'right', // Moves legend to the right side
        align: 'center',    // Vertically centers the list in the legend area
      },
      //events:['click'],
    },
    onClick: (event: any, activeElements: any, chart: any) => {
      if (activeElements.length > 0) {
        setOpenDetail(false);
        setOpenDetailBol(false);
        console.log(event);
        const firstElement = activeElements[0];
        const index = firstElement.index;
        // Retrieve label and value of the clicked element
        //const label = chart.data.labels[index];
        //const value = chart.data.datasets[datasetIndex].data[index];
        //setColorItem(chart.data.datasets[datasetIndex].backgroundColor[index]);
        //ssssetTitulo(chart.data.labels[index]);
        setTitulo('Boletos - ' + chart.data.labels[index]);
        //Mostrar detalhes dos aluguéis à receber para o período correspondente
        setDetailBol(dadosBol[index].boletos);
        setOpenDetailBol(true);
        chart.render();
        chart.draw();
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

  const chartCenterLabel = {
    id: 'chartCenterLabel',
    //afterDraw(chart:any, args:any, plugins:any) {
    beforeDatasetsDraw(chart: any) {
      const { ctx, data } = chart;
      if (chart.getDatasetMeta(0).data.length > 0) {
        const centerX = chart.getDatasetMeta(0).data[0].x;
        const centerY = chart.getDatasetMeta(0).data[0].y;

        //Text
        ctx.save();
        ctx.font = 'bold 10px Poppins-Bold';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(usdFormatter.format(data.datasets[0].data.reduce((a: any, b: any) => a + b, 0)), centerX, centerY);
        //ctx.fillText(`Teste `, centerX, centerY);
        //console.log(`${data.labels[activeSegment]} ${data.datasets[0].data[activeSegment]} `);
      }
    }
  };

  const chartCenterLabelLocacao = {
    id: 'chartCenterLabel',
    //afterDraw(chart:any, args:any, plugins:any) {
    beforeDatasetsDraw(chart: any) {
      const { ctx, data } = chart;
      if (chart.getDatasetMeta(0).data.length > 0) {
        const centerX = chart.getDatasetMeta(0).data[0].x;
        const centerY = chart.getDatasetMeta(0).data[0].y;

        //Text
        ctx.save();
        ctx.font = 'bold 10px Poppins-Bold';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(usdFormatter.format(data.datasets[0].data.reduce((a: any, b: any) => a + b, 0)), centerX, centerY);
        //ctx.fillText(`Teste `, centerX, centerY);
        //console.log(`${data.labels[activeSegment]} ${data.datasets[0].data[activeSegment]} `);
      }
    }
  };

  /*const config = {
    type: 'doughnut',
    dataBoletos,
    optionsBoletos,
  };

  const myChart = new Chart(
    document.getElementById('myChart'),
    config
  );*/
  return (
    <div>
      <div className='grid grid-cols-2 mt-5 gap-4 p-5'>
        <div>
          <Label className='flex justify-center font-[Poppins-bold]'>Locações à Vencer</Label>
          <div className='border-2 rounded-lg mt-2'>
            <div className='pl-5 w-80'>
              <Doughnut data={dataLocacoes} options={optionsLocacoes} plugins={[chartCenterLabelLocacao]} />
            </div>
          </div>
        </div>
        <div>
          <Label className='flex justify-center font-[Poppins-bold]'>Boletos à Receber</Label>
          <div className='border-2 rounded-lg mt-2 '>
            <div className='pl-5  w-80'>
              <Doughnut data={dataReceber} options={optionsBoletos} plugins={[chartCenterLabel]} />
              {/*<canvas id="myChart"></canvas>*/}
            </div>
          </div>
        </div>

        {openDetail && (
          <div className='col-span-2'>

            <div className='flex items-center justify-between mr-2 h-7'>
              <Label className='ml-2' style={{ 'fontSize': '1rem' }}>{titulo}</Label>
              <div className='ml-2 mb-2  hover:cursor-pointer hover:text-blue-500 flex items-center justify-between gap-2'>
                <div className='grid grid-cols-2'>
                  {((isAdmin ||
                    user?.permissions.includes("ALL") ||
                    user?.permissions.includes("CREATE_PAGAMENTO"))) &&
                    (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button className='hover:cursor-pointer hover:text-blue-500 h-7' variant="ghost" size="icon"
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
            <div className={'rounded-md border-2 mt-2 m-2 p-2'}>
              <div className='grid grid-cols-12 m-2 font-[Poppins-bold]' >
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
            <div className='flex justify-between mr-2 mt-2 mb-2 gap-2 items-center'>
              <Label className='ml-2 font-[Poppins-bold]' style={{ 'fontSize': '0.8rem' }}>Total :</Label>
              <Label className='ml-2 font-[Poppins-bold]' style={{ 'fontSize': '0.8rem' }}>
                {usdFormatter.format(detail.reduce((acc, locacao) => acc + locacao.valorAluguel + (locacao.lancamentos ? locacao.lancamentos.reduce((accLanc, lancamento) => accLanc + lancamento.valorLancamento, 0) : 0), 0))}
              </Label>
            </div>
          </div>
        )}

        {openDetailBol && (
          <div className=' mt-5 col-span-2'>

            <Label className='ml-2' style={{ 'fontSize': '1rem' }}>{titulo}</Label>
            <div className={'rounded-md mt-2 m-2 p-2'}>
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
            <div className='flex justify-between mr-2 mt-2 mb-2 gap-2 items-center'>
              <Label className='ml-2 font-[Poppins-bold]' style={{ 'fontSize': '1rem' }}>Total :</Label>
              <Label className='ml-2 font-[Poppins-bold]' style={{ 'fontSize': '1rem' }}>
                {usdFormatter.format(detailBol.reduce((acc, boleto) => acc + boleto.valorOriginal, 0))}
              </Label>
            </div>
          </div>
        )}
      </div>
    </div>)
}

