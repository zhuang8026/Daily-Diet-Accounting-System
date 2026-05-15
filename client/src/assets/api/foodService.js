import apiClient from './apiClient'

const getFoods = ({ keyword = '', category = '', minCal = 0, maxCal = 9999, page = 1, limit = 12 } = {}) =>
  apiClient.get('/foods', { params: { keyword, category, min_cal: minCal, max_cal: maxCal, page, limit } }).then(r => r.data)

const getFoodById = (foodId) =>
  apiClient.get(`/foods/${foodId}`).then(r => r.data)

const searchFoods = (keyword) =>
  apiClient.get('/foods/search', { params: { keyword } }).then(r => r.data)

const addFood = (food) =>
  apiClient.post('/foods', food).then(r => r.data)

const updateFood = (foodId, updates) =>
  apiClient.put(`/foods/${foodId}`, updates).then(r => r.data)

const deleteFood = (foodId) =>
  apiClient.delete(`/foods/${foodId}`).then(r => r.data)

const generateFoodId = () => ''

const importFoodsFromCsv = (csvText) =>
  apiClient.post('/foods/import-csv', { csvText }).then(r => r.data)

export { getFoods, getFoodById, searchFoods, addFood, updateFood, deleteFood, generateFoodId, importFoodsFromCsv }
