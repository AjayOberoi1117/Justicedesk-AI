const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(bodyParser.json())

// In-memory data store
let data = {
  metrics: {
    totalStories: 1247,
    freshStories24h: 156,
    lastFetch: new Date(Date.now() - 60000).toISOString(),
  },
  providers: [
    {
      id: 'toi',
      name: 'Times of India',
      status: 'healthy',
      storiesCount: 245,
      lastUpdate: new Date(Date.now() - 120000).toISOString(),
      errorRate: 0,
    },
    {
      id: 'thehindu',
      name: 'The Hindu',
      status: 'healthy',
      storiesCount: 189,
      lastUpdate: new Date(Date.now() - 300000).toISOString(),
      errorRate: 0,
    },
    {
      id: 'indianexpress',
      name: 'Indian Express',
      status: 'degraded',
      storiesCount: 156,
      lastUpdate: new Date(Date.now() - 900000).toISOString(),
      errorRate: 2.5,
    },
    {
      id: 'deccan',
      name: 'Deccan Chronicle',
      status: 'healthy',
      storiesCount: 234,
      lastUpdate: new Date(Date.now() - 180000).toISOString(),
      errorRate: 0,
    },
    {
      id: 'tribune',
      name: 'The Tribune',
      status: 'healthy',
      storiesCount: 423,
      lastUpdate: new Date(Date.now() - 90000).toISOString(),
      errorRate: 0,
    },
  ],
  stories: generateStories(),
}

function generateStories() {
  const sources = ['Times of India', 'The Hindu', 'Indian Express', 'Deccan Chronicle', 'The Tribune']
  const categories = ['technology', 'business', 'politics', 'sports', 'entertainment', 'science', 'health', 'crime']

  const stories = []
  for (let i = 1; i <= 250; i++) {
    stories.push({
      id: `story-${i}`,
      title: `Important News: Story ${i} from ${sources[Math.floor(Math.random() * sources.length)]}`,
      description: `This is a detailed description of story number ${i} with important information about current events.`,
      source: sources[Math.floor(Math.random() * sources.length)],
      publishedAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
      category: categories[Math.floor(Math.random() * categories.length)],
      url: `https://news.example.com/story/${i}`,
      views: Math.floor(Math.random() * 10000) + 100,
      sentiment: ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)],
    })
  }
  return stories.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
}

// Health check
app.get('/api/current/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    service: 'CURRENT Admin Backend',
  })
})

// Get metrics
app.get('/api/current/metrics', (req, res) => {
  res.json({
    totalStories: data.metrics.totalStories,
    freshStories24h: data.metrics.freshStories24h,
    lastFetch: data.metrics.lastFetch,
    healthyProviders: data.providers.filter(p => p.status === 'healthy').length,
    degradedProviders: data.providers.filter(p => p.status === 'degraded').length,
  })
})

// Get providers
app.get('/api/current/providers', (req, res) => {
  res.json(data.providers)
})

// Get stories with pagination
app.get('/api/current/stories', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100)
  const offset = parseInt(req.query.offset) || 0
  const search = req.query.search?.toLowerCase() || ''

  let filtered = data.stories
  if (search) {
    filtered = filtered.filter(s =>
      s.title.toLowerCase().includes(search) ||
      s.source.toLowerCase().includes(search) ||
      s.category.toLowerCase().includes(search)
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

// Get single story
app.get('/api/current/stories/:id', (req, res) => {
  const story = data.stories.find(s => s.id === req.params.id)
  if (!story) {
    return res.status(404).json({ error: 'Story not found' })
  }
  res.json(story)
})

// Trigger ingestion
app.post('/api/current/ingestion/trigger', (req, res) => {
  // Simulate ingestion
  data.metrics.lastFetch = new Date().toISOString()
  data.metrics.freshStories24h = Math.floor(Math.random() * 200) + 50
  res.json({
    success: true,
    message: 'Ingestion triggered',
    newStoriesAdded: Math.floor(Math.random() * 100) + 10,
    timestamp: new Date().toISOString(),
  })
})

// Update provider status (admin operation)
app.patch('/api/current/providers/:id', (req, res) => {
  const provider = data.providers.find(p => p.id === req.params.id)
  if (!provider) {
    return res.status(404).json({ error: 'Provider not found' })
  }

  if (req.body.status) {
    provider.status = req.body.status
  }

  res.json(provider)
})

app.listen(PORT, () => {
  console.log(`✓ CURRENT backend running on port ${PORT}`)
})
