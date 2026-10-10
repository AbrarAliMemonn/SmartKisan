import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import useStore from '../../store/useStore'

export default function Layout({ children }) {
  const { sidebarOpen } = useStore()
  const { pathname } = useLocation()
  const mainRef = useRef(null)

  // <main> is the scroll container, so the browser will not reset scroll on
  // navigation by itself. Without this every page opens half-way down.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0 })
  }, [pathname])

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-50 dark:bg-night">
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-lg bg-white px-4 py-2 text-sm font-semibold text-green-700 shadow-lg focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>

      <Sidebar />

      <div
        className={`flex min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-[76px]'
        }`}
      >
        <Header />

        <main
          id="main-content"
          ref={mainRef}
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-4 pb-safe outline-none sm:p-6 lg:p-8"
        >
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
