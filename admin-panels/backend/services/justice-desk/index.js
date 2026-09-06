const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(bodyParser.json())

// In-memory data store
let data = {
  users: generateUsers(),
  metrics: {
    totalUsers: 456,
    verifiedUsers: 234,
    pendingKYC: 145,
    rejectedKYC: 77,
  },
}

function generateUsers() {
  const statuses = ['verified', 'pending', 'rejected', 'submitted']
  const names = [
    'Rajesh Kumar', 'Priya Singh', 'Amit Patel', 'Deepika Sharma', 'Arjun Reddy',
    'Anjali Gupta', 'Vikram Mehta', 'Neha Verma', 'Rohan Desai', 'Pooja Iyer',
    'Sameer Khan', 'Sneha Roy', 'Karan Nair', 'Divya Agarwal', 'Ashish Rao',
  ]

  const users = []
  for (let i = 1; i <= 100; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    users.push({
      id: `user-${i}`,
      name: names[Math.floor(Math.random() * names.length)] + ` ${i}`,
      email: `user${i}@example.com`,
      phone: `+91-${9000000000 + i}`,
      kycStatus: status,
      documentsVerified: getDocsForStatus(status),
      createdAt: new Date(Date.now() - Math.random() * 7776000000).toISOString(),
      documentCount: Math.floor(Math.random() * 5) + 1,
      lastUpdate: new Date(Date.now() - Math.random() * 604800000).toISOString(),
    })
  }
  return users
}

function getDocsForStatus(status) {
  const allDocs = ['id_proof', 'address_proof', 'pan_card', 'bank_statement']
  if (status === 'verified') return allDocs
  if (status === 'pending') return allDocs.slice(0, 2)
  if (status === 'submitted') return allDocs.slice(0, 3)
  return []
}

// Health check
app.get('/api/justice-desk/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'Justice Desk Admin Backend',
  })
})

// Get KYC metrics
app.get('/api/justice-desk/kyc/metrics', (req, res) => {
  res.json({
    totalUsers: data.metrics.totalUsers,
    verifiedUsers: data.metrics.verifiedUsers,
    pendingKYC: data.metrics.pendingKYC,
    rejectedKYC: data.metrics.rejectedKYC,
    verificationRate: ((data.metrics.verifiedUsers / data.metrics.totalUsers) * 100).toFixed(1),
    avgVerificationTime: '2.5 days',
  })
})

// Get users with filtering
app.get('/api/justice-desk/users', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100)
  const offset = parseInt(req.query.offset) || 0
  const kycStatus = req.query.kycStatus
  const search = req.query.search?.toLowerCase() || ''

  let filtered = data.users
  if (kycStatus) {
    filtered = filtered.filter(u => u.kycStatus === kycStatus)
  }
  if (search) {
    filtered = filtered.filter(u =>
      u.name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search) ||
      u.phone.includes(search)
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

// Get single user
app.get('/api/justice-desk/users/:id', (req, res) => {
  const user = data.users.find(u => u.id === req.params.id)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  // Add document details
  res.json({
    ...user,
    documents: [
      {
        id: 'doc-1',
        type: 'id_proof',
        name: 'Aadhar Card',
        status: user.documentsVerified.includes('id_proof') ? 'verified' : 'pending',
        uploadedAt: user.createdAt,
        verifiedAt: user.documentsVerified.includes('id_proof') ? new Date().toISOString() : null,
      },
      {
        id: 'doc-2',
        type: 'address_proof',
        name: 'Utility Bill',
        status: user.documentsVerified.includes('address_proof') ? 'verified' : 'pending',
        uploadedAt: user.createdAt,
        verifiedAt: user.documentsVerified.includes('address_proof') ? new Date().toISOString() : null,
      },
      {
        id: 'doc-3',
        type: 'pan_card',
        name: 'PAN Card',
        status: user.documentsVerified.includes('pan_card') ? 'verified' : 'pending',
        uploadedAt: user.createdAt,
        verifiedAt: user.documentsVerified.includes('pan_card') ? new Date().toISOString() : null,
      },
    ],
  })
})

// Verify document
app.post('/api/justice-desk/users/:userId/documents/:docId/verify', (req, res) => {
  const user = data.users.find(u => u.id === req.params.userId)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  const docTypes = ['id_proof', 'address_proof', 'pan_card', 'bank_statement']
  const docIndex = parseInt(req.params.docId.replace('doc-', '')) - 1
  if (docIndex >= 0 && docIndex < docTypes.length) {
    if (!user.documentsVerified.includes(docTypes[docIndex])) {
      user.documentsVerified.push(docTypes[docIndex])
    }
  }

  res.json({
    success: true,
    message: 'Document verified',
    documentId: req.params.docId,
    timestamp: new Date().toISOString(),
  })
})

// Reject document
app.post('/api/justice-desk/users/:userId/documents/:docId/reject', (req, res) => {
  const user = data.users.find(u => u.id === req.params.userId)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  const docTypes = ['id_proof', 'address_proof', 'pan_card', 'bank_statement']
  const docIndex = parseInt(req.params.docId.replace('doc-', '')) - 1
  if (docIndex >= 0 && docIndex < docTypes.length) {
    user.documentsVerified = user.documentsVerified.filter(d => d !== docTypes[docIndex])
  }

  user.kycStatus = 'rejected'

  res.json({
    success: true,
    message: 'Document rejected',
    reason: req.body.reason || 'Document unclear',
    documentId: req.params.docId,
    timestamp: new Date().toISOString(),
  })
})

// Verify user (mark as verified)
app.post('/api/justice-desk/users/:id/verify', (req, res) => {
  const user = data.users.find(u => u.id === req.params.id)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  user.kycStatus = 'verified'
  user.documentsVerified = ['id_proof', 'address_proof', 'pan_card']

  res.json({
    success: true,
    message: 'User verified',
    userId: req.params.id,
    kycStatus: 'verified',
  })
})

app.listen(PORT, () => {
  console.log(`✓ Justice Desk backend running on port ${PORT}`)
})
