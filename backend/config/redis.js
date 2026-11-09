const { createClient } = require('redis');
const { logDependencyError } = require('../utils/dependency-logger');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redisHost = (() => {
  try {
    return new URL(redisUrl).host;
  } catch {
    return 'invalid REDIS_URL';
  }
})();

const client = createClient({
  url: redisUrl,
  socket: {
    tls: redisUrl.startsWith('rediss://'),
    rejectUnauthorized: false, // Required for some hosted Redis services like Upstash if they use self-signed certs
  },
});

let lastErrorLoggedAt = 0;
let suppressedErrorCount = 0;

client.on('error', (err) => {
  const now = Date.now();
  if (now - lastErrorLoggedAt >= 30000) {
    logDependencyError('redis', 'connection', err, {
      host: redisHost,
      suppressedErrors: suppressedErrorCount,
    });
    lastErrorLoggedAt = now;
    suppressedErrorCount = 0;
  } else {
    suppressedErrorCount += 1;
  }
});

client.on('connect', () => {
  console.info(`[redis] connection established (host: ${redisHost})`);
});

client.on('ready', () => {
  console.info(`[redis] client ready (host: ${redisHost})`);
  lastErrorLoggedAt = 0;
  suppressedErrorCount = 0;
});

client.on('reconnecting', () => {
  console.warn(`[redis] reconnecting (host: ${redisHost}); cache requests will bypass Redis`);
});

async function connectRedis() {
  if (!client.isOpen) {
    try {
      await client.connect();
    } catch (error) {
      logDependencyError('redis', 'startup', error, { host: redisHost });
      throw error;
    }
  }
  return client;
}

module.exports = { redisClient: client, connectRedis };
