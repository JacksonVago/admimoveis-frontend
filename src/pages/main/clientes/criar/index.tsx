import { Card, CardContent } from '@/components/ui/card'
import { ROUTE } from '@/enums/routes.enum'
import { toast } from '@/hooks/use-toast'
import { Pessoa } from '@/interfaces/pessoa'
import { clienteSchema, ClienteSchema } from '@/schemas/cliente.schema'
import api from '@/services/axios/api'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { ClienteFormContent, ClienteFormRoot, ClienteFormSubmitButton } from '../components/cliente-form'
import { PessoaStatus } from '@/enums/pessoal/status-pesoa'
import { useGlobalParams, usePessoa } from '@/globals/GlobalParams'
import { useEffect } from 'react'

const createCliente = async (data: FormData): Promise<Pessoa | any> => {
  return await api.post<Pessoa>('/pessoas', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const CriarCliente = () => {
  //Globals
  const glb_params = useGlobalParams();
  const { pessoa, addPessoa } = usePessoa();
  const navigate = useNavigate()

  useEffect(() => {    
  }, [glb_params, pessoa]);

  const clienteMethods = useForm<ClienteSchema>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      empresaId: glb_params.id_empresa ? Number(glb_params.id_empresa) : 0,
    },
    mode: 'all'
  })

  useEffect(() => {
    glb_params.updTitle_form('Clientes');

    if (glb_params.pastaOrig === '') {
      glb_params.updPastaOrig('cliente-create');
    }
    else {
      //setActiveTab(glb_params.pastaOrig);
    }

  }, [])

  /*
  const createClienteMutation = useMutation({
    mutationFn: async (data: FormData) => {
      data.forEach((item) => {
        console.log(item.toString());
      })

      return await api.post<Pessoa>('/pessoas', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }
  });*/

  const createClienteMutation = useMutation({
    mutationFn: ({ data }: { data: FormData }) => createCliente(data),
    onSuccess: ({data: clienteData}) => {
      toast({ title: 'Cliente criado com sucesso' });
      
      addPessoa(clienteData);

      if (glb_params.origin_url === 'imoveis') {
        navigate(`${ROUTE.IMOVEIS}/${glb_params.id_orig}`);
      }
      else {
        //navigate(ROUTE.CLIENTES + '/' + clienteData?.id);
        navigate(ROUTE.CLIENTES);
      }

    },
    onError: () => {
      toast({ title: 'Erro ao criar cliente', variant: 'destructive' })
    }
  });


  const onSubmitClienteData = async (data: ClienteSchema) => {
    //try {
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

    form.append('status', PessoaStatus.ATIVA);
    form.append('empresaId', glb_params.id_empresa ? glb_params.id_empresa : "0");

    const newDocuments = data?.documentos?.filter((doc) => !doc.id)
    newDocuments?.forEach((doc) => {
      form.append('documentos', doc.file)
    })

    if (data?.documentosToDeleteIds?.length) {
      data.documentosToDeleteIds.forEach((docId) => {
        form.append('documentosToDeleteIds[]', docId.toString())
      })
    }

    createClienteMutation.mutate({ data: form });

    /*const { data: clienteData } = await createClienteMutation.mutateAsync(form)
      .then(
        (resul) => {
          resetStatePessoa();
          addPessoa(clienteData);

          toast({
            title: 'Cliente criado com sucesso',
            description: `Cliente criado com sucesso`
          })

          if (glb_params.origin_url === 'imoveis') {
            navigate(ROUTE.IMOVEIS_DETALHES + '/' + glb_params.id_orig)
          }
          else {
            navigate(ROUTE.CLIENTES + '/' + clienteData?.id)
          }

          return resul;
        }
      );

  } catch (error) {
    console.log(error);
    toast({
      title: 'Erro ao criar cliente',
      description: 'Não foi possível criar o cliente, tente novamente'
    })
  }*/

    
  }

    console.log('Erro', clienteMethods.formState.errors);
    console.log('dirty', clienteMethods.formState.isDirty);
    console.log('valid', clienteMethods.formState.isValid);
    console.log('valid', clienteMethods.getValues());
  return (
    <div className="mx-auto max-w-screen-xl" style={{color: "#034869"}}>
      <Card className='py-10' style={{color: "#034869"}}>
        <CardContent>
          <h2 className="mb-4 mt-8 text-xl font-bold">Criar um novo Cliente</h2>
          <ClienteFormRoot
            createClienteMethods={clienteMethods}
            onSubmitClienteData={onSubmitClienteData}
          >
            <ClienteFormContent createClienteMethods={clienteMethods} />
            <ClienteFormSubmitButton createClienteMethods={clienteMethods} />
          </ClienteFormRoot>
        </CardContent>
      </Card>
    </div>
  )
}
