import { createClient } from 'redis';
import env from './env.js';

let redisClient = null;
let connectionAttempted = false;
let connectionFailed = false;

/**
 * Initialize Redis connection
 */
export const initRedis = async () => {
  try {
    if (!env.redis.enable) {
      console.log('[Redis] Redis is disabled in configuration');
      return null;
    }

    if (connectionAttempted && connectionFailed) {
      // Already tried and failed, don't try again
      return null;
    }

    connectionAttempted = true;

    // Check if TLS is enabled (for cloud Redis services)
    const useTLS = process.env.REDIS_TLS === 'true' || process.env.REDIS_TLS === '1';
    
    redisClient = createClient({
      socket: {
        host: env.redis.host,
        port: env.redis.port,
        reconnectStrategy: false, // Disable auto-reconnect to prevent spam
        tls: useTLS ? {
          // TLS configuration for cloud Redis
          rejectUnauthorized: false // Set to true in production with proper certificates
        } : false
      },
      password: env.redis.password || undefined,
      database: env.redis.db
    });

    // Only log errors once, suppress repeated errors
    let errorLogged = false;
    redisClient.on('error', (err) => {
      if (!errorLogged && !connectionFailed) {
        // Only log first error, then suppress
        if (err.code === 'ECONNREFUSED') {
          console.log('[Redis] Redis server not available, continuing without cache');
          connectionFailed = true;
        } else {
          console.error('[Redis] Client Error:', err.message);
        }
        errorLogged = true;
      }
    });

    redisClient.on('connect', () => {
      if (!connectionFailed) {
        console.log('[Redis] Connecting to Redis...');
      }
    });

    redisClient.on('ready', () => {
      console.log(`[Redis] Connected to Redis at ${env.redis.host}:${env.redis.port}`);
      connectionFailed = false;
    });

    redisClient.on('end', () => {
      // Silent - connection ended
    });

    // Try to connect with timeout
    try {
      await Promise.race([
        redisClient.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 3000)
        )
      ]);
      return redisClient;
    } catch (connectError) {
      connectionFailed = true;
      if (connectError.code === 'ECONNREFUSED' || connectError.message === 'Connection timeout') {
        console.log('[Redis] Redis server not available, continuing without cache');
      } else {
        console.error('[Redis] Connection error:', connectError.message);
      }
      // Clean up failed client
      try {
        if (redisClient) {
          await redisClient.quit().catch(() => {});
        }
      } catch (e) {
        // Ignore cleanup errors
      }
      redisClient = null;
      return null;
    }
  } catch (error) {
    connectionFailed = true;
    if (error.code === 'ECONNREFUSED') {
      console.log('[Redis] Redis server not available, continuing without cache');
    } else {
      console.error('[Redis] Connection failed:', error.message);
    }
    redisClient = null;
    return null;
  }
};

/**
 * Get Redis client instance
 */
export const getRedisClient = () => {
  return redisClient;
};

/**
 * Check if Redis is available
 */
export const isRedisAvailable = () => {
  try {
    // Don't try to use Redis if connection already failed
    if (connectionFailed) {
      return false;
    }
    return redisClient !== null && redisClient.isReady;
  } catch (error) {
    return false;
  }
};

/**
 * Close Redis connection
 */
export const closeRedis = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('[Redis] Connection closed');
    } catch (error) {
      console.error('[Redis] Error closing connection:', error);
    }
    redisClient = null;
  }
};

export default redisClient;

