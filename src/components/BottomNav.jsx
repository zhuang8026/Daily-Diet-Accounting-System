import { useLocation, Link } from 'react-router-dom'

const USER_NAV = [
  { path: '/dashboard', icon: 'bi-house-fill', label: '今日總覽' },
  { path: '/food-search', icon: 'bi-search', label: '食物搜尋' },
  { path: '/report', icon: 'bi-graph-up', label: '趨勢報表' },
  { path: '/settings', icon: 'bi-gear-fill', label: '個人設定' }
]

const ADMIN_NAV = [
  { path: '/admin', icon: 'bi-speedometer2', label: '統計' },
  { path: '/admin/foods', icon: 'bi-database-fill', label: '食物' },
  { path: '/admin/records', icon: 'bi-journal-text', label: '紀錄' },
  { path: '/admin/users', icon: 'bi-people-fill', label: '使用者' },
  { path: '/admin/announcements', icon: 'bi-megaphone-fill', label: '公告' }
]

export default function BottomNav({ session }) {
  const location = useLocation()
  if (!session) return null

  const navItems = session.role === 'admin' ? ADMIN_NAV : USER_NAV
  const currentPath = location.pathname

  return (
    <>
      {navItems.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`bottom-nav-item flex-fill d-flex flex-column align-items-center py-2 ${currentPath === item.path ? 'active' : ''}`}
          aria-label={item.label}
          aria-current={currentPath === item.path ? 'page' : undefined}
        >
          <i className={`bi ${item.icon} fs-5`}></i>
          <span className="small" style={{ fontSize: '10px' }}>{item.label}</span>
        </Link>
      ))}
    </>
  )
}
