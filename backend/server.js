require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const { verifySmtpConnection } = require('./utils/email');

connectDB();
connectRedis().catch((err) => {
  console.error('Redis connection failed:', err.message);
});

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

app.use(limiter);

app.get('/', (req, res) => {
  res.json({ message: 'Ecommerce API is running' });
});
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/user', require('./routes/user.routes'));
app.use('/api/seller', require('./routes/seller.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('[error]', err.stack || err.message || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

verifySmtpConnection();

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));