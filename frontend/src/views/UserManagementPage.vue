<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const users = ref<any[]>([])
const loading = ref(true)
const filter = ref('all')
const actionLoading = ref<number | null>(null)
const toast = ref({ show: false, msg: '', type: 'success' })

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await axios.get(`${API_URL}/users`)
    users.value = res.data
  } catch (e) {
    console.error('Failed to fetch users', e)
  } finally {
    loading.value = false
  }
}

const updateStatus = async (userId: number, status: 'Approved' | 'Rejected') => {
  actionLoading.value = userId
  try {
    await axios.patch(`${API_URL}/users/${userId}/status`, { status })
    const user = users.value.find(u => u.id === userId)
    if (user) user.status = status
    showToast(`Account ${status.toLowerCase()} successfully.`, status === 'Approved' ? 'success' : 'danger')
  } catch {
    showToast('Action failed. Please try again.', 'danger')
  } finally {
    actionLoading.value = null
  }
}

const showToast = (msg: string, type: string) => {
  toast.value = { show: true, msg, type }
  setTimeout(() => { toast.value.show = false }, 3500)
}

const filteredUsers = computed(() => {
  if (filter.value === 'all') return users.value
  return users.value.filter(u => u.status.toLowerCase() === filter.value)
})

const counts = computed(() => ({
  all: users.value.length,
  pending: users.value.filter(u => u.status === 'Pending').length,
  approved: users.value.filter(u => u.status === 'Approved').length,
  rejected: users.value.filter(u => u.status === 'Rejected').length
}))

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

onMounted(fetchUsers)
</script>

<template>
  <div class="fade-in">
    <!-- Toast -->
    <div class="toast" :class="[toast.type, { show: toast.show }]">
      <i :class="toast.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
      {{ toast.msg }}
    </div>

    <!-- Filter tabs -->
    <div class="filter-tabs">
      <button v-for="tab in ['all', 'pending', 'approved', 'rejected']" :key="tab"
        :class="['tab-btn', tab, { active: filter === tab }]"
        @click="filter = tab">
        <span class="tab-label">{{ tab.charAt(0).toUpperCase() + tab.slice(1) }}</span>
        <span class="tab-count">{{ counts[tab as keyof typeof counts] }}</span>
      </button>
    </div>

    <!-- Info banner for pending -->
    <div class="info-banner" v-if="counts.pending > 0">
      <i class="fas fa-bell"></i>
      <span>You have <strong>{{ counts.pending }}</strong> pending registration request{{ counts.pending > 1 ? 's' : '' }} awaiting your approval.</span>
    </div>

    <div class="content-section">
      <div class="section-header">
        <h3><i class="fas fa-users"></i> Resident Registration Requests</h3>
        <button class="btn btn-outline" @click="fetchUsers" style="font-size:0.85rem">
          <i class="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      <div v-if="loading" class="loading">
        <i class="fas fa-spinner fa-spin"></i> Loading requests...
      </div>

      <div v-else-if="filteredUsers.length === 0" class="empty-state">
        <i class="fas fa-users-slash"></i>
        <p>No {{ filter === 'all' ? '' : filter }} registrations found.</p>
      </div>

      <div v-else class="user-cards">
        <div v-for="user in filteredUsers" :key="user.id" class="user-card" :class="user.status.toLowerCase()">
          <!-- Status ribbon -->
          <div class="ribbon" :class="user.status.toLowerCase()">{{ user.status }}</div>

          <div class="card-body">
            <div class="user-avatar-lg">
              <i class="fas fa-user"></i>
            </div>
            <div class="user-details">
              <h4>{{ user.fullName }}</h4>
              <div class="detail-grid">
                <div class="detail-item">
                  <i class="fas fa-at"></i>
                  <span>{{ user.username }}</span>
                </div>
                <div class="detail-item">
                  <i class="fas fa-envelope"></i>
                  <span>{{ user.email || '—' }}</span>
                </div>
                <div class="detail-item">
                  <i class="fas fa-phone"></i>
                  <span>{{ user.contactNumber || '—' }}</span>
                </div>
                <div class="detail-item">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>{{ user.address || '—' }}</span>
                </div>
                <div class="detail-item">
                  <i class="fas fa-calendar-alt"></i>
                  <span>Registered {{ formatDate(user.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card-actions" v-if="user.status === 'Pending'">
            <button class="action-btn approve"
              :disabled="actionLoading === user.id"
              @click="updateStatus(user.id, 'Approved')">
              <i :class="actionLoading === user.id ? 'fas fa-spinner fa-spin' : 'fas fa-check'"></i>
              Approve
            </button>
            <button class="action-btn reject"
              :disabled="actionLoading === user.id"
              @click="updateStatus(user.id, 'Rejected')">
              <i class="fas fa-times"></i>
              Reject
            </button>
          </div>
          <div class="card-actions" v-else>
            <span class="final-status" :class="user.status.toLowerCase()">
              <i :class="user.status === 'Approved' ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
              {{ user.status }}
            </span>
            <button v-if="user.status === 'Rejected'" class="action-btn approve small"
              @click="updateStatus(user.id, 'Approved')">
              <i class="fas fa-undo"></i> Approve Now
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Toast */
.toast {
  position: fixed; top: 24px; right: 24px;
  padding: 14px 20px; border-radius: 12px; font-weight: 600; font-size: 0.9rem;
  display: flex; align-items: center; gap: 10px; z-index: 9999;
  transform: translateX(120%); transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}
.toast.show { transform: translateX(0); }
.toast.success { background: var(--success); color: white; }
.toast.danger { background: var(--danger); color: white; }

/* Filter Tabs */
.filter-tabs { display: flex; gap: 10px; margin-bottom: 18px; flex-wrap: wrap; }
.tab-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 18px; border-radius: 10px; border: 1.5px solid var(--border);
  background: white; cursor: pointer; font-weight: 600; font-size: 0.88rem;
  color: var(--light-text); transition: all 0.2s;
}
.tab-btn:hover { border-color: var(--primary); color: var(--primary); }
.tab-btn.active.all    { border-color: var(--primary); background: rgba(26,95,35,0.06); color: var(--primary); }
.tab-btn.active.pending  { border-color: #d97706; background: rgba(217,119,6,0.07); color: #d97706; }
.tab-btn.active.approved { border-color: var(--success); background: rgba(16,185,129,0.07); color: var(--success); }
.tab-btn.active.rejected { border-color: var(--danger); background: rgba(239,68,68,0.07); color: var(--danger); }
.tab-count { background: var(--secondary); padding: 2px 8px; border-radius: 20px; font-size: 0.78rem; }

/* Info banner */
.info-banner {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 18px; background: rgba(245,158,11,0.1);
  border: 1px solid rgba(245,158,11,0.3); border-radius: 10px;
  color: #92400e; font-size: 0.9rem; margin-bottom: 18px;
}
.info-banner i { color: #d97706; }

/* Content section */
.content-section { background: white; border-radius: 16px; padding: 24px; box-shadow: var(--card-shadow); border: 1px solid rgba(255,255,255,0.5); }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid var(--border); }
.section-header h3 { font-size: 1.15rem; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 10px; }
.section-header h3 i { color: var(--primary); }

.loading, .empty-state { text-align: center; padding: 50px; color: var(--light-text); }
.loading i, .empty-state i { font-size: 2.5rem; margin-bottom: 12px; display: block; opacity: 0.4; }
.empty-state p { font-size: 1rem; margin-top: 8px; }

/* User Cards */
.user-cards { display: flex; flex-direction: column; gap: 14px; }
.user-card {
  border: 1.5px solid var(--border); border-radius: 14px; overflow: hidden;
  position: relative; transition: box-shadow 0.2s;
}
.user-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
.user-card.pending { border-color: rgba(217,119,6,0.3); }
.user-card.approved { border-color: rgba(16,185,129,0.3); }
.user-card.rejected { border-color: rgba(239,68,68,0.2); opacity: 0.85; }

.ribbon {
  position: absolute; top: 14px; right: -8px;
  padding: 3px 14px 3px 10px; font-size: 0.72rem; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.5px;
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 8px 50%);
}
.ribbon.pending  { background: #fef3c7; color: #92400e; }
.ribbon.approved { background: #d1fae5; color: #065f46; }
.ribbon.rejected { background: #fee2e2; color: #991b1b; }

.card-body { display: flex; gap: 16px; padding: 18px 20px; align-items: flex-start; }
.user-avatar-lg {
  width: 52px; height: 52px; border-radius: 14px; flex-shrink: 0;
  background: rgba(26,95,35,0.08); display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem; color: var(--primary);
}
.user-details { flex: 1; }
.user-details h4 { font-size: 1.05rem; font-weight: 700; color: var(--text); margin-bottom: 8px; }
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px 16px; }
.detail-item { display: flex; align-items: center; gap: 7px; font-size: 0.83rem; color: var(--light-text); }
.detail-item i { width: 14px; color: var(--primary); opacity: 0.7; flex-shrink: 0; }
.detail-item span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.card-actions { padding: 12px 20px; background: var(--secondary); border-top: 1px solid var(--border); display: flex; align-items: center; gap: 10px; }

.action-btn {
  padding: 9px 20px; border: none; border-radius: 8px; font-weight: 700;
  font-size: 0.88rem; cursor: pointer; display: flex; align-items: center; gap: 7px; transition: all 0.25s;
}
.action-btn.approve { background: var(--success); color: white; }
.action-btn.approve:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
.action-btn.reject  { background: var(--danger); color: white; }
.action-btn.reject:hover:not(:disabled)  { filter: brightness(1.1); transform: translateY(-1px); }
.action-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.action-btn.small { padding: 6px 14px; font-size: 0.82rem; }

.final-status { display: flex; align-items: center; gap: 7px; font-weight: 700; font-size: 0.9rem; }
.final-status.approved { color: var(--success); }
.final-status.rejected { color: var(--danger); }

.btn-outline { padding: 8px 14px; border: 1.5px solid var(--border); border-radius: 8px; background: white; cursor: pointer; font-weight: 500; font-size: 0.88rem; display: flex; align-items: center; gap: 7px; transition: all 0.2s; color: var(--light-text); }
.btn-outline:hover { border-color: var(--primary); color: var(--primary); }
</style>
