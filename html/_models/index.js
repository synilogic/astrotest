// index.js
import sequelize from '../_config/db.js';
import './users.js';
import './customers.js';
import { initModels  } from './init-models.js';
initModels(); // Set up associations
sequelize.authenticate().then(() => {
  console.log("Connected to the MySQL database.");
}).catch(err => {
  console.error("Database connection failed:", err);
});
