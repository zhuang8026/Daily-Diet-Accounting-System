import apiClient from './apiClient'

const getAnnouncements = () =>
  apiClient.get('/announcements').then(r => r.data)

const getActiveAnnouncement = () =>
  apiClient.get('/announcements/active').then(r => r.data)

const addAnnouncement = (announcement) =>
  apiClient.post('/announcements', announcement).then(r => r.data)

const updateAnnouncement = (id, updates) =>
  apiClient.put(`/announcements/${id}`, updates).then(r => r.data)

const deleteAnnouncement = (id) =>
  apiClient.delete(`/announcements/${id}`).then(r => r.data)

export { getAnnouncements, getActiveAnnouncement, addAnnouncement, updateAnnouncement, deleteAnnouncement }
