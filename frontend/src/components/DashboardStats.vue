<script setup>
defineProps({
  stats: {
    type: Object,
    required: true
  }
})

const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '₱0.00'
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount)
}
</script>

<template>
  <div class="stats-container" v-if="stats">
    <div class="stat-card">
      <div class="stat-icon bg-primary-light">
        <i class="fas fa-money-bill-wave"></i>
      </div>
      <div class="stat-content">
        <h3>TOTAL ANNUAL BUDGET</h3>
        <div class="value">{{ formatCurrency(stats.totalBudget) }}</div>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon bg-danger-light">
        <i class="fas fa-chart-line"></i>
      </div>
      <div class="stat-content">
        <h3>TOTAL EXPENDED</h3>
        <div class="value">{{ formatCurrency(stats.totalExpended) }}</div>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icon bg-success-light">
        <i class="fas fa-wallet"></i>
      </div>
      <div class="stat-content">
        <h3>BALANCE</h3>
        <div class="value" :class="{ 'text-danger': stats.balance < 0 }">{{ formatCurrency(stats.balance) }}</div>
      </div>
    </div>
    
    <div class="stat-card utilization-card">
      <div class="stat-content" style="width: 100%; text-align: center;">
        <h3>UTILIZATION RATE</h3>
        <div class="graph-container">
          <svg viewBox="0 0 36 36" class="circular-chart">
            <path class="circle-bg"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path class="circle"
              :stroke-dasharray="`${stats.utilizationRate}, 100`"
              :stroke="stats.utilizationRate > 90 ? '#ef4444' : stats.utilizationRate > 70 ? '#f59e0b' : '#10b981'"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <text x="18" y="21" class="percentage">{{ stats.utilizationRate }}%</text>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 35px;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--card-shadow);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: transform 0.3s, box-shadow 0.3s;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.5);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--card-hover-shadow);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.bg-primary-light { background: rgba(26, 95, 35, 0.1); color: var(--primary); }
.bg-danger-light { background: rgba(239, 68, 68, 0.1); color: var(--danger); }
.bg-success-light { background: rgba(16, 185, 129, 0.1); color: var(--success); }
.bg-accent-light { background: rgba(245, 158, 11, 0.1); color: var(--accent); }

.stat-content h3 {
  font-size: 0.75rem;
  color: var(--light-text);
  margin-bottom: 6px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.stat-content .value {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.5px;
}

.text-danger {
  color: var(--danger) !important;
}

/* Circular Graph Styles */
.utilization-card {
  padding: 15px 24px;
}

.graph-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
}

.circular-chart {
  display: block;
  margin: 0 auto;
  width: 100px;
  height: 100px;
}

.circle-bg {
  fill: none;
  stroke: rgba(0,0,0,0.06);
  stroke-width: 3.5;
}

.circle {
  fill: none;
  stroke-width: 3.5;
  stroke-linecap: round;
  transition: stroke-dasharray 1s ease-out, stroke 0.3s ease;
  animation: fillAnimation 1.5s ease-out forwards;
}

@keyframes fillAnimation {
  0% { stroke-dasharray: 0, 100; }
}

.percentage {
  fill: var(--text);
  font-family: inherit;
  font-size: 8px;
  font-weight: 800;
  text-anchor: middle;
}
</style>
