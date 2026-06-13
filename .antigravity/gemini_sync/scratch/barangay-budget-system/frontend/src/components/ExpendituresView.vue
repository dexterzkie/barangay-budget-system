<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useAuth } from '../composables/useAuth'

const props = defineProps({
  expenditures: {
    type: Array,
    required: true
  },
  allocations: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['refresh'])
const { state } = useAuth()
const isTreasurer = () => state.user?.role === 'Barangay Treasurer'
const API_URL = 'http://localhost:3001/api'

const showModal = ref(false)
const showReceiptModal = ref(false)
const selectedExp = ref(null)
const receiptHtml = ref('')
const isSubmitting = ref(false)
const formData = ref({
  date: new Date().toISOString().split('T')[0],
  referenceNo: '',
  description: '',
  amount: '',
  fundAllocationId: '',
  status: 'Approved'
})

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount)
}

const submitExpenditure = async () => {
  if (!formData.value.description || !formData.value.amount || !formData.value.fundAllocationId) return
  
  isSubmitting.value = true
  try {
    await axios.post(`${API_URL}/expenditures`, formData.value)
    showModal.value = false
    formData.value = {
      date: new Date().toISOString().split('T')[0],
      referenceNo: '',
      description: '',
      amount: '',
      fundAllocationId: '',
      status: 'Approved'
    }
    emit('refresh')
  } catch (error) {
    console.error('Failed to record expenditure', error)
    alert('Failed to record expenditure')
  } finally {
    isSubmitting.value = false
  }
}

const viewReceipt = (exp) => {
  selectedExp.value = exp
  
  const dateStr = new Date(exp.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const formattedAmt = formatCurrency(exp.amount)
  
  receiptHtml.value = `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Official Receipt - ${exp.referenceNo}</title>
<style>
  body { font-family: 'Courier New', Courier, monospace; padding: 40px; color: #000; font-size: 14px; max-width: 600px; margin: 0 auto; border: 1px solid #ccc; background: #fff; }
  .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 20px; margin-bottom: 20px; }
  .header h2 { margin: 0; font-size: 18px; text-transform: uppercase; }
  .header p { margin: 5px 0 0; font-size: 12px; }
  .title { text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 30px; letter-spacing: 2px; }
  .row { display: flex; justify-content: space-between; margin-bottom: 15px; }
  .label { font-weight: bold; width: 150px; }
  .value { flex: 1; border-bottom: 1px dotted #999; }
  .amount-box { border: 2px solid #000; padding: 15px; text-align: center; margin: 30px 0; font-size: 20px; font-weight: bold; background: #f9f9f9; }
  .footer { margin-top: 50px; text-align: center; font-size: 12px; border-top: 1px dashed #000; padding-top: 20px; }
  @media print { body { border: none; padding: 10px; } }
</style></head><body>
  <div class="header">
    <h2>BARANGAY PAGAWAN</h2>
    <p>Municipality of Manticao, Misamis Oriental</p>
    <p>Office of the Barangay Treasurer</p>
  </div>
  <div class="title">OFFICIAL EXPENDITURE RECORD</div>
  <div class="row"><div class="label">Reference No:</div><div class="value">${exp.referenceNo}</div></div>
  <div class="row"><div class="label">Date:</div><div class="value">${dateStr}</div></div>
  <div class="row"><div class="label">Fund Charged:</div><div class="value">${exp.fundType}</div></div>
  <div class="row"><div class="label">Description:</div><div class="value">${exp.description}</div></div>
  <div class="row"><div class="label">Status:</div><div class="value">${exp.status.toUpperCase()}</div></div>
  
  <div class="amount-box">${formattedAmt}</div>
  
  <div class="row" style="margin-top:40px;">
    <div style="flex:1; text-align:center;">
      <div style="border-bottom: 1px solid #000; width: 80%; margin: 0 auto 5px;"></div>
      <div>Barangay Treasurer</div>
    </div>
  </div>
  
  <div class="footer">
    This is an automated system-generated record.<br>
    Printed on: ${new Date().toLocaleString()}
  </div>
</body></html>`

  showReceiptModal.value = true
}

const printReceipt = () => {
  const win = window.open('', '_blank')
  if (win && receiptHtml.value) {
    win.document.write(receiptHtml.value)
    win.document.close()
    win.onload = () => win.print()
  }
}
</script>

<template>
  <div class="content-section">
    <div class="section-header">
      <h3>Recent Expenditures</h3>
      <button v-if="isTreasurer()" class="btn btn-danger" @click="showModal = true">
        <i class="fas fa-file-invoice-dollar"></i> Record Expenditure
      </button>
    </div>
    
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Reference No.</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Fund Type</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="expenditures.length === 0">
            <td colspan="7" class="text-center">No expenditures recorded yet</td>
          </tr>
          <tr v-for="exp in expenditures" :key="exp.id">
            <td>{{ formatDate(exp.date) }}</td>
            <td class="font-mono text-sm">{{ exp.referenceNo }}</td>
            <td class="font-medium">{{ exp.description }}</td>
            <td class="font-semibold">{{ formatCurrency(exp.amount) }}</td>
            <td><span class="badge">{{ exp.fundType }}</span></td>
            <td>
              <span class="status" :class="`status-${exp.status.toLowerCase()}`">{{ exp.status }}</span>
            </td>
            <td>
              <button class="btn-icon text-danger" title="View Receipt" @click="viewReceipt(exp)"><i class="fas fa-file-pdf"></i></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Record Expenditure Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-content fade-in">
        <div class="modal-header">
          <h3>Record New Expenditure</h3>
          <button class="close-btn" @click="showModal = false"><i class="fas fa-times"></i></button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>Date</label>
              <input type="date" v-model="formData.date" class="form-control" />
            </div>
            <div class="form-group">
              <label>Reference No.</label>
              <input type="text" v-model="formData.referenceNo" class="form-control" placeholder="e.g. EXP-2026-001" />
            </div>
          </div>
          
          <div class="form-group">
            <label>Description</label>
            <input type="text" v-model="formData.description" class="form-control" placeholder="What is this expense for?" />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Amount (₱)</label>
              <input type="number" v-model="formData.amount" class="form-control" placeholder="0.00" />
            </div>
            <div class="form-group">
              <label>Charge to Fund</label>
              <select v-model="formData.fundAllocationId" class="form-control">
                <option value="" disabled>Select Fund...</option>
                <option v-for="alloc in allocations" :key="alloc.id" :value="alloc.id">
                  {{ alloc.fundType }}
                </option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showModal = false" :disabled="isSubmitting">Cancel</button>
          <button class="btn btn-danger" @click="submitExpenditure" :disabled="isSubmitting">
            <i class="fas fa-spinner fa-spin" v-if="isSubmitting"></i> 
            {{ isSubmitting ? 'Recording...' : 'Record Expenditure' }}
          </button>
        </div>
      </div>
    </div>

    <!-- View Receipt Modal -->
    <div v-if="showReceiptModal" class="modal-overlay" @click.self="showReceiptModal = false">
      <div class="modal-content fade-in" style="max-width: 650px; height: 80vh; display: flex; flex-direction: column; overflow: hidden; padding: 0;">
        <div class="modal-header" style="padding: 20px; border-bottom: 1px solid var(--border);">
          <h3 style="margin: 0; display: flex; align-items: center; gap: 8px;"><i class="fas fa-file-invoice text-danger"></i> Expenditure Record</h3>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-outline" @click="printReceipt" style="padding: 6px 12px; font-size: 0.9rem;"><i class="fas fa-print"></i> Print</button>
            <button class="close-btn" @click="showReceiptModal = false" style="background: var(--secondary); padding: 5px 10px; border-radius: 6px; cursor: pointer; border: none;"><i class="fas fa-times"></i></button>
          </div>
        </div>
        <div class="modal-body" style="flex: 1; padding: 0; background: #e5e7eb; overflow: hidden;">
          <iframe v-if="receiptHtml" :srcdoc="receiptHtml" style="width: 100%; height: 100%; border: none;"></iframe>
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

.font-medium { font-weight: 500; color: var(--text); }
.font-semibold { font-weight: 600; color: var(--text); }
.font-mono { font-family: monospace; }
.text-sm { font-size: 0.85rem; color: var(--light-text); }
.text-center { text-align: center; color: var(--light-text); padding: 30px; }

.badge {
  background: var(--secondary);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  color: var(--text);
  border: 1px solid var(--border);
}

.status {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  display: inline-block;
}

.status-approved { background-color: rgba(16, 185, 129, 0.1); color: var(--success); }
.status-pending { background-color: rgba(245, 158, 11, 0.1); color: var(--accent); }

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  transition: transform 0.2s;
}
.btn-icon:hover { transform: scale(1.1); color: var(--danger); }
.text-light { color: var(--light-text); }

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}
</style>
