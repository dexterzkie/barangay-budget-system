import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import LoginPage from '../views/LoginPage.vue'
import RegisterPage from '../views/RegisterPage.vue'
import DashboardView from '../views/DashboardView.vue'
import AllocationsPage from '../views/AllocationsPage.vue'
import ExpendituresPage from '../views/ExpendituresPage.vue'
import ReportsPage from '../views/ReportsPage.vue'
import SettingsPage from '../views/SettingsPage.vue'
import UserManagementPage from '../views/UserManagementPage.vue'
import AIPage from '../views/AIPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginPage, meta: { public: true } },
    { path: '/register', name: 'register', component: RegisterPage, meta: { public: true } },
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/allocations', name: 'allocations', component: AllocationsPage },
    { path: '/expenditures', name: 'expenditures', component: ExpendituresPage },
    { path: '/reports', name: 'reports', component: ReportsPage },
    { path: '/ai', name: 'ai', component: AIPage },
    { path: '/users', name: 'users', component: UserManagementPage, meta: { captainOnly: true } },
    { path: '/settings', name: 'settings', component: SettingsPage }
  ]
})

router.beforeEach((to, _from, next) => {
  const { state, restoreUser } = useAuth()
  restoreUser()

  if (!to.meta.public && !state.isAuthenticated) {
    next({ name: 'login' })
  } else if (to.name === 'login' && state.isAuthenticated) {
    next({ name: 'dashboard' })
  } else if (to.meta.captainOnly && state.user?.role !== 'Barangay Captain') {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
