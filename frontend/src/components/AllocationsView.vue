<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useAuth } from '../composables/useAuth'

const props = defineProps({
  allocations: {
    type: Array,
    required: true
  }
})

const { state } = useAuth()
const isAdmin = () => state.user?.role !== 'Resident'

const emit = defineEmits(['refresh'])
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const showModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showDetailsModal = ref(false)
const isSubmitting = ref(false)
const selectedAlloc = ref(null)

const formData = ref({
  fundType: '',
  allocatedAmount: '',
  status: 'Approved'
})

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount)
}

const submitAllocation = async () => {
  if (!formData.value.fundType || !formData.value.allocatedAmount) return
  
  isSubmitting.value = true
  try {
    await axios.post(`${API_URL}/allocations`, formData.value)
    showModal.value = false
    formData.value = { fundType: '', allocatedAmount: '', status: 'Approved' }
    emit('refresh')
  } catch (error) {
    console.error('Failed to add allocation', error)
    alert('Failed to add allocation')
  } finally {
    isSubmitting.value = false
  }
}

const openEdit = (alloc) => {
  selectedAlloc.value = alloc
  formData.value = {
    fundType: alloc.fundType,
    allocatedAmount: alloc.allocatedAmount,
    status: alloc.status
  }
  showEditModal.value = true
}

const openDelete = (alloc) => {
  selectedAlloc.value = alloc
  showDeleteModal.value = true
}

const openDetails = (alloc) => {
  selectedAlloc.value = alloc
  showDetailsModal.value = true
}

const submitEdit = async () => {
  if (!formData.value.fundType || !formData.value.allocatedAmount) return
  isSubmitting.value = true
  try {
    await axios.put(`${API_URL}/allocations/${selectedAlloc.value.id}`, formData.value)
    showEditModal.value = false
    emit('refresh')
  } catch (error) {
    console.error('Failed to update allocation', error)
    alert('Failed to update allocation')
  } finally {
    isSubmitting.value = false
  }
}

const submitDelete = async () => {
  isSubmitting.value = true
  try {
    await axios.delete(`${API_URL}/allocations/${selectedAlloc.value.id}`)
    showDeleteModal.value = false
    emit('refresh')
  } catch (error) {
    console.error('Failed to delete allocation', error)
    alert(error?.response?.data?.error || 'Failed to delete allocation')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="content-section">
    <div class="section-header">
      <h3>Budget Allocation by Fund Type</h3>
      <button v-if="isAdmin()" class="btn btn-primary" @click="showModal = true">
        <i class="fas fa-plus"></i> Add Allocation
      </button>
    </div>
    
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Fund Type</th>
            <th>Allocated Amount</th>
            <th>Expended</th>
            <th>Balance</th>
            <th>Utilization</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="allocations.length === 0">
            <td colspan="7" class="text-center">No allocations found</td>
          </tr>
          <tr v-for="alloc in allocations" :key="alloc.id">
            <td class="font-medium">{{ alloc.fundType }}</td>
            <td>{{ formatCurrency(alloc.allocatedAmount) }}</td>
            <td>{{ formatCurrency(alloc.expended) }}</td>
            <td :class="{'text-danger': alloc.balance < 0}">{{ formatCurrency(alloc.balance) }}</td>
            <td>
              <div class="progress-container">
                <div class="progress-bar">
                  <div class="progress-fill" 
                       :style="{ width: `${Math.min(alloc.utilization, 100)}%`, background: alloc.utilization > 90 ? 'var(--danger)' : 'var(--primary)' }">
                  </div>
                </div>
                <small>{{ alloc.utilization }}%</small>
              </div>
            </td>
            <td>
              <span class="status" :class="`status-${alloc.status.toLowerCase()}`">{{ alloc.status }}</span>
            </td>
            <td>
              <button class="btn-icon text-success" title="View Details" @click="openDetails(alloc)"><i class="fas fa-eye"></i></button>
              <button v-if="isAdmin()" class="btn-icon text-primary" title="Edit" @click="openEdit(alloc)"><i class="fas fa-edit"></i></button>
              <button v-if="isAdmin()" class="btn-icon text-danger" title="Delete" @click="openDelete(alloc)"><i class="fas fa-trash"></i></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add Allocation Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content fade-in">
        <div class="modal-header">
          <h3>Add New Allocation</h3>
          <button class="close-btn" @click="showModal = false"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Fund Type Name</label>
            <input type="text" v-model="formData.fundType" class="form-control" placeholder="e.g. Health & Sanitation Fund" />
          </div>
          <div class="form-group">
            <label>Allocated Amount (₱)</label>
            <input type="number" v-model="formData.allocatedAmount" class="form-control" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="formData.status" class="form-control">
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showModal = false" :disabled="isSubmitting">Cancel</button>
          <button class="btn btn-primary" @click="submitAllocation" :disabled="isSubmitting">
            <i class="fas fa-spinner fa-spin" v-if="isSubmitting"></i> 
            {{ isSubmitting ? 'Saving...' : 'Save Allocation' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Allocation Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content fade-in">
        <div class="modal-header">
          <h3>Edit Allocation</h3>
          <button class="close-btn" @click="showEditModal = false"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Fund Type Name</label>
            <input type="text" v-model="formData.fundType" class="form-control" placeholder="e.g. Health & Sanitation Fund" />
          </div>
          <div class="form-group">
            <label>Allocated Amount (₱)</label>
            <input type="number" v-model="formData.allocatedAmount" class="form-control" placeholder="0.00" />
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="formData.status" class="form-control">
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showEditModal = false" :disabled="isSubmitting">Cancel</button>
          <button class="btn btn-primary" @click="submitEdit" :disabled="isSubmitting">
            <i class="fas fa-spinner fa-spin" v-if="isSubmitting"></i> 
            {{ isSubmitting ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Allocation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-content fade-in" style="max-width: 400px; text-align: center;">
        <div class="modal-body" style="padding-top: 30px;">
          <div style="font-size: 3rem; color: var(--danger); margin-bottom: 15px;">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <h3 style="margin-bottom: 10px;">Delete Allocation?</h3>
          <p style="color: var(--light-text); margin-bottom: 20px;">
            Are you sure you want to delete <strong>{{ selectedAlloc?.fundType }}</strong>? This action cannot be undone.
          </p>
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button class="btn btn-outline" @click="showDeleteModal = false" :disabled="isSubmitting">Cancel</button>
            <button class="btn btn-danger" @click="submitDelete" :disabled="isSubmitting">
              <i class="fas fa-spinner fa-spin" v-if="isSubmitting"></i> 
              {{ isSubmitting ? 'Deleting...' : 'Yes, Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- View Details Modal -->
    <div v-if="showDetailsModal" class="modal-overlay" @click.self="showDetailsModal = false">
      <div class="modal-content fade-in" style="max-width: 600px;">
        <div class="modal-header">
          <h3>{{ selectedAlloc?.fundType }} Details</h3>
          <button class="close-btn" @click="showDetailsModal = false"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div style="background: var(--secondary); padding: 15px; border-radius: 8px;">
              <div style="font-size: 0.8rem; color: var(--light-text);">Allocated Amount</div>
              <div style="font-size: 1.2rem; font-weight: bold;">{{ formatCurrency(selectedAlloc?.allocatedAmount) }}</div>
            </div>
            <div style="background: var(--secondary); padding: 15px; border-radius: 8px;">
              <div style="font-size: 0.8rem; color: var(--light-text);">Expended</div>
              <div style="font-size: 1.2rem; font-weight: bold; color: var(--danger);">{{ formatCurrency(selectedAlloc?.expended) }}</div>
            </div>
            <div style="background: var(--secondary); padding: 15px; border-radius: 8px;">
              <div style="font-size: 0.8rem; color: var(--light-text);">Remaining Balance</div>
              <div style="font-size: 1.2rem; font-weight: bold; color: var(--success);">{{ formatCurrency(selectedAlloc?.balance) }}</div>
            </div>
            <div style="background: var(--secondary); padding: 15px; border-radius: 8px;">
              <div style="font-size: 0.8rem; color: var(--light-text);">Status</div>
              <div style="margin-top: 5px;"><span class="status" :class="`status-${selectedAlloc?.status.toLowerCase()}`">{{ selectedAlloc?.status }}</span></div>
            </div>
          </div>
          <h4>Expenditure History</h4>
          <div style="max-height: 250px; overflow-y: auto; margin-top: 10px; border: 1px solid var(--border); border-radius: 8px;">
            <table v-if="selectedAlloc?.expenditures?.length" style="width: 100%; font-size: 0.9rem;">
              <thead style="background: var(--secondary); position: sticky; top: 0; z-index: 1;">
                <tr>
                  <th style="padding: 10px;">Date</th>
                  <th style="padding: 10px;">Description</th>
                  <th style="padding: 10px;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="exp in selectedAlloc.expenditures" :key="exp.id">
                  <td style="padding: 10px;">{{ new Date(exp.date).toLocaleDateString() }}</td>
                  <td style="padding: 10px;">{{ exp.description }}</td>
                  <td style="padding: 10px; color: var(--danger);">{{ formatCurrency(exp.amount) }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else style="padding: 20px; text-align: center; color: var(--light-text);">
              No expenditures recorded yet.
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showDetailsModal = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content-section {
  background: var(--card-bg);
  border-radius: 16px;
  box-shadow: var(--card-shadow);
  padding: 25px;
  margin-bottom: 30px;
  border: 1px solid rgba(255,255,255,0.5);
  backdrop-filter: blur(10px);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border);
}

.section-header h3 {
  color: var(--text);
  font-size: 1.25rem;
  font-weight: 700;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

th, td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

th {
  background-color: var(--secondary);
  color: var(--light-text);
  font-weight: 600;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

th:first-child { border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
th:last-child { border-top-right-radius: 8px; border-bottom-right-radius: 8px; }

tr:last-child td { border-bottom: none; }

tr:hover td {
  background-color: rgba(248, 250, 252, 0.8);
}

.font-medium {
  font-weight: 500;
  color: var(--text);
}

.text-center { text-align: center; color: var(--light-text); padding: 30px; }
.text-danger { color: var(--danger); }

.status {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
}

.status-approved { background-color: rgba(16, 185, 129, 0.1); color: var(--success); }
.status-pending { background-color: rgba(245, 158, 11, 0.1); color: var(--accent); }
.status-completed { background-color: rgba(30, 107, 40, 0.1); color: var(--primary); }

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  margin-right: 12px;
  transition: transform 0.2s;
}
.btn-icon:hover { transform: scale(1.1); }
.text-success { color: var(--success); }
.text-primary { color: var(--primary); }

.progress-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  height: 8px;
  flex: 1;
  background-color: var(--border);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 1s ease-in-out;
}

.progress-container small {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--light-text);
  min-width: 35px;
}
</style>
