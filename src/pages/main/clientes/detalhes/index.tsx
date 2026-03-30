//import { createClient } from '@supabase/supabase-js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import moment from "moment";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ROUTE } from '@/enums/routes.enum'
import { toast } from '@/hooks/use-toast'
import api from '@/services/axios/api'
import { queryClient } from '@/services/react-query/query-client'
import { transformNullToUndefined } from '@/utils/transform-null-to-undefined'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Edit, Link2Off, Plus, Search, Trash2, X } from 'lucide-react'
import * as React from 'react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { PessoaStatus } from '@/enums/pessoal/status-pesoa'
import { Pessoa } from '@/interfaces/pessoa'
import { ClienteSchema } from '@/schemas/cliente.schema'
import { PropImovelSchema, propImoveSchema, proprietarioSchema } from '@/schemas/proprietario.schema'
import { ClienteFormContent, ClienteFormRoot } from '../components/cliente-form'
import { ImovelStatus } from '@/enums/imovel/enums-imovel'
import { Imovel } from '@/interfaces/imovel'
import { DialogClose } from '@radix-ui/react-dialog'
import { Proprietario } from '@/interfaces/proprietario'
import { GARANTIA_LOCACAO_OPTIONS } from '@/constants/garantia-locacao'
import ListarClientes from '..'
import { GarantiaLocacao, LocacaoStatus } from '@/enums/locacao/enums-locacao'
import { locacaoSchema, LocacaoSchema } from '@/schemas/locacao.schema'
import { Locacao } from '@/interfaces/locacao'
import { STATUS_LOCACAO_OPTIONS } from '@/constants/status-locacao'
import { useGlobalParams } from '@/globals/GlobalParams';
//import { boolean } from 'zod';
import { BasePaginationData } from '../../imoveis/listarImoveis';
import { useMediaQuery } from 'react-responsive';
import ListarImoveisLocacao from '../../imoveis/listaimoveislocacao'
import { useAuth } from '@/hooks/auth/use-auth'
import { AZURE_BLOB_CONTAINER } from '@/constants/azure-blob'

// Mock data for demonstration
/*const cliente = {
  id: 'cli001',
  nome: 'Ana Oliveira',
  documento: '123.456.789-00',
  profissao: 'Professora',
  estadoCivil: 'CASADO',
  email: 'ana.oliveira@email.com',
  telefone: '(11) 98765-4321',
  statu: PessoaStatus.ATIVA,
  endereco: {
    rua: 'Rua das Flores',
    numero: '123',
    complemento: 'Apto 45',
    bairro: 'Jardim Primavera',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567'
  },
  locacoes: [
    {
      id: 'rent001',
      imovel: 'Apartamento Centro',
      valorAluguel: 1500,
      dataInicio: '2023-01-01',
      dataFim: '2024-01-01',
      status: 'Ativo'
    },
    {
      id: 'rent002',
      imovel: 'Casa de Praia',
      valorAluguel: 2000,
      dataInicio: '2023-06-01',
      dataFim: null,
      status: 'Ativo'
    },
    {
      id: 'rent003',
      imovel: 'Kitnet Universitária',
      valorAluguel: 800,
      dataInicio: '2022-03-01',
      dataFim: '2023-02-28',
      status: 'Encerrado'
    }
  ]
}*/

const fetchDocumentFiles = async (documents: Pessoa['documentos']) => {
  const documentFilesPromises =
    documents?.map(async (doc) => {
      try {
        console.log('link',AZURE_BLOB_CONTAINER + doc.url);

        const response = await fetch(
          //'https://jrseqfittadsxfbmlwvz.supabase.co/storage/v1/object/public/' + doc.url
          AZURE_BLOB_CONTAINER + doc.url
        )
        console.log('response',response);

        if (!response.ok) {
          throw new Error('Erro ao buscar documento')
        }
        const blob = await response.blob()
        const file = new File([blob], doc?.name || 'documento', { type: doc?.type })
        return {
          file,
          preview: URL.createObjectURL(file),
          name: doc.name,
          type: doc.type,
          // size: doc?.size,
          id: doc.id,
          url: doc.url
        }
      } catch (error) {
        console.error(error)
        return null
      }
    }) || []
  const resolvedFiles = await Promise.all(documentFilesPromises)
  return resolvedFiles.filter(Boolean)
}

export const DetalhesClienteForm = ({
  //id,
  desvincularClienteImovel
}: {
  //id: number
  disabled?: boolean
  desvincularClienteImovel?: () => void
}) => {

  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = React.useState(false)
  const disabled = isEditingPersonalInfo

  //const navigate = useNavigate();
  const dataParams = useParams<{ id: string }>();
  const id = dataParams.id ? parseInt(dataParams.id) : undefined;
  //const params = useParams();

  //Globals
  const glb_params = useGlobalParams();

  console.log(id);
  const { data: cliente } = useQuery({
    queryKey: ['cliente', id],
    queryFn: async () => {
      const  data  = await api.get<Pessoa>(`/pessoas/findbyid/${id}`)
      return data.data;
    },
    enabled: !!id
  })

  const { data: documentFilesData = [], isSuccess: isSuccessDocuments } = useQuery({
    queryKey: ['documentFiles', id, cliente?.documentos],
    queryFn: () => fetchDocumentFiles(cliente?.documentos),
    enabled: !!cliente?.documentos?.length
  })

  const documentFiles = React.useMemo(() => documentFilesData, [isSuccessDocuments])

  const updateCliente = useMutation({
    mutationFn: async (data: FormData) => {
      return await api.put<Pessoa>(`/pessoas/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      ;['cliente', 'documentFiles', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
    }
  })

  /*const deleteClienteMutation = useMutation({
    mutationFn: async () => {
      return await api.delete(`/pessoas/${id}`)
    },
    onSuccess: () => {
      ;['cliente', 'documentFiles', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })

      toast({
        title: 'Cliente excluído com sucesso',
        description: `Cliente excluído com sucesso`
      })

      navigate(ROUTE.CLIENTES)
    }
  })*/

  const onSubmitClienteData = async (data: ClienteSchema) => {
    try {
      const form = new FormData()

      if (data?.nome) {
        form.append('nome', data.nome)
      }

      if (data?.documento) {
        form.append('documento', data.documento)
      }

      if (data?.email) {
        form.append('email', data.email)
      }

      if (data?.telefone) {
        form.append('telefone', data.telefone)
      }

      if (data?.profissao) {
        form.append('profissao', data.profissao)
      }

      if (data?.estadoCivil) {
        form.append('estadoCivil', data.estadoCivil)
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

      const newDocuments = data?.documentos?.filter((doc) => !doc.id)
      newDocuments?.forEach((doc) => {
        form.append('documentos', doc.file)
      })

      if (data?.documentosToDeleteIds?.length) {
        data.documentosToDeleteIds.forEach((docId) => {
          form.append('documentosToDeleteIds[]', docId.toString())
        })
      }

      await updateCliente.mutateAsync(form)

      toast({
        title: 'Cliente atualizado com sucesso',
        description: `Cliente atualizado com sucesso`

      })
    } catch (error) {
      toast({
        title: 'Erro ao atualizar cliente',
        description: 'Ocorreu um erro ao tentar atualizar o cliente. Tente novamente.'
      })
    }
  }

  //default values
  const enderecoData = transformNullToUndefined(cliente?.endereco || {})
  const defaultValues = React.useMemo(
    () => ({
      ...transformNullToUndefined(cliente || {}),
      logradouro: enderecoData?.logradouro,
      numero: enderecoData?.numero ? parseInt(enderecoData.numero) : undefined,
      complemento: enderecoData?.complemento,
      bairro: enderecoData?.bairro,
      cidade: enderecoData?.cidade,
      cep: enderecoData?.cep,
      estado: enderecoData?.estado,
      documentos: documentFiles?.filter((doc) => doc !== null)
    }),
    [cliente, documentFiles]
  )

  React.useEffect(() => {
    glb_params.updTitle_form('Clientes');
    if (cliente) clienteMethods.reset(defaultValues)
  }, [defaultValues])

  //react hook form

  const clienteMethods = useForm<ClienteSchema>({
    resolver: zodResolver(proprietarioSchema),
    defaultValues,
    mode: 'onBlur'
  })

  React.useEffect(() => {
    if (cliente) {
      clienteMethods.reset(defaultValues) // seta os valores do formulário com os dados do proprietário
    }
  }, [id, cliente, documentFiles])

  console.log('cliente methods', clienteMethods.formState.errors);
  console.log('cliente methods', clienteMethods.formState.isDirty);
  console.log('cliente methods', clienteMethods.formState.isValid)
  /*const handleDeleteProprietario = () => {
    deleteClienteMutation.mutate()
  }*/

  const hasLocatario = !!cliente?.locatarios?.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <h2 className="mb-4 mt-8 text-xl font-bold">Dados Pessoais</h2>
          <span>
            {desvincularClienteImovel && hasLocatario && (
              <Button variant="destructive" type="button" onClick={desvincularClienteImovel}>
                <Link2Off className="mr-2 h-4 w-4" />
                Desvincular Propriedade
              </Button>
            )}
          </span>
          {(isAdmin ||
            user?.permissions.includes("ALL") ||
            user?.permissions.includes("UPDATE_PESSOA")
          ) && (

              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingPersonalInfo(!isEditingPersonalInfo)}
                className='hover:cursor-pointer bg-gray-100 hover:bg-gray-200'
              >
                <Edit className="mr-2 h-4 w-4" />
                {isEditingPersonalInfo ? 'Cancelar' : 'Editar'}
              </Button>
            )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ClienteFormRoot
          createClienteMethods={clienteMethods}
          onSubmitClienteData={onSubmitClienteData}
        >
          <ClienteFormContent createClienteMethods={clienteMethods} disabled={!disabled} />
          <div className="mt-4">
            {disabled && (
              <Button
                className="hover:cursor-pointer"
                disabled={
                  !clienteMethods.formState.isDirty || !clienteMethods.formState.isValid
                }
              >
                Salvar Alterações
              </Button>
            )}
          </div>
        </ClienteFormRoot>
      </CardContent>
    </Card>
  )
}

export default function DetalhesCliente() {

  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  //const isBigScreen = useMediaQuery({ query: '(min-width: 1824px)' })
  const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  const isTablet = useMediaQuery({ query: '(min-width: 746px)' })
  const isMobile = useMediaQuery({ query: '(max-width: 400px)' })

  const navigate = useNavigate()
  //const [formInitialized, setFormInitialized] = React.useState(false) // Controle de inicialização
  const dataParams = useParams<{ id: string }>();
  const id = dataParams.id ? parseInt(dataParams.id) : undefined;
  //const [proImovelId, setPropImovelId] = React.useState<number>(0);
  //const [cotaImovel, setCotaImovel] = React.useState<number>(0);
  const [selImovel, setSelImovel] = React.useState<boolean>(false);
  const [proImovelIdAlt, setPropImovelIdAlt] = React.useState<number>(0);
  //const [cotaImovelAlt, setCotaImovelAlt] = React.useState<number>(0);
  //const [selImovelAlt, setSelImovelAlt] = React.useState('');
  const [propEdit, setPropEdit] = React.useState<Proprietario>();
  //const [locEdit, setLocEdit] = React.useState<Locacao>();
  const [selGarantia, setSelGarantia] = React.useState<GarantiaLocacao>();
  const [selFiador, setSelFiador] = React.useState<boolean>(false);
  const [openImovel, setOpenImovel] = React.useState<boolean>(false);
  const [activeTab, setActiveTab] = React.useState('personal-info')


  //Globals
  const glb_params = useGlobalParams();
  //const { pessoa, addPessoa, removePessoa, updatePessoa, resetStatePessoa } = usePessoa();

  const { data: cliente } = useQuery({
    queryKey: ['cliente', id],
    queryFn: async () => {
      console.log('antes de copmsul');
      const  data = await api.get<Pessoa>(`/pessoas/findbyid/${id}`)
      console.log(data.data);
      return data.data;
    },
    enabled: !!id
  })

  console.log(id);
  console.log(cliente);

  let imovelStatus = ImovelStatus.ALUGADO;

  const { data } = useQuery({
    queryKey: ['locacoes', imovelStatus],
    queryFn: async () => {
      const { data } = await api.get<BasePaginationData<Imovel>>(`/imoveis/locacao/?imovelStatus=${imovelStatus}`)
      return data
    },
  })

  const imoveisLocacao = data?.data || [];
  /*const { data } = useQuery({
    queryKey: [],
    queryFn: async () => {
      const response = await api.get<Pessoa[]>(`/pessoas`)
      return response.data;
    },
  });

  const fiadores = data?.data || [];*/

  const { data: documentFilesData = [], isSuccess: isSuccessDocuments } = useQuery({
    queryKey: ['documentFiles', id, cliente?.documentos],
    queryFn: () => fetchDocumentFiles(cliente?.documentos),
    enabled: !!cliente?.documentos?.length
  })

  const documentFiles = React.useMemo(() => documentFilesData, [isSuccessDocuments])

  /*const updateCliente = useMutation({
    mutationFn: async (data: FormData) => {
      return await api.put<Pessoa>(`/pessoas/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    onSuccess: () => {
      ;['cliente', 'documentFiles', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })
    }
  })*/

  const deleteClienteMutation = useMutation({
    mutationFn: async () => {
      return await api.delete(`/pessoas/${id}`)
    },
    onSuccess: () => {
      ;['cliente', 'documentFiles', id].forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] })
      })

      toast({
        title: 'Cliente excluído com sucesso',
        description: `Cliente excluído com sucesso`
      })

      navigate(ROUTE.CLIENTES);
    }
  })

  //default values
  const enderecoData = transformNullToUndefined(cliente?.endereco || {})
  const defaultValues = React.useMemo(
    () => ({
      ...transformNullToUndefined(cliente || {}),
      logradouro: enderecoData?.logradouro,
      numero: enderecoData?.numero ? parseInt(enderecoData.numero) : undefined,
      complemento: enderecoData?.complemento,
      bairro: enderecoData?.bairro,
      cidade: enderecoData?.cidade,
      cep: enderecoData?.cep,
      estado: enderecoData?.estado,
      documentos: documentFiles?.filter((doc) => doc !== null)
    }),
    [cliente, documentFiles]
  )

  //react hook form
  const clienteMethods = useForm<ClienteSchema>({
    resolver: zodResolver(proprietarioSchema),
    defaultValues,
    mode: 'onBlur'
  })

  const clienteProp = useForm<PropImovelSchema>({
    resolver: zodResolver(propImoveSchema),
  });

  const clientePropAlt = useForm<PropImovelSchema>({
    resolver: zodResolver(propImoveSchema),
  });

  const locacaoMethods = useForm<LocacaoSchema>({
    resolver: zodResolver(locacaoSchema),
  });

  const {
    control,
    //handleSubmit,
    //formState: { errors },
  } = locacaoMethods;

  const locacaoFiadores = useFieldArray({
    control,
    name: 'fiadores'
  });

  const imovelLocAlt = useForm<LocacaoSchema>({
    resolver: zodResolver(locacaoSchema),
    mode: "onBlur"
  });

  //Imóveis lista 
  const clientePropers = useFieldArray({
    control: clienteProp.control,
    name: 'proprietarios'
  });

  React.useEffect(() => {
    if (cliente) {
      clienteMethods.reset(defaultValues) // seta os valores do formulário com os dados do proprietário
    }
    clienteProp.reset();
    clientePropAlt.reset();
  }, [id, cliente, documentFiles])

  const handleDeleteProprietario = () => {
    deleteClienteMutation.mutate()
  }

  function handleSubmitPropriedade(data: PropImovelSchema) {
    console.log(data);

    const formData = new FormData();

    formData.append('pessoaId', (id!! ? id.toString() : '0'));
    formData.append('cotaImovel', (data.cotaImovel ? data.cotaImovel.toString() : ""));
    formData.append('imovelId', (data.imovelId ? data.imovelId.toString() : ""));

    //Gravar dados das propriedades
    api.put(`proprietarios/${id}/vincular-imovel/${data.imovelId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).
      then(result => {
        toast({
          title: 'Propriedade adicionada com sucesso',
          description: `Propriedade adicionada com sucesso`
        });

        let tst = "";
        tst = result.statusText + " " + tst;
      });


  }

  const handlerNewProp = () => {
    //setCotaImovel(0);
    if (clientePropers.fields.length > 0) {
      clientePropers.remove(0);
    }
    clienteProp.reset();
    clienteProp.setValue('pessoaId', id!)
    setOpenImovel(true);
  }

  const handlerEditPropriedade = (proprietario: Proprietario) => {
    if (proprietario) {
      //setCotaImovelAlt(0);
      setPropImovelIdAlt(0);
      //setSelImovelAlt('');
      clientePropAlt.reset();
      setPropEdit(proprietario);
      //setCotaImovelAlt(proprietario.cotaImovel);
      //setSelImovelAlt(proprietario.imovelId.toString());
      setPropImovelIdAlt(proprietario.imovelId);
      clientePropAlt.setValue('imovelId', proprietario.imovelId);
      clientePropAlt.setValue('cotaImovel', proprietario.cotaImovel);
    }
  }

  const handleDeletePropriedade = (propriedade: Proprietario) => {
    //Gravar dados das propriedades
    api.delete(`proprietarios/${propriedade.id}`).
      then(result => {
        toast({
          title: 'Propriedade excluída com sucesso',
          description: `Propriedade excluída com sucesso`
        });
        let tst = "";
        tst = result.statusText + " " + tst;
      });
  }

  function handlerUpdatePropriedade(data: PropImovelSchema) {
    const formData = new FormData();

    console.log(propEdit);
    console.log(data);

    if (propEdit) {
      formData.append('id', propEdit.id.toString());
      formData.append('pessoaId', propEdit.pessoaId.toString());
      formData.append('cotaImovel', (data.cotaImovel ? data.cotaImovel.toString() : ""));
      formData.append('imovelId', (data.imovelId ? data.imovelId.toString() : ""));

      console.log(formData);

      api.put(`proprietarios/${propEdit.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }).
        then(result => {
          toast({
            title: 'Propriedade altarada com sucesso',
            description: `Propriedade altarada com sucesso`
          });
          let tst = "";
          tst = result.statusText + tst;
        });
    }

  }

  //Locação 
  /*const handlerNewLoc = () => {
    setCotaImovel(0);
    setPropImovelId(0);
    locacaoMethods.reset();
    locacaoMethods.setValue('status', LocacaoStatus.AGUARDANDO_DOCUMENTOS);
    locacaoMethods.setValue('imovelId', (id! ? id : 0));
    console.log((id! ? id : 0));
  }*/

  const handlerEditLocacao = (locacao: Locacao) => {
    if (locacao) {
      setPropImovelIdAlt(0);
      imovelLocAlt.reset();
      imovelLocAlt.setValue('dataInicio', moment((locacao.dataInicio ? locacao.dataInicio : '')).format("YYYY-MM-DD"));
      imovelLocAlt.setValue('dataFim', moment((locacao.dataFim ? locacao.dataFim : '')).format("YYYY-MM-DD"));
      imovelLocAlt.setValue('valorAluguel', locacao.valorAluguel);
      imovelLocAlt.setValue('status', locacao.status);
      imovelLocAlt.setValue('garantiaLocacaoTipo', locacao.garantiaLocacaoTipo);
      imovelLocAlt.setValue('imovelId', locacao.imovelId);
      imovelLocAlt.setValue('fiadores', (locacao.fiadores ? locacao.fiadores.map(x => { return { id: x.id, nome: (x.pessoa ? x.pessoa?.nome : '') } }) : []));
    }
  }

  const handlerDetailImovel = (id: number) => {
    navigate(`${ROUTE.IMOVEIS}/${id}`)
  }

  const handleSelectFiador = (fiador: Pessoa | undefined) => {
    console.log(selGarantia);
    setSelFiador(false);
    if (fiador) {
      locacaoFiadores.append({
        nome: fiador.nome,
        id: fiador.id
      });
    }
    console.log(locacaoFiadores);
  }

  const handlerChangeGarantia = (e: GarantiaLocacao) => {
    let bol_limpa = {
      fiador: true,
      calcao: true,
      seguro: true,
      titulo: true,
    };

    setSelGarantia(e);
    console.log(e);

    locacaoMethods.setValue('garantiaLocacaoTipo', e);

    switch (e) {
      case GarantiaLocacao.DEPOSITO_CALCAO:
        bol_limpa.calcao = false;
        bol_limpa.fiador = true;
        bol_limpa.seguro = true;
        bol_limpa.titulo = true;
        break;

      case GarantiaLocacao.FIADOR:
        bol_limpa.calcao = true;
        bol_limpa.fiador = false;
        bol_limpa.seguro = true;
        bol_limpa.titulo = true;
        break;

      case GarantiaLocacao.SEGURO_FIANCA:
        bol_limpa.calcao = true;
        bol_limpa.fiador = true;
        bol_limpa.seguro = false;
        bol_limpa.titulo = true;
        break;

      case GarantiaLocacao.TITULO_CAPITALIZACAO:
        bol_limpa.calcao = true;
        bol_limpa.fiador = true;
        bol_limpa.seguro = true;
        bol_limpa.titulo = false;
        break;
    }

    //limpa fiador
    if (bol_limpa.fiador) {
      if (locacaoFiadores.fields.length > 0) {
        for (let i = 0; i < locacaoFiadores.fields.length; i++) {
          locacaoFiadores.remove(i);
        }
      }
      setSelFiador(false);
    }
    else {
      setSelFiador(true);
    }

    if (bol_limpa.calcao) {
      locacaoMethods.setValue('depCalcao.valorDeposito', 0);
      locacaoMethods.setValue('depCalcao.quantidadeMeses', 0);
    }

    if (bol_limpa.seguro) {
      locacaoMethods.setValue('seguroFianca.numeroSeguro', '0');
    }

    if (bol_limpa.titulo) {
      locacaoMethods.setValue('tituloCap.numeroTitulo', '0');
    }

  }

  const handlerSelImovel = (origin: string) => {

    glb_params.updOrigin_url("imoveis");
    console.log('seleciona ' + origin);
    switch (origin) {
      case 'proprietarios':
        if (clientePropers.fields.length > 0) {
          clientePropers.remove(0);
        }
        break;

      case 'locacoes':
        break;
    }
    setSelImovel(true);

  }

  //Retorno ao selecionar o propriétario/locatário/fiador
  const handleSelectImovel = (imovel: Imovel | undefined) => {

    if (imovel) {
      console.log(glb_params.pastaOrig);

      switch (glb_params.pastaOrig) {
        case 'propriedades':
          if (clientePropers.fields.length === 0) {
            clientePropers.append({
              nome: imovel.endereco.logradouro,
              id: imovel.id
            });
            clientePropers.fields.map((item, index) => {
              console.log(item.nome);
              console.log(index);
            })
            clienteProp.setValue('imovelId', imovel.id);
            clienteProp.setValue('pessoaId', id!);
          }
          if (glb_params.origin_url === 'clientes') {
            setOpenImovel(true);
          }
          break;

        case 'locacoes':
          break;
      }
      setActiveTab(glb_params.pastaOrig);
    }


    setSelImovel(false);
  }

  const handlerChangeFolder = (folder: string) => {
    glb_params.updOrigin_url("imoveis");
    glb_params.updId_orig((id! ? id : 0).toString());
    glb_params.updPastaOrig(folder);
    setActiveTab(folder);
  }

  return (
    <div className="container mx-auto space-y-6 p-4 font-[Poppins-regular]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{cliente?.nome}</h1>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            {(isAdmin ||
              user?.permissions.includes("ALL") ||
              user?.permissions.includes("DELETE_PESSOA")
            ) && (

                <Button variant="destructive" className='h-full hover:cursor-pointer hover:bg-red-400'>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Cliente
                </Button>
              )}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente e todos
                os dados associados a ele.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProprietario}>
                Sim, excluir cliente
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <Tabs value={activeTab} onValueChange={(value) => { handlerChangeFolder(value) }}>
        <TabsList >
          <TabsTrigger value="personal-info" className='text-[0.7rem] hover:cursor-pointer hover:bg-gray-200'>Dados Pessoais</TabsTrigger>
          <TabsTrigger value="propriedades" className='text-[0.7rem] hover:cursor-pointer hover:bg-gray-200'>Propriedades</TabsTrigger>
          <TabsTrigger value="locacoes" className='text-[0.7rem] hover:cursor-pointer hover:bg-gray-200'>Locações</TabsTrigger>
          <TabsTrigger value="finance" className='text-[0.7rem] hover:cursor-pointer hover:bg-gray-200'>Fianças</TabsTrigger>
        </TabsList>

        <TabsContent value="personal-info" className="space-y-4">
          <DetalhesClienteForm />
        </TabsContent>

        {/*Propriedades */}
        <TabsContent value="propriedades" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[1.3rem]">Propriedades</h2>
            {(isAdmin ||
              user?.permissions.includes("ALL") ||
              user?.permissions.includes("UPDATE_PROPRIETARIO")
            ) && (
                <Button
                  className='hover:cursor-pointer hover:bg-gray-600'
                  size={"sm"}
                  onClick={handlerNewProp}>
                  <Plus className="mr-2 h-4 w-4" />
                  Propriedade
                </Button>
              )}
            <Dialog open={openImovel} onOpenChange={setOpenImovel}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Nova Propriedade</DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes da nova propriedada para este cliente.
                  </DialogDescription>
                </DialogHeader>

                <form className="space-y-4" onSubmit={clienteProp.handleSubmit(handleSubmitPropriedade)}>
                  <div className="grid grid-cols-1 gap-4 flex items-center">
                    <Button onClick={() => { handlerSelImovel('propriedades') }}
                      className='hover:cursor-pointer'>
                      <Search className="mr-2 h-4 w-4" />
                      Imóveis
                    </Button>

                    {(clientePropers.fields.length > 0) && (
                      <div className="grid grid-cols-1 gap-4 flex items-center">
                        {clientePropers.fields.map((field, index) => (
                          <div className='flex justify-between items-center gap-2 mt-2 border-solid border-2 border-gray-250 rounded p-1' key={field.id}>
                            <Label >{field.nome}</Label>
                            <button
                              className='border bg-zinc-200 hover:bg-zinc-400'
                              type="button"
                              onClick={() => {
                                clienteProp.setValue('imovelId', 0);
                                clientePropers.remove(index);
                              }}
                            >
                              <X className='px-1'></X>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {!!clienteProp?.formState?.errors?.imovelId?.message && (
                      <span>{clienteProp?.formState?.errors?.imovelId?.message}</span>
                    )}

                  </div>
                  {selImovel && (
                    <Card id='teste' className='h-full'>
                      <div className="flex  justify-end">
                        <Button onClick={() => { setSelImovel(false) }}
                          className='w-8 h-8 rounded-full bg-transparent text-black bg-zinc-200 hover:bg-zinc-400 hover:cursor-pointer'>X</Button>
                      </div>
                      <CardHeader>
                        <DialogTitle className='flex items-center justify-center'>Selecionar o Imóvel</DialogTitle>
                      </CardHeader>
                      <CardContent className='mt-2 h-120'>
                        <ListarImoveisLocacao limitView={1} exclude={cliente && cliente?.proprietarios ? cliente?.proprietarios?.map((prop) => { return prop.imovelId }).toString() : ''} onSelectImovel={handleSelectImovel} />
                      </CardContent>
                    </Card>
                  )}

                  <div>
                    <Label htmlFor="cotaImovel">Cota do Imóvel</Label>
                    <Input id="cotaImovel" type="number" placeholder="0.00"
                      {...clienteProp.register('cotaImovel')}
                      helperText={clienteProp.formState?.errors?.cotaImovel?.message}
                    />
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="submit" size={"sm"} 
                      className='hover:cursor-pointer hover:bg-gray-600'
                      >Adicionar Propriedade</Button>
                    </DialogClose>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className={(isPortrait ? "grid gap-4 grid-cols-3" : isTablet ? "grid gap-4 grid-cols-2" : isMobile ? "grid gap-4 grid-cols-1" : "grid gap-4 grid-cols-1")}>
            {cliente?.proprietarios?.map((proprietario) => (
              <Card key={proprietario.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{proprietario.id}</span>
                    <Badge variant="default">{proprietario.imovel?.tipo.name}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <Label className="font-semibold">Cota do imóvel</Label>
                    <p>
                      % {proprietario.cotaImovel.toLocaleString('pt-BR')}
                    </p>
                  </div>

                  <Label className="font-semibold">Dados do imóvel</Label>
                  <p>
                    {proprietario.imovel?.tipo.name + ' - ' +
                      proprietario.imovel?.endereco.logradouro.toString() + ' ' +
                      proprietario.imovel?.endereco.numero.toString() + ' ' +
                      proprietario.imovel?.endereco.complemento?.toString() + ' ' +
                      proprietario.imovel?.endereco.bairro.toString() + ' ' +
                      proprietario.imovel?.endereco.cidade.toString()}

                  </p>
                  {(isAdmin ||
                    user?.permissions.includes("ALL") ||
                    user?.permissions.includes("VIEW_IMOVELS")
                  ) && (
                      <div className="grid grid-cols-3 gap-4 flex items-end mt-2">
                        <Button
                          className='col-start-3 hover:cursor-pointer hover:bg-gray-200'
                          variant="secondary"
                          size="sm"
                          onClick={() => { handlerDetailImovel(proprietario.imovelId) }}
                          style={
                            {
                              fontSize: '0.8rem',
                            }}
                        >
                          Ver detalhes
                        </Button>
                      </div>
                    )}
                  <hr className="border-t border-gray-300 mt-3" />
                </CardContent>
                <CardFooter className="flex justify-end space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      {(isAdmin ||
                        user?.permissions.includes("ALL") ||
                        user?.permissions.includes("UPDATE_PROPRIETARIO")
                      ) && (

                          <Button variant="outline" size="sm"
                          className='hover:cursor-pointer hover:bg-gray-200'
                            onClick={() => { handlerEditPropriedade(proprietario) }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </Button>
                        )}
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Alterar Propriedade</DialogTitle>
                        <DialogDescription>
                          Preencha os detalhes da nova propriedade para este cliente.
                        </DialogDescription>
                      </DialogHeader>
                      <form className="space-y-4" onSubmit={clientePropAlt.handleSubmit(handlerUpdatePropriedade)}>
                        <div>
                          <Label htmlFor="imovel">Imóvel</Label>
                          <Select
                            value={proImovelIdAlt.toString()}
                            onValueChange={(e) => {
                              //setPropImovelId(parseInt(e));
                              clientePropAlt.setValue('imovelId', parseInt(e))
                            }}
                            {...clientePropAlt.register('imovelId')}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o imóvel" />
                            </SelectTrigger>
                            <SelectContent>
                              {imoveisLocacao?.map((locacao) => (
                                <SelectItem value={locacao.id.toString()}
                                >
                                  {locacao.tipo.toString() + ', ' +
                                    locacao.endereco.logradouro.toString() + ' ' +
                                    locacao.endereco.numero.toString() + ' ' +
                                    locacao.endereco.complemento?.toString() + ' ' +
                                    locacao.endereco.bairro.toString() + ' ' +
                                    locacao.endereco.cidade.toString()}

                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {clientePropAlt.formState?.errors?.imovelId?.message}
                        </div>
                        <div>
                          <Label htmlFor="cotaImovel">Cota do Imóvel</Label>
                          <Input id="cotaImovel" type="number" placeholder="0.00"
                            {...clientePropAlt.register('cotaImovel')}
                            helperText={clientePropAlt.formState?.errors?.cotaImovel?.message}
                            onChange={(e) => { clientePropAlt.setValue('cotaImovel', parseFloat(e.target.value)) }}
                          />
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="submit"
                            className='hover:cursor-pointer hover:bg-gray-600'
                            >Salvar Alterações</Button>
                          </DialogClose>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  {(isAdmin ||
                    user?.permissions.includes("ALL") ||
                    user?.permissions.includes("DELETE_PROPRIETARIO")
                  ) && (
                      <Button variant="destructive" size="sm"
                      className='hover:cursor-pointer hover:bg-red-400'
                        onClick={() => { handleDeletePropriedade(proprietario) }}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Locações */}
        <TabsContent value="locacoes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[1.3rem]">Locações</h2>
          </div>

          <div className={(isPortrait ? "grid gap-4 grid-cols-3" : isTablet ? "grid gap-4 grid-cols-2" : isMobile ? "grid gap-4 grid-cols-1" : "grid gap-4 grid-cols-1")}>
            {cliente?.locatarios?.map((locatario) => (
              locatario.locacoes?.map((locacao) => {
                return (
                  <Card key={locacao.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{locacao.id}</span>
                        <Badge variant="default">{locacao.status}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 flex items-center mt-2">
                        <Label>Valor do Aluguel</Label>
                        <p className="font-semibold">
                          R$ {locacao.valorAluguel.toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 items-center mt-4">
                        <Label>Período</Label>
                        <p className="flex items-center text-[0.75rem] font-semibold">
                          {/* <Calendar className="mr-2 h-4 w-4" /> */}
                          {new Date(locacao.dataInicio).toLocaleDateString('pt-BR')} -
                          {locacao.dataFim
                            ? new Date(locacao.dataFim).toLocaleDateString('pt-BR')
                            : 'Atual'}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 items-center mt-4">
                        <Label>Imóvel</Label>
                        <p className="flex flex-col items-center text-[0.70rem]">
                          {locacao.imovel?.tipo.name + " - " + locacao.imovel?.endereco.logradouro.toString() + " " + locacao.imovel?.endereco.bairro + " " + locacao.imovel?.endereco.cidade}
                        </p>
                      </div>
                      {(isAdmin ||
                        user?.permissions.includes("ALL") ||
                        user?.permissions.includes("VIEW_IMOVELS")
                      ) && (
                          <div className='grid grid-cols-3 gap-4 flex items-end mt-2'>
                            <Button
                              className='col-start-3 hover:cursor-pointer hover:bg-gray-200'
                              variant="secondary"
                              size="sm"
                              onClick={() => { handlerDetailImovel(parseFloat(locacao?.imovelId.toString())) }}
                              style={
                                {
                                  fontSize: '0.8rem',
                                }}
                            >
                              Ver detalhes
                            </Button>
                          </div>
                        )}
                      <hr className="border-t border-gray-300 mt-5" />
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          {(isAdmin ||
                            user?.permissions.includes("ALL") ||
                            user?.permissions.includes("UPDATE_LOCACAO")
                          ) && (
                              <Button variant="outline" size="sm"
                                onClick={() => { handlerEditLocacao(locacao) }}
                                className='hover:cursor-pointer hover:bg-gray-200'
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Button>
                            )}
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Alterar Locação</DialogTitle>
                            <DialogDescription>
                              Preencha os detalhes da nova locação para este cliente.
                            </DialogDescription>
                          </DialogHeader>
                          <form className="space-y-4">
                            <div style={{ display: (!selFiador ? 'block' : 'none') }}>
                              <Label className="text-base">
                                Imóvel
                                <div className="mt-2">
                                  <Controller
                                    name="imovelId"
                                    control={imovelLocAlt.control}
                                    render={({ field }) => (
                                      <Select
                                        onValueChange={(value) => {
                                          field.onChange(value)
                                          imovelLocAlt.setValue('valorAluguel', imoveisLocacao?.filter(x => x.id === parseFloat(value))[0].valorAluguel || 0)
                                          imovelLocAlt.setValue('imovelId', parseFloat(value));

                                        }}
                                        value={field.value?.toString()}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Selecione o imóvel" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {imoveisLocacao?.map((locacao) => (
                                            <SelectItem value={locacao.id.toString()}>{locacao.tipo.toString() + ", " + locacao.endereco.logradouro.toString() + " " + locacao.endereco.bairro + " " + locacao.endereco.cidade}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    )}
                                  />
                                  {!!imovelLocAlt?.formState?.errors?.imovelId?.message && (
                                    <span>{imovelLocAlt?.formState?.errors?.imovelId?.message}</span>
                                  )}
                                </div>
                              </Label>
                              <div className='mt-2'>
                                <Label htmlFor="valorAluguel">Valor do Aluguel</Label>
                                <Input id="valorAluguel" type="number" placeholder="0.00"
                                  {...imovelLocAlt.register('valorAluguel')}
                                  helperText={imovelLocAlt.formState?.errors?.valorAluguel?.message}
                                  onChange={(e) => { imovelLocAlt.setValue('valorAluguel', parseFloat(e.target.value)) }}
                                />
                              </div>
                              <div className='mt-2'>
                                <Label htmlFor="dataInicio">Data de Início</Label>
                                <Input type="date"
                                  {...imovelLocAlt.register('dataInicio')}
                                  helperText={imovelLocAlt.formState?.errors?.dataInicio?.message}
                                  //onChange={(e) => { imovelLocAlt.setValue('dataInicio', new Date(moment((e.target.value ? e.target.value : '')).format("YYYY-MM-DD"))) }}
                                  onChange={(e) => { imovelLocAlt.setValue('dataInicio', moment((e.target.value ? e.target.value : '')).format("YYYY-MM-DD")) }}
                                />
                              </div>
                              <div className='mt-2'>
                                <Label htmlFor="dataFim">Data de Fim (opcional)</Label>
                                <Input type="date"
                                  {...imovelLocAlt.register('dataFim')}
                                  helperText={imovelLocAlt.formState?.errors?.dataFim?.message}
                                />
                              </div>
                              <div className='mt-2'>
                                <Label htmlFor="diaVencto">Dia de Vencimento</Label>
                                <Input id="diaVencto" type="number"
                                  {...imovelLocAlt.register('diaVencimento')} placeholder='0'
                                  helperText={imovelLocAlt.formState?.errors?.diaVencimento?.message}
                                  onChange={(e) => { imovelLocAlt.setValue('diaVencimento', parseInt(e.target.value)) }}
                                />
                              </div>
                              <div className='mt-2'>
                                <Label htmlFor="observacoes">Observações</Label>
                                <Textarea id="observacoes" placeholder="Detalhes adicionais sobre a locação" />
                              </div>
                              <div className='mt-2'>
                                <Label htmlFor="Garantia">Tipo de Garantia</Label>
                                <Select
                                  onValueChange={(e: GarantiaLocacao) => { handlerChangeGarantia(e) }
                                  }>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione a garantia" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {GARANTIA_LOCACAO_OPTIONS.map((garantia) => (
                                      <SelectItem key={garantia.label} value={garantia.value}>
                                        {garantia.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {(selGarantia === GarantiaLocacao.FIADOR && selFiador) && (
                              <div>
                                <Card>
                                  <CardHeader>
                                    <DialogTitle className='flex items-center'>Selecionar o Fiador</DialogTitle>
                                  </CardHeader>
                                  <CardContent className='mt-2 h-120'>
                                    <ListarClientes limitView={1} txtVinc='Vincular Locação' onSelectCliente={handleSelectFiador} exclude='' />
                                  </CardContent>
                                </Card>
                              </div>
                            )}

                            {(locacaoFiadores.fields.length > 0) && (
                              <div>
                                <div className="grid grid-cols-2 gap-2 items-center justify-between">
                                  <Label>Fiadores</Label>
                                  <button
                                    className='border bg-zinc-200 hover:bg-zinc-400 rounded'
                                    type="button"
                                    onClick={() => { setSelFiador(true) }}
                                  >
                                    Adicionar
                                  </button>
                                </div>
                                {locacaoFiadores.fields.map((field, index) => (
                                  <div className='flex items-center gap-2 mt-2'>
                                    <Label >{field.nome}</Label>
                                    <button
                                      className='border bg-zinc-200 hover:bg-zinc-400'
                                      type="button"
                                      onClick={() => locacaoFiadores.remove(index)}
                                    >
                                      <X className='px-1'></X>
                                    </button>
                                  </div>
                                ))}
                              </div>
                              // <div>
                              //   <div className='mt-2'>
                              //     <Label>Fiador: {selFiador?.nome}</Label>
                              //   </div>
                              // </div>
                            )}

                            {selGarantia === GarantiaLocacao.TITULO_CAPITALIZACAO && (
                              <div className='mt-2'>
                                <Label htmlFor="titulocap">Número do Título</Label>
                                <Input id="titulocap" type="number"
                                  {...imovelLocAlt.register('tituloCap.numeroTitulo')}
                                  helperText={imovelLocAlt.formState?.errors?.tituloCap?.numeroTitulo?.message}
                                  onChange={(e) => { imovelLocAlt.setValue('tituloCap.numeroTitulo', e.target.value) }}
                                />
                              </div>
                            )}

                            {selGarantia === GarantiaLocacao.SEGURO_FIANCA && (
                              <div className='mt-2'>
                                <Label htmlFor="numseguro">Número do Seguro</Label>
                                <Input id="numseguro" type="number"
                                  {...imovelLocAlt.register('seguroFianca.numeroSeguro')}
                                  helperText={imovelLocAlt.formState?.errors?.seguroFianca?.numeroSeguro?.message}
                                  onChange={(e) => { imovelLocAlt.setValue('seguroFianca.numeroSeguro', e.target.value) }}
                                />
                              </div>
                            )}

                            {selGarantia === GarantiaLocacao.DEPOSITO_CALCAO && (
                              <div>
                                <div className='mt-2'>
                                  <Label htmlFor="valdepCalcao">Valor do depósito</Label>
                                  <Input id="valdepCalcao" type="number" placeholder='0,00'
                                    {...imovelLocAlt.register('depCalcao.valorDeposito')}
                                    helperText={imovelLocAlt.formState?.errors?.depCalcao?.valorDeposito?.message}
                                    onChange={(e) => { imovelLocAlt.setValue('depCalcao.valorDeposito', parseFloat(e.target.value)) }}
                                  />
                                </div>
                                <div className='mt-2'>
                                  <Label htmlFor="qtddepCalcao">Quantidade de meses</Label>
                                  <Input id="qtddepCalcao" type="number"
                                    {...imovelLocAlt.register('depCalcao.quantidadeMeses')}
                                    helperText={imovelLocAlt.formState?.errors?.depCalcao?.quantidadeMeses?.message}
                                    onChange={(e) => { imovelLocAlt.setValue('depCalcao.quantidadeMeses', parseFloat(e.target.value)) }}
                                  />
                                </div>
                              </div>
                            )}

                            <div className='mt-2'>
                              <Label htmlFor="status">Situação da Locação</Label>
                              <Select
                                onValueChange={(e: LocacaoStatus) => {
                                  imovelLocAlt.setValue('status', e)
                                }
                                }>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a situação" />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_LOCACAO_OPTIONS.map((status) => (
                                    <SelectItem key={status.label} value={status.value}>
                                      {status.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </form>
                          <DialogFooter>
                            <Button type="submit" className='hover:cursor-pointer hover:bg-gray-600'>Salvar Locação</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      {(isAdmin ||
                        user?.permissions.includes("ALL") ||
                        user?.permissions.includes("DELETE_LOCACAO")
                      ) && (
                      <Button variant="destructive" size="sm"
                      className='hover:cursor-pointer hover:bg-red-400'
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                      )}
                    </CardFooter>
                  </Card>
                )
              })
            ))}
          </div>
        </TabsContent>

        {/*Fianças */}
        <TabsContent value="finance" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Fianças</h2>
          </div>

          {cliente?.fiador?.locacoes?.map((locacao) => (
            <Card key={locacao.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{locacao.id}</span>
                  <Badge variant="default">{locacao.imovel?.tipo.name}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 flex items-center mt-2">
                  <Label>Locatário</Label>
                  <p className="font-semibold">
                    {locacao?.locatarios?.map((locatario) => (
                      <span>{locatario.pessoa?.nome}</span>
                    ))}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 flex items-center mt-2">
                  <Label>Valor do Aluguel</Label>
                  <p className="font-semibold">
                    R$ {locacao.valorAluguel.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 items-center mt-4">
                  <Label>Período</Label>
                  <p className="flex items-center text-[0.75rem] font-semibold">
                    {/* <Calendar className="mr-2 h-4 w-4" /> */}
                    {new Date(locacao.dataInicio).toLocaleDateString('pt-BR')} -
                    {locacao.dataFim
                      ? new Date(locacao.dataFim).toLocaleDateString('pt-BR')
                      : 'Atual'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 items-center mt-4">
                  <Label>Imóvel</Label>
                  <p className="flex flex-col items-center text-[0.70rem]">
                    {locacao.imovel?.tipo.toString() + ", " + locacao.imovel?.endereco.logradouro.toString() + " " + locacao.imovel?.endereco.bairro + " " + locacao.imovel?.endereco.cidade}
                  </p>
                </div>
                <div className='grid grid-cols-2 gap-3 flex items-end mt-2'>
                  <Button
                    className='col-start-3 hover:cursor-pointer hover:bg-gray-200'
                    variant="secondary"
                    size="sm"
                    
                    onClick={() => { handlerDetailImovel(parseFloat(locacao?.imovelId.toString())) }}
                    style={
                      {
                        fontSize: '0.8rem',
                      }}
                  >
                    Ver detalhes
                  </Button>
                </div>
                <hr className="border-t border-gray-300 mt-2" />
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm"
                    className='hover:cursor-pointer hover:bg-gray-200'>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Alterar Propriedade</DialogTitle>
                      <DialogDescription>
                        Preencha os detalhes da nova propriedade para este cliente.
                      </DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4">
                      <div>
                        <Label htmlFor="imovel">Imóvel</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o imóvel" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="apt1">Apartamento Centro</SelectItem>
                            <SelectItem value="casa1">Casa de Praia</SelectItem>
                            <SelectItem value="kitnet1">Kitnet Universitária</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </form>
                    <DialogFooter>
                      <Button type="submit" className='hover:cursor-pointer hover:bg-gray-600'>Adicionar Propriedade</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                {/* <Button variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button> */}
                <Button variant="destructive" size="sm"
                className='hover:cursor-pointer hover:bg-red-400'>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </CardFooter>
            </Card>
          ))}
        </TabsContent>

      </Tabs>
    </div>
  )
}
