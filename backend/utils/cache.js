const { redisClient } = require('../config/redis');

let cacheFallbackLogged = false;

redisClient.on('ready', () => {
  cacheFallbackLogged = false;
});

function logCacheFallback() {
  if (cacheFallbackLogged) return;
  console.warn('[cache] Redis is unavailable; bypassing cache and using MongoDB');
  cacheFallbackLogged = true;
}

/**
 * Get data from Redis cache
 * @param {string} key 
 */
const getCache = async (key) => {
  try {
    if (!redisClient.isReady) {
      logCacheFallback();
      return null;
    }
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error(`[cache] Error getting key ${key}:`, err.message);
    logCacheFallback();
    return null;
  }
};

/**
 * Set data in Redis cache with an expiry
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttl - Time to live in seconds (default 60s)
 */
const setCache = async (key, value, ttl = 60) => {
  try {
    if (!redisClient.isReady) {
      logCacheFallback();
      return;
    }
    await redisClient.set(key, JSON.stringify(value), {
      EX: ttl,
    });
  } catch (err) {
    console.error(`[cache] Error setting key ${key}:`, err.message);
    logCacheFallback();
  }
};

/**
 * Delete keys matching a pattern
 * @param {string} pattern 
 */
const clearCachePattern = async (pattern) => {
  try {
    if (!redisClient.isReady) {
      logCacheFallback();
      return;
    }
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`[cache] Cleared ${keys.length} keys matching ${pattern}`);
    }
  } catch (err) {
    console.error(`[cache] Error clearing pattern ${pattern}:`, err.message);
    logCacheFallback();
  }
};

module.exports = { getCache, setCache, clearCachePattern };
