import { Card, CardContent } from '@/components/ui/card'
import { ROUTE } from '@/enums/routes.enum'
import { useToast } from '@/hooks/use-toast'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {  useNavigate } from 'react-router-dom'
import { useGlobalParams } from '@/globals/GlobalParams'
import { blocoSchema, BlocoSchema } from '@/schemas/bloco.schema'
import { BlocoForm } from './components/bloco-form'
import api from '@/services/axios/api'


//TODO: create a interface for created imovel

export const CriarBloco = () => {
  //Globals
  const glb_params = useGlobalParams();
  const navigate = useNavigate()
  const { toast } = useToast()

  //TODO: create the created imovel state
  //======CREATE IMOVEL METHODS======
  /*const [createdBloco, setCreatedBloco] = React.useState<Bloco | undefined>()
  const blocoId = createdBloco?.id

  const { data: bloco } = useQuery({
    enabled: !!blocoId,
    queryKey: ['bloco', blocoId],
    queryFn: () => getBloco(blocoId!)
  })

  //by priority, react query imovel is the updated imovel data
  const blocoData = bloco || createdBloco*/

  const createBlocoMethods = useForm<BlocoSchema>({
    resolver: zodResolver(blocoSchema),
    defaultValues: {
      empresaId: glb_params.id_empresa ? Number(glb_params.id_empresa) : 0,
    },
    mode: 'all'
  })

  const onSubmitBlocoData = async (data: BlocoSchema) => {
    try {
      console.log(data);
      const form = new FormData()

      if (data.name) {
        form.append('name', data.name)
      }

      if (data.observacao) {
        form.append('observacao', data.observacao.toString());
      }

      if (data.qtdUnidades) {
        form.append('qtdUnidades', data.qtdUnidades.toString());
      }

      if (data.totalAndares) {
        form.append('totalAndares', data.totalAndares.toString());
      }
      

      if (data.possuiElevador) {
        form.append('possuiElevador', data.possuiElevador.toString());
      }

      if (data.anoConstrucao) {
        form.append('anoConstrucao', data.anoConstrucao.toString());
      }

      if (data.condominioId) {
        form.append('condominioId', data.condominioId.toString());
      }

      form.append('empresaId', glb_params.id_empresa ? glb_params.id_empresa : "0");
      
      
      const dataObject = Object.fromEntries(form.entries());
      const jsonData = JSON.stringify(dataObject);
      console.log(jsonData);

      await api.post('blocos', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      /*const response = await api.post('blocos', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })*/

      //setCreatedBloco(response.data)
      //setCompletedSteps(new Set([currentStep]))
      //setCurrentStep('proprietario')

      //

      toast({ title: 'Bloco criado com sucesso' })
      //navigate(`${ROUTE.IMOVEIS}/${response.data.id}`)
      navigate(`${ROUTE.BLOCOS}`)

    } catch (error) {
      console.log(error);
      toast({
        title: 'Erro ao criar bloco',
        description: 'Não foi possível criar o bloco, tente novamente'
      })
    }
  }

  console.log('bloco dados', createBlocoMethods.formState.errors);

  return (
    <div className="scale mx-auto flex max-w-screen-xl transform flex-col items-center px-4 transition-transform">
      <div className="mb-8 flex w-full items-center justify-between">
      </div>
      <div className="mx-auto w-full rounded-md">
        <Card>
          <CardContent>
            <h2 className="mb-4 mt-8 text-xl font-bold">Criar um novo bloco</h2>
            {/* ======bloco====== */}
            <BlocoForm.Root
              createBlocoMethods={createBlocoMethods}
              onSubmitBlocoData={onSubmitBlocoData}
            >
              <BlocoForm.FormContent
                createBlocoMethods={createBlocoMethods}
              ></BlocoForm.FormContent>
              <BlocoForm.SubmitButton
                createBlocoMethods={createBlocoMethods}
              ></BlocoForm.SubmitButton>
            </BlocoForm.Root>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
