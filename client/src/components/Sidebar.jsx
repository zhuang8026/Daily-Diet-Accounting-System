import { useLocation, Link } from 'react-router-dom'

const USER_NAV = [
  { path: '/dashboard', icon: 'bi-house-fill', label: '今日總覽' },
  { path: '/food-search', icon: 'bi-search', label: '食物搜尋' },
  { path: '/report', icon: 'bi-graph-up', label: '趨勢報表' },
  { path: '/settings', icon: 'bi-gear-fill', label: '個人設定' }
]

const ADMIN_NAV = [
  { path: '/admin', icon: 'bi-speedometer2', label: '統計儀表板' },
  { path: '/admin/foods', icon: 'bi-database-fill', label: '食物管理' },
  { path: '/admin/records', icon: 'bi-journal-text', label: '飲食紀錄' },
  { path: '/admin/users', icon: 'bi-people-fill', label: '使用者管理' },
  { path: '/admin/announcements', icon: 'bi-megaphone-fill', label: '公告管理' },
  { path: '/admin/logs', icon: 'bi-clock-history', label: '操作紀錄' }
]

export default function Sidebar({ session }) {
  const location = useLocation()
  if (!session) return null

  const navItems = session.role === 'admin' ? ADMIN_NAV : USER_NAV
  const currentPath = location.pathname || '/'

  return (
    <>
      <div className="sidebar-brand p-3 border-bottom">
        <span className="fw-bold small">{session.role === 'admin' ? '後台管理' : '飲食記帳'}</span>
      </div>
      <ul className="nav flex-column p-2" role="list">
        {navItems.map(item => (
          <li className="nav-item" role="listitem" key={item.path}>
            <Link
              to={item.path}
              className={`nav-link d-flex align-items-center gap-2 px-3 py-2 ${currentPath === item.path ? 'active' : ''}`}
              aria-current={currentPath === item.path ? 'page' : undefined}
            >
              <i className={`bi ${item.icon}`}></i>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="sidebar-footer p-3 border-top">
        <div className="small text-secondary">{session.displayName}</div>
      </div>
    </>
  )
}
