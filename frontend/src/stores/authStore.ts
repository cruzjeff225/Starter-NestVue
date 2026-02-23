import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const rawUsuario = localStorage.getItem('usuario')
  const usuario = ref(rawUsuario && rawUsuario !== 'undefined' ? JSON.parse(rawUsuario) : null)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => usuario.value?.rol === 'admin')

  async function login(email: string, contraseña: string) {
    const res = await api.post('/auth/login', { email, contraseña })
    token.value = res.data.access_token
    usuario.value = res.data.user
    localStorage.setItem('token', token.value)
    localStorage.setItem('usuario', JSON.stringify(usuario.value))
  }

  async function register(nombre: string, email: string, contraseña: string) {
    const res = await api.post('/auth/register', { nombre, email, contraseña })
    token.value = res.data.access_token
    usuario.value = res.data.user
    localStorage.setItem('token', token.value)
    localStorage.setItem('usuario', JSON.stringify(usuario.value))
  }

  function logout() {
    token.value = ''
    usuario.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
  }

  return { token, usuario, isLoggedIn, isAdmin, login, register, logout }
})