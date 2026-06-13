<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { useAuth } from '../composables/useAuth'

const route = useRoute()
const router = useRouter()
const { state, logout } = useAuth()
const pendingCount = ref(0)

const fetchPending = async () => {
  if (state.user?.role !== 'Barangay Captain') return
  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
    const res = await axios.get(`${API_URL}/dashboard`)
    pendingCount.value = res.data.pendingRegistrations || 0
  } catch {}
}

onMounted(fetchPending)
watch(() => route.path, fetchPending)

const handleLogout = () => {
  logout()
  router.push('/login')
}
</script>

<template>
  <div class="sidebar">
    <div class="logo">
      <div class="logo-icon"><i class="fas fa-city"></i></div>
      <div class="logo-text">
        <span class="logo-name">Brgy. Pagawan</span>
        <span class="logo-sub">Budget System</span>
      </div>
    </div>

    <!-- User Info Card -->
    <div class="user-card" v-if="state.user">
      <div class="user-avatar">
        <i :class="state.user.role === 'Barangay Captain' ? 'fas fa-user-tie'
          : state.user.role === 'Barangay Treasurer' ? 'fas fa-coins'
          : state.user.role === 'Barangay Secretary' ? 'fas fa-file-alt'
          : 'fas fa-user'"></i>
      </div>
      <div class="user-info">
        <span class="user-name">{{ state.user.fullName }}</span>
        <span class="user-role" :class="{
          'captain': state.user.role === 'Barangay Captain',
          'treasurer': state.user.role === 'Barangay Treasurer',
          'secretary': state.user.role === 'Barangay Secretary',
          'resident': state.user.role === 'Resident'
        }">{{ state.user.role }}</span>
      </div>
    </div>

    <ul class="nav-links">
      <li>
        <RouterLink to="/" :class="{ active: route.path === '/' }">
          <i class="fas fa-tachometer-alt"></i> <span>Dashboard</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink to="/allocations" :class="{ active: route.path === '/allocations' }">
          <i class="fas fa-wallet"></i> <span>Budget Allocation</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink to="/expenditures" :class="{ active: route.path === '/expenditures' }">
          <i class="fas fa-file-invoice-dollar"></i> <span>Expenditures</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink to="/reports" :class="{ active: route.path === '/reports' }">
          <i class="fas fa-chart-pie"></i> <span>Reports</span>
        </RouterLink>
      </li>
      <!-- AI Page - visible to all admin roles -->
      <li v-if="state.user?.role !== 'Resident'">
        <RouterLink to="/ai" :class="{ active: route.path === '/ai' }">
          <i class="fas fa-brain"></i> <span>AI Budget AI</span>
        </RouterLink>
      </li>
      <!-- User Management - Captain only -->
      <li v-if="state.user?.role === 'Barangay Captain'">
        <RouterLink to="/users" :class="{ active: route.path === '/users' }">
          <i class="fas fa-users-cog"></i> <span>User Management</span>
          <span class="nav-badge" v-if="pendingCount > 0">{{ pendingCount }}</span>
        </RouterLink>
      </li>
      <li>
        <RouterLink to="/settings" :class="{ active: route.path === '/settings' }">
          <i class="fas fa-cog"></i> <span>Settings</span>
        </RouterLink>
      </li>
    </ul>

    <div class="sidebar-footer">
      <button class="logout-btn" @click="handleLogout">
        <i class="fas fa-sign-out-alt"></i> <span>Logout</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  width: 250px;
  background: linear-gradient(180deg, #0f3d17 0%, var(--primary) 40%, #1d6b2a 100%);
  color: white;
  padding: 0;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
  box-shadow: 4px 0 20px rgba(0,0,0,0.2);
  z-index: 100;
  display: flex;
  flex-direction: column;
}

.logo {
  padding: 22px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 42px; height: 42px;
  background: rgba(255,255,255,0.15);
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.3rem;
  color: var(--accent);
  flex-shrink: 0;
}

.logo-text { display: flex; flex-direction: column; }
.logo-name { font-size: 1rem; font-weight: 700; line-height: 1.2; }
.logo-sub { font-size: 0.72rem; color: rgba(255,255,255,0.5); font-weight: 500; }

/* User Card */
.user-card {
  margin: 14px 12px;
  padding: 12px;
  background: rgba(255,255,255,0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(255,255,255,0.08);
}

.user-avatar {
  width: 36px; height: 36px;
  background: rgba(255,255,255,0.15);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1rem;
  flex-shrink: 0;
}

.user-info { display: flex; flex-direction: column; overflow: hidden; }
.user-name { font-size: 0.85rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-role {
  font-size: 0.7rem; font-weight: 700;
  padding: 2px 8px; border-radius: 20px; align-self: flex-start; margin-top: 3px;
}
.user-role.captain  { background: rgba(217,119,6,0.25);   color: #fbbf24; }
.user-role.treasurer{ background: rgba(16,185,129,0.25);  color: #6ee7b7; }
.user-role.secretary{ background: rgba(59,130,246,0.25);  color: #93c5fd; }
.user-role.resident { background: rgba(99,102,241,0.25);  color: #c4b5fd; }

/* Nav */
.nav-links {
  list-style: none;
  padding: 8px 12px;
  flex: 1;
}

.nav-links li { margin-bottom: 4px; }

.nav-links a {
  display: flex; align-items: center;
  padding: 11px 14px;
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.25s;
  font-size: 0.92rem;
  font-weight: 500;
  gap: 12px;
}

.nav-links a:hover,
.nav-links a.active {
  background: rgba(255,255,255,0.15);
  color: white;
}

.nav-links a.active {
  background: rgba(255,255,255,0.18);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding-left: 18px;
}

.nav-links i { width: 18px; text-align: center; font-size: 0.95rem; }

.nav-badge {
  margin-left: auto;
  background: #ef4444;
  color: white;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 2px 7px;
  border-radius: 20px;
  min-width: 20px;
  text-align: center;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Footer */
.sidebar-footer {
  padding: 12px;
  border-top: 1px solid rgba(255,255,255,0.08);
}

.logout-btn {
  width: 100%;
  display: flex; align-items: center; justify-content: center;
  gap: 10px;
  padding: 11px;
  background: rgba(239,68,68,0.15);
  border: 1px solid rgba(239,68,68,0.2);
  color: #fca5a5;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.25s;
}

.logout-btn:hover {
  background: rgba(239,68,68,0.3);
  color: white;
}

@media (max-width: 768px) {
  .sidebar { width: 70px; }
  .logo-text, .user-info, .user-role, .nav-links a span, .logout-btn span { display: none; }
  .user-card { justify-content: center; padding: 8px; }
  .logo { justify-content: center; padding: 16px 10px; }
  .nav-links a { justify-content: center; padding: 13px; }
  .nav-links a.active { padding-left: 13px; }
  .logout-btn { justify-content: center; padding: 12px 8px; }
}
</style>
