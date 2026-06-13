<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import DashboardStats from '../components/DashboardStats.vue'
import AllocationsView from '../components/AllocationsView.vue'
import ExpendituresView from '../components/ExpendituresView.vue'

const API_URL = 'http://localhost:3001/api'
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
    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Loading dashboard data...
    </div>
    
    <div v-else>
      <DashboardStats :stats="stats" />
      <AllocationsView :allocations="allocations" @refresh="fetchData" />
      <ExpendituresView :expenditures="expenditures" :allocations="allocations" @refresh="fetchData" />
    </div>
  </div>
</template>

<style scoped>
.loading {
  text-align: center;
  padding: 50px;
  font-size: 1.2rem;
  color: var(--light-text);
}
.loading i {
  margin-right: 10px;
  color: var(--primary);
}
</style>
