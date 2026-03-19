import { Card, CardContent } from '@/components/ui/card'
import { ROUTE } from '@/enums/routes.enum'
import { useToast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { CondominioForm } from './components/condominio-form'
import { condominioSchema, CondominioSchema } from '@/schemas/condominio.schema'
import { useGlobalParams } from '@/globals/GlobalParams'
import api from '@/services/axios/api'


//const CONDOMINIO_KNOWN_ERRORS = ['Condomínio já cadastrado']
//TODO: create a interface for created imovel

export const CriarCondominio = () => {
  //Globals
  const glb_params = useGlobalParams();
  const navigate = useNavigate()
  const { toast } = useToast()

  //TODO: create the created imovel state
  //======CREATE IMOVEL METHODS======
  /*const [createdCondominio, setCreatedCondominio] = React.useState<Condominio | undefined>()
  const condominioId = createdCondominio?.id

  const { data: condominio } = useQuery({
    enabled: !!condominioId,
    queryKey: ['condominio', condominioId],
    queryFn: () => getCondominio(condominioId!)
  })

  //by priority, react query imovel is the updated imovel data
  const imovelData = condominio || createdCondominio*/

  const createCondominioMethods = useForm<CondominioSchema>({
    resolver: zodResolver(condominioSchema),
    defaultValues: {
      empresaId: glb_params.id_empresa ? Number(glb_params.id_empresa) : 0,
    },
    mode: 'all'
  })

  const onSubmitCondominioData = async (data: CondominioSchema) => {
    try {
      console.log(data);
      const form = new FormData()

      if (data.name) {
        form.append('name', data.name)
      }

      if (data.observacao) {
        form.append('observacao', data.observacao.toString());
      }
      if (data.logradouro) {
        form.append('logradouro', data.logradouro)
      }

      if (data.numero) {
        form.append('numero', data.numero.toString())
      }

      if (data.complemento) {
        form.append('complemento', data.complemento)
      }

      if (data.bairro) {
        form.append('bairro', data.bairro)
      }

      if (data.cidade) {
        form.append('cidade', data.cidade)
      }

      if (data.cep) {
        form.append('cep', data.cep)
      }

      if (data.estado) {
        form.append('estado', data.estado)
      }

      if (data.formaRateio) {
        form.append('formaRateio', data.formaRateio)
      }

      form.append('empresaId', glb_params.id_empresa ? glb_params.id_empresa : "0");
      
      const dataObject = Object.fromEntries(form.entries());
      const jsonData = JSON.stringify(dataObject);
      console.log(jsonData);

      await api.post('condominios', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      /*const response = await api.post('condominios', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })*/

      //setCreatedCondominio(response.data)
      //setCompletedSteps(new Set([currentStep]))
      //setCurrentStep('proprietario')

      //

      toast({ title: 'Condomínio criado com sucesso' })
      //navigate(`${ROUTE.IMOVEIS}/${response.data.id}`)
      navigate(`${ROUTE.CONDOMINIOS}`)

    } catch (error) {
      console.log(error);
      toast({
        title: 'Erro ao criar condomínio',
        description: 'Não foi possível criar o condomínio, tente novamente'
      })
    }
  }

  console.log('condominio dados', createCondominioMethods.formState.errors);

  return (
    <div className="scale mx-auto flex max-w-screen-xl transform flex-col items-center px-4 transition-transform">
      <div className="mb-8 flex w-full items-center justify-between">
      </div>
      <div className="mx-auto w-full rounded-md">
        <Card>
          <CardContent>
            <h2 className="mb-4 mt-8 text-xl font-bold">Criar um novo condomínio</h2>

            {/* ======condomínio====== */}
            <CondominioForm.Root
              createCondominioMethods={createCondominioMethods}
              onSubmitCondominioData={onSubmitCondominioData}
            >
              <CondominioForm.FormContent
                createCondominioMethods={createCondominioMethods}
              ></CondominioForm.FormContent>
              <CondominioForm.SubmitButton
                createCondominioMethods={createCondominioMethods}
              ></CondominioForm.SubmitButton>
            </CondominioForm.Root>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
