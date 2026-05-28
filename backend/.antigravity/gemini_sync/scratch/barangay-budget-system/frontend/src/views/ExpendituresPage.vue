<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import ExpendituresView from '../components/ExpendituresView.vue'

const API_URL = 'http://localhost:3001/api'
const expenditures = ref([])
const allocations = ref([])
const loading = ref(true)

const fetchData = async () => {
  loading.value = true
  try {
    const [expRes, allocRes] = await Promise.all([
      axios.get(`${API_URL}/expenditures`),
      axios.get(`${API_URL}/allocations`)
    ])
    expenditures.value = expRes.data
    allocations.value = allocRes.data
  } catch (e) {
    console.error('Failed to fetch expenditures', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="fade-in">
    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Loading expenditures...
    </div>
    <ExpendituresView v-else :expenditures="expenditures" :allocations="allocations" @refresh="fetchData" />
  </div>
</template>

<style scoped>
.loading {
  text-align: center;
  padding: 60px;
  font-size: 1.1rem;
  color: var(--light-text);
}
.loading i { margin-right: 8px; color: var(--primary); }
</style>
