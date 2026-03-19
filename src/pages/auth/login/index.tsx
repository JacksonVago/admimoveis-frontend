import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/auth/use-auth'
import { toast } from '@/hooks/use-toast'
import { User } from '@/interfaces/user'
import api from '@/services/axios/api'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { Eye, EyeOffIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { useGlobalParams } from '@/globals/GlobalParams'

interface LoginData {
  login: string
  password: string
  empresaId?: number
}

interface loginResponse {
  access_token: string
}

export const postLogin = async (data: LoginData): Promise<loginResponse> => {
  const response = await api.post<loginResponse>('login', data)
  console.log(response?.data);
  return response?.data
}

export const getUserLogin = (login: string) => {
  return api.get<User>(`/users/${login}`)
}

export const description =
  "A login form with email and password. There's an option to login with Google and a link to sign up if you don't have an account."

/*const loginSchema_old = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' })
})*/

const loginSchema = z.object({
  login: z
    .string()
    .min(1, { message: 'Login is required' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  newpassword: z.string().optional(),
  newpasswordconf: z.string().optional(),
  empresaId: z.number().optional()
})

export const putUpdateUser = (id: string, datapwd: {
  login: string,
  password: string,
  newpassword: string
}) => {

  return api.put(`/users/updatepwd/${id}`, datapwd)
}

type LoginSchema = z.infer<typeof loginSchema>

export function Login() {
  const navigate = useNavigate()
  //Globals
  const glb_params = useGlobalParams();  
  
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [updPassword, setUpdPassword] = useState(false);
  const [loginUser, setLoginUser] = useState<User>();
  const { login, logout } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors }
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema)
  })

  useEffect(() => {
    setShowPassword(false);
    setShowNewPassword(false);
    setUpdPassword(false);
    setLoginUser(undefined);
  }, [])

  const onSubmit = (data: LoginSchema) => {
    if (!updPassword) {
      data.empresaId = data.empresaId || loginUser?.empresaId || (glb_params.id_empresa ? parseInt(glb_params.id_empresa) : 0);
      login(data);
    } else {
      if (!data.newpassword || data.newpassword.length < 8) {
        setError('newpassword', { type: 'manual', message: 'New Password must be at least 8 characters.' });
      }
      else {
        if (!data.newpasswordconf || data.newpasswordconf.length < 8) {
          setError('newpasswordconf', { type: 'manual', message: 'New Password must be at least 8 characters.' });
        }
        else {
          if (data.newpassword !== data.newpasswordconf) {
            setError('newpasswordconf', { type: 'manual', message: 'Nova senha e confirmação da senha não podem ser diferentes.' });
          }
          else {
            if (loginUser?.id) {
              putUpdateUser(loginUser.id, { login: data.login, password: data.password, newpassword: data.newpassword })
                .then((response) => {
                  if (response){
                    console.log(response.data);
                  }
                  setUpdPassword(false);
                  toast({
                    title: 'Atualização de senha',
                    description: 'Senha atualizada com sucesso. Por favor, faça login com a nova senha.',
                  });
                  logout();
                  setShowPassword(false);
                  setShowNewPassword(false);
                  setUpdPassword(false);
                  setLoginUser(undefined);
                })
                .catch((error) => {
                  if (axios.isAxiosError(error)) {
                    // Check if there's a response and data within the error
                    if (error.response && error.response.data) {
                      toast({
                        title: 'Erro ao atualizar senha',
                        description: error.response.data.message,
                      })

                      // You can also set this error message to a state to display it in your UI
                    } else {
                      console.error('Axios error without response data:', error.message);
                    }
                  } else {
                    console.error('Non-Axios error:', error);
                  }
                });
            }
          }
        }
      }
    }
  }

  const handlerGetUser = async (login: string) => {
    const response = await getUserLogin(login);
    console.log('response getUserLogin', response);
    if (response && response.data) {
      console.log('passou  ', response.data);
      setLoginUser(response.data);
      setError('login', {});
    }
    else {
      setLoginUser(undefined);
      setError('login', { type: 'manual', message: 'Usuário não encontrado.' });
      navigate(`/bemvindo/${login}`);
    }
  }

  const handlerValidPwd = (pwd: string) => {
    if (loginUser) {
      postLogin({ login: loginUser.login, password: pwd, empresaId: loginUser.empresaId })
        .then((response) => {
          if (response) {
            setError('password', {});
          }
        })
        .catch((error) => {
          if (axios.isAxiosError(error)) {
            // Check if there's a response and data within the error
            if (error.response && error.response.data) {
              setError('password', { message: error.response.data.message.toString().indexOf('not strong') > -1 ? 'Senha inválida' : error.response.data.message });
            } else {
              console.error('Axios error without response data:', error.message);
            }
          } else {
            console.error('Non-Axios error:', error);
          }
        });
      //login({ login: loginUser.login, password: pwd });
    }
  }

  return (
    <Card className="mx-auto max-w-sm font-[Poppins-Regular]">
      <CardHeader>
        <CardTitle className="text-2xl">Acesso</CardTitle>
        <CardDescription>Digite seu e-mail abaixo para acessar sua conta</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="login">Usuário</Label>
            <Input
              id="login"
              type="text"
              placeholder="Usuario"
              {...register('login')}
              required
              onBlur={(e) => { handlerGetUser(e.target.value) }}
            />
            {!!errors.login?.message && (
              errors.login?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem' }}>* {errors.login?.message}</p>
            )}

          </div>
          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Senha</Label>
              <Link to="#" className="ml-auto inline-block text-xs underline">
                Esqueceu sua senha ?
              </Link>
            </div>
            <div className='flex'>
              <Input
                className='w-full'
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                {...register('password')}
                onBlur={(e) => { handlerValidPwd(e.target.value) }}
              />
            </div>
            <div className='bg-white relative -top-10 left-[90%] p-0 w-[24px]' onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <Eye color='black'></Eye> : <EyeOffIcon color='black'></EyeOffIcon>}
            </div>
            {!!errors.password?.message && (
              errors.password?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem', top: '-40px', position: 'relative' }}>* {errors.password?.message}</p>
            )}
            {updPassword && (
              <>
                <div className="flex items-center">
                  <Label htmlFor="newpassword">Nova Senha</Label>
                </div>
                <div className='flex'>
                  <Input
                    className='w-full'
                    id="newpassword"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    {...register('newpassword')}
                  />
                </div>
                <div className='bg-white relative -top-10 left-[90%] p-0 w-[24px]' onClick={() => setShowNewPassword(!showNewPassword)}>
                  {showNewPassword ? <Eye color='black'></Eye> : <EyeOffIcon color='black'></EyeOffIcon>}
                </div>
                {!!errors.newpassword?.message && (
                  errors.newpassword?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem', top: '-40px', position: 'relative' }}>* {errors.newpassword?.message}</p>
                )}
                <div className="flex items-center">
                  <Label htmlFor="newpassword">Confirma nova Senha</Label>
                </div>
                <div className='flex'>
                  <Input
                    className='w-full'
                    id="newpassword"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    {...register('newpasswordconf')}
                  />
                </div>
                <div className='bg-white relative -top-10 left-[90%] p-0 w-[24px]' onClick={() => setShowNewPassword(!showNewPassword)}>
                  {showNewPassword ? <Eye color='black'></Eye> : <EyeOffIcon color='black'></EyeOffIcon>}
                </div>
                {!!errors.newpasswordconf?.message && (
                  errors.newpasswordconf?.message && <p style={{ color: '#ed535d', fontSize: '0.8rem', top: '-40px', position: 'relative' }}>* {errors.newpasswordconf?.message}</p>
                )}
              </>)}
          </div>
          <Button type="submit" size={'sm'} >
            {!updPassword ? 'Acessar' : 'Confirmar Alteração'}
          </Button>
          {!updPassword && (
            <Button size={'sm'} onClick={() => setUpdPassword(!updPassword)} >
              Alterar Senha
            </Button>
          )}
        </form>
        <div className="mt-4 text-center text-sm">
          Não tem uma conta ?{' '}
          <Link to="#" className="underline">
            Criar
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
