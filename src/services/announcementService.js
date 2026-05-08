/**
 * 模組名稱：announcementService.js
 * 功能說明：系統公告的新增、讀取、修改、刪除服務
 *           前台顯示目前有效的公告（最多 1 則），後台可管理所有公告
 */

import { setStorage, getStorage } from './storage';
import { generateUUID, formatISO, getTodayISO } from './utils';

/**
 * 函式名稱：getAnnouncements
 * 功能說明：取得所有公告（後台管理使用）
 * @returns {Array} 公告陣列
 */
const getAnnouncements = () => getStorage('ddas_announcements') || [];

/**
 * 函式名稱：getActiveAnnouncement
 * 功能說明：取得目前有效的公告（isActive=true 且在生效日期範圍內）
 * @returns {Object|null} 有效公告或 null
 */
const getActiveAnnouncement = () => {
  const today = getTodayISO();
  const all = getAnnouncements();
  // 找到第一個有效公告（isActive 且在生效日期內）
  return all.find(a => a.isActive && a.startDate <= today && a.endDate >= today) || null;
};

/**
 * 函式名稱：addAnnouncement
 * 功能說明：新增一則公告
 * @param {Object} announcement - 公告資料（title, content, startDate, endDate, isActive）
 * @returns {Object} 已儲存的公告物件
 */
const addAnnouncement = (announcement) => {
  const all = getAnnouncements();
  const now = formatISO();
  const newOne = {
    id: generateUUID(),
    title: announcement.title.trim().slice(0, 50),
    content: announcement.content.trim().slice(0, 500),
    startDate: announcement.startDate,
    endDate: announcement.endDate,
    isActive: Boolean(announcement.isActive),
    createdAt: now,
    updatedAt: now
  };
  setStorage('ddas_announcements', [...all, newOne]);
  return newOne;
};

/**
 * 函式名稱：updateAnnouncement
 * 功能說明：修改公告內容
 * @param {string} id - 公告 UUID
 * @param {Object} updates - 更新欄位
 * @returns {boolean} 是否成功
 */
const updateAnnouncement = (id, updates) => {
  const all = getAnnouncements();
  const idx = all.findIndex(a => a.id === id);
  if (idx === -1) return false;
  const updated = all.map(a =>
    a.id === id ? { ...a, ...updates, updatedAt: formatISO() } : a
  );
  setStorage('ddas_announcements', updated);
  return true;
};

/**
 * 函式名稱：deleteAnnouncement
 * 功能說明：刪除公告
 * @param {string} id - 公告 UUID
 * @returns {boolean} 是否成功
 */
const deleteAnnouncement = (id) => {
  const all = getAnnouncements();
  const filtered = all.filter(a => a.id !== id);
  if (filtered.length === all.length) return false;
  setStorage('ddas_announcements', filtered);
  return true;
};

export { getAnnouncements, getActiveAnnouncement, addAnnouncement, updateAnnouncement, deleteAnnouncement };
