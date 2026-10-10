import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from 'react'
import toast from 'react-hot-toast'
import { authAPI, userAPI, adminAPI, marketplaceAPI } from '../services/api'

const AuthContext = createContext()

export const useAuthContext = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }

  return context
}

// =========================================================
// ERROR MESSAGE HELPER
// =========================================================

const getErrorMessage = (error, fallback) => {
  // No response at all = server down / network problem
  if (!error.response && error.request) {
    return 'Unable to reach the server. Please check your connection and try again.'
  }

  const data = error.response?.data

  // Backend validation errors: { message: 'Validation failed', validationErrors: { field: 'text' } }
  const fieldErrors =
    data?.validationErrors && typeof data.validationErrors === 'object'
      ? Object.values(data.validationErrors).join(', ')
      : ''

  return fieldErrors || data?.message || data?.error || error.message || fallback
}

// Login is rejected with 403 when the email has not been verified with an OTP yet
const isUnverifiedError = (error) =>
  error.response?.status === 403 &&
  /not verified/i.test(error.response?.data?.message || '')

// Runs a simple API action (no session change) and reports the result with a toast.
// Intentionally does NOT touch the global `loading` flag, so the Login page is never
// unmounted while the user is typing an OTP.
// options.silentSuccess / options.silentError: skip the toast (the page shows the message itself).
const runAuthAction = async (
  action,
  fallbackSuccess,
  fallbackError,
  options = {}
) => {
  try {
    const response = await action()

    if (!options.silentSuccess) {
      toast.success(response.data?.message || fallbackSuccess)
    }

    return {
      success: true,
      data: response.data?.data,
    }
  } catch (error) {
    console.error(fallbackError, error)

    const message = getErrorMessage(error, fallbackError)

    if (!options.silentError) {
      toast.error(message)
    }

    return {
      success: false,
      error: message,
      status: error.response?.status,
    }
  }
}

// =========================================================
// SELLER STATUS HELPERS
// =========================================================

// Approved seller gets full seller access
const hasSellerAccess = (userData) => {
  const status = userData?.sellerProfile?.status

  return String(status || '').toUpperCase() === 'APPROVED'
}

// Any existing seller application/profile
// PENDING / APPROVED / REJECTED / SUSPENDED
const hasSellerApplication = (userData) => {
  return Boolean(userData?.sellerProfile)
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  // Admin-only cache
  const [users, setUsers] = useState([])

  // =========================================================
  // PERSIST USER
  // =========================================================

  const persistUser = useCallback((userData) => {
    setUser(userData)

    localStorage.setItem('user', JSON.stringify(userData))
  }, [])

  // =========================================================
  // CLEAR SESSION
  // =========================================================

  const clearSession = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')

    setUser(null)
    setIsAuthenticated(false)
  }, [])

  // =========================================================
  // FETCH SELLER PROFILE
  // =========================================================
  //
  // This is the important fix.
  //
  // User can already have a SellerProfile even if the
  // auth-service user response does not contain sellerProfile.
  //
  // 404 = user has never applied as seller.
  // Other errors are logged but don't destroy login session.
  // =========================================================

  const fetchMySellerProfile = useCallback(async (currentUser = null) => {
    try {
      const response = await marketplaceAPI.getMySellerProfile()

      const sellerProfile = response.data?.data

      if (sellerProfile) {
        setUser((previousUser) => {
          const baseUser = previousUser || currentUser || {}

          const updatedUser = {
            ...baseUser,
            sellerProfile,
          }

          localStorage.setItem('user', JSON.stringify(updatedUser))

          return updatedUser
        })

        return {
          success: true,
          sellerProfile,
        }
      }

      return {
        success: false,
        sellerProfile: null,
      }
    } catch (error) {
      // 404 simply means this user has never registered as seller.
      if (error.response?.status !== 404) {
        console.error('Fetch seller profile error:', error)
      }

      return {
        success: false,
        sellerProfile: null,
      }
    }
  }, [])

  // =========================================================
  // INITIAL SESSION / PROFILE HYDRATION
  // =========================================================

  const hydrateFromToken = useCallback(async () => {
    try {
      const response = await authAPI.getProfile()

      const userData = response.data?.data

      if (!userData) {
        throw new Error('Empty profile response')
      }

      // First save auth-service user
      persistUser(userData)

      setIsAuthenticated(true)

      // -----------------------------------------------------
      // IMPORTANT:
      // Now check marketplace for existing seller profile.
      // -----------------------------------------------------

      try {
        const sellerResponse = await marketplaceAPI.getMySellerProfile()

        const sellerProfile = sellerResponse.data?.data

        if (sellerProfile) {
          const updatedUser = {
            ...userData,
            sellerProfile,
          }

          persistUser(updatedUser)

          return {
            success: true,
            user: updatedUser,
          }
        }
      } catch (sellerError) {
        // 404 = no seller application.
        // Don't treat this as authentication failure.
        if (sellerError.response?.status !== 404) {
          console.warn(
            'Could not fetch seller profile during login:',
            sellerError
          )
        }
      }

      return {
        success: true,
        user: userData,
      }
    } catch (error) {
      console.error('Session restore failed:', error)

      clearSession()

      return {
        success: false,
      }
    }
  }, [clearSession, persistUser])

  // =========================================================
  // RESTORE SESSION
  // =========================================================

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        setLoading(false)
        return
      }

      await hydrateFromToken()

      setLoading(false)
    }

    restoreSession()
  }, [hydrateFromToken])

  // =========================================================
  // OAUTH LOGIN
  // =========================================================

  const loginWithOAuthToken = async (token, refreshToken) => {
    setLoading(true)

    if (!token) {
      setLoading(false)

      const message = 'OAuth login did not return a token'

      toast.error(message)

      return {
        success: false,
        error: message,
      }
    }

    localStorage.setItem('token', token)

    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }

    const result = await hydrateFromToken()

    setLoading(false)

    if (result.success) {
      toast.success(
        `Welcome${result.user?.name ? `, ${result.user.name}` : ''}!`
      )
    }

    return result
  }

  // =========================================================
  // SESSION HELPER (shared by login and OTP verification)
  // =========================================================
  //
  // Stores tokens + user and loads the marketplace seller profile.
  // Returns the final user object.
  // =========================================================

  const establishSession = async (authData) => {
    const { token, refreshToken, user: userData } = authData

    localStorage.setItem('token', token)

    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken)
    }

    // Save initial user
    if (userData) {
      persistUser(userData)
    }

    setIsAuthenticated(true)

    // Fetch seller profile too, so seller access works right after login.
    let finalUser = userData

    if (userData) {
      try {
        const sellerResponse = await marketplaceAPI.getMySellerProfile()

        const sellerProfile = sellerResponse.data?.data

        if (sellerProfile) {
          finalUser = {
            ...userData,
            sellerProfile,
          }

          persistUser(finalUser)
        }
      } catch (sellerError) {
        // 404 means user is not a seller yet.
        if (sellerError.response?.status !== 404) {
          console.warn(
            'Could not fetch seller profile after login:',
            sellerError
          )
        }
      }
    }

    return finalUser
  }

  // =========================================================
  // LOGIN
  // =========================================================

  // options.silentError: don't toast the error, the Login page shows it inline.
const login = async (email, password, options = {}) => {
    if (!options.silentLoading) {
      setLoading(true)
    }

    try {
      const response = await authAPI.login({
        email,
        password,
      })

      const authData = response.data?.data

      if (!authData?.token) {
        throw new Error('Invalid login response from server')
      }

      const { token, refreshToken } = authData

      const finalUser = await establishSession(authData)

      toast.success(
        `Welcome back${finalUser?.name ? `, ${finalUser.name}` : ''}!`
      )

      return {
        success: true,
        user: finalUser,
        token,
        refreshToken,
      }
    } catch (error) {
      console.error('Login error:', error)

      const message = getErrorMessage(error, 'Invalid email or password')

      if (!options.silentError) {
        toast.error(message)
      }

      return {
        success: false,
        error: message,
        status: error.response?.status,
        // true when the account exists but the email OTP was never confirmed
        needsVerification: isUnverifiedError(error),
      }
    } finally {
      if (!options.silentLoading) {
        setLoading(false)
      }
    }
  }

  // =========================================================
  // REGISTER  (step 1: account is created, OTP is emailed)
  // =========================================================
  //
  // No token is returned any more. The user must verify the
  // OTP first (see verifyEmail below).
  // =========================================================

  const register = (userData, options) =>
    runAuthAction(
      () => authAPI.register(userData),
      'Registration successful. Please verify your email.',
      'Registration failed',
      options
    )

  // =========================================================
  // VERIFY EMAIL OTP  (step 2: confirms OTP and logs the user in)
  // =========================================================

  const verifyEmail = async (email, otp, options = {}) => {
    try {
      const response = await authAPI.verifyOtp({ email, otp })

      const authData = response.data?.data

      if (!authData?.token) {
        throw new Error('Invalid verification response from server')
      }

      const finalUser = await establishSession(authData)

      toast.success(
        `Email verified${finalUser?.name ? `. Welcome, ${finalUser.name}` : ''}!`
      )

      return {
        success: true,
        user: finalUser,
      }
    } catch (error) {
      console.error('Email verification error:', error)

      const message = getErrorMessage(error, 'Email verification failed')

      if (!options.silentError) {
        toast.error(message)
      }

      return {
        success: false,
        error: message,
        status: error.response?.status,
      }
    }
  }

  // =========================================================
  // RESEND OTP / FORGOT PASSWORD / RESET PASSWORD
  // =========================================================

  const resendVerificationOtp = (email, options) =>
    runAuthAction(
      () => authAPI.resendOtp({ email }),
      'A new code has been sent to your email',
      'Could not resend the code',
      options
    )

  const forgotPassword = (email, options) =>
    runAuthAction(
      () => authAPI.forgotPassword({ email }),
      'If an account exists, a reset code has been sent',
      'Could not send the reset code',
      options
    )

  const resetPassword = (email, otp, newPassword, options) =>
    runAuthAction(
      () => authAPI.resetPassword({ email, otp, newPassword }),
      'Password reset successful. You can now log in',
      'Password reset failed',
      options
    )

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.warn('Backend logout failed:', error)
    } finally {
      clearSession()

      setUsers([])

      toast.success('Logged out successfully')
    }
  }

  // =========================================================
  // BECOME SELLER
  // =========================================================

  const becomeSeller = async (sellerData) => {
    setLoading(true)

    try {
      // -----------------------------------------------------
      // SAFETY CHECK
      //
      // If frontend already knows that seller profile exists,
      // don't send another POST request.
      // -----------------------------------------------------

      if (user?.sellerProfile) {
        const status = String(user.sellerProfile.status || '').toUpperCase()

        // Already registered.
        if (status === 'PENDING' || status === 'APPROVED') {
          return {
            success: true,
            alreadyRegistered: true,
            user,
            sellerProfile: user.sellerProfile,
          }
        }
      }

      const response = await marketplaceAPI.becomeSeller({
        shopName: sellerData.shopName,

        description: sellerData.description,

        storeLogoUrl: sellerData.storeLogoUrl || '',

        phone: sellerData.phone || user?.phone || '',

        email: sellerData.email || user?.email || '',

        address: sellerData.address || '',

        city: sellerData.city || '',

        province: sellerData.province || '',

        location: sellerData.location || user?.location || '',

        sellerType: sellerData.sellerType,
      })

      const sellerProfile =
        response.data?.data?.sellerProfile || response.data?.data

      const updatedUser = {
        ...user,
        sellerProfile,
      }

      persistUser(updatedUser)

      toast.success(
        response.data?.message || 'Seller application submitted for approval'
      )

      return {
        success: true,
        user: updatedUser,
        sellerProfile,
      }
    } catch (error) {
      console.error('Seller registration error:', error)

      // =====================================================
      // IMPORTANT: 409 CONFLICT
      // =====================================================

      if (error.response?.status === 409) {
        console.warn(
          'Seller already exists. Fetching existing seller profile...'
        )

        // Try to get existing seller profile
        const sellerResult = await fetchMySellerProfile(user)

        if (sellerResult.sellerProfile) {
          const updatedUser = {
            ...user,
            sellerProfile: sellerResult.sellerProfile,
          }

          persistUser(updatedUser)

          toast.success('You are already registered as a seller.')

          return {
            success: true,
            alreadyRegistered: true,
            user: updatedUser,
            sellerProfile: sellerResult.sellerProfile,
            status: 409,
          }
        }

        return {
          success: false,
          alreadyRegistered: true,
          status: 409,
          error: 'You are already registered as a seller.',
        }
      }

      const message = getErrorMessage(
        error,
        'Could not complete seller registration'
      )

      toast.error(message)

      return {
        success: false,
        error: message,
        status: error.response?.status,
      }
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // ADMIN: USER MANAGEMENT
  // =========================================================

  const fetchUsers = useCallback(async () => {
    try {
      const response = await adminAPI.getAllUsers()

      setUsers(response.data?.data || [])

      return {
        success: true,
      }
    } catch (error) {
      console.error('Fetch users error:', error)

      toast.error(getErrorMessage(error, 'Could not load users'))

      return {
        success: false,
      }
    }
  }, [])

  const adminAddUser = async (data) => {
    setLoading(true)

    try {
      const response = await adminAPI.createUser(data)

      const newUser = response.data?.data

      if (!newUser) {
        throw new Error('Invalid response from server')
      }

      setUsers((prev) => [...prev, newUser])

      toast.success(response.data?.message || 'User created successfully')

      return {
        success: true,
        user: newUser,
      }
    } catch (error) {
      console.error('Admin create user error:', error)

      const message = getErrorMessage(error, 'Could not create user')

      toast.error(message)

      return {
        success: false,
        error: message,
      }
    } finally {
      setLoading(false)
    }
  }

  const adminUpdateUser = async (id, updates) => {
    setLoading(true)

    try {
      const response = await adminAPI.updateUser(id, updates)

      const updatedUser = response.data?.data

      if (!updatedUser) {
        throw new Error('Invalid response from server')
      }

      setUsers((prev) => prev.map((u) => (u.id === id ? updatedUser : u)))

      if (user?.id === id) {
        persistUser(updatedUser)
      }

      toast.success(response.data?.message || 'User updated successfully')

      return {
        success: true,
        user: updatedUser,
      }
    } catch (error) {
      console.error('Admin update user error:', error)

      const message = getErrorMessage(error, 'Could not update user')

      toast.error(message)

      return {
        success: false,
        error: message,
      }
    } finally {
      setLoading(false)
    }
  }

  const adminDeleteUser = async (id) => {
    setLoading(true)

    try {
      const response = await adminAPI.deleteUser(id)

      setUsers((prev) => prev.filter((u) => u.id !== id))

      toast.success(response.data?.message || 'User deleted successfully')

      return {
        success: true,
      }
    } catch (error) {
      console.error('Admin delete user error:', error)

      const message = getErrorMessage(error, 'Could not delete user')

      toast.error(message)

      return {
        success: false,
        error: message,
      }
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // UPDATE USER PROFILE
  // =========================================================

  const updateUser = async (updatedData) => {
    setLoading(true)

    try {
      const response = await userAPI.updateProfile(updatedData)

      const updatedUser = response.data?.data

      if (!updatedUser) {
        throw new Error('Invalid profile response from server')
      }

      persistUser(updatedUser)

      toast.success(response.data?.message || 'Profile updated successfully')

      return {
        success: true,
        user: updatedUser,
      }
    } catch (error) {
      console.error('Profile update error:', error)

      const message = getErrorMessage(error, 'Profile update failed')

      toast.error(message)

      return {
        success: false,
        error: message,
      }
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

  const changePassword = async (passwordData) => {
    setLoading(true)

    try {
      const response = await userAPI.changePassword(passwordData)

      toast.success(response.data?.message || 'Password changed successfully')

      return {
        success: true,
      }
    } catch (error) {
      console.error('Change password error:', error)

      const message = getErrorMessage(error, 'Password change failed')

      toast.error(message)

      return {
        success: false,
        error: message,
      }
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // UPLOAD AVATAR
  // =========================================================

  const uploadAvatar = async (file) => {
    setLoading(true)

    try {
      const formData = new FormData()

      formData.append('avatar', file)

      const response = await userAPI.uploadAvatar(formData)

      const updatedUser = response.data?.data

      if (updatedUser) {
        persistUser(updatedUser)
      }

      toast.success(response.data?.message || 'Avatar updated successfully')

      return {
        success: true,
        user: updatedUser,
      }
    } catch (error) {
      console.error('Avatar upload error:', error)

      const message = getErrorMessage(error, 'Avatar upload failed')

      toast.error(message)

      return {
        success: false,
        error: message,
      }
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // SETTINGS
  // =========================================================

  const updateSettings = async (settingsData) => {
    setLoading(true)

    try {
      const response = await userAPI.updateSettings(settingsData)

      toast.success(response.data?.message || 'Settings updated successfully')

      return {
        success: true,
        settings: response.data?.data,
      }
    } catch (error) {
      console.error('Settings update error:', error)

      const message = getErrorMessage(error, 'Settings update failed')

      toast.error(message)

      return {
        success: false,
        error: message,
      }
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // USER TYPE
  // =========================================================

  const userType = user?.userType?.toUpperCase()

  // =========================================================
  // CONTEXT VALUE
  // =========================================================

  const value = {
    user,
    users,

    isAuthenticated,
    loading,

    login,
    register,
    verifyEmail,
    resendVerificationOtp,
    forgotPassword,
    resetPassword,
    logout,
    loginWithOAuthToken,

    updateUser,
    changePassword,
    uploadAvatar,
    updateSettings,

    becomeSeller,
    fetchMySellerProfile,

    fetchUsers,
    adminAddUser,
    adminUpdateUser,
    adminDeleteUser,

    // APPROVED seller
    isSeller: hasSellerAccess(user),

    // ANY existing seller application
    hasSellerApplication: hasSellerApplication(user),

    isAdmin: userType === 'ADMIN',

    isFarmer: userType === 'FARMER',

    isExpert: userType === 'EXPERT',
  }

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}
