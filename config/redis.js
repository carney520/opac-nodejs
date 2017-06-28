var Redis = require('ioredis'),
  credentials = require('./credentials'),
  env = process.env.NODE_ENV || 'development',
  options = credentials.redis[env]

var client = new Redis(options)

module.exports = client
