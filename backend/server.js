require('dotenv').config();
const app = require('./src/app');
const { initDatabase } = require('./src/config/database');

const PORT = process.env.PORT || 5001;

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Database: cinema.sqlite`);
  });
}).catch(error => {
  console.error('Failed to start server:', error);
});