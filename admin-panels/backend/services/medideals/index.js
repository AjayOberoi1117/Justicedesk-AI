const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const app = express()
const PORT = process.env.PORT || 3003

app.use(cors())
app.use(bodyParser.json())

// In-memory data store
let data = {
  users: generateUsers(),
  products: generateProducts(),
  orders: generateOrders(),
  metrics: {
    totalUsers: 1234,
    retailers: 456,
    distributors: 345,
    vendors: 433,
    kycVerified: 1100,
    totalOrders: 5678,
    revenue: 2345678,
  },
}

function generateUsers() {
  const companies = [
    'Sharma Pharmacy', 'PharmaPro', 'HealthPlus', 'MedicareHub', 'DrugStore Express',
    'Wellness Center', 'Pharma Solutions', 'MediCare Group', 'HealthFirst', 'QuickMeds',
  ]

  const users = []
  const roles = ['retailer', 'distributor', 'vendor']

  for (let i = 1; i <= 80; i++) {
    const role = roles[Math.floor(Math.random() * roles.length)]
    const status = ['verified', 'pending', 'rejected'][Math.floor(Math.random() * 3)]
    users.push({
      id: `user-${i}`,
      name: companies[Math.floor(Math.random() * companies.length)] + ` ${i}`,
      company: companies[Math.floor(Math.random() * companies.length)],
      role: role,
      email: `user${i}@medideals.com`,
      phone: `+91-${7000000000 + i}`,
      kycStatus: status,
      documents: {
        gst: getDocStatus(status),
        drug_license: getDocStatus(status),
        pan: getDocStatus(status),
      },
      createdAt: new Date(Date.now() - Math.random() * 7776000000).toISOString(),
      lastUpdate: new Date(Date.now() - Math.random() * 604800000).toISOString(),
    })
  }
  return users
}

function getDocStatus(kycStatus) {
  if (kycStatus === 'verified') return 'verified'
  if (kycStatus === 'pending') return 'pending'
  return 'rejected'
}

function generateProducts() {
  const medicines = [
    'Aspirin 500mg', 'Paracetamol 650mg', 'Ibuprofen 400mg', 'Cough Syrup', 'Vitamin C',
    'Multivitamin', 'Antibiotic Cream', 'Bandage Pack', 'Thermometer', 'Sanitizer',
  ]

  const products = []
  for (let i = 1; i <= 50; i++) {
    products.push({
      id: `product-${i}`,
      name: medicines[Math.floor(Math.random() * medicines.length)] + ` - Pack ${i}`,
      category: ['analgesics', 'antibiotics', 'vitamins', 'first-aid', 'hygiene'][
        Math.floor(Math.random() * 5)
      ],
      seller: `Seller ${Math.floor(Math.random() * 10) + 1}`,
      price: Math.floor(Math.random() * 5000) + 100,
      quantity: Math.floor(Math.random() * 10000) + 100,
      unit: 'box',
      createdAt: new Date(Date.now() - Math.random() * 2592000000).toISOString(),
    })
  }
  return products
}

function generateOrders() {
  const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
  const orders = []

  for (let i = 1; i <= 100; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const total = Math.floor(Math.random() * 50000) + 5000
    orders.push({
      id: `order-${i}`,
      orderId: `ORD-${String(i).padStart(6, '0')}`,
      buyer: `Buyer ${Math.floor(Math.random() * 20) + 1}`,
      seller: `Seller ${Math.floor(Math.random() * 10) + 1}`,
      items: Math.floor(Math.random() * 50) + 1,
      total: total,
      status: status,
      paymentStatus: status === 'cancelled' ? 'refunded' : ['partial', 'full', 'pending'][Math.floor(Math.random() * 3)],
      advancePayment: Math.floor(total * 0.1),
      remainingBalance: Math.floor(total * 0.9),
      shippingMethod: Math.random() > 0.5 ? 'self' : 'medideals',
      createdAt: new Date(Date.now() - Math.random() * 7776000000).toISOString(),
      estimatedDelivery: new Date(Date.now() + 86400000 * (Math.floor(Math.random() * 7) + 1)).toISOString(),
    })
  }
  return orders
}

// Health check
app.get('/api/medideals/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'MediDeals Admin Backend',
  })
})

// Get KYC metrics
app.get('/api/medideals/kyc/metrics', (req, res) => {
  res.json({
    totalUsers: data.metrics.totalUsers,
    retailers: data.metrics.retailers,
    distributors: data.metrics.distributors,
    vendors: data.metrics.vendors,
    kycVerified: data.metrics.kycVerified,
    totalOrders: data.metrics.totalOrders,
    revenue: data.metrics.revenue,
    verificationRate: ((data.metrics.kycVerified / data.metrics.totalUsers) * 100).toFixed(1),
  })
})

// Get analytics dashboard
app.get('/api/medideals/analytics/dashboard', (req, res) => {
  res.json({
    activeUsers: Math.floor(Math.random() * 200) + 100,
    ordersThisWeek: Math.floor(Math.random() * 500) + 100,
    revenueThisMonth: Math.floor(Math.random() * 500000) + 100000,
    topProducts: data.products.slice(0, 5).map(p => ({
      ...p,
      sales: Math.floor(Math.random() * 1000) + 100,
    })),
    recentOrders: data.orders.slice(0, 10),
  })
})

// Get users with filtering
app.get('/api/medideals/users', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100)
  const offset = parseInt(req.query.offset) || 0
  const role = req.query.role
  const status = req.query.kycStatus
  const search = req.query.search?.toLowerCase() || ''

  let filtered = data.users
  if (role) {
    filtered = filtered.filter(u => u.role === role)
  }
  if (status) {
    filtered = filtered.filter(u => u.kycStatus === status)
  }
  if (search) {
    filtered = filtered.filter(u =>
      u.name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search) ||
      u.company.toLowerCase().includes(search)
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
app.get('/api/medideals/users/:id', (req, res) => {
  const user = data.users.find(u => u.id === req.params.id)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  res.json(user)
})

// Verify user
app.post('/api/medideals/users/:id/verify', (req, res) => {
  const user = data.users.find(u => u.id === req.params.id)
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  user.kycStatus = 'verified'
  res.json({
    success: true,
    kycStatus: 'verified',
    message: 'User verified',
    timestamp: new Date().toISOString(),
  })
})

// Get products with pagination
app.get('/api/medideals/products', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100)
  const offset = parseInt(req.query.offset) || 0
  const search = req.query.search?.toLowerCase() || ''

  let filtered = data.products
  if (search) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(search) ||
      p.category.toLowerCase().includes(search) ||
      p.seller.toLowerCase().includes(search)
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

// Create product (admin)
app.post('/api/medideals/products', (req, res) => {
  const product = {
    id: `product-${data.products.length + 1}`,
    ...req.body,
    createdAt: new Date().toISOString(),
  }
  data.products.push(product)
  res.status(201).json(product)
})

// Get orders with filtering
app.get('/api/medideals/orders', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100)
  const offset = parseInt(req.query.offset) || 0
  const status = req.query.status
  const search = req.query.search?.toLowerCase() || ''

  let filtered = data.orders
  if (status) {
    filtered = filtered.filter(o => o.status === status)
  }
  if (search) {
    filtered = filtered.filter(o =>
      o.orderId.toLowerCase().includes(search) ||
      o.buyer.toLowerCase().includes(search) ||
      o.seller.toLowerCase().includes(search)
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

// Get single order
app.get('/api/medideals/orders/:id', (req, res) => {
  const order = data.orders.find(o => o.id === req.params.id)
  if (!order) {
    return res.status(404).json({ error: 'Order not found' })
  }

  res.json({
    ...order,
    products: [
      {
        id: 'product-1',
        name: 'Aspirin 500mg',
        quantity: Math.floor(Math.random() * 50) + 1,
        unitPrice: 45,
        subtotal: Math.floor(Math.random() * 2250) + 45,
      },
      {
        id: 'product-2',
        name: 'Paracetamol 650mg',
        quantity: Math.floor(Math.random() * 30) + 1,
        unitPrice: 35,
        subtotal: Math.floor(Math.random() * 1050) + 35,
      },
    ],
  })
})

// Update order status
app.patch('/api/medideals/orders/:id/status', (req, res) => {
  const order = data.orders.find(o => o.id === req.params.id)
  if (!order) {
    return res.status(404).json({ error: 'Order not found' })
  }

  order.status = req.body.status
  if (req.body.status === 'delivered') {
    order.paymentStatus = 'full'
  }

  res.json({
    success: true,
    status: req.body.status,
    message: `Order updated to ${req.body.status}`,
    timestamp: new Date().toISOString(),
  })
})

app.listen(PORT, () => {
  console.log(`✓ MediDeals backend running on port ${PORT}`)
})
