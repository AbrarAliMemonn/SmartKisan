import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sprout,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  MapPin,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Leaf,
  Cpu,
  Store,
  LineChart,
} from 'lucide-react'
import { useAuthContext } from '../context/AuthContext'
import Button from '../components/common/Button'
import OtpInput from '../components/common/OtpInput'
import toast from 'react-hot-toast'
import { API_ROOT_URL } from '../utils/constants'

const startGoogleLogin = () => {
  window.location.href = `${API_ROOT_URL}/api/oauth2/authorization/google`
}

const initialFormData = {
  email: '',
  password: '',
  name: '',
  phone: '',
  location: '',
  farmSize: '',
}

const RESEND_SECONDS = 60

// Messages are shown inline on the form, so no error toast from AuthContext
const INLINE = { silentError: true }
const LOGIN_OPTIONS = { silentError: true, silentLoading: true }
/* -------------------------------------------------------------
   Styling helpers
------------------------------------------------------------- */
const inputBase =
  'w-full rounded-xl border py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400'

const inputOk =
  'border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10'

const inputBad =
  'border-red-300 bg-red-50/40 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-500/10'

const inputClass = (invalid = false) =>
  `${inputBase} ${invalid ? inputBad : inputOk}`

const labelClass = 'mb-1.5 block text-[13px] font-semibold text-slate-700'

const iconClass =
  'pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400'

const primaryButtonClass =
  'w-full !rounded-xl !py-3.5 !text-[15px] !font-semibold !shadow-lg !shadow-green-600/20 !transition-all hover:!shadow-xl hover:!shadow-green-600/30'

const getPasswordStrength = (password) => {
  if (password.length < 6) {
    return { label: 'Weak', bar: 'w-1/3 bg-red-500', text: 'text-red-500' }
  }
  if (password.length < 10) {
    return { label: 'Good', bar: 'w-2/3 bg-amber-500', text: 'text-amber-600' }
  }
  return { label: 'Strong', bar: 'w-full bg-green-500', text: 'text-green-600' }
}

/* -------------------------------------------------------------
   Inline message box (errors in red, information in green)
------------------------------------------------------------- */
function FormAlert({ type = 'error', children }) {
  if (!children) return null

  const isError = type === 'error'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-[13px] font-medium leading-5 ring-1 ${
        isError
          ? 'bg-red-50 text-red-700 ring-red-200'
          : 'bg-emerald-50 text-emerald-800 ring-emerald-200'
      }`}
    >
      <svg
        className="mt-0.5 h-4 w-4 shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        {isError ? (
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
          />
        ) : (
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9z"
          />
        )}
      </svg>

      <span>{children}</span>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const {
    login,
    register,
    verifyEmail,
    resendVerificationOtp,
    forgotPassword,
    resetPassword,
    loading,
  } = useAuthContext()

  // view: 'auth' (sign in / sign up) | 'verify' | 'forgot' | 'reset'
  const [view, setView] = useState('auth')
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState(initialFormData)

  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [cooldown, setCooldown] = useState(0)

  // Inline feedback
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [credentialError, setCredentialError] = useState(false)

  const busy = loading || submitting || oauthLoading

  // Resend countdown
  useEffect(() => {
    if (cooldown <= 0) return undefined

    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000)

    return () => clearTimeout(timer)
  }, [cooldown])

  const clearFeedback = () => {
    setFormError('')
    setNotice('')
    setCredentialError(false)
  }

  const updateField = (field, value) => {
    clearFeedback()

    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const handleGoogleLogin = () => {
    try {
      setOauthLoading(true)
      startGoogleLogin()
    } catch (error) {
      console.error('Google OAuth error:', error)
      setOauthLoading(false)
      toast.error('Unable to start Google login')
    }
  }

  const resetOtpFields = () => {
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const goToVerify = (message = '', receivedOtp = '') => {
    clearFeedback()
    resetOtpFields()
    if (receivedOtp) {
      setOtp(receivedOtp)
    }
    setCooldown(RESEND_SECONDS)
    setNotice(message)
    setView('verify')
  }

  const goToReset = (receivedOtp = '') => {
    clearFeedback()
    resetOtpFields()
    if (receivedOtp) {
      setOtp(receivedOtp)
      setNotice(`Reset code dispatched: ${receivedOtp}`)
    }
    setCooldown(RESEND_SECONDS)
    setView('reset')
  }

  const backToSignIn = (keepEmail = true) => {
    clearFeedback()
    resetOtpFields()
    setCooldown(0)
    setShowPassword(false)
    setIsLogin(true)
    setFormData((previous) => ({
      ...initialFormData,
      email: keepEmail ? previous.email : '',
    }))
    setView('auth')
  }

  const openForgotPassword = () => {
    clearFeedback()
    setView('forgot')
  }

  const changeEmail = () => {
    clearFeedback()
    resetOtpFields()
    setCooldown(0)
    setIsLogin(false)
    setView('auth')
  }

  const switchMode = () => {
    clearFeedback()
    setIsLogin((previous) => !previous)
    setFormData(initialFormData)
    setShowPassword(false)
  }

  /* ---------------------------------------------------------------
     Sign in / Sign up
     (success toasts come from AuthContext, errors are shown inline)
  --------------------------------------------------------------- */
  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    clearFeedback()

    const email = formData.email.trim()
    const password = formData.password

    if (!email || !password) {
      setFormError('Please enter your email address and password.')
      return
    }

       if (isLogin) {
      setSubmitting(true)
      try {
        const result = await login(email, password, LOGIN_OPTIONS)

        if (result?.success) {
          navigate('/dashboard')
          return
        }

        // Account exists but the email was never confirmed -> send a fresh
        // code and open the verification screen.
        if (result?.needsVerification) {
          const resendRes = await resendVerificationOtp(email, {
            silentSuccess: true,
            silentError: true,
          })
          const receivedOtp = resendRes?.data?.otp || result?.data?.otp

          goToVerify(
            receivedOtp
              ? `Your email address is not verified yet. Verification code: ${receivedOtp}`
              : 'Your email address is not verified yet. We have sent a new 6-digit code to your inbox.',
            receivedOtp
          )
          return
        }

        setFormError(result?.error || 'Invalid email or password.')
        setCredentialError(result?.status === 401)
      } catch (error) {
        console.error('Authentication error:', error)
        setFormError('Something went wrong. Please try again.')
      } finally {
        setSubmitting(false)
      }
      return
    }

    if (!formData.name.trim()) {
      setFormError('Please enter your full name.')
      return
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.')
      return
    }

    setSubmitting(true)
    try {
      const result = await register(
        {
          name: formData.name.trim(),
          email,
          password,
          phone: formData.phone.trim(),
          location: formData.location.trim(),
          farmSize: formData.farmSize.trim(),
        },
        { silentSuccess: true, silentError: true }
      )

      if (result?.success) {
        const receivedOtp = result?.data?.otp
        goToVerify(
          receivedOtp
            ? `Account created! Verification code: ${receivedOtp}`
            : `We have sent a 6-digit verification code to ${email}.`,
          receivedOtp
        )
      } else {
        setFormError(result?.error || 'Registration failed. Please try again.')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setFormError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // For people who registered earlier but never entered the code
  const handleVerifyExisting = async () => {
    clearFeedback()

    const email = formData.email.trim()

    if (!email) {
      setFormError('Enter your email address first, then choose "Verify email".')
      return
    }

    setSubmitting(true)
    try {
      const result = await resendVerificationOtp(email, {
        silentSuccess: true,
        silentError: true,
      })

      // 429 = a code was sent a moment ago and is still valid
      if (result?.success || result?.status === 429) {
        const receivedOtp = result?.data?.otp
        goToVerify(
          receivedOtp
            ? `Verification code: ${receivedOtp}`
            : `If this account is awaiting verification, a code was sent to ${email}.`,
          receivedOtp
        )
      } else {
        setFormError(result?.error || 'Could not send the code. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  /* ---------------------------------------------------------------
     Verify email OTP
  --------------------------------------------------------------- */
  const handleVerifySubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    const email = formData.email.trim()

    if (!/^\d{6}$/.test(otp)) {
      setFormError('Please enter the complete 6-digit code.')
      return
    }

    setSubmitting(true)
    try {
      // On success AuthContext stores the tokens and signs the user in.
      const result = await verifyEmail(email, otp, INLINE)

      if (result?.success) {
        navigate('/dashboard')
      } else {
        setNotice('')
        setFormError(result?.error || 'Verification failed. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  /* ---------------------------------------------------------------
     Forgot password -> Reset password
  --------------------------------------------------------------- */
  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    clearFeedback()

    const email = formData.email.trim()

    if (!email) {
      setFormError('Please enter your email address.')
      return
    }

    setSubmitting(true)
    try {
      const result = await forgotPassword(email, INLINE)

      if (result?.success) {
        const receivedOtp = result?.data?.otp
        goToReset(receivedOtp)
      } else {
        setFormError(result?.error || 'Could not send the reset code.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    const email = formData.email.trim()

    if (!/^\d{6}$/.test(otp)) {
      setFormError('Please enter the complete 6-digit code.')
      return
    }

    if (newPassword.length < 6) {
      setFormError('New password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setFormError('The two passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const result = await resetPassword(email, otp, newPassword, INLINE)

      if (result?.success) {
        backToSignIn(true)
        toast.success('Password updated. You can now sign in.')
      } else {
        setFormError(result?.error || 'Password reset failed.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || submitting) return

    const email = formData.email.trim()

    setSubmitting(true)
    try {
      const options = { silentSuccess: true, silentError: true }

      const result =
        view === 'reset'
          ? await forgotPassword(email, options)
          : await resendVerificationOtp(email, options)

      if (result?.success) {
        const receivedOtp = result?.data?.otp
        if (receivedOtp) {
          setOtp(receivedOtp)
        }
        setFormError('')
        setNotice(
          receivedOtp
            ? `A fresh verification code has been dispatched: ${receivedOtp}`
            : `A new code has been sent to ${email}.`
        )
        setCooldown(RESEND_SECONDS)
      } else {
        setNotice('')
        setFormError(result?.error || 'Could not resend the code.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleOtpChange = (value) => {
    setFormError('')
    setOtp(value)
  }

  /* ---------------------------------------------------------------
     Header text per view
  --------------------------------------------------------------- */
  const emailLabel = (
    <span className="font-semibold text-slate-700">
      {formData.email.trim()}
    </span>
  )

  const headerTitle = {
    auth: isLogin ? 'Welcome back 👋' : 'Create your account',
    verify: 'Verify your email',
    forgot: 'Forgot your password?',
    reset: 'Reset your password',
  }[view]

  const headerText = {
    auth: isLogin
      ? 'Sign in to access your IoT farm dashboard and marketplace.'
      : 'Join SmartKisan and start your smart farming journey today.',
    verify: <>Enter the 6-digit code we sent to {emailLabel}.</>,
    forgot: "Enter your email address and we'll send you a 6-digit reset code.",
    reset: <>Enter the code sent to {emailLabel} and choose a new password.</>,
  }[view]

  const ViewIcon = view === 'verify' ? Mail : Lock

  const strength = getPasswordStrength(formData.password)
  const resetStrength = getPasswordStrength(newPassword)

  const passwordMismatch =
    confirmPassword.length > 0 && confirmPassword !== newPassword

  /* ---------------------------------------------------------------
     Reusable pieces
  --------------------------------------------------------------- */
  const renderFeedback = () => (
    <>
      <FormAlert type="info">{notice}</FormAlert>
      <FormAlert type="error">{formError}</FormAlert>
    </>
  )

  const renderResend = () => (
    <div className="text-center text-[13px] text-slate-500">
      Didn&apos;t get the code?{' '}
      <button
        type="button"
        onClick={handleResend}
        disabled={cooldown > 0 || submitting}
        className="font-semibold text-green-600 transition-colors hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
      </button>
    </div>
  )

  const renderBackButton = () => (
    <button
      type="button"
      onClick={() => backToSignIn(true)}
      disabled={busy}
      className="mx-auto flex items-center gap-2 text-[13px] font-semibold text-slate-500 transition-colors hover:text-slate-800 disabled:opacity-50"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to sign in
    </button>
  )

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-teal-200/40 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-100/50 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center p-3.5 sm:p-6 lg:p-8">
        <div className="w-full max-w-6xl">
          <div className="overflow-hidden rounded-2xl sm:rounded-[28px] bg-white shadow-xl lg:shadow-[0_20px_70px_-20px_rgba(16,185,129,0.25)] ring-1 ring-slate-900/5">
            <div className="grid min-h-[640px] lg:min-h-[720px] lg:grid-cols-2">
              {/* =========================================================
                  LEFT BRANDING PANEL
              ========================================================= */}
              <div className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-700 via-green-700 to-teal-800 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-12">
                {/* Grid pattern overlay */}
                <div
                  className="absolute inset-0 opacity-[0.15]"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                  }}
                />

                {/* Decorative blobs */}
                <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />

                <div className="relative z-10">
                  {/* Logo */}
                  <div className="mb-10 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
                      <Sprout className="h-7 w-7" />
                    </div>

                    <div>
                      <h1 className="text-xl font-bold tracking-tight">
                        SmartKisan
                      </h1>

                      <p className="text-xs font-medium text-green-100/80">
                        IoT-Based Smart Agriculture System
                      </p>
                    </div>
                  </div>

                  {/* Hero content */}
                  <div className="max-w-md">
                    <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider ring-1 ring-white/15 backdrop-blur">
                      <Leaf className="h-3.5 w-3.5" />
                      Monitor • Automate • Trade
                    </p>

                    <h2 className="text-4xl font-bold leading-[1.15] tracking-tight xl:text-5xl">
                      Smart farming.
                      <br />
                      <span className="bg-gradient-to-r from-lime-200 to-emerald-200 bg-clip-text text-transparent">
                        Powered by IoT.
                      </span>
                    </h2>

                    <p className="mt-6 max-w-lg text-[15px] leading-7 text-green-50/85">
                      Monitor your farm in real-time with IoT sensors,
                      automate irrigation and crop management, and connect
                      directly with buyers through our integrated agriculture
                      marketplace.
                    </p>
                  </div>
                </div>

                {/* Bottom features */}
                <div className="relative z-10 space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                        <Cpu className="h-[18px] w-[18px] text-lime-200" />
                      </div>

                      <p className="text-sm text-green-50/90">
                        Real-time IoT sensor monitoring
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                        <Store className="h-[18px] w-[18px] text-lime-200" />
                      </div>

                      <p className="text-sm text-green-50/90">
                        Integrated farmer-to-buyer marketplace
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                        <LineChart className="h-[18px] w-[18px] text-lime-200" />
                      </div>

                      <p className="text-sm text-green-50/90">
                        Smart analytics from live farm data
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-5">
                    <p className="text-xs text-green-100/60">
                      © {new Date().getFullYear()} SmartKisan. IoT Smart
                      Agriculture & Marketplace.
                    </p>
                  </div>
                </div>
              </div>

              {/* =========================================================
                  RIGHT AUTH PANEL
              ========================================================= */}
              <div className="flex items-center justify-center px-4 py-7 sm:px-10 sm:py-10 lg:p-12">
                <div className="w-full max-w-md">
                  {/* Mobile Logo */}
                  <div className="mb-6 flex items-center justify-center lg:hidden">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-md shadow-green-600/25 ring-1 ring-green-600/20">
                        <Sprout className="h-6 w-6 text-white" />
                      </div>

                      <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900">
                          SmartKisan
                        </h1>

                        <p className="text-[11px] font-semibold uppercase tracking-wider text-green-600">
                          IoT Smart Agriculture
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mode Toggle (only on the sign in / sign up view) */}
                  {view === 'auth' && (
                    <div className="mb-7 flex rounded-2xl bg-slate-100 p-1.5 ring-1 ring-slate-200/60">
                      <button
                        type="button"
                        onClick={() => !isLogin && switchMode()}
                        disabled={busy}
                        className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                          isLogin
                            ? 'bg-white text-green-700 shadow-sm ring-1 ring-slate-900/5'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        Sign In
                      </button>

                      <button
                        type="button"
                        onClick={() => isLogin && switchMode()}
                        disabled={busy}
                        className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
                          !isLogin
                            ? 'bg-white text-green-700 shadow-sm ring-1 ring-slate-900/5'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        Sign Up
                      </button>
                    </div>
                  )}

                  {/* Header */}
                  <div className="mb-6">
                    {view !== 'auth' && (
                      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 ring-1 ring-green-100">
                        <ViewIcon className="h-7 w-7 text-green-600" />
                      </div>
                    )}

                    <h2 className="text-[26px] font-bold leading-tight tracking-tight text-slate-900">
                      {headerTitle}
                    </h2>

                    <p className="mt-2 break-words text-sm leading-6 text-slate-500">
                      {headerText}
                    </p>
                  </div>

                  {/* =====================================================
                      VIEW: SIGN IN / SIGN UP
                  ===================================================== */}
                  {view === 'auth' && (
                    <>
                      {/* Google OAuth */}
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={busy}
                        className="group flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-green-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {oauthLoading ? (
                          <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-green-600" />
                        ) : (
                          <svg
                            className="h-5 w-5"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              fill="#4285F4"
                              d="M23.49 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.86c2.26-2.08 3.58-5.15 3.58-8.64z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 24c3.24 0 5.96-1.07 7.91-2.91l-3.86-3c-1.07.72-2.43 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.92H1.32v3.09C3.28 21.3 7.34 24 12 24z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.31 14.32A7.22 7.22 0 0 1 4.92 12c0-.8.14-1.57.39-2.32V6.59H1.32A11.97 11.97 0 0 0 0 12c0 1.94.47 3.78 1.32 5.41l3.99-3.09z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 4.77c1.77 0 3.36.61 4.61 1.81l3.45-3.45C17.95 1.19 15.24 0 12 0 7.34 0 3.28 2.7 1.32 6.59l3.99 3.09C6.25 6.87 8.89 4.77 12 4.77z"
                            />
                          </svg>
                        )}

                        <span>
                          {oauthLoading
                            ? 'Connecting to Google...'
                            : 'Continue with Google'}
                        </span>

                        {!oauthLoading && (
                          <ArrowRight className="h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                        )}
                      </button>

                      {/* Divider */}
                      <div className="my-6 flex items-center gap-4">
                        <div className="h-px flex-1 bg-slate-200" />

                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                          or continue with email
                        </span>

                        <div className="h-px flex-1 bg-slate-200" />
                      </div>

                      <form onSubmit={handleAuthSubmit} className="space-y-4">
                        {/* Registration Fields */}
                        {!isLogin && (
                          <>
                            {/* Name */}
                            <div>
                              <label htmlFor="name" className={labelClass}>
                                Full Name{' '}
                                <span className="text-red-500">*</span>
                              </label>

                              <div className="relative">
                                <User className={iconClass} />

                                <input
                                  id="name"
                                  type="text"
                                  value={formData.name}
                                  onChange={(e) =>
                                    updateField('name', e.target.value)
                                  }
                                  className={`${inputClass()} pl-11 pr-4`}
                                  placeholder="Enter your full name"
                                  autoComplete="name"
                                  required
                                />
                              </div>
                            </div>

                            {/* Phone */}
                            <div>
                              <label htmlFor="phone" className={labelClass}>
                                Phone Number
                              </label>

                              <div className="relative">
                                <Phone className={iconClass} />

                                <input
                                  id="phone"
                                  type="tel"
                                  value={formData.phone}
                                  onChange={(e) =>
                                    updateField('phone', e.target.value)
                                  }
                                  className={`${inputClass()} pl-11 pr-4`}
                                  placeholder="+92 300 1234567"
                                  autoComplete="tel"
                                />
                              </div>
                            </div>

                            {/* Location + Farm Size */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <div>
                                <label
                                  htmlFor="location"
                                  className={labelClass}
                                >
                                  Location
                                </label>

                                <div className="relative">
                                  <MapPin className={iconClass} />

                                  <input
                                    id="location"
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) =>
                                      updateField('location', e.target.value)
                                    }
                                    className={`${inputClass()} pl-11 pr-4`}
                                    placeholder="City, Province"
                                    autoComplete="address-level2"
                                  />
                                </div>
                              </div>

                              <div>
                                <label
                                  htmlFor="farmSize"
                                  className={labelClass}
                                >
                                  Farm Size
                                </label>

                                <input
                                  id="farmSize"
                                  type="text"
                                  value={formData.farmSize}
                                  onChange={(e) =>
                                    updateField('farmSize', e.target.value)
                                  }
                                  className={`${inputClass()} px-4`}
                                  placeholder="e.g. 15 acres"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {/* Email */}
                        <div>
                          <label htmlFor="email" className={labelClass}>
                            Email Address{' '}
                            <span className="text-red-500">*</span>
                          </label>

                          <div className="relative">
                            <Mail className={iconClass} />

                            <input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) =>
                                updateField('email', e.target.value)
                              }
                              className={`${inputClass(credentialError)} pl-11 pr-4`}
                              placeholder="you@example.com"
                              autoComplete="email"
                              aria-invalid={credentialError}
                              required
                            />
                          </div>
                        </div>

                        {/* Password */}
                        <div>
                          <label htmlFor="password" className={labelClass}>
                            Password <span className="text-red-500">*</span>
                          </label>

                          <div className="relative">
                            <Lock className={iconClass} />

                            <input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              value={formData.password}
                              onChange={(e) =>
                                updateField('password', e.target.value)
                              }
                              className={`${inputClass(credentialError)} pl-11 pr-12`}
                              placeholder={
                                isLogin
                                  ? 'Enter your password'
                                  : 'Create a strong password'
                              }
                              autoComplete={
                                isLogin ? 'current-password' : 'new-password'
                              }
                              aria-invalid={credentialError}
                              required
                            />

                            <button
                              type="button"
                              onClick={() =>
                                setShowPassword((previous) => !previous)
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                              aria-label={
                                showPassword
                                  ? 'Hide password'
                                  : 'Show password'
                              }
                            >
                              {showPassword ? (
                                <EyeOff className="h-[18px] w-[18px]" />
                              ) : (
                                <Eye className="h-[18px] w-[18px]" />
                              )}
                            </button>
                          </div>

                          {/* Password strength */}
                          {!isLogin && formData.password.length > 0 && (
                            <div className="mt-2 flex items-center gap-2">
                              <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${strength.bar}`}
                                />
                              </div>

                              <span
                                className={`text-[11px] font-semibold ${strength.text}`}
                              >
                                {strength.label}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Login Options */}
                        {isLogin && (
                          <div className="flex items-center justify-between pt-1">
                            <label className="flex cursor-pointer items-center gap-2">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-slate-300 text-green-600 transition focus:ring-2 focus:ring-green-500/30"
                              />

                              <span className="text-[13px] font-medium text-slate-600">
                                Remember me
                              </span>
                            </label>

                            <button
                              type="button"
                              onClick={openForgotPassword}
                              disabled={busy}
                              className="text-[13px] font-semibold text-green-600 transition-colors hover:text-green-700 disabled:opacity-50"
                            >
                              Forgot password?
                            </button>
                          </div>
                        )}

                        {/* Inline message (e.g. "Invalid email or password") */}
                        {renderFeedback()}

                        {/* Submit */}
                        <div className="pt-1">
                          <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            className={primaryButtonClass}
                            loading={loading || submitting}
                            disabled={oauthLoading}
                          >
                            {isLogin ? 'Sign In' : 'Create Account'}
                          </Button>
                        </div>
                      </form>

                      {/* Switch Login/Register */}
                      <div className="mt-7 text-center">
                        <p className="text-[13px] text-slate-500">
                          {isLogin
                            ? "Don't have an account? "
                            : 'Already have an account? '}

                          <button
                            type="button"
                            onClick={switchMode}
                            disabled={busy}
                            className="font-semibold text-green-600 transition-colors hover:text-green-700 disabled:opacity-50"
                          >
                            {isLogin ? 'Create one' : 'Sign in'}
                          </button>
                        </p>

                        {/* {isLogin && (
                          <p className="mt-3 text-[13px] text-slate-500">
                            Signed up but not verified yet?{' '}
                            <button
                              type="button"
                              onClick={handleVerifyExisting}
                              disabled={busy}
                              className="font-semibold text-green-600 transition-colors hover:text-green-700 disabled:opacity-50"
                            >
                              Verify email
                            </button>
                          </p>
                        )} */}
                      </div>
                    </>
                  )}

                  {/* =====================================================
                      VIEW: VERIFY EMAIL OTP
                  ===================================================== */}
                  {view === 'verify' && (
                    <form onSubmit={handleVerifySubmit} className="space-y-5">
                      <OtpInput
                        value={otp}
                        onChange={handleOtpChange}
                        disabled={submitting}
                        hasError={Boolean(formError)}
                        autoFocus
                      />

                      {renderFeedback()}

                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className={primaryButtonClass}
                        loading={submitting}
                      >
                        Verify &amp; Continue
                      </Button>

                      {renderResend()}

                      <div className="flex flex-col items-center gap-3">
                        <button
                          type="button"
                          onClick={changeEmail}
                          disabled={busy}
                          className="text-[13px] font-semibold text-slate-500 transition-colors hover:text-slate-800 disabled:opacity-50"
                        >
                          Use a different email address
                        </button>

                        {renderBackButton()}
                      </div>
                    </form>
                  )}

                  {/* =====================================================
                      VIEW: FORGOT PASSWORD
                  ===================================================== */}
                  {view === 'forgot' && (
                    <form onSubmit={handleForgotSubmit} className="space-y-5">
                      <div>
                        <label htmlFor="forgot-email" className={labelClass}>
                          Email Address{' '}
                          <span className="text-red-500">*</span>
                        </label>

                        <div className="relative">
                          <Mail className={iconClass} />

                          <input
                            id="forgot-email"
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              updateField('email', e.target.value)
                            }
                            className={`${inputClass()} pl-11 pr-4`}
                            placeholder="you@example.com"
                            autoComplete="email"
                            autoFocus
                            required
                          />
                        </div>
                      </div>

                      {renderFeedback()}

                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className={primaryButtonClass}
                        loading={submitting}
                      >
                        Send Reset Code
                      </Button>

                      {renderBackButton()}
                    </form>
                  )}

                  {/* =====================================================
                      VIEW: RESET PASSWORD
                  ===================================================== */}
                  {view === 'reset' && (
                    <form onSubmit={handleResetSubmit} className="space-y-5">
                      <div>
                        <span className={labelClass}>
                          Verification Code{' '}
                          <span className="text-red-500">*</span>
                        </span>

                        <OtpInput
                          value={otp}
                          onChange={handleOtpChange}
                          disabled={submitting}
                          hasError={Boolean(formError) && otp.length < 6}
                          autoFocus
                        />
                      </div>

                      <div>
                        <label htmlFor="new-password" className={labelClass}>
                          New Password{' '}
                          <span className="text-red-500">*</span>
                        </label>

                        <div className="relative">
                          <Lock className={iconClass} />

                          <input
                            id="new-password"
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => {
                              setFormError('')
                              setNewPassword(e.target.value)
                            }}
                            className={`${inputClass()} pl-11 pr-12`}
                            placeholder="At least 6 characters"
                            autoComplete="new-password"
                            required
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword((previous) => !previous)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                            aria-label={
                              showPassword ? 'Hide password' : 'Show password'
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="h-[18px] w-[18px]" />
                            ) : (
                              <Eye className="h-[18px] w-[18px]" />
                            )}
                          </button>
                        </div>

                        {newPassword.length > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${resetStrength.bar}`}
                              />
                            </div>

                            <span
                              className={`text-[11px] font-semibold ${resetStrength.text}`}
                            >
                              {resetStrength.label}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="confirm-password"
                          className={labelClass}
                        >
                          Confirm Password{' '}
                          <span className="text-red-500">*</span>
                        </label>

                        <div className="relative">
                          <Lock className={iconClass} />

                          <input
                            id="confirm-password"
                            type={showPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => {
                              setFormError('')
                              setConfirmPassword(e.target.value)
                            }}
                            className={`${inputClass(passwordMismatch)} pl-11 pr-4`}
                            placeholder="Re-enter the new password"
                            autoComplete="new-password"
                            aria-invalid={passwordMismatch}
                            required
                          />
                        </div>

                        {passwordMismatch && (
                          <p className="mt-1.5 text-[12px] font-medium text-red-500">
                            Passwords do not match
                          </p>
                        )}
                      </div>

                      {renderFeedback()}

                      <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        className={primaryButtonClass}
                        loading={submitting}
                      >
                        Reset Password
                      </Button>

                      {renderResend()}
                      {renderBackButton()}
                    </form>
                  )}

                  {/* Security Note */}
                  <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/60">
                    <ShieldCheck className="h-4 w-4 text-green-600" />

                    <span className="text-[11px] font-medium text-slate-500">
                      Your account is protected by secure authentication
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom footer */}
          <p className="mt-5 text-center text-xs text-slate-400">
            By continuing, you agree to SmartKisan&apos;s Terms of Service &amp;
            Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}
