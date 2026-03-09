import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Navbar from './Navbar'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      <footer className="border-t border-th-border-light mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-th-text-muted">
          <span>© {new Date().getFullYear()} Adelray SAS</span>
          <span className="hidden sm:inline">·</span>
          <Link to="/cgv" className="hover:text-th-accent transition-colors">CGV</Link>
          <span className="hidden sm:inline">·</span>
          <Link to="/cgv#mentions" className="hover:text-th-accent transition-colors">Mentions légales</Link>
          <span className="hidden sm:inline">·</span>
          <a href="mailto:contact@adelray.com" className="hover:text-th-accent transition-colors">contact@adelray.com</a>
        </div>
      </footer>
    </div>
  )
}
