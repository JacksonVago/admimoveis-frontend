import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import api from '@/services/axios/api'
import { queryClient } from '@/services/react-query/query-client'
import { transformNullToUndefined } from '@/utils/transform-null-to-undefined'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Edit } from 'lucide-react'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { PessoaStatus } from '@/enums/pessoal/status-pesoa'
import { useGlobalParams } from '@/globals/GlobalParams';
import { Empresa } from '@/interfaces/empresa'
import { empresaSchema, EmpresaSchema } from '@/schemas/empresa.schema'
import { EmpresaFormContent, EmpresaFormRoot } from '../components/empresa-form'
import axios from 'axios'

export const DetalhesEmpresaForm = () => {


  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = React.useState(false)
  const disabled = isEditingPersonalInfo

  //const navigate = useNavigate();
  const dataParams = useParams<{ id: string }>();
  const id = dataParams.id ? parseInt(dataParams.id) : undefined;
  //const params = useParams();

  //Globals
  const glb_params = useGlobalParams();

  const { data: empresa } = useQuery({
    queryKey: ['empresa', (glb_params.id_empresa ? glb_params.id_empresa : 0)],
    queryFn: async () => {
      try {
        const data = await api.get<Empresa>(`/empresas/${glb_params.id_empresa ? glb_params.id_empresa : 0}`)
        //console.log(data.data.id ? data.data.id.toString() : 'test');
        glb_params.updId_empresa(data.data.id ? data.data.id.toString() : '0')
        return data.data;
      }
      catch (error) {
        if (axios.isAxiosError(error)) {
          // Check if there's a response and data within the error
          if (error.response && error.response.data) {
            console.error('Error message from server:', error.response.data);
            toast({
              title: 'Erro ao atualizar as configurações',
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
            description: error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar as configurações. Tente novamente.',
            variant: 'destructive'
          })
        }
      }
    }
  })


  const createEmpresa = useMutation({
    mutationFn: async (data: FormData) => {

      return await api.post<Empresa>(`/empresas`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      ;['empresa'].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
    }
  })

  const updateEmpresa = useMutation({
    mutationFn: async (data: FormData) => {
      return await api.put<Empresa>(`/empresas/${glb_params.id_empresa}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      ;['empresa', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
    }
  })

  const onSubmitEmpresaData = async (data: EmpresaSchema) => {

    try {
      const form = new FormData()

      console.log(id);
      if (data?.nome) {
        form.append('nome', data.nome)
      }

      if (data?.cnpj) {
        form.append('cnpj', data.cnpj)
      }

      if (data?.email) {
        form.append('email', data.email)
      }

      if (data?.telefone) {
        form.append('telefone', data.telefone)
      }

      if (data?.logradouro) {
        form.append('logradouro', data.logradouro)
      }

      if (data?.numero) {
        form.append('numero', data.numero.toString())
      }

      if (data?.complemento) {
        form.append('complemento', data.complemento)
      }

      if (data?.bairro) {
        form.append('bairro', data.bairro)
      }

      if (data?.cidade) {
        form.append('cidade', data.cidade)
      }

      if (data?.cep) {
        form.append('cep', data.cep)
      }

      if (data?.estado) {
        form.append('estado', data.estado)
      }

      if (data?.status) {
        form.append('status', data.status)
      }
      else {
        form.append('status', PessoaStatus.ATIVA)
      }

      console.log(data?.avisosReajusteLocacao);
      if (data?.avisosReajusteLocacao) {
        form.append('avisosReajusteLocacao', data.avisosReajusteLocacao.toString())
      }

      if (data?.avisosRenovacaoContrato) {
        form.append('avisosRenovacaoContrato', data.avisosRenovacaoContrato.toString())
      }

      if (data?.avisosSeguroFianca) {
        form.append('avisosSeguroFianca', data.avisosSeguroFianca.toString())
      }

      if (data?.avisosSeguroIncendio) {
        form.append('avisosSeguroIncendio', data.avisosSeguroIncendio.toString())
      }

      if (data?.avisosTituloCapitalizacao) {
        form.append('avisosTituloCapitalizacao', data.avisosTituloCapitalizacao.toString())
      }

      if (data?.avisosDepositoCalcao) {
        form.append('avisosDepositoCalcao', data.avisosDepositoCalcao.toString())
      }

      if (data?.porcentagemComissao) {
        form.append('porcentagemComissao', data.porcentagemComissao.toString())
      }

      if (data?.emiteBoleto) {
        form.append('emiteBoleto', data.emiteBoleto.toString())
      }

      if (data?.valorTaxaBoleto) {
        form.append('valorTaxaBoleto', data.valorTaxaBoleto.toString())
      }

      if (data?.emissaoBoletoAntecedencia) {
        form.append('emissaoBoletoAntecedencia', data.emissaoBoletoAntecedencia.toString())
      }

      if (data?.porcentagemMultaAtraso) {
        form.append('porcentagemMultaAtraso', data.porcentagemMultaAtraso.toString())
      }

      if (data?.porcentagemJurosAtraso) {
        form.append('porcentagemJurosAtraso', data.porcentagemJurosAtraso.toString())
      }
      if (data?.tipoId) {
        form.append('tipoId', data.tipoId.toString());
      }


      if (glb_params.id_empresa !== undefined && Number(glb_params.id_empresa) > 0) {
        await updateEmpresa.mutateAsync(form)
      }
      else {

        const dataObject = Object.fromEntries(form.entries());
        const jsonData = JSON.stringify(dataObject);
        console.log(jsonData);

        await createEmpresa.mutateAsync(form)
      }

      toast({
        title: 'Configurações atualizado com sucesso',
        description: `Configurações atualizado com sucesso`

      });
      setIsEditingPersonalInfo(!isEditingPersonalInfo);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Check if there's a response and data within the error
        if (error.response && error.response.data) {
          console.error('Error message from server:', error.response.data);
          toast({
            title: 'Erro ao atualizar as configurações',
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
          description: error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar as configurações. Tente novamente.',
          variant: 'destructive'
        })
      }
    }
  }

  //default values
  const enderecoData = transformNullToUndefined(empresa?.endereco || {})
  const defaultValues = React.useMemo(
    () => ({
      ...transformNullToUndefined(empresa || {}),
      logradouro: enderecoData?.logradouro,
      numero: enderecoData?.numero ? parseInt(enderecoData.numero) : undefined,
      complemento: enderecoData?.complemento,
      bairro: enderecoData?.bairro,
      cidade: enderecoData?.cidade,
      cep: enderecoData?.cep,
      estado: enderecoData?.estado,
      tipoId : empresa?.tipoLancamento,
    }),
    [empresa]
  )

  React.useEffect(() => {
    glb_params.updTitle_form('Configurações');
    if (empresa) {
      empresaMethods.reset(defaultValues)
    }
  }, [defaultValues])

  //react hook form

  const empresaMethods = useForm<EmpresaSchema>({
    resolver: zodResolver(empresaSchema),
    defaultValues,
    mode: 'onBlur'
  })

  React.useEffect(() => {
    if (empresa) {
      empresaMethods.reset(defaultValues) // seta os valores do formulário com os dados do proprietário
    }
  }, [id, empresa])

  
  console.log('erro',empresaMethods.formState.errors);
  console.log('erro',empresaMethods.formState.isDirty);
  console.log('erro',empresaMethods.formState.isValid);
  console.log('values',empresaMethods.getValues());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-end">
          {/*<h2 className="mb-4 mt-8 text-xl font-bold">Configurações</h2>*/}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditingPersonalInfo(!isEditingPersonalInfo)}
            className='bg-gray-100 hover:cursor-pointer'
          >
            <Edit className="mr-2 h-4 w-4" />
            {isEditingPersonalInfo ? 'Cancelar' : 'Editar'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <EmpresaFormRoot
          createEmpresaMethods={empresaMethods}
          onSubmitEmpresaData={onSubmitEmpresaData}
        >
          <EmpresaFormContent createEmpresaMethods={empresaMethods} disabled={!disabled} />
          <div className="mt-4">
            {disabled && (
              <Button
                disabled={
                  !empresaMethods.formState.isDirty || !empresaMethods.formState.isValid
                }
                className='hover:cursor-pointer'
              >
               Salvar Alterações
              </Button>
            )}
          </div>
        </EmpresaFormRoot>
      </CardContent>
    </Card>
  )
}

export default function DetalhesEmpresa() {
  /*const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
  const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  const isTablet = useMediaQuery({ query: '(min-width: 746px)' })
  const isMobile = useMediaQuery({ query: '(min-width: 400px)' })

  const navigate = useNavigate()*/
  const dataParams = useParams<{ id: string }>();
  const id = dataParams.id ? parseInt(dataParams.id) : undefined;

  //Globals
  //const glb_params = useGlobalParams();
  //const { pessoa, addPessoa, removePessoa, updatePessoa, resetStatePessoa } = usePessoa();

  const { data: empresa } = useQuery({
    queryKey: ['empresa', id],
    queryFn: async () => {
      const { data } = await api.get<Empresa>(`/empresas/${id}`)
      return data
    },
    enabled: !!id
  })

  //default values
  const enderecoData = transformNullToUndefined(empresa?.endereco || {})
  const defaultValues = React.useMemo(
    () => ({
      ...transformNullToUndefined(empresa || {}),
      logradouro: enderecoData?.logradouro,
      numero: enderecoData?.numero ? parseInt(enderecoData.numero) : undefined,
      complemento: enderecoData?.complemento,
      bairro: enderecoData?.bairro,
      cidade: enderecoData?.cidade,
      cep: enderecoData?.cep,
      estado: enderecoData?.estado,
    }),
    [empresa]
  )

  //react hook form
  const empresaMethods = useForm<EmpresaSchema>({
    resolver: zodResolver(empresaSchema),
    defaultValues,
    mode: 'onBlur'
  })

  React.useEffect(() => {
    if (empresa) {
      empresaMethods.reset(defaultValues) // seta os valores do formulário com os dados do proprietário
    }
  }, [id, empresa])


  return (
    <div className="container mx-auto space-y-6 p-4 font-[Poppins-regular]">
      <DetalhesEmpresaForm />
    </div>
  )
}
