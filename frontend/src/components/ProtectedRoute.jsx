import { Navigate, useLocation } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import Loader from './common/Loader'

// Guards a route behind authentication, and optionally behind the ADMIN role.
//
// Backend role structure:
//   role     -> security role: ADMIN / USER
//   userType -> business role: ADMIN / FARMER
export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, loading, user } = useAuthContext()
  const location = useLocation()

  // Wait until authentication state is loaded
  if (loading) {
    return <Loader fullScreen />
  }

  // User is not logged in: redirect to login preserving intended target URL
  if (!isAuthenticated || !user) {
    const returnTarget = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${returnTarget}`} replace />
  }

  if (requiredRole?.toUpperCase() === 'ADMIN') {
    const securityRole = user?.role?.toUpperCase()
    const userType = user?.userType?.toUpperCase()
    const isAdmin = securityRole === 'ADMIN' || userType === 'ADMIN'

    if (!isAdmin) {
      return <Navigate to="/dashboard" replace />
    }
  }

  return children
}
