import apiClient from './apiClient'

const getProfile = () =>
  apiClient.get('/profile').then(r => r.data)

const updateProfile = (updates) =>
  apiClient.put('/profile', updates).then(r => r.data)

const getTargets = () =>
  apiClient.get('/profile/targets').then(r => r.data)

export { getProfile, updateProfile, getTargets }
