<script setup>
import { ref } from 'vue'

const settings = ref({
  barangayName: 'Barangay Pagawan',
  municipality: 'Manticao',
  province: 'Misamis Oriental',
  treasurer: 'Barangay Treasurer',
  fiscalYear: '2025',
  currency: 'PHP'
})

const saved = ref(false)

const saveSettings = () => {
  // In a real app this would call a PATCH /api/settings endpoint
  saved.value = true
  setTimeout(() => saved.value = false, 3000)
}
</script>

<template>
  <div class="fade-in">
    <div class="content-section">
      <div class="section-header">
        <h3><i class="fas fa-building"></i> Barangay Information</h3>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label>Barangay Name</label>
          <input v-model="settings.barangayName" type="text" class="form-control" />
        </div>
        <div class="form-group">
          <label>Municipality</label>
          <input v-model="settings.municipality" type="text" class="form-control" />
        </div>
        <div class="form-group">
          <label>Province</label>
          <input v-model="settings.province" type="text" class="form-control" />
        </div>
        <div class="form-group">
          <label>Treasurer / Officer-in-Charge</label>
          <input v-model="settings.treasurer" type="text" class="form-control" />
        </div>
        <div class="form-group">
          <label>Current Fiscal Year</label>
          <input v-model="settings.fiscalYear" type="text" class="form-control" />
        </div>
        <div class="form-group">
          <label>Currency</label>
          <select v-model="settings.currency" class="form-control">
            <option value="PHP">Philippine Peso (₱)</option>
            <option value="USD">US Dollar ($)</option>
          </select>
        </div>
      </div>
    </div>

    <div class="content-section">
      <div class="section-header">
        <h3><i class="fas fa-shield-alt"></i> System Information</h3>
      </div>
      <div class="info-list">
        <div class="info-row">
          <span>System Version</span>
          <strong>1.0.0</strong>
        </div>
        <div class="info-row">
          <span>Backend</span>
          <strong>Node.js / Express.js</strong>
        </div>
        <div class="info-row">
          <span>Frontend</span>
          <strong>Vue 3 / Vite</strong>
        </div>
        <div class="info-row">
          <span>Database</span>
          <strong>SQLite via Prisma ORM</strong>
        </div>
        <div class="info-row">
          <span>API URL</span>
          <strong>http://localhost:3001/api</strong>
        </div>
      </div>
    </div>

    <div class="save-bar">
      <div class="success-msg" v-if="saved">
        <i class="fas fa-check-circle"></i> Settings saved successfully!
      </div>
      <button class="btn btn-primary" @click="saveSettings">
        <i class="fas fa-save"></i> Save Settings
      </button>
    </div>
  </div>
</template>

<style scoped>
.content-section {
  background: white;
  border-radius: 16px;
  padding: 25px;
  box-shadow: var(--card-shadow);
  margin-bottom: 24px;
  border: 1px solid rgba(255,255,255,0.5);
}

.section-header {
  margin-bottom: 22px;
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

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.info-list { display: flex; flex-direction: column; gap: 0; }

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.95rem;
}
.info-row:last-child { border-bottom: none; }
.info-row span { color: var(--light-text); }
.info-row strong { color: var(--text); }

.save-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;
}

.success-msg {
  color: var(--success);
  font-weight: 600;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: fadeIn 0.3s ease;
}
</style>
