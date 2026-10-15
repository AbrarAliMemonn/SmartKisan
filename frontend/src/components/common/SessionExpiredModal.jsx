import React from 'react'
import { Clock, LogIn } from 'lucide-react'

export default function SessionExpiredModal({ isOpen, onLogin }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/75 p-4 backdrop-blur-md">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10 dark:bg-night-raised dark:ring-white/10 animate-in fade-in zoom-in-95 duration-200">
        
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
            <Clock size={26} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Session Expired
            </h3>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Inactivity Timeout (5 Minutes)
            </p>
          </div>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          Your portal session has expired because no activity was detected for <strong>5 minutes</strong>. For the security of your account and farm data, you have been automatically signed out.
        </p>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-white/10">
          <button
            type="button"
            onClick={onLogin}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all"
          >
            <LogIn size={16} />
            <span>Log In Again</span>
          </button>
        </div>

      </div>
    </div>
  )
}
