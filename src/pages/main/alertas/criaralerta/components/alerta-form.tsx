import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Controller, useFieldArray, UseFormReturn } from 'react-hook-form'
import { Textarea } from '@/components/ui/textarea'
import { useQuery } from '@tanstack/react-query'
import { AlertaSchema } from '@/schemas/alerta.schema'
import { getTipos } from '../../requests'
import { useGlobalParams } from '@/globals/GlobalParams'
import { Switch, Thumb } from '@radix-ui/react-switch'
import { FREQUENCIA_ENVIO_OPTIONS, TIPO_AGENDAMENTO_OPTIONS, TIPO_INTERVALO_OPTIONS } from '@/constants/alertas'
import { useMediaQuery } from 'react-responsive'
import { Settings, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useState } from 'react'

export const AlertaFormRoot = ({
  children,
  createAlertaMethods,
  onSubmitAlertaData
}: {
  createAlertaMethods: UseFormReturn<AlertaSchema>
  children: React.ReactNode
  onSubmitAlertaData: (data: AlertaSchema) => void
}) => {
  return <form onSubmit={createAlertaMethods.handleSubmit(onSubmitAlertaData)}>{children}</form>
}

export const AlertaFormContent = ({
  createAlertaMethods,
  disabled
}: {
  createAlertaMethods: UseFormReturn<AlertaSchema>
  disabled?: boolean
}) => {

  const isMobile = useMediaQuery({ query: '(max-width: 420px)' })
  const [agendaUnico, setAgendaUnico] = useState<boolean>(false);
  const glb_params = useGlobalParams();
  const [isOpenConfig, setIsOpenConfig] = useState(false);
  const [titulo, setTitulo] = useState("Informações do Boleto")
  const [campos, setCampos] = useState<{ check: boolean, campo: string, descricao: string }[]>([])
  const [selCampos, setSelCampos] = useState<string>("");
  const [selAlerta, setSelAlerta] = useState<number>(0);

  //const isPortrait = useMediaQuery({ query: '(min-width: 1224px)' })
  //const [selCondominio, setSelCondominio] = useState<boolean>(false);

  /*const handlerSelCondominio = () => {
    setSelCondominio(true);
  }*/

  //Consulta Tipo de alertas
  const {
    data: tipoAlerta
  } = useQuery({
    queryKey: ['tipoalerta'],
    queryFn: () => getTipos(glb_params.id_empresa ? Number(glb_params.id_empresa) : 0),
  });

  
  //Lista de campos
  const camposAlerta = useFieldArray({
    control: createAlertaMethods.control,
    name: 'campos'
  });


  const handlerChangeAgendamento = (value: string) => {

    if (value === 'UNICO') {
      setAgendaUnico(true);
    }
    else {
      setAgendaUnico(false);
    }
  }

  const handlerChangeAlerta = (value: string) => {
    if (selCampos.length > 0) {
      selCampos.split(";").forEach((campo) => {
        createAlertaMethods.setValue("textoAlerta", createAlertaMethods.getValues("textoAlerta").toString().replace("<" + campos.find((c) => c.campo === campo)?.descricao + ">", ""));
      });
    }
    setSelCampos('');
    setCampos(getCampos(Number(value)));
    if (camposAlerta.fields.length > 0) {
      camposAlerta.remove();
      setSelCampos('');
    }
  }

  const getCampos = (alertaId: number) => {
    let arr_campos: { check: boolean, campo: string, descricao: string }[] = [];

    let descAlerta = tipoAlerta?.data.find((tipo) => tipo.id === alertaId)?.descricao;

    setSelAlerta(alertaId);

    switch (descAlerta) {
      case "Aviso reajuste Locação":
        arr_campos = [
          { check: false, campo: "nome", descricao: "Nome do locatário" },          
          { check: false, campo: "diaVencimento", descricao: "Data de Vencimento" },
          { check: false, campo: "valorAluguel", descricao: "Valor Aluguel" },
          { check: false, campo: "imovel", descricao: "Imóvel" },
        ]
        break;

      case "Aviso renovação contrato":
        arr_campos = [
          { check: false, campo: "nome", descricao: "Nome do locatário" },
          { check: false, campo: "dataInicio", descricao: "Data de Início" },
          { check: false, campo: "dataFim", descricao: "Data Final" },
          { check: false, campo: "valorAluguel", descricao: "Valor Aluguel" },
          { check: false, campo: "email", descricao: "Email" },
          { check: false, campo: "imovel", descricao: "Imóvel" },
        ]
        break;

      case "Aviso seguro incêndio":
        arr_campos = [
          { check: false, campo: "nome", descricao: "Nome do locatário" },
          { check: false, campo: "vigenciaInicio", descricao: "Data de Início" },
          { check: false, campo: "vigenciaFim", descricao: "Data Final" },
          { check: false, campo: "numeroApolice", descricao: "Número da apólice" },
        ]
        break;

      case "Aviso vencimento boleto":
        arr_campos = [
          { check: false, campo: "dataEmissao", descricao: "Data de Emissão" },
          { check: false, campo: "dataVencimento", descricao: "Data de Vencimento" },
          { check: false, campo: "valorOriginal", descricao: "Valor Original" },
          { check: false, campo: "email", descricao: "Email" },
          { check: false, campo: "linkDocumento", descricao: "Link do Documento" },
          { check: false, campo: "linhaDigitavelBol", descricao: "Linha Digitável Boleto" },
          { check: false, campo: "linhaDigitavelLan", descricao: "Linha Digitável Lançamento" },
        ]
        break;

      case "Aviso boleto atrasado":
        arr_campos = [
          { check: false, campo: "dataEmissao", descricao: "Data de Emissão" },
          { check: false, campo: "dataVencimento", descricao: "Data de Vencimento" },
          { check: false, campo: "valorOriginal", descricao: "Valor Original" },
          { check: false, campo: "email", descricao: "Email" },
          { check: false, campo: "linkDocumento", descricao: "Link do Documento" },
          { check: false, campo: "linhaDigitavelBol", descricao: "Linha Digitável Boleto" },
          { check: false, campo: "linhaDigitavelLan", descricao: "Linha Digitável Lançamento" },
        ]
        break;

      default:
        arr_campos = []
    }
    return arr_campos.filter(x => !selCampos.includes(x.campo));
  };

  const handlerConfimaCampos = () => {
    setSelCampos(selCampos + campos.filter(x => x.check).map(x => x.campo).join(";"));
    campos.filter(x => x.check).forEach((campo) => {
      createAlertaMethods.setValue("textoAlerta", createAlertaMethods.getValues("textoAlerta") + "<" + campo.descricao + ">");
      camposAlerta.append({
        nome: campo.descricao,
        campo: campo.campo
      });
    });
    setTitulo("Informações do Boleto");
  }

  const handlerOpenCampos = () => {
    setCampos(getCampos(selAlerta));
    setIsOpenConfig(true);
  }

  const handlerRemoveCampo = (field: any, index: number) => {
    createAlertaMethods.setValue("textoAlerta", createAlertaMethods.getValues("textoAlerta").toString().replace("<" + field.nome + ">", ""));
    setSelCampos(selCampos.replace(field.campo + ";", "").replace(field.campo, ""));
    camposAlerta.remove(index);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4 font-[Poppins-Regular]">

        <div className={isMobile ? 'mt-2 mr-5 grid grid-cols-1' : 'mt-2 mr-5 grid grid-cols-2'}>
          <Label className='text-base font-[Poppins-Regular]'>
            Tipo de Alerta
            <div className='mt-2 border rounded-md pr-6'>
              <Controller
                name="alertaId"
                control={createAlertaMethods.control}

                render={({ field }) => (
                  <Select
                    disabled={disabled}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handlerChangeAlerta(value);
                    }}
                    value={String(field.value)}
                  >
                    <SelectTrigger className='h-6'>
                      <SelectValue placeholder="Tipo agendamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {tipoAlerta?.data.map((tipo) => (
                        <SelectItem key={tipo.id} value={tipo.id.toString()}>
                          {tipo.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {createAlertaMethods.formState.errors.alertaId?.message &&
                (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                  {createAlertaMethods.formState.errors.alertaId.message}
                </p>)}
            </div>
          </Label>
          <div className={isMobile ? 'flex items-center justify-start align-middle mt-7' : 'flex items-center justify-end align-middle mt-7'}>
            <label
              className="Label"
              htmlFor="boletos"
              style={{ paddingRight: 15, color : "#034869" }}
            >
              Ativo/Desativado
            </label>
            <Switch className="SwitchRoot focus:outline-none" id="boletos"
              checked={createAlertaMethods.getValues("ativo")}
              onCheckedChange={(checked) => { createAlertaMethods.setValue("ativo", checked) }}>
              <Thumb className="SwitchThumb" />
            </Switch>
          </div>

        </div>

        <div className='mt-2'>
          <Label htmlFor="name">Descrição</Label>
          <Input
            className="mt-2"
            type="text"
            disabled={disabled}
            placeholder="Descrição"
            {...createAlertaMethods.register('descricao')}
          />
        </div>


        <div className='mt-2'>
          <div className='grid grid-cols-2'>
            <Label className='mb-5 mt-2' htmlFor="name">Mensagem para envio</Label>
            <Settings className='justify-self-end cursor-pointer' size={18}
              onClick={() => { handlerOpenCampos() }}

            />
          </div>
          <Textarea placeholder="Texto do alerta "
            rows={10}
            {...createAlertaMethods.register('textoAlerta')}
          />

          <div className={(isMobile ? "grid grid-cols-2 gap-4 flex items-center" : "grid grid-cols-6 gap-4 flex items-center")}>
            {camposAlerta.fields.map((field, index) => (
              <div className='flex justify-between items-center gap-2 mt-2 border-solid border-2 border-gray-250 rounded p-1'>
                <Label >{field.nome}</Label>
                <button disabled={disabled}
                  className='border bg-zinc-200 hover:bg-zinc-400'
                  type="button"
                  onClick={() => handlerRemoveCampo(field, index)}
                >
                  <X className='px-1'></X>
                </button>
              </div>
            ))}
          </div>
        </div>

        {isOpenConfig && (
          <Dialog
            open={isOpenConfig}
            onOpenChange={(value) => {
              setIsOpenConfig(value);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{titulo}</DialogTitle>
                <DialogDescription>{titulo.includes('novo') ? 'Selecione um campo abaixo.' : ''}</DialogDescription>
                <div>
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="border-b p-2 text-left"></th>
                        <th className="border-b p-2 text-left">Campo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(campos && campos.length > 0) ? (
                        campos.map((campo) => (
                          <tr key={campo.campo} className="hover:bg-gray-300">
                            <td className="border-b p-2">
                              <Input
                                type="checkbox"
                                checked={campo.check}
                                onChange={() => {
                                  const newCampos = [...campos];
                                  const index = newCampos.findIndex((c) => c.campo === campo.campo);
                                  newCampos[index].check = !newCampos[index].check;
                                  setCampos(newCampos);
                                }}
                              />
                            </td>
                            <td className="border-b p-2">
                              {campo.descricao}
                            </td>
                          </tr>
                        ))) : (<tr><td className="border-b p-2 text-center" colSpan={2}>Nenhum campo disponível para configuração</td></tr>)}
                    </tbody>
                  </table>
                </div>
              </DialogHeader>
              <DialogFooter>
                {(campos && campos.length > 0) ? (
                  <Button className='bg-blue-500'
                    onClick={() => {
                      handlerConfimaCampos();
                      setIsOpenConfig(false);
                    }}
                  >Confirmar</Button>) : (<Button className='bg-red-500'
                    onClick={() => {
                      setIsOpenConfig(false);
                    }}
                  >Fechar</Button>)}
              </DialogFooter>

            </DialogContent>
          </Dialog>
        )}

        <div className='mt-2'>
          <Label className='text-base font-[Poppins-Regular]'>
            Tipo de Agendamento
            <div className="mt-2 border rounded-md pr-6">
              <Controller
                name="tipoAgendamento"
                control={createAlertaMethods.control}
                render={({ field }) => (
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      createAlertaMethods.setValue('tipoAgendamento', value);
                      handlerChangeAgendamento(value);
                    }}
                    value={field.value?.toString()}
                  >
                    <SelectTrigger className='h-6'>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPO_AGENDAMENTO_OPTIONS.map((tipo) => (
                        <SelectItem value={tipo.value}>{tipo.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {!!createAlertaMethods?.formState?.errors?.tipoAgendamento?.message && (
                <span>{createAlertaMethods?.formState?.errors?.tipoAgendamento?.message}</span>
              )}
            </div>
          </Label>
        </div>

        {!agendaUnico && (
          <>
            <div className='mt-2'>
              <Label>
                Frenquencia de envio
                <div className='mt-2 border rounded-md pr-6'>
                  <Controller
                    name="frequenciaEnvio"
                    control={createAlertaMethods.control}
                    render={({ field }) => (
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          createAlertaMethods.setValue('frequenciaEnvio', value);

                        }}
                        value={field.value?.toString()}
                      >
                        <SelectTrigger className='h-6'>
                          <SelectValue placeholder="Selecione a frequencia" />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCIA_ENVIO_OPTIONS.map((frequencia) => (
                            <SelectItem value={frequencia.value}>{frequencia.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {!!createAlertaMethods?.formState?.errors?.frequenciaEnvio?.message && (
                    <span>{createAlertaMethods?.formState?.errors?.frequenciaEnvio?.message}</span>
                  )}
                </div>
              </Label>
            </div>

            <div className='mt-2'>
              <Label>
                Tipo de intervalo
                <div className='mt-2 border rounded-md pr-6'>
                  <Controller
                    name="tipoIntervaloEnvio"
                    control={createAlertaMethods.control}
                    render={({ field }) => (
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value)
                          createAlertaMethods.setValue('tipoIntervaloEnvio', value);

                        }}
                        value={field.value?.toString()}
                      >
                        <SelectTrigger className='h-6'>
                          <SelectValue placeholder="Selecione o intervalo" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPO_INTERVALO_OPTIONS.map((intervalo) => (
                            <SelectItem value={intervalo.value}>{intervalo.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {!!createAlertaMethods?.formState?.errors?.tipoIntervaloEnvio?.message && (
                    <span>{createAlertaMethods?.formState?.errors?.tipoIntervaloEnvio?.message}</span>
                  )}
                </div>
              </Label>
            </div>
          </>
        )}

        {agendaUnico && (
          <div className="grid grid-cols-2 gap-4">
            <Label className="text-base">
              Data de início
              <Input
                type='date'
                className="mt-2"
                disabled={disabled}
                placeholder="Data de Início"
                {...createAlertaMethods.register('dataInicio')}
              />
              {createAlertaMethods.formState?.errors?.dataInicio?.message &&
                <p style={{ color: 'red', fontSize: '0.8rem' }}>*{createAlertaMethods.formState?.errors?.dataInicio?.message}</p>
              }
            </Label>
          </div>
        )}

        {!agendaUnico && (
          <div className="grid grid-cols-2 gap-4">
            <Label className='text-base font-[Poppins-Regular]'>
              Ocorrência a cada
              <Input
                className="mt-2"
                type="number"
                disabled={disabled}
                placeholder="Ocoorência a cada"
                {...createAlertaMethods.register('ocorreAcada')}
              />
              {createAlertaMethods.formState.errors.ocorreAcada?.message &&
                (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                  {createAlertaMethods.formState.errors.ocorreAcada.message}
                </p>)}
            </Label>


            <Label className='text-base font-[Poppins-Regular]'>
              Dias
              <Input
                className="mt-2"
                type="number"
                disabled={disabled}
                placeholder="1-9..1,2,9,10.."
                {...createAlertaMethods.register('grupoEnvio')}
              />
              {createAlertaMethods.formState.errors.grupoEnvio?.message &&
                (<p className='mt-2' style={{ color: '#ed535d', fontSize: '0.8rem' }}>*
                  {createAlertaMethods.formState.errors.grupoEnvio.message}
                </p>)}
            </Label>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Label className="text-base">
            Horário envio
            <Input
              type='time'
              className="mt-2"
              disabled={disabled}
              placeholder="Horário envio"
              {...createAlertaMethods.register('horarioEnvio')}
            />
            {createAlertaMethods.formState?.errors?.horarioEnvio?.message &&
              <p style={{ color: 'red', fontSize: '0.8rem' }}>*{createAlertaMethods.formState?.errors?.horarioEnvio?.message}</p>
            }
          </Label>
        </div>

        {!agendaUnico && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Label className="text-base">
                Horário inicial
                <Input
                  type='time'
                  className="mt-2"
                  disabled={disabled}
                  placeholder="Horário inicial"
                  {...createAlertaMethods.register('horarioInicial')}
                />
                {createAlertaMethods.formState?.errors?.horarioInicial?.message &&
                  <p style={{ color: 'red', fontSize: '0.8rem' }}>*{createAlertaMethods.formState?.errors?.horarioInicial?.message}</p>
                }
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Label className="text-base">
                Horário Final
                <Input
                  type='time'
                  className="mt-2"
                  disabled={disabled}
                  placeholder="Horário final"
                  {...createAlertaMethods.register('horarioFinal')}
                />
                {createAlertaMethods.formState?.errors?.horarioFinal?.message &&
                  <p style={{ color: 'red', fontSize: '0.8rem' }}>*{createAlertaMethods.formState?.errors?.horarioFinal?.message}</p>
                }
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Label className="text-base">
                Data inicial
                <Input
                  type='date'
                  className="mt-2"
                  disabled={disabled}
                  placeholder="Data inicial"
                  {...createAlertaMethods.register('dataInicioEnvio')}
                />
                {createAlertaMethods.formState?.errors?.dataInicioEnvio?.message &&
                  <p style={{ color: 'red', fontSize: '0.8rem' }}>*{createAlertaMethods.formState?.errors?.dataInicioEnvio?.message}</p>
                }
              </Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Label className="text-base">
                Data final
                <Input
                  type='date'
                  className="mt-2"
                  disabled={disabled}
                  placeholder="Data final"
                  {...createAlertaMethods.register('dataFinalEnvio')}
                />
                {createAlertaMethods.formState?.errors?.dataFinalEnvio?.message &&
                  <p style={{ color: 'red', fontSize: '0.8rem' }}>*{createAlertaMethods.formState?.errors?.dataFinalEnvio?.message}</p>
                }
              </Label>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export const AlertaFormSubmitButton = ({
  createAlertaMethods,
  disabled
}: {
  createAlertaMethods: UseFormReturn<AlertaSchema>
  disabled?: boolean
}) => {
  return (
    <div className="">
      <Button
        type="submit"
        size={"sm"}
        disabled={
          disabled
          ||
          !createAlertaMethods.formState.isDirty ||
          !createAlertaMethods.formState.isValid
        }
        className="mt-4 hover:bg-[#a9d9ef] hover:cursor-pointer bg-[#034869] hover:text-[#034869] text-white"
      >
        Criar Alerta
      </Button>
    </div>
  )
}

export const AlertaForm = {
  Root: AlertaFormRoot,
  FormContent: AlertaFormContent,
  SubmitButton: AlertaFormSubmitButton
}

