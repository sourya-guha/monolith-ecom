const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const client = createClient({
  url: redisUrl,
  socket: {
    tls: redisUrl.startsWith('rediss://'),
    rejectUnauthorized: false, // Required for some hosted Redis services like Upstash if they use self-signed certs
  },
});

client.on('error', (err) => {
  console.error('[redis] Connection error:', err.message);
});

client.on('connect', () => {
  console.log('[redis] Connected to Redis');
});

client.on('ready', () => {
  console.log('[redis] Redis client ready');
});

async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
}

module.exports = { redisClient: client, connectRedis };
