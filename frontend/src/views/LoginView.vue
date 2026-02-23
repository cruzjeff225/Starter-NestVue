<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)

async function handleLogin() {
  try {
    error.value = ''
    loading.value = true
    await auth.login(email.value, password.value)
    router.push('/')
  } catch {
    error.value = 'Correo o contraseña incorrectos'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <!-- Background decoration -->
    <div class="bg-blob bg-blob-1"></div>
    <div class="bg-blob bg-blob-2"></div>

    <div class="auth-card">
      <!-- Logo -->
      <div class="auth-logo">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill="white" fill-opacity="0.2"/>
          <path d="M14 6L20 10V18L14 22L8 18V10L14 6Z" stroke="white" stroke-width="2" stroke-linejoin="round"/>
          <circle cx="14" cy="14" r="3" fill="white"/>
        </svg>
      </div>

      <h1 class="auth-title">Bienvenido</h1>
      <p class="auth-subtitle">Ingresa tus credenciales para continuar</p>

      <form class="auth-form" @submit.prevent="handleLogin">
        <!-- Email -->
        <div class="field-group">
          <label class="field-label">Correo electrónico</label>
          <div class="field-wrapper">
            <svg class="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <input
              v-model="email"
              type="email"
              class="field-input"
              placeholder="tu@email.com"
              autocomplete="email"
              required
            />
          </div>
        </div>

        <!-- Password -->
        <div class="field-group">
          <label class="field-label">Contraseña</label>
          <div class="field-wrapper">
            <svg class="field-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="field-input"
              placeholder="••••••••"
              autocomplete="current-password"
              required
            />
            <button type="button" class="field-toggle" @click="showPassword = !showPassword">
              <svg v-if="!showPassword" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" class="auth-error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ error }}
        </div>

        <!-- Submit -->
        <button type="submit" class="auth-btn" :disabled="loading">
          <span v-if="!loading">Iniciar sesión</span>
          <span v-else class="btn-loading">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Verificando...
          </span>
        </button>
      </form>

      <p class="auth-footer">
        ¿No tienes cuenta?
        <RouterLink to="/register" class="auth-link">Regístrate aquí</RouterLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');

.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f8;
  font-family: 'Sora', sans-serif;
  position: relative;
  overflow: hidden;
}

.bg-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  pointer-events: none;
}

.bg-blob-1 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #c7d2fe, #a5b4fc);
  top: -150px;
  right: -100px;
}

.bg-blob-2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, #bfdbfe, #93c5fd);
  bottom: -100px;
  left: -80px;
}

.auth-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 20px 60px -10px rgba(99,102,241,0.15);
  position: relative;
  z-index: 1;
  animation: slideUp 0.4s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

.auth-logo {
  width: 52px;
  height: 52px;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 8px 20px rgba(99,102,241,0.35);
}

.auth-title {
  font-size: 1.6rem;
  font-weight: 600;
  color: #1e1b4b;
  text-align: center;
  margin: 0 0 6px;
  letter-spacing: -0.02em;
}

.auth-subtitle {
  font-size: 0.875rem;
  color: #94a3b8;
  text-align: center;
  margin: 0 0 28px;
  font-weight: 300;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #475569;
  letter-spacing: 0.01em;
}

.field-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.field-icon {
  position: absolute;
  left: 14px;
  color: #94a3b8;
  pointer-events: none;
}

.field-input {
  width: 100%;
  padding: 11px 14px 11px 40px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9rem;
  font-family: 'Sora', sans-serif;
  color: #1e293b;
  background: #f8fafc;
  transition: all 0.2s;
  outline: none;
  box-sizing: border-box;
}

.field-input:focus {
  border-color: #6366f1;
  background: white;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
}

.field-input::placeholder {
  color: #cbd5e1;
}

.field-toggle {
  position: absolute;
  right: 14px;
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  padding: 0;
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.field-toggle:hover { color: #6366f1; }

.auth-error {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #ef4444;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 8px 12px;
}

.auth-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #6366f1, #818cf8);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  font-family: 'Sora', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(99,102,241,0.3);
  margin-top: 4px;
}

.auth-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99,102,241,0.4);
}

.auth-btn:active:not(:disabled) { transform: translateY(0); }

.auth-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spin {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.auth-footer {
  text-align: center;
  font-size: 0.82rem;
  color: #94a3b8;
  margin: 20px 0 0;
}

.auth-link {
  color: #6366f1;
  font-weight: 500;
  text-decoration: none;
  margin-left: 4px;
}

.auth-link:hover { text-decoration: underline; }
</style>