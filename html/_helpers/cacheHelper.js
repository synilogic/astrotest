import { getRedisClient, isRedisAvailable } from '../_config/redis.js';

/**
 * Generate cache key from prefix and params
 */
const generateCacheKey = (prefix, params = {}) => {
  const paramString = Object.keys(params)
    .sort()
    .map(key => `${key}:${JSON.stringify(params[key])}`)
    .join('|');
  return `cache:${prefix}:${paramString}`;
};

/**
 * Get data from cache
 * @param {string} prefix - Cache key prefix
 * @param {object} params - Parameters to generate unique key
 * @returns {Promise<object|null>} Cached data or null
 */
export const getFromCache = async (prefix, params = {}) => {
  try {
    if (!isRedisAvailable()) {
      // Only log once per prefix to avoid spam
      if (!getFromCache._loggedMissingRedis || !getFromCache._loggedMissingRedis[prefix]) {
        if (!getFromCache._loggedMissingRedis) getFromCache._loggedMissingRedis = {};
        getFromCache._loggedMissingRedis[prefix] = true;
        console.log(`[Cache] ⚠️ Redis not available - cache disabled for ${prefix}`);
      }
      return null;
    }

    const redisClient = getRedisClient();
    if (!redisClient) {
      if (!getFromCache._loggedNullClient || !getFromCache._loggedNullClient[prefix]) {
        if (!getFromCache._loggedNullClient) getFromCache._loggedNullClient = {};
        getFromCache._loggedNullClient[prefix] = true;
        console.log(`[Cache] ⚠️ Redis client is null - cache disabled for ${prefix}`);
      }
      return null;
    }

    const cacheKey = generateCacheKey(prefix, params);
    const cachedData = await redisClient.get(cacheKey);
    
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    
    return null;
  } catch (error) {
    // Log error details for debugging (only first time per prefix)
    if (!getFromCache._errorLogged || !getFromCache._errorLogged[prefix]) {
      if (!getFromCache._errorLogged) getFromCache._errorLogged = {};
      getFromCache._errorLogged[prefix] = true;
      console.error(`[Cache] Error getting from cache (${prefix}):`, error.message);
      if (error.code) {
        console.error(`[Cache] Error code: ${error.code}`);
      }
    }
    return null;
  }
};

/**
 * Set data in cache
 * @param {string} prefix - Cache key prefix
 * @param {object} params - Parameters to generate unique key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @returns {Promise<boolean>} Success status
 */
export const setToCache = async (prefix, params = {}, data, ttl = 300) => {
  try {
    if (!isRedisAvailable()) {
      // Only log once per prefix to avoid spam
      if (!setToCache._loggedMissingRedis || !setToCache._loggedMissingRedis[prefix]) {
        if (!setToCache._loggedMissingRedis) setToCache._loggedMissingRedis = {};
        setToCache._loggedMissingRedis[prefix] = true;
        console.log(`[Cache] ⚠️ Redis not available - cannot cache ${prefix}`);
      }
      return false;
    }

    const redisClient = getRedisClient();
    if (!redisClient) {
      if (!setToCache._loggedNullClient || !setToCache._loggedNullClient[prefix]) {
        if (!setToCache._loggedNullClient) setToCache._loggedNullClient = {};
        setToCache._loggedNullClient[prefix] = true;
        console.log(`[Cache] ⚠️ Redis client is null - cannot cache ${prefix}`);
      }
      return false;
    }

    const cacheKey = generateCacheKey(prefix, params);
    const serializedData = JSON.stringify(data);
    
    await redisClient.setEx(cacheKey, ttl, serializedData);
    return true;
  } catch (error) {
    // Log error details for debugging (only first time per prefix)
    if (!setToCache._errorLogged || !setToCache._errorLogged[prefix]) {
      if (!setToCache._errorLogged) setToCache._errorLogged = {};
      setToCache._errorLogged[prefix] = true;
      console.error(`[Cache] Error setting cache (${prefix}):`, error.message);
      if (error.code) {
        console.error(`[Cache] Error code: ${error.code}`);
      }
    }
    return false;
  }
};

/**
 * Delete cache by prefix and params
 * @param {string} prefix - Cache key prefix
 * @param {object} params - Parameters to generate unique key
 * @returns {Promise<boolean>} Success status
 */
export const deleteFromCache = async (prefix, params = {}) => {
  try {
    if (!isRedisAvailable()) {
      return false;
    }

    const redisClient = getRedisClient();
    const cacheKey = generateCacheKey(prefix, params);
    await redisClient.del(cacheKey);
    return true;
  } catch (error) {
    console.error(`[Cache] Error deleting cache (${prefix}):`, error.message);
    return false;
  }
};

/**
 * Delete all cache entries with a specific prefix
 * @param {string} prefix - Cache key prefix
 * @returns {Promise<number>} Number of keys deleted
 */
export const deleteCacheByPrefix = async (prefix) => {
  try {
    if (!isRedisAvailable()) {
      return 0;
    }

    const redisClient = getRedisClient();
    const pattern = `cache:${prefix}:*`;
    const keys = await redisClient.keys(pattern);
    
    if (keys.length > 0) {
      await redisClient.del(keys);
      return keys.length;
    }
    
    return 0;
  } catch (error) {
    console.error(`[Cache] Error deleting cache by prefix (${prefix}):`, error.message);
    return 0;
  }
};

/**
 * Cache middleware wrapper for async functions
 * @param {Function} fn - Async function to cache
 * @param {string} prefix - Cache key prefix
 * @param {number} ttl - Time to live in seconds
 * @param {Function} keyGenerator - Optional function to generate cache key from function args
 * @returns {Function} Cached function
 */
export const withCache = (fn, prefix, ttl = 300, keyGenerator = null) => {
  return async (...args) => {
    try {
      // Generate cache key
      const params = keyGenerator ? keyGenerator(...args) : { args: JSON.stringify(args) };
      
      // Try to get from cache
      const cached = await getFromCache(prefix, params);
      if (cached !== null) {
        return cached;
      }

      // Execute function and cache result
      const result = await fn(...args);
      await setToCache(prefix, params, result, ttl);
      
      return result;
    } catch (error) {
      // If cache fails, still execute the function
      console.error(`[Cache] Error in withCache (${prefix}):`, error.message);
      return await fn(...args);
    }
  };
};

/**
 * Cache TTL constants (in seconds)
 */
export const CACHE_TTL = {
  SHORT: 60,        // 1 minute
  MEDIUM: 300,     // 5 minutes
  LONG: 1800,      // 30 minutes
  VERY_LONG: 3600, // 1 hour
  DAY: 86400       // 24 hours
};

