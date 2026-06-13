<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import DashboardStats from '../components/DashboardStats.vue'
import AllocationsView from '../components/AllocationsView.vue'
import ExpendituresView from '../components/ExpendituresView.vue'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const stats = ref(null)
const allocations = ref([])
const expenditures = ref([])
const loading = ref(true)

const fetchData = async () => {
  try {
    const [statsRes, allocRes, expRes] = await Promise.all([
      axios.get(`${API_URL}/dashboard`),
      axios.get(`${API_URL}/allocations`),
      axios.get(`${API_URL}/expenditures`)
    ])
    
    stats.value = statsRes.data
    allocations.value = allocRes.data
    expenditures.value = expRes.data
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="dashboard-view fade-in">
    <div class="dashboard-header">
      <h2>Barangay Budget Overview</h2>
      <p class="subtitle">Real-time financial tracking and allocation monitoring</p>
    </div>

    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Loading dashboard data...
    </div>
    
    <div v-else>
      <DashboardStats :stats="stats" />
      <div class="content-stack">
        <AllocationsView :allocations="allocations" @refresh="fetchData" />
        <ExpendituresView :expenditures="expenditures" :allocations="allocations" @refresh="fetchData" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-header {
  margin-bottom: 25px;
}
.dashboard-header h2 {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text-h);
  margin-bottom: 4px;
}
.subtitle {
  color: var(--text);
  font-size: 0.95rem;
  opacity: 0.8;
}

.content-stack {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.loading {
  text-align: center;
  padding: 50px;
  font-size: 1.2rem;
  color: var(--text);
  opacity: 0.7;
}
.loading i {
  margin-right: 10px;
  color: var(--primary);
}
</style>
