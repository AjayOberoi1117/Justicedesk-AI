const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const app = express()
const PORT = process.env.PORT || 3002

app.use(cors())
app.use(bodyParser.json())

// In-memory data store
let data = {
  advocates: generateAdvocates(),
  metrics: {
    totalAdvocates: 234,
    kycComplete: 189,
    pendingKYC: 35,
    rejectedKYC: 10,
  },
}

function generateAdvocates() {
  const names = [
    'Dr. Ashok Kumar', 'Priya Sharma', 'Rajesh Singh', 'Anjali Verma', 'Vikram Patel',
    'Deepika Reddy', 'Arjun Desai', 'Neha Iyer', 'Rohan Gupta', 'Pooja Mehta',
    'Sameer Khan', 'Sneha Roy', 'Karan Nair', 'Divya Agarwal', 'Ashish Rao',
  ]

  const statuses = ['verified', 'pending', 'rejected']
  const advocates = []

  for (let i = 1; i <= 100; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    advocates.push({
      id: `advocate-${i}`,
      name: names[Math.floor(Math.random() * names.length)] + ` ${i}`,
      email: `advocate${i}@vakeel.com`,
      phone: `+91-${8000000000 + i}`,
      barEnrollmentNumber: `ENR-${String(i).padStart(6, '0')}`,
      panNumber: `PAN${i}123456`,
      state: ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Punjab'][Math.floor(Math.random() * 5)],
      barEnrollmentStatus: getVerificationStatus(),
      panStatus: getVerificationStatus(),
      aadhaarStatus: getAadhaarStatus(),
      createdAt: new Date(Date.now() - Math.random() * 7776000000).toISOString(),
      lastUpdate: new Date(Date.now() - Math.random() * 604800000).toISOString(),
    })
  }
  return advocates
}

function getVerificationStatus() {
  const statuses = ['verified', 'pending', 'rejected']
  return statuses[Math.floor(Math.random() * statuses.length)]
}

function getAadhaarStatus() {
  const statuses = ['verified', 'pending', 'rejected', 'not_required']
  return statuses[Math.floor(Math.random() * statuses.length)]
}

// Health check
app.get('/api/vakeel-sahib/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'Vakeel Sahib Admin Backend',
  })
})

// Get KYC metrics
app.get('/api/vakeel-sahib/kyc/metrics', (req, res) => {
  res.json({
    totalAdvocates: data.metrics.totalAdvocates,
    kycComplete: data.metrics.kycComplete,
    pendingKYC: data.metrics.pendingKYC,
    rejectedKYC: data.metrics.rejectedKYC,
    verificationRate: ((data.metrics.kycComplete / data.metrics.totalAdvocates) * 100).toFixed(1),
    byState: {
      'Delhi': 45,
      'Maharashtra': 38,
      'Karnataka': 32,
      'Tamil Nadu': 41,
      'Punjab': 33,
    },
  })
})

// Get advocates with filtering
app.get('/api/vakeel-sahib/advocates', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100)
  const offset = parseInt(req.query.offset) || 0
  const status = req.query.status
  const search = req.query.search?.toLowerCase() || ''

  let filtered = data.advocates
  if (status) {
    filtered = filtered.filter(a =>
      (status === 'verified' && a.barEnrollmentStatus === 'verified' && a.panStatus === 'verified') ||
      (status === 'pending' && (a.barEnrollmentStatus === 'pending' || a.panStatus === 'pending')) ||
      (status === 'rejected' && (a.barEnrollmentStatus === 'rejected' || a.panStatus === 'rejected'))
    )
  }
  if (search) {
    filtered = filtered.filter(a =>
      a.name.toLowerCase().includes(search) ||
      a.email.toLowerCase().includes(search) ||
      a.barEnrollmentNumber.toLowerCase().includes(search)
    )
  }

  const paginated = filtered.slice(offset, offset + limit)
  res.json({
    data: paginated,
    total: filtered.length,
    limit,
    offset,
  })
})

// Get single advocate
app.get('/api/vakeel-sahib/advocates/:id', (req, res) => {
  const advocate = data.advocates.find(a => a.id === req.params.id)
  if (!advocate) {
    return res.status(404).json({ error: 'Advocate not found' })
  }
  res.json(advocate)
})

// Verify bar enrollment
app.post('/api/vakeel-sahib/advocates/:id/bar-enrollment/verify', (req, res) => {
  const advocate = data.advocates.find(a => a.id === req.params.id)
  if (!advocate) {
    return res.status(404).json({ error: 'Advocate not found' })
  }

  advocate.barEnrollmentStatus = 'verified'

  res.json({
    success: true,
    message: 'Bar enrollment verified',
    status: 'verified',
    timestamp: new Date().toISOString(),
  })
})

// Verify PAN
app.post('/api/vakeel-sahib/advocates/:id/pan/verify', (req, res) => {
  const advocate = data.advocates.find(a => a.id === req.params.id)
  if (!advocate) {
    return res.status(404).json({ error: 'Advocate not found' })
  }

  advocate.panStatus = 'verified'

  res.json({
    success: true,
    message: 'PAN verified',
    status: 'verified',
    timestamp: new Date().toISOString(),
  })
})

// Verify Aadhaar
app.post('/api/vakeel-sahib/advocates/:id/aadhaar/verify', (req, res) => {
  const advocate = data.advocates.find(a => a.id === req.params.id)
  if (!advocate) {
    return res.status(404).json({ error: 'Advocate not found' })
  }

  advocate.aadhaarStatus = 'verified'

  res.json({
    success: true,
    message: 'Aadhaar verified',
    status: 'verified',
    timestamp: new Date().toISOString(),
  })
})

// Reject advocate
app.post('/api/vakeel-sahib/advocates/:id/reject', (req, res) => {
  const advocate = data.advocates.find(a => a.id === req.params.id)
  if (!advocate) {
    return res.status(404).json({ error: 'Advocate not found' })
  }

  advocate.barEnrollmentStatus = 'rejected'
  advocate.panStatus = 'rejected'

  res.json({
    success: true,
    message: 'Advocate rejected',
    reason: req.body.reason || 'Documents do not match',
    timestamp: new Date().toISOString(),
  })
})

app.listen(PORT, () => {
  console.log(`✓ Vakeel Sahib backend running on port ${PORT}`)
})
