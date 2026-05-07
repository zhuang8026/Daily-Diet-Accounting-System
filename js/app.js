/**
 * 模組名稱：app.js
 * 功能說明：SPA 主程式，包含 Hash Router、認證守衛（Auth Guard）、
 *           版面佈局渲染（Header / Sidebar / Bottom Nav）、深色模式自動偵測
 */

import { initSeed } from './seed.js';
import { getCurrentSession, logout, isAdmin } from './auth.js';
import { getTodayISO } from './utils.js';

import { mount as mountLogin } from './pages/login.js';
import { mount as mountRegister } from './pages/register.js';
import { mount as mountAbout } from './pages/about.js';
import { mount as mountDashboard } from './pages/dashboard.js';
import { mount as mountFoodSearch } from './pages/foodSearch.js';
import { mount as mountSettings } from './pages/settings.js';
import { mount as mountReport } from './pages/report.js';
import { mount as mountAdminDashboard } from './pages/admin/adminDashboard.js';
import { mount as mountAdminFoods } from './pages/admin/adminFoods.js';
import { mount as mountAdminRecords } from './pages/admin/adminRecords.js';
import { mount as mountAdminUsers } from './pages/admin/adminUsers.js';
import { mount as mountAdminAnnouncements } from './pages/admin/adminAnnouncements.js';

/** 公開路由（訪客可存取） */
const PUBLIC_ROUTES = ['/login', '/register', '/about', '/'];

/** 路由表：對應 hash 路徑到頁面掛載函式 */
const ROUTE_MAP = {
  '/login': { mount: mountLogin, auth: 'guest' },
  '/register': { mount: mountRegister, auth: 'guest' },
  '/about': { mount: mountAbout, auth: 'guest' },
  '/dashboard': { mount: mountDashboard, auth: 'user' },
  '/food-search': { mount: mountFoodSearch, auth: 'user' },
  '/settings': { mount: mountSettings, auth: 'user' },
  '/report': { mount: mountReport, auth: 'user' },
  '/admin': { mount: mountAdminDashboard, auth: 'admin' },
  '/admin/foods': { mount: mountAdminFoods, auth: 'admin' },
  '/admin/records': { mount: mountAdminRecords, auth: 'admin' },
  '/admin/users': { mount: mountAdminUsers, auth: 'admin' },
  '/admin/announcements': { mount: mountAdminAnnouncements, auth: 'admin' }
};

/**
 * 函式名稱：router
 * 功能說明：解析目前 URL hash，執行認證守衛，掛載對應頁面
 */
const router = () => {
  const hash = window.location.hash.replace('#', '') || '/';
  const session = getCurrentSession();

  // 路由 '/' 根據登入狀態導向
  if (hash === '/') {
    window.location.hash = session ? '#/dashboard' : '#/login';
    return;
  }

  const route = ROUTE_MAP[hash];

  if (!route) {
    render404();
    return;
  }

  // 認證守衛：未登入且需要登入的頁面 → 導向登入
  if (route.auth !== 'guest' && !session) {
    window.location.hash = '#/login';
    return;
  }

  // 已登入且存取訪客限定頁面 → 導向儀表板
  if (route.auth === 'guest' && session) {
    window.location.hash = '#/dashboard';
    return;
  }

  // Admin 守衛：非管理員存取後台 → 403
  if (route.auth === 'admin' && session?.role !== 'admin') {
    render403();
    updateLayout(session);
    return;
  }

  updateLayout(session);
  updateActiveNav(hash);
  route.mount(document.getElementById('app'));

  // GA4 頁面切換事件
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', { page_path: hash });
  }
};

/**
 * 函式名稱：updateLayout
 * 功能說明：根據登入狀態渲染或隱藏 Header、Sidebar、Bottom Nav
 * @param {Object|null} session - 目前登入 Session
 */
const updateLayout = (session) => {
  const layout = document.getElementById('app-layout');
  const header = document.getElementById('app-header');
  const sidebar = document.getElementById('app-sidebar');
  const bottomNav = document.getElementById('app-bottom-nav');

  if (!session) {
    // 訪客模式：隱藏導覽元件
    document.body.classList.remove('auth-mode');
    document.body.classList.add('guest-mode');
    if (header) header.innerHTML = '';
    if (sidebar) { sidebar.innerHTML = ''; sidebar.style.display = 'none'; }
    if (bottomNav) { bottomNav.innerHTML = ''; bottomNav.style.display = 'none !important'; }
    return;
  }

  document.body.classList.remove('guest-mode');
  document.body.classList.add('auth-mode');

  renderHeader(session, header);
  renderSidebar(session, sidebar);
  renderBottomNav(session, bottomNav);
};

/**
 * 函式名稱：renderHeader
 * 功能說明：渲染頂部 Header，包含系統名稱與使用者資訊
 */
const renderHeader = (session, header) => {
  if (!header) return;
  header.innerHTML = `
    <div class="header-inner d-flex align-items-center justify-content-between px-3">
      <div class="d-flex align-items-center gap-2">
        <button class="btn btn-sm btn-link text-white d-md-none p-0" id="sidebar-toggle" aria-label="切換側邊欄">
          <i class="bi bi-list fs-5"></i>
        </button>
        <a href="#/dashboard" class="header-brand text-white text-decoration-none fw-bold">
          <i class="bi bi-clipboard2-heart-fill me-2"></i>
          <span class="d-none d-sm-inline">每日飲食記帳系統</span>
          <span class="d-sm-none">飲食記帳</span>
        </a>
      </div>
      <div class="d-flex align-items-center gap-3">
        ${session.role === 'admin' ? '<span class="badge text-bg-warning">管理員</span>' : ''}
        <span class="text-white-50 small d-none d-sm-inline" id="header-name"></span>
        <button class="btn btn-sm btn-outline-light" id="logout-btn" aria-label="登出">
          <i class="bi bi-box-arrow-right me-1"></i>
          <span class="d-none d-sm-inline">登出</span>
        </button>
      </div>
    </div>
  `;
  // 使用 textContent 安全插入使用者名稱
  const nameEl = document.getElementById('header-name');
  if (nameEl) nameEl.textContent = session.displayName;

  document.getElementById('logout-btn')?.addEventListener('click', logout);
};

const getUserNavItems = () => [
  { path: '/dashboard', icon: 'bi-house-fill', label: '今日總覽' },
  { path: '/food-search', icon: 'bi-search', label: '食物搜尋' },
  { path: '/report', icon: 'bi-graph-up', label: '趨勢報表' },
  { path: '/settings', icon: 'bi-gear-fill', label: '個人設定' }
];

const getAdminNavItems = () => [
  { path: '/admin', icon: 'bi-speedometer2', label: '統計儀表板' },
  { path: '/admin/foods', icon: 'bi-database-fill', label: '食物管理' },
  { path: '/admin/records', icon: 'bi-journal-text', label: '飲食紀錄' },
  { path: '/admin/users', icon: 'bi-people-fill', label: '使用者管理' },
  { path: '/admin/announcements', icon: 'bi-megaphone-fill', label: '公告管理' }
];

/**
 * 函式名稱：renderSidebar
 * 功能說明：渲染桌機版左側固定側邊欄
 */
const renderSidebar = (session, sidebar) => {
  if (!sidebar) return;
  sidebar.style.display = '';
  const navItems = session.role === 'admin' ? getAdminNavItems() : getUserNavItems();
  const currentHash = window.location.hash.replace('#', '');

  sidebar.innerHTML = `
    <div class="sidebar-brand p-3 border-bottom">
      <i class="bi bi-clipboard2-heart-fill text-success me-2"></i>
      <span class="fw-bold small">${session.role === 'admin' ? '後台管理' : '飲食記帳'}</span>
    </div>
    <ul class="nav flex-column p-2" role="list">
      ${navItems.map(item => `
        <li class="nav-item" role="listitem">
          <a href="#${item.path}"
             class="nav-link d-flex align-items-center gap-2 rounded px-3 py-2 ${currentHash === item.path ? 'active' : ''}"
             aria-current="${currentHash === item.path ? 'page' : 'false'}">
            <i class="bi ${item.icon}"></i>
            <span>${item.label}</span>
          </a>
        </li>
      `).join('')}
    </ul>
    <div class="sidebar-footer p-3 border-top mt-auto">
      <div class="small text-secondary" id="sidebar-username"></div>
    </div>
  `;

  // 使用 textContent 安全插入使用者名稱
  const usernameEl = document.getElementById('sidebar-username');
  if (usernameEl) usernameEl.textContent = session.displayName;
};

/**
 * 函式名稱：renderBottomNav
 * 功能說明：渲染手機版底部導覽列
 */
const renderBottomNav = (session, bottomNav) => {
  if (!bottomNav) return;
  bottomNav.style.display = '';
  const navItems = session.role === 'admin' ? getAdminNavItems().slice(0, 4) : getUserNavItems();
  const currentHash = window.location.hash.replace('#', '');

  bottomNav.innerHTML = navItems.map(item => `
    <a href="#${item.path}"
       class="bottom-nav-item flex-fill d-flex flex-column align-items-center py-2 ${currentHash === item.path ? 'active' : ''}"
       aria-label="${item.label}" aria-current="${currentHash === item.path ? 'page' : 'false'}">
      <i class="bi ${item.icon} fs-5"></i>
      <span class="small" style="font-size:10px;">${item.label}</span>
    </a>
  `).join('');
};

/**
 * 函式名稱：updateActiveNav
 * 功能說明：更新側邊欄與底部導覽的 active 狀態
 */
const updateActiveNav = (path) => {
  document.querySelectorAll('.nav-link, .bottom-nav-item').forEach(el => {
    const href = el.getAttribute('href')?.replace('#', '') || '';
    const isActive = href === path;
    el.classList.toggle('active', isActive);
    el.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
};

const render403 = () => {
  const app = document.getElementById('app');
  if (app) app.innerHTML = `
    <div class="d-flex flex-column align-items-center justify-content-center" style="min-height:60vh;">
      <i class="bi bi-shield-x text-danger" style="font-size:4rem;"></i>
      <h1 class="h3 mt-3">403 — 存取被拒絕</h1>
      <p class="text-secondary">您沒有權限存取此頁面</p>
      <a href="#/dashboard" class="btn btn-success mt-2">返回首頁</a>
    </div>
  `;
};

const render404 = () => {
  updateLayout(getCurrentSession());
  const app = document.getElementById('app');
  if (app) app.innerHTML = `
    <div class="d-flex flex-column align-items-center justify-content-center" style="min-height:60vh;">
      <i class="bi bi-question-circle text-secondary" style="font-size:4rem;"></i>
      <h1 class="h3 mt-3">404 — 頁面不存在</h1>
      <p class="text-secondary">您請求的頁面不存在</p>
      <a href="#/dashboard" class="btn btn-success mt-2">返回首頁</a>
    </div>
  `;
};

/**
 * 函式名稱：setupDarkMode
 * 功能說明：依系統偏好設定 Bootstrap data-bs-theme 屬性，並監聽後續切換
 */
const setupDarkMode = () => {
  const apply = (isDark) => {
    document.documentElement.setAttribute('data-bs-theme', isDark ? 'dark' : 'light');
  };
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  apply(mq.matches);
  mq.addEventListener('change', (e) => apply(e.matches));
};

/**
 * 函式名稱：init
 * 功能說明：應用程式啟動入口：初始化深色模式、seed 資料，然後啟動路由
 */
const init = async () => {
  setupDarkMode();

  const loadingEl = document.getElementById('loading-overlay');
  const layoutEl = document.getElementById('app-layout');

  try {
    await initSeed();
  } catch (err) {
    console.error('Seed 初始化失敗', err);
  }

  // 隱藏 loading、顯示主版面
  if (loadingEl) loadingEl.style.display = 'none';
  if (layoutEl) layoutEl.classList.remove('d-none');

  router();
};

// 監聽 hash 路由變更
window.addEventListener('hashchange', router);
window.addEventListener('load', init);
