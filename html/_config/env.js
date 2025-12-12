
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
      
    }
};

