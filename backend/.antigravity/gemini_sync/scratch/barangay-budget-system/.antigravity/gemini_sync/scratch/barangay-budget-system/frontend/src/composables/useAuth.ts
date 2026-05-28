import { reactive } from 'vue'
import axios from 'axios'

const API_URL = 'http://localhost:3001/api'

interface AuthUser {
  id: number
  username: string
  role: 'Admin' | 'Resident'
  fullName: string
}

const state = reactive({
  user: null as AuthUser | null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token')
})

// Set axios default auth header if token exists on load
if (state.token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
}

const login = async (username: string, password: string) => {
  const res = await axios.post(`${API_URL}/auth/login`, { username, password })
  state.token = res.data.token
  state.user = res.data.user
  state.isAuthenticated = true
  localStorage.setItem('token', res.data.token)
  localStorage.setItem('user', JSON.stringify(res.data.user))
  axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`
  return res.data.user
}

const logout = () => {
  state.token = null
  state.user = null
  state.isAuthenticated = false
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  delete axios.defaults.headers.common['Authorization']
}

const restoreUser = () => {
  const saved = localStorage.getItem('user')
  if (saved) state.user = JSON.parse(saved)
}

export const useAuth = () => ({ state, login, logout, restoreUser })
