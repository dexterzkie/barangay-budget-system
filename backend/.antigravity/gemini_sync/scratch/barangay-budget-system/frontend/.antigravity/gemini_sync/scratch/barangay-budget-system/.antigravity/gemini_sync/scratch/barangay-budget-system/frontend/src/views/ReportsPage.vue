<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'

const API_URL = 'http://localhost:3001/api'
const allocations = ref([])
const expenditures = ref([])
const loading = ref(true)

const fetchData = async () => {
  try {
    const [allocRes, expRes] = await Promise.all([
      axios.get(`${API_URL}/allocations`),
      axios.get(`${API_URL}/expenditures`)
    ])
    allocations.value = allocRes.data
    expenditures.value = expRes.data
  } catch (e) {
    console.error('Failed to load report data', e)
  } finally {
    loading.value = false
  }
}

const totalBudget = computed(() => allocations.value.reduce((s, a) => s + a.allocatedAmount, 0))
const totalExpended = computed(() => allocations.value.reduce((s, a) => s + a.expended, 0))
const totalBalance = computed(() => totalBudget.value - totalExpended.value)
const overallUtil = computed(() => totalBudget.value > 0 ? ((totalExpended.value / totalBudget.value) * 100).toFixed(1) : 0)

// Group expenditures by fund
const byFund = computed(() => {
  const map = {}
  expenditures.value.forEach(e => {
    if (!map[e.fundType]) map[e.fundType] = 0
    map[e.fundType] += e.amount
  })
  return Object.entries(map).map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
})

// Monthly totals
const byMonth = computed(() => {
  const map = {}
  expenditures.value.forEach(e => {
    const key = new Date(e.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    if (!map[key]) map[key] = 0
    map[key] += e.amount
  })
  return Object.entries(map).map(([month, total]) => ({ month, total }))
})

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount)

onMounted(fetchData)
</script>

<template>
  <div class="fade-in">
    <div v-if="loading" class="loading">
      <i class="fas fa-spinner fa-spin"></i> Generating report...
    </div>

    <div v-else>
      <!-- Summary cards -->
      <div class="report-cards">
        <div class="report-card">
          <div class="rc-icon green"><i class="fas fa-coins"></i></div>
          <div>
            <p class="rc-label">Total Budget</p>
            <p class="rc-value">{{ formatCurrency(totalBudget) }}</p>
          </div>
        </div>
        <div class="report-card">
          <div class="rc-icon red"><i class="fas fa-chart-line"></i></div>
          <div>
            <p class="rc-label">Total Expended</p>
            <p class="rc-value">{{ formatCurrency(totalExpended) }}</p>
          </div>
        </div>
        <div class="report-card">
          <div class="rc-icon blue"><i class="fas fa-piggy-bank"></i></div>
          <div>
            <p class="rc-label">Remaining Balance</p>
            <p class="rc-value" :class="{ danger: totalBalance < 0 }">{{ formatCurrency(totalBalance) }}</p>
          </div>
        </div>
        <div class="report-card">
          <div class="rc-icon amber"><i class="fas fa-percent"></i></div>
          <div>
            <p class="rc-label">Utilization Rate</p>
            <p class="rc-value">{{ overallUtil }}%</p>
          </div>
        </div>
      </div>

      <!-- Spending by Fund -->
      <div class="content-section">
        <div class="section-header">
          <h3><i class="fas fa-wallet"></i> Spending by Fund Type</h3>
        </div>
        <div class="fund-bars">
          <div v-for="item in byFund" :key="item.name" class="fund-bar-row">
            <div class="fund-bar-label">
              <span>{{ item.name }}</span>
              <strong>{{ formatCurrency(item.total) }}</strong>
            </div>
            <div class="progress-bar">
              <div class="progress-fill"
                :style="{ width: totalExpended > 0 ? `${(item.total / totalExpended) * 100}%` : '0%' }">
              </div>
            </div>
            <small class="pct">{{ totalExpended > 0 ? ((item.total / totalExpended) * 100).toFixed(1) : 0 }}% of total spending</small>
          </div>
        </div>
      </div>

      <!-- Fund Allocation Detail -->
      <div class="content-section">
        <div class="section-header">
          <h3><i class="fas fa-table"></i> Fund Allocation Summary</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Fund Type</th>
              <th>Allocated</th>
              <th>Expended</th>
              <th>Balance</th>
              <th>Utilization</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in allocations" :key="a.id">
              <td class="font-medium">{{ a.fundType }}</td>
              <td>{{ formatCurrency(a.allocatedAmount) }}</td>
              <td>{{ formatCurrency(a.expended) }}</td>
              <td :class="{ danger: a.balance < 0 }">{{ formatCurrency(a.balance) }}</td>
              <td>
                <div class="inline-progress">
                  <div class="progress-bar sm">
                    <div class="progress-fill" :style="{ width: `${Math.min(a.utilization, 100)}%`,
                      background: a.utilization > 90 ? 'var(--danger)' : 'var(--primary)' }">
                    </div>
                  </div>
                  <span>{{ a.utilization }}%</span>
                </div>
              </td>
              <td>
                <span class="status" :class="`status-${a.status.toLowerCase()}`">{{ a.status }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Monthly spending -->
      <div class="content-section" v-if="byMonth.length">
        <div class="section-header">
          <h3><i class="fas fa-calendar-alt"></i> Monthly Spending</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Total Expenditure</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in byMonth" :key="m.month">
              <td>{{ m.month }}</td>
              <td class="font-semibold">{{ formatCurrency(m.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading { text-align: center; padding: 60px; font-size: 1.1rem; color: var(--light-text); }
.loading i { margin-right: 8px; color: var(--primary); }

.report-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 28px;
}

.report-card {
  background: white;
  border-radius: 16px;
  padding: 22px;
  box-shadow: var(--card-shadow);
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid rgba(255,255,255,0.5);
  transition: transform 0.3s, box-shadow 0.3s;
}
.report-card:hover { transform: translateY(-3px); box-shadow: var(--card-hover-shadow); }

.rc-icon {
  width: 52px; height: 52px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.4rem; flex-shrink: 0;
}
.rc-icon.green { background: rgba(16,185,129,0.1); color: var(--success); }
.rc-icon.red { background: rgba(239,68,68,0.1); color: var(--danger); }
.rc-icon.blue { background: rgba(59,130,246,0.1); color: #3b82f6; }
.rc-icon.amber { background: rgba(245,158,11,0.1); color: var(--accent); }

.rc-label { font-size: 0.8rem; color: var(--light-text); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.rc-value { font-size: 1.5rem; font-weight: 800; color: var(--text); letter-spacing: -0.5px; }
.rc-value.danger { color: var(--danger); }

.content-section {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: var(--card-shadow);
  margin-bottom: 24px;
  border: 1px solid rgba(255,255,255,0.5);
}

.section-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border);
}

.section-header h3 {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 10px;
}
.section-header h3 i { color: var(--primary); }

.fund-bars { display: flex; flex-direction: column; gap: 20px; }

.fund-bar-row {}

.fund-bar-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.9rem;
}
.fund-bar-label span { color: var(--text); font-weight: 500; }
.fund-bar-label strong { color: var(--primary); }

.progress-bar {
  height: 10px;
  background: var(--border);
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 4px;
}
.progress-bar.sm { height: 8px; flex: 1; }

.progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 5px;
  transition: width 1s ease;
}

.pct { color: var(--light-text); font-size: 0.8rem; }

table { width: 100%; border-collapse: separate; border-spacing: 0; }

th, td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

th {
  background: var(--secondary);
  color: var(--light-text);
  font-weight: 600;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
th:first-child { border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
th:last-child { border-top-right-radius: 8px; border-bottom-right-radius: 8px; }
tr:last-child td { border-bottom: none; }
tr:hover td { background: rgba(248,250,252,0.8); }

.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.danger { color: var(--danger); }

.inline-progress { display: flex; align-items: center; gap: 8px; }
.inline-progress span { font-size: 0.8rem; font-weight: 600; color: var(--light-text); min-width: 38px; }

.status {
  padding: 4px 10px; border-radius: 20px;
  font-size: 0.8rem; font-weight: 600; display: inline-block;
}
.status-approved { background: rgba(16,185,129,0.1); color: var(--success); }
.status-pending { background: rgba(245,158,11,0.1); color: var(--accent); }
.status-completed { background: rgba(26,95,35,0.1); color: var(--primary); }
</style>
