<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import AllocationsView from '../components/AllocationsView.vue'

const API_URL = 'http://localhost:3001/api'
const allocations = ref([])
const loading = ref(true)

const fetchData = async () => {
  loading.value = true
  try {
    const res = await axios.get(`${API_URL}/allocations`)
    allocations.value = res.data
  } catch (e) {
    console.error('Failed to fetch allocations', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<template>
  <div class="fade-in">
    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Loading allocations...
    </div>
    <AllocationsView v-else :allocations="allocations" @refresh="fetchData" />
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
