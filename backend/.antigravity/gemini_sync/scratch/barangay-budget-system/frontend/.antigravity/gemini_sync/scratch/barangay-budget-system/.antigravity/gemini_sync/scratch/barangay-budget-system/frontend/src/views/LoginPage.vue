<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { login } = useAuth()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const showPass = ref(false)

type RoleOption = {
  label: string
  icon: string
  username: string
  password: string
  color: string
  desc: string
}

const roles: RoleOption[] = [
  {
    label: 'Barangay Captain',
    icon: 'fas fa-user-tie',
    username: 'captain',
    password: 'captain123',
    color: 'gold',
    desc: 'Full admin access — manage all records & budgets'
  },
  {
    label: 'Barangay Treasurer',
    icon: 'fas fa-coins',
    username: 'treasurer',
    password: 'treasurer123',
    color: 'green',
    desc: 'Manage fund allocations and expenditures'
  },
  {
    label: 'Barangay Secretary',
    icon: 'fas fa-file-alt',
    username: 'secretary',
    password: 'secretary123',
    color: 'blue',
    desc: 'Record and review budget transactions'
  },
  {
    label: 'Resident',
    icon: 'fas fa-user',
    username: 'resident',
    password: 'resident123',
    color: 'gray',
    desc: 'View-only access — browse budget information'
  }
]

const selectedRole = ref<RoleOption | null>(null)

const selectRole = (role: RoleOption) => {
  selectedRole.value = role
  username.value = role.username
  password.value = role.password
  error.value = ''
}

const handleLogin = async () => {
  if (!username.value || !password.value) {
    error.value = 'Please enter your username and password.'
    return
  }
  loading.value = true
  error.value = ''
  try {
    await login(username.value, password.value)
    router.push('/')
  } catch (e: any) {
    error.value = e?.response?.data?.error || 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="bg-circle c1"></div>
    <div class="bg-circle c2"></div>
    <div class="bg-circle c3"></div>

    <div class="login-card">
      <!-- Header -->
      <div class="login-header">
        <div class="logo-circle">
          <i class="fas fa-city"></i>
        </div>
        <h1>Barangay Pagawan</h1>
        <p>Budget Allocation & Monitoring System</p>
      </div>

      <!-- Role Grid -->
      <p class="role-label">Select your role to login:</p>
      <div class="role-grid">
        <button
          v-for="role in roles"
          :key="role.label"
          :class="['role-card', role.color, { active: selectedRole?.label === role.label }]"
          @click="selectRole(role)"
        >
          <i :class="role.icon"></i>
          <span>{{ role.label }}</span>
        </button>
      </div>

      <!-- Role description -->
      <div class="role-desc" v-if="selectedRole">
        <i :class="selectedRole.icon"></i>
        <span>{{ selectedRole.desc }}</span>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label>Username</label>
          <div class="input-icon">
            <i class="fas fa-user"></i>
            <input
              v-model="username"
              type="text"
              class="form-control"
              placeholder="Enter username"
              autocomplete="username"
            />
          </div>
        </div>

        <div class="form-group">
          <label>Password</label>
          <div class="input-icon">
            <i class="fas fa-lock"></i>
            <input
              v-model="password"
              :type="showPass ? 'text' : 'password'"
              class="form-control"
              placeholder="Enter password"
              autocomplete="current-password"
            />
            <button type="button" class="eye-btn" @click="showPass = !showPass">
              <i :class="showPass ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
            </button>
          </div>
        </div>

        <div v-if="error" class="error-msg">
          <i class="fas fa-exclamation-circle"></i> {{ error }}
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          <i class="fas fa-spinner fa-spin" v-if="loading"></i>
          <i class="fas fa-sign-in-alt" v-else></i>
          {{ loading ? 'Signing in...' : 'Sign In' }}
        </button>
      </form>

      <div class="demo-hint">
        <i class="fas fa-info-circle"></i>
        Demo: Click a role above to auto-fill credentials
      </div>

      <div class="register-link">
        New resident? <a @click="router.push('/register')">Register an account</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a3d12 0%, #1a5f23 50%, #2d8b3d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,0.04);
}
.c1 { width: 500px; height: 500px; top: -150px; right: -100px; }
.c2 { width: 350px; height: 350px; bottom: -80px; left: -80px; }
.c3 { width: 200px; height: 200px; top: 40%; right: 10%; }

.login-card {
  background: white;
  border-radius: 24px;
  padding: 40px 38px;
  width: 100%;
  max-width: 480px;
  box-shadow: 0 25px 60px rgba(0,0,0,0.35);
  position: relative;
  z-index: 1;
  animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.login-header {
  text-align: center;
  margin-bottom: 24px;
}

.logo-circle {
  width: 70px; height: 70px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  border-radius: 20px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.9rem; color: white;
  margin: 0 auto 14px;
  box-shadow: 0 8px 20px rgba(26, 95, 35, 0.35);
}

.login-header h1 {
  font-size: 1.45rem;
  font-weight: 800;
  color: var(--text);
  margin-bottom: 5px;
  letter-spacing: -0.5px;
}

.login-header p {
  font-size: 0.82rem;
  color: var(--light-text);
  font-weight: 500;
}

/* Role Grid */
.role-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--light-text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

.role-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.role-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  padding: 14px 10px;
  border-radius: 12px;
  border: 2px solid var(--border);
  background: var(--secondary);
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--light-text);
  transition: all 0.22s;
}

.role-card i { font-size: 1.3rem; }

.role-card:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: rgba(26, 95, 35, 0.04);
  transform: translateY(-2px);
}

.role-card.gold.active { border-color: #d97706; color: #d97706; background: rgba(217,119,6,0.06); }
.role-card.green.active { border-color: var(--primary); color: var(--primary); background: rgba(26,95,35,0.07); }
.role-card.blue.active { border-color: #3b82f6; color: #3b82f6; background: rgba(59,130,246,0.07); }
.role-card.gray.active { border-color: #6366f1; color: #6366f1; background: rgba(99,102,241,0.07); }

/* Role desc */
.role-desc {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(26, 95, 35, 0.06);
  color: var(--primary);
  font-size: 0.82rem;
  font-weight: 500;
  margin-bottom: 18px;
}

/* Form */
.login-form { display: flex; flex-direction: column; }

.form-group { margin-bottom: 16px; }

.form-group label {
  display: block;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--text);
  margin-bottom: 7px;
}

.input-icon { position: relative; display: flex; align-items: center; }

.input-icon > i:first-child {
  position: absolute; left: 14px;
  color: var(--light-text); font-size: 0.9rem; pointer-events: none;
}

.input-icon .form-control { padding-left: 40px; padding-right: 44px; }

.eye-btn {
  position: absolute; right: 12px;
  background: none; border: none; cursor: pointer;
  color: var(--light-text); font-size: 0.9rem; padding: 4px;
  transition: color 0.2s;
}
.eye-btn:hover { color: var(--primary); }

.form-control {
  width: 100%; padding: 12px 14px;
  border: 1.5px solid var(--border); border-radius: 10px;
  font-size: 0.95rem; transition: all 0.25s;
  background: var(--secondary); color: var(--text);
}

.form-control:focus {
  outline: none; border-color: var(--primary);
  background: white; box-shadow: 0 0 0 4px rgba(26, 95, 35, 0.1);
}

.error-msg {
  display: flex; align-items: center; gap: 8px;
  padding: 11px 14px;
  background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 10px; color: var(--danger);
  font-size: 0.88rem; font-weight: 500; margin-bottom: 12px;
}

.login-btn {
  width: 100%; padding: 13px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white; border: none; border-radius: 12px;
  font-size: 1rem; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(26, 95, 35, 0.3);
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(26, 95, 35, 0.4);
}

.login-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

.demo-hint {
  text-align: center; margin-top: 18px;
  font-size: 0.78rem; color: var(--light-text);
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.demo-hint i { color: var(--primary); }

.register-link {
  text-align: center; margin-top: 12px;
  font-size: 0.83rem; color: var(--light-text);
}
.register-link a { color: var(--primary); font-weight: 600; cursor: pointer; }
.register-link a:hover { text-decoration: underline; }
</style>
