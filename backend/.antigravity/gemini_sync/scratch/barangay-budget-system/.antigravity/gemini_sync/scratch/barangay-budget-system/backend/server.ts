import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

const app = express()
const prisma = new PrismaClient()
const PORT = process.env.PORT || 3001
const JWT_SECRET = 'barangay_pagawan_secret_2025'

app.use(cors())
app.use(express.json())

// ─── Middleware ───────────────────────────────────────────────────────────────
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

const adminOnly = (req: any, res: any, next: any) => {
  if (req.user?.role === 'Resident') return res.status(403).json({ error: 'Admin access required' })
  next()
}

const captainOnly = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'Barangay Captain') return res.status(403).json({ error: 'Only the Barangay Captain can perform this action' })
  next()
}

const treasurerOnly = (req: any, res: any, next: any) => {
  if (req.user?.role !== 'Barangay Treasurer') return res.status(403).json({ error: 'Only the Barangay Treasurer can perform this action' })
  next()
}

// ─── Auth Routes ─────────────────────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, email, contactNumber, address, username, password } = req.body
    if (!firstName || !lastName || !email || !username || !password) {
      return res.status(400).json({ error: 'All required fields must be filled.' })
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    })
    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists.' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashed,
        role: 'Resident',
        fullName: `${firstName} ${lastName}`,
        firstName,
        lastName,
        email,
        contactNumber,
        address,
        status: 'Pending' // Awaiting Captain approval
      }
    })

    res.status(201).json({ message: 'Registration submitted. Awaiting Barangay Captain approval.', userId: newUser.id })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Registration failed.' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' })

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) return res.status(401).json({ error: 'Invalid username or password' })

  // Check if account is pending or rejected
  if (user.status === 'Pending') {
    return res.status(403).json({ error: 'Your account is pending approval by the Barangay Captain.' })
  }
  if (user.status === 'Rejected') {
    return res.status(403).json({ error: 'Your account has been rejected. Please contact the Barangay.' })
  }

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Invalid username or password' })

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, fullName: user.fullName },
    JWT_SECRET,
    { expiresIn: '8h' }
  )

  res.json({ token, user: { id: user.id, username: user.username, role: user.role, fullName: user.fullName } })
})

app.get('/api/auth/me', authenticate, (req: any, res) => {
  res.json(req.user)
})

// ─── User Management (Captain Only) ──────────────────────────────────────────
app.get('/api/users', authenticate, captainOnly, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'Resident' },
      select: {
        id: true, username: true, role: true, fullName: true,
        firstName: true, lastName: true, email: true,
        contactNumber: true, address: true, status: true, createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(users)
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

app.patch('/api/users/:id/status', authenticate, captainOnly, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Status must be Approved or Rejected' })
    }
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status },
      select: { id: true, fullName: true, status: true }
    })
    res.json(user)
  } catch {
    res.status(500).json({ error: 'Failed to update user status' })
  }
})

// ─── Dashboard ────────────────────────────────────────────────────────────────
app.get('/api/dashboard', authenticate, async (req, res) => {
  try {
    const allocations = await prisma.fundAllocation.findMany({ include: { expenditures: true } })
    let totalBudget = 0, totalExpended = 0
    allocations.forEach(a => {
      totalBudget += a.allocatedAmount
      totalExpended += a.expenditures.reduce((s, e) => s + e.amount, 0)
    })
    const balance = totalBudget - totalExpended
    const utilizationRate = totalBudget > 0 ? parseFloat(((totalExpended / totalBudget) * 100).toFixed(1)) : 0

    // Pending registrations count (for Captain badge)
    const pendingCount = await prisma.user.count({ where: { status: 'Pending', role: 'Resident' } })

    res.json({ totalBudget, totalExpended, balance, utilizationRate, pendingRegistrations: pendingCount })
  } catch {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' })
  }
})

// ─── Allocations ─────────────────────────────────────────────────────────────
app.get('/api/allocations', authenticate, async (req, res) => {
  try {
    const allocations = await prisma.fundAllocation.findMany({ include: { expenditures: true } })
    const result = allocations.map(a => {
      const expended = a.expenditures.reduce((s, e) => s + e.amount, 0)
      return {
        id: a.id, fundType: a.fundType, allocatedAmount: a.allocatedAmount, status: a.status,
        expended, balance: a.allocatedAmount - expended,
        utilization: a.allocatedAmount > 0 ? Math.round((expended / a.allocatedAmount) * 100) : 0
      }
    })
    res.json(result)
  } catch {
    res.status(500).json({ error: 'Failed to fetch allocations' })
  }
})

app.post('/api/allocations', authenticate, adminOnly, async (req, res) => {
  try {
    const { fundType, allocatedAmount, status } = req.body
    const a = await prisma.fundAllocation.create({
      data: { fundType, allocatedAmount: parseFloat(allocatedAmount), status: status || 'Pending' }
    })
    res.status(201).json(a)
  } catch {
    res.status(500).json({ error: 'Failed to create allocation' })
  }
})

app.put('/api/allocations/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    const { fundType, allocatedAmount, status } = req.body
    const updated = await prisma.fundAllocation.update({
      where: { id: parseInt(id) },
      data: { fundType, allocatedAmount: parseFloat(allocatedAmount), status }
    })
    res.json(updated)
  } catch (e) {
    res.status(500).json({ error: 'Failed to update allocation' })
  }
})

app.delete('/api/allocations/:id', authenticate, adminOnly, async (req, res) => {
  try {
    const { id } = req.params
    const hasExpenditures = await prisma.expenditure.findFirst({ where: { fundAllocationId: parseInt(id) } })
    if (hasExpenditures) {
      return res.status(400).json({ error: 'Cannot delete allocation with existing expenditures. Delete the expenditures first.' })
    }
    await prisma.fundAllocation.delete({
      where: { id: parseInt(id) }
    })
    res.json({ message: 'Deleted successfully' })
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete allocation' })
  }
})

// ─── Expenditures ─────────────────────────────────────────────────────────────
app.get('/api/expenditures', authenticate, async (req, res) => {
  try {
    const expenditures = await prisma.expenditure.findMany({
      orderBy: { date: 'desc' },
      include: { fundAllocation: { select: { fundType: true } } }
    })
    res.json(expenditures.map(e => ({
      id: e.id, date: e.date, referenceNo: e.referenceNo, description: e.description,
      amount: e.amount, status: e.status, fundType: e.fundAllocation.fundType,
      fundAllocationId: e.fundAllocationId
    })))
  } catch {
    res.status(500).json({ error: 'Failed to fetch expenditures' })
  }
})

app.post('/api/expenditures', authenticate, treasurerOnly, async (req, res) => {
  try {
    const { date, referenceNo, description, amount, fundAllocationId, status } = req.body
    const fund = await prisma.fundAllocation.findUnique({ where: { id: parseInt(fundAllocationId) } })
    if (!fund) return res.status(404).json({ error: 'Fund allocation not found' })
    const e = await prisma.expenditure.create({
      data: {
        date: new Date(date), referenceNo, description,
        amount: parseFloat(amount), status: status || 'Approved',
        fundAllocationId: parseInt(fundAllocationId)
      }
    })
    res.status(201).json(e)
  } catch {
    res.status(500).json({ error: 'Failed to record expenditure' })
  }
})

// ─── AI Routes ────────────────────────────────────────────────────────────────
app.get('/api/ai/forecast', authenticate, async (req, res) => {
  try {
    const allocations = await prisma.fundAllocation.findMany({ include: { expenditures: true } })
    const allExpenditures = await prisma.expenditure.findMany({ orderBy: { date: 'asc' } })

    // Group expenditures by month
    const monthlySpend: Record<string, number> = {}
    allExpenditures.forEach(e => {
      const key = new Date(e.date).toISOString().slice(0, 7)
      monthlySpend[key] = (monthlySpend[key] || 0) + e.amount
    })

    const months = Object.keys(monthlySpend).sort()
    const values = months.map(m => monthlySpend[m])

    // Simple linear regression for trend
    const n = values.length
    const sumX = values.reduce((s, _, i) => s + i, 0)
    const sumY = values.reduce((s, v) => s + v, 0)
    const sumXY = values.reduce((s, v, i) => s + i * v, 0)
    const sumX2 = values.reduce((s, _, i) => s + i * i, 0)
    const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0
    const intercept = (sumY - slope * sumX) / n

    // Predict next 3 months
    const predictions = []
    const lastDate = months.length > 0 ? new Date(months[months.length - 1] + '-01') : new Date()
    for (let i = 1; i <= 3; i++) {
      const d = new Date(lastDate)
      d.setMonth(d.getMonth() + i)
      const key = d.toISOString().slice(0, 7)
      const predicted = Math.max(0, intercept + slope * (n - 1 + i))
      predictions.push({ month: key, predicted: Math.round(predicted) })
    }

    // Per-fund analysis
    const fundAnalysis = allocations.map(a => {
      const expended = a.expenditures.reduce((s, e) => s + e.amount, 0)
      const utilization = a.allocatedAmount > 0 ? (expended / a.allocatedAmount) * 100 : 0
      const avgMonthly = a.expenditures.length > 0
        ? expended / Math.max(1, new Set(a.expenditures.map(e => new Date(e.date).toISOString().slice(0, 7))).size)
        : 0
      const projectedNeeded = avgMonthly * 12
      const recommendation = utilization > 90
        ? 'Budget nearly exhausted — consider increasing allocation.'
        : utilization > 70
          ? 'On track — monitor closely to avoid overspend.'
          : utilization < 30
            ? 'Underspent — review if budget is appropriate or reallocate.'
            : 'Healthy utilization rate.'

      return {
        fundType: a.fundType,
        allocatedAmount: a.allocatedAmount,
        expended: Math.round(expended),
        utilization: Math.round(utilization),
        avgMonthlySpend: Math.round(avgMonthly),
        projectedAnnualNeed: Math.round(projectedNeeded),
        recommendation
      }
    })

    res.json({
      monthlyHistory: months.map((m, i) => ({ month: m, amount: values[i] })),
      predictions,
      fundAnalysis,
      trendSlope: Math.round(slope),
      generatedAt: new Date().toISOString()
    })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to generate forecast' })
  }
})

app.post('/api/ai/generate-document', authenticate, adminOnly, async (req, res) => {
  try {
    const { type } = req.body // 'allocation' or 'monitoring'
    const allocations = await prisma.fundAllocation.findMany({ include: { expenditures: true } })
    const now = new Date()

    const fundData = allocations.map(a => {
      const expended = a.expenditures.reduce((s, e) => s + e.amount, 0)
      const balance = a.allocatedAmount - expended
      const utilization = a.allocatedAmount > 0 ? ((expended / a.allocatedAmount) * 100).toFixed(1) : '0'
      return { ...a, expended, balance, utilization }
    })

    const totalBudget = fundData.reduce((s, f) => s + f.allocatedAmount, 0)
    const totalExpended = fundData.reduce((s, f) => s + f.expended, 0)
    const totalBalance = totalBudget - totalExpended
    const overallUtil = totalBudget > 0 ? ((totalExpended / totalBudget) * 100).toFixed(1) : '0'

    const fmt = (n: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)
    const dateStr = now.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })

    let html = ''

    if (type === 'allocation') {
      html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Budget Allocation Document</title>
<style>
  body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #000; font-size: 13px; }
  .header { text-align: center; margin-bottom: 30px; border-bottom: 3px double #000; padding-bottom: 15px; }
  .header h1 { font-size: 16px; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
  .header h2 { font-size: 14px; margin: 5px 0; }
  .header p { margin: 2px 0; font-size: 12px; }
  .doc-title { text-align: center; margin: 20px 0; font-size: 15px; font-weight: bold; text-decoration: underline; text-transform: uppercase; }
  .meta { margin: 15px 0; font-size: 12px; }
  .meta table { width: 100%; }
  .meta td { padding: 2px 0; }
  table.data { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
  table.data th { background: #f0f0f0; border: 1px solid #000; padding: 6px 8px; text-align: center; font-weight: bold; }
  table.data td { border: 1px solid #000; padding: 5px 8px; }
  table.data tr:nth-child(even) { background: #fafafa; }
  .total-row { font-weight: bold; background: #e8e8e8 !important; }
  .section-title { font-weight: bold; margin: 20px 0 8px; font-size: 13px; text-transform: uppercase; text-decoration: underline; }
  .ai-insights { background: #f9f9f9; border: 1px solid #ccc; padding: 15px; margin: 20px 0; border-radius: 4px; }
  .ai-insights h3 { margin: 0 0 10px; font-size: 13px; }
  .insight-item { margin: 6px 0; padding-left: 15px; font-size: 12px; }
  .signatories { display: flex; justify-content: space-between; margin-top: 60px; }
  .signatory { text-align: center; width: 30%; }
  .signatory .line { border-top: 1px solid #000; margin-bottom: 5px; }
  .signatory p { margin: 2px 0; font-size: 11px; }
  .footer { text-align: center; margin-top: 40px; font-size: 10px; color: #555; border-top: 1px solid #ccc; padding-top: 10px; }
  .badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: bold; }
  .badge-green { background: #d4edda; color: #155724; }
  .badge-yellow { background: #fff3cd; color: #856404; }
  .badge-red { background: #f8d7da; color: #721c24; }
  @media print { body { padding: 20px; } }
</style></head><body>
<div class="header">
  <h1>Republic of the Philippines</h1>
  <h1>Province of Misamis Oriental</h1>
  <h1>Municipality of Manticao</h1>
  <h2>BARANGAY PAGAWAN</h2>
  <h2>Office of the Barangay Treasurer</h2>
</div>

<div class="doc-title">Annual Budget Allocation Document<br><span style="font-size:12px">Fiscal Year ${now.getFullYear()}</span></div>

<div class="meta">
  <table><tr>
    <td><strong>Document No.:</strong> BAD-${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}</td>
    <td style="text-align:right"><strong>Date:</strong> ${dateStr}</td>
  </tr><tr>
    <td><strong>Prepared by:</strong> AI-Powered Budget System</td>
    <td style="text-align:right"><strong>Classification:</strong> Public Document</td>
  </tr></table>
</div>

<div class="section-title">I. Budget Allocation Summary</div>
<table class="data">
  <thead><tr>
    <th>Fund Type</th><th>Allocated Amount</th><th>Expended</th><th>Balance</th><th>Utilization</th><th>Status</th>
  </tr></thead>
  <tbody>
    ${fundData.map(f => `<tr>
      <td>${f.fundType}</td>
      <td style="text-align:right">${fmt(f.allocatedAmount)}</td>
      <td style="text-align:right">${fmt(f.expended)}</td>
      <td style="text-align:right">${fmt(f.balance)}</td>
      <td style="text-align:center">${f.utilization}%</td>
      <td style="text-align:center"><span class="badge ${parseFloat(f.utilization as string)>90?'badge-red':parseFloat(f.utilization as string)>60?'badge-yellow':'badge-green'}">${f.status}</span></td>
    </tr>`).join('')}
    <tr class="total-row">
      <td><strong>TOTAL</strong></td>
      <td style="text-align:right"><strong>${fmt(totalBudget)}</strong></td>
      <td style="text-align:right"><strong>${fmt(totalExpended)}</strong></td>
      <td style="text-align:right"><strong>${fmt(totalBalance)}</strong></td>
      <td style="text-align:center"><strong>${overallUtil}%</strong></td>
      <td></td>
    </tr>
  </tbody>
</table>

<div class="section-title">II. AI-Generated Insights & Recommendations</div>
<div class="ai-insights">
  <h3>🤖 Predictive AI Analysis — Generated ${dateStr}</h3>
  ${fundData.map(f => {
    const util = parseFloat(f.utilization as string)
    const rec = util > 90 ? `⚠️ <strong>${f.fundType}</strong>: Budget nearly exhausted (${f.utilization}% utilized). Recommend increasing allocation by 15-20% for next fiscal year.`
      : util < 30 ? `💡 <strong>${f.fundType}</strong>: Significantly underspent (${f.utilization}% utilized). Consider reallocating surplus to higher-priority funds.`
      : `✅ <strong>${f.fundType}</strong>: Utilization at ${f.utilization}% — healthy budget usage. Maintain current allocation.`
    return `<div class="insight-item">• ${rec}</div>`
  }).join('')}
  <div class="insight-item" style="margin-top:10px">• <strong>Overall:</strong> Budget utilization is at ${overallUtil}%. ${parseFloat(overallUtil)>80?'Immediate attention required to avoid budget deficit.':parseFloat(overallUtil)<40?'Significant budget surplus may indicate underdelivery of services.':'Budget is being managed within acceptable parameters.'}</div>
</div>

<div class="section-title">III. Certification</div>
<p>I hereby certify that the above budget allocation figures are true and correct based on official barangay financial records as of ${dateStr}.</p>

<div class="signatories">
  <div class="signatory"><div class="line"></div><p><strong>Barangay Treasurer</strong></p><p>Certified Correct</p></div>
  <div class="signatory"><div class="line"></div><p><strong>Barangay Secretary</strong></p><p>Attested</p></div>
  <div class="signatory"><div class="line"></div><p><strong>Barangay Captain</strong></p><p>Approved</p></div>
</div>

<div class="footer">This document was auto-generated by the AI-Powered Budget Allocation System of Barangay Pagawan, Manticao, Misamis Oriental.<br>Generated on ${new Date().toLocaleString()}</div>
</body></html>`
    } else {
      // Monitoring document
      const recentExps = await prisma.expenditure.findMany({
        orderBy: { date: 'desc' }, take: 20,
        include: { fundAllocation: { select: { fundType: true } } }
      })

      html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Budget Monitoring Document</title>
<style>
  body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #000; font-size: 13px; }
  .header { text-align: center; margin-bottom: 30px; border-bottom: 3px double #000; padding-bottom: 15px; }
  .header h1 { font-size: 16px; margin: 0; text-transform: uppercase; }
  .header h2 { font-size: 14px; margin: 5px 0; }
  .doc-title { text-align: center; margin: 20px 0; font-size: 15px; font-weight: bold; text-decoration: underline; text-transform: uppercase; }
  table.data { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
  table.data th { background: #f0f0f0; border: 1px solid #000; padding: 6px 8px; text-align: center; font-weight: bold; }
  table.data td { border: 1px solid #000; padding: 5px 8px; }
  .section-title { font-weight: bold; margin: 20px 0 8px; font-size: 13px; text-transform: uppercase; text-decoration: underline; }
  .total-row { font-weight: bold; background: #e8e8e8 !important; }
  .alert-box { padding: 12px; border-radius: 4px; margin: 8px 0; font-size: 12px; border-left: 4px solid; }
  .alert-warning { background: #fff3cd; border-color: #ffc107; }
  .alert-danger  { background: #f8d7da; border-color: #dc3545; }
  .alert-success { background: #d4edda; border-color: #28a745; }
  .signatories { display: flex; justify-content: space-between; margin-top: 60px; }
  .signatory { text-align: center; width: 30%; }
  .signatory .line { border-top: 1px solid #000; margin-bottom: 5px; }
  .signatory p { margin: 2px 0; font-size: 11px; }
  .footer { text-align: center; margin-top: 40px; font-size: 10px; color: #555; border-top: 1px solid #ccc; padding-top: 10px; }
  @media print { body { padding: 20px; } }
</style></head><body>
<div class="header">
  <h1>Republic of the Philippines</h1>
  <h1>Province of Misamis Oriental • Municipality of Manticao</h1>
  <h2>BARANGAY PAGAWAN — Budget Monitoring Office</h2>
</div>

<div class="doc-title">Budget Monitoring Report<br><span style="font-size:12px">As of ${dateStr}</span></div>

<div class="section-title">I. Fund Utilization Status</div>
<table class="data">
  <thead><tr><th>Fund Type</th><th>Allocated</th><th>Expended</th><th>Balance</th><th>% Used</th><th>Assessment</th></tr></thead>
  <tbody>
    ${fundData.map(f => {
      const util = parseFloat(f.utilization as string)
      const assess = util > 90 ? '🔴 Critical' : util > 70 ? '🟡 Monitor' : util < 25 ? '🔵 Underspent' : '🟢 Normal'
      return `<tr>
        <td>${f.fundType}</td>
        <td style="text-align:right">${fmt(f.allocatedAmount)}</td>
        <td style="text-align:right">${fmt(f.expended)}</td>
        <td style="text-align:right">${fmt(f.balance)}</td>
        <td style="text-align:center">${f.utilization}%</td>
        <td style="text-align:center">${assess}</td>
      </tr>`}).join('')}
    <tr class="total-row">
      <td><strong>TOTAL</strong></td>
      <td style="text-align:right"><strong>${fmt(totalBudget)}</strong></td>
      <td style="text-align:right"><strong>${fmt(totalExpended)}</strong></td>
      <td style="text-align:right"><strong>${fmt(totalBalance)}</strong></td>
      <td style="text-align:center"><strong>${overallUtil}%</strong></td>
      <td></td>
    </tr>
  </tbody>
</table>

<div class="section-title">II. AI Monitoring Alerts</div>
${fundData.map(f => {
  const util = parseFloat(f.utilization as string)
  if (util > 90) return `<div class="alert-box alert-danger">🚨 <strong>CRITICAL — ${f.fundType}:</strong> Utilization at ${f.utilization}%. Immediate review required. Balance of ${fmt(f.balance)} may be insufficient for remaining obligations.</div>`
  if (util > 70) return `<div class="alert-box alert-warning">⚠️ <strong>WARNING — ${f.fundType}:</strong> Utilization at ${f.utilization}%. Monitor closely. Recommend monthly expenditure review.</div>`
  if (util < 25) return `<div class="alert-box alert-warning">💡 <strong>UNDERSPENT — ${f.fundType}:</strong> Only ${f.utilization}% utilized. Review planned activities to ensure budget is properly deployed.</div>`
  return `<div class="alert-box alert-success">✅ <strong>NORMAL — ${f.fundType}:</strong> Utilization at ${f.utilization}%. No immediate action required.</div>`
}).join('')}

<div class="section-title">III. Recent Expenditure Transactions</div>
<table class="data">
  <thead><tr><th>Date</th><th>Reference No.</th><th>Description</th><th>Fund</th><th>Amount</th><th>Status</th></tr></thead>
  <tbody>
    ${recentExps.map(e => `<tr>
      <td>${new Date(e.date).toLocaleDateString('en-PH')}</td>
      <td>${e.referenceNo}</td>
      <td>${e.description}</td>
      <td>${e.fundAllocation.fundType}</td>
      <td style="text-align:right">${fmt(e.amount)}</td>
      <td style="text-align:center">${e.status}</td>
    </tr>`).join('')}
  </tbody>
</table>

<div class="section-title">IV. Certification</div>
<p>This monitoring report is generated from the AI-Powered Budget Monitoring System as of ${dateStr}. All data reflected herein are based on official recorded transactions.</p>

<div class="signatories">
  <div class="signatory"><div class="line"></div><p><strong>Barangay Treasurer</strong></p><p>Prepared By</p></div>
  <div class="signatory"><div class="line"></div><p><strong>Barangay Secretary</strong></p><p>Reviewed By</p></div>
  <div class="signatory"><div class="line"></div><p><strong>Barangay Captain</strong></p><p>Approved By</p></div>
</div>
<div class="footer">Auto-generated by the AI-Powered Budget Monitoring System — Barangay Pagawan, Manticao, Misamis Oriental | ${new Date().toLocaleString()}</div>
</body></html>`
    }

    res.json({ html, type, generatedAt: new Date().toISOString() })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to generate document' })
  }
})

app.post('/api/ai/chat', authenticate, async (req, res) => {
  try {
    const { message } = req.body
    const allocations = await prisma.fundAllocation.findMany({ include: { expenditures: true } })
    
    const msg = message.toLowerCase()
    let reply = "I am the AI Budget Assistant. I can help you analyze the barangay's budget. "
    
    // Advanced simulated AI logic
    const fmt = (n: number) => `₱${n.toLocaleString('en-PH', {minimumFractionDigits: 2})}`
    
    // 1. Identify if they are asking about a specific fund
    const mentionedFund = allocations.find(a => {
      const fundName = a.fundType.toLowerCase()
      if (msg.includes(fundName)) return true
      
      // Lenient keyword matching for typos (e.g. 'citezens' but 'senior' matches)
      const keywords = fundName.replace(/[^a-z0-9]/g, ' ')
                               .split(' ')
                               .filter(w => w.length > 1 && w !== 'fund' && w !== 'and' && w !== 'the')
      return keywords.some(w => msg.includes(w))
    })
    
    if (mentionedFund) {
      const spent = mentionedFund.expenditures.reduce((sum, e) => sum + e.amount, 0)
      const balance = mentionedFund.allocatedAmount - spent
      const util = mentionedFund.allocatedAmount > 0 ? ((spent / mentionedFund.allocatedAmount) * 100).toFixed(1) : '0'

      if (msg.includes('balance') || msg.includes('remain')) {
        reply = `The remaining balance for the ${mentionedFund.fundType} is ${fmt(balance)} (Out of ${fmt(mentionedFund.allocatedAmount)}).`
      } else if (msg.includes('spent') || msg.includes('expend') || msg.includes('used')) {
        reply = `A total of ${fmt(spent)} has been spent from the ${mentionedFund.fundType}, which is ${util}% of its budget.`
      } else {
        reply = `${mentionedFund.fundType} Summary:\n• Allocated: ${fmt(mentionedFund.allocatedAmount)}\n• Spent: ${fmt(spent)} (${util}%)\n• Balance: ${fmt(balance)}`
      }
    } 
    // 2. Largest / Highest Budget
    else if (msg.includes('largest') || msg.includes('highest') || msg.includes('biggest')) {
      const highest = [...allocations].sort((a, b) => b.allocatedAmount - a.allocatedAmount)[0]
      if (highest) reply = `The fund with the highest allocation is the ${highest.fundType} with a budget of ${fmt(highest.allocatedAmount)}.`
      else reply = 'There are no funds allocated yet.'
    }
    // 2.5 Smallest / Lowest Budget
    else if (msg.includes('smallest') || msg.includes('lowest') || msg.includes('least')) {
      const lowest = [...allocations].sort((a, b) => a.allocatedAmount - b.allocatedAmount)[0]
      if (lowest) reply = `The fund with the lowest allocation is the ${lowest.fundType} with a budget of ${fmt(lowest.allocatedAmount)}.`
      else reply = 'There are no funds allocated yet.'
    }
    // 3. Most recently spent
    else if (msg.includes('recent') || msg.includes('latest')) {
      const allExps = allocations.flatMap(a => a.expenditures).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      if (allExps.length > 0) {
        const latest = allExps[0]
        const fundName = allocations.find(a => a.id === latest.fundAllocationId)?.fundType
        reply = `The most recent expenditure was ${fmt(latest.amount)} for "${latest.description}" under the ${fundName}, recorded on ${new Date(latest.date).toLocaleDateString()}.`
      } else {
        reply = "There are no expenditures recorded yet."
      }
    }
    // 3.5 Underspent / Underutilized
    else if (msg.includes('under') || msg.includes('unused') || msg.includes('slow')) {
      const under = allocations.filter(a => {
        const spent = a.expenditures.reduce((sum, e) => sum + e.amount, 0)
        return a.allocatedAmount > 0 && (spent / a.allocatedAmount) < 0.3
      })
      if (under.length > 0) {
        reply = `💡 The following funds are severely underspent (<30% utilized):\n` + 
                under.map(c => `• ${c.fundType}`).join('\n')
      } else {
        reply = `All funds are currently being utilized properly (>30%).`
      }
    }
    // 4. Overall Totals
    else if (msg.includes('expend') || msg.includes('spent') || msg.includes('spending')) {
      let totalSpent = 0
      allocations.forEach(a => totalSpent += a.expenditures.reduce((sum, e) => sum + e.amount, 0))
      reply = `The total amount spent across all funds so far is ${fmt(totalSpent)}.`
    } 
    else if (msg.includes('total') && (msg.includes('budget') || msg.includes('allocate') || msg.includes('fund'))) {
      const total = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0)
      reply = `The total allocated budget across all ${allocations.length} funds is ${fmt(total)}.`
    } 
    else if (msg.includes('balance') || msg.includes('remain')) {
      let totalBudget = 0, totalSpent = 0
      allocations.forEach(a => {
        totalBudget += a.allocatedAmount
        totalSpent += a.expenditures.reduce((sum, e) => sum + e.amount, 0)
      })
      reply = `The overall remaining balance for the barangay is ${fmt(totalBudget - totalSpent)}.`
    } 
    // 5. Critical funds
    else if (msg.includes('critical') || msg.includes('danger') || msg.includes('warning')) {
      const critical = allocations.filter(a => {
        const spent = a.expenditures.reduce((sum, e) => sum + e.amount, 0)
        return a.allocatedAmount > 0 && (spent / a.allocatedAmount) > 0.9
      })
      if (critical.length > 0) {
        reply = `⚠️ The following funds are in critical condition (>90% utilized):\n` + 
                critical.map(c => `• ${c.fundType}`).join('\n')
      } else {
        reply = `✅ Good news! There are currently no funds in critical condition.`
      }
    } 
    // 7. Overall Utilization Rate
    else if (msg.includes('utilization') || msg.includes('rate')) {
      let totalBudget = 0, totalSpent = 0
      allocations.forEach(a => {
        totalBudget += a.allocatedAmount
        totalSpent += a.expenditures.reduce((sum, e) => sum + e.amount, 0)
      })
      const util = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : '0'
      reply = `The overall budget utilization rate for the barangay is ${util}%.`
    }
    // 8. List / Count funds
    else if (msg.includes('list') || msg.includes('how many') || msg.includes('show all')) {
      reply = `There are currently ${allocations.length} active funds:\n` + 
              allocations.map(a => `• ${a.fundType}`).join('\n')
    }
    else if (msg.includes('hello') || msg.includes('hi') || msg.includes('help')) {
      reply = "Hello! I am the Barangay Pagawan AI Budget Assistant. Here is a full list of things you can ask me:\n\n" +
              "📊 **Overall Totals:**\n" +
              "• \"What is the total allocated budget?\"\n" +
              "• \"What is the total amount spent?\"\n" +
              "• \"What is our overall remaining balance?\"\n" +
              "• \"What is the overall utilization rate?\"\n\n" +
              "🔍 **Specific Funds:**\n" +
              "• \"What is the balance of the [Fund Name]?\"\n" +
              "• \"How much is spent from the [Fund Name]?\"\n\n" +
              "⚠️ **Risk & Monitoring:**\n" +
              "• \"Are there any critical funds?\"\n" +
              "• \"Which funds are underspent?\"\n\n" +
              "📈 **Extremes & Lists:**\n" +
              "• \"Which fund has the largest/smallest budget?\"\n" +
              "• \"What was our most recent expenditure?\"\n" +
              "• \"List all funds\""
    } 
    else {
      reply = "I'm not sure about that. Try asking about specific funds (e.g., 'General Fund balance'), the 'total budget', 'recent expenditures', or type 'help' to see all questions."
    }
    
    res.json({ reply, generatedAt: new Date().toISOString() })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Failed to process chat' })
  }
})

app.listen(PORT, () => console.log(`✅ Backend running at http://localhost:${PORT}`))
