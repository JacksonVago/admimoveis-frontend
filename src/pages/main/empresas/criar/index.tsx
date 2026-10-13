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
import { ClienteFormContent, ClienteFormRoot, ClienteFormSubmitButton } from '../../clientes/components/cliente-form'
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
    defaultValues: {},
    mode: 'all'
  })

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


  console.log('clienteMethods errors', clienteMethods.formState.errors)
  console.log('clienteMethods dirtyFields', clienteMethods.formState.isDirty)
  console.log('isvalid', clienteMethods.formState.isValid)
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
      form.append('email', data.email.map((email) => email.toLowerCase()).join(';'))
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
  return (
    <div className="mx-auto max-w-screen-xl">
      <Card className='py-10'>
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
