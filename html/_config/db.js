import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
dotenv.config();
let db;

const connectDB = async () => {
  try {
    db = new Sequelize(process.env.DB_NAME || 'astroNew', process.env.DB_USER || 'root', 'Techdev@#0789', {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'mysql',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
    console.log('Connected to the MySQL database.');
  } catch (err) {
    console.error('Error connecting to the database:', err.message);
    process.exit(1);
  }
};

await connectDB();

export default db;