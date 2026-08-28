import { Check, Pencil, Plus, Trash2 } from 'lucide-react'
import * as React from 'react'

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
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { Permission, User } from '@/interfaces/user'
import { cn } from '@/lib/utils'
import api from '@/services/axios/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'

export const permissions: { value: Permission; label: string }[] = [
  { value: 'ALL', label: 'Todas as permissões' },

  /*Empresa */
  { value: 'UPDATE_EMPRESA', label: 'Atualizar Empresa' },
  { value: 'VIEW_EMPRESAS', label: 'Ver Empresas' },

  //Alertas
  { value: 'CREATE_ALERTA', label: 'Criar Alertas' },
  { value: 'UPDATE_ALERTA', label: 'Atulizar Alertas' },
  { value: 'DELETE_ALERTA', label: 'Excluir Alertas' },
  { value: 'VIEW_ALERTAS', label: 'Ver Alertas' },

  //Conta corrente
  { value: 'CREATE_CONTA_CORRENTE', label: 'Criar Conta corrente' },
  { value: 'UPDATE_CONTA_CORRENTE', label: 'Atualizar Conta corrente' },
  { value: 'DELETE_CONTA_CORRENTE', label: 'Excluir Conta corrente' },
  { value: 'VIEW_CONTAS_CORRENTE', label: 'Ver Conta corrente' },

  /*Tipo de Lançamento */
  { value: 'CREATE_TIPO_LANC', label: 'Criar Tipo de Lançamento' },
  { value: 'UPDATE_TIPO_LANC', label: 'Atualizar Tipo de Lançamento' },
  { value: 'DELETE_TIPO_LANC', label: 'Excluir Tipo de Lançamento' },
  { value: 'VIEW_TIPOS_LANC', label: 'Ver Tipos de Lançamento' },

  /*Tipo de Imóvel */
  { value: 'CREATE_TIPO', label: 'Criar Tipo de imóvel' },
  { value: 'UPDATE_TIPO', label: 'Atualizar Tipo de imóvel' },
  { value: 'DELETE_TIPO', label: 'Excluir Tipo de imóvel' },
  { value: 'VIEW_TIPOS', label: 'Ver Tipos de Imóvel' },

  /*Condomínio */
  { value: 'CREATE_CONDOMINIO', label: 'Criar Condomínio' },
  { value: 'UPDATE_CONDOMINIO', label: 'Atualizar Condomínio' },
  { value: 'DELETE_CONDOMINIO', label: 'Excluir Condomínio' },
  { value: 'VIEW_CONDOMINIOS', label: 'Ver Condomínios' },

  /*Bloco */
  { value: 'CREATE_BLOCO', label: 'Criar Bloco' },
  { value: 'UPDATE_BLOCO', label: 'Atualizar Bloco' },
  { value: 'DELETE_BLOCO', label: 'Excluir Bloco' },
  { value: 'VIEW_BLOCOS', label: 'Ver Blocos' },

  /* Imóvel */
  { value: 'CREATE_IMOVEL', label: 'Criar Imóvel' },
  { value: 'UPDATE_IMOVEL', label: 'Atualizar Imóvel' },
  { value: 'DELETE_IMOVEL', label: 'Deletar Imóvel' },
  { value: 'VIEW_IMOVELS', label: 'Visualizar Imóveis' },

  /* Locatários */
  { value: 'CREATE_LOCATARIO', label: 'Criar Locatário' },
  { value: 'UPDATE_LOCATARIO', label: 'Atualizar locatário' },
  { value: 'DELETE_LOCATARIO', label: 'Excluir Locatário' },
  { value: 'VIEW_LOCATARIOS', label: 'Ver Locatários' },

  /* Clientes */
  { value: 'CREATE_PESSOA', label: 'Criar Pessoa' },
  { value: 'UPDATE_PESSOA', label: 'Atualizar Pessoa' },
  { value: 'DELETE_PESSOA', label: 'Excluir Pessoa' },
  { value: 'VIEW_PESSOAS', label: 'Ver Pessoas' },

  /* Proprietários */
  { value: 'CREATE_PROPRIETARIO', label: 'Criar Proprietário' },
  { value: 'UPDATE_PROPRIETARIO', label: 'Atualizar Proprietário' },
  { value: 'DELETE_PROPRIETARIO', label: 'Excluir Proprietário' },
  { value: 'VIEW_PROPRIETARIOS', label: 'Ver Proprietários' },

  /* Locações */
  { value: 'CREATE_LOCACAO', label: 'Criar Locação' },
  { value: 'UPDATE_LOCACAO', label: 'Atualizar Locação' },
  { value: 'DELETE_LOCACAO', label: 'Excluir Locação' },
  { value: 'VIEW_LOCACOES', label: 'Ver Locações' },

  /* Lançamentos imóveis */
  { value: 'CREATE_LANCAMENTO_IMOVEL', label: 'Criar Lançamento de Imóvel' },
  { value: 'UPDATE_LANCAMENTO_IMOVEL', label: 'Atualizar Lançamento de Imóvel' },
  { value: 'DELETE_LANCAMENTO_IMOVEL', label: 'Excluir Lançamento de Imóvel' },
  { value: 'VIEW_LANCAMENTOS_IMOVEIS', label: 'Ver Lançamentos de Imóvel' },

  /* Lançamentos locações */
  { value: 'CREATE_LOCACAO_LANCAMENTO', label: 'Criar Lançamento' },
  { value: 'UPDATE_LOCACAO_LANCAMENTO', label: 'Atualizar Lançamento' },
  { value: 'DELETE_LOCACAO_LANCAMENTO', label: 'Excluir Lançamento' },
  { value: 'VIEW_LOCACAO_LANCAMENTOS', label: 'Ver Lançamentos' },

  /* Lançamentos condomínios */
  { value: 'CREATE_CONDOMINIO_LANCAMENTO', label: 'Criar Lançamento de Condomínio' },
  { value: 'UPDATE_CONDOMINIO_LANCAMENTO', label: 'Atualizar Lançamento de Condomínio' },
  { value: 'DELETE_CONDOMINIO_LANCAMENTO', label: 'Excluir Lançamento de Condomínio' },
  { value: 'VIEW_CONDOMINIO_LANCAMENTOS', label: 'Ver Lançamentos de Condomínio' },

  /* Boletos */
  { value: 'CREATE_PAGAMENTO', label: 'Criar Pagamento' },
  { value: 'UPDATE_PAGAMENTO', label: 'Atualizar pagamento' },
  { value: 'DELETE_PAGAMENTO', label: 'Excluir Pagamento' },
  { value: 'VIEW_PAGAMENTOS', label: 'Ver Pagamentos' },

  //Boleto bancario
  { value: 'CREATE_BOLETO_BANCARIO', label: 'Criar Boleto bancário' },
  { value: 'UPDATE_BOLETO_BANCARIO', label: 'Atualizar Boleto bancário' },
  { value: 'DELETE_BOLETO_BANCARIO', label: 'Excluir Boleto bancário' },
  { value: 'VIEW_BOLETO_BANCARIO', label: 'Ver Boleto bancário' },

  /* Moradores */
  { value: 'CREATE_MORADOR', label: 'Criar Morador' },
  { value: 'UPDATE_MORADOR', label: 'Atualizar Morador' },
  { value: 'DELETE_MORADOR', label: 'Excluir Morador' },
  { value: 'VIEW_MORADORES', label: 'Ver Moradores' },

  //Tipo de alerta
  { value: 'CREATE_TIPO_ALERTA', label: 'Criar Tipo de Alerta' },
  { value: 'UPDATE_TIPO_ALERTA', label: 'Atualizar Tipo de Alerta' },
  { value: 'DELETE_TIPO_ALERTA', label: 'Excluir Tipo de Alerta' },
  { value: 'VIEW_TIPOS_ALERTA', label: 'Ver Tipo de Alerta' },

  //Instrucao de cobrança
  { value: 'CREATE_INSTRUCAO_COBRANCA', label: 'Criar Instrução de cobrança' },
  { value: 'UPDATE_INSTRUCAO_COBRANCA', label: 'Atualizar Instrução de cobrança' },
  { value: 'DELETE_INSTRUCAO_COBRANCA', label: 'Excluir Instrução de cobrança' },
  { value: 'VIEW_INSTRUCOES_COBRANCA', label: 'Ver Instrução de cobrança' },

  //Instrução de recebimento
  { value: 'CREATE_INSTRUCAO_RECEBIMENTO', label: 'Criar Instrução de recebimentos' },
  { value: 'UPDATE_INSTRUCAO_RECEBIMENTO', label: 'Atualizar Instrução de recebimentos' },
  { value: 'DELETE_INSTRUCAO_RECEBIMENTO', label: 'Excluir Instrução de recebimentos' },
  { value: 'VIEW_INSTRUCOES_RECEBIMENTO', label: 'Ver Instrução de recebimentos' },

  //Carteira de cobrança
  { value: 'CREATE_CARTEIRA_COBRANCA', label: 'Criar Carteira de cobrança' },
  { value: 'UPDATE_CARTEIRA_COBRANCA', label: 'Atualizar Carteira de cobrança' },
  { value: 'DELETE_CARTEIRA_COBRANCA', label: 'Excluir Carteira de cobrança' },
  { value: 'VIEW_CARTEIRAS_COBRANCA', label: 'Ver Carteira de cobrança' },

  //Espécie de cobrança
  { value: 'CREATE_ESPECIE_COBRANCA', label: 'Criar Espécie de cobrança' },
  { value: 'UPDATE_ESPECIE_COBRANCA', label: 'Atualizar Espécie de cobrança' },
  { value: 'DELETE_ESPECIE_COBRANCA', label: 'Excluir Espécie de cobrança' },
  { value: 'VIEW_ESPECIES_COBRANCA', label: 'Ver Espécie de cobrança' },

  //Banco
  { value: 'CREATE_BANCO', label: 'Criar Banco' },
  { value: 'UPDATE_BANCO', label: 'Atualizar Banco' },
  { value: 'DELETE_BANCO', label: 'Excluir Banco' },
  { value: 'VIEW_BANCOS', label: 'Ver Banco' },

  //Tipo de juros
  { value: 'CREATE_TIPO_JUROS', label: 'Criar Tipo de Juros' },
  { value: 'UPDATE_TIPO_JUROS', label: 'Atualizar Tipo de Juros' },
  { value: 'DELETE_TIPO_JUROS', label: 'Excluir Tipo de Juros' },
  { value: 'VIEW_TIPOS_JUROS', label: 'Ver Tipo de Juros' },

  //Tipo de multa
  { value: 'CREATE_TIPO_MULTA', label: 'Criar Tipo de Multa' },
  { value: 'UPDATE_TIPO_MULTA', label: 'Atualizar Tipo de Multa' },
  { value: 'DELETE_TIPO_MULTA', label: 'Excluir Tipo de Multa' },
  { value: 'VIEW_TIPOS_MULTA', label: 'Ver Tipo de Multa' },

  //Tipo de desconto
  { value: 'CREATE_TIPO_DESCONTOS', label: 'Criar Tipo de Desconto' },
  { value: 'UPDATE_TIPO_DESCONTOS', label: 'Atualizar Tipo de Desconto' },
  { value: 'DELETE_TIPO_DESCONTOS', label: 'Excluir Tipo de Desconto' },
  { value: 'VIEW_TIPOS_DESCONTOS', label: 'Ver Tipo de Desconto' },

  //Tipo de AUTORIZACAO
  { value: 'CREATE_TIPO_AUTORIZACAO', label: 'Criar Tipo de Autorização' },
  { value: 'UPDATE_TIPO_AUTORIZACAO', label: 'Atualizar Tipo de Autorização' },
  { value: 'DELETE_TIPO_AUTORIZACAO', label: 'Excluir Tipo de Autorização' },
  { value: 'VIEW_TIPO_AUTORIZACAO', label: 'Ver Tipo de Autorização' },

  /* Clientes */
  { value: 'CREATE_CLIENTE', label: 'Criar Cliente' },
  { value: 'UPDATE_CLIENTE', label: 'Atualizar Cliente' },
  { value: 'DELETE_CLIENTE', label: 'Excluir Cliente' },
  { value: 'VIEW_CLIENTES', label: 'Ver Clientes' },

]

const condominioPermissions: { value: Permission; label: string }[] = [
  { value: 'CREATE_CONDOMINIO', label: 'Criar Condomínio' },
  { value: 'UPDATE_CONDOMINIO', label: 'Atualizar Condomínio' },
  { value: 'DELETE_CONDOMINIO', label: 'Excluir Condomínio' },
  { value: 'VIEW_CONDOMINIOS', label: 'Ver Condomínios' }
]

const blocoPermissions: { value: Permission; label: string }[] = [
  { value: 'CREATE_BLOCO', label: 'Criar Bloco' },
  { value: 'UPDATE_BLOCO', label: 'Atualizar Bloco' },
  { value: 'DELETE_BLOCO', label: 'Excluir Bloco' },
  { value: 'VIEW_BLOCOS', label: 'Ver Blocos' }
]

const imoveisPermissions: { value: Permission; label: string }[] = [
  { value: 'CREATE_IMOVEL', label: 'Criar Imóvel' },
  { value: 'UPDATE_IMOVEL', label: 'Atualizar Imóvel' },
  { value: 'DELETE_IMOVEL', label: 'Deletar Imóvel' },
  { value: 'VIEW_IMOVELS', label: 'Visualizar Imóveis' }
]

const proprietariosPermissions: { value: Permission; label: string }[] = [
  { value: 'CREATE_PROPRIETARIO', label: 'Criar Proprietário' },
  { value: 'UPDATE_PROPRIETARIO', label: 'Atualizar Proprietário' },
  { value: 'DELETE_PROPRIETARIO', label: 'Excluir Proprietário' },
  { value: 'VIEW_PROPRIETARIOS', label: 'Ver Proprietários' }
]

const pessoasPermissions: { value: Permission; label: string }[] = [
  { value: 'CREATE_PESSOA', label: 'Criar Cliente' },
  { value: 'UPDATE_PESSOA', label: 'Atualizar Cliente' },
  { value: 'DELETE_PESSOA', label: 'Excluir Cliente' },
  { value: 'VIEW_PESSOAS', label: 'Ver Clientes' }
]

const tipoImovelPermissions: { value: Permission; label: string }[] = [
  { value: 'CREATE_TIPO', label: 'Criar Tipo imóvel' },
  { value: 'UPDATE_TIPO', label: 'Atualizar Tipo imóvel' },
  { value: 'DELETE_TIPO', label: 'Excluir Tipo imóvel' },
  { value: 'VIEW_TIPOS', label: 'Ver Tipos imóvel' }
]

const TIPO_LANCPermissions: { value: Permission; label: string }[] = [
  { value: 'CREATE_TIPO_LANC', label: 'Criar Tipo de Lançamento' },
  { value: 'UPDATE_TIPO_LANC', label: 'Atualizar Tipo de Lançamento' },
  { value: 'DELETE_TIPO_LANC', label: 'Excluir Tipo de Lançamento' },
  { value: 'VIEW_TIPOS_LANC', label: 'Ver Tipos de Lançamento' }
]

/*const clientesPermissions: { value: Permission; label: string }[] = [
  { value: 'CREATE_CLIENTE', label: 'Criar Cliente' },
  { value: 'UPDATE_CLIENTE', label: 'Atualizar Cliente' },
  { value: 'DELETE_CLIENTE', label: 'Excluir Cliente' },
  { value: 'VIEW_CLIENTES', label: 'Ver Clientes' }
]*/

const lancamentoPermissions: { value: Permission; label: string }[] = [
  { value: 'CREATE_LOCACAO_LANCAMENTO', label: 'Criar Lançamento' },
  { value: 'UPDATE_LOCACAO_LANCAMENTO', label: 'Atualizar Lançamento' },
  { value: 'DELETE_LOCACAO_LANCAMENTO', label: 'Excluir Lançamento' },
  { value: 'VIEW_LOCACAO_LANCAMENTOS', label: 'Ver Lançamentos' }
]

const pagamentoPermissions: { value: Permission; label: string }[] = [
  { value: 'CREATE_PAGAMENTO', label: 'Criar Pagamento' },
  { value: 'UPDATE_PAGAMENTO', label: 'Atualizar Pagamento' },
  { value: 'DELETE_PAGAMENTO', label: 'Excluir Pagamento' },
  { value: 'VIEW_PAGAMENTOS', label: 'Ver Pagamentos' }
]

const locacoesPermissions: { value: Permission; label: string }[] = [
  { value: 'CREATE_LOCACAO', label: 'Criar Locação' },
  { value: 'UPDATE_LOCACAO', label: 'Atualizar Locação' },
  { value: 'DELETE_LOCACAO', label: 'Excluir Locação' },
  { value: 'VIEW_LOCACOES', label: 'Ver Locações' }
]

/*const locatariosPermissions: { value: Permission; label: string }[] = [
  { value: 'CREATE_LOCATARIO', label: 'Criar Locatário' },
  { value: 'UPDATE_LOCATARIO', label: 'Atualizar locatário' },
  { value: 'DELETE_LOCATARIO', label: 'Excluir Locatário' },
  { value: 'VIEW_LOCATARIOS', label: 'Ver Locatários' }
]*/

const LancCondominioPermissions: { value: Permission; label: string }[] = [
  { value: 'CREATE_CONDOMINIO_LANCAMENTO', label: 'Criar Lançamento' },
  { value: 'UPDATE_CONDOMINIO_LANCAMENTO', label: 'Atualizar Lançamento' },
  { value: 'DELETE_CONDOMINIO_LANCAMENTO', label: 'Excluir Lançamento' },
  { value: 'VIEW_CONDOMINIO_LANCAMENTOS', label: 'Ver Lançamentos' }
]

const LancImovelPermissions: { value: Permission; label: string }[] = [
  { value: 'CREATE_LANCAMENTO_IMOVEL', label: 'Criar Lançamento' },
  { value: 'UPDATE_LANCAMENTO_IMOVEL', label: 'Atualizar Lançamento' },
  { value: 'DELETE_LANCAMENTO_IMOVEL', label: 'Excluir Lançamento' },
  { value: 'VIEW_LANCAMENTOS_IMOVEIS', label: 'Ver Lançamentos' }
]

const moradorPermissions: { value: Permission; label: string }[] = [
  { value: 'CREATE_MORADOR', label: 'Criar Morador' },
  { value: 'UPDATE_MORADOR', label: 'Atualizar Morador' },
  { value: 'DELETE_MORADOR', label: 'Excluir Morador' },
  { value: 'VIEW_MORADORES', label: 'Ver Moradores' }
]

//Alertas
const alertaPermissions: { value: Permission; label: string }[] = [
  { value: 'CREATE_ALERTA', label: 'Criar Alertas' },
  { value: 'UPDATE_ALERTA', label: 'Atulizar Alertas' },
  { value: 'DELETE_ALERTA', label: 'Excluir Alertas' },
  { value: 'VIEW_ALERTAS', label: 'Ver Alertas' },
]

//Conta corrente
const contacorrentePermissions: { value: Permission; label: string }[] = [
  { value: 'CREATE_CONTA_CORRENTE', label: 'Criar Conta corrente' },
  { value: 'UPDATE_CONTA_CORRENTE', label: 'Atualizar Conta corrente' },
  { value: 'DELETE_CONTA_CORRENTE', label: 'Excluir Conta corrente' },
  { value: 'VIEW_CONTAS_CORRENTE', label: 'Ver Conta corrente' },
]

//Boleto bancario
const boletobancarioPermissions: { value: Permission; label: string }[] = [
  { value: 'CREATE_BOLETO_BANCARIO', label: 'Criar Boleto bancário' },
  { value: 'UPDATE_BOLETO_BANCARIO', label: 'Atualizar Boleto bancário' },
  { value: 'DELETE_BOLETO_BANCARIO', label: 'Excluir Boleto bancário' },
  { value: 'VIEW_BOLETO_BANCARIO', label: 'Ver Boleto bancário' },
]


const loginSchema = z.object({
  login: z
    .string()
    .min(1, { message: 'Login é obrigatório' }),
  password: z.string().min(8, { message: 'A senha deve possuir no mínimo 8 caracteres incluindo , letras maiúculas, minúsculas, números e caracteres especiais (@#$%)' })
})

//type LoginSchema = z.infer<typeof loginSchema>

export const getUsers = async (empresaId?: number) => {
  const response = await api.get<User[]>(`/users/collaborators/${empresaId}`)
  return response;
}

export const createUser = ({
  login,
  name,
  email,
  password,
  permissions = [],
  empresaId,
}: {
  login: string
  name: string
  email: string
  password: string
  permissions: Permission[],
  empresaId?: number
}) => {
  return api.post('/users', {
    login: login,
    name: name,
    email: email,
    password: password,
    permissions: permissions,
    empresaId: empresaId
  })
}

export const putUpdateUser = (userData: {
  id: string
  login: string
  name: string
  email: string
  password: string
  permissions: Permission[],
  empresaId?: number
}) => {

  console.log('userData', userData);
  return api.put(`/users/${userData.id}`, userData)
}

enum QueryKeys {
  USERS_LIST
}

import { PageLoader } from '@/pages/assistant/page-loader'
import axios from 'axios'
import { useGlobalParams } from '@/globals/GlobalParams'

/*const createUserSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  email: z.string().email('Insira um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.')
})

const updateUserSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'O nome é obrigatório.'),
  email: z.string().email('Insira um e-mail válido.'),
  permissions: z.array(
    z.enum([
      'ALL',
      'CREATE_IMOVEL',
      'UPDATE_IMOVEL',
      'DELETE_IMOVEL',
      'VIEW_IMOVELS',
      'CREATE_LOCATARIO',
      'UPDATE_LOCATARIO',
      'DELETE_LOCATARIO',
      'VIEW_LOCATARIOS',
      'CREATE_PROPRIETARIO',
      'UPDATE_PROPRIETARIO',
      'DELETE_PROPRIETARIO',
      'VIEW_PROPRIETARIOS',
      'CREATE_LOCACAO',
      'UPDATE_LOCACAO',
      'DELETE_LOCACAO',
      'VIEW_LOCACOES'
    ])
  )
})*/

export const ListarColaboradores = () => {
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)
  const [userPermissions, setUserPermissions] = React.useState<Permission[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [newUser, setNewUser] = React.useState({ login: '', name: '', email: '', password: '' })
  const { toast } = useToast()
  const queryClient = useQueryClient()
  //Globals
  const glb_params = useGlobalParams();

  const { data: usersData, isLoading } = useQuery({
    queryKey: [QueryKeys.USERS_LIST],
    queryFn: () => getUsers(glb_params.id_empresa ? Number(glb_params.id_empresa) : 0)
  })

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.USERS_LIST]
      })
      toast({
        title: 'Usuário criado',
        description: 'O novo usuário foi criado com sucesso.'
      })
      setIsCreateDialogOpen(false)
      setNewUser({ login: '', name: '', email: '', password: '' })
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        // Check if there's a response and data within the error
        if (error.response && error.response.data) {
          console.error('Error message from server:', error.response.data);
          toast({
            title: 'Erro ao criar colaborador',
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
          description: error instanceof Error ? error.message : 'Ocorreu um erro ao criar o usuário. Tente novamente.',
          variant: 'destructive'
        })
      }

    }
  })

  const updateUserMutation = useMutation({
    mutationFn: putUpdateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.USERS_LIST]
      })
      toast({
        title: 'Usuário atualizado',
        description: 'As informações do usuário foram atualizadas com sucesso.'
      })
      setIsEditDialogOpen(false)
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        // Check if there's a response and data within the error
        if (error.response && error.response.data) {
          console.error('Error message from server:', error.response.data);
          toast({
            title: 'Erro ao atualizar colaborador',
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
          description: error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar o usuário. Tente novamente.',
          variant: 'destructive'
        })
      }
    }
  })

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.USERS_LIST]
      })
      toast({
        title: 'Usuário excluído',
        description: 'O usuário foi excluído com sucesso.'
      })
      setSelectedUser(null)
    },
    onError: () => {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao excluir o usuário. Tente novamente.',
        variant: 'destructive'
      })
    }
  })

  const users = usersData?.data
  console.log('usersData', usersData);

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    setUserPermissions(user.permissions)
  }

  const handlePermissionChange = (checked: boolean, permission: Permission) => {
    // setUserPermissions((prevPermissions) => {
    //   if (permission === 'ALL') {
    //     return checked ? ['ALL'] : []
    //   } else {
    //     if (checked) {
    //       return [...(prevPermissions || []), permission]
    //     } else {
    //       return prevPermissions.filter((p) => p !== permission)
    //     }
    //   }
    // })
    //
    if (permission?.includes('EMPRESA')) {
      if (permission !== 'VIEW_EMPRESAS') {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission, 'VIEW_EMPRESAS']
          } else {
            return prevPermissions.filter((p) => p !== permission)
          }
        })
      } else {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission]
          } else {
            return prevPermissions.filter((p) => !p.includes('EMPRESA'))
          }
        })
      }
    }

    if (permission?.includes('CONTA_CORRENTE')) {
      if (permission !== 'VIEW_CONTAS_CORRENTE') {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission, 'VIEW_CONTAS_CORRENTE']
          } else {
            return prevPermissions.filter((p) => p !== permission)
          }
        })
      } else {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission]
          } else {
            return prevPermissions.filter((p) => !p.includes('CONTA_CORRENTE'))
          }
        })
      }
    }

    if (permission?.includes('ALERTA')) {
      if (permission !== 'VIEW_ALERTAS') {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission, 'VIEW_ALERTAS']
          } else {
            return prevPermissions.filter((p) => p !== permission)
          }
        })
      } else {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission]
          } else {
            return prevPermissions.filter((p) => !p.includes('ALERTA'))
          }
        })
      }
    }

    if (permission?.endsWith('_TIPO') || permission?.endsWith('_TIPOS')) {
      if (permission !== 'VIEW_TIPOS') {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission, 'VIEW_TIPOS']
          } else {
            return prevPermissions.filter((p) => p !== permission)
          }
        })
      } else {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission]
          } else {
            return prevPermissions.filter((p) => !p?.endsWith('_TIPO') || !p?.endsWith('_TIPOS'))

          }
        })
      }
    }

    if (permission?.includes('TIPO_LANC') || permission?.endsWith('TIPOS_LANC')) {
      if (permission !== 'VIEW_TIPOS_LANC') {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission, 'VIEW_TIPOS_LANC']
          } else {
            return prevPermissions.filter((p) => p !== permission)
          }
        })
      } else {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission]
          } else {
            return prevPermissions.filter((p) => !p.includes('TIPO_LANC'))
          }
        })
      }
    }

    if (permission?.includes('IMOVEL')) {
      if (permission !== 'VIEW_IMOVELS') {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission, 'VIEW_IMOVELS']
          } else {
            return prevPermissions.filter((p) => p !== permission)
          }
        })
      } else {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission]
          } else {
            return prevPermissions.filter((p) => !p.includes('IMOVEL'))
          }
        })
      }
    }

    if (permission?.includes('LOCATARIO')) {
      if (permission !== 'VIEW_LOCATARIOS') {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission, 'VIEW_LOCATARIOS']
          } else {
            return prevPermissions.filter((p) => p !== permission)
          }
        })
      } else {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission]
          } else {
            return prevPermissions.filter((p) => !p.includes('LOCATARIO'))
          }
        })
      }
    }

    if (permission?.includes('PROPRIETARIO')) {
      if (permission !== 'VIEW_PROPRIETARIOS') {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission, 'VIEW_PROPRIETARIOS']
          } else {
            return prevPermissions.filter((p) => p !== permission)
          }
        })
      } else {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission]
          } else {
            return prevPermissions.filter((p) => !p.includes('PROPRIETARIO'))
          }
        })
      }
    }

    if (permission?.endsWith('LOCACAO') || permission?.endsWith('LOCACOES')) {
      if (permission !== 'VIEW_LOCACOES') {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission, 'VIEW_LOCACOES']
          } else {
            return prevPermissions.filter((p) => p !== permission)
          }
        })
      } else {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission]
          } else {
            return prevPermissions.filter((p) => !p.includes('LOCAC'))
          }
        })
      }
    }

    if (permission?.endsWith('_LOCACAO_LANCAMENTO') || permission?.endsWith('_LOCACAO_LANCAMENTOS')) {
      if (permission !== 'VIEW_LOCACAO_LANCAMENTOS') {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission, 'VIEW_LOCACAO_LANCAMENTOS']
          } else {
            return prevPermissions.filter((p) => p !== permission)
          }
        })
      } else {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission]
          } else {
            //return prevPermissions.filter((p) => !p.includes('LANCAMENTO'))
            return prevPermissions.filter((p) => !p?.endsWith('_LOCACAO_LANCAMENTO') || !p?.endsWith('_LOCACAO_LANCAMENTOS'))

          }
        })
      }
    }

    if (permission?.includes('PESSOA')) {
      if (permission !== 'VIEW_PESSOAS') {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission, 'VIEW_PESSOAS']
          } else {
            return prevPermissions.filter((p) => p !== permission)
          }
        })
      } else {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission]
          } else {
            return prevPermissions.filter((p) => !p.includes('PESSOA'))
          }
        })
      }
    }

    if (permission?.includes('PAGAMENTO')) {
      if (permission !== 'VIEW_PAGAMENTOS') {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission, 'VIEW_PAGAMENTOS']
          } else {
            return prevPermissions.filter((p) => p !== permission)
          }
        })
      } else {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission]
          } else {
            return prevPermissions.filter((p) => !p.includes('PAGAMENTO'))
          }
        })
      }
    }

    if (permission?.endsWith('_CONDOMINIO') || permission?.endsWith('_CONDOMINIOS')) {
      if (permission !== 'VIEW_CONDOMINIOS') {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission, 'VIEW_CONDOMINIOS']
          } else {
            return prevPermissions.filter((p) => p !== permission)
          }
        })
      } else {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission]
          } else {
            return prevPermissions.filter((p) => !p?.endsWith('_CONDOMINIO') || !p?.endsWith('_CONDOMINIOS'))

          }
        })
      }
    }

    if (permission?.includes('BLOCO')) {
      if (permission !== 'VIEW_BLOCOS') {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission, 'VIEW_PAGAMENTOS']
          } else {
            return prevPermissions.filter((p) => p !== permission)
          }
        })
      } else {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission]
          } else {
            return prevPermissions.filter((p) => !p.includes('BLOCO'))
          }
        })
      }
    }

    if (permission?.includes('CONDOMINIO_LANCAMENTO') || permission?.includes('LANCAMENTOS_CONDOMINIOS')) {
      if (permission !== 'VIEW_CONDOMINIO_LANCAMENTOS') {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission, 'VIEW_CONDOMINIO_LANCAMENTOS']
          } else {
            return prevPermissions.filter((p) => p !== permission)
          }
        })
      } else {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission]
          } else {
            return prevPermissions.filter((p) => !p?.includes('CONDOMINIO_LANCAMENTO') || !p?.includes('CONDOMINIO_LANCAMENTOS'))
          }
        })
      }
    }

    if (permission?.includes('LANCAMENTO_IMOVEL') || permission?.includes('LANCAMENTOS_IMOVEIS')) {
      if (permission !== 'VIEW_LANCAMENTOS_IMOVEIS') {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission, 'VIEW_LANCAMENTOS_IMOVEIS']
          } else {
            return prevPermissions.filter((p) => p !== permission)
          }
        })
      } else {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission]
          } else {
            return prevPermissions.filter((p) => !p?.includes('LANCAMENTO_IMOVEL') || !p?.includes('LANCAMENTOS_IMOVEIS'))
          }
        })
      }
    }

    if (permission?.includes('MORADOR')) {
      if (permission !== 'VIEW_MORADORES') {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission, 'VIEW_MORADORES']
          } else {
            return prevPermissions.filter((p) => p !== permission)
          }
        })
      } else {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission]
          } else {
            return prevPermissions.filter((p) => !p.includes('MORADOR'))
          }
        })
      }
    }

    if (permission?.includes('BOLETO_BANCARIO')) {
      if (permission !== 'VIEW_BOLETO_BANCARIO') {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission, 'VIEW_BOLETO_BANCARIO']
          } else {
            return prevPermissions.filter((p) => p !== permission)
          }
        })
      } else {
        setUserPermissions((prevPermissions) => {
          if (checked) {
            return [...(prevPermissions || []), permission]
          } else {
            return prevPermissions.filter((p) => !p.includes('BOLETO_BANCARIO'))
          }
        })
      }
    }

  }

  const handleSavePermissions = () => {
    console.log(selectedUser);
    console.log(userPermissions);
    if (selectedUser) {
      updateUserMutation.mutate({
        id: selectedUser.id,
        login: selectedUser.login,
        name: selectedUser.name,
        email: selectedUser.email,
        password: selectedUser.password,
        permissions: userPermissions,
        empresaId: selectedUser.empresaId,
      })
    }
  }

  const handleCreateUser = () => {
    console.log('Creating user', newUser);
    const parsedData = loginSchema.safeParse({ login: newUser.login, password: newUser.password });
    if (parsedData.success) {
      createUserMutation.mutate({
        login: newUser.login,
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        permissions: [],
        empresaId: glb_params.id_empresa ? Number(glb_params.id_empresa) : 0
      });
    }
    else {
      toast({
        title: 'Erro ao criar colaborador',
        description: parsedData.error.issues[0].message,
        variant: 'destructive'
      });
    }

  }

  const handleUpdateUser = () => {
    if (selectedUser) {
      console.log(selectedUser);
      updateUserMutation.mutate({
        id: selectedUser.id,
        login: selectedUser.login,
        name: selectedUser.name,
        email: selectedUser.email,
        password: selectedUser.password,
        permissions: userPermissions,
        empresaId: selectedUser.empresaId
      })
    }
  }

  const handleDeleteUser = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id)
    }
  }

  if (isLoading) {
    return <PageLoader />
  }

  return (
    <div className="container mx-auto space-y-6 p-4 ">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold">Gerenciar usuários e permissões</h1>
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(value) => {
            setIsCreateDialogOpen(value)
            setNewUser({ login: '', name: '', email: '', password: '' })
          }}
        >
          <DialogTrigger asChild>
            <Button size={"sm"}>
              <Plus className="mr-2 h-4 w-4" /> Criar colaborador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar novo colaborador</DialogTitle>
              <DialogDescription>Preencha os dados do novo colaborador abaixo.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Login
                </Label>
                <Input
                  id="login"
                  value={newUser.login}
                  onChange={(e) => setNewUser({ ...newUser, login: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Senha
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateUser}>Criar colaborador</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex space-x-8">
        <div className="w-1/3">
          <h2 className="mb-4 text-lg font-semibold">Colaboradores</h2>
          <ScrollArea className="h-[600px] rounded-md border p-4">
            {(users && users.length > 0) ? users?.map((user) => (
              <div
                key={user.id}
                className={cn(
                  'flex cursor-pointer flex-wrap items-center justify-between space-x-2 rounded p-2 hover:bg-gray-100',
                  selectedUser?.id === user.id && 'bg-gray-100'
                )}
                onClick={() => handleUserSelect(user)}
              >
                <div className="flex items-center space-x-2">
                  <Check
                    className={cn(
                      'h-4 w-4',
                      selectedUser?.id === user.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedUser(user)
                      setIsEditDialogOpen(true)
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso excluirá permanentemente o usuário e
                          todos os dados associados a ele.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser}>
                          Sim, excluir usuário
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>))
              : <div>Não há coilaboradores cadastrados.</div>
            }
          </ScrollArea>
        </div>

        <div className="w-2/3 space-y-4">
          {selectedUser && (
            <>
              <h2 className="text-lg font-semibold">Permissões de {selectedUser.name}</h2>
              <ScrollArea className="h-full max-h-[500px] rounded-md border p-4">
                <div className="grid grid-cols-2 gap-1">
                  <div className='grid grid-cols-1 gap-1  mt-2'>
                    <h3 className="text-lg font-semibold">Alertas</h3>
                    {alertaPermissions.map((permission) => (
                      <div key={permission.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.value}
                          checked={userPermissions.includes(permission.value)}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(checked as boolean, permission.value)
                          }
                          style={{ 'border': '1px solid black' }}
                        />
                        <label
                          htmlFor={permission.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className='grid grid-cols-1 gap-1  mt-2'>
                    <h3 className="text-lg font-semibold">Conta corrente</h3>
                    {contacorrentePermissions.map((permission) => (
                      <div key={permission.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.value}
                          checked={userPermissions.includes(permission.value)}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(checked as boolean, permission.value)
                          }
                          style={{ 'border': '1px solid black' }}
                        />
                        <label
                          htmlFor={permission.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className='grid grid-cols-1 gap-1  mt-2'>
                    <h3 className="text-lg font-semibold">Tipo de Imóvel</h3>
                    {tipoImovelPermissions.map((permission) => (
                      <div key={permission.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.value}
                          checked={userPermissions.includes(permission.value)}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(checked as boolean, permission.value)
                          }
                          style={{ 'border': '1px solid black' }}
                        />
                        <label
                          htmlFor={permission.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className='grid grid-cols-1 gap-1  mt-2'>
                    <h3 className="text-lg font-semibold">Tipo de Lançamentos</h3>
                    {TIPO_LANCPermissions.map((permission) => (
                      <div key={permission.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.value}
                          checked={userPermissions.includes(permission.value)}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(checked as boolean, permission.value)
                          }
                          style={{ 'border': '1px solid black' }}
                        />
                        <label
                          htmlFor={permission.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className='grid grid-cols-1 gap-1  mt-2'>
                    <h3 className="text-lg font-semibold">Condomínios</h3>
                    {condominioPermissions.map((permission) => (
                      <div key={permission.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.value}
                          checked={userPermissions.includes(permission.value)}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(checked as boolean, permission.value)
                          }
                          style={{ 'border': '1px solid black' }}
                        />
                        <label
                          htmlFor={permission.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className='grid grid-cols-1 gap-1  mt-2'>
                    <h3 className="text-lg font-semibold">Blocos</h3>
                    {blocoPermissions.map((permission) => (
                      <div key={permission.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.value}
                          checked={userPermissions.includes(permission.value)}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(checked as boolean, permission.value)
                          }
                          style={{ 'border': '1px solid black' }}
                        />
                        <label
                          htmlFor={permission.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className='grid grid-cols-1 gap-1  mt-2'>
                    <h3 className="text-lg font-semibold">Imoveis</h3>
                    {imoveisPermissions.map((permission) => (
                      <div key={permission.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.value}
                          checked={userPermissions.includes(permission.value)}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(checked as boolean, permission.value)
                          }
                          style={{ 'border': '1px solid black' }}
                        />
                        <label
                          htmlFor={permission.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className='grid grid-cols-1 gap-1 mt-2'>
                    <h3 className="text-lg font-semibold">Locações</h3>
                    {locacoesPermissions.map((permission) => (
                      <div key={permission.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.value}
                          checked={userPermissions.includes(permission.value)}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(checked as boolean, permission.value)
                          }
                          style={{ 'border': '1px solid black' }}
                        />
                        <label
                          htmlFor={permission.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className='grid grid-cols-1 gap-1 mt-2'>
                    <h3 className="text-lg font-semibold">Clientes</h3>
                    {pessoasPermissions.map((permission) => (
                      <div key={permission.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.value}
                          checked={userPermissions.includes(permission.value)}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(checked as boolean, permission.value)
                          }
                          style={{ 'border': '1px solid black' }}
                        />
                        <label
                          htmlFor={permission.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className='grid grid-cols-1 gap-1 mt-2'>
                    <h3 className="text-lg font-semibold">Proprietários</h3>
                    {proprietariosPermissions.map((permission) => (
                      <div key={permission.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.value}
                          checked={userPermissions.includes(permission.value)}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(checked as boolean, permission.value)
                          }
                          style={{ 'border': '1px solid black' }}
                        />
                        <label
                          htmlFor={permission.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <div className='grid grid-cols-1 gap-1 mt-2'>
                    <h3 className="text-lg font-semibold">Moradores</h3>
                    {moradorPermissions.map((permission) => (
                      <div key={permission.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.value}
                          checked={userPermissions.includes(permission.value)}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(checked as boolean, permission.value)
                          }
                          style={{ 'border': '1px solid black' }}
                        />
                        <label
                          htmlFor={permission.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.label}
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className='grid grid-cols-1 gap-1 mt-2'>
                    <h3 className="text-lg font-semibold">Lançamentos Locação/Imóvel</h3>
                    {lancamentoPermissions.map((permission) => (
                      <div key={permission.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.value}
                          checked={userPermissions.includes(permission.value)}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(checked as boolean, permission.value)
                          }
                          style={{ 'border': '1px solid black' }}
                        />
                        <label
                          htmlFor={permission.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.label}
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className='grid grid-cols-1 gap-1 mt-2'>
                    <h3 className="text-lg font-semibold">Lançamentos Condomínios</h3>
                    {LancCondominioPermissions.map((permission) => (
                      <div key={permission.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.value}
                          checked={userPermissions.includes(permission.value)}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(checked as boolean, permission.value)
                          }
                          style={{ 'border': '1px solid black' }}
                        />
                        <label
                          htmlFor={permission.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.label}
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className='grid grid-cols-1 gap-1 mt-2'>
                    <h3 className="text-lg font-semibold">Lançamentos Condomínios</h3>
                    {LancImovelPermissions.map((permission) => (
                      <div key={permission.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.value}
                          checked={userPermissions.includes(permission.value)}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(checked as boolean, permission.value)
                          }
                          style={{ 'border': '1px solid black' }}
                        />
                        <label
                          htmlFor={permission.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.label}
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className='grid grid-cols-1 gap-1 mt-2'>
                    <h3 className="text-lg font-semibold">Boletos</h3>
                    {pagamentoPermissions.map((permission) => (
                      <div key={permission.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.value}
                          checked={userPermissions.includes(permission.value)}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(checked as boolean, permission.value)
                          }
                          style={{ 'border': '1px solid black' }}
                        />
                        <label
                          htmlFor={permission.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.label}
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className='grid grid-cols-1 gap-1  mt-2'>
                    <h3 className="text-lg font-semibold">Boleto bancário</h3>
                    {boletobancarioPermissions.map((permission) => (
                      <div key={permission.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={permission.value}
                          checked={userPermissions.includes(permission.value)}
                          onCheckedChange={(checked) =>
                            handlePermissionChange(checked as boolean, permission.value)
                          }
                          style={{ 'border': '1px solid black' }}
                        />
                        <label
                          htmlFor={permission.value}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {permission.label}
                        </label>
                      </div>
                    ))}
                  </div>

                </div>
              </ScrollArea>
              <Button size={"sm"} onClick={handleSavePermissions}>Salvar permissões</Button>
            </>
          )}

          {!selectedUser && (
            <div className="flex h-[40%] items-center justify-center">
              <p className="text-muted-foreground">
                Selecione um colaborador para ver suas permissões.
              </p>
            </div>
          )}
        </div>
      </div>
      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(value) => {
          setIsEditDialogOpen(value)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar colaborador</DialogTitle>
            <DialogDescription>Edite os dados do colaborador abaixo.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Login
              </Label>
              <Input
                id="edit-login"
                value={selectedUser?.login || ''}
                onChange={(e) => setSelectedUser((prev) => ({ ...prev!, login: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Nome
              </Label>
              <Input
                id="edit-name"
                value={selectedUser?.name || ''}
                onChange={(e) => setSelectedUser((prev) => ({ ...prev!, name: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={selectedUser?.email || ''}
                onChange={(e) => setSelectedUser((prev) => ({ ...prev!, email: e.target.value }))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Senha
              </Label>
              <Input
                id="edit-password"
                type="password"
                value={selectedUser?.password || ''}
                placeholder="Deixe em branco para manter a senha atual"
                onChange={(e) =>
                  setSelectedUser((prev) => ({ ...prev!, password: e.target.value }))
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateUser}>Salvar alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
