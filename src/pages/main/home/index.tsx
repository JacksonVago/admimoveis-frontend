import { Label } from '@/components/ui/label';
import { useGlobalParams } from '@/globals/GlobalParams';
import { Locacao } from '@/interfaces/locacao';
import api from '@/services/axios/api';
import { usdFormatter } from '@/utils/format-money';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useEffect, useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { Boleto } from '@/interfaces/boleto';
import { BoletoStatus } from '@/enums/locacao/enums-locacao';
import moment from 'moment';

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

  const isMobile = useMediaQuery({ query: '(max-width: 420px)' })
  const glb_params = useGlobalParams();
  const [dadosRec, setDadosRec] = useState<LocacaoGroup[]>([]);
  const [dadosBol, setDadosBol] = useState<BoletoGroup[]>([]);
  const [detail, setDetail] = useState<Locacao[]>([]);
  const [openDetail, setOpenDetail] = useState<boolean>(false);
  const [openDetailBol, setOpenDetailBol] = useState<boolean>(false);
  const [detailBol, setDetailBol] = useState<Boleto[]>([]);
  const [colorItem, setColorItem] = useState<string>();

  //Consulta locações
  const { data: loc } = useQuery(
    useGetLocacoesQueryOptions(Number(glb_params.id_empresa), new Date().getDate())
  );
  const locacoes = loc?.data;

  //Consulta boletos
  const { data: dataBoletos } = useQuery(
    useGetBoletosQueryOptions(glb_params.id_empresa ? Number(glb_params.id_empresa) : 0, BoletoStatus.PENDENTE)
  )

  const boletos = dataBoletos?.data;



  useEffect(() => {
    glb_params.updTitle_form('DASHBOARD');
    glb_params.updPastaOrig("");

    if (locacoes) {

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
            return acc;
          }, { dia: i + 5, qtde: 0, total: 0, locacoes: [] as Locacao[] }));
        }
      }

      setDadosRec(arr_agrupado);

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

  }, []);

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
        console.log('Boletos: ',dadosBol[index].boletos);
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
          <div className=' mt-5 col-span-2'>

            <Label className='ml-2' style={{ 'fontSize': '1rem' }}> Locações </Label>
            <div className={'rounded-md border-' + colorItem + '-500 border-2 mt-2 m-2 p-2 text-' + colorItem + '-500'}>
              <div className='grid grid-cols-4 m-2 font-[Poppins-bold] gap-4' >
                <Label className={!isMobile ? 'border-b pb-5 col-span-2' : 'border-b pb-5'} style={{ 'fontSize': '0.7rem' }}>Descrição</Label>
                <Label className='border-b  pb-5' style={{ 'fontSize': '0.7rem' }}>Vencimento</Label>
                <Label className='flex justify-end border-b pb-5' style={{ 'fontSize': '0.7rem' }}>Valor</Label>
              </div>

              <div className='grid grid-cols-4 m-2 gap-4' >
                {detail.map((locacao) => (
                  <>
                    <Label className={!isMobile ? 'flex items-center mb-1  col-span-2' : 'flex items-center mb-1'} style={{ 'fontSize': '0.7rem' }}>
                      {locacao.locatarios ? locacao.locatarios[0].pessoa?.nome + ' - ' +
                        locacao.imovel?.endereco.complemento + ' - ' + locacao.imovel?.condominio.name : ''}
                    </Label>
                    <Label className='flex items-center' style={{ 'fontSize': '0.7rem' }}>{locacao.diaVencimento}</Label>
                    <Label className='flex justify-end items-center' style={{ 'fontSize': '0.7rem' }}>{usdFormatter.format(locacao.valorAluguel)}</Label>
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
                    <Label className='flex items-center' style={{ 'fontSize': '0.7rem' }}>{moment(boleto.dataVencimento).format('DD/MM/YYYY')}</Label>
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
