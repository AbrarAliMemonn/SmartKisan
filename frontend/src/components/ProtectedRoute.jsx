import { Navigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import Loader from './common/Loader'

// Guards a route behind authentication, and optionally behind the ADMIN role.
//
// Backend role structure:
//   role     -> security role: ADMIN / USER
//   userType -> business role: ADMIN / FARMER
export default function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, loading, user } = useAuthContext()

  // Wait until authentication state is loaded
  if (loading) {
    return <Loader fullScreen />
  }

  // User is not logged in
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
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
