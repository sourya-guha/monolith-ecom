require('dotenv').config();
console.log('ENV:', process.env.MONGO_URI);
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Ecommerce API is running' });
});
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/user', require('./routes/user.routes'));
app.use('/api/seller', require('./routes/seller.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

app.listen(5000, () => console.log('Server running on port 5000'));