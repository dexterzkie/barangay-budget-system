<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import Sidebar from './components/Sidebar.vue'
import { useAuth } from './composables/useAuth'

const route = useRoute()
const { state } = useAuth()

const isLoginPage = computed(() => route.path === '/login')

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    '/': 'Budget Allocation & Monitoring System',
    '/allocations': 'Budget Allocation',
    '/expenditures': 'Expenditures',
    '/reports': 'Financial Reports',
    '/settings': 'System Settings'
  }
  return titles[route.path] || 'Dashboard'
})
</script>

<template>
  <!-- Full-page login, no sidebar -->
  <RouterView v-if="isLoginPage" />

  <!-- Main app layout with sidebar -->
  <div class="container" v-else>
    <Sidebar />
    <main class="main-content">
      <div class="header">
        <h2>{{ pageTitle }}</h2>
        <div class="user-info" v-if="state.user">
          <i :class="state.user.role === 'Admin' ? 'fas fa-user-shield' : 'fas fa-user'"></i>
          <span>{{ state.user.fullName }}</span>
          <span class="role-tag" :class="state.user.role.toLowerCase()">{{ state.user.role }}</span>
        </div>
      </div>
      <RouterView />
    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

.container {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: 250px;
  padding: 28px 36px;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border);
}

.header h2 {
  color: var(--text);
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.user-info {
  background: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.88rem;
  font-weight: 600;
  color: var(--text);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-info i { color: var(--primary); }

.role-tag {
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
}

.role-tag.admin {
  background: rgba(26, 95, 35, 0.1);
  color: var(--primary);
}

.role-tag.resident {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 70px;
    padding: 20px;
  }
}
</style>
