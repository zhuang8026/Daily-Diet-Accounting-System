import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { session } = useAuth()

  return (
    <div className="app-layout">
      <header className="app-header" role="banner">
        <Header session={session} />
      </header>
      <nav className="app-sidebar" aria-label="主要導覽">
        <Sidebar session={session} />
      </nav>
      <main className="app-main" role="main" tabIndex="-1" aria-label="主要內容區域">
        <Outlet />
      </main>
      <nav className="app-bottom-nav" aria-label="底部快捷導覽">
        <BottomNav session={session} />
      </nav>
    </div>
  )
}
