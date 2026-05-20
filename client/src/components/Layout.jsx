import { Outlet } from 'react-router-dom'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import BottomNav from '@/components/BottomNav'
import { useAuth } from '@/context/AuthContext'

export default function Layout() {
  const { session } = useAuth()

  return (
    <div id="app" className="app-layout">
      <header className="app-header" role="banner">
        <Header session={session} />
      </header>
      <nav id="app-sidebar" className="app-sidebar" aria-label="主要導覽">
        <Sidebar session={session} />
      </nav>
      <main className="app-main" role="main" tabIndex="-1" aria-label="主要內容區域">
        <Outlet />
      </main>
      <nav id="app-bottom-nav" className="app-bottom-nav" aria-label="底部快捷導覽">
        <BottomNav session={session} />
      </nav>
    </div>
  )
}