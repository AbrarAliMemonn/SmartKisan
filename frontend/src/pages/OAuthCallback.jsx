import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Loader2 } from 'lucide-react'
import { useAuthContext } from '../context/AuthContext'

export default function OAuthCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { loginWithOAuthToken } = useAuthContext()
  const ranOnce = useRef(false)

  useEffect(() => {
    if (ranOnce.current) return
    ranOnce.current = true

    const token = searchParams.get('token')
    const refreshToken = searchParams.get('refreshToken')
    const error = searchParams.get('error')

    if (error) {
      toast.error(
        decodeURIComponent(error.replace(/\+/g, ' ')) || 'OAuth login failed'
      )
      navigate('/login', { replace: true })
      return
    }

    loginWithOAuthToken(token, refreshToken).then((result) => {
      navigate(result.success ? '/dashboard' : '/login', { replace: true })
    })
  }, [searchParams, navigate, loginWithOAuthToken])

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 dark:bg-night">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[400px] w-[400px] rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/10" />
        <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-teal-200/40 blur-3xl dark:bg-teal-500/10" />
      </div>

      <div className="relative flex flex-col items-center gap-4 rounded-3xl border border-slate-200/60 bg-white/80 px-10 py-12 shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-night-raised/80">
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-600/30">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        </div>

        <div className="text-center">
          <p className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            Finishing sign-in
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Verifying your account, please wait…
          </p>
        </div>

        <div className="flex gap-1">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-500 [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-500 [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-green-500" />
        </div>
      </div>
    </div>
  )
}