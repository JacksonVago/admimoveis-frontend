import { useGlobalParams } from '@/globals/GlobalParams'
import { toast } from '@/hooks/use-toast'
import { Permission, UserRole } from '@/interfaces/user'
import api from '@/services/axios/api'
import { isAxiosError } from 'axios'
import { destroyCookie, parseCookies, setCookie } from 'nookies'
import { createContext, useEffect, useState } from 'react'

interface UserInfo {
  id: string
  login: string
  name: string
  email: string
  role: UserRole
  permissions: Permission[]
  createdAt: string
  updatedAt?: string
  empresaId:number;
}

export const STORAGE_ACCESS_TOKEN_KEY = '@my_application_access_token'
export const STORAGE_REFRESH_TOKEN_KEY = '@my_application_refresh_token'

//interface for login mutation
interface LoginData {
  login: string
  password: string
  empresaId?: number
}

interface loginResponse {
  access_token: string
}

interface RegisterData {
  login: string
  email: string
  password: string
  name: string
  //TODO: add more fields likes, phone, origin etc
}

interface AuthContextData {
  user?: UserInfo
  firstName?: string
  isAdmin?: boolean
  isAuthenticated: boolean
  isLoadingUserData: boolean
  login: (data: LoginData) => void
  logout: () => void
  register: (data: RegisterData) => void
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData)

export const postLogin = async (data: LoginData): Promise<loginResponse> => {
  const response = await api.post<loginResponse>('login', data)

  return response?.data
}

export const getUserInfo = async (): Promise<UserInfo> => {
  const response = await api.get<UserInfo>('users/info')
  return response?.data
}

export const postRegister = async (data: RegisterData): Promise<loginResponse> => {
  const response = await api.post<loginResponse>('/internal-users', data)
  return response?.data
}

//Get access token from cookies
export const getAccessToken = (): string | undefined => {
  const accessTokenCookiesData = parseCookies(null, STORAGE_ACCESS_TOKEN_KEY)
  return accessTokenCookiesData[STORAGE_ACCESS_TOKEN_KEY]
}

// Single Responsibility Principle: Each function has a single, well-defined purpose
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoadingUserData, setIsLoadingUserData] = useState(true)
  const [user, setUser] = useState<UserInfo>()
  const firstName = user?.name?.split?.(' ')[0] || 'Colaborador'
  //Globals
  const glb_params = useGlobalParams();  


  const isAuthenticated = !!user
  // Fetch user from storage on mount
  useEffect(() => {
    initializeAuth()
    fetchUserData()
  }, [])

  const initializeAuth = () => {
    const accessToken = getAccessToken()

    if (accessToken) {
      api.defaults.headers['Authorization'] = `Bearer ${accessToken}`
    }
  }

  const fetchUserData = async () => {
    try {
      const userData = await getUserInfo()
      setUser(userData)
      glb_params.updId_empresa(userData?.empresaId.toString() || '0');
      
    } catch (error) {
      //TODO: handle error (logout, refresh token, etc)
      if (isAxiosError(error) && error?.response?.status === 401) {
        // Token expired, logout
        logout()
      }
    } finally {
      setIsLoadingUserData(false)
    }
  }
  //  for login (receives access_token only)
  async function login(data: LoginData) {
    try {
      const response = await postLogin({
        login: data.login,
        password: data.password,
        empresaId: data.empresaId
      })
      const { access_token } = response

      //we need to persist  token and refresh tokens event if user refresh the page, so we can use local storage, cookies, sessionStorage, zustand persist etc
      setCookie(null, STORAGE_ACCESS_TOKEN_KEY, access_token, {
        maxAge: 60 * 60 * 24 * 1, // 1 day
        path: '/' //used to especicy what paths can access the cookie, in this case all paths
      })

      // after login, we need to fetch user data
      initializeAuth()
      fetchUserData()
    } catch (error) {
      toast({
        description: 'Usuário ou senha inválidos'
      })
    }
  }

  async function register(data: RegisterData) {
    try {
      await postRegister(data)
    } catch (error) { }
  }

  const logout = () => {
    setUser(undefined)
    //remove tokens from storage
    destroyCookie(null, STORAGE_ACCESS_TOKEN_KEY, { path: '/' })
  }

  console.log(glb_params.id_empresa);

  //Verifica se tem empresa  e guarda
  const isAdmin = user?.role === 'ADMIN'
  const values: AuthContextData = {
    user,
    firstName,
    isAdmin,
    isAuthenticated,
    isLoadingUserData,
    login,
    logout,
    register
  }

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>
}
