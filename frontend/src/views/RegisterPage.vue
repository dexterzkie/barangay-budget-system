<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  contactNumber: '',
  address: '',
  username: '',
  password: '',
  confirmPassword: ''
})

const error = ref('')
const success = ref(false)
const loading = ref(false)
const showPass = ref(false)

const handleRegister = async () => {
  error.value = ''
  if (!form.value.firstName || !form.value.lastName || !form.value.email || !form.value.username || !form.value.password) {
    error.value = 'Please fill in all required fields.'; return
  }
  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Passwords do not match.'; return
  }
  if (form.value.password.length < 6) {
    error.value = 'Password must be at least 6 characters.'; return
  }

  loading.value = true
  try {
    await axios.post(`${API_URL}/auth/register`, {
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      email: form.value.email,
      contactNumber: form.value.contactNumber,
      address: form.value.address,
      username: form.value.username,
      password: form.value.password
    })
    success.value = true
  } catch (e: any) {
    error.value = e?.response?.data?.error || 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="register-page">
    <div class="bg-circle c1"></div>
    <div class="bg-circle c2"></div>

    <div class="register-card">
      <!-- Success state -->
      <div v-if="success" class="success-view">
        <div class="success-icon"><i class="fas fa-check-circle"></i></div>
        <h2>Registration Submitted!</h2>
        <p>Your account is pending approval by the <strong>Barangay Captain</strong>. You will be able to login once your account has been approved.</p>
        <button class="btn-back" @click="router.push('/login')">
          <i class="fas fa-arrow-left"></i> Back to Login
        </button>
      </div>

      <!-- Registration form -->
      <div v-else>
        <div class="register-header">
          <div class="logo-circle"><i class="fas fa-city"></i></div>
          <h1>Barangay Pagawan</h1>
          <p>Create a Resident Account</p>
        </div>

        <form @submit.prevent="handleRegister" class="register-form">
          <p class="section-label">Personal Information</p>
          <div class="form-row">
            <div class="form-group">
              <label>First Name <span class="req">*</span></label>
              <input v-model="form.firstName" type="text" class="form-control" placeholder="Juan" />
            </div>
            <div class="form-group">
              <label>Last Name <span class="req">*</span></label>
              <input v-model="form.lastName" type="text" class="form-control" placeholder="dela Cruz" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Email Address <span class="req">*</span></label>
              <input v-model="form.email" type="email" class="form-control" placeholder="juan@email.com" />
            </div>
            <div class="form-group">
              <label>Contact Number</label>
              <input v-model="form.contactNumber" type="text" class="form-control" placeholder="09xxxxxxxxx" />
            </div>
          </div>

          <div class="form-group">
            <label>Complete Address</label>
            <input v-model="form.address" type="text" class="form-control" placeholder="Purok, Barangay Pagawan, Manticao, Misamis Oriental" />
          </div>

          <p class="section-label" style="margin-top: 16px;">Account Credentials</p>
          <div class="form-row">
            <div class="form-group">
              <label>Username <span class="req">*</span></label>
              <input v-model="form.username" type="text" class="form-control" placeholder="juandelacruz" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Password <span class="req">*</span></label>
              <div class="input-icon">
                <input v-model="form.password" :type="showPass ? 'text' : 'password'" class="form-control" placeholder="Min. 6 characters" />
                <button type="button" class="eye-btn" @click="showPass = !showPass">
                  <i :class="showPass ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                </button>
              </div>
            </div>
            <div class="form-group">
              <label>Confirm Password <span class="req">*</span></label>
              <input v-model="form.confirmPassword" :type="showPass ? 'text' : 'password'" class="form-control" placeholder="Repeat password" />
            </div>
          </div>

          <div v-if="error" class="error-msg">
            <i class="fas fa-exclamation-circle"></i> {{ error }}
          </div>

          <button type="submit" class="register-btn" :disabled="loading">
            <i class="fas fa-spinner fa-spin" v-if="loading"></i>
            <i class="fas fa-user-plus" v-else></i>
            {{ loading ? 'Submitting...' : 'Submit Registration' }}
          </button>
        </form>

        <div class="login-link">
          Already have an account?
          <a @click="router.push('/login')">Sign In</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a3d12 0%, #1a5f23 50%, #2d8b3d 100%);
  display: flex; align-items: center; justify-content: center;
  padding: 30px 20px; position: relative; overflow: hidden;
}
.bg-circle { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.04); }
.c1 { width: 500px; height: 500px; top: -150px; right: -100px; }
.c2 { width: 300px; height: 300px; bottom: -80px; left: -80px; }

.register-card {
  background: white; border-radius: 24px; padding: 36px 38px;
  width: 100%; max-width: 600px;
  box-shadow: 0 25px 60px rgba(0,0,0,0.3);
  position: relative; z-index: 1;
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(25px); }
  to { opacity: 1; transform: translateY(0); }
}

.register-header { text-align: center; margin-bottom: 24px; }
.logo-circle {
  width: 64px; height: 64px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  border-radius: 18px; font-size: 1.7rem; color: white;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 12px; box-shadow: 0 8px 20px rgba(26,95,35,0.3);
}
.register-header h1 { font-size: 1.4rem; font-weight: 800; color: var(--text); margin-bottom: 4px; }
.register-header p { font-size: 0.82rem; color: var(--light-text); }

.section-label {
  font-size: 0.75rem; font-weight: 700; color: var(--primary);
  text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px;
  padding-bottom: 6px; border-bottom: 1px solid var(--border);
}

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 0.84rem; font-weight: 600; color: var(--text); margin-bottom: 6px; }
.req { color: var(--danger); }

.input-icon { position: relative; }
.eye-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--light-text); transition: color 0.2s; }
.eye-btn:hover { color: var(--primary); }

.form-control {
  width: 100%; padding: 10px 12px; border: 1.5px solid var(--border);
  border-radius: 8px; font-size: 0.9rem; transition: all 0.2s; background: var(--secondary);
}
.form-control:focus { outline: none; border-color: var(--primary); background: white; box-shadow: 0 0 0 3px rgba(26,95,35,0.1); }

.error-msg { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; color: var(--danger); font-size: 0.86rem; font-weight: 500; margin-bottom: 14px; }

.register-btn {
  width: 100%; padding: 12px; background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white; border: none; border-radius: 10px; font-size: 0.95rem; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
  transition: all 0.3s; box-shadow: 0 4px 15px rgba(26,95,35,0.3);
}
.register-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(26,95,35,0.4); }
.register-btn:disabled { opacity: 0.7; cursor: not-allowed; }

.login-link { text-align: center; margin-top: 16px; font-size: 0.85rem; color: var(--light-text); }
.login-link a { color: var(--primary); font-weight: 600; cursor: pointer; }
.login-link a:hover { text-decoration: underline; }

/* Success */
.success-view { text-align: center; padding: 20px 0; }
.success-icon { font-size: 4rem; color: var(--success); margin-bottom: 16px; }
.success-view h2 { font-size: 1.5rem; font-weight: 800; color: var(--text); margin-bottom: 12px; }
.success-view p { color: var(--light-text); line-height: 1.7; margin-bottom: 24px; }
.btn-back { padding: 12px 24px; background: var(--primary); color: white; border: none; border-radius: 10px; font-size: 0.95rem; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.3s; }
.btn-back:hover { background: var(--primary-light); transform: translateY(-2px); }
</style>
