<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
const forecast = ref<any>(null)
const loading = ref(true)
const generating = ref<'allocation' | 'monitoring' | null>(null)
const docPreview = ref<string | null>(null)
const docType = ref('')
const showPreview = ref(false)

// Chat state
const chatMessages = ref([{ sender: 'ai', text: 'Hello! I am the Barangay Pagawan AI Budget Assistant. Ask me about budget totals, spending, balances, or critical funds.' }])
const chatInput = ref('')
const isChatLoading = ref(false)

const sendMessage = async () => {
  if (!chatInput.value.trim()) return
  
  const userMsg = chatInput.value
  chatMessages.value.push({ sender: 'user', text: userMsg })
  chatInput.value = ''
  isChatLoading.value = true
  
  try {
    const res = await axios.post(`${API_URL}/ai/chat`, { message: userMsg })
    chatMessages.value.push({ sender: 'ai', text: res.data.reply })
  } catch (e) {
    chatMessages.value.push({ sender: 'ai', text: 'Sorry, I am having trouble connecting to the server.' })
  } finally {
    isChatLoading.value = false
    // Auto-scroll to bottom using querySelector (simple approach)
    setTimeout(() => {
      const el = document.querySelector('.chat-messages')
      if (el) el.scrollTop = el.scrollHeight
    }, 100)
  }
}

const fetchForecast = async () => {
  loading.value = true
  try {
    const res = await axios.get(`${API_URL}/ai/forecast`)
    forecast.value = res.data
  } catch (e) {
    console.error('Forecast failed', e)
  } finally {
    loading.value = false
  }
}

const generateDocument = async (type: 'allocation' | 'monitoring') => {
  generating.value = type
  try {
    const res = await axios.post(`${API_URL}/ai/generate-document`, { type })
    docPreview.value = res.data.html
    docType.value = type === 'allocation' ? 'Budget Allocation Document' : 'Budget Monitoring Report'
    showPreview.value = true
  } catch (e) {
    console.error('Generation failed', e)
  } finally {
    generating.value = null
  }
}

const printDocument = () => {
  const win = window.open('', '_blank')
  if (win && docPreview.value) {
    win.document.write(docPreview.value)
    win.document.close()
    win.onload = () => win.print()
  }
}

const fmt = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)

const getRiskColor = (util: number) => {
  if (util > 90) return '#ef4444'
  if (util > 70) return '#f59e0b'
  if (util < 30) return '#3b82f6'
  return '#10b981'
}

const getRiskLabel = (util: number) => {
  if (util > 90) return 'Critical'
  if (util > 70) return 'Monitor'
  if (util < 30) return 'Underspent'
  return 'Healthy'
}

onMounted(fetchForecast)
</script>

<template>
  <div class="fade-in">
    <!-- Loading -->
    <div v-if="loading" class="loading">
      <div class="ai-loader">
        <div class="ai-rings">
          <div class="ring r1"></div>
          <div class="ring r2"></div>
          <div class="ring r3"></div>
        </div>
        <p>AI is analyzing financial data...</p>
      </div>
    </div>

    <div v-else-if="forecast">
      <!-- AI Header Banner -->
      <div class="ai-banner">
        <div class="ai-banner-left">
          <div class="ai-icon"><i class="fas fa-brain"></i></div>
          <div>
            <h2>AI-Powered Budget Allocation Document & Notification Generation</h2>
            <p>Predictive & Generative AI analysis using historical expenditure data — Linear regression forecasting + automated document generation</p>
          </div>
        </div>
        <div class="ai-badge">
          <i class="fas fa-microchip"></i> AI Active
        </div>
      </div>

      <!-- Trend Summary -->
      <div class="stats-row">
        <div class="mini-stat">
          <div class="ms-icon blue"><i class="fas fa-chart-line"></i></div>
          <div>
            <p class="ms-label">Monthly Trend</p>
            <p class="ms-value" :class="forecast.trendSlope >= 0 ? 'up' : 'down'">
              <i :class="forecast.trendSlope >= 0 ? 'fas fa-arrow-trend-up' : 'fas fa-arrow-trend-down'"></i>
              {{ forecast.trendSlope >= 0 ? '+' : '' }}{{ fmt(forecast.trendSlope) }}/mo
            </p>
          </div>
        </div>
        <div class="mini-stat">
          <div class="ms-icon purple"><i class="fas fa-crystal-ball"></i></div>
          <div>
            <p class="ms-label">Next Month Forecast</p>
            <p class="ms-value">{{ forecast.predictions[0] ? fmt(forecast.predictions[0].predicted) : '—' }}</p>
          </div>
        </div>
        <div class="mini-stat">
          <div class="ms-icon green"><i class="fas fa-calendar-check"></i></div>
          <div>
            <p class="ms-label">Data Points Analyzed</p>
            <p class="ms-value">{{ forecast.monthlyHistory.length }} months</p>
          </div>
        </div>
        <div class="mini-stat">
          <div class="ms-icon amber"><i class="fas fa-exclamation-triangle"></i></div>
          <div>
            <p class="ms-label">Funds Needing Attention</p>
            <p class="ms-value">{{ forecast.fundAnalysis.filter((f: any) => f.utilization > 70 || f.utilization < 25).length }}</p>
          </div>
        </div>
      </div>

      <!-- Forecast Table -->
      <div class="ai-card" v-if="forecast.predictions.length">
        <div class="ai-card-header">
          <h3><i class="fas fa-chart-bar"></i> 3-Month Spending Forecast</h3>
          <span class="model-badge">Linear Regression Model</span>
        </div>
        <div class="forecast-grid">
          <div v-for="(p, i) in forecast.predictions" :key="p.month" class="forecast-month" :class="`delay-${i}`">
            <div class="fm-label">{{ new Date(p.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }}</div>
            <div class="fm-value">{{ fmt(p.predicted) }}</div>
            <div class="fm-tag">Projected</div>
          </div>
        </div>
      </div>

      <!-- Fund Analysis -->
      <div class="ai-card">
        <div class="ai-card-header">
          <h3><i class="fas fa-search-dollar"></i> Per-Fund AI Risk Analysis</h3>
          <span class="model-badge">Predictive AI</span>
        </div>
        <div class="fund-analysis-list">
          <div v-for="f in forecast.fundAnalysis" :key="f.fundType" class="fund-analysis-item">
            <div class="fai-left">
              <div class="risk-dot" :style="{ background: getRiskColor(f.utilization) }"></div>
              <div>
                <div class="fai-name">{{ f.fundType }}</div>
                <div class="fai-rec">{{ f.recommendation }}</div>
              </div>
            </div>
            <div class="fai-right">
              <div class="fai-stats">
                <div>
                  <span class="stat-lbl">Utilization</span>
                  <span class="stat-val" :style="{ color: getRiskColor(f.utilization) }">{{ f.utilization }}%</span>
                </div>
                <div>
                  <span class="stat-lbl">Avg Monthly</span>
                  <span class="stat-val">{{ fmt(f.avgMonthlySpend) }}</span>
                </div>
                <div>
                  <span class="stat-lbl">Annual Need</span>
                  <span class="stat-val">{{ fmt(f.projectedAnnualNeed) }}</span>
                </div>
              </div>
              <div class="risk-tag" :style="{ background: getRiskColor(f.utilization) + '20', color: getRiskColor(f.utilization) }">
                {{ getRiskLabel(f.utilization) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Document Generation -->
      <div class="ai-card">
        <div class="ai-card-header">
          <h3><i class="fas fa-file-alt"></i> AI Document Generation</h3>
          <span class="model-badge">Generative AI</span>
        </div>
        <p class="doc-desc">Automatically generate official barangay budget documents using AI-compiled financial data, complete with certifications and signatory sections.</p>
        <div class="doc-buttons">
          <button class="doc-btn allocation" @click="generateDocument('allocation')" :disabled="generating !== null">
            <div class="doc-btn-icon"><i class="fas fa-file-invoice"></i></div>
            <div class="doc-btn-text">
              <strong>Budget Allocation Document</strong>
              <span>Annual fund allocation report with AI insights & recommendations</span>
            </div>
            <div class="doc-btn-arrow">
              <i v-if="generating === 'allocation'" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-chevron-right"></i>
            </div>
          </button>

          <button class="doc-btn monitoring" @click="generateDocument('monitoring')" :disabled="generating !== null">
            <div class="doc-btn-icon"><i class="fas fa-clipboard-check"></i></div>
            <div class="doc-btn-text">
              <strong>Budget Monitoring Report</strong>
              <span>Real-time status monitoring with AI alerts & expenditure history</span>
            </div>
            <div class="doc-btn-arrow">
              <i v-if="generating === 'monitoring'" class="fas fa-spinner fa-spin"></i>
              <i v-else class="fas fa-chevron-right"></i>
            </div>
          </button>
        </div>
      </div>

      <!-- AI Chatbot Section -->
      <div class="ai-card">
        <div class="ai-card-header">
          <h3><i class="fas fa-robot"></i> AI Financial Assistant</h3>
          <span class="model-badge">Conversational AI</span>
        </div>
        <div class="chat-container">
          <div class="chat-messages">
            <div v-for="(msg, index) in chatMessages" :key="index" :class="['chat-bubble-wrapper', msg.sender]">
              <div v-if="msg.sender === 'ai'" class="chat-avatar ai"><i class="fas fa-robot"></i></div>
              <div class="chat-bubble" :class="msg.sender">{{ msg.text }}</div>
              <div v-if="msg.sender === 'user'" class="chat-avatar user"><i class="fas fa-user"></i></div>
            </div>
            <div v-if="isChatLoading" class="chat-bubble-wrapper ai">
              <div class="chat-avatar ai"><i class="fas fa-robot"></i></div>
              <div class="chat-bubble ai typing">
                <div class="dot"></div><div class="dot"></div><div class="dot"></div>
              </div>
            </div>
          </div>
          <div class="chat-input-area">
            <input type="text" v-model="chatInput" @keyup.enter="sendMessage" placeholder="Ask about the budget (e.g. 'What is the total budget?')" class="form-control" :disabled="isChatLoading" />
            <button class="btn btn-primary" @click="sendMessage" :disabled="isChatLoading || !chatInput.trim()">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Document Preview Modal -->
    <div v-if="showPreview" class="modal-overlay" @click.self="showPreview = false">
      <div class="doc-modal fade-in">
        <div class="doc-modal-header">
          <div>
            <h3><i class="fas fa-file-alt"></i> {{ docType }}</h3>
            <p>AI-generated official document — ready to print or save</p>
          </div>
          <div class="doc-modal-actions">
            <button class="btn btn-primary" @click="printDocument">
              <i class="fas fa-print"></i> Print / Save PDF
            </button>
            <button class="close-btn-modal" @click="showPreview = false">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        <div class="doc-preview-frame">
          <iframe v-if="docPreview" :srcdoc="docPreview" style="width:100%;height:100%;border:none;"></iframe>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading { display: flex; justify-content: center; padding: 80px 0; }
.ai-loader { text-align: center; }
.ai-rings { position: relative; width: 80px; height: 80px; margin: 0 auto 20px; }
.ring { position: absolute; border-radius: 50%; border: 3px solid transparent; animation: spin 1.5s linear infinite; }
.r1 { inset: 0; border-top-color: var(--primary); }
.r2 { inset: 10px; border-right-color: #3b82f6; animation-delay: 0.3s; }
.r3 { inset: 20px; border-bottom-color: var(--accent); animation-delay: 0.6s; }
@keyframes spin { to { transform: rotate(360deg); } }
.ai-loader p { color: var(--light-text); font-size: 1rem; font-weight: 500; }

/* AI Banner */
.ai-banner {
  background: linear-gradient(135deg, #0f3d17 0%, var(--primary) 100%);
  border-radius: 16px; padding: 24px 28px; margin-bottom: 24px;
  display: flex; justify-content: space-between; align-items: center;
  color: white; box-shadow: 0 8px 25px rgba(26,95,35,0.3);
}
.ai-banner-left { display: flex; align-items: center; gap: 16px; }
.ai-icon { width: 54px; height: 54px; background: rgba(255,255,255,0.15); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; flex-shrink: 0; }
.ai-banner-left h2 { font-size: 1.05rem; font-weight: 700; margin-bottom: 5px; }
.ai-banner-left p { font-size: 0.8rem; opacity: 0.8; line-height: 1.4; }
.ai-badge { background: rgba(255,255,255,0.2); padding: 8px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; gap: 8px; white-space: nowrap; }

/* Stats row */
.stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
.mini-stat { background: white; border-radius: 14px; padding: 18px; box-shadow: var(--card-shadow); display: flex; align-items: center; gap: 14px; border: 1px solid rgba(255,255,255,0.5); transition: transform 0.2s; }
.mini-stat:hover { transform: translateY(-3px); }
.ms-icon { width: 46px; height: 46px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
.ms-icon.blue   { background: rgba(59,130,246,0.1);  color: #3b82f6; }
.ms-icon.purple { background: rgba(139,92,246,0.1);  color: #8b5cf6; }
.ms-icon.green  { background: rgba(16,185,129,0.1);  color: var(--success); }
.ms-icon.amber  { background: rgba(245,158,11,0.1);  color: var(--accent); }
.ms-label { font-size: 0.75rem; color: var(--light-text); font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 4px; }
.ms-value { font-size: 1.1rem; font-weight: 800; color: var(--text); }
.ms-value.up { color: var(--danger); }
.ms-value.down { color: var(--success); }

/* AI Cards */
.ai-card { background: white; border-radius: 16px; padding: 24px; box-shadow: var(--card-shadow); margin-bottom: 22px; border: 1px solid rgba(255,255,255,0.5); }
.ai-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid var(--border); }
.ai-card-header h3 { font-size: 1.1rem; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 9px; }
.ai-card-header h3 i { color: var(--primary); }
.model-badge { font-size: 0.72rem; font-weight: 700; padding: 4px 10px; border-radius: 20px; background: rgba(26,95,35,0.08); color: var(--primary); text-transform: uppercase; letter-spacing: 0.5px; }

/* Forecast */
.forecast-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.forecast-month { background: linear-gradient(135deg, rgba(26,95,35,0.05), rgba(45,139,61,0.08)); border: 1.5px solid rgba(26,95,35,0.15); border-radius: 12px; padding: 18px; text-align: center; }
.fm-label { font-size: 0.82rem; color: var(--light-text); font-weight: 600; margin-bottom: 8px; }
.fm-value { font-size: 1.25rem; font-weight: 800; color: var(--primary); margin-bottom: 6px; }
.fm-tag { font-size: 0.72rem; font-weight: 700; color: white; background: var(--primary); padding: 3px 10px; border-radius: 20px; display: inline-block; }

/* Fund Analysis */
.fund-analysis-list { display: flex; flex-direction: column; gap: 12px; }
.fund-analysis-item { display: flex; justify-content: space-between; align-items: flex-start; padding: 14px 16px; background: var(--secondary); border-radius: 12px; gap: 16px; }
.fai-left { display: flex; align-items: flex-start; gap: 12px; flex: 1; }
.risk-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
.fai-name { font-weight: 700; font-size: 0.92rem; color: var(--text); margin-bottom: 4px; }
.fai-rec { font-size: 0.82rem; color: var(--light-text); line-height: 1.4; }
.fai-right { display: flex; align-items: center; gap: 14px; flex-shrink: 0; }
.fai-stats { display: flex; gap: 16px; }
.fai-stats > div { text-align: center; }
.stat-lbl { display: block; font-size: 0.7rem; color: var(--light-text); font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 3px; }
.stat-val { font-size: 0.88rem; font-weight: 700; color: var(--text); }
.risk-tag { padding: 5px 12px; border-radius: 20px; font-size: 0.78rem; font-weight: 800; white-space: nowrap; }

/* Document Generation */
.doc-desc { font-size: 0.88rem; color: var(--light-text); margin-bottom: 18px; line-height: 1.5; }
.doc-buttons { display: flex; flex-direction: column; gap: 12px; }
.doc-btn {
  display: flex; align-items: center; gap: 16px; padding: 18px 20px;
  border-radius: 12px; border: 2px solid; cursor: pointer;
  transition: all 0.25s; text-align: left; background: white; width: 100%;
}
.doc-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.doc-btn.allocation { border-color: rgba(26,95,35,0.2); }
.doc-btn.allocation:hover:not(:disabled) { border-color: var(--primary); background: rgba(26,95,35,0.03); transform: translateX(4px); }
.doc-btn.monitoring { border-color: rgba(59,130,246,0.2); }
.doc-btn.monitoring:hover:not(:disabled) { border-color: #3b82f6; background: rgba(59,130,246,0.03); transform: translateX(4px); }

.doc-btn-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0; }
.allocation .doc-btn-icon { background: rgba(26,95,35,0.1); color: var(--primary); }
.monitoring .doc-btn-icon { background: rgba(59,130,246,0.1); color: #3b82f6; }
.doc-btn-text { flex: 1; }
.doc-btn-text strong { display: block; font-size: 0.95rem; font-weight: 700; color: var(--text); margin-bottom: 3px; }
.doc-btn-text span { font-size: 0.82rem; color: var(--light-text); }
.doc-btn-arrow { font-size: 0.9rem; color: var(--light-text); }

/* Document Modal */
.doc-modal {
  background: white; border-radius: 20px; width: 95vw; max-width: 900px;
  height: 90vh; display: flex; flex-direction: column;
  box-shadow: 0 25px 60px rgba(0,0,0,0.3); overflow: hidden;
}
.doc-modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
.doc-modal-header h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 3px; display: flex; align-items: center; gap: 8px; color: var(--text); }
.doc-modal-header p { font-size: 0.8rem; color: var(--light-text); }
.doc-modal-actions { display: flex; align-items: center; gap: 10px; }
.close-btn-modal { background: var(--secondary); border: none; border-radius: 8px; padding: 8px 12px; cursor: pointer; font-size: 1rem; color: var(--light-text); transition: all 0.2s; }
.close-btn-modal:hover { background: var(--border); color: var(--danger); }
.doc-preview-frame { flex: 1; overflow: auto; background: #e5e7eb; padding: 20px; }

.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(15,23,42,0.7); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px;
}

/* Chatbot */
.chat-container { border: 1px solid var(--border); border-radius: 12px; overflow: hidden; background: #fdfdfd; }
.chat-messages { height: 320px; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 15px; }
.chat-bubble-wrapper { display: flex; align-items: flex-end; gap: 10px; max-width: 80%; }
.chat-bubble-wrapper.ai { align-self: flex-start; }
.chat-bubble-wrapper.user { align-self: flex-end; justify-content: flex-end; }
.chat-avatar { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0; }
.chat-avatar.ai { background: rgba(26,95,35,0.1); color: var(--primary); }
.chat-avatar.user { background: var(--primary); color: white; }
.chat-bubble { padding: 12px 16px; border-radius: 16px; font-size: 0.9rem; line-height: 1.5; font-weight: 500; white-space: pre-wrap; }
.chat-bubble.ai { background: white; border: 1px solid var(--border); border-bottom-left-radius: 4px; color: var(--text); box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
.chat-bubble.user { background: linear-gradient(135deg, var(--primary), var(--primary-light)); color: white; border-bottom-right-radius: 4px; box-shadow: 0 4px 10px rgba(26,95,35,0.2); }
.chat-input-area { display: flex; gap: 12px; padding: 16px; background: white; border-top: 1px solid var(--border); align-items: center; }
.chat-input-area input { flex: 1; padding: 14px; border-radius: 10px; border: 1.5px solid var(--border); font-size: 0.95rem; background: var(--secondary); transition: all 0.2s; }
.chat-input-area input:focus { outline: none; border-color: var(--primary); background: white; box-shadow: 0 0 0 3px rgba(26,95,35,0.1); }
.chat-input-area .btn-primary { width: 48px; height: 48px; padding: 0; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
.typing { display: flex; gap: 5px; align-items: center; padding: 15px 18px; }
.dot { width: 7px; height: 7px; background: #a1a1aa; border-radius: 50%; animation: bounce 1.4s infinite ease-in-out both; }
.dot:nth-child(1) { animation-delay: -0.32s; }
.dot:nth-child(2) { animation-delay: -0.16s; }
@keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
</style>
