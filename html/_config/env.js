
import dotenv from 'dotenv';


dotenv.config();


export default{
    ports:{
        users: process.env.USERS_PORT || 8000,
        banners:process.env.BANNER_PORT || 8001,
        astrologers:process.env.ASTROLOGERS_PORT || 8002,
        vendors:process.env.VENDORS_PORT || 8003,
        wallets: process.env.PORT || 8004,
        welcome:process.env.WELCOME_PORT || 8005,
        communication:process.env.communication_PORT || 8006,
        product:process.env.PRODUCTS_PORT || 8007,
      
    },
    origin: process.env.ORIGIN || process.env.CORS_ORIGIN || '*',
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || '',
        db: process.env.REDIS_DB || 0,
        enable: process.env.REDIS_ENABLE !== 'false', // Default to enabled
        tls: process.env.REDIS_TLS === 'true' || process.env.REDIS_TLS === '1' // TLS support for cloud Redis
    },
    database: {
        pool: {
            max: process.env.DB_POOL_MAX || 20,
            min: process.env.DB_POOL_MIN || 5,
            acquire: process.env.DB_POOL_ACQUIRE || 60000,
            idle: process.env.DB_POOL_IDLE || 10000,
            evict: process.env.DB_POOL_EVICT || 1000
        }
    }
};

