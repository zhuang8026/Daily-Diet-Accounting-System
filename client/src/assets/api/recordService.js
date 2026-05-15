import apiClient from './apiClient'

const getRecords = ({ date, mealType } = {}) =>
  apiClient.get('/records', { params: { date, meal_type: mealType } }).then(r => r.data)

const addRecord = (record) =>
  apiClient.post('/records', record).then(r => r.data)

const updateRecord = (recordId, updates) =>
  apiClient.put(`/records/${recordId}`, updates).then(r => r.data)

const deleteRecord = (recordId) =>
  apiClient.delete(`/records/${recordId}`).then(r => r.data)

const getDailySummary = (date) =>
  apiClient.get('/records/summary/daily', { params: { date } }).then(r => r.data)

const getDateRangeSummary = (startDate, endDate) =>
  apiClient.get('/records/summary/range', { params: { start_date: startDate, end_date: endDate } }).then(r => r.data)

const getAllRecordsForAdmin = (filters = {}) =>
  apiClient.get('/admin/records', { params: {
    start_date: filters.startDate,
    end_date: filters.endDate,
    meal_type: filters.mealType,
    user_id: filters.userId,
    user_email: filters.userEmail
  }}).then(r => r.data)

const adminDeleteRecord = (recordId) =>
  apiClient.delete(`/admin/records/${recordId}`).then(r => r.data)

export { getRecords, addRecord, updateRecord, deleteRecord, getDailySummary, getDateRangeSummary, getAllRecordsForAdmin, adminDeleteRecord }
