import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
dotenv.config();
let db;

const connectDB = async () => {
  try {
    db = new Sequelize(
      process.env.DB_NAME || 'astroNew', 
      process.env.DB_USER || 'root', 
      process.env.DB_PASSWORD || '', 
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        dialectOptions: {
          // Enable connection pooling at MySQL level
          connectTimeout: 60000,
          // Use connection pool for better performance
          multipleStatements: false,
          // Enable keep-alive
          flags: ['-FOUND_ROWS']
        },
        logging: process.env.DB_LOGGING === 'true' ? console.log : false,
        // Optimized connection pool configuration
        pool: {
          max: parseInt(process.env.DB_POOL_MAX) || 20,        // Maximum connections in pool
          min: parseInt(process.env.DB_POOL_MIN) || 5,          // Minimum connections to maintain
          acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 60000,  // Max time to wait for connection (60s)
          idle: parseInt(process.env.DB_POOL_IDLE) || 10000,   // Max time connection can be idle (10s)
          evict: parseInt(process.env.DB_POOL_EVICT) || 1000, // Check for idle connections every 1s
          handleDisconnects: true                               // Automatically reconnect on disconnect
        },
        // Retry configuration
        retry: {
          max: 3,                                               // Max retry attempts
          match: [
            /ETIMEDOUT/,
            /EHOSTUNREACH/,
            /ECONNRESET/,
            /ECONNREFUSED/,
            /ETIMEDOUT/,
            /ESOCKETTIMEDOUT/,
            /EHOSTUNREACH/,
            /EPIPE/,
            /EAI_AGAIN/,
            /SequelizeConnectionError/,
            /SequelizeConnectionRefusedError/,
            /SequelizeHostNotFoundError/,
            /SequelizeHostNotReachableError/,
            /SequelizeInvalidConnectionError/,
            /SequelizeConnectionTimedOutError/
          ]
        },
        // Transaction isolation level
        transactionType: 'IMMEDIATE',
        // Query timeout
        query: {
          timeout: 30000                                        // 30 seconds query timeout
        },
        // Timezone
        timezone: '+05:30'                                      // IST timezone
      }
    );

    // Test the connection
    await db.authenticate();
    console.log('✅ Connected to MySQL database with connection pool');
    console.log(`   Pool config: max=${db.config.pool.max}, min=${db.config.pool.min}, acquire=${db.config.pool.acquire}ms, idle=${db.config.pool.idle}ms`);
    
    // Monitor pool status (optional - can be disabled in production)
    if (process.env.DB_POOL_MONITOR === 'true') {
      setInterval(async () => {
        try {
          // Get pool stats from Sequelize
          const pool = db.connectionManager.pool;
          if (pool && typeof pool.size === 'function') {
            const size = pool.size();
            const available = pool.available();
            const using = size - available;
            console.log(`[DB Pool] Total: ${size}, In Use: ${using}, Available: ${available}`);
          }
        } catch (err) {
          // Silently ignore pool monitoring errors
        }
      }, 60000); // Log every minute
    }
    
  } catch (err) {
    console.error('❌ Error connecting to the database:', err.message);
    process.exit(1);
  }
};

await connectDB();

export default db;