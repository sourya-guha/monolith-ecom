require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { connectRedis, redisClient } = require('./config/redis');
const { connectKafka, produceMessage, getKafkaStatus } = require('./config/kafka');
const { verifySmtpConnection } = require('./utils/email');
const { logDependencyError } = require('./utils/dependency-logger');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const ChatConversation = require('./models/ChatConversation');
const ChatMessage = require('./models/ChatMessage');
const User = require('./models/User');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: process.env.FRONTEND_URL || true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => {
  const dependencies = {
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'unavailable',
    redis: redisClient.isReady ? 'connected' : 'unavailable',
    kafka: getKafkaStatus(),
  };
  const databaseReady = dependencies.mongodb === 'connected';
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady && dependencies.redis === 'connected' && dependencies.kafka === 'connected'
      ? 'ok'
      : 'degraded',
    dependencies,
  });
});

app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState === 1) return next();
  console.error(JSON.stringify({
    level: 'error',
    dependency: 'mongodb',
    operation: 'request',
    method: req.method,
    path: req.originalUrl,
    readyState: mongoose.connection.readyState,
    message: 'Rejected database-backed request because MongoDB is not connected',
  }));
  return res.status(503).json({
    success: false,
    message: 'Database is temporarily unavailable. Please try again later.',
  });
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

if (process.env.DISABLE_LIMITER !== 'true') {
  app.use(limiter);
}

app.get('/', (req, res) => {
  res.json({ message: 'Ecommerce API is running' });
});
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/user', require('./routes/user.routes'));
app.use('/api/seller', require('./routes/seller.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/chat', require('./routes/chat.routes'));

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  logDependencyError('http', 'request', err, {
    method: req.method,
    path: req.originalUrl,
    status,
  });
  res.status(status).json({
    success: false,
    message: status < 500 ? err.message : 'Internal server error',
  });
});

const io = new Server(server, {
  cors: corsOptions,
});

io.use((socket, next) => {
  try {
    const raw = socket.handshake.auth?.token || socket.handshake.headers?.authorization || '';
    const token = String(raw).replace('Bearer ', '').trim();
    if (!token) return next(new Error('Unauthorized'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    return next();
  } catch (err) {
    return next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  const userId = String(socket.user?.id || '');
  if (userId) {
    socket.join(`user:${userId}`);
  }

  socket.on('chat:join', async ({ conversationId }) => {
    if (!conversationId) return;
    const convo = await ChatConversation.findById(conversationId).select('buyer seller');
    if (!convo) return;

    const isMember = String(convo.buyer) === userId || String(convo.seller) === userId;
    if (!isMember) return;

    socket.join(`convo:${conversationId}`);
  });

  socket.on('chat:send', async ({ conversationId, text }) => {
    try {
      const messageText = String(text || '').trim();
      if (!conversationId || !messageText) return;

      const convo = await ChatConversation.findById(conversationId);
      if (!convo) return;

      const isMember = String(convo.buyer) === userId || String(convo.seller) === userId;
      if (!isMember) return;

      const sender = await User.findById(userId).select('name email role');
      const optimisticMessage = {
        _id: new mongoose.Types.ObjectId(),
        conversation: conversationId,
        sender: sender,
        text: messageText,
        readBy: [userId],
        createdAt: new Date()
      };

      try {
        await produceMessage('chat.new_message', {
          conversationId,
          senderId: userId,
          text: messageText
        });
      } catch {
        socket.emit('chat:error', {
          message: 'Chat is temporarily unavailable. Your message was not sent.',
        });
        return;
      }

      io.to(`convo:${conversationId}`).emit('chat:message', { conversationId, message: optimisticMessage });
      if (convo.buyer) io.to(`user:${String(convo.buyer)}`).emit('chat:conversation:update', { conversationId });
      if (convo.seller) io.to(`user:${String(convo.seller)}`).emit('chat:conversation:update', { conversationId });
    } catch (err) {
      logDependencyError('chat', 'send', err, { conversationId });
      socket.emit('chat:error', {
        message: 'Chat is temporarily unavailable. Your message was not sent.',
      });
    }
  });
});

const port = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  connectRedis().catch(() => {
    console.warn('[redis] optional dependency unavailable; cache will bypass Redis');
  });

  connectKafka(async (data) => {
    const { conversationId, senderId, text } = data;
    if (!conversationId || !senderId || !text) {
      const error = new Error('Chat event is missing conversationId, senderId, or text');
      error.code = 'INVALID_CHAT_EVENT';
      throw error;
    }

    try {
      await ChatMessage.create({
        conversation: conversationId,
        sender: senderId,
        text,
        readBy: [senderId],
      });

      await ChatConversation.findByIdAndUpdate(conversationId, {
        $set: { lastMessage: text, lastMessageAt: new Date() },
      });
    } catch (error) {
      logDependencyError('mongodb', 'persist_chat_message', error, { conversationId });
      throw error;
    }
  });

  const { startCronJobs } = require('./cron/scheduler');
  startCronJobs();
  verifySmtpConnection();

  server.listen(port, () => console.log(`Server running on port ${port}`));
}

startServer().catch((error) => {
  logDependencyError('application', 'startup', error);
  process.exitCode = 1;
});