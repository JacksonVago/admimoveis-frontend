import { useAuth } from '@/hooks/auth/use-auth'
import { PageLoader } from '@/pages/assistant/page-loader'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { ROUTE } from '../../enums/routes.enum'

export const AuthenticatedRoutesGuard = () => {
  const { isAuthenticated, isLoadingUserData } = useAuth()
  const location = useLocation() // Adds useLocation to store the current location

  console.log('AuthenticatedRoutesGuard - isAuthenticated:', isAuthenticated);
  if (isLoadingUserData) {
    // loading component while checks if user is authenticated
    return <PageLoader />
  }

  // Redirects to the login or to the specific URL defined by rules. page if not authenticated
  if (!isAuthenticated) {
    const targetLocation = location.state?.from || { pathname: ROUTE.LOGIN } // Redirects to the current page or to ROUTE.LOGIN if there's no previous state
    return <Navigate to={targetLocation} state={{ from: location }} replace />
  }

  // Allows access to protected routes if authenticated
  return <Outlet />
}
