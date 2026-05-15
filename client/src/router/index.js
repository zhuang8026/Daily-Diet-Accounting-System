import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Dashboard from '@/pages/Dashboard'
import FoodSearch from '@/pages/FoodSearch'
import Report from '@/pages/Report'
import Settings from '@/pages/Settings'
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminFoods from '@/pages/admin/AdminFoods'
import AdminRecords from '@/pages/admin/AdminRecords'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminAnnouncements from '@/pages/admin/AdminAnnouncements'

const guestRoutes = [
    { path: '/login', component: Login },
    { path: '/register', component: Register },
];

const authRoutes = [
    { path: '/dashboard', component: Dashboard },
    { path: '/food-search', component: FoodSearch },
    { path: '/report', component: Report },
    { path: '/settings', component: Settings },
];

const adminRoutes = [
    { path: '/admin', component: AdminDashboard },
    { path: '/admin/foods', component: AdminFoods },
    { path: '/admin/records', component: AdminRecords },
    { path: '/admin/users', component: AdminUsers },
    { path: '/admin/announcements', component: AdminAnnouncements },
];

export { guestRoutes, authRoutes, adminRoutes };