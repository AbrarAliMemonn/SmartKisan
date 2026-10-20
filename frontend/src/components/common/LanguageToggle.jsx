import React from 'react'
import { Languages } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'

export default function LanguageToggle({ className = '', variant = 'badge' }) {
  const { language, toggleLanguage } = useLanguage()

  if (variant === 'simple') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${className}`}
        title={language === 'en' ? 'اردو میں تبدیل کریں' : 'Switch to English'}
        aria-label="Toggle Language"
      >
        <Languages size={15} className="text-lime-600 dark:text-lime-400" />
        <span>{language === 'en' ? 'اردو' : 'English'}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`relative inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-100/80 px-3 py-1.5 text-xs font-bold transition-all hover:bg-slate-200/80 hover:border-slate-300 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 ${className}`}
      title={language === 'en' ? 'اردو میں تبدیل کریں' : 'Switch to English'}
      aria-label="Toggle Language"
    >
      <Languages size={14} className="text-green-600 dark:text-lime-400" />
      <span className={language === 'en' ? 'text-green-700 font-extrabold' : 'text-slate-500 font-medium'}>
        EN
      </span>
      <span className="text-slate-300 dark:text-white/20">|</span>
      <span className={language === 'ur' ? 'text-green-700 font-extrabold font-urdu' : 'text-slate-500 font-medium font-urdu'}>
        اردو
      </span>
    </button>
  )
}
